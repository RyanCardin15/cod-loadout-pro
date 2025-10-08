import { db } from '../firebase/admin.js';
import { Weapon } from '../models/weapon.model.js';

export class MetaService {
  async getCurrentMeta(params: {
    game?: string;
    category?: string;
    mode?: string;
  }) {
    const { game, category, mode } = params;

    // Get latest meta snapshot
    let metaQuery: any = db().collection('meta_snapshots');

    if (game) {
      metaQuery = metaQuery.where('game', '==', game);
    }

    metaQuery = metaQuery.orderBy('date', 'desc').limit(1);

    const snapshot = await metaQuery.get();
    if (snapshot.empty) {
      // Fallback to generating meta from current weapon data
      return this.generateMetaFromWeapons(game, category);
    }

    const metaSnapshot = snapshot.docs[0].data();

    // Filter by category if specified
    let tiers = metaSnapshot.tiers || {};
    if (category) {
      tiers = this.filterTiersByCategory(tiers, category);
    }

    return {
      tiers,
      topLoadouts: metaSnapshot.topLoadouts || [],
      recentChanges: metaSnapshot.recentChanges || [],
      lastUpdated: metaSnapshot.date,
      mode: mode || 'General'
    };
  }

  private async generateMetaFromWeapons(game?: string, category?: string) {
    try {
      let weaponQuery: any = db().collection('weapons');

      if (game) {
        weaponQuery = weaponQuery.where('game', '==', game);
      }
      if (category) {
        weaponQuery = weaponQuery.where('category', '==', category);
      }

      const snapshot = await weaponQuery.get();
      const weapons = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Weapon));

      // If no weapons found, return empty tiers with helpful message
      if (weapons.length === 0) {
        console.warn(`[MetaService] No weapons found for game: ${game}, category: ${category}`);
        return {
          tiers: { S: [], A: [], B: [], C: [], D: [] },
          topLoadouts: [],
          recentChanges: ['No meta data available - database needs population'],
          lastUpdated: new Date().toISOString(),
          mode: 'General'
        };
      }

      // Group by tier
      const tiers = {
        S: weapons.filter(w => w.meta.tier === 'S'),
        A: weapons.filter(w => w.meta.tier === 'A'),
        B: weapons.filter(w => w.meta.tier === 'B'),
        C: weapons.filter(w => w.meta.tier === 'C'),
        D: weapons.filter(w => w.meta.tier === 'D')
      };

      // Add usage statistics
      Object.keys(tiers).forEach(tier => {
        tiers[tier as keyof typeof tiers] = tiers[tier as keyof typeof tiers].map((w: Weapon) => ({
          id: w.id,
          name: w.name,
          category: w.category,
          usage: w.meta.popularity,
          winRate: w.meta.winRate
        })) as any;
      });

      return {
        tiers,
        topLoadouts: [],
        recentChanges: ['Meta generated from current weapon statistics'],
        lastUpdated: new Date().toISOString(),
        mode: 'General'
      };
    } catch (error) {
      console.error('[MetaService] Error generating meta from weapons:', error);
      throw new Error(`Failed to generate meta data: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }


  private filterTiersByCategory(tiers: any, category: string) {
    const filteredTiers: any = {};

    Object.keys(tiers).forEach(tier => {
      filteredTiers[tier] = tiers[tier].filter((weapon: any) => weapon.category === category);
    });

    return filteredTiers;
  }

  async getHistoricalMeta(days: number = 7) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    const snapshot = await db()
      .collection('meta_snapshots')
      .where('date', '>=', cutoffDate.toISOString())
      .orderBy('date', 'desc')
      .get();

    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  }

  async saveMetaSnapshot(metaData: any) {
    await db()
      .collection('meta_snapshots')
      .add({
        ...metaData,
        date: new Date().toISOString()
      });
  }

  async getTopLoadouts(game?: string, limit: number = 10) {
    let loadoutQuery: any = db().collection('loadouts');

    if (game) {
      loadoutQuery = loadoutQuery.where('game', '==', game);
    }

    // Sort by favorites count
    loadoutQuery = loadoutQuery.orderBy('favorites', 'desc').limit(limit);

    const snapshot = await loadoutQuery.get();
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  }

  async updateWeaponMeta(weaponId: string, metaUpdates: any) {
    await db()
      .collection('weapons')
      .doc(weaponId)
      .update({
        meta: metaUpdates,
        'meta.lastUpdated': new Date().toISOString()
      });
  }
}