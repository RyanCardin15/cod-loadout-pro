import { Weapon } from '../../../server/src/models/weapon.model';
import { CODMunityStats } from '../scrapers/codmunity-scraper';

// ============================================================================
// CODMunity Transformer
// ============================================================================
// Transforms CODMunity weapon ballistics data to application schema.
// Handles detailed stats including TTK, damage ranges, recoil patterns,
// and intelligent category/playstyle inference.
// ============================================================================

/**
 * Transform CODMunity weapon data to our application schema
 */
export function transformCODMunityStats(stats: CODMunityStats): Omit<Weapon, 'id'> {
  return {
    name: stats.name,
    game: normalizeGame(stats.game),
    category: inferCategory(stats),

    // Transform raw stats to normalized 0-100 scale
    stats: {
      damage: calculateDamageScore(stats),
      range: calculateRangeScore(stats),
      accuracy: calculateAccuracyScore(stats),
      fireRate: calculateFireRateScore(stats.fireRate),
      mobility: calculateMobilityScore(stats),
      control: calculateControlScore(stats),
      handling: calculateHandlingScore(stats),
    },

    // Direct ballistics mapping
    ballistics: {
      damageRanges: stats.damageRanges,
      ttk: stats.ttk,
      fireRate: stats.fireRate,
      magazineSize: stats.magazineSize,
      reloadTime: stats.reloadTime,
      adTime: stats.adsTime / 1000, // Convert ms to seconds
    },

    // Empty attachment slots - to be populated by other sources
    attachmentSlots: {
      optic: [],
      barrel: [],
      magazine: [],
      underbarrel: [],
      stock: [],
      laser: [],
      muzzle: [],
      rearGrip: [],
    },

    // Default meta - to be updated by meta scraper
    meta: {
      tier: 'C',
      popularity: 0,
      winRate: 50,
      lastUpdated: stats.scrapedAt,
    },

    bestFor: inferBestFor(stats),
    playstyles: inferPlaystyles(stats),
    imageUrl: '',
    iconUrl: '',
  };
}

// ============================================================================
// Batch Operations
// ============================================================================

/**
 * Batch transform multiple CODMunity stats
 */
export function transformCODMunityStatsBatch(
  statsList: CODMunityStats[]
): Array<Omit<Weapon, 'id'>> {
  return statsList.map(transformCODMunityStats).filter((weapon) => weapon !== null);
}

// ============================================================================
// Game & Category Inference
// ============================================================================

/**
 * Normalize game name to our schema
 */
function normalizeGame(game: string): 'MW3' | 'Warzone' | 'BO6' | 'MW2' {
  const normalized = game?.toLowerCase() || '';

  if (normalized.includes('mw3') || normalized.includes('modern warfare iii')) return 'MW3';
  if (normalized.includes('warzone') || normalized.includes('wz')) return 'Warzone';
  if (normalized.includes('bo6') || normalized.includes('black ops 6')) return 'BO6';
  if (normalized.includes('mw2') || normalized.includes('modern warfare ii')) return 'MW2';

  return 'Warzone'; // Default
}

/**
 * Helper: Infer weapon category from stats
 * Uses fire rate, magazine size, and TTK to classify
 */
function inferCategory(
  stats: CODMunityStats
): 'AR' | 'SMG' | 'LMG' | 'Sniper' | 'Marksman' | 'Shotgun' | 'Pistol' {
  const { fireRate, magazineSize, ttk } = stats;

  // LMG: Large magazine, moderate fire rate
  if (magazineSize >= 75) {
    return 'LMG';
  }

  // Pistol: Small magazine
  if (magazineSize <= 15) {
    return 'Pistol';
  }

  // Sniper: Very slow TTK (one-shot potential), low fire rate
  if (ttk.min < 100 && fireRate < 400) {
    return 'Sniper';
  }

  // Marksman: Moderate TTK, moderate fire rate
  if (ttk.min < 250 && fireRate < 500) {
    return 'Marksman';
  }

  // SMG: High fire rate
  if (fireRate > 800) {
    return 'SMG';
  }

  // Shotgun: Very low fire rate, high damage
  if (fireRate < 350 && stats.damageRanges[0]?.damage > 50) {
    return 'Shotgun';
  }

  // Default to AR
  return 'AR';
}

// ============================================================================
// Stat Calculation Functions
// ============================================================================

/**
 * Calculate damage score (0-100) from damage ranges
 * Higher base damage and better retention = higher score
 */
function calculateDamageScore(stats: CODMunityStats): number {
  const { damageRanges } = stats;

  if (damageRanges.length === 0) return 50;

  const baseDamage = damageRanges[0].damage;
  const longRangeDamage = damageRanges[damageRanges.length - 1].damage;
  const damageRetention = longRangeDamage / baseDamage;

  // Normalize base damage (20-60 damage range typical)
  const normalizedBase = Math.min(100, ((baseDamage - 20) / 40) * 100);

  // Factor in damage retention
  const retentionBonus = damageRetention * 20;

  return Math.round(Math.min(100, normalizedBase + retentionBonus));
}

/**
 * Calculate range score (0-100) from damage ranges
 * Longer effective range = higher score
 */
function calculateRangeScore(stats: CODMunityStats): number {
  const { damageRanges } = stats;

  if (damageRanges.length === 0) return 50;

  // Get the range where damage drops below 75% of base
  const baseDamage = damageRanges[0].damage;
  const threshold = baseDamage * 0.75;

  let effectiveRange = 0;
  for (const dr of damageRanges) {
    if (dr.damage >= threshold) {
      effectiveRange = dr.range;
    } else {
      break;
    }
  }

  // Normalize to 0-100 (typical ranges: 0-80m)
  return Math.round(Math.min(100, (effectiveRange / 80) * 100));
}

/**
 * Calculate accuracy score (0-100) from recoil pattern
 * Lower recoil = higher accuracy
 */
function calculateAccuracyScore(stats: CODMunityStats): number {
  const { recoilPattern } = stats;

  // Calculate total recoil magnitude
  const totalRecoil = Math.sqrt(
    Math.pow(recoilPattern.horizontal, 2) + Math.pow(recoilPattern.vertical, 2)
  );

  // Normalize (typical recoil: 0-100 units)
  const normalizedRecoil = Math.min(100, totalRecoil);

  // Invert - lower recoil = higher accuracy
  return Math.round(100 - normalizedRecoil);
}

/**
 * Calculate fire rate score (0-100)
 * Higher RPM = higher score
 */
function calculateFireRateScore(fireRate: number): number {
  // Normalize RPM (typical range: 300-1200 RPM)
  return Math.round(Math.min(100, ((fireRate - 300) / 900) * 100));
}

/**
 * Calculate mobility score (0-100) from movement speed
 * Higher movement speeds = higher score
 */
function calculateMobilityScore(stats: CODMunityStats): number {
  const { movementSpeed } = stats;

  // Weight base movement more heavily
  const baseWeight = 0.6;
  const adsWeight = 0.3;
  const crouchedWeight = 0.1;

  // Normalize movement speeds (typical range: 2-7 m/s)
  const normalizedBase = Math.min(100, ((movementSpeed.base - 2) / 5) * 100);
  const normalizedAds = Math.min(100, ((movementSpeed.ads - 2) / 5) * 100);
  const normalizedCrouched = Math.min(100, ((movementSpeed.crouched - 1) / 4) * 100);

  const weightedScore =
    normalizedBase * baseWeight +
    normalizedAds * adsWeight +
    normalizedCrouched * crouchedWeight;

  return Math.round(weightedScore);
}

/**
 * Calculate control score (0-100) from recoil
 * Lower recoil = better control
 */
function calculateControlScore(stats: CODMunityStats): number {
  const { recoilPattern } = stats;

  // Vertical recoil is more manageable than horizontal
  const verticalWeight = 0.4;
  const horizontalWeight = 0.6;

  // Normalize recoil values (typical range: 0-100)
  const normalizedVertical = Math.min(100, recoilPattern.vertical);
  const normalizedHorizontal = Math.min(100, recoilPattern.horizontal);

  // Calculate weighted recoil
  const totalRecoil =
    normalizedVertical * verticalWeight + normalizedHorizontal * horizontalWeight;

  // Invert - lower recoil = better control
  return Math.round(100 - totalRecoil);
}

/**
 * Calculate handling score (0-100) from ADS and sprint-to-fire times
 * Faster times = higher score
 */
function calculateHandlingScore(stats: CODMunityStats): number {
  const { adsTime, sprintToFireTime } = stats;

  // Weight ADS time more heavily
  const adsWeight = 0.6;
  const sprintWeight = 0.4;

  // Normalize times (typical ranges: ADS 150-500ms, STF 200-600ms)
  const normalizedAds = Math.min(100, ((500 - adsTime) / 350) * 100);
  const normalizedSprint = Math.min(100, ((600 - sprintToFireTime) / 400) * 100);

  const weightedScore = normalizedAds * adsWeight + normalizedSprint * sprintWeight;

  return Math.round(Math.max(0, weightedScore));
}

// ============================================================================
// Inference Functions
// ============================================================================

/**
 * Infer what the weapon is best for based on stats
 */
function inferBestFor(stats: CODMunityStats): string[] {
  const bestFor: string[] = [];

  const rangeScore = calculateRangeScore(stats);
  const mobilityScore = calculateMobilityScore(stats);
  const damageScore = calculateDamageScore(stats);

  // Range categories
  if (rangeScore > 75) {
    bestFor.push('Long Range Engagements');
  } else if (rangeScore > 50) {
    bestFor.push('Medium Range Combat');
  } else {
    bestFor.push('Close Quarters Combat');
  }

  // TTK categories
  if (stats.ttk.min < 300) {
    bestFor.push('High Damage Output');
  }

  // Mobility categories
  if (mobilityScore > 75) {
    bestFor.push('Aggressive Playstyle');
    bestFor.push('Rushing');
  } else if (mobilityScore < 40) {
    bestFor.push('Defensive Positions');
  }

  // Control/Accuracy
  const controlScore = calculateControlScore(stats);
  if (controlScore > 75) {
    bestFor.push('Accurate Shooting');
  }

  // Versatility
  if (rangeScore > 60 && mobilityScore > 60) {
    bestFor.push('Versatile Gameplay');
  }

  return bestFor.slice(0, 4); // Limit to 4 categories
}

/**
 * Infer playstyles based on weapon characteristics
 */
function inferPlaystyles(stats: CODMunityStats): string[] {
  const playstyles: string[] = [];

  const category = inferCategory(stats);
  const mobilityScore = calculateMobilityScore(stats);
  const rangeScore = calculateRangeScore(stats);

  // Category-based playstyles
  if (category === 'AR') {
    playstyles.push('Tactical');
    if (rangeScore > 65) playstyles.push('Support');
  } else if (category === 'SMG') {
    playstyles.push('Aggressive');
    playstyles.push('Rusher');
  } else if (category === 'LMG') {
    playstyles.push('Support');
    playstyles.push('Defensive');
  } else if (category === 'Sniper') {
    playstyles.push('Sniper');
    playstyles.push('Long Range');
  } else if (category === 'Marksman') {
    playstyles.push('Tactical');
    playstyles.push('Marksman');
  } else if (category === 'Shotgun') {
    playstyles.push('Aggressive');
    playstyles.push('CQC Specialist');
  }

  // Mobility-based additions
  if (mobilityScore > 75 && !playstyles.includes('Aggressive')) {
    playstyles.push('Run and Gun');
  }

  // Range-based additions
  if (rangeScore > 70 && !playstyles.includes('Support')) {
    playstyles.push('Support');
  }

  return Array.from(new Set(playstyles)).slice(0, 3); // Remove duplicates and limit to 3
}

// ============================================================================
// Data Merging & Quality
// ============================================================================

/**
 * Merge CODMunity stats with existing weapon data
 * Preserves existing data while updating ballistics from CODMunity
 */
export function mergeCODMunityStats(
  existingWeapon: Weapon,
  codmunityStats: CODMunityStats
): Weapon {
  return {
    ...existingWeapon,
    ballistics: {
      damageRanges: codmunityStats.damageRanges,
      ttk: codmunityStats.ttk,
      fireRate: codmunityStats.fireRate,
      magazineSize: codmunityStats.magazineSize,
      reloadTime: codmunityStats.reloadTime,
      adTime: codmunityStats.adsTime / 1000, // Convert ms to seconds
    },
    meta: {
      ...existingWeapon.meta,
      lastUpdated: codmunityStats.scrapedAt,
    },
  };
}

/**
 * Calculate a quality score for CODMunity data
 * Returns 0-100 score indicating data completeness and quality
 */
export function calculateDataQuality(stats: CODMunityStats): number {
  let score = 100;

  // Deduct points for missing or default data
  if (stats.damageRanges.length === 0) score -= 20;
  if (stats.damageRanges.length === 1) score -= 10; // Only one range point
  if (stats.ttk.min === 300 && stats.ttk.max === 600) score -= 15; // Default values
  if (stats.fireRate === 600) score -= 10; // Default value
  if (stats.bulletVelocity === 600) score -= 10; // Default value
  if (stats.recoilPattern.horizontal === 0 && stats.recoilPattern.vertical === 0) score -= 15;
  if (stats.movementSpeed.base === 5.0) score -= 10; // Default value

  return Math.max(0, score);
}
