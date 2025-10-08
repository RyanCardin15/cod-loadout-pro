import axios, { AxiosError } from 'axios';
import * as cheerio from 'cheerio';

import { cache } from '../utils/cache';
import { rateLimiters } from '../utils/rate-limiter';

// ============================================================================
// Configuration Constants
// ============================================================================

const WZSTATS_BASE_URL = process.env.WZSTATS_BASE_URL || 'https://wzstats.gg';
const WZSTATS_ENABLED = process.env.WZSTATS_SCRAPER_ENABLED !== 'false';
const WZSTATS_CACHE_TTL = parseInt(process.env.WZSTATS_CACHE_TTL_HOURS || '2', 10) * 60 * 60 * 1000;
const WZSTATS_TIMEOUT = parseInt(process.env.WZSTATS_TIMEOUT_MS || '15000', 10);
const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 1000;

// ============================================================================
// Type Definitions
// ============================================================================

export interface WZStatsWeapon {
  name: string;
  tier: 'S' | 'A' | 'B' | 'C' | 'D';
  usage: number; // Percentage
  winRate: number; // Percentage
  game: string;
}

interface NextDataWeaponMeta {
  weapons?: Array<{
    name?: string;
    tier?: string;
    pickRate?: number;
    usage?: number;
    winRate?: number;
    wr?: number;
    game?: string;
  }>;
  tiers?: Record<string, Array<{
    name?: string;
    pickRate?: number;
    winRate?: number;
  }>>;
}

// ============================================================================
// Retry Logic with Exponential Backoff
// ============================================================================

/**
 * Retry a function with exponential backoff
 */
async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  retries: number = MAX_RETRIES
): Promise<T> {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;

      if (attempt < retries - 1) {
        const delay = RETRY_DELAY_MS * Math.pow(2, attempt);
        console.log(`⏳ Retry attempt ${attempt + 1}/${retries} after ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  throw lastError;
}

// ============================================================================
// Data Extraction Utilities
// ============================================================================

/**
 * Extract __NEXT_DATA__ JSON from HTML (for Next.js sites)
 */
function extractNextData(html: string): NextDataWeaponMeta | null {
  try {
    const $ = cheerio.load(html);
    const nextDataScript = $('#__NEXT_DATA__').html();

    if (!nextDataScript) {
      return null;
    }

    const data = JSON.parse(nextDataScript);
    return data?.props?.pageProps || data?.props || null;
  } catch (error) {
    console.warn('⚠️  Failed to parse __NEXT_DATA__:', error);
    return null;
  }
}

/**
 * Parse tier name to standard format
 */
function parseTier(tier: string | undefined): 'S' | 'A' | 'B' | 'C' | 'D' {
  const normalized = tier?.toUpperCase().trim() || '';

  if (normalized.includes('S') || normalized === 'META') return 'S';
  if (normalized.includes('A')) return 'A';
  if (normalized.includes('B')) return 'B';
  if (normalized.includes('C')) return 'C';
  if (normalized.includes('D')) return 'D';

  return 'C'; // Default
}

/**
 * Parse percentage value from various formats
 */
function parsePercentage(value: string | number | undefined): number {
  if (typeof value === 'number') {
    return value > 1 ? value : value * 100;
  }

  if (typeof value === 'string') {
    const cleaned = value.replace(/[^0-9.]/g, '');
    const num = parseFloat(cleaned);
    return isNaN(num) ? 0 : num;
  }

  return 0;
}

/**
 * Normalize weapon name for consistency
 */
function normalizeWeaponName(name: string | undefined): string {
  if (!name) return '';

  return name
    .trim()
    .replace(/\s+/g, ' ')
    .replace(/[^\w\s-]/g, '');
}

// ============================================================================
// Scraping Strategies
// ============================================================================

/**
 * Strategy 1: Attempt to fetch data from WZStats API endpoint
 */
async function attemptAPIFetch(): Promise<WZStatsWeapon[]> {
  const possibleEndpoints = [
    `${WZSTATS_BASE_URL}/api/meta/warzone`,
    `${WZSTATS_BASE_URL}/api/weapons`,
    `${WZSTATS_BASE_URL}/api/v1/meta`,
  ];

  for (const endpoint of possibleEndpoints) {
    try {
      const response = await rateLimiters.wzranked.execute(() =>
        axios.get(endpoint, {
          headers: {
            'User-Agent': 'Counterplay/1.0 (COD Loadout App)',
            'Accept': 'application/json',
          },
          timeout: WZSTATS_TIMEOUT,
        })
      );

      if (response.data && (Array.isArray(response.data) || response.data.weapons)) {
        const weaponsData = Array.isArray(response.data) ? response.data : response.data.weapons;

        if (Array.isArray(weaponsData) && weaponsData.length > 0) {
          console.log(`✅ Found working API endpoint: ${endpoint}`);
          return weaponsData.map(transformAPIWeapon);
        }
      }
    } catch (error) {
      // Continue to next endpoint
      continue;
    }
  }

  throw new Error('No working API endpoint found');
}

/**
 * Transform API weapon data to standard format
 */
function transformAPIWeapon(item: any): WZStatsWeapon {
  return {
    name: normalizeWeaponName(item.name || item.weaponName),
    tier: parseTier(item.tier),
    usage: parsePercentage(item.usage || item.pickRate || item.pick_rate),
    winRate: parsePercentage(item.winRate || item.wr || item.win_rate),
    game: item.game || 'Warzone',
  };
}

/**
 * Strategy 3: Parse HTML with Cheerio as fallback
 */
function parseHTML(html: string): WZStatsWeapon[] {
  const $ = cheerio.load(html);
  const weapons: WZStatsWeapon[] = [];

  // Common selectors for weapon tier lists
  const selectors = [
    '.weapon-card',
    '.weapon-item',
    '[class*="weapon"]',
    '[class*="tier"]',
    'article',
    '.card',
  ];

  for (const selector of selectors) {
    $(selector).each((i, elem) => {
      const $elem = $(elem);

      // Try various patterns for weapon name
      const name = normalizeWeaponName(
        $elem.find('.weapon-name').text() ||
        $elem.find('[class*="name"]').first().text() ||
        $elem.find('h3').text() ||
        $elem.find('h4').text() ||
        $elem.attr('data-weapon') ||
        ''
      );

      if (!name) return;

      // Try to find tier
      const tierText = $elem.find('.tier').text() ||
        $elem.find('[class*="tier"]').text() ||
        $elem.closest('[class*="tier"]').attr('class') ||
        '';

      const tier = parseTier(tierText);

      // Try to find usage
      const usageText = $elem.find('[class*="usage"]').text() ||
        $elem.find('[class*="pick"]').text() ||
        '';
      const usage = parsePercentage(usageText);

      // Try to find win rate
      const winRateText = $elem.find('[class*="win"]').text() ||
        $elem.find('[class*="wr"]').text() ||
        '';
      const winRate = parsePercentage(winRateText);

      weapons.push({
        name,
        tier,
        usage,
        winRate,
        game: 'Warzone',
      });
    });

    if (weapons.length > 0) {
      console.log(`✅ Extracted ${weapons.length} weapons using selector: ${selector}`);
      break;
    }
  }

  return weapons;
}

// ============================================================================
// Public API
// ============================================================================

/**
 * Fetch weapon meta data from WZStats.gg with multiple strategies
 *
 * Strategy Priority:
 * 1. Try to discover and use API endpoint
 * 2. Parse __NEXT_DATA__ JSON from HTML
 * 3. Use Cheerio for HTML parsing
 * 4. Return cached data if available
 * 5. Return empty array as last resort
 */
export async function fetchWZStatsMetaData(): Promise<WZStatsWeapon[]> {
  if (!WZSTATS_ENABLED) {
    console.log('⏭️  WZStats scraper is disabled');
    return [];
  }

  console.log('📥 Fetching weapon meta from WZStats.gg...');

  return cache.cached(
    'wzstats-meta',
    async () => {
      try {
        // Strategy 1: Try API endpoints
        try {
          const apiData = await retryWithBackoff(attemptAPIFetch);
          if (apiData.length > 0) {
            console.log(`✅ Fetched ${apiData.length} weapons from API`);
            return apiData;
          }
        } catch (error) {
          console.log('⏭️  API fetch failed, trying HTML scraping...');
        }

        // Strategy 2 & 3: Fetch HTML and try parsing methods
        const response = await retryWithBackoff(() =>
          rateLimiters.wzranked.execute(() =>
            axios.get(`${WZSTATS_BASE_URL}/`, {
              headers: {
                'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
                'Accept-Language': 'en-US,en;q=0.9',
                'Accept-Encoding': 'gzip, deflate',
              },
              timeout: WZSTATS_TIMEOUT,
            })
          )
        );

        // Try __NEXT_DATA__ extraction
        const nextData = extractNextData(response.data);
        if (nextData?.weapons && Array.isArray(nextData.weapons)) {
          const weapons = nextData.weapons.map(transformAPIWeapon);
          if (weapons.length > 0) {
            console.log(`✅ Extracted ${weapons.length} weapons from __NEXT_DATA__`);
            return weapons;
          }
        }

        // Try parsing tiers object
        if (nextData?.tiers && typeof nextData.tiers === 'object') {
          const weapons: WZStatsWeapon[] = [];
          Object.entries(nextData.tiers).forEach(([tierName, tierWeapons]) => {
            if (Array.isArray(tierWeapons)) {
              tierWeapons.forEach((weapon: any) => {
                weapons.push({
                  name: normalizeWeaponName(weapon.name),
                  tier: parseTier(tierName),
                  usage: parsePercentage(weapon.pickRate || weapon.usage),
                  winRate: parsePercentage(weapon.winRate || weapon.wr),
                  game: weapon.game || 'Warzone',
                });
              });
            }
          });

          if (weapons.length > 0) {
            console.log(`✅ Extracted ${weapons.length} weapons from tiers data`);
            return weapons;
          }
        }

        // Try HTML parsing as last resort
        const htmlWeapons = parseHTML(response.data);
        if (htmlWeapons.length > 0) {
          return htmlWeapons;
        }

        console.warn('⚠️  Could not extract weapon data from any source');
        return [];

      } catch (error) {
        console.error('❌ Failed to fetch WZStats data:', error);

        if (axios.isAxiosError(error)) {
          const axiosError = error as AxiosError;
          console.error(`   Status: ${axiosError.response?.status}`);
          console.error(`   Message: ${axiosError.message}`);
        }

        // Try to return cached data if available
        const cachedData = await cache.get<WZStatsWeapon[]>('wzstats-meta');
        if (cachedData && cachedData.length > 0) {
          console.log('⚠️  Returning stale cached data due to fetch failure');
          return cachedData;
        }

        // Return empty array on error - don't fail the entire sync
        return [];
      }
    },
    WZSTATS_CACHE_TTL
  );
}

/**
 * Test connection to WZStats
 */
export async function testWZStatsConnection(): Promise<boolean> {
  try {
    console.log('🔍 Testing WZStats connection...');

    const response = await axios.head(WZSTATS_BASE_URL, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
      },
      timeout: 5000,
    });

    if (response.status === 200 || response.status === 301 || response.status === 302) {
      console.log('✅ WZStats connection successful');
      return true;
    }

    console.warn('⚠️  Unexpected status code:', response.status);
    return false;
  } catch (error) {
    console.error('❌ WZStats connection failed');
    if (error instanceof Error) {
      console.error('   Error:', error.message);
    }
    return false;
  }
}
