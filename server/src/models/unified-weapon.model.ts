/**
 * Unified Weapon Model (V3 Schema)
 *
 * This model represents the evolution from V1 (simple) and V2 (enhanced)
 * to a V3 unified schema that tracks multiple data sources with lineage,
 * confidence scores, and conflict resolution.
 *
 * Key Features:
 * - Multi-source field tracking with confidence scores
 * - Data lineage and provenance tracking
 * - Conflict detection and resolution
 * - Balance patch history
 * - Backward compatibility with V1/V2
 */

import { DataSource } from '../../../scripts/lib/lineage/lineage-schema';
import type { MultiSourceField, ConfidenceScore } from '../../../scripts/lib/lineage/lineage-schema';

// ============================================================================
// Legacy Schema Interfaces (V1 and V2)
// ============================================================================

/**
 * WeaponV1 - Original simple weapon schema
 * Used in early versions of the system with basic stats
 */
export interface WeaponV1 {
  id: string;
  name: string;
  game: "MW3" | "Warzone" | "BO6" | "MW2";
  category: "AR" | "SMG" | "LMG" | "Sniper" | "Marksman" | "Shotgun" | "Pistol";

  /** Simple numeric stats */
  stats: {
    damage: number;
    range: number;
    accuracy: number;
    fireRate: number;
    mobility: number;
    control: number;
    handling: number;
  };

  /** Basic ballistics data */
  ballistics: {
    damageRanges: Array<{ range: number; damage: number }>;
    ttk: { min: number; max: number };
    fireRate: number;
    magazineSize: number;
    reloadTime: number;
    adTime: number;
  };

  /** Simple meta information */
  meta: {
    tier: "S" | "A" | "B" | "C" | "D";
    popularity: number;
    winRate: number;
    lastUpdated: string;
  };

  attachmentSlots?: Record<string, string[]>;
  bestFor?: string[];
  playstyles?: string[];
  imageUrl?: string;
  iconUrl?: string;
}

/**
 * WeaponV2 - Enhanced weapon schema with additional metadata
 * Introduced source tracking but without full lineage support
 */
export interface WeaponV2 {
  id: string;
  name: string;
  game: "MW3" | "Warzone" | "BO6" | "MW2";
  category: "AR" | "SMG" | "LMG" | "Sniper" | "Marksman" | "Shotgun" | "Pistol";

  /** Stats with source attribution */
  stats: {
    damage: number;
    range: number;
    accuracy: number;
    fireRate: number;
    mobility: number;
    control: number;
    handling: number;
    source?: string; // Added source tracking
    updatedAt?: number;
  };

  /** Enhanced ballistics with velocity and recoil */
  ballistics: {
    damageRanges: Array<{ range: number; damage: number; headshot?: number }>;
    ttk: { min: number; max: number; chest?: number };
    fireRate: number;
    magazineSize: number;
    reloadTime: number;
    adTime: number;
    bulletVelocity?: number;
    recoilPattern?: { horizontal: number; vertical: number };
  };

  /** Enhanced meta with more metrics */
  meta: {
    tier: "S" | "A" | "B" | "C" | "D";
    popularity: number;
    pickRate?: number;
    winRate: number;
    kd?: number;
    lastUpdated: string;
    source?: string;
  };

  attachmentSlots?: Record<string, string[]>;
  bestFor?: string[];
  playstyles?: string[];
  imageUrl?: string;
  iconUrl?: string;

  /** V2 specific fields */
  sourceMetadata?: {
    primarySource: string;
    lastFetchedAt: number;
    reliability?: number;
  };
}

// ============================================================================
// V3 Unified Schema with Multi-Source Support
// ============================================================================

/**
 * Multi-source field wrapper for weapon statistics
 * Tracks multiple sources with confidence and lineage
 */
export interface WeaponStatField extends MultiSourceField {
  currentValue: number;
}

/**
 * Multi-source field wrapper for string/enum values
 */
export interface WeaponMetaField<T = any> extends MultiSourceField {
  currentValue: T;
}

/**
 * Unified Weapon (V3) - Complete weapon model with multi-source tracking
 *
 * This is the primary weapon interface used throughout the system.
 * It tracks data from multiple sources with full lineage and conflict resolution.
 */
export interface UnifiedWeapon {
  // ========================================
  // Core Identification
  // ========================================

  /** Unique weapon identifier */
  id: string;

  /** Weapon display name */
  name: string;

  /** Game this weapon belongs to */
  game: "MW3" | "Warzone" | "BO6" | "MW2";

  /** Weapon category/class */
  category: "AR" | "SMG" | "LMG" | "Sniper" | "Marksman" | "Shotgun" | "Pistol";

  // ========================================
  // Multi-Source Statistics
  // ========================================

  /**
   * Core weapon statistics with multi-source tracking
   * Each stat can have multiple sources with confidence scores
   */
  stats: {
    damage: WeaponStatField;
    range: WeaponStatField;
    accuracy: WeaponStatField;
    fireRate: WeaponStatField;
    mobility: WeaponStatField;
    control: WeaponStatField;
    handling: WeaponStatField;
  };

  /**
   * Detailed ballistics data with multi-source tracking
   */
  ballistics: {
    damageRanges: MultiSourceField; // Array<{ range: number; damage: number; headshot?: number }>
    ttk: MultiSourceField; // { min: number; max: number; chest?: number }
    fireRate: WeaponStatField;
    magazineSize: WeaponStatField;
    reloadTime: WeaponStatField;
    adTime: WeaponStatField;
    bulletVelocity: WeaponStatField;
    recoilPattern: MultiSourceField; // { horizontal: number; vertical: number }
  };

  /**
   * Meta information and tier rankings with multi-source tracking
   */
  meta: {
    tier: WeaponMetaField<"S" | "A" | "B" | "C" | "D">;
    popularity: WeaponStatField;
    pickRate: WeaponStatField;
    winRate: WeaponStatField;
    kd: WeaponStatField;
  };

  // ========================================
  // Attachment System
  // ========================================

  /**
   * Available attachment slots and compatible attachments
   * Not tracked with multi-source as this is usually definitive
   */
  attachmentSlots?: Record<string, string[]>;

  // ========================================
  // Categorization and Recommendations
  // ========================================

  /** What scenarios this weapon excels in */
  bestFor?: string[];

  /** Compatible playstyles */
  playstyles?: string[];

  // ========================================
  // Visual Assets
  // ========================================

  /** Full weapon image URL */
  imageUrl?: string;

  /** Small icon URL */
  iconUrl?: string;

  // ========================================
  // Lineage Metadata
  // ========================================

  /**
   * Overall lineage metadata for this weapon
   */
  lineage: {
    /** Total number of unique data sources */
    totalSources: number;

    /** Average confidence across all fields (0-1) */
    averageConfidence: number;

    /** Number of fields with conflicts */
    conflictCount: number;

    /** Number of stale data points (>30 days) */
    staleDataCount: number;

    /** When this weapon data was last updated */
    lastUpdated: number;

    /** When lineage was last validated */
    lastValidated: number;

    /** List of all contributing sources */
    contributingSources: DataSource[];
  };

  // ========================================
  // Balance History
  // ========================================

  /**
   * Historical balance patches affecting this weapon
   */
  balanceHistory?: BalancePatch[];

  // ========================================
  // Timestamps
  // ========================================

  /** When this weapon record was created */
  createdAt: number;

  /** When this weapon record was last modified */
  updatedAt: number;
}

// ============================================================================
// Balance Patch Tracking
// ============================================================================

/**
 * Represents a balance change/patch affecting a weapon
 */
export interface BalancePatch {
  /** Unique patch identifier */
  id: string;

  /** Patch version/name (e.g., "Season 3 Reloaded", "1.42.0") */
  version: string;

  /** When this patch was applied */
  appliedAt: number;

  /** Game this patch applies to */
  game: "MW3" | "Warzone" | "BO6" | "MW2";

  /** Changes made in this patch */
  changes: BalanceChange[];

  /** Official patch notes URL */
  patchNotesUrl?: string;

  /** Source of patch information */
  source: DataSource;

  /** Additional notes or context */
  notes?: string;
}

/**
 * Individual change within a balance patch
 */
export interface BalanceChange {
  /** Field that was changed (e.g., "damage", "range", "recoil") */
  field: string;

  /** Previous value */
  oldValue: any;

  /** New value */
  newValue: any;

  /** Percentage change if applicable */
  changePercent?: number;

  /** Type of change */
  changeType: 'buff' | 'nerf' | 'adjustment';

  /** Human-readable description */
  description?: string;
}

// ============================================================================
// API Response Model
// ============================================================================

/**
 * Simplified weapon response for API consumers
 * Flattens multi-source fields to current values while preserving
 * confidence scores for transparency
 */
export interface WeaponResponse {
  id: string;
  name: string;
  game: "MW3" | "Warzone" | "BO6" | "MW2";
  category: "AR" | "SMG" | "LMG" | "Sniper" | "Marksman" | "Shotgun" | "Pistol";

  /** Simplified stats with confidence indicators */
  stats: {
    damage: number;
    range: number;
    accuracy: number;
    fireRate: number;
    mobility: number;
    control: number;
    handling: number;
    _confidence?: number; // Optional overall confidence
  };

  /** Simplified ballistics */
  ballistics: {
    damageRanges: Array<{ range: number; damage: number; headshot?: number }>;
    ttk: { min: number; max: number; chest?: number };
    fireRate: number;
    magazineSize: number;
    reloadTime: number;
    adTime: number;
    bulletVelocity?: number;
    recoilPattern?: { horizontal: number; vertical: number };
  };

  /** Simplified meta */
  meta: {
    tier: "S" | "A" | "B" | "C" | "D";
    popularity: number;
    pickRate?: number;
    winRate: number;
    kd?: number;
    lastUpdated: string; // ISO string
    _dataSources?: string[]; // Optional list of sources used
  };

  attachmentSlots?: Record<string, string[]>;
  bestFor?: string[];
  playstyles?: string[];
  imageUrl?: string;
  iconUrl?: string;

  /** Data quality indicators */
  dataQuality?: {
    confidence: number;
    hasConflicts: boolean;
    staleness: 'fresh' | 'recent' | 'stale';
    sourceCount: number;
  };
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Converts a UnifiedWeapon to a simplified WeaponResponse for API consumers
 * Flattens multi-source fields to their current values
 *
 * @param weapon - The unified weapon to convert
 * @returns Simplified weapon response
 */
export function toWeaponResponse(weapon: UnifiedWeapon): WeaponResponse {
  // Calculate overall confidence
  const avgConfidence = weapon.lineage.averageConfidence;

  // Determine staleness
  const daysSinceUpdate = (Date.now() - weapon.lineage.lastUpdated) / (1000 * 60 * 60 * 24);
  const staleness: 'fresh' | 'recent' | 'stale' =
    daysSinceUpdate < 1 ? 'fresh' :
    daysSinceUpdate < 7 ? 'recent' : 'stale';

  return {
    id: weapon.id,
    name: weapon.name,
    game: weapon.game,
    category: weapon.category,

    stats: {
      damage: weapon.stats.damage.currentValue,
      range: weapon.stats.range.currentValue,
      accuracy: weapon.stats.accuracy.currentValue,
      fireRate: weapon.stats.fireRate.currentValue,
      mobility: weapon.stats.mobility.currentValue,
      control: weapon.stats.control.currentValue,
      handling: weapon.stats.handling.currentValue,
      _confidence: avgConfidence,
    },

    ballistics: {
      damageRanges: weapon.ballistics.damageRanges.currentValue,
      ttk: weapon.ballistics.ttk.currentValue,
      fireRate: weapon.ballistics.fireRate.currentValue,
      magazineSize: weapon.ballistics.magazineSize.currentValue,
      reloadTime: weapon.ballistics.reloadTime.currentValue,
      adTime: weapon.ballistics.adTime.currentValue,
      bulletVelocity: weapon.ballistics.bulletVelocity?.currentValue,
      recoilPattern: weapon.ballistics.recoilPattern?.currentValue,
    },

    meta: {
      tier: weapon.meta.tier.currentValue,
      popularity: weapon.meta.popularity.currentValue,
      pickRate: weapon.meta.pickRate?.currentValue,
      winRate: weapon.meta.winRate.currentValue,
      kd: weapon.meta.kd?.currentValue,
      lastUpdated: new Date(weapon.lineage.lastUpdated).toISOString(),
      _dataSources: weapon.lineage.contributingSources.map(s => String(s)),
    },

    attachmentSlots: weapon.attachmentSlots,
    bestFor: weapon.bestFor,
    playstyles: weapon.playstyles,
    imageUrl: weapon.imageUrl,
    iconUrl: weapon.iconUrl,

    dataQuality: {
      confidence: avgConfidence,
      hasConflicts: weapon.lineage.conflictCount > 0,
      staleness,
      sourceCount: weapon.lineage.totalSources,
    },
  };
}

// ============================================================================
// Migration Functions (Placeholder)
// ============================================================================

/**
 * Migrates a WeaponV1 record to UnifiedWeapon (V3)
 * TODO: Implement full migration logic with proper source attribution
 *
 * @param v1Weapon - The V1 weapon to migrate
 * @returns Unified weapon with V1 data as a single source
 */
export function v1ToV3(v1Weapon: WeaponV1): UnifiedWeapon {
  // TODO: Implement migration from V1 to V3
  // This should:
  // 1. Create MultiSourceField wrappers for all stats
  // 2. Set source to DataSource.UNKNOWN or DataSource.MANUAL
  // 3. Initialize confidence scores
  // 4. Set up lineage metadata

  throw new Error('v1ToV3 migration not yet implemented');
}

/**
 * Migrates a WeaponV2 record to UnifiedWeapon (V3)
 * TODO: Implement full migration logic preserving V2 source metadata
 *
 * @param v2Weapon - The V2 weapon to migrate
 * @returns Unified weapon with V2 data and sources preserved
 */
export function v2ToV3(v2Weapon: WeaponV2): UnifiedWeapon {
  // TODO: Implement migration from V2 to V3
  // This should:
  // 1. Parse V2 source metadata and convert to proper DataSource enums
  // 2. Create MultiSourceField wrappers preserving source information
  // 3. Calculate confidence scores based on V2 reliability data
  // 4. Set up lineage metadata from V2 sourceMetadata

  throw new Error('v2ToV3 migration not yet implemented');
}

// ============================================================================
// Type Guards
// ============================================================================

/**
 * Type guard to check if an object is a WeaponV1
 */
export function isWeaponV1(weapon: any): weapon is WeaponV1 {
  return (
    weapon &&
    typeof weapon.id === 'string' &&
    typeof weapon.name === 'string' &&
    weapon.stats &&
    typeof weapon.stats.damage === 'number' &&
    !weapon.stats.source && // V1 doesn't have source field
    !weapon.lineage // V1 doesn't have lineage
  );
}

/**
 * Type guard to check if an object is a WeaponV2
 */
export function isWeaponV2(weapon: any): weapon is WeaponV2 {
  return (
    weapon &&
    typeof weapon.id === 'string' &&
    typeof weapon.name === 'string' &&
    weapon.stats &&
    typeof weapon.stats.damage === 'number' &&
    !weapon.lineage && // V2 doesn't have full lineage
    (weapon.stats.source || weapon.sourceMetadata) // V2 has some source tracking
  );
}

/**
 * Type guard to check if an object is a UnifiedWeapon (V3)
 */
export function isUnifiedWeapon(weapon: any): weapon is UnifiedWeapon {
  return (
    weapon &&
    typeof weapon.id === 'string' &&
    typeof weapon.name === 'string' &&
    weapon.stats &&
    weapon.stats.damage &&
    typeof weapon.stats.damage.currentValue === 'number' &&
    weapon.lineage && // V3 has lineage
    typeof weapon.lineage.averageConfidence === 'number'
  );
}
