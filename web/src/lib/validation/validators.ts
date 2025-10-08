/**
 * Validation helper functions
 *
 * This module provides utility functions for safe data validation
 * using Zod schemas. These helpers provide consistent error handling
 * and logging across the application.
 */

import { z, ZodError, ZodSchema } from 'zod';
import { logger } from '@/lib/logger';

/**
 * Result type for safe validation
 */
export type ValidationResult<T> =
  | { success: true; data: T }
  | { success: false; error: string; details: Array<{ field: string; message: string }> };

/**
 * Safely validate data against a Zod schema
 *
 * @param schema - Zod schema to validate against
 * @param data - Data to validate
 * @param context - Optional context for logging
 * @returns Validation result with typed data or error details
 *
 * @example
 * ```typescript
 * const result = safeValidate(weaponSchema, rawData, 'API:weapons');
 * if (result.success) {
 *   // Use result.data with full type safety
 *   console.log(result.data.name);
 * } else {
 *   // Handle result.error and result.details
 *   console.error(result.error);
 * }
 * ```
 */
export function safeValidate<T>(
  schema: ZodSchema<T>,
  data: unknown,
  context?: string
): ValidationResult<T> {
  try {
    const validatedData = schema.parse(data);
    return { success: true, data: validatedData };
  } catch (error) {
    if (error instanceof ZodError) {
      const details = error.errors.map((err) => ({
        field: err.path.join('.'),
        message: err.message,
      }));

      const errorMessage = `Validation failed: ${details.map((d) => `${d.field}: ${d.message}`).join(', ')}`;

      if (context) {
        logger.warn(`Validation error in ${context}`, { details });
      }

      return {
        success: false,
        error: errorMessage,
        details,
      };
    }

    // Non-Zod errors (shouldn't happen but handle gracefully)
    const errorMessage = error instanceof Error ? error.message : 'Unknown validation error';
    logger.error(`Unexpected validation error${context ? ` in ${context}` : ''}`, { error });

    return {
      success: false,
      error: errorMessage,
      details: [{ field: 'unknown', message: errorMessage }],
    };
  }
}

/**
 * Validate data and throw on error
 *
 * Useful when you want to fail fast and let error boundaries handle the error
 *
 * @param schema - Zod schema to validate against
 * @param data - Data to validate
 * @param context - Optional context for error messages
 * @returns Validated data with full type safety
 * @throws ValidationError with formatted details
 *
 * @example
 * ```typescript
 * try {
 *   const weapon = validateOrThrow(weaponSchema, rawData, 'API:weapons');
 *   // Use weapon with full type safety
 * } catch (error) {
 *   // Handle validation error
 * }
 * ```
 */
export function validateOrThrow<T>(schema: ZodSchema<T>, data: unknown, context?: string): T {
  const result = safeValidate(schema, data, context);

  if (!result.success) {
    throw new ValidationError(result.error, result.details, context);
  }

  return result.data;
}

/**
 * Validate array of data items
 *
 * @param schema - Zod schema for individual items
 * @param data - Array of data to validate
 * @param context - Optional context for logging
 * @returns Array of validation results
 *
 * @example
 * ```typescript
 * const results = validateArray(weaponSchema, rawWeapons, 'Firebase:weapons');
 * const validWeapons = results.filter(r => r.success).map(r => r.data);
 * const invalidCount = results.filter(r => !r.success).length;
 * ```
 */
export function validateArray<T>(
  schema: ZodSchema<T>,
  data: unknown[],
  context?: string
): ValidationResult<T>[] {
  return data.map((item, index) => {
    const itemContext = context ? `${context}[${index}]` : `item[${index}]`;
    return safeValidate(schema, item, itemContext);
  });
}

/**
 * Validate array and filter out invalid items
 *
 * Useful for scraped data where some items may be malformed
 *
 * @param schema - Zod schema for individual items
 * @param data - Array of data to validate
 * @param context - Optional context for logging
 * @returns Object with valid items and error count
 *
 * @example
 * ```typescript
 * const { validItems, errorCount } = validateAndFilter(weaponSchema, scrapedData, 'Scraper:weapons');
 * logger.info(`Validated ${validItems.length} weapons, ${errorCount} errors`);
 * ```
 */
export function validateAndFilter<T>(
  schema: ZodSchema<T>,
  data: unknown[],
  context?: string
): { validItems: T[]; errorCount: number; errors: Array<{ index: number; details: string }> } {
  const results = validateArray(schema, data, context);

  const validItems = results.filter((r): r is { success: true; data: T } => r.success).map((r) => r.data);

  const errors = results
    .map((r, index) => ({ result: r, index }))
    .filter((item): item is { result: { success: false; error: string; details: any[] }; index: number } =>
      !item.result.success
    )
    .map(({ result, index }) => ({
      index,
      details: result.error,
    }));

  if (errors.length > 0 && context) {
    logger.warn(`Filtered out ${errors.length} invalid items from ${context}`, {
      errorCount: errors.length,
      totalCount: data.length,
      validCount: validItems.length,
    });
  }

  return {
    validItems,
    errorCount: errors.length,
    errors,
  };
}

/**
 * Partial validation for updates
 *
 * Validates only the fields that are present in the data
 *
 * @param schema - Zod schema to validate against
 * @param data - Partial data to validate
 * @param context - Optional context for logging
 * @returns Validation result with typed partial data
 *
 * @example
 * ```typescript
 * const result = validatePartial(weaponSchema, { name: 'New Name' }, 'Update:weapon');
 * if (result.success) {
 *   // Update only the validated fields
 * }
 * ```
 */
export function validatePartial<T extends z.ZodObject<any>>(
  schema: T,
  data: unknown,
  context?: string
): ValidationResult<Partial<z.infer<T>>> {
  return safeValidate(schema.partial(), data, context);
}

/**
 * Custom validation error class
 */
export class ValidationError extends Error {
  constructor(
    message: string,
    public details: Array<{ field: string; message: string }>,
    public context?: string
  ) {
    super(message);
    this.name = 'ValidationError';
    Object.setPrototypeOf(this, ValidationError.prototype);
  }

  /**
   * Format error for logging
   */
  toJSON() {
    return {
      name: this.name,
      message: this.message,
      context: this.context,
      details: this.details,
    };
  }
}

/**
 * Type guard to check if an error is a ValidationError
 */
export function isValidationError(error: unknown): error is ValidationError {
  return error instanceof ValidationError;
}

/**
 * Validate Firebase document data
 *
 * Helper specifically for validating data from Firebase
 *
 * @param schema - Zod schema to validate against
 * @param doc - Firebase document or data
 * @param collection - Collection name for context
 * @returns Validation result
 */
export function validateFirebaseDoc<T>(
  schema: ZodSchema<T>,
  doc: { id: string; data: () => unknown } | unknown,
  collection?: string
): ValidationResult<T> {
  const data = typeof doc === 'object' && doc !== null && 'data' in doc
    ? (doc as { data: () => unknown }).data()
    : doc;

  const context = collection ? `Firebase:${collection}` : 'Firebase';
  return safeValidate(schema, data, context);
}

/**
 * Validate and sanitize user input
 *
 * Trims strings and removes null/undefined values before validation
 *
 * @param schema - Zod schema to validate against
 * @param data - User input data
 * @param context - Optional context for logging
 * @returns Validation result
 */
export function validateUserInput<T>(
  schema: ZodSchema<T>,
  data: unknown,
  context?: string
): ValidationResult<T> {
  // Sanitize the input
  const sanitized = sanitizeInput(data);
  return safeValidate(schema, sanitized, context || 'UserInput');
}

/**
 * Recursively sanitize input data
 */
function sanitizeInput(data: unknown): unknown {
  if (data === null || data === undefined) {
    return undefined;
  }

  if (typeof data === 'string') {
    return data.trim();
  }

  if (Array.isArray(data)) {
    return data.map(sanitizeInput);
  }

  if (typeof data === 'object') {
    const sanitized: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(data)) {
      const sanitizedValue = sanitizeInput(value);
      if (sanitizedValue !== undefined) {
        sanitized[key] = sanitizedValue;
      }
    }
    return sanitized;
  }

  return data;
}
