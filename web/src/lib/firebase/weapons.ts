/**
 * Firebase Firestore operations for weapons
 *
 * Provides CRUD operations and validation helpers for weapon data.
 * This module is used to validate weapon references in loadouts and
 * ensure referential integrity across the database.
 *
 * Key features:
 * - Weapon existence validation
 * - Batch weapon ID validation
 * - Loadout weapon reference validation
 * - Error handling for missing weapons
 *
 * @module firebase/weapons
 */

import { db } from './admin';

// ============================================================================
// Weapon Retrieval Functions
// ============================================================================

/**
 * Checks if a weapon exists in the database
 *
 * This is a lightweight validation function that only checks for existence
 * without fetching the full document data.
 *
 * @param weaponId - The weapon document ID to check
 * @returns True if the weapon exists, false otherwise
 *
 * @example
 * ```typescript
 * // Validate a weapon reference before creating a loadout:
 * const exists = await weaponExists('weapon_ak47_mw3');
 * if (!exists) {
 *   throw new Error('Invalid weapon reference');
 * }
 * ```
 */
export async function weaponExists(weaponId: string): Promise<boolean> {
  try {
    // Validate input
    if (!weaponId || typeof weaponId !== 'string') {
      return false;
    }

    const doc = await db().collection('weapons').doc(weaponId).get();
    return doc.exists;
  } catch (error) {
    console.error(
      `Error checking weapon existence for ID: ${weaponId}`,
      error
    );
    return false;
  }
}

/**
 * Gets a weapon by ID
 *
 * Fetches the complete weapon document from Firestore.
 *
 * @param weaponId - The weapon document ID
 * @returns The weapon data with ID, or null if not found
 *
 * @example
 * ```typescript
 * const weapon = await getWeaponById('weapon_ak47_mw3');
 * if (weapon) {
 *   console.log(`Weapon: ${weapon.name}, Tier: ${weapon.meta.tier}`);
 * }
 * ```
 */
export async function getWeaponById(weaponId: string): Promise<any | null> {
  try {
    // Validate input
    if (!weaponId || typeof weaponId !== 'string') {
      return null;
    }

    const doc = await db().collection('weapons').doc(weaponId).get();

    if (!doc.exists) {
      return null;
    }

    return {
      id: doc.id,
      ...doc.data(),
    };
  } catch (error) {
    console.error(`Error fetching weapon with ID: ${weaponId}`, error);
    return null;
  }
}

// ============================================================================
// Batch Validation Functions
// ============================================================================

/**
 * Validates that multiple weapon IDs exist
 *
 * @param weaponIds - Array of weapon IDs to validate
 * @returns Object with validation results
 *
 * @example
 * ```typescript
 * const result = await validateWeaponIds(['id1', 'id2', 'invalid']);
 * // Returns: { valid: false, invalidIds: ['invalid'], validIds: ['id1', 'id2'] }
 * ```
 */
export async function validateWeaponIds(weaponIds: string[]): Promise<{
  valid: boolean;
  validIds: string[];
  invalidIds: string[];
}> {
  if (!Array.isArray(weaponIds) || weaponIds.length === 0) {
    return { valid: true, validIds: [], invalidIds: [] };
  }

  const validationResults = await Promise.all(
    weaponIds.map(async (id) => ({
      id,
      exists: await weaponExists(id),
    }))
  );

  const validIds = validationResults
    .filter((result) => result.exists)
    .map((result) => result.id);

  const invalidIds = validationResults
    .filter((result) => !result.exists)
    .map((result) => result.id);

  return {
    valid: invalidIds.length === 0,
    validIds,
    invalidIds,
  };
}

/**
 * Validates a loadout's weapon references
 *
 * Checks that primary and secondary weapon IDs (if present) exist in the database.
 *
 * @param loadoutData - The loadout data to validate
 * @returns Validation result with details
 *
 * @example
 * ```typescript
 * const result = await validateLoadoutWeapons({
 *   primary: { weapon: { id: 'ak47' }, attachments: [] },
 *   secondary: { weapon: { id: 'm1911' }, attachments: [] }
 * });
 * if (!result.valid) {
 *   throw new Error(`Invalid weapons: ${result.invalidIds.join(', ')}`);
 * }
 * ```
 */
export async function validateLoadoutWeapons(loadoutData: {
  primary?: { weapon?: { id?: string } };
  secondary?: { weapon?: { id?: string } };
}): Promise<{
  valid: boolean;
  invalidIds: string[];
  checkedIds: string[];
}> {
  const weaponIds: string[] = [];

  // Collect weapon IDs from primary and secondary
  if (loadoutData.primary?.weapon?.id) {
    weaponIds.push(loadoutData.primary.weapon.id);
  }
  if (loadoutData.secondary?.weapon?.id) {
    weaponIds.push(loadoutData.secondary.weapon.id);
  }

  if (weaponIds.length === 0) {
    return { valid: true, invalidIds: [], checkedIds: [] };
  }

  const validation = await validateWeaponIds(weaponIds);

  return {
    valid: validation.valid,
    invalidIds: validation.invalidIds,
    checkedIds: weaponIds,
  };
}
