import { db } from '../firebase/admin.js';
import { Weapon } from '../models/weapon.model.js';
import { WeaponService } from './weapon-service.js';

export class CounterService {
  private weaponService = new WeaponService();

  async getWeaponByName(weaponName: string, game?: string): Promise<Weapon> {
    const weapon = await this.weaponService.getByName(weaponName, game);
    if (!weapon) {
      throw new Error(`Weapon "${weaponName}" not found`);
    }
    return weapon;
  }

  async findCounters(params: {
    enemyWeapon: Weapon;
    enemyLoadout?: any;
    userPlaystyle?: string;
    game?: string;
  }): Promise<any> {
    const { enemyWeapon, userPlaystyle, game } = params;

    // Identify enemy weapon strengths and weaknesses
    const strengths = this.identifyStrengths(enemyWeapon);
    const weaknesses = this.identifyWeaknesses(enemyWeapon);

    // Find weapons that exploit weaknesses
    const counterWeapons = await this.findCounterWeapons(enemyWeapon, userPlaystyle, game);

    // Generate strategic advice
    const strategies = this.generateCounterStrategies(enemyWeapon);
    const tacticalAdvice = this.generateTacticalAdvice(enemyWeapon, userPlaystyle);

    return {
      weapons: counterWeapons,
      strategies,
      tacticalAdvice,
      enemyStrengths: strengths,
      enemyWeaknesses: weaknesses
    };
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
    // Get all weapons that can counter this weapon
    let weaponQuery: any = db().collection('weapons');

    if (game) {
      weaponQuery = weaponQuery.where('game', '==', game);
    }

    const snapshot = await weaponQuery.get();
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
        c.weapon.playstyles.includes(userPlaystyle)
      );
    }

    // Sort by effectiveness and return top counters
    filteredCounters.sort((a, b) => b.effectiveness - a.effectiveness);
    return filteredCounters.slice(0, 5);
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