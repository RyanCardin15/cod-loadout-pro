/**
 * Weapon Normalizer Utility
 *
 * Provides functions to normalize weapon data from V3 (MultiSourceField) format
 * to V1 (primitive values) format for rendering and display purposes.
 *
 * The normalizer:
 * - Extracts currentValue from MultiSourceField wrappers
 * - Handles backward compatibility with V1 format
 * - Provides type-safe transformations
 * - Preserves all weapon properties and structure
 */

import { getCurrentValue, isMultiSourceField } from './multisource';
import type { Weapon, WeaponV3, AnyWeapon } from '@/types/weapons';

/**
 * Normalizes a weapon object from V3 (MultiSourceField) to V1 (primitives)
 * Handles both V1 and V3 formats for backward compatibility.
 *
 * This function is essential for rendering weapons in the UI, as React cannot
 * render MultiSourceField objects directly. It extracts the currentValue from
 * each MultiSourceField wrapper while preserving all other weapon properties.
 *
 * @param weapon - Weapon object (V1 or V3 format)
 * @returns Normalized weapon with primitive values
 *
 * @example
 * ```typescript
 * // V3 weapon with MultiSourceField wrappers
 * const v3Weapon = {
 *   id: 'ak47',
 *   name: 'AK-47',
 *   stats: {
 *     damage: { currentValue: 70, sources: [...], confidence: {...} }
 *   }
 * };
 *
 * const normalized = normalizeWeapon(v3Weapon);
 * // => { id: 'ak47', name: 'AK-47', stats: { damage: 70 } }
 * ```
 */
export function normalizeWeapon(weapon: AnyWeapon): Weapon {
  // If already V1 format (primitive values), return as-is
  if (!hasMultiSourceFields(weapon)) {
    return weapon as Weapon;
  }

  // Transform V3 to V1 by extracting currentValue from each MultiSourceField
  const v3Weapon = weapon as WeaponV3;

  return {
    id: v3Weapon.id,
    name: v3Weapon.name,
    game: v3Weapon.game,
    category: v3Weapon.category,

    // Extract primitive values from stats MultiSourceFields
    stats: {
      damage: getCurrentValue(v3Weapon.stats.damage),
      range: getCurrentValue(v3Weapon.stats.range),
      accuracy: getCurrentValue(v3Weapon.stats.accuracy),
      fireRate: getCurrentValue(v3Weapon.stats.fireRate),
      mobility: getCurrentValue(v3Weapon.stats.mobility),
      control: getCurrentValue(v3Weapon.stats.control),
      handling: getCurrentValue(v3Weapon.stats.handling),
    },

    // Extract primitive values from ballistics MultiSourceFields
    ballistics: {
      damageRanges: getCurrentValue(v3Weapon.ballistics.damageRanges),
      ttk: getCurrentValue(v3Weapon.ballistics.ttk),
      fireRate: getCurrentValue(v3Weapon.ballistics.fireRate),
      magazineSize: getCurrentValue(v3Weapon.ballistics.magazineSize),
      reloadTime: getCurrentValue(v3Weapon.ballistics.reloadTime),
      adTime: getCurrentValue(v3Weapon.ballistics.adTime),
    },

    // Extract primitive values from meta MultiSourceFields
    meta: {
      tier: getCurrentValue(v3Weapon.meta.tier),
      popularity: getCurrentValue(v3Weapon.meta.popularity),
      winRate: getCurrentValue(v3Weapon.meta.winRate),
      // Convert timestamp to ISO string for lastUpdated
      lastUpdated: v3Weapon.lineage?.lastUpdated
        ? new Date(v3Weapon.lineage.lastUpdated).toISOString()
        : new Date().toISOString(),
    },

    // Preserve optional fields (these are not wrapped in MultiSourceField)
    attachmentSlots: v3Weapon.attachmentSlots,
    bestFor: v3Weapon.bestFor || [],
    playstyles: v3Weapon.playstyles || [],
    imageUrl: v3Weapon.imageUrl || '',
    iconUrl: v3Weapon.iconUrl || '',
  };
}

/**
 * Checks if a weapon object contains MultiSourceField properties
 *
 * This type guard distinguishes between V1 (primitive) and V3 (MultiSourceField)
 * weapon formats by checking if key stat fields are wrapped in MultiSourceField.
 *
 * @param weapon - Weapon object to check
 * @returns True if weapon uses V3 MultiSourceField format, false if V1
 *
 * @example
 * ```typescript
 * const v1 = { stats: { damage: 70 } };
 * const v3 = { stats: { damage: { currentValue: 70, sources: [...] } } };
 *
 * hasMultiSourceFields(v1); // => false
 * hasMultiSourceFields(v3); // => true
 * ```
 */
function hasMultiSourceFields(weapon: any): boolean {
  // Check if stats fields are MultiSourceField wrappers
  if (weapon.stats && isMultiSourceField(weapon.stats.damage)) {
    return true;
  }

  // Check if meta fields are MultiSourceField wrappers
  if (weapon.meta && isMultiSourceField(weapon.meta.tier)) {
    return true;
  }

  // Check if ballistics fields are MultiSourceField wrappers
  if (weapon.ballistics && isMultiSourceField(weapon.ballistics.fireRate)) {
    return true;
  }

  return false;
}

/**
 * Normalizes an array of weapons from V3 to V1 format
 *
 * Convenience function for batch normalization of weapon lists.
 * Each weapon is independently normalized using normalizeWeapon().
 *
 * @param weapons - Array of weapons (V1 or V3 format)
 * @returns Array of normalized weapons with primitive values
 *
 * @example
 * ```typescript
 * const weapons = [v3Weapon1, v3Weapon2, v1Weapon3];
 * const normalized = normalizeWeapons(weapons);
 * // All weapons now have primitive values suitable for rendering
 * ```
 */
export function normalizeWeapons(weapons: AnyWeapon[]): Weapon[] {
  return weapons.map(normalizeWeapon);
}
