/**
 * Route parameter validation schemas and utilities
 *
 * Provides comprehensive validation for dynamic route parameters to prevent
 * injection attacks and ensure data integrity at API boundaries.
 *
 * This module uses Zod schemas to validate route parameters before they are
 * used in database queries, preventing path traversal and injection attacks.
 *
 * @module validation/route-params
 */

import { NextResponse } from 'next/server';
import { z } from 'zod';

// ============================================================================
// Validation Schemas
// ============================================================================

/**
 * Generic Firestore document ID validation schema
 *
 * Validates Firestore document IDs to ensure they meet Firebase requirements
 * and prevent security vulnerabilities:
 * - Alphanumeric characters only (a-zA-Z0-9)
 * - Underscores and hyphens allowed
 * - Length: 1-1500 characters (Firestore limit)
 *
 * This prevents:
 * - Path traversal attacks (../, ./)
 * - SQL injection attempts
 * - Special character exploits
 */
export const firestoreIdSchema = z.object({
  id: z
    .string()
    .min(1, 'ID is required')
    .max(1500, 'ID is too long') // Firestore maximum document path length
    .regex(
      /^[a-zA-Z0-9_-]+$/,
      'ID must contain only alphanumeric characters, underscores, and hyphens'
    ),
});

/**
 * Weapon ID parameter validation schema
 *
 * Validates weapon document IDs in route parameters (e.g., /api/weapons/[id])
 */
export const weaponIdSchema = firestoreIdSchema;

/**
 * Loadout ID parameter validation schema
 *
 * Validates loadout document IDs in route parameters (e.g., /api/loadouts/[id])
 */
export const loadoutIdSchema = firestoreIdSchema;

/**
 * Attachment ID parameter validation schema
 *
 * Validates attachment document IDs in route parameters (e.g., /api/attachments/[id])
 */
export const attachmentIdSchema = firestoreIdSchema;

/**
 * Generic route parameters validation schema
 *
 * Use this for general-purpose route parameter validation
 */
export const routeParamsSchema = firestoreIdSchema;

// ============================================================================
// Type Exports
// ============================================================================

export type FirestoreId = z.infer<typeof firestoreIdSchema>;
export type WeaponId = z.infer<typeof weaponIdSchema>;
export type LoadoutId = z.infer<typeof loadoutIdSchema>;
export type AttachmentId = z.infer<typeof attachmentIdSchema>;

// ============================================================================
// Validation Helper Functions
// ============================================================================

/**
 * Validates route parameters against a Zod schema
 *
 * This is the primary validation function for route parameters. It provides
 * type-safe validation and automatically returns appropriate error responses
 * for invalid parameters.
 *
 * @template T - The Zod schema type
 * @param params - The route parameters object from Next.js
 * @param schema - The Zod schema to validate against
 * @returns Validated parameters or NextResponse with 400 error
 *
 * @example
 * ```typescript
 * // In a Next.js API route:
 * export async function GET(
 *   request: NextRequest,
 *   { params }: { params: { id: string } }
 * ) {
 *   const result = validateRouteParams(params, weaponIdSchema);
 *   if (result instanceof NextResponse) {
 *     return result; // Validation error response
 *   }
 *   const { id } = result; // Safely use validated ID
 *   // ... rest of handler
 * }
 * ```
 */
export function validateRouteParams<T extends z.ZodTypeAny>(
  params: unknown,
  schema: T
): z.infer<T> | NextResponse {
  try {
    return schema.parse(params);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const firstError = error.errors[0];
      return NextResponse.json(
        {
          error: 'Invalid route parameter',
          details: firstError?.message || 'Validation failed',
          field: firstError?.path.join('.') || 'unknown',
        },
        { status: 400 }
      );
    }

    // Handle unexpected errors
    return NextResponse.json(
      {
        error: 'Invalid route parameter',
        details: 'An unexpected validation error occurred',
      },
      { status: 400 }
    );
  }
}

/**
 * Validates and extracts a single ID parameter
 *
 * Convenience function for the common single-ID validation pattern.
 * This simplifies route handlers that only need to validate an ID parameter.
 *
 * @param params - The route parameters object containing an id field
 * @returns The validated ID string or NextResponse with 400 error
 *
 * @example
 * ```typescript
 * // In a Next.js API route:
 * export async function GET(
 *   request: NextRequest,
 *   { params }: { params: { id: string } }
 * ) {
 *   const id = validateIdParam(params);
 *   if (id instanceof NextResponse) {
 *     return id; // Validation error response
 *   }
 *   // Use validated ID safely
 *   const doc = await db.collection('weapons').doc(id).get();
 *   // ...
 * }
 * ```
 */
export function validateIdParam(
  params: { id: string }
): string | NextResponse {
  const result = validateRouteParams(params, firestoreIdSchema);
  if (result instanceof NextResponse) {
    return result;
  }
  return result.id;
}
