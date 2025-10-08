import { NextRequest, NextResponse } from 'next/server';

import { db, FirebaseAdminError } from '@/lib/firebase/admin';
import { validateQuery, validateBody, handleApiError } from '@/lib/utils/validation';
import { loadoutQuerySchema, createLoadoutSchema } from '@/lib/validations/loadout.schema';
import type { LoadoutsResponse, LoadoutResponse } from '@/types';

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

    const loadoutData = {
      ...validatedData,
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
