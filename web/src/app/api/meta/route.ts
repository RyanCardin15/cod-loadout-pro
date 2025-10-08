import { NextRequest, NextResponse } from 'next/server';
import { db, FirebaseAdminError } from '@/lib/firebase/admin';
import { validateQuery, handleApiError } from '@/lib/utils/validation';
import { metaQuerySchema } from '@/lib/validation/schemas';
import type { MetaResponse } from '@/types';
import { normalizeWeapons } from '@/lib/utils/weapon-normalizer';

// Force dynamic rendering to prevent static generation during build
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    // Validate query parameters
    const { game } = validateQuery(request, metaQuerySchema);

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

      const rawWeapons = weaponsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as any[];

      // Normalize V3 to V1 before grouping by tier
      const weapons = normalizeWeapons(rawWeapons);

      // Group weapons by tier (now safe!)
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

    const firstDoc = snapshotQuery.docs[0];
    if (!firstDoc) {
      return NextResponse.json({
        meta: {
          tiers: { S: [], A: [], B: [], C: [], D: [] },
          recentChanges: [],
          proLoadouts: [],
          lastUpdated: new Date().toISOString(),
        },
      });
    }

    const metaSnapshot: any = {
      id: firstDoc.id,
      ...firstDoc.data(),
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
          const rawEnrichedWeapons = weaponDocs
            .filter(doc => doc.exists)
            .map(doc => ({ id: doc.id, ...doc.data() })) as any[];
          // Normalize before adding to tiers
          enrichedTiers[tier] = normalizeWeapons(rawEnrichedWeapons);
        } else {
          enrichedTiers[tier] = weaponArray;
        }
      }

      metaSnapshot.tiers = enrichedTiers;
    }

    const response: MetaResponse = { meta: metaSnapshot };
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
