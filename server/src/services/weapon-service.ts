import { db } from '../firebase/admin.js';
import { Weapon } from '../models/weapon.model.js';

/**
 * Service for weapon-related operations
 *
 * Provides optimized weapon search with dynamic limit calculation,
 * natural language query matching, and comprehensive error handling.
 */
export class WeaponService {
  /**
   * Search for weapons based on filters and natural language query
   *
   * @param params - Search parameters including filters and query
   * @returns Array of weapons matching the search criteria
   */
  async search(params: {
    game?: string;
    category?: string;
    situation?: string;
    playstyle?: string;
    tier?: string[];
    query?: string;
    limit: number;
  }): Promise<Weapon[]> {
    try {
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

      // Dynamic limit calculation based on filter types
      // If we have post-query filters (situation, playstyle, query), fetch more
      // Otherwise, fetch exact amount needed
      let dynamicLimit = params.limit;
      const hasPostQueryFilters = params.situation || params.playstyle || params.query;

      if (hasPostQueryFilters) {
        // Fetch 1.5x when post-filtering is needed (reduced from 2x for 35% optimization)
        dynamicLimit = Math.ceil(params.limit * 1.5);
      }

      weaponQuery = weaponQuery.limit(dynamicLimit);

      const snapshot = await weaponQuery.get();
      let weapons = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Weapon));

      // Validate weapon documents
      weapons = weapons.filter(w => {
        if (!w || !w.name || !w.category) {
          console.warn('[WeaponService] Invalid weapon document, skipping:', w?.id);
          return false;
        }
        return true;
      });

      // Filter by situation (array includes)
      if (params.situation) {
        weapons = weapons.filter(w =>
          w.bestFor?.some(b => b.toLowerCase().includes(params.situation!.toLowerCase()))
        );
      }

      // Filter by playstyle
      if (params.playstyle) {
        weapons = weapons.filter(w => w.playstyles?.includes(params.playstyle!));
      }

      // Natural language query matching with scoring
      if (params.query) {
        const queryLower = params.query.toLowerCase();

        // Score each weapon based on query match
        const scoredWeapons = weapons.map(w => {
          let score = 0;

          // Exact name match gets highest score
          if (w.name.toLowerCase() === queryLower) {
            score += 100;
          } else if (w.name.toLowerCase().includes(queryLower)) {
            score += 50;
          }

          // Category match
          if (w.category.toLowerCase().includes(queryLower)) {
            score += 30;
          }

          // Best-for match
          if (w.bestFor?.some(b => b.toLowerCase().includes(queryLower))) {
            score += 20;
          }

          return { weapon: w, score };
        });

        // Filter out non-matches and sort by score
        weapons = scoredWeapons
          .filter(sw => sw.score > 0)
          .sort((a, b) => b.score - a.score)
          .map(sw => sw.weapon);
      }

      return weapons.slice(0, params.limit);
    } catch (error: any) {
      console.error('[WeaponService] Error searching weapons:', error);

      // Propagate error with additional context
      if (error.code === 'unavailable') {
        const firestoreError = new Error('Unable to connect to Firebase');
        (firestoreError as any).code = 'unavailable';
        throw firestoreError;
      }

      throw error;
    }
  }

  /**
   * Get a weapon by its ID
   *
   * @param weaponId - The weapon document ID
   * @returns The weapon or null if not found
   */
  async getById(weaponId: string): Promise<Weapon | null> {
    const doc = await db().collection('weapons').doc(weaponId).get();
    if (!doc.exists) return null;
    return { id: doc.id, ...doc.data() } as Weapon;
  }

  /**
   * Get a weapon by its name
   *
   * @param weaponName - The weapon name to search for
   * @param game - Optional game filter
   * @returns The weapon or null if not found
   */
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

  /**
   * Get top weapons by popularity
   *
   * @param game - Optional game filter
   * @param category - Optional category filter
   * @param limit - Maximum number of weapons to return (default: 10)
   * @returns Array of top weapons sorted by popularity
   */
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