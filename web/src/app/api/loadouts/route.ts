import { NextRequest, NextResponse } from 'next/server';

import { db, FirebaseAdminError } from '@/lib/firebase/admin';
import { validateLoadoutAttachments } from '@/lib/firebase/attachments';
import { validateLoadoutWeapons } from '@/lib/firebase/weapons';
import { logger } from '@/lib/logger';
import { detectXSSInObject, sanitizeLoadout } from '@/lib/security/sanitize';
import { handleApiError, validateBody, validateQuery } from '@/lib/utils/validation';
import {
  createLoadoutInputSchema as createLoadoutSchema,
  loadoutQuerySchema,
} from '@/lib/validation/schemas';
import type { LoadoutResponse, LoadoutsResponse } from '@/types';

// Force dynamic rendering to prevent static generation during build
export const dynamic = 'force-dynamic';

/**
 * GET /api/loadouts
 *
 * Fetch user loadouts with optional filtering
 *
 * @param userId - Filter by user ID
 * @param game - Filter by game (MW3, Warzone, BO6, MW2)
 * @param limit - Maximum results (1-100, default: 20)
 */
export async function GET(request: NextRequest) {
  try {
    // Validate query parameters
    const { userId, game, limit } = validateQuery(request, loadoutQuerySchema);

    let loadoutQuery: any = db().collection('loadouts');

    // Apply filters
    if (userId) {
      loadoutQuery = loadoutQuery.where('userId', '==', userId);
    }
    if (game) {
      loadoutQuery = loadoutQuery.where('game', '==', game);
    }

    // Sort by most recent and limit
    loadoutQuery = loadoutQuery.orderBy('updatedAt', 'desc').limit(limit);

    const snapshot = await loadoutQuery.get();
    const loadouts = snapshot.docs.map((doc: any) => ({
      id: doc.id,
      ...doc.data(),
    }));

    const response: LoadoutsResponse = { loadouts };
    return NextResponse.json(response);
  } catch (error) {
    if (error instanceof FirebaseAdminError) {
      return NextResponse.json(
        {
          error: 'Database connection failed',
          details: error.message
        },
        { status: 503 }
      );
    }
    return handleApiError(error);
  }
}

/**
 * POST /api/loadouts
 *
 * Create a new user loadout
 *
 * @body CreateLoadoutInput - Loadout data to create
 * @returns Created loadout with generated ID
 */
export async function POST(request: NextRequest) {
  try {
    // Validate request body
    const validatedData = await validateBody(request, createLoadoutSchema);

    // Detect XSS attempts for logging
    const xssDetection = detectXSSInObject(validatedData);
    if (xssDetection.detected) {
      logger.apiError('POST', '/api/loadouts', {
        message: 'XSS attempt detected',
        fields: xssDetection.fields,
      });
    }

    // Sanitize all user input
    const sanitizedData = sanitizeLoadout(validatedData);

    // Validate weapon references exist in database
    const weaponValidation = await validateLoadoutWeapons(sanitizedData);
    if (!weaponValidation.valid) {
      return NextResponse.json(
        {
          error: 'Invalid weapon references',
          details: `The following weapon IDs do not exist: ${weaponValidation.invalidIds.join(', ')}`,
          invalidWeapons: weaponValidation.invalidIds,
        },
        { status: 400 }
      );
    }

    // Validate attachment references exist in database
    const attachmentValidation = await validateLoadoutAttachments(sanitizedData);
    if (!attachmentValidation.valid) {
      return NextResponse.json(
        {
          error: 'Invalid attachment references',
          details: `The following attachment IDs do not exist: ${attachmentValidation.invalidIds.join(', ')}`,
          invalidAttachments: attachmentValidation.invalidIds,
        },
        { status: 400 }
      );
    }

    const loadoutData = {
      ...sanitizedData,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      favorites: 0,
    };

    const docRef = await db().collection('loadouts').add(loadoutData);

    const response: LoadoutResponse = {
      loadout: { id: docRef.id, ...loadoutData } as any,
      message: 'Loadout created successfully'
    };

    return NextResponse.json(response, { status: 201 });
  } catch (error) {
    if (error instanceof FirebaseAdminError) {
      return NextResponse.json(
        {
          error: 'Database connection failed',
          details: error.message
        },
        { status: 503 }
      );
    }
    return handleApiError(error);
  }
}
