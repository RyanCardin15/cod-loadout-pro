import { Weapon } from '../../../server/src/models/weapon.model';
import { WZStatsWeapon } from '../scrapers/wzstats-scraper';

// ============================================================================
// WZStats Transformer
// ============================================================================
// Transforms WZStats weapon meta data to update existing weapon records.
// This transformer only updates meta fields (tier, popularity, winRate) and
// does not modify core weapon stats or attributes.
// ============================================================================

/**
 * Transform WZStats weapon data to update weapon meta information
 *
 * This transformer only updates the meta fields (tier, popularity, winRate)
 * and does not modify the core weapon stats or attributes.
 */
export function transformWZStatsWeapon(
  wzstatsWeapon: WZStatsWeapon,
  existingWeapon?: Weapon
): Partial<Weapon> {
  return {
    meta: {
      tier: wzstatsWeapon.tier,
      popularity: normalizePopularity(wzstatsWeapon.usage),
      winRate: normalizeWinRate(wzstatsWeapon.winRate),
      lastUpdated: new Date().toISOString(),
    },
  };
}

// ============================================================================
// Weapon Update Operations
// ============================================================================

/**
 * Update existing weapon with WZStats meta data
 */
export function updateWeaponWithWZStats(
  weapon: Weapon,
  wzstatsWeapon: WZStatsWeapon
): Weapon {
  return {
    ...weapon,
    meta: {
      ...weapon.meta,
      tier: wzstatsWeapon.tier,
      popularity: normalizePopularity(wzstatsWeapon.usage),
      winRate: normalizeWinRate(wzstatsWeapon.winRate),
      lastUpdated: new Date().toISOString(),
    },
  };
}

// ============================================================================
// Weapon Matching
// ============================================================================

/**
 * Match WZStats weapon name to existing weapon
 *
 * Handles name variations and normalization to find the correct weapon match
 */
export function matchWeaponName(
  wzstatsName: string,
  weaponsList: Weapon[]
): Weapon | null {
  const normalized = normalizeWeaponNameForMatching(wzstatsName);

  // Try exact match first
  const exactMatch = weaponsList.find(
    (w) => normalizeWeaponNameForMatching(w.name) === normalized
  );

  if (exactMatch) return exactMatch;

  // Try fuzzy match
  const fuzzyMatch = weaponsList.find((w) => {
    const weaponNorm = normalizeWeaponNameForMatching(w.name);
    return weaponNorm.includes(normalized) || normalized.includes(weaponNorm);
  });

  if (fuzzyMatch) return fuzzyMatch;

  // Try matching without special characters
  const stripped = stripSpecialChars(normalized);
  const strippedMatch = weaponsList.find(
    (w) => stripSpecialChars(normalizeWeaponNameForMatching(w.name)) === stripped
  );

  return strippedMatch || null;
}

// ============================================================================
// Batch Operations
// ============================================================================

/**
 * Batch update multiple weapons with WZStats data
 */
export function batchUpdateWeaponsWithWZStats(
  weapons: Weapon[],
  wzstatsWeapons: WZStatsWeapon[]
): Weapon[] {
  const updatedWeapons: Weapon[] = [];

  for (const weapon of weapons) {
    // Find matching WZStats data
    const wzstatsMatch = wzstatsWeapons.find(
      (wz) => matchWeaponName(wz.name, [weapon]) !== null
    );

    if (wzstatsMatch) {
      updatedWeapons.push(updateWeaponWithWZStats(weapon, wzstatsMatch));
    } else {
      updatedWeapons.push(weapon);
    }
  }

  return updatedWeapons;
}

// ============================================================================
// Reporting & Analytics
// ============================================================================

/**
 * Generate update report showing what changed
 */
export function generateUpdateReport(
  weapons: Weapon[],
  wzstatsWeapons: WZStatsWeapon[]
): {
  matched: number;
  unmatched: string[];
  updates: Array<{
    weapon: string;
    oldTier: string;
    newTier: string;
    oldPopularity: number;
    newPopularity: number;
  }>;
} {
  const matched: number[] = [];
  const unmatched: string[] = [];
  const updates: Array<{
    weapon: string;
    oldTier: string;
    newTier: string;
    oldPopularity: number;
    newPopularity: number;
  }> = [];

  for (const wzWeapon of wzstatsWeapons) {
    const match = matchWeaponName(wzWeapon.name, weapons);

    if (match) {
      matched.push(1);

      // Check if tier or popularity changed significantly
      if (
        match.meta.tier !== wzWeapon.tier ||
        Math.abs(match.meta.popularity - normalizePopularity(wzWeapon.usage)) > 5
      ) {
        updates.push({
          weapon: match.name,
          oldTier: match.meta.tier,
          newTier: wzWeapon.tier,
          oldPopularity: match.meta.popularity,
          newPopularity: normalizePopularity(wzWeapon.usage),
        });
      }
    } else {
      unmatched.push(wzWeapon.name);
    }
  }

  return {
    matched: matched.length,
    unmatched,
    updates,
  };
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Normalize popularity from usage percentage (0-100) to popularity score (0-100)
 */
function normalizePopularity(usage: number): number {
  // Usage is already 0-100 percentage
  // Cap at 100 and ensure it's non-negative
  return Math.min(100, Math.max(0, Math.round(usage)));
}

/**
 * Normalize win rate percentage
 */
function normalizeWinRate(winRate: number): number {
  // Win rate should be between 0-100
  // Default to 50 if invalid
  if (winRate < 0 || winRate > 100 || isNaN(winRate)) {
    return 50;
  }

  return Math.round(winRate);
}

/**
 * Normalize weapon name for matching
 */
function normalizeWeaponNameForMatching(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/\s+/g, ' ')
    .replace(/[.,]/g, '')
    .replace(/mk\s*(\d+)/i, 'mk$1') // Normalize "MK 2" to "mk2"
    .replace(/\bmk(\d+)\b/i, 'mark$1') // Also try "mark" variant
    .replace(/\bm4\b/i, 'm4') // Normalize M4 variants
    .replace(/\bmp5\b/i, 'mp5') // Normalize MP5 variants
    .replace(/\s*-\s*/g, '-') // Normalize dashes
    .replace(/\s*\(\s*/g, '(') // Normalize parentheses
    .replace(/\s*\)\s*/g, ')');
}

/**
 * Strip all special characters for aggressive matching
 */
function stripSpecialChars(name: string): string {
  return name.replace(/[^a-z0-9]/g, '');
}

// ============================================================================
// Validation & Filtering
// ============================================================================

/**
 * Map tier to numeric score for sorting
 */
export function tierToScore(tier: 'S' | 'A' | 'B' | 'C' | 'D'): number {
  const scores: Record<string, number> = {
    S: 5,
    A: 4,
    B: 3,
    C: 2,
    D: 1,
  };

  return scores[tier] || 2;
}

/**
 * Validate WZStats weapon data
 */
export function validateWZStatsWeapon(weapon: WZStatsWeapon): boolean {
  // Must have a name
  if (!weapon.name || weapon.name.trim().length === 0) {
    return false;
  }

  // Tier must be valid
  if (!['S', 'A', 'B', 'C', 'D'].includes(weapon.tier)) {
    return false;
  }

  // Usage should be reasonable (0-100)
  if (weapon.usage < 0 || weapon.usage > 100) {
    return false;
  }

  // Win rate should be reasonable (0-100)
  if (weapon.winRate < 0 || weapon.winRate > 100) {
    return false;
  }

  return true;
}

/**
 * Filter out invalid WZStats weapons
 */
export function filterValidWZStatsWeapons(weapons: WZStatsWeapon[]): WZStatsWeapon[] {
  return weapons.filter(validateWZStatsWeapon);
}

// ============================================================================
// Sorting & Filtering
// ============================================================================

/**
 * Sort weapons by meta tier and popularity
 */
export function sortByMeta(weapons: Weapon[]): Weapon[] {
  return [...weapons].sort((a, b) => {
    // Sort by tier first (S > A > B > C > D)
    const tierDiff = tierToScore(b.meta.tier) - tierToScore(a.meta.tier);
    if (tierDiff !== 0) return tierDiff;

    // Then by popularity
    return b.meta.popularity - a.meta.popularity;
  });
}

/**
 * Get top N weapons from WZStats data
 */
export function getTopWeapons(wzstatsWeapons: WZStatsWeapon[], count: number = 10): WZStatsWeapon[] {
  return [...wzstatsWeapons]
    .sort((a, b) => {
      const tierDiff = tierToScore(b.tier) - tierToScore(a.tier);
      if (tierDiff !== 0) return tierDiff;
      return b.usage - a.usage;
    })
    .slice(0, count);
}
