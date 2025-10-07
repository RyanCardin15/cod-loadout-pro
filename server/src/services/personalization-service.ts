import { db } from '../firebase/admin.js';
import { UserProfile, Weapon } from '../models/weapon.model.js';
import { WeaponService } from './weapon-service.js';

export class PersonalizationService {
  private weaponService = new WeaponService();

  async analyzePlaystyle(params: {
    userId: string;
    description?: string;
    preferences?: any;
  }): Promise<UserProfile['playstyle']> {
    const { description, preferences } = params;

    let primary: 'Aggressive' | 'Tactical' | 'Sniper' | 'Support' = 'Tactical';
    let ranges = { close: 40, medium: 40, long: 20 };
    let pacing: 'Rusher' | 'Balanced' | 'Camper' = 'Balanced';
    const strengths: string[] = [];

    // Analyze description
    if (description) {
      const desc = description.toLowerCase();

      if (desc.includes('rush') || desc.includes('aggressive') || desc.includes('close')) {
        primary = 'Aggressive';
        ranges = { close: 70, medium: 25, long: 5 };
        pacing = 'Rusher';
        strengths.push('Close quarters combat', 'Fast-paced engagements');
      } else if (desc.includes('snip') || desc.includes('long range') || desc.includes('camp')) {
        primary = 'Sniper';
        ranges = { close: 10, medium: 30, long: 60 };
        pacing = 'Camper';
        strengths.push('Long range precision', 'Positioning');
      } else if (desc.includes('support') || desc.includes('team') || desc.includes('utility')) {
        primary = 'Support';
        ranges = { close: 20, medium: 50, long: 30 };
        strengths.push('Team utility', 'Area control');
      }
    }

    // Analyze preferences
    if (preferences) {
      if (preferences.aggressiveness >= 8) {
        primary = 'Aggressive';
        pacing = 'Rusher';
      } else if (preferences.aggressiveness <= 3) {
        pacing = 'Camper';
      }

      if (preferences.favoriteRange === 'Close') {
        ranges.close = Math.max(ranges.close, 60);
        ranges.medium = Math.min(ranges.medium, 30);
        ranges.long = Math.min(ranges.long, 10);
      } else if (preferences.favoriteRange === 'Long') {
        ranges.long = Math.max(ranges.long, 60);
        ranges.medium = Math.min(ranges.medium, 30);
        ranges.close = Math.min(ranges.close, 10);
      }

      // Analyze favorite weapons
      if (preferences.favoriteWeapons?.length > 0) {
        const weaponAnalysis = await this.analyzeWeaponPreferences(preferences.favoriteWeapons);
        if (weaponAnalysis.primaryStyle) {
          primary = weaponAnalysis.primaryStyle;
        }
        if (weaponAnalysis.preferredRanges) {
          ranges = { ...ranges, ...weaponAnalysis.preferredRanges };
        }
        strengths.push(...weaponAnalysis.strengths);
      }
    }

    return {
      primary,
      ranges,
      pacing,
      strengths
    };
  }

  private async analyzeWeaponPreferences(favoriteWeapons: string[]) {
    const weapons: Weapon[] = [];

    for (const weaponName of favoriteWeapons) {
      const weapon = await this.weaponService.getByName(weaponName);
      if (weapon) weapons.push(weapon);
    }

    if (weapons.length === 0) {
      return { primaryStyle: null, preferredRanges: null, strengths: [] };
    }

    // Analyze weapon categories
    const categories = weapons.map(w => w.category);
    const categoryCount = categories.reduce((acc, cat) => {
      acc[cat] = (acc[cat] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Determine primary style from most common category
    let primaryStyle: 'Aggressive' | 'Tactical' | 'Sniper' | 'Support' | null = null;
    const topCategory = Object.keys(categoryCount).reduce((a, b) =>
      categoryCount[a] > categoryCount[b] ? a : b
    );

    if (topCategory === 'SMG') primaryStyle = 'Aggressive';
    else if (topCategory === 'Sniper') primaryStyle = 'Sniper';
    else if (topCategory === 'LMG') primaryStyle = 'Support';
    else primaryStyle = 'Tactical';

    // Calculate preferred ranges from weapon stats
    const avgRange = weapons.reduce((sum, w) => sum + w.stats.range, 0) / weapons.length;
    const avgMobility = weapons.reduce((sum, w) => sum + w.stats.mobility, 0) / weapons.length;

    let preferredRanges = null;
    if (avgRange >= 70) {
      preferredRanges = { close: 15, medium: 35, long: 50 };
    } else if (avgRange <= 40) {
      preferredRanges = { close: 60, medium: 30, long: 10 };
    }

    // Identify strengths
    const strengths: string[] = [];
    if (avgMobility >= 70) strengths.push('High mobility combat');
    if (avgRange >= 70) strengths.push('Long range engagements');
    const avgDamage = weapons.reduce((sum, w) => sum + w.stats.damage, 0) / weapons.length;
    if (avgDamage >= 75) strengths.push('High damage weapons');

    return { primaryStyle, preferredRanges, strengths };
  }

  async getRecommendations(playstyle: UserProfile['playstyle']) {
    // Get weapons that match the playstyle
    const weapons = await this.getRecommendedWeapons(playstyle);

    // Get recommended perks
    const perks = this.getRecommendedPerks(playstyle);

    return {
      weapons,
      perks
    };
  }

  private async getRecommendedWeapons(playstyle: UserProfile['playstyle']): Promise<Weapon[]> {
    let weaponQuery: any = db().collection('weapons');

    // Filter by playstyle
    weaponQuery = weaponQuery.where('playstyles', 'array-contains', playstyle.primary);

    // Order by meta rating
    weaponQuery = weaponQuery.orderBy('meta.popularity', 'desc').limit(10);

    const snapshot = await weaponQuery.get();
    const weapons = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Weapon));

    // Score weapons based on range preferences
    const scoredWeapons = weapons.map(weapon => ({
      ...weapon,
      score: this.scoreWeaponForPlaystyle(weapon, playstyle)
    }));

    scoredWeapons.sort((a, b) => b.score - a.score);
    return scoredWeapons.slice(0, 5);
  }

  private scoreWeaponForPlaystyle(weapon: Weapon, playstyle: UserProfile['playstyle']): number {
    let score = weapon.meta.popularity; // Base score from popularity

    // Range preference matching
    if (playstyle.ranges.close >= 60 && weapon.stats.range <= 40) {
      score += 20; // Prefer close range weapons for close range players
    }
    if (playstyle.ranges.long >= 60 && weapon.stats.range >= 70) {
      score += 20; // Prefer long range weapons for long range players
    }

    // Pacing preference matching
    if (playstyle.pacing === 'Rusher' && weapon.stats.mobility >= 70) {
      score += 15; // High mobility for rushers
    }
    if (playstyle.pacing === 'Camper' && weapon.category === 'Sniper') {
      score += 15; // Snipers for campers
    }

    return score;
  }

  private getRecommendedPerks(playstyle: UserProfile['playstyle']): string[] {
    const perks: string[] = [];

    if (playstyle.primary === 'Aggressive') {
      perks.push('Double Time', 'Quick Fix', 'Dead Silence');
    } else if (playstyle.primary === 'Sniper') {
      perks.push('Ghost', 'Focus', 'High Alert');
    } else if (playstyle.primary === 'Support') {
      perks.push('Scavenger', 'Hardline', 'Trophy System');
    } else {
      perks.push('Overkill', 'Sleight of Hand', 'Tempered');
    }

    return perks;
  }

  async updateUserProfile(userId: string, playstyle: UserProfile['playstyle']) {
    await db()
      .collection('users')
      .doc(userId)
      .set({
        playstyle,
        lastActive: new Date().toISOString()
      }, { merge: true });
  }

  async getUserProfile(userId: string): Promise<UserProfile | null> {
    const doc = await db().collection('users').doc(userId).get();
    if (!doc.exists) return null;
    return { userId, ...doc.data() } as UserProfile;
  }
}