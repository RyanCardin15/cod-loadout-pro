/**
 * Firebase Firestore operations for attachments
 *
 * Provides CRUD operations and validation helpers for attachment data.
 * This module is used to validate attachment references in loadouts and
 * ensure referential integrity across the database.
 *
 * Key features:
 * - Attachment existence validation
 * - Batch attachment ID validation
 * - Loadout attachment reference validation
 * - Error handling for missing attachments
 *
 * @module firebase/attachments
 */

import { db } from './admin';

// ============================================================================
// Attachment Retrieval Functions
// ============================================================================

/**
 * Checks if an attachment exists in the database
 *
 * This is a lightweight validation function that only checks for existence
 * without fetching the full document data.
 *
 * @param attachmentId - The attachment document ID to check
 * @returns True if the attachment exists, false otherwise
 *
 * @example
 * ```typescript
 * // Validate an attachment reference:
 * const exists = await attachmentExists('att_red_dot_mw3');
 * if (!exists) {
 *   throw new Error('Invalid attachment reference');
 * }
 * ```
 */
export async function attachmentExists(
  attachmentId: string
): Promise<boolean> {
  try {
    // Validate input
    if (!attachmentId || typeof attachmentId !== 'string') {
      return false;
    }

    const doc = await db().collection('attachments').doc(attachmentId).get();
    return doc.exists;
  } catch (error) {
    console.error(
      `Error checking attachment existence for ID: ${attachmentId}`,
      error
    );
    return false;
  }
}

/**
 * Gets an attachment by ID
 *
 * Fetches the complete attachment document from Firestore.
 *
 * @param attachmentId - The attachment document ID
 * @returns The attachment data with ID, or null if not found
 *
 * @example
 * ```typescript
 * const attachment = await getAttachmentById('att_red_dot_mw3');
 * if (attachment) {
 *   console.log(`Attachment: ${attachment.name}, Slot: ${attachment.slot}`);
 * }
 * ```
 */
export async function getAttachmentById(
  attachmentId: string
): Promise<any | null> {
  try {
    // Validate input
    if (!attachmentId || typeof attachmentId !== 'string') {
      return null;
    }

    const doc = await db().collection('attachments').doc(attachmentId).get();

    if (!doc.exists) {
      return null;
    }

    return {
      id: doc.id,
      ...doc.data(),
    };
  } catch (error) {
    console.error(`Error fetching attachment with ID: ${attachmentId}`, error);
    return null;
  }
}

// ============================================================================
// Batch Validation Functions
// ============================================================================

/**
 * Validates that multiple attachment IDs exist
 *
 * @param attachmentIds - Array of attachment IDs to validate
 * @returns Object with validation results
 *
 * @example
 * ```typescript
 * const result = await validateAttachmentIds(['id1', 'id2', 'invalid']);
 * // Returns: { valid: false, invalidIds: ['invalid'], validIds: ['id1', 'id2'] }
 * ```
 */
export async function validateAttachmentIds(attachmentIds: string[]): Promise<{
  valid: boolean;
  validIds: string[];
  invalidIds: string[];
}> {
  if (!Array.isArray(attachmentIds) || attachmentIds.length === 0) {
    return { valid: true, validIds: [], invalidIds: [] };
  }

  const validationResults = await Promise.all(
    attachmentIds.map(async (id) => ({
      id,
      exists: await attachmentExists(id),
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
 * Validates a loadout's attachment references
 *
 * Checks that all attachment IDs in primary and secondary weapons exist in the database.
 *
 * @param loadoutData - The loadout data to validate
 * @returns Validation result with details
 *
 * @example
 * ```typescript
 * const result = await validateLoadoutAttachments({
 *   primary: { weapon: { id: 'ak47' }, attachments: [{ id: 'att1' }] },
 *   secondary: { weapon: { id: 'm1911' }, attachments: [{ id: 'att2' }] }
 * });
 * if (!result.valid) {
 *   throw new Error(`Invalid attachments: ${result.invalidIds.join(', ')}`);
 * }
 * ```
 */
export async function validateLoadoutAttachments(loadoutData: {
  primary?: { attachments?: Array<{ id?: string }> };
  secondary?: { attachments?: Array<{ id?: string }> };
}): Promise<{
  valid: boolean;
  invalidIds: string[];
  checkedIds: string[];
}> {
  const attachmentIds: string[] = [];

  // Collect attachment IDs from primary weapon
  if (loadoutData.primary?.attachments) {
    for (const attachment of loadoutData.primary.attachments) {
      if (attachment.id) {
        attachmentIds.push(attachment.id);
      }
    }
  }

  // Collect attachment IDs from secondary weapon
  if (loadoutData.secondary?.attachments) {
    for (const attachment of loadoutData.secondary.attachments) {
      if (attachment.id) {
        attachmentIds.push(attachment.id);
      }
    }
  }

  if (attachmentIds.length === 0) {
    return { valid: true, invalidIds: [], checkedIds: [] };
  }

  const validation = await validateAttachmentIds(attachmentIds);

  return {
    valid: validation.valid,
    invalidIds: validation.invalidIds,
    checkedIds: attachmentIds,
  };
}
