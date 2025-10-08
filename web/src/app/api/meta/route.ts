import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase/admin';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const game = searchParams.get('game') || 'MW3';

    // Get latest meta snapshot
    const snapshotQuery = await db()
      .collection('meta_snapshots')
      .where('game', '==', game)
      .orderBy('date', 'desc')
      .limit(1)
      .get();

    if (snapshotQuery.empty) {
      // If no snapshot, generate one from current weapon data
      const weaponsSnapshot = await db()
        .collection('weapons')
        .where('game', '==', game)
        .orderBy('meta.tier')
        .orderBy('meta.popularity', 'desc')
        .limit(50)
        .get();

      const weapons = weaponsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as any[];

      // Group weapons by tier
      const tiers = {
        S: weapons.filter(w => w.meta.tier === 'S'),
        A: weapons.filter(w => w.meta.tier === 'A'),
        B: weapons.filter(w => w.meta.tier === 'B'),
        C: weapons.filter(w => w.meta.tier === 'C'),
        D: weapons.filter(w => w.meta.tier === 'D'),
      };

      return NextResponse.json({
        meta: {
          game,
          date: new Date().toISOString(),
          tiers,
          topLoadouts: [],
          recentChanges: [],
        },
      });
    }

    const metaSnapshot: any = {
      id: snapshotQuery.docs[0].id,
      ...snapshotQuery.docs[0].data(),
    };

    // Enrich tier data with full weapon details if not already present
    if (metaSnapshot.tiers) {
      const enrichedTiers: any = {};

      for (const [tier, weapons] of Object.entries(metaSnapshot.tiers)) {
        const weaponArray = weapons as any[];
        if (weaponArray.length > 0 && !weaponArray[0].stats) {
          // Weapons need enrichment - fetch full details
          const weaponIds = weaponArray.map((w: any) => w.id);
          const weaponDocs = await Promise.all(
            weaponIds.map(id => db().collection('weapons').doc(id).get())
          );
          enrichedTiers[tier] = weaponDocs
            .filter(doc => doc.exists)
            .map(doc => ({ id: doc.id, ...doc.data() }));
        } else {
          enrichedTiers[tier] = weaponArray;
        }
      }

      metaSnapshot.tiers = enrichedTiers;
    }

    return NextResponse.json({ meta: metaSnapshot });
  } catch (error) {
    console.error('Error fetching meta:', error);
    return NextResponse.json(
      { error: 'Failed to fetch meta data' },
      { status: 500 }
    );
  }
}
