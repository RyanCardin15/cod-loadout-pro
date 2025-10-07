import { Weapon, Attachment } from '../../../server/src/models/weapon.model';

/**
 * Transform CODArmory weapon data to our schema
 */
export function transformCODArmoryWeapon(weapon: any): Omit<Weapon, 'id'> {
  // CODArmory uses different field names, map them to our schema
  return {
    name: weapon.name || weapon.title,
    game: mapGame(weapon.game || weapon.platform),
    category: mapCategory(weapon.category || weapon.type),

    stats: {
      damage: weapon.stats?.damage || estimateStat(weapon, 'damage'),
      range: weapon.stats?.range || estimateStat(weapon, 'range'),
      accuracy: weapon.stats?.accuracy || estimateStat(weapon, 'accuracy'),
      fireRate: weapon.stats?.fireRate || weapon.stats?.rof || estimateStat(weapon, 'fireRate'),
      mobility: weapon.stats?.mobility || estimateStat(weapon, 'mobility'),
      control: weapon.stats?.control || weapon.stats?.recoil || estimateStat(weapon, 'control'),
      handling: weapon.stats?.handling || weapon.stats?.ads || estimateStat(weapon, 'handling'),
    },

    ballistics: {
      damageRanges: weapon.damageProfile?.ranges || generateDefaultDamageRanges(weapon),
      ttk: weapon.ttk || calculateEstimatedTTK(weapon),
      fireRate: weapon.fireRate || weapon.rpm || 600,
      magazineSize: weapon.magSize || weapon.magazineSize || 30,
      reloadTime: weapon.reloadTime || 2.0,
      adTime: weapon.adsTime || weapon.adTime || 0.25,
    },

    attachmentSlots: {
      optic: weapon.attachments?.optic || [],
      barrel: weapon.attachments?.barrel || [],
      magazine: weapon.attachments?.magazine || [],
      underbarrel: weapon.attachments?.underbarrel || [],
      stock: weapon.attachments?.stock || [],
      laser: weapon.attachments?.laser || [],
      muzzle: weapon.attachments?.muzzle || [],
      rearGrip: weapon.attachments?.rearGrip || weapon.attachments?.grip || [],
    },

    meta: {
      tier: 'C', // Default tier, will be updated by meta scraper
      popularity: 0,
      winRate: 50,
      lastUpdated: new Date().toISOString(),
    },

    bestFor: weapon.bestFor || inferBestFor(weapon),
    playstyles: weapon.playstyles || inferPlaystyles(weapon),
    imageUrl: weapon.image || weapon.imageUrl || '',
    iconUrl: weapon.icon || weapon.iconUrl || '',
  };
}

/**
 * Transform CODArmory attachment data to our schema
 */
export function transformCODArmoryAttachment(attachment: any): Omit<Attachment, 'id'> {
  return {
    name: attachment.name || attachment.title || 'Unknown Attachment',
    slot: attachment.slot || attachment.category || attachment.type || 'other',
    weaponCompatibility: attachment.weapons || attachment.compatibility || [],

    effects: {
      damage: attachment.stats?.damage || 0,
      range: attachment.stats?.range || 0,
      accuracy: attachment.stats?.accuracy || 0,
      fireRate: attachment.stats?.fireRate || attachment.stats?.rof || 0,
      mobility: attachment.stats?.mobility || 0,
      control: attachment.stats?.control || attachment.stats?.recoil || 0,
      handling: attachment.stats?.handling || attachment.stats?.ads || 0,
    },

    pros: attachment.pros || extractPros(attachment),
    cons: attachment.cons || extractCons(attachment),
    imageUrl: attachment.image || attachment.imageUrl || '',
  };
}

// Helper functions

function mapGame(game: string): 'MW3' | 'Warzone' | 'BO6' | 'MW2' {
  const normalized = game?.toLowerCase() || '';

  if (normalized.includes('mw3') || normalized.includes('modern warfare iii')) return 'MW3';
  if (normalized.includes('warzone') || normalized.includes('wz')) return 'Warzone';
  if (normalized.includes('bo6') || normalized.includes('black ops 6')) return 'BO6';
  if (normalized.includes('mw2') || normalized.includes('modern warfare ii')) return 'MW2';

  return 'MW3'; // Default
}

function mapCategory(category: string): 'AR' | 'SMG' | 'LMG' | 'Sniper' | 'Marksman' | 'Shotgun' | 'Pistol' {
  const normalized = category?.toLowerCase() || '';

  if (normalized.includes('assault') || normalized.includes('ar')) return 'AR';
  if (normalized.includes('smg') || normalized.includes('submachine')) return 'SMG';
  if (normalized.includes('lmg') || normalized.includes('light machine')) return 'LMG';
  if (normalized.includes('sniper')) return 'Sniper';
  if (normalized.includes('marksman') || normalized.includes('dmr')) return 'Marksman';
  if (normalized.includes('shotgun')) return 'Shotgun';
  if (normalized.includes('pistol') || normalized.includes('handgun')) return 'Pistol';

  return 'AR'; // Default
}

function estimateStat(weapon: any, statName: string): number {
  // If we have raw values, normalize to 0-100
  const raw = weapon[statName];
  if (typeof raw === 'number') {
    return Math.min(100, Math.max(0, raw));
  }

  // Default reasonable values by category
  const category = mapCategory(weapon.category);
  const defaults: Record<string, Record<string, number>> = {
    AR: { damage: 70, range: 75, accuracy: 80, fireRate: 70, mobility: 60, control: 75, handling: 68 },
    SMG: { damage: 65, range: 50, accuracy: 70, fireRate: 85, mobility: 85, control: 65, handling: 80 },
    LMG: { damage: 75, range: 85, accuracy: 75, fireRate: 65, mobility: 45, control: 60, handling: 50 },
    Sniper: { damage: 95, range: 95, accuracy: 90, fireRate: 40, mobility: 50, control: 50, handling: 45 },
    Marksman: { damage: 80, range: 85, accuracy: 85, fireRate: 55, mobility: 55, control: 70, handling: 60 },
    Shotgun: { damage: 90, range: 35, accuracy: 60, fireRate: 50, mobility: 70, control: 55, handling: 75 },
    Pistol: { damage: 55, range: 40, accuracy: 75, fireRate: 75, mobility: 90, control: 80, handling: 95 },
  };

  return defaults[category]?.[statName] || 50;
}

function generateDefaultDamageRanges(weapon: any): Array<{ range: number; damage: number }> {
  const baseDamage = weapon.damage || estimateStat(weapon, 'damage');
  const category = mapCategory(weapon.category);

  // Generate sensible damage falloff by weapon type
  if (category === 'AR') {
    return [
      { range: 0, damage: baseDamage },
      { range: 25, damage: baseDamage * 0.85 },
      { range: 40, damage: baseDamage * 0.7 },
    ];
  } else if (category === 'SMG') {
    return [
      { range: 0, damage: baseDamage },
      { range: 15, damage: baseDamage * 0.8 },
      { range: 25, damage: baseDamage * 0.6 },
    ];
  }

  // Default falloff
  return [
    { range: 0, damage: baseDamage },
    { range: 30, damage: baseDamage * 0.75 },
  ];
}

function calculateEstimatedTTK(weapon: any): { min: number; max: number } {
  // Rough TTK estimation based on fire rate and damage
  const fireRate = weapon.fireRate || weapon.rpm || 600;
  const damage = weapon.damage || estimateStat(weapon, 'damage');

  // TTK in milliseconds
  const shotsToKill = Math.ceil(100 / (damage * 0.3)); // Rough estimate
  const timeBetweenShots = 60000 / fireRate;

  return {
    min: Math.round(timeBetweenShots * (shotsToKill - 1)),
    max: Math.round(timeBetweenShots * (shotsToKill + 1)),
  };
}

function inferBestFor(weapon: any): string[] {
  const category = mapCategory(weapon.category);
  const defaults: Record<string, string[]> = {
    AR: ['Versatile', 'Medium Range'],
    SMG: ['Close Range', 'Aggressive'],
    LMG: ['Suppression', 'Long Range'],
    Sniper: ['Long Range', 'Precision'],
    Marksman: ['Medium-Long Range', 'Tactical'],
    Shotgun: ['Close Range', 'CQB'],
    Pistol: ['Secondary', 'Backup'],
  };

  return defaults[category] || ['General Use'];
}

function inferPlaystyles(weapon: any): string[] {
  const category = mapCategory(weapon.category);
  const defaults: Record<string, string[]> = {
    AR: ['Tactical', 'Support'],
    SMG: ['Aggressive'],
    LMG: ['Support', 'Defensive'],
    Sniper: ['Sniper', 'Defensive'],
    Marksman: ['Tactical', 'Sniper'],
    Shotgun: ['Aggressive'],
    Pistol: ['Aggressive', 'Tactical'],
  };

  return defaults[category] || ['Tactical'];
}

function extractPros(attachment: any): string[] {
  const pros: string[] = [];

  Object.entries(attachment.stats || {}).forEach(([stat, value]) => {
    if (typeof value === 'number' && value > 0) {
      pros.push(`+${value} ${stat}`);
    }
  });

  return pros.length > 0 ? pros : ['Improves weapon performance'];
}

function extractCons(attachment: any): string[] {
  const cons: string[] = [];

  Object.entries(attachment.stats || {}).forEach(([stat, value]) => {
    if (typeof value === 'number' && value < 0) {
      cons.push(`${value} ${stat}`);
    }
  });

  return cons;
}
