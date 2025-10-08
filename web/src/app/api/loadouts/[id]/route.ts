import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase/admin';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const loadoutId = params.id;

    const doc = await db().collection('loadouts').doc(loadoutId).get();

    if (!doc.exists) {
      return NextResponse.json(
        { error: 'Loadout not found' },
        { status: 404 }
      );
    }

    const loadout = {
      id: doc.id,
      ...doc.data(),
    };

    return NextResponse.json({ loadout });
  } catch (error) {
    console.error('Error fetching loadout:', error);
    return NextResponse.json(
      { error: 'Failed to fetch loadout' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const loadoutId = params.id;

    await db().collection('loadouts').doc(loadoutId).delete();

    return NextResponse.json(
      { message: 'Loadout deleted successfully' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error deleting loadout:', error);
    return NextResponse.json(
      { error: 'Failed to delete loadout' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const loadoutId = params.id;
    const body = await request.json();

    const updateData = {
      ...body,
      updatedAt: new Date().toISOString(),
    };

    await db().collection('loadouts').doc(loadoutId).update(updateData);

    const updatedDoc = await db().collection('loadouts').doc(loadoutId).get();

    return NextResponse.json({
      loadout: { id: updatedDoc.id, ...updatedDoc.data() },
      message: 'Loadout updated successfully'
    });
  } catch (error) {
    console.error('Error updating loadout:', error);
    return NextResponse.json(
      { error: 'Failed to update loadout' },
      { status: 500 }
    );
  }
}
