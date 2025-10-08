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
