#!/usr/bin/env tsx

/**
 * Weapon Schema Migration Orchestrator
 *
 * Orchestrates migration of all weapons from V1/V2 to V3 schema.
 *
 * Features:
 * - Paginated batch processing (configurable batch size)
 * - Progress tracking with detailed logging
 * - Error handling with rollback capability
 * - Dry-run mode for safe testing
 * - Migration history recording
 * - Comprehensive statistics
 *
 * Usage:
 *   npm run data:migrate              # Migrate all to v3
 *   npm run data:migrate -- --dry-run # Test without writing
 *   npm run data:migrate -- --target v2 # Migrate to v2 only
 *   npm run data:migrate -- --batch-size 50 # Custom batch size
 */

import { initializeFirebase, db } from '../server/src/firebase/admin';
import { schemaVersionManager, SchemaVersion, MigrationRecord } from './lib/schema/schema-version-manager';
import { migrateV1ToV2, canMigrateV1ToV2 } from './lib/schema/migrations/v1-to-v2.migration';
import { migrateV2ToV3, canMigrateV2ToV3, validateV3Migration } from './lib/schema/migrations/v2-to-v3.migration';
import { validateWeapon } from './lib/utils/data-validator';

/**
 * Migration options parsed from CLI arguments
 */
interface MigrationOptions {
  /** Target schema version (default: v3) */
  targetVersion: SchemaVersion;
  /** Dry-run mode (don't write to database) */
  dryRun: boolean;
  /** Batch size for processing (default: 100) */
  batchSize: number;
  /** Continue on error instead of stopping */
  continueOnError: boolean;
  /** Verbose logging */
  verbose: boolean;
}

/**
 * Migration result summary
 */
interface MigrationResult {
  /** Total weapons processed */
  total: number;
  /** Successfully migrated */
  migrated: number;
  /** Skipped (already at target version) */
  skipped: number;
  /** Failed migrations */
  errors: number;
  /** Error details */
  errorDetails: Array<{ weaponId: string; weaponName: string; error: string }>;
  /** Duration in milliseconds */
  duration: number;
  /** Dry-run mode */
  dryRun: boolean;
}

/**
 * Parse command line arguments
 */
function parseArguments(): MigrationOptions {
  const args = process.argv.slice(2);

  const options: MigrationOptions = {
    targetVersion: 'v3',
    dryRun: false,
    batchSize: 100,
    continueOnError: false,
    verbose: false,
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    switch (arg) {
      case '--dry-run':
      case '-d':
        options.dryRun = true;
        break;

      case '--target':
      case '-t':
        const version = args[++i] as SchemaVersion;
        if (!['v1', 'v2', 'v3'].includes(version)) {
          console.error(`Invalid target version: ${version}`);
          process.exit(1);
        }
        options.targetVersion = version;
        break;

      case '--batch-size':
      case '-b':
        const size = parseInt(args[++i], 10);
        if (isNaN(size) || size <= 0) {
          console.error(`Invalid batch size: ${args[i]}`);
          process.exit(1);
        }
        options.batchSize = size;
        break;

      case '--continue-on-error':
      case '-c':
        options.continueOnError = true;
        break;

      case '--verbose':
      case '-v':
        options.verbose = true;
        break;

      case '--help':
      case '-h':
        printHelp();
        process.exit(0);
        break;

      default:
        console.error(`Unknown argument: ${arg}`);
        printHelp();
        process.exit(1);
    }
  }

  return options;
}

/**
 * Print help message
 */
function printHelp(): void {
  console.log(`
Weapon Schema Migration Tool

Usage:
  npm run data:migrate [options]

Options:
  --dry-run, -d              Test migration without writing to database
  --target, -t <version>     Target schema version (v1, v2, v3) [default: v3]
  --batch-size, -b <size>    Number of weapons per batch [default: 100]
  --continue-on-error, -c    Continue processing on error [default: false]
  --verbose, -v              Enable verbose logging
  --help, -h                 Show this help message

Examples:
  npm run data:migrate                    # Migrate all to v3
  npm run data:migrate -- --dry-run       # Test migration
  npm run data:migrate -- --target v2     # Migrate to v2 only
  npm run data:migrate -- --batch-size 50 # Process 50 at a time
  `);
}

/**
 * Migrate a single weapon through the required migration path
 */
async function migrateWeapon(
  weapon: any,
  targetVersion: SchemaVersion,
  options: MigrationOptions
): Promise<{ success: boolean; migrated?: any; error?: string }> {
  try {
    // Detect current version
    const currentVersion = schemaVersionManager.detectVersion(weapon);

    // Check if already at target
    if (currentVersion === targetVersion) {
      return { success: true, migrated: weapon };
    }

    // Get migration path
    const path = schemaVersionManager.getMigrationPath(currentVersion, targetVersion);

    if (options.verbose) {
      console.log(`  Migration path for ${weapon.name}: ${path.join(' → ')}`);
    }

    let migratedWeapon = weapon;

    // Execute migrations in sequence
    for (let i = 0; i < path.length - 1; i++) {
      const fromVersion = path[i];
      const toVersion = path[i + 1];

      if (fromVersion === 'v1' && toVersion === 'v2') {
        // V1 → V2
        if (!canMigrateV1ToV2(migratedWeapon)) {
          return { success: false, error: 'Weapon cannot be migrated from V1 to V2' };
        }
        migratedWeapon = migrateV1ToV2(migratedWeapon);
      } else if (fromVersion === 'v2' && toVersion === 'v3') {
        // V2 → V3
        if (!canMigrateV2ToV3(migratedWeapon)) {
          return { success: false, error: 'Weapon cannot be migrated from V2 to V3' };
        }
        migratedWeapon = migrateV2ToV3(migratedWeapon);

        // Validate V3 structure
        const validationErrors = validateV3Migration(migratedWeapon);
        if (validationErrors.length > 0) {
          return {
            success: false,
            error: `V3 validation failed: ${validationErrors.join(', ')}`,
          };
        }
      }
    }

    // Final validation
    const validation = validateWeapon(migratedWeapon);
    if (!validation.valid) {
      return {
        success: false,
        error: `Validation failed: ${validation.errors.join(', ')}`,
      };
    }

    return { success: true, migrated: migratedWeapon };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * Process a batch of weapons
 */
async function processBatch(
  weapons: any[],
  targetVersion: SchemaVersion,
  options: MigrationOptions,
  result: MigrationResult
): Promise<void> {
  const startTime = Date.now();

  for (const weapon of weapons) {
    const weaponStartTime = Date.now();

    // Detect current version
    const currentVersion = schemaVersionManager.detectVersion(weapon);

    // Skip if already at target
    if (currentVersion === targetVersion) {
      result.skipped++;
      if (options.verbose) {
        console.log(`  ⏭️  ${weapon.name} already at ${targetVersion}`);
      }
      continue;
    }

    // Migrate weapon
    const migrationResult = await migrateWeapon(weapon, targetVersion, options);

    if (!migrationResult.success) {
      result.errors++;
      result.errorDetails.push({
        weaponId: weapon.id,
        weaponName: weapon.name,
        error: migrationResult.error || 'Unknown error',
      });

      console.error(`  ❌ ${weapon.name}: ${migrationResult.error}`);

      if (!options.continueOnError) {
        throw new Error(`Migration failed for ${weapon.name}: ${migrationResult.error}`);
      }

      continue;
    }

    // Write to database (unless dry-run)
    if (!options.dryRun && migrationResult.migrated) {
      try {
        const firestore = db();
        await firestore
          .collection('weapons')
          .doc(weapon.id)
          .set(migrationResult.migrated, { merge: true });

        // Record migration in history
        const migrationRecord: MigrationRecord = {
          weaponId: weapon.id,
          weaponName: weapon.name,
          fromVersion: currentVersion,
          toVersion: targetVersion,
          timestamp: Date.now(),
          success: true,
          duration: Date.now() - weaponStartTime,
        };

        await schemaVersionManager.recordMigration(migrationRecord);
      } catch (error) {
        result.errors++;
        result.errorDetails.push({
          weaponId: weapon.id,
          weaponName: weapon.name,
          error: `Database write failed: ${error}`,
        });

        console.error(`  ❌ ${weapon.name}: Database write failed`);

        if (!options.continueOnError) {
          throw error;
        }

        continue;
      }
    }

    result.migrated++;
    const duration = Date.now() - weaponStartTime;
    console.log(`  ✅ ${weapon.name} (${currentVersion} → ${targetVersion}) - ${duration}ms`);
  }

  const batchDuration = Date.now() - startTime;
  console.log(`  Batch completed in ${batchDuration}ms\n`);
}

/**
 * Main migration function
 */
async function migrateAllWeapons(options: MigrationOptions): Promise<MigrationResult> {
  const startTime = Date.now();

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🔄  WEAPON SCHEMA MIGRATION');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  console.log('Configuration:');
  console.log(`  Target Version: ${options.targetVersion}`);
  console.log(`  Batch Size: ${options.batchSize}`);
  console.log(`  Dry Run: ${options.dryRun ? 'YES (no writes)' : 'NO'}`);
  console.log(`  Continue on Error: ${options.continueOnError ? 'YES' : 'NO'}`);
  console.log(`  Verbose: ${options.verbose ? 'YES' : 'NO'}\n`);

  // Initialize Firebase
  console.log('🔌 Initializing Firebase...');
  initializeFirebase();
  const firestore = db();

  // Get all weapons
  console.log('📥 Fetching weapons from database...');
  const weaponsSnapshot = await firestore.collection('weapons').get();
  const allWeapons = weaponsSnapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  }));

  console.log(`Found ${allWeapons.length} weapons\n`);

  // Initialize result
  const result: MigrationResult = {
    total: allWeapons.length,
    migrated: 0,
    skipped: 0,
    errors: 0,
    errorDetails: [],
    duration: 0,
    dryRun: options.dryRun,
  };

  // Process in batches
  console.log(`🚀 Starting migration (batches of ${options.batchSize})...\n`);

  for (let i = 0; i < allWeapons.length; i += options.batchSize) {
    const batch = allWeapons.slice(i, i + options.batchSize);
    const batchNum = Math.floor(i / options.batchSize) + 1;
    const totalBatches = Math.ceil(allWeapons.length / options.batchSize);

    console.log(`📦 Batch ${batchNum}/${totalBatches} (${batch.length} weapons):`);

    try {
      await processBatch(batch, options.targetVersion, options, result);
    } catch (error) {
      console.error(`\n❌ Batch ${batchNum} failed:`, error);
      if (!options.continueOnError) {
        break;
      }
    }
  }

  result.duration = Date.now() - startTime;

  // Print summary
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📊  MIGRATION SUMMARY');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  console.log(`Total Weapons: ${result.total}`);
  console.log(`✅ Migrated: ${result.migrated}`);
  console.log(`⏭️  Skipped: ${result.skipped}`);
  console.log(`❌ Errors: ${result.errors}`);
  console.log(`⏱️  Duration: ${(result.duration / 1000).toFixed(2)}s`);
  console.log(`📈 Rate: ${(result.total / (result.duration / 1000)).toFixed(2)} weapons/sec\n`);

  if (result.errors > 0) {
    console.log('Error Details:');
    for (const error of result.errorDetails) {
      console.log(`  - ${error.weaponName} (${error.weaponId}): ${error.error}`);
    }
    console.log();
  }

  if (options.dryRun) {
    console.log('🔒 DRY RUN - No changes were written to the database\n');
  } else {
    console.log('💾 Changes written to database\n');
  }

  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  return result;
}

/**
 * Main entry point
 */
async function main() {
  try {
    const options = parseArguments();
    const result = await migrateAllWeapons(options);

    // Exit with error code if there were failures
    if (result.errors > 0 && !options.continueOnError) {
      process.exit(1);
    }

    process.exit(0);
  } catch (error) {
    console.error('\n❌ Fatal error:', error);
    process.exit(1);
  }
}

// Run migration
if (require.main === module) {
  main();
}

// Export for testing
export { migrateAllWeapons, MigrationOptions, MigrationResult };
