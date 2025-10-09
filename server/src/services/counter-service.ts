import { db } from '../firebase/admin.js';
import { Weapon } from '../models/weapon.model.js';
import { WeaponService } from './weapon-service.js';

export class CounterService {
  private weaponService = new WeaponService();

  /**
   * Calculates the Levenshtein distance between two strings for fuzzy matching.
   * This is the minimum number of single-character edits (insertions, deletions, or substitutions)
   * required to change one word into the other.
   *
   * @param str1 - First string to compare
   * @param str2 - Second string to compare
   * @returns The edit distance between the two strings
   */
  private calculateLevenshteinDistance(str1: string, str2: string): number {
    const len1 = str1.length;
    const len2 = str2.length;
    const matrix: number[][] = [];

    // Initialize matrix
    for (let i = 0; i <= len1; i++) {
      matrix[i] = [i];
    }
    for (let j = 0; j <= len2; j++) {
      matrix[0][j] = j;
    }

    // Fill matrix
    for (let i = 1; i <= len1; i++) {
      for (let j = 1; j <= len2; j++) {
        const cost = str1[i - 1].toLowerCase() === str2[j - 1].toLowerCase() ? 0 : 1;
        matrix[i][j] = Math.min(
          matrix[i - 1][j] + 1, // deletion
          matrix[i][j - 1] + 1, // insertion
          matrix[i - 1][j - 1] + cost // substitution
        );
      }
    }

    return matrix[len1][len2];
  }

  /**
   * Finds similar weapon names using Levenshtein distance for suggestion purposes.
   *
   * @param weaponName - The weapon name to find similarities for
   * @param game - Optional game filter
   * @param limit - Maximum number of suggestions to return (default: 3)
   * @returns Array of similar weapon names, sorted by similarity
   */
  private async findSimilarWeapons(weaponName: string, game?: string, limit: number = 3): Promise<string[]> {
    try {
      // Get all weapons from database
      let weaponQuery: any = db().collection('weapons');
      if (game) {
        weaponQuery = weaponQuery.where('game', '==', game);
      }

      const snapshot = await weaponQuery.get();
      const allWeapons = snapshot.docs.map(doc => ({
        name: doc.data().name,
        distance: this.calculateLevenshteinDistance(weaponName, doc.data().name)
      }));

      // Sort by similarity and return top matches
      return allWeapons
        .sort((a, b) => a.distance - b.distance)
        .slice(0, limit)
        .map(w => w.name);
    } catch (error) {
      console.error('[CounterService] Error finding similar weapons:', error);
      return [];
    }
  }

  async getWeaponByName(weaponName: string, game?: string): Promise<Weapon> {
    const weapon = await this.weaponService.getByName(weaponName, game);
    if (!weapon) {
      // Find similar weapons for suggestions
      const suggestions = await this.findSimilarWeapons(weaponName, game);

      const error: any = new Error(`Weapon "${weaponName}" not found`);
      error.type = 'ENEMY_WEAPON_NOT_FOUND';
      error.suggestions = suggestions;
      throw error;
    }
    return weapon;
  }

  /**
   * Classifies the threat level of a weapon based on its stats.
   * Uses a 5-tier system: Extreme Threat, High Threat, Moderate Threat, Low Threat, Minimal Threat.
   *
   * @param weapon - The weapon to classify
   * @returns A string describing the threat level
   */
  private classifyThreatLevel(weapon: Weapon): string {
    const { stats, ballistics } = weapon;

    // Calculate overall threat score
    let threatScore = 0;

    // Damage contribution
    if (stats.damage >= 80) threatScore += 3;
    else if (stats.damage >= 60) threatScore += 2;
    else threatScore += 1;

    // Range contribution
    if (stats.range >= 70) threatScore += 3;
    else if (stats.range >= 50) threatScore += 2;
    else threatScore += 1;

    // TTK contribution (lower is more threatening)
    if (ballistics.ttk.min <= 300) threatScore += 3;
    else if (ballistics.ttk.min <= 500) threatScore += 2;
    else threatScore += 1;

    // Control contribution (higher control = more consistent threat)
    if (stats.control >= 80) threatScore += 2;
    else if (stats.control >= 60) threatScore += 1;

    // Classify based on total threat score
    if (threatScore >= 10) return 'Extreme Threat';
    if (threatScore >= 8) return 'High Threat';
    if (threatScore >= 6) return 'Moderate Threat';
    if (threatScore >= 4) return 'Low Threat';
    return 'Minimal Threat';
  }

  async findCounters(params: {
    enemyWeapon: Weapon;
    enemyLoadout?: any;
    userPlaystyle?: string;
    game?: string;
  }): Promise<any> {
    const { enemyWeapon, userPlaystyle, game } = params;

    try {
      // Identify enemy weapon strengths and weaknesses
      const strengths = this.identifyStrengths(enemyWeapon);
      const weaknesses = this.identifyWeaknesses(enemyWeapon);

      // Classify threat level
      const threatLevel = this.classifyThreatLevel(enemyWeapon);

      // Find weapons that exploit weaknesses
      const counterWeapons = await this.findCounterWeapons(enemyWeapon, userPlaystyle, game);

      // Throw error if no counters found
      if (!counterWeapons || counterWeapons.length === 0) {
        const error: any = new Error('No effective counter weapons found');
        error.type = 'NO_COUNTERS_FOUND';
        throw error;
      }

      // Generate strategic advice
      const strategies = this.generateCounterStrategies(enemyWeapon);
      const tacticalAdvice = this.generateTacticalAdvice(enemyWeapon, userPlaystyle);

      return {
        weapons: counterWeapons,
        strategies,
        tacticalAdvice,
        enemyStrengths: strengths,
        enemyWeaknesses: weaknesses,
        threatLevel
      };
    } catch (error: any) {
      // Re-throw structured errors
      if (error.type) {
        throw error;
      }

      // Wrap Firebase errors
      if (error.code === 'unavailable' || error.message?.includes('Firebase')) {
        const firebaseError: any = new Error('Unable to connect to the database');
        firebaseError.type = 'FIREBASE_CONNECTION_ERROR';
        throw firebaseError;
      }

      // Unknown errors
      throw error;
    }
  }

  identifyStrengths(weapon: Weapon): string[] {
    const strengths: string[] = [];

    if (weapon.stats.damage >= 75) strengths.push('High damage output');
    if (weapon.stats.range >= 70) strengths.push('Excellent range');
    if (weapon.stats.mobility >= 75) strengths.push('Superior mobility');
    if (weapon.stats.control >= 80) strengths.push('Easy recoil control');
    if (weapon.ballistics.ttk.min <= 400) strengths.push('Fast time to kill');

    return strengths;
  }

  identifyWeaknesses(weapon: Weapon): string[] {
    const weaknesses: string[] = [];

    if (weapon.stats.damage <= 50) weaknesses.push('Lower damage');
    if (weapon.stats.range <= 40) weaknesses.push('Limited range');
    if (weapon.stats.mobility <= 50) weaknesses.push('Poor mobility');
    if (weapon.stats.control <= 50) weaknesses.push('High recoil');
    if (weapon.ballistics.reloadTime >= 3.0) weaknesses.push('Slow reload');

    return weaknesses;
  }

  private async findCounterWeapons(
    enemyWeapon: Weapon,
    userPlaystyle?: string,
    game?: string
  ): Promise<any[]> {
    try {
      // Get all weapons that can counter this weapon
      let weaponQuery: any = db().collection('weapons');

      if (game) {
        weaponQuery = weaponQuery.where('game', '==', game);
      }

      const snapshot = await weaponQuery.get();

      // Handle empty results gracefully
      if (snapshot.empty) {
        console.warn('[CounterService] No weapons found in database');
        return [];
      }

      const allWeapons = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Weapon));

      // Score each weapon as a counter
      const scoredCounters = allWeapons.map(weapon => ({
        weapon,
        effectiveness: this.calculateCounterEffectiveness(weapon, enemyWeapon),
        reasoning: this.generateCounterReasoning(weapon, enemyWeapon)
      }));

      // Filter by user playstyle if provided
      let filteredCounters = scoredCounters;
      if (userPlaystyle) {
        filteredCounters = scoredCounters.filter(c =>
          c.weapon.playstyles?.includes(userPlaystyle)
        );
      }

      // Sort by effectiveness and return top counters
      filteredCounters.sort((a, b) => b.effectiveness - a.effectiveness);
      const topCounters = filteredCounters.slice(0, 5);

      // Return empty array if no effective counters
      return topCounters.length > 0 ? topCounters : [];
    } catch (error: any) {
      console.error('[CounterService] Error finding counter weapons:', error);

      // Wrap Firebase errors
      if (error.code === 'unavailable' || error.message?.includes('Firebase')) {
        const firebaseError: any = new Error('Unable to connect to the database');
        firebaseError.type = 'FIREBASE_CONNECTION_ERROR';
        throw firebaseError;
      }

      throw error;
    }
  }

  private calculateCounterEffectiveness(counterWeapon: Weapon, enemyWeapon: Weapon): number {
    let effectiveness = 0;

    // Range advantage
    if (counterWeapon.stats.range > enemyWeapon.stats.range + 10) {
      effectiveness += 25;
    }

    // Mobility advantage (for close range counters)
    if (counterWeapon.stats.mobility > enemyWeapon.stats.mobility + 15) {
      effectiveness += 20;
    }

    // TTK advantage
    if (counterWeapon.ballistics.ttk.min < enemyWeapon.ballistics.ttk.min) {
      effectiveness += 20;
    }

    // Damage advantage
    if (counterWeapon.stats.damage > enemyWeapon.stats.damage) {
      effectiveness += 15;
    }

    // Category advantages
    if (enemyWeapon.category === 'Sniper' && counterWeapon.category === 'SMG') {
      effectiveness += 20; // SMGs counter snipers at close range
    }
    if (enemyWeapon.category === 'SMG' && counterWeapon.category === 'AR') {
      effectiveness += 15; // ARs can counter SMGs at medium range
    }

    return Math.min(100, effectiveness);
  }

  private generateCounterReasoning(counterWeapon: Weapon, enemyWeapon: Weapon): string {
    const reasons: string[] = [];

    if (counterWeapon.stats.range > enemyWeapon.stats.range + 10) {
      reasons.push('significant range advantage');
    }
    if (counterWeapon.stats.mobility > enemyWeapon.stats.mobility + 15) {
      reasons.push('superior mobility for repositioning');
    }
    if (counterWeapon.ballistics.ttk.min < enemyWeapon.ballistics.ttk.min) {
      reasons.push('faster time to kill');
    }

    return `Effective due to ${reasons.join(', ')}.`;
  }

  private generateCounterStrategies(enemyWeapon: Weapon): string[] {
    const strategies: string[] = [];

    if (enemyWeapon.category === 'Sniper') {
      strategies.push('Close the distance quickly using cover');
      strategies.push('Use smoke grenades to block sightlines');
      strategies.push('Flank around their position');
    } else if (enemyWeapon.category === 'SMG') {
      strategies.push('Keep your distance and use range advantage');
      strategies.push('Pre-aim common angles');
      strategies.push('Use utility to slow their push');
    } else if (enemyWeapon.category === 'AR') {
      strategies.push('Either get very close or very far');
      strategies.push('Challenge at off-angles');
      strategies.push('Use superior mobility to reposition');
    }

    if (enemyWeapon.stats.mobility <= 50) {
      strategies.push('Use hit-and-run tactics');
    }
    if (enemyWeapon.ballistics.reloadTime >= 3.0) {
      strategies.push('Time your push after they reload');
    }

    return strategies;
  }

  private generateTacticalAdvice(enemyWeapon: Weapon, userPlaystyle?: string): string[] {
    const advice: string[] = [];

    if (userPlaystyle === 'Aggressive') {
      advice.push('Use your speed to get inside their effective range');
      advice.push('Pre-cook grenades before engaging');
    } else if (userPlaystyle === 'Tactical') {
      advice.push('Use utility to control the engagement');
      advice.push('Take map control before challenging');
    } else if (userPlaystyle === 'Sniper') {
      advice.push('Take long angles where you have advantage');
      advice.push('Use claymores to watch your flanks');
    }

    return advice;
  }

  suggestCounterPerks(enemyWeapon: Weapon): string[] {
    const perks: string[] = [];

    if (enemyWeapon.category === 'Sniper') {
      perks.push('Ghost - avoid their surveillance');
      perks.push('Dead Silence - get close undetected');
    } else if (enemyWeapon.stats.damage >= 75) {
      perks.push('Quick Fix - recover health faster');
      perks.push('Stim Shot - immediate health recovery');
    }

    return perks;
  }
}