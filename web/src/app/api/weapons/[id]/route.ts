import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase/admin';

export async function GET(
  request: NextRequest,
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
    console.error('Error fetching weapon:', error);
    return NextResponse.json(
      { error: 'Failed to fetch weapon' },
      { status: 500 }
    );
  }
}
