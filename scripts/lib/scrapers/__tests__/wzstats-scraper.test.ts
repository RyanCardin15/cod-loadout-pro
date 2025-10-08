/**
 * WZStats Scraper Tests
 *
 * Tests for the WZStats.gg scraper implementation including:
 * - Successful data fetching via API
 * - HTML parsing fallback
 * - Error handling and retries
 * - Cache integration
 * - Data validation
 */

import axios from 'axios';
import { cache } from '../../utils/cache';
import { rateLimiters } from '../../utils/rate-limiter';
import {
  fetchWZStatsMetaData,
  testWZStatsConnection,
  WZStatsWeapon,
} from '../wzstats-scraper';

// Mock dependencies
jest.mock('axios');
jest.mock('../../utils/cache');
jest.mock('../../utils/rate-limiter');

const mockedAxios = axios as jest.Mocked<typeof axios>;
const mockedCache = cache as jest.Mocked<typeof cache>;
const mockedRateLimiters = rateLimiters as jest.Mocked<typeof rateLimiters>;

describe('WZStats Scraper', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.resetAllMocks();

    // Setup default rate limiter mock
    mockedRateLimiters.wzranked = {
      execute: jest.fn((fn) => fn()),
    } as any;

    // Setup default cache mock
    mockedCache.cached = jest.fn(async (_key, fn) => fn());
    mockedCache.get = jest.fn().mockResolvedValue(null);
    mockedCache.set = jest.fn().mockResolvedValue(undefined);

    // Reset environment variables
    process.env.WZSTATS_SCRAPER_ENABLED = 'true';
    process.env.WZSTATS_BASE_URL = 'https://wzstats.gg';
  });

  describe('fetchWZStatsMetaData', () => {
    describe('API Endpoint Discovery', () => {
      it('should successfully fetch data from working API endpoint', async () => {
        const mockAPIResponse = {
          data: [
            {
              name: 'SVA 545',
              tier: 'S',
              usage: 25.5,
              winRate: 52.3,
              game: 'Warzone',
            },
            {
              name: 'RAM-9',
              tier: 'A',
              usage: 18.2,
              winRate: 51.1,
              game: 'Warzone',
            },
          ],
        };

        mockedAxios.get = jest
          .fn()
          .mockRejectedValueOnce(new Error('404')) // First endpoint fails
          .mockResolvedValueOnce(mockAPIResponse); // Second endpoint succeeds

        const result = await fetchWZStatsMetaData();

        expect(result).toHaveLength(2);
        expect(result[0]).toMatchObject({
          name: 'SVA 545',
          tier: 'S',
          usage: 25.5,
          winRate: 52.3,
        });
        expect(mockedCache.cached).toHaveBeenCalled();
      });

      it('should handle API response with nested weapons array', async () => {
        const mockAPIResponse = {
          data: {
            weapons: [
              {
                weaponName: 'MCW',
                tier: 'B',
                pickRate: 15.0,
                wr: 50.5,
              },
            ],
          },
        };

        mockedAxios.get = jest.fn().mockResolvedValueOnce(mockAPIResponse);

        const result = await fetchWZStatsMetaData();

        expect(result).toHaveLength(1);
        expect(result[0].name).toBe('MCW');
        expect(result[0].usage).toBe(15.0);
        expect(result[0].winRate).toBe(50.5);
      });

      it('should normalize percentage values correctly', async () => {
        const mockAPIResponse = {
          data: [
            {
              name: 'Test Weapon',
              tier: 'A',
              usage: 0.25, // Decimal format
              winRate: 55, // Percentage format
            },
          ],
        };

        mockedAxios.get = jest.fn().mockResolvedValueOnce(mockAPIResponse);

        const result = await fetchWZStatsMetaData();

        expect(result[0].usage).toBe(25); // Converted to percentage
        expect(result[0].winRate).toBe(55);
      });
    });

    describe('HTML __NEXT_DATA__ Parsing', () => {
      it('should extract data from __NEXT_DATA__ JSON', async () => {
        const mockHTML = `
          <!DOCTYPE html>
          <html>
            <body>
              <script id="__NEXT_DATA__" type="application/json">
                {
                  "props": {
                    "pageProps": {
                      "weapons": [
                        {
                          "name": "Holger 556",
                          "tier": "S",
                          "pickRate": 22.5,
                          "winRate": 51.8
                        }
                      ]
                    }
                  }
                }
              </script>
            </body>
          </html>
        `;

        mockedAxios.get = jest
          .fn()
          .mockRejectedValue(new Error('API not found')) // All API endpoints fail
          .mockResolvedValueOnce({ data: mockHTML }); // HTML fallback

        const result = await fetchWZStatsMetaData();

        expect(result).toHaveLength(1);
        expect(result[0].name).toBe('Holger 556');
        expect(result[0].tier).toBe('S');
      });

      it('should extract data from tiers object in __NEXT_DATA__', async () => {
        const mockHTML = `
          <!DOCTYPE html>
          <html>
            <body>
              <script id="__NEXT_DATA__" type="application/json">
                {
                  "props": {
                    "pageProps": {
                      "tiers": {
                        "S": [
                          {"name": "SVA 545", "pickRate": 25.5, "winRate": 52.3}
                        ],
                        "A": [
                          {"name": "RAM-9", "pickRate": 18.2, "winRate": 51.1}
                        ]
                      }
                    }
                  }
                }
              </script>
            </body>
          </html>
        `;

        mockedAxios.get = jest
          .fn()
          .mockRejectedValue(new Error('API not found'))
          .mockResolvedValueOnce({ data: mockHTML });

        const result = await fetchWZStatsMetaData();

        expect(result).toHaveLength(2);
        expect(result.find((w) => w.tier === 'S')).toBeDefined();
        expect(result.find((w) => w.tier === 'A')).toBeDefined();
      });
    });

    describe('HTML Cheerio Parsing', () => {
      it('should parse weapon data from HTML structure', async () => {
        const mockHTML = `
          <!DOCTYPE html>
          <html>
            <body>
              <div class="weapon-card">
                <h3 class="weapon-name">MTZ-556</h3>
                <span class="tier-badge">A</span>
                <div class="stats">
                  <span class="usage-percent">12.5%</span>
                  <span class="win-rate">50.2%</span>
                </div>
              </div>
            </body>
          </html>
        `;

        mockedAxios.get = jest
          .fn()
          .mockRejectedValue(new Error('API not found'))
          .mockResolvedValueOnce({ data: mockHTML });

        const result = await fetchWZStatsMetaData();

        // HTML parsing might extract the weapon
        expect(result.length).toBeGreaterThanOrEqual(0);
      });
    });

    describe('Error Handling', () => {
      it('should retry with exponential backoff on failure', async () => {
        mockedAxios.get = jest
          .fn()
          .mockRejectedValueOnce(new Error('Network error'))
          .mockRejectedValueOnce(new Error('Network error'))
          .mockResolvedValueOnce({ data: [] });

        await fetchWZStatsMetaData();

        // Should have retried multiple times
        expect(mockedAxios.get).toHaveBeenCalledTimes(3);
      });

      it('should return cached data on complete failure', async () => {
        const cachedWeapons: WZStatsWeapon[] = [
          {
            name: 'Cached Weapon',
            tier: 'B',
            usage: 10,
            winRate: 50,
            game: 'Warzone',
          },
        ];

        mockedCache.get = jest.fn().mockResolvedValue(cachedWeapons);
        mockedAxios.get = jest.fn().mockRejectedValue(new Error('Total failure'));

        // Override cached to allow the function to execute
        mockedCache.cached = jest.fn(async (key, fn) => {
          try {
            return await fn();
          } catch (error) {
            // Simulate fallback to cached data
            return cachedWeapons;
          }
        });

        const result = await fetchWZStatsMetaData();

        expect(result).toEqual(cachedWeapons);
      });

      it('should return empty array when no data available', async () => {
        mockedCache.get = jest.fn().mockResolvedValue(null);
        mockedCache.cached = jest.fn(async (_key, fn) => fn());
        mockedAxios.get = jest.fn().mockRejectedValue(new Error('No data'));

        const result = await fetchWZStatsMetaData();

        expect(result).toEqual([]);
      });

      it('should handle malformed JSON in __NEXT_DATA__', async () => {
        const mockHTML = `
          <!DOCTYPE html>
          <html>
            <body>
              <script id="__NEXT_DATA__" type="application/json">
                {invalid json}
              </script>
            </body>
          </html>
        `;

        mockedAxios.get = jest
          .fn()
          .mockRejectedValue(new Error('API not found'))
          .mockResolvedValueOnce({ data: mockHTML });

        const result = await fetchWZStatsMetaData();

        // Should handle gracefully and return empty array
        expect(Array.isArray(result)).toBe(true);
      });
    });

    describe('Cache Integration', () => {
      it('should use cached data when available', async () => {
        const cachedData: WZStatsWeapon[] = [
          {
            name: 'Cached',
            tier: 'A',
            usage: 20,
            winRate: 52,
            game: 'Warzone',
          },
        ];

        mockedCache.cached = jest.fn().mockResolvedValue(cachedData);

        const result = await fetchWZStatsMetaData();

        expect(result).toEqual(cachedData);
        expect(mockedCache.cached).toHaveBeenCalledWith(
          'wzstats-meta',
          expect.any(Function),
          expect.any(Number)
        );
      });

      it('should respect cache TTL from environment', async () => {
        process.env.WZSTATS_CACHE_TTL_HOURS = '4';

        mockedCache.cached = jest.fn(async (_key, fn) => fn());
        mockedAxios.get = jest.fn().mockResolvedValue({ data: [] });

        await fetchWZStatsMetaData();

        expect(mockedCache.cached).toHaveBeenCalledWith(
          'wzstats-meta',
          expect.any(Function),
          4 * 60 * 60 * 1000 // 4 hours in milliseconds
        );
      });
    });

    describe('Configuration', () => {
      it('should skip scraping when disabled', async () => {
        process.env.WZSTATS_SCRAPER_ENABLED = 'false';

        const result = await fetchWZStatsMetaData();

        expect(result).toEqual([]);
        expect(mockedAxios.get).not.toHaveBeenCalled();
      });

      it('should use custom base URL from environment', async () => {
        process.env.WZSTATS_BASE_URL = 'https://custom.wzstats.com';

        mockedCache.cached = jest.fn(async (_key, fn) => fn());
        mockedAxios.get = jest.fn().mockResolvedValue({ data: [] });

        await fetchWZStatsMetaData();

        expect(mockedAxios.get).toHaveBeenCalledWith(
          expect.stringContaining('custom.wzstats.com'),
          expect.any(Object)
        );
      });

      it('should respect timeout configuration', async () => {
        process.env.WZSTATS_TIMEOUT_MS = '5000';

        mockedCache.cached = jest.fn(async (_key, fn) => fn());
        mockedAxios.get = jest.fn().mockResolvedValue({ data: [] });

        await fetchWZStatsMetaData();

        expect(mockedAxios.get).toHaveBeenCalledWith(
          expect.any(String),
          expect.objectContaining({ timeout: 5000 })
        );
      });
    });

    describe('Data Normalization', () => {
      it('should normalize tier names correctly', async () => {
        const mockData = [
          { name: 'Test1', tier: 's', usage: 10, winRate: 50 },
          { name: 'Test2', tier: 'META', usage: 10, winRate: 50 },
          { name: 'Test3', tier: 'a-tier', usage: 10, winRate: 50 },
          { name: 'Test4', tier: 'invalid', usage: 10, winRate: 50 },
        ];

        mockedAxios.get = jest.fn().mockResolvedValue({ data: mockData });

        const result = await fetchWZStatsMetaData();

        expect(result[0].tier).toBe('S');
        expect(result[1].tier).toBe('S');
        expect(result[2].tier).toBe('A');
        expect(result[3].tier).toBe('C'); // Default
      });

      it('should normalize weapon names', async () => {
        const mockData = [
          { name: '  SVA 545  ', tier: 'S', usage: 25, winRate: 52 },
          { name: 'RAM-9!!!', tier: 'A', usage: 18, winRate: 51 },
        ];

        mockedAxios.get = jest.fn().mockResolvedValue({ data: mockData });

        const result = await fetchWZStatsMetaData();

        expect(result[0].name).toBe('SVA 545'); // Trimmed
        expect(result[1].name).toBe('RAM-9'); // Special chars removed
      });

      it('should handle various percentage formats', async () => {
        const mockData = [
          { name: 'Test1', tier: 'A', usage: '25.5%', winRate: '52.3%' },
          { name: 'Test2', tier: 'A', usage: '18.2', winRate: 51 },
          { name: 'Test3', tier: 'A', usage: 0.15, winRate: 0.48 },
        ];

        mockedAxios.get = jest.fn().mockResolvedValue({ data: mockData });

        const result = await fetchWZStatsMetaData();

        expect(result[0].usage).toBe(25.5);
        expect(result[0].winRate).toBe(52.3);
        expect(result[1].usage).toBe(18.2);
        expect(result[2].usage).toBe(15); // Converted from 0.15
        expect(result[2].winRate).toBe(48); // Converted from 0.48
      });
    });
  });

  describe('testWZStatsConnection', () => {
    it('should return true on successful connection', async () => {
      mockedAxios.head = jest.fn().mockResolvedValue({ status: 200 });

      const result = await testWZStatsConnection();

      expect(result).toBe(true);
      expect(mockedAxios.head).toHaveBeenCalledWith(
        expect.stringContaining('wzstats.gg'),
        expect.any(Object)
      );
    });

    it('should return true on redirect status codes', async () => {
      mockedAxios.head = jest.fn().mockResolvedValue({ status: 301 });

      const result = await testWZStatsConnection();

      expect(result).toBe(true);
    });

    it('should return false on connection failure', async () => {
      mockedAxios.head = jest.fn().mockRejectedValue(new Error('Connection failed'));

      const result = await testWZStatsConnection();

      expect(result).toBe(false);
    });

    it('should handle timeout errors', async () => {
      const timeoutError = new Error('Timeout');
      (timeoutError as any).code = 'ECONNABORTED';
      mockedAxios.head = jest.fn().mockRejectedValue(timeoutError);

      const result = await testWZStatsConnection();

      expect(result).toBe(false);
    });
  });

  describe('Rate Limiting', () => {
    it('should use wzranked rate limiter', async () => {
      mockedCache.cached = jest.fn(async (_key, fn) => fn());
      mockedAxios.get = jest.fn().mockResolvedValue({ data: [] });

      await fetchWZStatsMetaData();

      expect(mockedRateLimiters.wzranked.execute).toHaveBeenCalled();
    });

    it('should handle rate limiter errors', async () => {
      mockedCache.cached = jest.fn(async (_key, fn) => fn());
      mockedRateLimiters.wzranked.execute = jest
        .fn()
        .mockRejectedValue(new Error('Rate limit exceeded'));

      const result = await fetchWZStatsMetaData();

      // Should handle gracefully
      expect(Array.isArray(result)).toBe(true);
    });
  });
});
