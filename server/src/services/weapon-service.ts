import { db } from '../firebase/admin.js';
import { Weapon } from '../models/weapon.model.js';

export class WeaponService {
  async search(params: {
    game?: string;
    category?: string;
    situation?: string;
    playstyle?: string;
    tier?: string[];
    query?: string;
    limit: number;
  }): Promise<Weapon[]> {
    let weaponQuery: any = db().collection('weapons');

    // Apply filters
    if (params.game) {
      weaponQuery = weaponQuery.where('game', '==', params.game);
    }
    if (params.category) {
      weaponQuery = weaponQuery.where('category', '==', params.category);
    }
    if (params.tier && params.tier.length > 0) {
      weaponQuery = weaponQuery.where('meta.tier', 'in', params.tier);
    }

    // Sort by meta rating (tier + popularity)
    weaponQuery = weaponQuery.orderBy('meta.popularity', 'desc');
    weaponQuery = weaponQuery.limit(params.limit * 2); // Get more for filtering

    const snapshot = await weaponQuery.get();
    let weapons = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Weapon));

    // Filter by situation (array includes)
    if (params.situation) {
      weapons = weapons.filter(w =>
        w.bestFor.some(b => b.toLowerCase().includes(params.situation!.toLowerCase()))
      );
    }

    // Filter by playstyle
    if (params.playstyle) {
      weapons = weapons.filter(w => w.playstyles.includes(params.playstyle!));
    }

    // Natural language query matching
    if (params.query) {
      const queryLower = params.query.toLowerCase();
      weapons = weapons.filter(w =>
        w.name.toLowerCase().includes(queryLower) ||
        w.bestFor.some(b => b.toLowerCase().includes(queryLower)) ||
        w.category.toLowerCase().includes(queryLower)
      );
    }

    return weapons.slice(0, params.limit);
  }

  async getById(weaponId: string): Promise<Weapon | null> {
    const doc = await db().collection('weapons').doc(weaponId).get();
    if (!doc.exists) return null;
    return { id: doc.id, ...doc.data() } as Weapon;
  }

  async getByName(weaponName: string, game?: string): Promise<Weapon | null> {
    let weaponQuery: any = db().collection('weapons').where('name', '==', weaponName);

    if (game) {
      weaponQuery = weaponQuery.where('game', '==', game);
    }

    const snapshot = await weaponQuery.limit(1).get();
    if (snapshot.empty) return null;

    const doc = snapshot.docs[0];
    return { id: doc.id, ...doc.data() } as Weapon;
  }

  async getTopWeapons(game?: string, category?: string, limit: number = 10): Promise<Weapon[]> {
    let weaponQuery: any = db().collection('weapons');

    if (game) {
      weaponQuery = weaponQuery.where('game', '==', game);
    }
    if (category) {
      weaponQuery = weaponQuery.where('category', '==', category);
    }

    weaponQuery = weaponQuery.orderBy('meta.popularity', 'desc').limit(limit);

    const snapshot = await weaponQuery.get();
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Weapon));
  }
}