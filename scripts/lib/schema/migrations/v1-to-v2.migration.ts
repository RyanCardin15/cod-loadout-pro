/**
 * V1 to V2 Migration
 *
 * Migrates weapons from V1 (flat schema) to V2 (with lineage metadata).
 *
 * Changes:
 * - Adds schemaVersion field set to 'v2'
 * - Adds lineageMetadata object with default values
 * - Adds dataSource field from weapon.dataSource or 'unknown'
 * - Keeps all existing fields unchanged (backward compatible)
 *
 * V1 weapons are simple flat structures with no source tracking.
 * V2 adds metadata to track where data came from without changing the structure.
 */

import { WeaponV1, WeaponV2 } from '../../../../server/src/models/unified-weapon.model';
import { DataSource } from '../../lineage/lineage-schema';

/**
 * Lineage metadata for V2 schema
 *
 * This is a simplified version used in V2 before full MultiSourceField support.
 */
export interface V2LineageMetadata {
  /** Average confidence score for this weapon's data (0-1) */
  averageConfidence: number;
  /** Minimum confidence across all fields */
  minConfidence: number;
  /** Maximum confidence across all fields */
  maxConfidence: number;
  /** Total number of data sources */
  totalSources: number;
  /** Count of sources by name */
  sourcesByName: Record<string, number>;
  /** When this weapon data was last updated */
  lastUpdate: number;
  /** Oldest data point timestamp */
  oldestUpdate: number;
  /** Fields that have conflicting data */
  conflictedFields: string[];
  /** Fields that are stale (>30 days old) */
  staleFields: string[];
}

/**
 * Migrate V1 weapon to V2 by adding lineage metadata
 *
 * This migration is non-destructive and backward compatible.
 * All original V1 fields are preserved exactly as-is.
 *
 * @param weapon - V1 weapon to migrate
 * @returns V2 weapon with lineage metadata
 */
export function migrateV1ToV2(weapon: WeaponV1): WeaponV2 {
  // Determine data source
  // V1 weapons typically don't have source information, so we infer it
  const dataSource = inferDataSource(weapon);

  // Calculate timestamps
  const now = Date.now();
  const createdAt = weapon.meta?.lastUpdated
    ? new Date(weapon.meta.lastUpdated).getTime()
    : now;
  const updatedAt = createdAt;

  // Create V2 lineage metadata with default values for legacy data
  const lineageMetadata: V2LineageMetadata = {
    // Default confidence for legacy data (moderate confidence)
    averageConfidence: 0.5,
    minConfidence: 0.5,
    maxConfidence: 0.5,

    // Single source (legacy import)
    totalSources: 1,
    sourcesByName: {
      [dataSource]: 1,
    },

    // Timestamps
    lastUpdate: updatedAt,
    oldestUpdate: createdAt,

    // No conflicts or stale data initially
    conflictedFields: [],
    staleFields: [],
  };

  // Build V2 weapon (spread V1 and add V2-specific fields)
  const v2Weapon: WeaponV2 = {
    // Copy all V1 fields
    ...weapon,

    // Add source tracking to stats
    stats: {
      ...weapon.stats,
      source: dataSource,
      updatedAt,
    },

    // Add source tracking to meta
    meta: {
      ...weapon.meta,
      source: dataSource,
      lastUpdated: new Date(updatedAt).toISOString(),
    },

    // V2 specific fields
    sourceMetadata: {
      primarySource: dataSource,
      lastFetchedAt: updatedAt,
      reliability: 0.5, // Default reliability for legacy data
    },

    // Hidden lineage metadata (for future V3 migration)
    // This is stored but not used in V2 logic
    ...(lineageMetadata && { _lineageMetadata: lineageMetadata }),
  };

  return v2Weapon;
}

/**
 * Infer data source from V1 weapon structure
 *
 * Uses heuristics to guess where the data came from:
 * - Check for specific field patterns
 * - Check weapon name format
 * - Default to 'unknown' if can't determine
 *
 * @param weapon - V1 weapon to analyze
 * @returns Inferred data source
 */
function inferDataSource(weapon: WeaponV1): string {
  // Check if weapon has imageUrl - might indicate CODArmory
  if (weapon.imageUrl?.includes('codarmory') || weapon.iconUrl?.includes('codarmory')) {
    return DataSource.CODARMORY;
  }

  // Check if weapon has specific meta patterns
  if (weapon.meta?.tier && weapon.meta.popularity !== undefined) {
    // Has tier + popularity = likely WZStats
    return DataSource.WZSTATS;
  }

  // Check if weapon has detailed ballistics
  if (
    weapon.ballistics?.damageRanges?.length > 0 &&
    weapon.ballistics?.ttk
  ) {
    // Detailed ballistics = likely CODArmory or computed
    return DataSource.CODARMORY;
  }

  // Check if weapon has attachment slots
  if (weapon.attachmentSlots && Object.keys(weapon.attachmentSlots).length > 0) {
    // Attachment data = likely official source
    return DataSource.CODARMORY;
  }

  // Check for manual entry indicators
  if (weapon.bestFor || weapon.playstyles) {
    // Curated recommendations = likely manual entry
    return DataSource.MANUAL;
  }

  // Default to unknown
  return DataSource.UNKNOWN;
}

/**
 * Batch migrate multiple V1 weapons to V2
 *
 * @param weapons - Array of V1 weapons
 * @returns Array of V2 weapons
 */
export function batchMigrateV1ToV2(weapons: WeaponV1[]): WeaponV2[] {
  return weapons.map((weapon) => {
    try {
      return migrateV1ToV2(weapon);
    } catch (error) {
      console.error(`Failed to migrate weapon ${weapon.id}:`, error);
      throw error;
    }
  });
}

/**
 * Validate V1 weapon before migration
 *
 * @param weapon - Weapon to validate
 * @returns True if weapon can be migrated
 */
export function canMigrateV1ToV2(weapon: any): boolean {
  // Must have basic required fields
  if (!weapon.id || !weapon.name || !weapon.game || !weapon.category) {
    return false;
  }

  // Must have stats object
  if (!weapon.stats || typeof weapon.stats !== 'object') {
    return false;
  }

  // Must NOT already have V2/V3 fields
  if (weapon.sourceMetadata || weapon.lineage) {
    return false;
  }

  return true;
}

/**
 * Get migration summary for V1 to V2
 *
 * @param weapon - Original V1 weapon
 * @param migrated - Migrated V2 weapon
 * @returns Summary of changes
 */
export function getMigrationSummary(weapon: WeaponV1, migrated: WeaponV2): {
  fieldsAdded: string[];
  fieldsModified: string[];
  dataSource: string;
} {
  return {
    fieldsAdded: [
      'sourceMetadata',
      'stats.source',
      'stats.updatedAt',
      'meta.source',
      '_lineageMetadata',
    ],
    fieldsModified: [
      'stats',
      'meta',
    ],
    dataSource: migrated.sourceMetadata?.primarySource || 'unknown',
  };
}

/**
 * Rollback V2 weapon to V1 (remove added metadata)
 *
 * This is useful for testing or reverting migrations.
 * CAUTION: This loses source tracking information.
 *
 * @param weapon - V2 weapon to rollback
 * @returns V1 weapon
 */
export function rollbackV2ToV1(weapon: WeaponV2): WeaponV1 {
  const v1Weapon: WeaponV1 = {
    id: weapon.id,
    name: weapon.name,
    game: weapon.game,
    category: weapon.category,

    stats: {
      damage: weapon.stats.damage,
      range: weapon.stats.range,
      accuracy: weapon.stats.accuracy,
      fireRate: weapon.stats.fireRate,
      mobility: weapon.stats.mobility,
      control: weapon.stats.control,
      handling: weapon.stats.handling,
    },

    ballistics: {
      damageRanges: weapon.ballistics.damageRanges,
      ttk: weapon.ballistics.ttk,
      fireRate: weapon.ballistics.fireRate,
      magazineSize: weapon.ballistics.magazineSize,
      reloadTime: weapon.ballistics.reloadTime,
      adTime: weapon.ballistics.adTime,
    },

    meta: {
      tier: weapon.meta.tier,
      popularity: weapon.meta.popularity,
      winRate: weapon.meta.winRate,
      lastUpdated: weapon.meta.lastUpdated,
    },

    attachmentSlots: weapon.attachmentSlots,
    bestFor: weapon.bestFor,
    playstyles: weapon.playstyles,
    imageUrl: weapon.imageUrl,
    iconUrl: weapon.iconUrl,
  };

  return v1Weapon;
}
