#!/usr/bin/env tsx

/**
 * Initial Data Population Script
 *
 * Populates Firestore with weapon and attachment data from multiple sources.
 *
 * Features:
 * - Single-source mode: Fetches from CODArmory only (default)
 * - Multi-source mode: Fetches from CODArmory, WZStats, and CODMunity
 * - Schema merging with conflict resolution
 * - Confidence scoring and lineage tracking
 * - Backward compatible with V1 schema
 *
 * Environment Variables:
 * - USE_MULTI_SOURCE=true         Enable multi-source merging
 * - CONFIDENCE_THRESHOLD=0.3      Minimum confidence to include source (0-1)
 * - REQUIRE_CODARMORY=true        Require CODArmory as primary source
 * - SKIP_STALE_SOURCES=true       Skip sources older than 30 days
 *
 * Usage:
 *   npm run data:init                    # Single-source mode
 *   USE_MULTI_SOURCE=true npm run data:init  # Multi-source mode
 */

import 'dotenv/config';
import { createHash } from 'crypto';
import { initializeFirebase, db } from '../server/src/firebase/admin';
import { fetchAllCODArmoryData, testCODArmoryConnection } from './lib/scrapers/codarmory-fetcher';
import { fetchWZStatsMetaData } from './lib/scrapers/wzstats-scraper';
import { fetchAllCODMunityStats } from './lib/scrapers/codmunity-scraper';
import {
  transformCODArmoryWeapon,
  transformCODArmoryAttachment,
} from './lib/transformers/codarmory-transformer';
import { cache } from './lib/utils/cache';
import { validateWeapon, validateAttachment, sanitizeWeaponName, normalizeGameName } from './lib/utils/data-validator';
import { schemaMerger, extractWeaponId } from './lib/schema/schema-merger';
import type { SourcedWeaponData } from './lib/schema/schema-merger';
import { DataSource } from './lib/lineage/lineage-schema';
import type { UnifiedWeapon } from '../server/src/models/unified-weapon.model';

// ============================================================================
// Configuration
// ============================================================================

/**
 * Enable multi-source mode for merging data from all sources
 * Set USE_MULTI_SOURCE=true in .env to enable
 */
const USE_MULTI_SOURCE = process.env.USE_MULTI_SOURCE === 'true';

/**
 * Minimum confidence threshold for including a source
 */
const CONFIDENCE_THRESHOLD = parseFloat(process.env.CONFIDENCE_THRESHOLD || '0.3');

/**
 * Require CODArmory as primary source
 */
const REQUIRE_CODARMORY = process.env.REQUIRE_CODARMORY !== 'false';

/**
 * Skip sources with data older than 30 days
 */
const SKIP_STALE_SOURCES = process.env.SKIP_STALE_SOURCES === 'true';

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Generate deterministic ID from weapon name and game
 * This ensures we can upsert instead of creating duplicates
 */
function generateWeaponId(name: string, game: string): string {
  return createHash('md5')
    .update(`${name.toLowerCase()}-${game.toLowerCase()}`)
    .digest('hex');
}

/**
 * Generate deterministic ID from attachment name and slot
 */
function generateAttachmentId(name: string, slot: string): string {
  return createHash('md5')
    .update(`${name.toLowerCase()}-${slot.toLowerCase()}`)
    .digest('hex');
}

/**
 * Populate weapons using multi-source data merging
 */
async function populateWeaponsMultiSource() {
  console.log('🔫 Populating weapons from multiple sources...');

  // Fetch from all sources with error handling
  const [codarmoryResult, wzstatsResult, codmunityResult] = await Promise.allSettled([
    fetchAllCODArmoryData(),
    fetchWZStatsMetaData(),
    fetchAllCODMunityStats(),
  ]);

  // Log source availability
  console.log('\n📊 Data Source Availability:');
  let codarmoryWeapons: any[] = [];
  let wzstatsWeapons: any[] = [];
  let codmunityWeapons: any[] = [];

  if (codarmoryResult.status === 'fulfilled') {
    codarmoryWeapons = codarmoryResult.value.weapons || [];
    console.log(`   ✅ CODArmory: ${codarmoryWeapons.length} weapons`);
  } else {
    console.warn(`   ⚠️  CODArmory failed: ${codarmoryResult.reason}`);
    if (REQUIRE_CODARMORY) {
      throw new Error('CODArmory is required but unavailable');
    }
  }

  if (wzstatsResult.status === 'fulfilled') {
    wzstatsWeapons = wzstatsResult.value || [];
    console.log(`   ✅ WZStats: ${wzstatsWeapons.length} weapons`);
  } else {
    console.warn(`   ⚠️  WZStats failed: ${wzstatsResult.reason}`);
  }

  if (codmunityResult.status === 'fulfilled') {
    codmunityWeapons = codmunityResult.value || [];
    console.log(`   ✅ CODMunity: ${codmunityWeapons.length} weapons`);
  } else {
    console.warn(`   ⚠️  CODMunity failed: ${codmunityResult.reason}`);
  }

  // Transform weapons to common format with source attribution
  const now = Date.now();
  const sourcedWeapons: SourcedWeaponData[] = [];

  // Add CODArmory weapons
  for (const weaponData of codarmoryWeapons) {
    try {
      const weapon = transformCODArmoryWeapon(weaponData);
      weapon.name = sanitizeWeaponName(weapon.name);
      weapon.game = normalizeGameName(weapon.game) as 'MW3' | 'Warzone' | 'BO6' | 'MW2';

      sourcedWeapons.push({
        source: DataSource.CODARMORY,
        data: weapon,
        timestamp: now,
        reference: 'https://github.com/tzurbaev/codarmory.com',
      });
    } catch (error) {
      console.error(`   ⚠️  Failed to transform CODArmory weapon:`, error);
    }
  }

  // Add WZStats weapons
  for (const wzWeapon of wzstatsWeapons) {
    try {
      const weapon = {
        name: sanitizeWeaponName(wzWeapon.name),
        game: normalizeGameName(wzWeapon.game || 'Warzone') as 'MW3' | 'Warzone' | 'BO6' | 'MW2',
        category: 'AR' as const, // Default, will be corrected during merge
        stats: {},
        meta: {
          tier: wzWeapon.tier,
          popularity: wzWeapon.usage,
          winRate: wzWeapon.winRate,
        },
        ballistics: {},
      };

      sourcedWeapons.push({
        source: DataSource.WZSTATS,
        data: weapon,
        timestamp: now,
        reference: 'https://wzstats.gg',
      });
    } catch (error) {
      console.error(`   ⚠️  Failed to transform WZStats weapon:`, error);
    }
  }

  // Add CODMunity weapons
  for (const codWeapon of codmunityWeapons) {
    try {
      const weapon = {
        name: sanitizeWeaponName(codWeapon.name),
        game: normalizeGameName(codWeapon.game || 'Warzone') as 'MW3' | 'Warzone' | 'BO6' | 'MW2',
        category: 'AR' as const, // Default, will be corrected during merge
        stats: {},
        meta: {},
        ballistics: {
          ttk: codWeapon.ttk,
          damageRanges: codWeapon.damageRanges,
          fireRate: codWeapon.fireRate,
          bulletVelocity: codWeapon.bulletVelocity,
          magazineSize: codWeapon.magazineSize,
          reloadTime: codWeapon.reloadTime,
          adsTime: codWeapon.adsTime,
          recoilPattern: codWeapon.recoilPattern,
        },
      };

      sourcedWeapons.push({
        source: DataSource.CODMUNITY,
        data: weapon,
        timestamp: now,
        reference: 'https://codmunity.gg',
      });
    } catch (error) {
      console.error(`   ⚠️  Failed to transform CODMunity weapon:`, error);
    }
  }

  console.log(`\n📦 Total sourced weapons: ${sourcedWeapons.length}`);

  // Group weapons by canonical ID
  const weaponGroups = new Map<string, SourcedWeaponData[]>();

  for (const sourcedWeapon of sourcedWeapons) {
    const weaponId = generateWeaponId(sourcedWeapon.data.name, sourcedWeapon.data.game);

    if (!weaponGroups.has(weaponId)) {
      weaponGroups.set(weaponId, []);
    }

    weaponGroups.get(weaponId)!.push(sourcedWeapon);
  }

  console.log(`\n🔗 Grouped into ${weaponGroups.size} unique weapons`);

  // Merge and upsert weapons
  let successCount = 0;
  let updateCount = 0;
  let errorCount = 0;
  let skippedCount = 0;
  let multiSourceCount = 0;
  let conflictCount = 0;
  let totalConfidence = 0;
  let totalSources = 0;

  for (const [weaponId, sources] of Array.from(weaponGroups.entries())) {
    try {
      // Skip if no sources
      if (sources.length === 0) {
        skippedCount++;
        continue;
      }

      // Track multi-source weapons
      if (sources.length > 1) {
        multiSourceCount++;
      }

      // Merge weapons from multiple sources
      const mergeResult = schemaMerger.mergeWeapons(weaponId, sources);

      // Validate merged weapon
      const validationErrors = mergeResult.errors;
      if (validationErrors.length > 0) {
        console.error(`  ⚠️  Skipping ${mergeResult.weapon.name}: ${validationErrors.join(', ')}`);
        skippedCount++;
        continue;
      }

      // Update statistics
      conflictCount += mergeResult.stats.conflictsDetected;
      totalConfidence += mergeResult.stats.averageConfidence;
      totalSources += mergeResult.stats.sourcesProcessed;

      // Upsert to Firestore
      const ref = db().collection('weapons').doc(weaponId);
      const existing = await ref.get();

      if (existing.exists) {
        await ref.update({
          ...mergeResult.weapon,
          updatedAt: Date.now(),
        });
        updateCount++;
        console.log(`  🔄 Updated: ${mergeResult.weapon.name} (${mergeResult.stats.sourcesProcessed} sources, ${(mergeResult.stats.averageConfidence * 100).toFixed(0)}% confidence)`);
      } else {
        await ref.set({
          ...mergeResult.weapon,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        });
        successCount++;
        console.log(`  ✅ Created: ${mergeResult.weapon.name} (${mergeResult.stats.sourcesProcessed} sources, ${(mergeResult.stats.averageConfidence * 100).toFixed(0)}% confidence)`);
      }
    } catch (error) {
      errorCount++;
      console.error(`  ❌ Failed to merge weapon ${weaponId}:`, error);
    }
  }

  const avgConfidence = weaponGroups.size > 0 ? totalConfidence / weaponGroups.size : 0;
  const avgSources = weaponGroups.size > 0 ? totalSources / weaponGroups.size : 0;

  console.log(`\n📊 Weapons Summary:`);
  console.log(`   ✅ Created: ${successCount}`);
  console.log(`   🔄 Updated: ${updateCount}`);
  console.log(`   📊 Multi-source: ${multiSourceCount} (avg ${avgSources.toFixed(1)} sources per weapon)`);
  console.log(`   ⚠️  Conflicts resolved: ${conflictCount}`);
  console.log(`   🎯 Average confidence: ${(avgConfidence * 100).toFixed(0)}%`);
  console.log(`   ⏭️  Skipped: ${skippedCount}`);
  console.log(`   ❌ Errors: ${errorCount}`);

  return { successCount, updateCount, skippedCount, errorCount, multiSourceCount, avgConfidence };
}

/**
 * Populate initial weapon and attachment data from CODArmory (single-source mode)
 */
async function populateWeapons() {
  console.log('🔫 Populating weapons...');

  const { weapons } = await fetchAllCODArmoryData();

  let successCount = 0;
  let updateCount = 0;
  let errorCount = 0;
  let skippedCount = 0;

  for (const weaponData of weapons) {
    try {
      const weapon = transformCODArmoryWeapon(weaponData);

      // Sanitize and normalize data
      weapon.name = sanitizeWeaponName(weapon.name);
      weapon.game = normalizeGameName(weapon.game) as 'MW3' | 'Warzone' | 'BO6' | 'MW2';

      // Validate weapon data
      const validation = validateWeapon(weapon);

      if (!validation.valid) {
        console.error(`  ⚠️  Skipping ${weapon.name}: ${validation.errors.join(', ')}`);
        skippedCount++;
        continue;
      }

      // Log warnings if any
      if (validation.warnings.length > 0) {
        console.warn(`  ⚠️  ${weapon.name}: ${validation.warnings.join(', ')}`);
      }

      // Generate deterministic ID
      const weaponId = generateWeaponId(weapon.name, weapon.game);
      const ref = db().collection('weapons').doc(weaponId);

      // Check if weapon exists
      const existing = await ref.get();
      const now = new Date().toISOString();

      if (existing.exists) {
        // Update existing weapon
        await ref.update({
          ...weapon,
          updatedAt: now,
          dataSource: 'codarmory',
          dataVersion: '1.0.0',
        });
        updateCount++;
        console.log(`  🔄 Updated: ${weapon.name} (${weapon.game} ${weapon.category})`);
      } else {
        // Create new weapon
        await ref.set({
          ...weapon,
          createdAt: now,
          updatedAt: now,
          dataSource: 'codarmory',
          dataVersion: '1.0.0',
        });
        successCount++;
        console.log(`  ✅ Added: ${weapon.name} (${weapon.game} ${weapon.category})`);
      }
    } catch (error) {
      errorCount++;
      console.error(`  ❌ Failed to process weapon:`, error);
    }
  }

  console.log(`\n📊 Weapons Summary:`);
  console.log(`   ✅ Created: ${successCount}`);
  console.log(`   🔄 Updated: ${updateCount}`);
  console.log(`   ⏭️  Skipped: ${skippedCount}`);
  console.log(`   ❌ Errors: ${errorCount}`);

  return { successCount, updateCount, skippedCount, errorCount };
}

/**
 * Populate attachment data
 */
async function populateAttachments() {
  console.log('\n🔧 Populating attachments...');

  const { attachments } = await fetchAllCODArmoryData();

  let successCount = 0;
  let updateCount = 0;
  let errorCount = 0;
  let skippedCount = 0;

  for (const attachmentData of attachments) {
    try {
      const attachment = transformCODArmoryAttachment(attachmentData);

      // Sanitize name
      attachment.name = sanitizeWeaponName(attachment.name);

      // Validate attachment data
      const validation = validateAttachment(attachment);

      if (!validation.valid) {
        console.error(`  ⚠️  Skipping ${attachment.name}: ${validation.errors.join(', ')}`);
        skippedCount++;
        continue;
      }

      // Log warnings if any
      if (validation.warnings.length > 0 && Math.random() < 0.1) {
        // Only log 10% of warnings to avoid spam
        console.warn(`  ⚠️  ${attachment.name}: ${validation.warnings.join(', ')}`);
      }

      // Generate deterministic ID
      const attachmentId = generateAttachmentId(attachment.name, attachment.slot);
      const ref = db().collection('attachments').doc(attachmentId);

      // Check if attachment exists
      const existing = await ref.get();
      const now = new Date().toISOString();

      if (existing.exists) {
        // Update existing attachment
        await ref.update({
          ...attachment,
          updatedAt: now,
          dataSource: 'codarmory',
        });
        updateCount++;
        console.log(`  🔄 Updated: ${attachment.name} (${attachment.slot})`);
      } else {
        // Create new attachment
        await ref.set({
          ...attachment,
          createdAt: now,
          updatedAt: now,
          dataSource: 'codarmory',
        });
        successCount++;
        console.log(`  ✅ Added: ${attachment.name} (${attachment.slot})`);
      }
    } catch (error) {
      errorCount++;
      console.error(`  ❌ Failed to process attachment:`, error);
    }
  }

  console.log(`\n📊 Attachments Summary:`);
  console.log(`   ✅ Created: ${successCount}`);
  console.log(`   🔄 Updated: ${updateCount}`);
  console.log(`   ⏭️  Skipped: ${skippedCount}`);
  console.log(`   ❌ Errors: ${errorCount}`);

  return { successCount, updateCount, skippedCount, errorCount };
}

/**
 * Create initial meta snapshot
 */
async function createInitialMetaSnapshot() {
  console.log('\n📸 Creating initial meta snapshot...');

  try {
    // Get all weapons to organize by tier
    const weaponsSnapshot = await db().collection('weapons').get();

    const tierMap = {
      S: [] as any[],
      A: [] as any[],
      B: [] as any[],
      C: [] as any[],
      D: [] as any[],
    };

    weaponsSnapshot.forEach((doc) => {
      const weapon = doc.data();
      const tier = weapon.meta?.tier || 'C';

      tierMap[tier as keyof typeof tierMap].push({
        id: doc.id,
        name: weapon.name,
        category: weapon.category,
        usage: weapon.meta?.popularity || 0,
        winRate: weapon.meta?.winRate || 50,
      });
    });

    // Create meta snapshot
    const metaSnapshot = {
      game: 'MW3',
      date: new Date().toISOString(),
      tiers: tierMap,
      topLoadouts: [],
      recentChanges: [
        'Initial database population from CODArmory',
        'Meta rankings will be updated with real data soon',
      ],
      dataSource: 'initial-population',
    };

    await db().collection('meta_snapshots').add(metaSnapshot);
    console.log('✅ Created initial meta snapshot');
  } catch (error) {
    console.error('❌ Failed to create meta snapshot:', error);
  }
}

/**
 * Main execution
 */
async function main() {
  console.log('🚀 Starting initial data population...\n');

  if (USE_MULTI_SOURCE) {
    console.log('🔄 Multi-source mode enabled');
    console.log('📍 Data Sources: CODArmory, WZStats, CODMunity');
    console.log(`📍 Confidence Threshold: ${(CONFIDENCE_THRESHOLD * 100).toFixed(0)}%`);
    console.log(`📍 Require CODArmory: ${REQUIRE_CODARMORY ? 'Yes' : 'No'}`);
    console.log(`📍 Skip Stale Sources: ${SKIP_STALE_SOURCES ? 'Yes' : 'No'}\n`);
  } else {
    console.log('📦 Single-source mode (CODArmory only)');
    console.log('📍 Data Source: CODArmory GitHub Repository');
    console.log('📍 Repository: https://github.com/tzurbaev/codarmory.com');
    console.log('💡 Tip: Set USE_MULTI_SOURCE=true in .env to enable multi-source merging\n');
  }

  try {
    // Initialize cache
    await cache.init();

    // Test connection
    const connected = await testCODArmoryConnection();
    if (!connected) {
      throw new Error('Cannot connect to CODArmory repository');
    }

    // Initialize Firebase
    console.log('\n🔥 Initializing Firebase...');
    initializeFirebase();

    // Populate data based on mode
    let weaponStats;
    if (USE_MULTI_SOURCE) {
      weaponStats = await populateWeaponsMultiSource();
    } else {
      weaponStats = await populateWeapons();
    }

    const attachmentStats = await populateAttachments();

    // Create meta snapshot
    await createInitialMetaSnapshot();

    // Summary
    console.log('\n' + '='.repeat(60));
    console.log('🎉 Data Population Complete!');
    console.log('='.repeat(60));
    console.log(`\n📊 Total Results:`);

    if (USE_MULTI_SOURCE) {
      console.log(`   🔫 Weapons: ${weaponStats.successCount} created, ${weaponStats.updateCount} updated`);
      console.log(`      📊 Multi-source: ${weaponStats.multiSourceCount} weapons`);
      console.log(`      🎯 Avg confidence: ${(weaponStats.avgConfidence * 100).toFixed(0)}%`);
      console.log(`      ⏭️  Skipped: ${weaponStats.skippedCount}, ❌ Failed: ${weaponStats.errorCount}`);
    } else {
      console.log(`   🔫 Weapons: ${weaponStats.successCount} created, ${weaponStats.updateCount} updated, ${weaponStats.skippedCount} skipped, ${weaponStats.errorCount} failed`);
    }

    console.log(`   🔧 Attachments: ${attachmentStats.successCount} created, ${attachmentStats.updateCount} updated, ${attachmentStats.skippedCount} skipped, ${attachmentStats.errorCount} failed`);

    // Cache stats
    const cacheStats = await cache.stats();
    console.log(`\n💾 Cache Statistics:`);
    console.log(`   📁 Files: ${cacheStats.files}`);
    console.log(`   💿 Size: ${(cacheStats.size / 1024).toFixed(2)} KB`);

    console.log('\n💡 Next Steps:');
    if (USE_MULTI_SOURCE) {
      console.log('   1. Review multi-source merge quality in Firestore console');
      console.log('   2. Check confidence scores and resolve any conflicts');
      console.log('   3. Run "npm run update:meta" to refresh meta data');
      console.log('   4. Upload weapon images to Firebase Storage\n');
    } else {
      console.log('   1. Run "npm run update:meta" to fetch live meta data');
      console.log('   2. Check Firestore console to verify data');
      console.log('   3. Upload weapon images to Firebase Storage');
      console.log('   4. Consider enabling multi-source mode with USE_MULTI_SOURCE=true\n');
    }

    process.exit(0);
  } catch (error) {
    console.error('\n❌ Fatal Error:', error);
    console.error('\n📝 Error Details:');

    if (error instanceof Error) {
      console.error(`   Message: ${error.message}`);
      console.error(`   Stack: ${error.stack}`);
    }

    process.exit(1);
  }
}

// Handle unhandled rejections
process.on('unhandledRejection', (error) => {
  console.error('❌ Unhandled Rejection:', error);
  process.exit(1);
});

main();
