import { NextRequest, NextResponse } from 'next/server';

import { InternalServerError, ServiceUnavailableError } from '@/lib/api/errors';
import { createSuccessResponse, validateQuery } from '@/lib/api/middleware';
import { RATE_LIMITS, withRateLimit } from '@/lib/api/rateLimit';
import { db, FirebaseAdminError } from '@/lib/firebase/admin';
import { weaponQuerySchema } from '@/lib/validation/schemas';
import type { WeaponsResponse } from '@/types';

// Force dynamic rendering to prevent static generation during build
export const dynamic = 'force-dynamic';

/**
 * GET /api/weapons
 *
 * Fetch weapons with optional filtering
 *
 * @param game - Filter by game (MW3, Warzone, BO6, MW2)
 * @param category - Filter by category (AR, SMG, etc.)
 * @param limit - Maximum results (1-100, default: 50)
 */
export const GET = withRateLimit(
  async (request: NextRequest) => {
    // Validate query parameters
    const { game, category, limit } = validateQuery(request, weaponQuerySchema);

    try {
      let weaponQuery: any = db().collection('weapons');

      // Apply filters
      if (game) {
        weaponQuery = weaponQuery.where('game', '==', game);
      }
      if (category) {
        weaponQuery = weaponQuery.where('category', '==', category);
      }

      // Sort by popularity and limit
      weaponQuery = weaponQuery.orderBy('meta.popularity', 'desc').limit(limit);

      const snapshot = await weaponQuery.get();
      const weapons = snapshot.docs.map((doc: any) => ({
        id: doc.id,
        ...doc.data(),
      }));

      const response: WeaponsResponse = { weapons };
      return createSuccessResponse(response);
    } catch (error) {
      if (error instanceof FirebaseAdminError) {
        throw new ServiceUnavailableError(
          'Database',
          'Firebase Admin is not properly configured. Please check server environment variables.'
        );
      }
      throw new InternalServerError('Failed to fetch weapons', { error });
    }
  },
  'GET:/api/weapons',
  RATE_LIMITS.GENEROUS
);

/**
 * Handle CORS preflight
 */
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}
