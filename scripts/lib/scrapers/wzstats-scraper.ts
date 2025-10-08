import axios from 'axios';
import * as cheerio from 'cheerio';
import { rateLimiters } from '../utils/rate-limiter';
import { cache } from '../utils/cache';

const WZSTATS_BASE_URL = 'https://wzstats.gg';

export interface WZStatsWeapon {
  name: string;
  tier: 'S' | 'A' | 'B' | 'C' | 'D';
  usage: number; // Percentage
  winRate: number; // Percentage
  game: string;
}

/**
 * Fetch weapon meta data from WZStats.gg
 *
 * NOTE: This is a placeholder implementation. WZStats.gg may require:
 * 1. Reverse engineering their API calls (check Network tab in browser)
 * 2. Handling dynamic content with Puppeteer/Playwright
 * 3. Authentication or API keys
 *
 * For now, this attempts HTML scraping as a starting point.
 */
export async function fetchWZStatsMetaData(): Promise<WZStatsWeapon[]> {
  console.log('📥 Fetching weapon meta from WZStats.gg...');

  return cache.cached(
    'wzstats-meta',
    async () => {
      try {
        // Attempt to fetch the meta page
        const response = await rateLimiters.wzranked.execute(() =>
          axios.get(`${WZSTATS_BASE_URL}/`, {
            headers: {
              'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
              'Accept': 'text/html,application/xhtml+xml',
              'Accept-Language': 'en-US,en;q=0.9',
            },
            timeout: 15000,
          })
        );

        const $ = cheerio.load(response.data);
        const weapons: WZStatsWeapon[] = [];

        // TODO: Update these selectors based on actual HTML structure
        // This is a placeholder - actual selectors need to be determined
        // by inspecting the WZStats.gg HTML

        // Example structure (to be updated):
        // $('.weapon-tier-item').each((i, elem) => {
        //   const name = $(elem).find('.weapon-name').text().trim();
        //   const tier = $(elem).find('.tier-badge').text().trim() as any;
        //   const usage = parseFloat($(elem).find('.usage-percent').text());
        //   const winRate = parseFloat($(elem).find('.win-rate').text());
        //
        //   if (name && tier) {
        //     weapons.push({ name, tier, usage, winRate, game: 'Warzone' });
        //   }
        // });

        console.log(`⚠️  WZStats scraper is a placeholder - needs HTML structure analysis`);
        console.log(`   Visit ${WZSTATS_BASE_URL} and inspect weapon tier list HTML`);
        console.log(`   Update selectors in wzstats-scraper.ts accordingly`);

        return weapons;
      } catch (error) {
        console.error('❌ Failed to fetch WZStats data:', error);

        if (axios.isAxiosError(error) && error.response) {
          console.error(`   Status: ${error.response.status}`);
          console.error(`   Headers:`, error.response.headers);
        }

        // Return empty array on error - don't fail the entire sync
        return [];
      }
    },
    2 * 60 * 60 * 1000 // Cache for 2 hours (meta changes frequently)
  );
}

/**
 * Alternative: Fetch meta data via API if available
 *
 * WZStats might have a JSON API that we can discover by:
 * 1. Opening browser DevTools > Network tab
 * 2. Loading the meta page
 * 3. Looking for XHR/Fetch requests that return JSON with weapon data
 * 4. Implementing that endpoint here instead of HTML scraping
 */
export async function fetchWZStatsAPIData(): Promise<WZStatsWeapon[]> {
  console.log('📥 Attempting to fetch WZStats API data...');

  return cache.cached(
    'wzstats-api',
    async () => {
      try {
        // TODO: Replace with actual API endpoint discovered from browser inspection
        // Example: https://wzstats.gg/api/v1/meta/warzone
        const apiUrl = `${WZSTATS_BASE_URL}/api/meta`; // Placeholder URL

        const response = await rateLimiters.wzranked.execute(() =>
          axios.get(apiUrl, {
            headers: {
              'User-Agent': 'Counterplay/1.0',
              'Accept': 'application/json',
            },
            timeout: 10000,
          })
        );

        if (Array.isArray(response.data)) {
          return response.data.map((item: any) => ({
            name: item.name || item.weaponName,
            tier: item.tier || 'C',
            usage: item.usage || item.pickRate || 0,
            winRate: item.winRate || item.wr || 0,
            game: 'Warzone',
          }));
        }

        console.warn('⚠️  WZStats API returned unexpected format');
        return [];
      } catch (error) {
        console.error('❌ WZStats API not available or requires different approach');
        // Fallback to HTML scraping
        return fetchWZStatsMetaData();
      }
    },
    2 * 60 * 60 * 1000
  );
}

/**
 * Test connection to WZStats
 */
export async function testWZStatsConnection(): Promise<boolean> {
  try {
    console.log('🔍 Testing WZStats connection...');

    const response = await axios.head(WZSTATS_BASE_URL, {
      timeout: 5000,
    });

    if (response.status === 200) {
      console.log('✅ WZStats connection successful');
      return true;
    }

    return false;
  } catch (error) {
    console.error('❌ WZStats connection failed');
    return false;
  }
}
