import { NextRequest, NextResponse } from 'next/server';
import { db, FirebaseAdminError } from '@/lib/firebase/admin';
import { validateQuery, handleApiError } from '@/lib/utils/validation';
import { weaponQuerySchema } from '@/lib/validations/weapon.schema';
import type { WeaponsResponse } from '@/types';

export async function GET(request: NextRequest) {
  try {
    // Validate query parameters
    const { game, category, limit } = validateQuery(request, weaponQuerySchema);

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
    return NextResponse.json(response);
  } catch (error) {
    if (error instanceof FirebaseAdminError) {
      return NextResponse.json(
        {
          error: 'Database connection failed. Please ensure Firebase Admin is properly configured.',
          details: error.message
        },
        { status: 503 }
      );
    }
    return handleApiError(error);
  }
}
