import { db, auth } from '../firebase/admin';
import type { UserProfile } from '../models/weapon.model';

export class UserService {
  /**
   * Create a new user profile
   */
  async createUserProfile(userId: string, data: Partial<UserProfile>): Promise<UserProfile> {
    const userRef = db().collection('users').doc(userId);

    const profile: UserProfile = {
      userId,
      displayName: data.displayName,
      playstyle: data.playstyle || {
        primary: 'Tactical',
        ranges: { close: 33, medium: 34, long: 33 },
        pacing: 'Balanced',
        strengths: [],
      },
      games: data.games || ['MW3', 'Warzone'],
      history: {
        queriedWeapons: [],
        savedLoadouts: [],
        playtimeByMode: {},
      },
      favorites: [],
      totalQueries: 0,
      createdAt: new Date().toISOString(),
      lastActive: new Date().toISOString(),
    };

    await userRef.set(profile);
    return profile;
  }

  /**
   * Get user profile by ID
   */
  async getUserProfile(userId: string): Promise<UserProfile | null> {
    const userRef = db().collection('users').doc(userId);
    const doc = await userRef.get();

    if (!doc.exists) {
      return null;
    }

    return doc.data() as UserProfile;
  }

  /**
   * Update user profile
   */
  async updateUserProfile(userId: string, updates: Partial<UserProfile>): Promise<void> {
    const userRef = db().collection('users').doc(userId);

    await userRef.update({
      ...updates,
      lastActive: new Date().toISOString(),
    });
  }

  /**
   * Track user activity (weapon queries, loadout saves)
   */
  async trackActivity(
    userId: string,
    activityType: 'query' | 'save',
    data: string
  ): Promise<void> {
    const userRef = db().collection('users').doc(userId);
    const profile = await this.getUserProfile(userId);

    if (!profile) {
      throw new Error('User profile not found');
    }

    const updates: Partial<UserProfile> = {
      lastActive: new Date().toISOString(),
    };

    if (activityType === 'query') {
      // Add to queried weapons (keep last 50 unique)
      const queriedWeapons = [...new Set([...profile.history.queriedWeapons, data])].slice(-50);
      updates.history = {
        ...profile.history,
        queriedWeapons,
      };
      updates.totalQueries = profile.totalQueries + 1;
    } else if (activityType === 'save') {
      // Add to saved loadouts
      updates.history = {
        ...profile.history,
        savedLoadouts: [...profile.history.savedLoadouts, data],
      };
    }

    await userRef.update(updates);
  }

  /**
   * Add/remove from favorites
   */
  async toggleFavorite(userId: string, loadoutId: string): Promise<boolean> {
    const userRef = db().collection('users').doc(userId);
    const profile = await this.getUserProfile(userId);

    if (!profile) {
      throw new Error('User profile not found');
    }

    const isFavorite = profile.favorites.includes(loadoutId);
    const favorites = isFavorite
      ? profile.favorites.filter((id) => id !== loadoutId)
      : [...profile.favorites, loadoutId];

    await userRef.update({ favorites });

    return !isFavorite; // Return new favorite status
  }

  /**
   * Get user statistics
   */
  async getProfileStats(userId: string) {
    const profile = await this.getUserProfile(userId);

    if (!profile) {
      throw new Error('User profile not found');
    }

    return {
      totalQueries: profile.totalQueries,
      savedLoadouts: profile.history.savedLoadouts.length,
      uniqueWeapons: profile.history.queriedWeapons.length,
      favorites: profile.favorites.length,
      playstyle: profile.playstyle,
      games: profile.games,
      memberSince: profile.createdAt,
      lastActive: profile.lastActive,
    };
  }

  /**
   * Verify Firebase ID token and return user ID
   */
  async verifyToken(idToken: string): Promise<string> {
    try {
      const decodedToken = await auth().verifyIdToken(idToken);
      return decodedToken.uid;
    } catch (error) {
      throw new Error('Invalid authentication token');
    }
  }

  /**
   * Get or create user profile
   */
  async getOrCreateProfile(userId: string, initialData?: Partial<UserProfile>): Promise<UserProfile> {
    let profile = await this.getUserProfile(userId);

    if (!profile) {
      profile = await this.createUserProfile(userId, initialData || {});
    }

    return profile;
  }
}

export const userService = new UserService();
