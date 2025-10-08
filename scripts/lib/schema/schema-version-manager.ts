/**
 * Schema Version Manager
 *
 * Manages weapon schema versioning, migration tracking, and validation.
 * Detects schema versions (v1, v2, v3) and tracks migration history in Firestore.
 *
 * Features:
 * - Automatic version detection
 * - Schema validation
 * - Migration path calculation
 * - History tracking in Firestore
 * - Migration statistics
 */

import { db, initializeFirebase } from '../../../server/src/firebase/admin';
import {
  isWeaponV1,
  isWeaponV2,
  isUnifiedWeapon,
  WeaponV1,
  WeaponV2,
  UnifiedWeapon,
} from '../../../server/src/models/unified-weapon.model';
import { ValidationResult, validateWeapon } from '../utils/data-validator';

/**
 * Schema version enumeration
 */
export type SchemaVersion = 'v1' | 'v2' | 'v3';

/**
 * Migration record stored in Firestore
 */
export interface MigrationRecord {
  /** Weapon ID that was migrated */
  weaponId: string;
  /** Weapon name for readability */
  weaponName: string;
  /** Schema version before migration */
  fromVersion: SchemaVersion;
  /** Schema version after migration */
  toVersion: SchemaVersion;
  /** When migration occurred (Unix timestamp) */
  timestamp: number;
  /** Whether migration succeeded */
  success: boolean;
  /** Error message if migration failed */
  error?: string;
  /** Duration of migration in milliseconds */
  duration?: number;
  /** Additional metadata */
  metadata?: {
    fieldsAdded?: string[];
    fieldsModified?: string[];
    conflictsDetected?: number;
  };
}

/**
 * Migration statistics aggregated across all weapons
 */
export interface MigrationStats {
  /** Total number of weapons in database */
  total: number;
  /** Count by schema version */
  byVersion: Record<SchemaVersion, number>;
  /** Number of weapons successfully migrated */
  migrated: number;
  /** Number of weapons pending migration */
  pending: number;
  /** Number of failed migrations */
  failed: number;
  /** Last migration timestamp */
  lastMigration?: number;
  /** Average migration duration */
  averageDuration?: number;
}

/**
 * Schema Version Manager
 *
 * Central manager for schema versioning, detection, and migration tracking.
 */
export class SchemaVersionManager {
  private initialized = false;

  /**
   * Initialize Firebase if not already done
   */
  private ensureInitialized(): void {
    if (!this.initialized) {
      initializeFirebase();
      this.initialized = true;
    }
  }

  /**
   * Detect schema version from weapon data
   *
   * Detection logic:
   * - V1: Flat stats, no lineage metadata, no source tracking
   * - V2: Has sourceMetadata or stats.source, but no lineage object
   * - V3: Has lineage object with MultiSourceField wrappers
   *
   * @param weapon - Weapon object to analyze
   * @returns Detected schema version
   */
  detectVersion(weapon: any): SchemaVersion {
    if (!weapon) {
      throw new Error('Cannot detect version of null/undefined weapon');
    }

    // Check V3 first (most specific)
    if (isUnifiedWeapon(weapon)) {
      return 'v3';
    }

    // Check V2 (has source tracking but not full lineage)
    if (isWeaponV2(weapon)) {
      return 'v2';
    }

    // Check V1 (most basic)
    if (isWeaponV1(weapon)) {
      return 'v1';
    }

    // Default to unknown, treat as V1 for migration purposes
    console.warn(`Could not detect schema version for weapon ${weapon.id || 'unknown'}, defaulting to v1`);
    return 'v1';
  }

  /**
   * Validate weapon against expected schema version
   *
   * @param weapon - Weapon to validate
   * @param version - Expected schema version
   * @returns Validation result with errors/warnings
   */
  validateSchema(weapon: any, version: SchemaVersion): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // First run basic weapon validation
    const basicValidation = validateWeapon(weapon);
    errors.push(...basicValidation.errors);
    warnings.push(...basicValidation.warnings);

    // Detect actual version
    const detectedVersion = this.detectVersion(weapon);
    if (detectedVersion !== version) {
      errors.push(
        `Schema version mismatch: expected ${version} but detected ${detectedVersion}`
      );
    }

    // Version-specific validation
    switch (version) {
      case 'v1':
        this.validateV1Schema(weapon, errors, warnings);
        break;
      case 'v2':
        this.validateV2Schema(weapon, errors, warnings);
        break;
      case 'v3':
        this.validateV3Schema(weapon, errors, warnings);
        break;
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * Validate V1 schema specifics
   */
  private validateV1Schema(weapon: any, errors: string[], warnings: string[]): void {
    // V1 should NOT have lineage or sourceMetadata
    if (weapon.lineage) {
      errors.push('V1 weapon should not have lineage field');
    }
    if (weapon.sourceMetadata) {
      errors.push('V1 weapon should not have sourceMetadata field');
    }

    // V1 stats should be flat numbers
    if (weapon.stats) {
      for (const [key, value] of Object.entries(weapon.stats)) {
        if (typeof value !== 'number') {
          errors.push(`V1 stat ${key} should be a number, got ${typeof value}`);
        }
      }
    }
  }

  /**
   * Validate V2 schema specifics
   */
  private validateV2Schema(weapon: any, errors: string[], warnings: string[]): void {
    // V2 should have source tracking but not full lineage
    if (weapon.lineage && weapon.lineage.averageConfidence !== undefined) {
      errors.push('V2 weapon should not have full lineage object (that is V3)');
    }

    // V2 should have at least some source tracking
    const hasSourceTracking =
      weapon.sourceMetadata ||
      weapon.stats?.source ||
      weapon.meta?.source;

    if (!hasSourceTracking) {
      warnings.push('V2 weapon missing source tracking metadata');
    }

    // V2 stats should still be flat numbers
    if (weapon.stats) {
      for (const [key, value] of Object.entries(weapon.stats)) {
        if (key === 'source' || key === 'updatedAt') continue;
        if (typeof value !== 'number') {
          errors.push(`V2 stat ${key} should be a number, got ${typeof value}`);
        }
      }
    }
  }

  /**
   * Validate V3 schema specifics
   */
  private validateV3Schema(weapon: any, errors: string[], warnings: string[]): void {
    // V3 must have lineage object
    if (!weapon.lineage) {
      errors.push('V3 weapon must have lineage object');
      return;
    }

    // Validate lineage structure
    const requiredLineageFields = [
      'totalSources',
      'averageConfidence',
      'conflictCount',
      'staleDataCount',
      'lastUpdated',
      'lastValidated',
      'contributingSources',
    ];

    for (const field of requiredLineageFields) {
      if (weapon.lineage[field] === undefined) {
        errors.push(`V3 lineage missing required field: ${field}`);
      }
    }

    // V3 stats should be MultiSourceField objects
    if (weapon.stats) {
      for (const [key, value] of Object.entries(weapon.stats)) {
        if (!value || typeof value !== 'object') {
          errors.push(`V3 stat ${key} should be a MultiSourceField object`);
          continue;
        }

        const field = value as any;
        if (field.currentValue === undefined) {
          errors.push(`V3 stat ${key} missing currentValue`);
        }
        if (field.primarySource === undefined) {
          errors.push(`V3 stat ${key} missing primarySource`);
        }
        if (field.confidence === undefined) {
          errors.push(`V3 stat ${key} missing confidence`);
        }
        if (!Array.isArray(field.sources)) {
          errors.push(`V3 stat ${key} missing or invalid sources array`);
        }
      }
    }
  }

  /**
   * Check if weapon needs migration to target version
   *
   * @param weapon - Weapon to check
   * @param targetVersion - Desired schema version
   * @returns True if migration is needed
   */
  needsMigration(weapon: any, targetVersion: SchemaVersion): boolean {
    const currentVersion = this.detectVersion(weapon);
    return currentVersion !== targetVersion;
  }

  /**
   * Get migration path from current to target version
   *
   * Examples:
   * - v1 → v3: ['v1', 'v2', 'v3']
   * - v2 → v3: ['v2', 'v3']
   * - v3 → v3: ['v3'] (no migration needed)
   *
   * @param currentVersion - Current schema version
   * @param targetVersion - Target schema version
   * @returns Array of versions in migration order
   */
  getMigrationPath(
    currentVersion: SchemaVersion,
    targetVersion: SchemaVersion
  ): SchemaVersion[] {
    const versions: SchemaVersion[] = ['v1', 'v2', 'v3'];
    const currentIndex = versions.indexOf(currentVersion);
    const targetIndex = versions.indexOf(targetVersion);

    if (currentIndex === -1 || targetIndex === -1) {
      throw new Error(
        `Invalid schema versions: ${currentVersion} → ${targetVersion}`
      );
    }

    if (currentIndex > targetIndex) {
      throw new Error(
        `Cannot migrate backwards: ${currentVersion} → ${targetVersion}`
      );
    }

    // Return slice from current to target (inclusive)
    return versions.slice(currentIndex, targetIndex + 1);
  }

  /**
   * Record migration in Firestore schema_migrations collection
   *
   * @param record - Migration record to save
   */
  async recordMigration(record: MigrationRecord): Promise<void> {
    this.ensureInitialized();

    try {
      const firestore = db();
      const migrationsRef = firestore.collection('schema_migrations');

      // Create document with auto-generated ID
      await migrationsRef.add({
        ...record,
        createdAt: Date.now(),
      });
    } catch (error) {
      console.error('Failed to record migration:', error);
      throw error;
    }
  }

  /**
   * Get migration history for a specific weapon
   *
   * @param weaponId - ID of weapon to get history for
   * @returns Array of migration records, newest first
   */
  async getMigrationHistory(weaponId: string): Promise<MigrationRecord[]> {
    this.ensureInitialized();

    try {
      const firestore = db();
      const migrationsRef = firestore.collection('schema_migrations');

      const snapshot = await migrationsRef
        .where('weaponId', '==', weaponId)
        .orderBy('timestamp', 'desc')
        .get();

      return snapshot.docs.map((doc) => doc.data() as MigrationRecord);
    } catch (error) {
      console.error('Failed to get migration history:', error);
      return [];
    }
  }

  /**
   * Get migration statistics across all weapons
   *
   * @returns Aggregated migration statistics
   */
  async getMigrationStats(): Promise<MigrationStats> {
    this.ensureInitialized();

    try {
      const firestore = db();
      const weaponsRef = firestore.collection('weapons');
      const migrationsRef = firestore.collection('schema_migrations');

      // Get all weapons to analyze versions
      const weaponsSnapshot = await weaponsRef.get();
      const weapons = weaponsSnapshot.docs.map((doc) => doc.data());

      const stats: MigrationStats = {
        total: weapons.length,
        byVersion: { v1: 0, v2: 0, v3: 0 },
        migrated: 0,
        pending: 0,
        failed: 0,
      };

      // Count by version
      for (const weapon of weapons) {
        const version = this.detectVersion(weapon);
        stats.byVersion[version]++;
      }

      // Get migration records
      const migrationsSnapshot = await migrationsRef
        .orderBy('timestamp', 'desc')
        .limit(1000)
        .get();

      const migrations = migrationsSnapshot.docs.map(
        (doc) => doc.data() as MigrationRecord
      );

      // Calculate migration stats
      let totalDuration = 0;
      let durationCount = 0;

      for (const migration of migrations) {
        if (migration.success) {
          stats.migrated++;
        } else {
          stats.failed++;
        }

        if (migration.duration) {
          totalDuration += migration.duration;
          durationCount++;
        }
      }

      // Set last migration timestamp
      if (migrations.length > 0) {
        stats.lastMigration = migrations[0].timestamp;
      }

      // Calculate average duration
      if (durationCount > 0) {
        stats.averageDuration = totalDuration / durationCount;
      }

      // Pending = total - v3 weapons
      stats.pending = stats.total - stats.byVersion.v3;

      return stats;
    } catch (error) {
      console.error('Failed to get migration stats:', error);
      throw error;
    }
  }

  /**
   * Get recent migration activity
   *
   * @param limit - Maximum number of records to return
   * @returns Recent migration records
   */
  async getRecentMigrations(limit: number = 50): Promise<MigrationRecord[]> {
    this.ensureInitialized();

    try {
      const firestore = db();
      const migrationsRef = firestore.collection('schema_migrations');

      const snapshot = await migrationsRef
        .orderBy('timestamp', 'desc')
        .limit(limit)
        .get();

      return snapshot.docs.map((doc) => doc.data() as MigrationRecord);
    } catch (error) {
      console.error('Failed to get recent migrations:', error);
      return [];
    }
  }

  /**
   * Check if a weapon has been migrated
   *
   * @param weaponId - Weapon ID to check
   * @returns True if weapon has migration records
   */
  async hasMigrationHistory(weaponId: string): Promise<boolean> {
    const history = await this.getMigrationHistory(weaponId);
    return history.length > 0;
  }
}

/**
 * Singleton instance of SchemaVersionManager
 */
export const schemaVersionManager = new SchemaVersionManager();

/**
 * Export types for use in other modules
 */
export type {
  WeaponV1,
  WeaponV2,
  UnifiedWeapon,
};
