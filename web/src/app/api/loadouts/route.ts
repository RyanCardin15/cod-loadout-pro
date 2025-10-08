import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase/admin';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get('userId');
    const game = searchParams.get('game');
    const limit = parseInt(searchParams.get('limit') || '20');

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

    return NextResponse.json({ loadouts });
  } catch (error) {
    console.error('Error fetching loadouts:', error);
    return NextResponse.json(
      { error: 'Failed to fetch loadouts' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const loadoutData = {
      ...body,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      favorites: 0,
    };

    const docRef = await db().collection('loadouts').add(loadoutData);

    return NextResponse.json(
      {
        loadout: { id: docRef.id, ...loadoutData },
        message: 'Loadout created successfully'
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating loadout:', error);
    return NextResponse.json(
      { error: 'Failed to create loadout' },
      { status: 500 }
    );
  }
}
