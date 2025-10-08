import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase/admin';
import { logger } from '@/lib/logger';
import { validateIdParam } from '@/lib/validation/route-params';
import { normalizeWeapon } from '@/lib/utils/weapon-normalizer';

// Force dynamic rendering to prevent static generation during build
export const dynamic = 'force-dynamic';

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Validate route parameter
    const weaponId = validateIdParam(params);
    if (weaponId instanceof NextResponse) {
      return weaponId;
    }

    const doc = await db().collection('weapons').doc(weaponId).get();

    if (!doc.exists) {
      return NextResponse.json(
        { error: 'Weapon not found' },
        { status: 404 }
      );
    }

    const rawWeapon = {
      id: doc.id,
      ...doc.data(),
    };

    // Normalize V3 MultiSourceField objects to V1 primitives
    const weapon = normalizeWeapon(rawWeapon as any);

    return NextResponse.json({ weapon });
  } catch (error) {
    logger.apiError('GET', `/api/weapons/${params.id}`, error);
    return NextResponse.json(
      { error: 'Failed to fetch weapon' },
      { status: 500 }
    );
  }
}
