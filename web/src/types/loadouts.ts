/**
 * Loadout-related type definitions
 *
 * This module contains all type definitions related to loadouts including:
 * - Weapon configurations with attachments
 * - Perk and equipment setups
 * - Complete loadout structures
 * - Input types for creating/updating loadouts
 */

import { Tier, WeaponCategory } from './weapons';

/**
 * Individual weapon attachment
 */
export interface Attachment {
  /** Unique attachment identifier */
  id: string;
  /** Display name of the attachment */
  name: string;
  /** Slot type this attachment occupies */
  slot: string;
}

/**
 * Simplified weapon reference for loadouts
 */
export interface LoadoutWeapon {
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
 * Complete weapon configuration with attachments
 */
export interface LoadoutWeaponDetails {
  /** Base weapon reference */
  weapon: LoadoutWeapon;
  /** Equipped attachments */
  attachments: Attachment[];
}

/**
 * Perk configuration (4 perk slots)
 */
export interface LoadoutPerks {
  /** First perk slot */
  perk1?: string;
  /** Second perk slot */
  perk2?: string;
  /** Third perk slot */
  perk3?: string;
  /** Fourth perk slot (ultimate/specialist) */
  perk4?: string;
}

/**
 * Equipment configuration
 */
export interface LoadoutEquipment {
  /** Lethal equipment (grenades, etc.) */
  lethal?: string;
  /** Tactical equipment (stuns, smokes, etc.) */
  tactical?: string;
  /** Field upgrade ability */
  fieldUpgrade?: string;
}

/**
 * Complete loadout definition
 */
export interface Loadout {
  /** Unique loadout identifier */
  id: string;
  /** User who created this loadout */
  userId: string;
  /** Custom loadout name */
  name: string;
  /** Game this loadout is for */
  game: string;
  /** Primary weapon configuration */
  primary: LoadoutWeaponDetails;
  /** Secondary weapon configuration (optional) */
  secondary?: LoadoutWeaponDetails;
  /** Perk setup */
  perks: LoadoutPerks;
  /** Equipment setup */
  equipment: LoadoutEquipment;
  /** Recommended playstyle for this loadout */
  playstyle: string;
  /** Optimal engagement distance */
  effectiveRange: string;
  /** Skill level required to use effectively */
  difficulty: string;
  /** Community rating (0-10) */
  overallRating?: number;
  /** Number of users who favorited this loadout */
  favorites?: number;
  /** ISO 8601 timestamp of creation */
  createdAt: string;
  /** ISO 8601 timestamp of last update */
  updatedAt: string;
}

/**
 * Input type for creating a new loadout
 */
export interface CreateLoadoutInput {
  /** User creating the loadout */
  userId: string;
  /** Custom loadout name */
  name: string;
  /** Target game */
  game: string;
  /** Primary weapon configuration */
  primary: LoadoutWeaponDetails;
  /** Secondary weapon configuration (optional) */
  secondary?: LoadoutWeaponDetails;
  /** Perk setup (optional, defaults to empty) */
  perks?: LoadoutPerks;
  /** Equipment setup (optional, defaults to empty) */
  equipment?: LoadoutEquipment;
  /** Recommended playstyle */
  playstyle: string;
  /** Optimal engagement distance (optional) */
  effectiveRange?: string;
  /** Difficulty rating (optional) */
  difficulty?: string;
}
