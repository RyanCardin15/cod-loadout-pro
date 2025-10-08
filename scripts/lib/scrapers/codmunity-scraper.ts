import axios, { AxiosError } from 'axios';
import * as cheerio from 'cheerio';

import { cache } from '../utils/cache';
import { rateLimiters } from '../utils/rate-limiter';

// ============================================================================
// Configuration Constants
// ============================================================================

const CODMUNITY_BASE_URL = process.env.CODMUNITY_BASE_URL || 'https://codmunity.gg';
const CODMUNITY_SCRAPER_ENABLED = process.env.CODMUNITY_SCRAPER_ENABLED !== 'false';
const CODMUNITY_CACHE_TTL_HOURS = parseInt(process.env.CODMUNITY_CACHE_TTL_HOURS || '24', 10);
const CODMUNITY_TIMEOUT_MS = parseInt(process.env.CODMUNITY_TIMEOUT_MS || '15000', 10);
const CODMUNITY_MAX_RETRIES = 3;
const CODMUNITY_RETRY_DELAY_MS = 1000;

// ============================================================================
// Type Definitions
// ============================================================================

export interface CODMunityStats {
  name: string;
  game: string;
  ttk: { min: number; max: number }; // Time to kill in milliseconds
  damageRanges: Array<{ range: number; damage: number }>; // Sorted by range
  fireRate: number; // Rounds per minute
  bulletVelocity: number; // m/s
  magazineSize: number;
  reloadTime: number; // seconds
  adsTime: number; // Aim down sights time in ms
  sprintToFireTime: number; // ms
  movementSpeed: { base: number; ads: number; crouched: number };
  recoilPattern: { horizontal: number; vertical: number };
  source: 'codmunity';
  scrapedAt: string;
}

interface NextDataWeapon {
  name?: string;
  weaponName?: string;
  stats?: {
    ttk?: { min?: number; max?: number; average?: number };
    damageRanges?: Array<{ range?: number; distance?: number; damage?: number }>;
    fireRate?: number;
    rpm?: number;
    bulletVelocity?: number;
    velocity?: number;
    magazineSize?: number;
    magSize?: number;
    reloadTime?: number;
    adsTime?: number;
    sprintToFire?: number;
    sprintToFireTime?: number;
    movement?: { base?: number; ads?: number; crouched?: number };
    movementSpeed?: { base?: number; ads?: number; crouched?: number };
    recoil?: { horizontal?: number; vertical?: number };
    recoilPattern?: { horizontal?: number; vertical?: number };
  };
  ballistics?: any;
}

// ============================================================================
// Validation Utilities
// ============================================================================

/**
 * Custom validation error with field tracking
 */
class ValidationError extends Error {
  constructor(message: string, public field: string, public value: any) {
    super(message);
    this.name = 'ValidationError';
  }
}

function validateTTK(ttk: { min: number; max: number }): void {
  if (ttk.min < 50 || ttk.min > 2000) {
    throw new ValidationError(`TTK min out of range: ${ttk.min}ms`, 'ttk.min', ttk.min);
  }
  if (ttk.max < 50 || ttk.max > 2000) {
    throw new ValidationError(`TTK max out of range: ${ttk.max}ms`, 'ttk.max', ttk.max);
  }
  if (ttk.min > ttk.max) {
    throw new ValidationError('TTK min cannot exceed max', 'ttk', ttk);
  }
}

function validateFireRate(fireRate: number): void {
  if (fireRate < 300 || fireRate > 1200) {
    throw new ValidationError(`Fire rate out of range: ${fireRate} RPM`, 'fireRate', fireRate);
  }
}

function validateBulletVelocity(velocity: number): void {
  if (velocity < 200 || velocity > 1500) {
    throw new ValidationError(`Bullet velocity out of range: ${velocity} m/s`, 'bulletVelocity', velocity);
  }
}

function validateDamageRanges(ranges: Array<{ range: number; damage: number }>): void {
  if (ranges.length === 0) {
    throw new ValidationError('Damage ranges cannot be empty', 'damageRanges', ranges);
  }

  // Check sorted ascending by range
  for (let i = 1; i < ranges.length; i++) {
    if (ranges[i].range <= ranges[i - 1].range) {
      throw new ValidationError(
        'Damage ranges must be sorted ascending by range',
        'damageRanges',
        ranges
      );
    }
  }

  // Validate reasonable values
  ranges.forEach((r, idx) => {
    if (r.range < 0 || r.range > 200) {
      throw new ValidationError(
        `Invalid range at index ${idx}: ${r.range}m`,
        `damageRanges[${idx}].range`,
        r.range
      );
    }
    if (r.damage < 10 || r.damage > 200) {
      throw new ValidationError(
        `Invalid damage at index ${idx}: ${r.damage}`,
        `damageRanges[${idx}].damage`,
        r.damage
      );
    }
  });
}

function validateStats(stats: CODMunityStats): void {
  try {
    validateTTK(stats.ttk);
    validateFireRate(stats.fireRate);
    validateBulletVelocity(stats.bulletVelocity);
    validateDamageRanges(stats.damageRanges);
  } catch (error) {
    if (error instanceof ValidationError) {
      console.error(`❌ Validation failed for ${stats.name}:`, error.message);
      throw error;
    }
    throw error;
  }
}

// ============================================================================
// Retry Logic with Exponential Backoff
// ============================================================================

/**
 * Retry logic with exponential backoff
 */
async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  retries = CODMUNITY_MAX_RETRIES,
  delay = CODMUNITY_RETRY_DELAY_MS
): Promise<T> {
  try {
    return await fn();
  } catch (error) {
    if (retries === 0) {
      throw error;
    }

    // Only retry on network errors or 5xx server errors
    if (axios.isAxiosError(error)) {
      const shouldRetry =
        !error.response ||
        (error.response.status >= 500 && error.response.status < 600);

      if (!shouldRetry) {
        throw error;
      }
    }

    console.log(`⏳ Retrying in ${delay}ms... (${retries} retries left)`);
    await new Promise((resolve) => setTimeout(resolve, delay));
    return retryWithBackoff(fn, retries - 1, delay * 2);
  }
}

// ============================================================================
// Scraping Strategies
// ============================================================================

/**
 * Strategy 1: Try to discover and use API endpoints
 */
async function tryAPIStrategy(weaponName: string): Promise<CODMunityStats | null> {
  console.log(`🔍 Trying API discovery for ${weaponName}...`);

  // Common API endpoint patterns to try
  const apiEndpoints = [
    `/api/weapons/${encodeURIComponent(weaponName)}`,
    `/api/warzone/weapons/${encodeURIComponent(weaponName)}`,
    `/api/stats/${encodeURIComponent(weaponName)}`,
    `/api/v1/weapons/${encodeURIComponent(weaponName)}`,
  ];

  for (const endpoint of apiEndpoints) {
    try {
      const response = await rateLimiters.codmunity.execute(() =>
        axios.get(`${CODMUNITY_BASE_URL}${endpoint}`, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
            Accept: 'application/json',
          },
          timeout: CODMUNITY_TIMEOUT_MS,
        })
      );

      if (response.data && typeof response.data === 'object') {
        console.log(`✅ Found API endpoint: ${endpoint}`);
        return parseAPIResponse(response.data);
      }
    } catch (error) {
      // Continue to next endpoint
      continue;
    }
  }

  console.log('⚠️  No API endpoints found');
  return null;
}

/**
 * Strategy 2: Extract data from __NEXT_DATA__ JSON in HTML
 */
async function tryNextDataStrategy(weaponName: string): Promise<CODMunityStats | null> {
  console.log(`🔍 Trying __NEXT_DATA__ extraction for ${weaponName}...`);

  try {
    const searchUrl = `${CODMUNITY_BASE_URL}/warzone/weapons/${encodeURIComponent(
      weaponName.toLowerCase().replace(/\s+/g, '-')
    )}`;

    const response = await rateLimiters.codmunity.execute(() =>
      axios.get(searchUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
          Accept: 'text/html,application/xhtml+xml',
        },
        timeout: CODMUNITY_TIMEOUT_MS,
      })
    );

    const $ = cheerio.load(response.data);
    const nextDataScript = $('script#__NEXT_DATA__').html();

    if (nextDataScript) {
      try {
        const nextData = JSON.parse(nextDataScript);
        console.log('✅ Found __NEXT_DATA__');

        // Navigate through possible data structures
        const pageProps = nextData?.props?.pageProps;
        const weaponData =
          pageProps?.weapon || pageProps?.weaponStats || pageProps?.data;

        if (weaponData) {
          return parseNextDataWeapon(weaponData);
        }
      } catch (parseError) {
        console.error('❌ Failed to parse __NEXT_DATA__:', parseError);
      }
    }
  } catch (error) {
    console.error('❌ Next.js data extraction failed:', error);
  }

  return null;
}

/**
 * Strategy 3: Fallback to HTML table scraping
 */
async function tryHTMLScrapingStrategy(weaponName: string): Promise<CODMunityStats | null> {
  console.log(`🔍 Trying HTML scraping for ${weaponName}...`);

  try {
    // Try the main stats page
    const statsUrl = `${CODMUNITY_BASE_URL}/warzone/weapon-stats`;

    const response = await rateLimiters.codmunity.execute(() =>
      axios.get(statsUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
          Accept: 'text/html,application/xhtml+xml',
        },
        timeout: CODMUNITY_TIMEOUT_MS,
      })
    );

    const $ = cheerio.load(response.data);

    // Try different table structures
    const tableSelectors = [
      'table.weapon-stats',
      'table.stats-table',
      '.weapon-table table',
      '[data-testid="weapon-stats-table"]',
    ];

    for (const selector of tableSelectors) {
      const table = $(selector);
      if (table.length > 0) {
        const stats = parseHTMLTable($ as any, table as any, weaponName);
        if (stats) {
          console.log('✅ Extracted stats from HTML table');
          return stats;
        }
      }
    }
  } catch (error) {
    console.error('❌ HTML scraping failed:', error);
  }

  return null;
}

// ============================================================================
// Data Parsing & Transformation
// ============================================================================

/**
 * Parse API response to CODMunityStats
 */
function parseAPIResponse(data: any): CODMunityStats | null {
  try {
    const stats: CODMunityStats = {
      name: data.name || data.weaponName || 'Unknown',
      game: data.game || 'Warzone',
      ttk: {
        min: data.ttk?.min || data.stats?.ttk?.min || 300,
        max: data.ttk?.max || data.stats?.ttk?.max || 600,
      },
      damageRanges: normalizeDamageRanges(
        data.damageRanges || data.stats?.damageRanges || []
      ),
      fireRate: data.fireRate || data.rpm || data.stats?.fireRate || 600,
      bulletVelocity: data.bulletVelocity || data.velocity || data.stats?.bulletVelocity || 600,
      magazineSize: data.magazineSize || data.magSize || data.stats?.magazineSize || 30,
      reloadTime: data.reloadTime || data.stats?.reloadTime || 2.0,
      adsTime: data.adsTime || data.stats?.adsTime || 250,
      sprintToFireTime: data.sprintToFireTime || data.sprintToFire || data.stats?.sprintToFire || 300,
      movementSpeed: {
        base: data.movementSpeed?.base || data.movement?.base || 5.0,
        ads: data.movementSpeed?.ads || data.movement?.ads || 3.5,
        crouched: data.movementSpeed?.crouched || data.movement?.crouched || 2.5,
      },
      recoilPattern: {
        horizontal: data.recoilPattern?.horizontal || data.recoil?.horizontal || 0,
        vertical: data.recoilPattern?.vertical || data.recoil?.vertical || 0,
      },
      source: 'codmunity',
      scrapedAt: new Date().toISOString(),
    };

    // Ensure damage ranges are sorted
    stats.damageRanges.sort((a, b) => a.range - b.range);

    validateStats(stats);
    return stats;
  } catch (error) {
    console.error('❌ Failed to parse API response:', error);
    return null;
  }
}

/**
 * Parse __NEXT_DATA__ weapon object
 */
function parseNextDataWeapon(weapon: NextDataWeapon): CODMunityStats | null {
  try {
    const stats: CODMunityStats = {
      name: weapon.name || weapon.weaponName || 'Unknown',
      game: 'Warzone',
      ttk: {
        min: weapon.stats?.ttk?.min || 300,
        max: weapon.stats?.ttk?.max || 600,
      },
      damageRanges: normalizeDamageRanges(weapon.stats?.damageRanges || []),
      fireRate: weapon.stats?.fireRate || weapon.stats?.rpm || 600,
      bulletVelocity: weapon.stats?.bulletVelocity || weapon.stats?.velocity || 600,
      magazineSize: weapon.stats?.magazineSize || weapon.stats?.magSize || 30,
      reloadTime: weapon.stats?.reloadTime || 2.0,
      adsTime: weapon.stats?.adsTime || 250,
      sprintToFireTime: weapon.stats?.sprintToFireTime || weapon.stats?.sprintToFire || 300,
      movementSpeed: {
        base: weapon.stats?.movementSpeed?.base || weapon.stats?.movement?.base || 5.0,
        ads: weapon.stats?.movementSpeed?.ads || weapon.stats?.movement?.ads || 3.5,
        crouched: weapon.stats?.movementSpeed?.crouched || weapon.stats?.movement?.crouched || 2.5,
      },
      recoilPattern: {
        horizontal: weapon.stats?.recoilPattern?.horizontal || weapon.stats?.recoil?.horizontal || 0,
        vertical: weapon.stats?.recoilPattern?.vertical || weapon.stats?.recoil?.vertical || 0,
      },
      source: 'codmunity',
      scrapedAt: new Date().toISOString(),
    };

    stats.damageRanges.sort((a, b) => a.range - b.range);
    validateStats(stats);
    return stats;
  } catch (error) {
    console.error('❌ Failed to parse Next.js data:', error);
    return null;
  }
}

/**
 * Parse HTML table to extract weapon stats
 */
function parseHTMLTable(
  $: cheerio.CheerioAPI,
  table: ReturnType<cheerio.CheerioAPI>,
  weaponName: string
): CODMunityStats | null {
  try {
    let foundWeapon = false;
    let weaponRow: ReturnType<cheerio.CheerioAPI> | null = null;

    // Find the weapon row
    table.find('tr').each((i, row) => {
      const $row = $(row);
      const nameCell = $row.find('td:first-child, th:first-child').text().trim();

      if (nameCell.toLowerCase().includes(weaponName.toLowerCase())) {
        weaponRow = $row;
        foundWeapon = true;
        return false; // Break loop
      }
    });

    if (!foundWeapon || !weaponRow) {
      return null;
    }

    // Extract stats from cells
    const cells = weaponRow.find('td').toArray();

    // This is a generic parser - actual selectors would need to be updated
    // based on the real HTML structure
    const stats: CODMunityStats = {
      name: weaponName,
      game: 'Warzone',
      ttk: {
        min: parseFloat($(cells[1]).text()) || 300,
        max: parseFloat($(cells[2]).text()) || 600,
      },
      damageRanges: [],
      fireRate: parseFloat($(cells[3]).text()) || 600,
      bulletVelocity: parseFloat($(cells[4]).text()) || 600,
      magazineSize: parseInt($(cells[5]).text(), 10) || 30,
      reloadTime: parseFloat($(cells[6]).text()) || 2.0,
      adsTime: parseFloat($(cells[7]).text()) || 250,
      sprintToFireTime: parseFloat($(cells[8]).text()) || 300,
      movementSpeed: { base: 5.0, ads: 3.5, crouched: 2.5 },
      recoilPattern: { horizontal: 0, vertical: 0 },
      source: 'codmunity',
      scrapedAt: new Date().toISOString(),
    };

    // Add default damage ranges if not found
    if (stats.damageRanges.length === 0) {
      stats.damageRanges = generateDefaultDamageRanges(stats.fireRate);
    }

    validateStats(stats);
    return stats;
  } catch (error) {
    console.error('❌ Failed to parse HTML table:', error);
    return null;
  }
}

/**
 * Normalize damage ranges from various formats
 */
function normalizeDamageRanges(
  ranges: any[]
): Array<{ range: number; damage: number }> {
  if (!Array.isArray(ranges) || ranges.length === 0) {
    return generateDefaultDamageRanges(600);
  }

  return ranges
    .map((r) => ({
      range: r.range || r.distance || 0,
      damage: r.damage || 30,
    }))
    .filter((r) => r.range >= 0 && r.damage > 0)
    .sort((a, b) => a.range - b.range);
}

/**
 * Generate default damage ranges based on fire rate
 */
function generateDefaultDamageRanges(fireRate: number): Array<{ range: number; damage: number }> {
  // High fire rate = close range weapon
  if (fireRate > 800) {
    return [
      { range: 0, damage: 30 },
      { range: 10, damage: 26 },
      { range: 20, damage: 22 },
    ];
  }
  // Medium fire rate = balanced weapon
  else if (fireRate > 600) {
    return [
      { range: 0, damage: 32 },
      { range: 20, damage: 28 },
      { range: 40, damage: 24 },
    ];
  }
  // Low fire rate = long range weapon
  else {
    return [
      { range: 0, damage: 38 },
      { range: 30, damage: 34 },
      { range: 60, damage: 30 },
    ];
  }
}

// ============================================================================
// Public API
// ============================================================================

/**
 * Fetch weapon statistics from CODMunity
 */
export async function fetchCODMunityWeaponStats(
  weaponName: string
): Promise<CODMunityStats | null> {
  if (!CODMUNITY_SCRAPER_ENABLED) {
    console.log('⚠️  CODMunity scraper is disabled');
    return null;
  }

  console.log(`📥 Fetching ${weaponName} stats from CODMunity...`);

  return cache.cached(
    `codmunity-${weaponName.toLowerCase()}`,
    async () => {
      try {
        return await retryWithBackoff(async () => {
          // Try strategies in order
          let stats = await tryAPIStrategy(weaponName);
          if (stats) return stats;

          stats = await tryNextDataStrategy(weaponName);
          if (stats) return stats;

          stats = await tryHTMLScrapingStrategy(weaponName);
          if (stats) return stats;

          console.log(`⚠️  Could not extract stats for ${weaponName} from CODMunity`);
          return null;
        });
      } catch (error) {
        console.error(`❌ Failed to fetch CODMunity data for ${weaponName}:`, error);

        if (axios.isAxiosError(error)) {
          if (error.response) {
            console.error(`   Status: ${error.response.status}`);
            console.error(`   Headers:`, error.response.headers);
          } else if (error.request) {
            console.error('   No response received - network error');
          }
        }

        // Check cache for fallback
        const cachedData = await cache.get<CODMunityStats>(
          `codmunity-${weaponName.toLowerCase()}-backup`
        );
        if (cachedData) {
          console.log('✅ Using backup cache data');
          return cachedData;
        }

        return null;
      }
    },
    CODMUNITY_CACHE_TTL_HOURS * 60 * 60 * 1000
  );
}

/**
 * Fetch all weapon stats from CODMunity
 */
export async function fetchAllCODMunityStats(): Promise<CODMunityStats[]> {
  if (!CODMUNITY_SCRAPER_ENABLED) {
    console.log('⚠️  CODMunity scraper is disabled');
    return [];
  }

  console.log('📥 Fetching all weapon stats from CODMunity...');

  return cache.cached(
    'codmunity-all-stats',
    async () => {
      try {
        return await retryWithBackoff(async () => {
          // Try to fetch all weapons from API
          const apiEndpoints = [
            '/api/weapons',
            '/api/warzone/weapons',
            '/api/v1/weapons',
          ];

          for (const endpoint of apiEndpoints) {
            try {
              const response = await rateLimiters.codmunity.execute(() =>
                axios.get(`${CODMUNITY_BASE_URL}${endpoint}`, {
                  headers: {
                    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
                    Accept: 'application/json',
                  },
                  timeout: CODMUNITY_TIMEOUT_MS,
                })
              );

              if (Array.isArray(response.data)) {
                console.log(`✅ Found batch API endpoint: ${endpoint}`);
                return response.data
                  .map((item) => parseAPIResponse(item))
                  .filter((stats): stats is CODMunityStats => stats !== null);
              }
            } catch (error) {
              continue;
            }
          }

          console.log('⚠️  Batch fetching not available - use individual fetches');
          return [];
        });
      } catch (error) {
        console.error('❌ Failed to fetch all CODMunity stats:', error);
        return [];
      }
    },
    CODMUNITY_CACHE_TTL_HOURS * 60 * 60 * 1000
  );
}

/**
 * Test connection to CODMunity
 */
export async function testCODMunityConnection(): Promise<boolean> {
  try {
    console.log('🔍 Testing CODMunity connection...');

    const response = await axios.head(CODMUNITY_BASE_URL, {
      timeout: 5000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
      },
    });

    if (response.status === 200) {
      console.log('✅ CODMunity connection successful');
      return true;
    }

    return false;
  } catch (error) {
    console.error('❌ CODMunity connection failed:', error);
    return false;
  }
}
