import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase/admin';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const game = searchParams.get('game');
    const category = searchParams.get('category');
    const limit = parseInt(searchParams.get('limit') || '50');

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

    return NextResponse.json({ weapons });
  } catch (error) {
    console.error('Error fetching weapons:', error);
    return NextResponse.json(
      { error: 'Failed to fetch weapons' },
      { status: 500 }
    );
  }
}
