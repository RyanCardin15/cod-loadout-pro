import { db } from '../firebase/admin.js';
import { Weapon, Attachment, Loadout } from '../models/weapon.model.js';
import { WeaponService } from './weapon-service.js';

export class LoadoutService {
  private weaponService = new WeaponService();

  async buildLoadout(params: {
    weaponId?: string;
    weaponName?: string;
    game?: string;
    situation?: string;
    playstyle?: string;
    userId: string;
  }): Promise<Loadout> {
    // Get the weapon
    let weapon: Weapon | null;
    if (params.weaponId) {
      weapon = await this.weaponService.getById(params.weaponId);
    } else {
      weapon = await this.weaponService.getByName(params.weaponName!, params.game);
    }

    if (!weapon) {
      throw new Error('Weapon not found');
    }

    // Get optimal attachments based on situation and playstyle
    const attachments = await this.selectOptimalAttachments(
      weapon,
      params.situation,
      params.playstyle
    );

    // Get optimal perks
    const perks = await this.selectOptimalPerks(
      weapon,
      params.game || weapon.game,
      params.playstyle
    );

    // Get optimal equipment
    const equipment = await this.selectOptimalEquipment(
      weapon,
      params.playstyle
    );

    // Build the loadout
    const loadout: Loadout = {
      name: `${weapon.name} ${params.playstyle || 'Optimal'} Build`,
      game: params.game || weapon.game,
      primary: {
        weapon,
        attachments
      },
      perks,
      equipment,
      playstyle: params.playstyle || 'Balanced',
      situation: params.situation ? [params.situation] : weapon.bestFor,
      effectiveRange: this.determineEffectiveRange(weapon, attachments) as "Close" | "Medium" | "Long" | "Versatile",
      difficulty: this.calculateDifficulty(weapon) as "Easy" | "Medium" | "Hard",
      description: this.generateDescription(weapon, attachments, params),
      tips: this.generateTips(weapon, params.playstyle),
      createdAt: new Date().toISOString()
    };

    return loadout;
  }

  private async selectOptimalAttachments(
    weapon: Weapon,
    situation?: string,
    playstyle?: string
  ): Promise<Attachment[]> {
    const attachments: Attachment[] = [];

    // Define attachment priorities based on playstyle
    const priorities = this.getAttachmentPriorities(playstyle);

    // Select best attachment for each slot
    for (const [slot, availableIds] of Object.entries(weapon.attachmentSlots)) {
      if (!availableIds || availableIds.length === 0) continue;

      // Fetch all attachments for this slot
      const slotAttachments = await Promise.all(
        availableIds.map(async (id: string) => {
          const doc = await db().collection('attachments').doc(id).get();
          return { id: doc.id, ...doc.data() } as Attachment;
        })
      );

      // Score each attachment based on priorities
      const scored = slotAttachments.map(att => ({
        attachment: att,
        score: this.scoreAttachment(att, priorities)
      }));

      // Pick the best one
      scored.sort((a, b) => b.score - a.score);
      if (scored[0]) {
        attachments.push(scored[0].attachment);
      }
    }

    // Limit to 5 attachments (CoD standard)
    return attachments.slice(0, 5);
  }

  private getAttachmentPriorities(playstyle?: string): any {
    const priorities: any = {
      Aggressive: { mobility: 3, handling: 3, damage: 2, control: 1 },
      Tactical: { accuracy: 3, control: 3, range: 2, damage: 1 },
      Sniper: { accuracy: 3, range: 3, damage: 2, handling: 1 },
      Support: { control: 3, accuracy: 2, damage: 2, range: 2 }
    };

    return priorities[playstyle || 'Tactical'] || priorities.Tactical;
  }

  private scoreAttachment(attachment: Attachment, priorities: any): number {
    let score = 0;

    for (const [stat, weight] of Object.entries(priorities)) {
      const effect = attachment.effects[stat as keyof typeof attachment.effects] || 0;
      score += effect * (weight as number);
    }

    return score;
  }

  private async selectOptimalPerks(
    weapon: Weapon,
    game: string,
    playstyle?: string
  ): Promise<any> {
    // Load perks for the game
    const perksSnapshot = await db()
      .collection('perks')
      .where('game', '==', game)
      .get();

    const allPerks = perksSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    // Select perks based on playstyle
    const perkSelection: any = {};

    if (playstyle === 'Aggressive') {
      perkSelection.perk1 = 'Double Time';
      perkSelection.perk2 = 'Quick Fix';
      perkSelection.perk3 = 'Tempered';
      perkSelection.perk4 = 'Ghost';
    } else if (playstyle === 'Tactical') {
      perkSelection.perk1 = 'Overkill';
      perkSelection.perk2 = 'Sleight of Hand';
      perkSelection.perk3 = 'Tempered';
      perkSelection.perk4 = 'High Alert';
    } else if (playstyle === 'Sniper') {
      perkSelection.perk1 = 'Overkill';
      perkSelection.perk2 = 'Tracker';
      perkSelection.perk3 = 'Focus';
      perkSelection.perk4 = 'Ghost';
    } else {
      // Default/Support
      perkSelection.perk1 = 'Scavenger';
      perkSelection.perk2 = 'Fast Hands';
      perkSelection.perk3 = 'Tempered';
      perkSelection.perk4 = 'Birdseye';
    }

    return perkSelection;
  }

  private async selectOptimalEquipment(
    weapon: Weapon,
    playstyle?: string
  ): Promise<any> {
    const equipment: any = {};

    if (playstyle === 'Aggressive') {
      equipment.lethal = 'Semtex';
      equipment.tactical = 'Stun Grenade';
      equipment.fieldUpgrade = 'Dead Silence';
    } else if (playstyle === 'Sniper') {
      equipment.lethal = 'Claymore';
      equipment.tactical = 'Snapshot Grenade';
      equipment.fieldUpgrade = 'Munitions Box';
    } else {
      equipment.lethal = 'Frag Grenade';
      equipment.tactical = 'Flash Grenade';
      equipment.fieldUpgrade = 'Trophy System';
    }

    return equipment;
  }

  calculateFinalStats(loadout: Loadout): any {
    const baseStats = { ...loadout.primary.weapon.stats };

    // Apply attachment modifiers
    for (const attachment of loadout.primary.attachments) {
      for (const [stat, modifier] of Object.entries(attachment.effects)) {
        if (baseStats.hasOwnProperty(stat)) {
          baseStats[stat as keyof typeof baseStats] += modifier;
        }
      }
    }

    // Clamp values to 0-100
    for (const stat of Object.keys(baseStats)) {
      baseStats[stat as keyof typeof baseStats] = Math.max(
        0,
        Math.min(100, baseStats[stat as keyof typeof baseStats])
      );
    }

    return baseStats;
  }

  private determineEffectiveRange(weapon: Weapon, attachments: Attachment[]): string {
    const rangeBonus = attachments.reduce((sum, att) => sum + (att.effects.range || 0), 0);
    const finalRange = weapon.stats.range + rangeBonus;

    if (finalRange >= 70) return 'Long';
    if (finalRange >= 40) return 'Medium';
    return 'Close';
  }

  private calculateDifficulty(weapon: Weapon): string {
    const control = weapon.stats.control;
    const accuracy = weapon.stats.accuracy;

    const average = (control + accuracy) / 2;

    if (average >= 70) return 'Easy';
    if (average >= 50) return 'Medium';
    return 'Hard';
  }

  private generateDescription(weapon: Weapon, attachments: Attachment[], params: any): string {
    return `This ${weapon.name} build is optimized for ${params.playstyle || 'balanced'} gameplay. ` +
           `With ${attachments.length} carefully selected attachments, this loadout excels at ` +
           `${params.situation || 'versatile combat situations'}. Perfect for players who want ` +
           `reliable performance in ${weapon.game}.`;
  }

  private generateTips(weapon: Weapon, playstyle?: string): string[] {
    const tips: string[] = [];

    if (weapon.category === 'AR') {
      tips.push('Pre-aim common angles to maximize your TTK advantage');
      tips.push('Tap fire at long ranges for better accuracy');
    } else if (weapon.category === 'SMG') {
      tips.push('Keep moving - your mobility is your greatest asset');
      tips.push('Get in close where you have the advantage');
    } else if (weapon.category === 'Sniper') {
      tips.push('Hold power positions and lanes');
      tips.push('Have a secondary ready for close encounters');
    }

    if (playstyle === 'Aggressive') {
      tips.push('Use slide cancels and jump shots to outplay opponents');
    } else if (playstyle === 'Tactical') {
      tips.push('Use cover and angles to your advantage');
    }

    return tips;
  }

  async getAlternatives(loadout: Loadout): Promise<any> {
    // Return alternative attachments for each slot
    const alternatives: any = {};

    for (const attachment of loadout.primary.attachments) {
      const slot = attachment.slot;
      const availableForSlot = loadout.primary.weapon.attachmentSlots[slot as keyof typeof loadout.primary.weapon.attachmentSlots];

      if (availableForSlot) {
        const alts = await Promise.all(
          availableForSlot.slice(0, 3).map(async (id: string) => {
            const doc = await db().collection('attachments').doc(id).get();
            return { id: doc.id, ...doc.data() };
          })
        );
        alternatives[slot] = alts;
      }
    }

    return alternatives;
  }
}