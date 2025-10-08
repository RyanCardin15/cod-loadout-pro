import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase/admin';
import { logger } from '@/lib/logger';

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const weaponId = params.id;

    const doc = await db().collection('weapons').doc(weaponId).get();

    if (!doc.exists) {
      return NextResponse.json(
        { error: 'Weapon not found' },
        { status: 404 }
      );
    }

    const weapon = {
      id: doc.id,
      ...doc.data(),
    };

    return NextResponse.json({ weapon });
  } catch (error) {
    logger.apiError('GET', `/api/weapons/${params.id}`, error);
    return NextResponse.json(
      { error: 'Failed to fetch weapon' },
      { status: 500 }
    );
  }
}
