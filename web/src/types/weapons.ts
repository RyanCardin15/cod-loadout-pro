/**
 * Weapon-related type definitions
 *
 * This module contains all type definitions related to weapons including:
 * - Game and category enums
 * - Weapon statistics and ballistics
 * - Weapon metadata and tier information
 * - Attachment slot configurations
 */

/**
 * Supported Call of Duty games
 */
export type Game = 'MW3' | 'Warzone' | 'BO6' | 'MW2';

/**
 * Weapon category classifications
 */
export type WeaponCategory = 'AR' | 'SMG' | 'LMG' | 'Sniper' | 'Marksman' | 'Shotgun' | 'Pistol';

/**
 * Meta tier ranking (S-tier being the best)
 */
export type Tier = 'S' | 'A' | 'B' | 'C' | 'D';

/**
 * Player playstyle preferences
 */
export type Playstyle = 'Aggressive' | 'Tactical' | 'Sniper' | 'Support';

/**
 * Base weapon statistics (normalized 0-100 scale)
 */
export interface WeaponStats {
  /** Base damage value (0-100) */
  damage: number;
  /** Effective range (0-100) */
  range: number;
  /** Shot accuracy/spread (0-100) */
  accuracy: number;
  /** Rate of fire (0-100) */
  fireRate: number;
  /** Movement and handling speed (0-100) */
  mobility: number;
  /** Recoil control (0-100) */
  control: number;
  /** ADS and swap speed (0-100) */
  handling: number;
}

/**
 * Damage at specific range breakpoints
 */
export interface DamageRange {
  /** Distance in meters */
  range: number;
  /** Damage dealt at this range */
  damage: number;
}

/**
 * Time-to-kill metrics in milliseconds
 */
export interface TimeToKill {
  /** Minimum TTK (all shots hit, optimal range) */
  min: number;
  /** Maximum TTK (worst case scenario) */
  max: number;
}

/**
 * Detailed weapon ballistics and performance data
 */
export interface WeaponBallistics {
  /** Damage falloff ranges */
  damageRanges: DamageRange[];
  /** Time-to-kill metrics */
  ttk: TimeToKill;
  /** Rounds per minute */
  fireRate: number;
  /** Magazine capacity */
  magazineSize: number;
  /** Reload time in seconds */
  reloadTime: number;
  /** Aim down sights time in milliseconds */
  adTime: number;
}

/**
 * Meta-game statistics and rankings
 */
export interface WeaponMeta {
  /** Current tier ranking */
  tier: Tier;
  /** Usage rate percentage (0-100) */
  popularity: number;
  /** Win rate percentage (0-100) */
  winRate: number;
  /** ISO 8601 timestamp of last meta update */
  lastUpdated: string;
}

/**
 * Available attachment slots for weapon customization
 */
export interface AttachmentSlots {
  /** Optical sights and scopes */
  optic?: string[];
  /** Barrel attachments */
  barrel?: string[];
  /** Magazine modifications */
  magazine?: string[];
  /** Underbarrel attachments (grips, launchers) */
  underbarrel?: string[];
  /** Stock modifications */
  stock?: string[];
  /** Laser sights */
  laser?: string[];
  /** Muzzle attachments (suppressors, brakes) */
  muzzle?: string[];
  /** Rear grip modifications */
  rearGrip?: string[];
}

/**
 * Complete weapon definition with all properties
 */
export interface Weapon {
  /** Unique weapon identifier */
  id: string;
  /** Display name of the weapon */
  name: string;
  /** Game this weapon belongs to */
  game: Game;
  /** Weapon category/class */
  category: WeaponCategory;
  /** Base statistics */
  stats: WeaponStats;
  /** Detailed ballistics data */
  ballistics: WeaponBallistics;
  /** Meta-game statistics */
  meta: WeaponMeta;
  /** Situations this weapon excels in */
  bestFor: string[];
  /** Compatible playstyles */
  playstyles: string[];
  /** Full weapon image URL */
  imageUrl: string;
  /** Small icon URL */
  iconUrl: string;
  /** Available attachment slots */
  attachmentSlots?: AttachmentSlots;
}

/**
 * Simplified weapon information for lists/cards
 */
export interface WeaponSummary {
  /** Unique weapon identifier */
  id: string;
  /** Display name */
  name: string;
  /** Weapon category */
  category: WeaponCategory;
  /** Meta tier information */
  meta: {
    tier: Tier;
  };
}

/**
 * MultiSourceField wrapper from V3 schema
 * Tracks data from multiple sources with confidence scores
 */
export interface MultiSourceField<T = any> {
  currentValue: T;
  sources: Array<{
    source: string;
    value: T;
    timestamp: number;
    reference?: string;
  }>;
  primarySource: string;
  confidence: {
    level: 'high' | 'medium' | 'low';
    score: number;
  };
  lastUpdated: number;
  hasConflict: boolean;
}

/**
 * V3 weapon statistics with MultiSourceField wrappers
 */
export interface WeaponStatsV3 {
  damage: MultiSourceField<number>;
  range: MultiSourceField<number>;
  accuracy: MultiSourceField<number>;
  fireRate: MultiSourceField<number>;
  mobility: MultiSourceField<number>;
  control: MultiSourceField<number>;
  handling: MultiSourceField<number>;
}

/**
 * V3 weapon ballistics with MultiSourceField wrappers
 */
export interface WeaponBallisticsV3 {
  damageRanges: MultiSourceField<DamageRange[]>;
  ttk: MultiSourceField<TimeToKill>;
  fireRate: MultiSourceField<number>;
  magazineSize: MultiSourceField<number>;
  reloadTime: MultiSourceField<number>;
  adTime: MultiSourceField<number>;
}

/**
 * V3 weapon meta with MultiSourceField wrappers
 */
export interface WeaponMetaV3 {
  tier: MultiSourceField<Tier>;
  popularity: MultiSourceField<number>;
  winRate: MultiSourceField<number>;
}

/**
 * V3 Weapon schema with MultiSourceField tracking
 * Used when receiving data from the server with lineage tracking
 */
export interface WeaponV3 {
  id: string;
  name: string;
  game: Game;
  category: WeaponCategory;
  stats: WeaponStatsV3;
  ballistics: WeaponBallisticsV3;
  meta: WeaponMetaV3;
  bestFor?: string[];
  playstyles?: string[];
  imageUrl?: string;
  iconUrl?: string;
  attachmentSlots?: AttachmentSlots;
  lineage?: {
    totalSources: number;
    averageConfidence: number;
    conflictCount: number;
    staleDataCount: number;
    lastUpdated: number;
    lastValidated: number;
    contributingSources: string[];
  };
}

/**
 * Union type for handling both V1 and V3 weapon formats
 * Allows functions to accept either schema version
 */
export type AnyWeapon = Weapon | WeaponV3;
