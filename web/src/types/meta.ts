/**
 * Meta-game data type definitions
 *
 * This module contains all type definitions related to meta-game analysis including:
 * - Tier rankings
 * - Balance changes tracking
 * - Professional player loadouts
 * - Historical meta snapshots
 */

import { Weapon } from './weapons';

/**
 * Weapons organized by tier ranking
 */
export interface MetaTiers {
  /** S-tier weapons (best in class) */
  S: Weapon[];
  /** A-tier weapons (very strong) */
  A: Weapon[];
  /** B-tier weapons (balanced) */
  B: Weapon[];
  /** C-tier weapons (below average) */
  C: Weapon[];
  /** D-tier weapons (needs buffs) */
  D: Weapon[];
}

/**
 * Record of weapon balance changes
 */
export interface MetaChange {
  /** Affected weapon ID */
  weaponId: string;
  /** Weapon display name */
  weaponName: string;
  /** Type of balance change */
  change: 'buff' | 'nerf' | 'adjustment';
  /** Description of the changes made */
  description: string;
  /** ISO 8601 timestamp of when change occurred */
  date: string;
}

/**
 * Professional player loadout reference
 */
export interface ProLoadout {
  /** Unique loadout identifier */
  id: string;
  /** Professional player's name */
  proName: string;
  /** Primary weapon used */
  weaponName: string;
  /** Meta tier of the loadout */
  tier: string;
  /** Game this loadout is for */
  game: string;
}

/**
 * Current meta-game data snapshot
 */
export interface MetaData {
  /** Current tier rankings */
  tiers: MetaTiers;
  /** Recent balance changes */
  recentChanges: MetaChange[];
  /** Featured pro player loadouts */
  proLoadouts: ProLoadout[];
  /** ISO 8601 timestamp of last update */
  lastUpdated: string;
}

/**
 * Historical meta snapshot for tracking meta evolution
 */
export interface MetaSnapshot {
  /** Unique snapshot identifier */
  id: string;
  /** Game this snapshot is for */
  game: string;
  /** ISO 8601 timestamp of snapshot */
  date: string;
  /** Tier rankings at this time */
  tiers: MetaTiers;
  /** Top loadouts at this time (optional) */
  topLoadouts?: ProLoadout[];
  /** Balance changes leading to this meta (optional) */
  recentChanges?: MetaChange[];
}
