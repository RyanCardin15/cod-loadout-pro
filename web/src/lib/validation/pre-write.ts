/**
 * Pre-write validation utilities for data population
 *
 * Provides comprehensive validation functions to ensure data integrity before
 * writing to Firebase. These utilities are essential for population scripts,
 * migration scripts, and any bulk data operations.
 *
 * Key features:
 * - Validates data against Zod schemas before database writes
 * - Provides detailed validation reports with error diagnostics
 * - Supports batch operations with progress tracking
 * - Prevents invalid data from corrupting the database
 * - Separates valid and invalid items for flexible error handling
 *
 * @see {@link ./POPULATION_SCRIPT_EXAMPLE.md} for complete usage guide
 *
 * @example Quick Start
 * ```typescript
 * import { validateBeforeWrite, generateValidationReport } from '@/lib/validation/pre-write';
 * import { weaponSchema } from '@/lib/validation/schemas';
 *
 * const weapons = [...]; // Your weapon data
 * const result = validateBeforeWrite(weapons, weaponSchema);
 *
 * if (!result.allValid) {
 *   console.error('Validation failed:', result.summary);
 *   process.exit(1);
 * }
 *
 * // Safe to write to Firebase - all data is valid
 * for (const weapon of result.validItems) {
 *   await db.collection('weapons').add(weapon);
 * }
 * ```
 *
 * @module validation/pre-write
 */

import { z } from 'zod';

import {
  attachmentSchema,
  loadoutSchema,
  metaSnapshotSchema,
  weaponSchema,
} from './schemas';

// ============================================================================
// Validation Result Types
// ============================================================================

/**
 * Result of validating a single item
 */
export interface ValidationResult<T> {
  valid: boolean;
  item: T;
  errors?: z.ZodError;
  index?: number;
}

/**
 * Summary of batch validation
 */
export interface ValidationSummary<T> {
  allValid: boolean;
  totalItems: number;
  validCount: number;
  invalidCount: number;
  validItems: T[];
  invalidItems: Array<{
    item: T;
    errors: z.ZodError;
    index: number;
  }>;
  summary: string;
}

// ============================================================================
// Core Validation Functions
// ============================================================================

/**
 * Validates a single item against a Zod schema
 *
 * This is the fundamental validation function. It attempts to parse the item
 * using the provided schema and returns a structured result indicating success
 * or failure with detailed error information.
 *
 * @template T - The expected type after validation
 * @param item - The item to validate (unknown type for safety)
 * @param schema - The Zod schema to validate against
 * @returns Validation result with parsed data (if valid) or errors (if invalid)
 *
 * @example
 * ```typescript
 * import { validateItem } from '@/lib/validation/pre-write';
 * import { weaponSchema } from '@/lib/validation/schemas';
 *
 * const result = validateItem(weaponData, weaponSchema);
 *
 * if (result.valid) {
 *   // Type-safe: result.item is properly typed
 *   await db.collection('weapons').add(result.item);
 *   console.log('Weapon validated:', result.item.name);
 * } else {
 *   // Access detailed errors
 *   console.error('Validation failed:', result.errors?.errors);
 * }
 * ```
 */
export function validateItem<T>(
  item: unknown,
  schema: z.ZodSchema<T>
): ValidationResult<T> {
  try {
    const parsed = schema.parse(item);
    return {
      valid: true,
      item: parsed,
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        valid: false,
        item: item as T,
        errors: error,
      };
    }
    // Re-throw unexpected errors
    throw error;
  }
}

/**
 * Validates an array of items against a Zod schema
 *
 * Validates each item individually and provides detailed results for
 * both valid and invalid items. This is the primary function for
 * pre-write validation in population scripts.
 *
 * @param items - Array of items to validate
 * @param schema - The Zod schema to validate against
 * @returns Comprehensive validation summary
 *
 * @example
 * ```typescript
 * const weapons = [...]; // Array of weapon data
 * const result = validateBeforeWrite(weapons, weaponSchema);
 *
 * console.log(result.summary);
 * // "Validation complete: 98/100 items valid (2 failed)"
 *
 * if (!result.allValid) {
 *   result.invalidItems.forEach(({ item, errors, index }) => {
 *     console.error(`Item ${index} failed:`, errors.errors);
 *   });
 * }
 *
 * // Write only valid items
 * for (const weapon of result.validItems) {
 *   await db.collection('weapons').add(weapon);
 * }
 * ```
 */
export function validateBeforeWrite<T>(
  items: unknown[],
  schema: z.ZodSchema<T>
): ValidationSummary<T> {
  const results = items.map((item, index) => ({
    ...validateItem(item, schema),
    index,
  }));

  const validResults = results.filter((r) => r.valid);
  const invalidResults = results.filter((r) => !r.valid);

  const validItems = validResults.map((r) => r.item);
  const invalidItems = invalidResults.map((r) => ({
    item: r.item,
    errors: r.errors!,
    index: r.index,
  }));

  const allValid = invalidResults.length === 0;
  const summary = `Validation complete: ${validResults.length}/${items.length} items valid${
    invalidResults.length > 0 ? ` (${invalidResults.length} failed)` : ''
  }`;

  return {
    allValid,
    totalItems: items.length,
    validCount: validResults.length,
    invalidCount: invalidResults.length,
    validItems,
    invalidItems,
    summary,
  };
}

// ============================================================================
// Domain-Specific Validation Functions
// ============================================================================

/**
 * Validates weapon data before writing to Firebase
 *
 * Convenience function that uses the weaponSchema for validation.
 *
 * @param weapons - Array of weapon data to validate
 * @returns Validation summary with valid/invalid items
 */
export function validateWeapons(weapons: unknown[]): ValidationSummary<any> {
  return validateBeforeWrite(weapons, weaponSchema);
}

/**
 * Validates attachment data before writing to Firebase
 *
 * Convenience function that uses the attachmentSchema for validation.
 *
 * @param attachments - Array of attachment data to validate
 * @returns Validation summary with valid/invalid items
 */
export function validateAttachments(
  attachments: unknown[]
): ValidationSummary<any> {
  return validateBeforeWrite(attachments, attachmentSchema);
}

/**
 * Validates loadout data before writing to Firebase
 *
 * Convenience function that uses the loadoutSchema for validation.
 *
 * @param loadouts - Array of loadout data to validate
 * @returns Validation summary with valid/invalid items
 */
export function validateLoadouts(loadouts: unknown[]): ValidationSummary<any> {
  return validateBeforeWrite(loadouts, loadoutSchema);
}

/**
 * Validates meta snapshot data before writing to Firebase
 *
 * Convenience function that uses the metaSnapshotSchema for validation.
 *
 * @param snapshots - Array of meta snapshot data to validate
 * @returns Validation summary with valid/invalid items
 */
export function validateMetaSnapshots(
  snapshots: unknown[]
): ValidationSummary<any> {
  return validateBeforeWrite(snapshots, metaSnapshotSchema);
}

// ============================================================================
// Reporting Functions
// ============================================================================

/**
 * Generates a detailed validation report for console output
 *
 * @param summary - The validation summary to report on
 * @param dataType - Name of the data type being validated (e.g., "weapons", "loadouts")
 * @returns Formatted report string
 *
 * @example
 * ```typescript
 * const result = validateWeapons(weaponData);
 * console.log(generateValidationReport(result, 'weapons'));
 * ```
 */
export function generateValidationReport<T>(
  summary: ValidationSummary<T>,
  dataType: string
): string {
  const lines: string[] = [];

  lines.push('='.repeat(60));
  lines.push(`Validation Report: ${dataType}`);
  lines.push('='.repeat(60));
  lines.push(`Total items: ${summary.totalItems}`);
  lines.push(`Valid items: ${summary.validCount}`);
  lines.push(`Invalid items: ${summary.invalidCount}`);
  lines.push(`Success rate: ${((summary.validCount / summary.totalItems) * 100).toFixed(2)}%`);
  lines.push('');

  if (summary.invalidCount > 0) {
    lines.push('INVALID ITEMS:');
    lines.push('-'.repeat(60));

    summary.invalidItems.forEach(({ index, errors }) => {
      lines.push(`\nItem #${index}:`);
      errors.errors.forEach((error) => {
        lines.push(`  - ${error.path.join('.')}: ${error.message}`);
      });
    });

    lines.push('');
    lines.push('⚠️  WARNING: Some items failed validation and will not be written.');
  } else {
    lines.push('✅ All items passed validation!');
  }

  lines.push('='.repeat(60));

  return lines.join('\n');
}

/**
 * Generates a JSON summary for programmatic use
 *
 * Creates a machine-readable summary of validation results, suitable for
 * logging systems, monitoring dashboards, or automated processing.
 *
 * @template T - The item type
 * @param summary - The validation summary to convert
 * @returns JSON-serializable object with validation details
 */
export function generateJSONReport<T>(summary: ValidationSummary<T>): {
  status: 'success' | 'partial' | 'failure';
  totalItems: number;
  validCount: number;
  invalidCount: number;
  successRate: number;
  errors: Array<{
    index: number;
    issues: Array<{
      path: string;
      message: string;
      code: string;
    }>;
  }>;
} {
  const status =
    summary.allValid
      ? 'success'
      : summary.validCount > 0
      ? 'partial'
      : 'failure';

  const errors = summary.invalidItems.map(({ index, errors }) => ({
    index,
    issues: errors.errors.map((err) => ({
      path: err.path.join('.'),
      message: err.message,
      code: err.code,
    })),
  }));

  return {
    status,
    totalItems: summary.totalItems,
    validCount: summary.validCount,
    invalidCount: summary.invalidCount,
    successRate: (summary.validCount / summary.totalItems) * 100,
    errors,
  };
}

// ============================================================================
// Batch Operation Helpers
// ============================================================================

/**
 * Validates and writes items in batches with progress tracking
 *
 * @param items - Items to validate and write
 * @param schema - Validation schema
 * @param writeFn - Function that writes a single item to Firebase
 * @param batchSize - Number of items to write per batch (default: 10)
 * @param onProgress - Optional callback for progress updates
 *
 * @example
 * ```typescript
 * await validateAndWriteBatch(
 *   weapons,
 *   weaponSchema,
 *   async (weapon) => await db.collection('weapons').add(weapon),
 *   10,
 *   (progress) => console.log(`Progress: ${progress.written}/${progress.total}`)
 * );
 * ```
 */
export async function validateAndWriteBatch<T>(
  items: unknown[],
  schema: z.ZodSchema<T>,
  writeFn: (item: T) => Promise<void>,
  batchSize = 10,
  onProgress?: (progress: {
    total: number;
    validated: number;
    written: number;
    failed: number;
  }) => void
): Promise<{
  totalValidated: number;
  successfulWrites: number;
  failedWrites: number;
  validationErrors: number;
}> {
  // First, validate all items
  const validationResult = validateBeforeWrite(items, schema);

  if (!validationResult.allValid) {
    console.warn(
      `⚠️  ${validationResult.invalidCount} items failed validation and will be skipped`
    );
  }

  // Write valid items in batches
  const validItems = validationResult.validItems;
  let successfulWrites = 0;
  let failedWrites = 0;

  for (let i = 0; i < validItems.length; i += batchSize) {
    const batch = validItems.slice(i, i + batchSize);

    const results = await Promise.allSettled(
      batch.map((item) => writeFn(item))
    );

    successfulWrites += results.filter((r) => r.status === 'fulfilled').length;
    failedWrites += results.filter((r) => r.status === 'rejected').length;

    if (onProgress) {
      onProgress({
        total: items.length,
        validated: validItems.length,
        written: successfulWrites,
        failed: failedWrites,
      });
    }
  }

  return {
    totalValidated: validItems.length,
    successfulWrites,
    failedWrites,
    validationErrors: validationResult.invalidCount,
  };
}
