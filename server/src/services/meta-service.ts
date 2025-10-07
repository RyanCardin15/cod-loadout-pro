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

      // If no weapons found, return mock data
      if (weapons.length === 0) {
        return this.getMockMeta(game, category);
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
      console.error('Error generating meta from weapons, using mock data:', error);
      return this.getMockMeta(game, category);
    }
  }

  private getMockMeta(game?: string, category?: string) {
    return {
      tiers: {
        S: [
          { id: '1', name: 'SVA 545', category: 'AR', usage: 32.5, winRate: 54.2 },
          { id: '2', name: 'RAM-9', category: 'SMG', usage: 28.3, winRate: 52.8 },
          { id: '3', name: 'Holger 26', category: 'LMG', usage: 24.1, winRate: 51.5 }
        ],
        A: [
          { id: '4', name: 'MCW', category: 'AR', usage: 18.7, winRate: 50.2 },
          { id: '5', name: 'Superi 46', category: 'SMG', usage: 15.2, winRate: 49.8 },
          { id: '6', name: 'Pulemyot 762', category: 'LMG', usage: 12.4, winRate: 48.5 }
        ],
        B: [
          { id: '7', name: 'MTZ-556', category: 'AR', usage: 8.3, winRate: 47.2 },
          { id: '8', name: 'Striker', category: 'SMG', usage: 6.7, winRate: 46.8 }
        ],
        C: [],
        D: []
      },
      topLoadouts: [],
      recentChanges: [
        'SVA 545 buffed - now S-tier in Warzone',
        'RAM-9 mobility increased by 5%',
        'Holger 26 damage range extended',
        'MCW recoil pattern improved'
      ],
      lastUpdated: new Date().toISOString(),
      mode: game || 'All Games'
    };
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