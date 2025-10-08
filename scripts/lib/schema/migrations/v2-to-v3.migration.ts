/**
 * V2 to V3 Migration
 *
 * Migrates weapons from V2 (flat fields with source metadata) to V3 (UnifiedWeapon with MultiSourceField).
 *
 * Changes:
 * - Wraps all stats in WeaponStatField (MultiSourceField)
 * - Wraps all meta fields in WeaponMetaField (MultiSourceField)
 * - Wraps ballistics fields in MultiSourceField
 * - Creates full lineage tracking structure
 * - Updates schemaVersion to 'v3'
 * - Preserves all original data in source records
 *
 * This is the most complex migration as it transforms the entire data structure
 * from flat fields to multi-source tracked fields.
 */

import {
  WeaponV2,
  UnifiedWeapon,
  WeaponStatField,
  WeaponMetaField,
} from '../../../../server/src/models/unified-weapon.model';
import {
  DataSource,
  MultiSourceField,
  SourceRecord,
  DataLineage,
  ConfidenceScore,
} from '../../lineage/lineage-schema';
import { lineageTracker } from '../../lineage/lineage-tracker';

/**
 * Migrate V2 weapon to V3 (UnifiedWeapon)
 *
 * Transforms flat V2 fields into MultiSourceField structures with full lineage tracking.
 *
 * @param weapon - V2 weapon to migrate
 * @returns V3 UnifiedWeapon with multi-source tracking
 */
export function migrateV2ToV3(weapon: WeaponV2): UnifiedWeapon {
  // Extract source information from V2 metadata
  const primarySource = parseDataSource(
    weapon.sourceMetadata?.primarySource || weapon.stats?.source || 'unknown'
  );
  const timestamp = weapon.sourceMetadata?.lastFetchedAt || Date.now();
  const reliability = weapon.sourceMetadata?.reliability || 0.5;

  // Calculate confidence score for the data
  const confidence = lineageTracker.calculateConfidence(
    primarySource,
    timestamp,
    reliability
  );

  // Migrate stats (damage, range, accuracy, etc.)
  const stats = {
    damage: createStatField(weapon.stats.damage, primarySource, timestamp, confidence),
    range: createStatField(weapon.stats.range, primarySource, timestamp, confidence),
    accuracy: createStatField(weapon.stats.accuracy, primarySource, timestamp, confidence),
    fireRate: createStatField(weapon.stats.fireRate, primarySource, timestamp, confidence),
    mobility: createStatField(weapon.stats.mobility, primarySource, timestamp, confidence),
    control: createStatField(weapon.stats.control, primarySource, timestamp, confidence),
    handling: createStatField(weapon.stats.handling, primarySource, timestamp, confidence),
  };

  // Migrate ballistics
  const ballistics = {
    damageRanges: createMultiSourceField(
      weapon.ballistics.damageRanges,
      primarySource,
      timestamp,
      confidence
    ),
    ttk: createMultiSourceField(
      weapon.ballistics.ttk,
      primarySource,
      timestamp,
      confidence
    ),
    fireRate: createStatField(
      weapon.ballistics.fireRate,
      primarySource,
      timestamp,
      confidence
    ),
    magazineSize: createStatField(
      weapon.ballistics.magazineSize,
      primarySource,
      timestamp,
      confidence
    ),
    reloadTime: createStatField(
      weapon.ballistics.reloadTime,
      primarySource,
      timestamp,
      confidence
    ),
    adTime: createStatField(
      weapon.ballistics.adTime,
      primarySource,
      timestamp,
      confidence
    ),
    bulletVelocity: weapon.ballistics.bulletVelocity
      ? createStatField(weapon.ballistics.bulletVelocity, primarySource, timestamp, confidence)
      : createStatField(0, primarySource, timestamp, confidence),
    recoilPattern: weapon.ballistics.recoilPattern
      ? createMultiSourceField(weapon.ballistics.recoilPattern, primarySource, timestamp, confidence)
      : createMultiSourceField({ horizontal: 0, vertical: 0 }, primarySource, timestamp, confidence),
  };

  // Migrate meta information
  const meta = {
    tier: createMetaField(weapon.meta.tier, primarySource, timestamp, confidence),
    popularity: createStatField(weapon.meta.popularity, primarySource, timestamp, confidence),
    pickRate: weapon.meta.pickRate !== undefined
      ? createStatField(weapon.meta.pickRate, primarySource, timestamp, confidence)
      : createStatField(0, primarySource, timestamp, confidence),
    winRate: createStatField(weapon.meta.winRate, primarySource, timestamp, confidence),
    kd: weapon.meta.kd !== undefined
      ? createStatField(weapon.meta.kd, primarySource, timestamp, confidence)
      : createStatField(0, primarySource, timestamp, confidence),
  };

  // Create lineage metadata
  const lineage = {
    totalSources: 1, // V2 has single source
    averageConfidence: confidence.value,
    conflictCount: 0, // No conflicts with single source
    staleDataCount: lineageTracker.isStale(timestamp) ? 1 : 0,
    lastUpdated: timestamp,
    lastValidated: Date.now(),
    contributingSources: [primarySource],
  };

  // Build unified weapon (V3)
  const unifiedWeapon: UnifiedWeapon = {
    // Core identification (unchanged)
    id: weapon.id,
    name: weapon.name,
    game: weapon.game,
    category: weapon.category,

    // Multi-source tracked fields
    stats,
    ballistics,
    meta,

    // Attachments (not multi-source tracked)
    attachmentSlots: weapon.attachmentSlots,

    // Categorization
    bestFor: weapon.bestFor,
    playstyles: weapon.playstyles,

    // Visual assets
    imageUrl: weapon.imageUrl,
    iconUrl: weapon.iconUrl,

    // Lineage metadata
    lineage,

    // Balance history (empty for migrated weapons)
    balanceHistory: [],

    // Timestamps
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };

  return unifiedWeapon;
}

/**
 * Create WeaponStatField from single numeric value
 *
 * @param value - Numeric stat value
 * @param source - Data source
 * @param timestamp - When data was collected
 * @param confidence - Confidence score
 * @returns WeaponStatField with single source
 */
function createStatField(
  value: number,
  source: DataSource,
  timestamp: number,
  confidence: ConfidenceScore
): WeaponStatField {
  const sourceRecord: SourceRecord = {
    source,
    value,
    timestamp,
  };

  return {
    sources: [sourceRecord],
    currentValue: value,
    primarySource: source,
    confidence,
    lastUpdated: timestamp,
    hasConflict: false,
  };
}

/**
 * Create WeaponMetaField from single value (any type)
 *
 * @param value - Meta value (string, enum, etc.)
 * @param source - Data source
 * @param timestamp - When data was collected
 * @param confidence - Confidence score
 * @returns WeaponMetaField with single source
 */
function createMetaField<T>(
  value: T,
  source: DataSource,
  timestamp: number,
  confidence: ConfidenceScore
): WeaponMetaField<T> {
  const sourceRecord: SourceRecord = {
    source,
    value,
    timestamp,
  };

  return {
    sources: [sourceRecord],
    currentValue: value,
    primarySource: source,
    confidence,
    lastUpdated: timestamp,
    hasConflict: false,
  };
}

/**
 * Create generic MultiSourceField from single value
 *
 * @param value - Field value (can be object, array, etc.)
 * @param source - Data source
 * @param timestamp - When data was collected
 * @param confidence - Confidence score
 * @returns MultiSourceField with single source
 */
function createMultiSourceField(
  value: any,
  source: DataSource,
  timestamp: number,
  confidence: ConfidenceScore
): MultiSourceField {
  const sourceRecord: SourceRecord = {
    source,
    value,
    timestamp,
  };

  return {
    sources: [sourceRecord],
    currentValue: value,
    primarySource: source,
    confidence,
    lastUpdated: timestamp,
    hasConflict: false,
  };
}

/**
 * Parse data source string to DataSource enum
 *
 * Handles various source string formats and maps to proper enum values.
 *
 * @param sourceString - Source as string
 * @returns DataSource enum value
 */
function parseDataSource(sourceString: string): DataSource {
  const normalized = sourceString.toLowerCase().trim();

  // Map common source strings to enums
  const sourceMap: Record<string, DataSource> = {
    codarmory: DataSource.CODARMORY,
    'cod armory': DataSource.CODARMORY,
    wzstats: DataSource.WZSTATS,
    'wz stats': DataSource.WZSTATS,
    codmunity: DataSource.CODMUNITY,
    wiki: DataSource.WIKI,
    manual: DataSource.MANUAL,
    'manual entry': DataSource.MANUAL,
    computed: DataSource.COMPUTED,
    calculated: DataSource.COMPUTED,
    user: DataSource.USER_SUBMISSION,
    'user submission': DataSource.USER_SUBMISSION,
    official: DataSource.OFFICIAL_API,
    'official api': DataSource.OFFICIAL_API,
    api: DataSource.OFFICIAL_API,
    unknown: DataSource.UNKNOWN,
  };

  // Try to find in map
  if (sourceMap[normalized]) {
    return sourceMap[normalized];
  }

  // Check if already a valid DataSource enum value
  if (Object.values(DataSource).includes(normalized as DataSource)) {
    return normalized as DataSource;
  }

  // Default to unknown
  console.warn(`Unknown data source: ${sourceString}, defaulting to UNKNOWN`);
  return DataSource.UNKNOWN;
}

/**
 * Batch migrate multiple V2 weapons to V3
 *
 * @param weapons - Array of V2 weapons
 * @returns Array of V3 UnifiedWeapons
 */
export function batchMigrateV2ToV3(weapons: WeaponV2[]): UnifiedWeapon[] {
  return weapons.map((weapon) => {
    try {
      return migrateV2ToV3(weapon);
    } catch (error) {
      console.error(`Failed to migrate weapon ${weapon.id}:`, error);
      throw error;
    }
  });
}

/**
 * Validate V2 weapon before migration
 *
 * @param weapon - Weapon to validate
 * @returns True if weapon can be migrated
 */
export function canMigrateV2ToV3(weapon: any): boolean {
  // Must have basic required fields
  if (!weapon.id || !weapon.name || !weapon.game || !weapon.category) {
    return false;
  }

  // Must have stats object with numeric values
  if (!weapon.stats || typeof weapon.stats !== 'object') {
    return false;
  }

  // Must NOT already have V3 lineage structure
  if (weapon.lineage && weapon.lineage.averageConfidence !== undefined) {
    return false;
  }

  // Must NOT have MultiSourceField wrappers
  if (weapon.stats.damage && weapon.stats.damage.currentValue !== undefined) {
    return false;
  }

  return true;
}

/**
 * Get migration summary for V2 to V3
 *
 * @param weapon - Original V2 weapon
 * @param migrated - Migrated V3 weapon
 * @returns Summary of changes
 */
export function getMigrationSummary(weapon: WeaponV2, migrated: UnifiedWeapon): {
  fieldsConverted: string[];
  multiSourceFieldsCreated: number;
  dataSource: string;
  confidence: number;
} {
  // Count all MultiSourceField wrappers created
  const statFields = 7; // damage, range, accuracy, fireRate, mobility, control, handling
  const ballisticFields = 8; // damageRanges, ttk, fireRate, magazineSize, reloadTime, adTime, bulletVelocity, recoilPattern
  const metaFields = 5; // tier, popularity, pickRate, winRate, kd

  return {
    fieldsConverted: [
      'stats.*',
      'ballistics.*',
      'meta.*',
    ],
    multiSourceFieldsCreated: statFields + ballisticFields + metaFields,
    dataSource: migrated.lineage.contributingSources[0],
    confidence: migrated.lineage.averageConfidence,
  };
}

/**
 * Validate migrated V3 weapon structure
 *
 * Ensures all required MultiSourceField structures are present and valid.
 *
 * @param weapon - V3 weapon to validate
 * @returns Validation errors (empty if valid)
 */
export function validateV3Migration(weapon: UnifiedWeapon): string[] {
  const errors: string[] = [];

  // Validate stats structure
  const statKeys = ['damage', 'range', 'accuracy', 'fireRate', 'mobility', 'control', 'handling'];
  for (const key of statKeys) {
    const field = (weapon.stats as any)[key];
    if (!field || typeof field.currentValue !== 'number') {
      errors.push(`Invalid stat field: ${key}`);
    }
    if (!Array.isArray(field.sources) || field.sources.length === 0) {
      errors.push(`Missing sources for stat: ${key}`);
    }
  }

  // Validate ballistics structure
  const ballisticKeys = ['damageRanges', 'ttk', 'fireRate', 'magazineSize', 'reloadTime', 'adTime'];
  for (const key of ballisticKeys) {
    const field = (weapon.ballistics as any)[key];
    if (!field || field.currentValue === undefined) {
      errors.push(`Invalid ballistic field: ${key}`);
    }
  }

  // Validate meta structure
  const metaKeys = ['tier', 'popularity', 'winRate'];
  for (const key of metaKeys) {
    const field = (weapon.meta as any)[key];
    if (!field || field.currentValue === undefined) {
      errors.push(`Invalid meta field: ${key}`);
    }
  }

  // Validate lineage
  if (!weapon.lineage) {
    errors.push('Missing lineage object');
  } else {
    if (typeof weapon.lineage.totalSources !== 'number') {
      errors.push('Invalid lineage.totalSources');
    }
    if (typeof weapon.lineage.averageConfidence !== 'number') {
      errors.push('Invalid lineage.averageConfidence');
    }
    if (!Array.isArray(weapon.lineage.contributingSources)) {
      errors.push('Invalid lineage.contributingSources');
    }
  }

  return errors;
}

/**
 * Create migration report comparing V2 and V3
 *
 * @param v2Weapon - Original V2 weapon
 * @param v3Weapon - Migrated V3 weapon
 * @returns Detailed comparison report
 */
export function createMigrationReport(v2Weapon: WeaponV2, v3Weapon: UnifiedWeapon): {
  weaponId: string;
  weaponName: string;
  fieldsPreserved: boolean;
  dataIntegrity: boolean;
  issues: string[];
} {
  const issues: string[] = [];

  // Check data preservation
  const statsMatch = v2Weapon.stats.damage === v3Weapon.stats.damage.currentValue;
  if (!statsMatch) {
    issues.push('Stats values do not match after migration');
  }

  const nameMatch = v2Weapon.name === v3Weapon.name;
  if (!nameMatch) {
    issues.push('Weapon name changed during migration');
  }

  const categoryMatch = v2Weapon.category === v3Weapon.category;
  if (!categoryMatch) {
    issues.push('Weapon category changed during migration');
  }

  return {
    weaponId: v3Weapon.id,
    weaponName: v3Weapon.name,
    fieldsPreserved: statsMatch && nameMatch && categoryMatch,
    dataIntegrity: issues.length === 0,
    issues,
  };
}
