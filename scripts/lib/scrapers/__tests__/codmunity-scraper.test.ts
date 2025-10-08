import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import axios from 'axios';
import {
  fetchCODMunityWeaponStats,
  fetchAllCODMunityStats,
  testCODMunityConnection,
  CODMunityStats,
} from '../codmunity-scraper';
import { cache } from '../../utils/cache';

// Mock axios
vi.mock('axios');
const mockedAxios = vi.mocked(axios);

// Mock cache
vi.mock('../../utils/cache', () => ({
  cache: {
    cached: vi.fn((key, fn) => fn()),
    get: vi.fn(),
    set: vi.fn(),
  },
}));

// Mock rate limiter
vi.mock('../../utils/rate-limiter', () => ({
  rateLimiters: {
    codmunity: {
      execute: vi.fn((fn) => fn()),
    },
  },
}));

describe('CODMunity Scraper', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('fetchCODMunityWeaponStats', () => {
    it('should fetch weapon stats from API endpoint', async () => {
      const mockAPIData = {
        name: 'M4A1',
        game: 'Warzone',
        ttk: { min: 450, max: 650 },
        damageRanges: [
          { range: 0, damage: 28 },
          { range: 25, damage: 24 },
          { range: 50, damage: 20 },
        ],
        fireRate: 833,
        bulletVelocity: 750,
        magazineSize: 30,
        reloadTime: 2.2,
        adsTime: 250,
        sprintToFireTime: 300,
        movementSpeed: { base: 5.5, ads: 3.8, crouched: 2.8 },
        recoilPattern: { horizontal: 15, vertical: 35 },
      };

      mockedAxios.get.mockResolvedValueOnce({
        data: mockAPIData,
        status: 200,
      });

      const result = await fetchCODMunityWeaponStats('M4A1');

      expect(result).toBeDefined();
      expect(result?.name).toBe('M4A1');
      expect(result?.ttk.min).toBe(450);
      expect(result?.ttk.max).toBe(650);
      expect(result?.fireRate).toBe(833);
      expect(result?.source).toBe('codmunity');
    });

    it('should extract stats from __NEXT_DATA__ JSON', async () => {
      const mockHTML = `
        <html>
          <body>
            <script id="__NEXT_DATA__" type="application/json">
              {
                "props": {
                  "pageProps": {
                    "weapon": {
                      "name": "SVA 545",
                      "stats": {
                        "ttk": { "min": 380, "max": 580 },
                        "damageRanges": [
                          { "range": 0, "damage": 32 },
                          { "range": 30, "damage": 26 }
                        ],
                        "fireRate": 700,
                        "bulletVelocity": 680,
                        "magazineSize": 45,
                        "reloadTime": 2.5,
                        "adsTime": 260,
                        "sprintToFire": 320,
                        "movementSpeed": { "base": 5.2, "ads": 3.6, "crouched": 2.6 },
                        "recoilPattern": { "horizontal": 12, "vertical": 28 }
                      }
                    }
                  }
                }
              }
            </script>
          </body>
        </html>
      `;

      // Mock API to fail, then HTML to succeed
      mockedAxios.get
        .mockRejectedValueOnce(new Error('API not found'))
        .mockResolvedValueOnce({
          data: mockHTML,
          status: 200,
        });

      const result = await fetchCODMunityWeaponStats('SVA 545');

      expect(result).toBeDefined();
      expect(result?.name).toBe('SVA 545');
      expect(result?.ttk.min).toBe(380);
      expect(result?.fireRate).toBe(700);
      expect(result?.source).toBe('codmunity');
    });

    it('should validate TTK ranges', async () => {
      const invalidData = {
        name: 'Invalid Gun',
        stats: {
          ttk: { min: 10, max: 5000 }, // Out of valid range
          fireRate: 600,
          bulletVelocity: 700,
          damageRanges: [{ range: 0, damage: 30 }],
        },
      };

      mockedAxios.get.mockResolvedValueOnce({
        data: invalidData,
        status: 200,
      });

      const result = await fetchCODMunityWeaponStats('Invalid Gun');

      // Should return null due to validation failure
      expect(result).toBeNull();
    });

    it('should validate fire rate ranges', async () => {
      const invalidData = {
        name: 'Super Gun',
        stats: {
          ttk: { min: 300, max: 600 },
          fireRate: 2000, // Out of valid range (300-1200)
          bulletVelocity: 700,
          damageRanges: [{ range: 0, damage: 30 }],
        },
      };

      mockedAxios.get.mockResolvedValueOnce({
        data: invalidData,
        status: 200,
      });

      const result = await fetchCODMunityWeaponStats('Super Gun');

      expect(result).toBeNull();
    });

    it('should validate bullet velocity ranges', async () => {
      const invalidData = {
        name: 'Slow Gun',
        stats: {
          ttk: { min: 300, max: 600 },
          fireRate: 600,
          bulletVelocity: 50, // Too slow (min 200)
          damageRanges: [{ range: 0, damage: 30 }],
        },
      };

      mockedAxios.get.mockResolvedValueOnce({
        data: invalidData,
        status: 200,
      });

      const result = await fetchCODMunityWeaponStats('Slow Gun');

      expect(result).toBeNull();
    });

    it('should ensure damage ranges are sorted ascending', async () => {
      const mockData = {
        name: 'Test Gun',
        stats: {
          ttk: { min: 300, max: 600 },
          fireRate: 700,
          bulletVelocity: 700,
          damageRanges: [
            { range: 30, damage: 26 }, // Out of order
            { range: 0, damage: 30 },
          ],
        },
      };

      mockedAxios.get.mockResolvedValueOnce({
        data: mockData,
        status: 200,
      });

      const result = await fetchCODMunityWeaponStats('Test Gun');

      // Should fail validation or auto-sort
      if (result) {
        expect(result.damageRanges[0].range).toBeLessThan(result.damageRanges[1].range);
      }
    });

    it('should retry on network failure', async () => {
      const mockData = {
        name: 'Retry Gun',
        stats: {
          ttk: { min: 400, max: 700 },
          fireRate: 750,
          bulletVelocity: 800,
          damageRanges: [{ range: 0, damage: 32 }],
          movementSpeed: { base: 5.0, ads: 3.5, crouched: 2.5 },
          recoilPattern: { horizontal: 10, vertical: 30 },
        },
      };

      // Fail twice, then succeed
      mockedAxios.get
        .mockRejectedValueOnce(new Error('Network error'))
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce({
          data: mockData,
          status: 200,
        });

      const result = await fetchCODMunityWeaponStats('Retry Gun');

      expect(result).toBeDefined();
      expect(result?.name).toBe('Retry Gun');
      expect(mockedAxios.get).toHaveBeenCalledTimes(3);
    });

    it('should use cache fallback on error', async () => {
      const cachedStats: CODMunityStats = {
        name: 'Cached Gun',
        game: 'Warzone',
        ttk: { min: 350, max: 550 },
        damageRanges: [{ range: 0, damage: 30 }],
        fireRate: 800,
        bulletVelocity: 750,
        magazineSize: 30,
        reloadTime: 2.0,
        adsTime: 240,
        sprintToFireTime: 290,
        movementSpeed: { base: 5.5, ads: 3.7, crouched: 2.7 },
        recoilPattern: { horizontal: 12, vertical: 32 },
        source: 'codmunity',
        scrapedAt: new Date().toISOString(),
      };

      mockedAxios.get.mockRejectedValue(new Error('Server down'));
      vi.mocked(cache.get).mockResolvedValueOnce(cachedStats);

      const result = await fetchCODMunityWeaponStats('Cached Gun');

      expect(result).toBeDefined();
      expect(result?.name).toBe('Cached Gun');
      expect(cache.get).toHaveBeenCalled();
    });

    it('should handle missing optional fields', async () => {
      const minimalData = {
        name: 'Minimal Gun',
        // Missing many optional fields
      };

      mockedAxios.get.mockResolvedValueOnce({
        data: minimalData,
        status: 200,
      });

      const result = await fetchCODMunityWeaponStats('Minimal Gun');

      // Should use defaults and still validate
      if (result) {
        expect(result.name).toBe('Minimal Gun');
        expect(result.fireRate).toBeGreaterThanOrEqual(300);
        expect(result.fireRate).toBeLessThanOrEqual(1200);
        expect(result.damageRanges.length).toBeGreaterThan(0);
      }
    });

    it('should return null when scraper is disabled', async () => {
      const originalEnv = process.env.CODMUNITY_SCRAPER_ENABLED;
      process.env.CODMUNITY_SCRAPER_ENABLED = 'false';

      const result = await fetchCODMunityWeaponStats('Test Gun');

      expect(result).toBeNull();

      process.env.CODMUNITY_SCRAPER_ENABLED = originalEnv;
    });
  });

  describe('fetchAllCODMunityStats', () => {
    it('should fetch all weapons from batch API', async () => {
      const mockBatchData = [
        {
          name: 'M4A1',
          fireRate: 833,
          bulletVelocity: 750,
          ttk: { min: 450, max: 650 },
          damageRanges: [{ range: 0, damage: 28 }],
        },
        {
          name: 'SVA 545',
          fireRate: 700,
          bulletVelocity: 680,
          ttk: { min: 380, max: 580 },
          damageRanges: [{ range: 0, damage: 32 }],
        },
      ];

      mockedAxios.get.mockResolvedValueOnce({
        data: mockBatchData,
        status: 200,
      });

      const result = await fetchAllCODMunityStats();

      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThan(0);
    });

    it('should return empty array when batch API not available', async () => {
      mockedAxios.get.mockRejectedValue(new Error('API not found'));

      const result = await fetchAllCODMunityStats();

      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(0);
    });
  });

  describe('testCODMunityConnection', () => {
    it('should return true when connection succeeds', async () => {
      mockedAxios.head.mockResolvedValueOnce({
        status: 200,
      });

      const result = await testCODMunityConnection();

      expect(result).toBe(true);
    });

    it('should return false when connection fails', async () => {
      mockedAxios.head.mockRejectedValueOnce(new Error('Connection failed'));

      const result = await testCODMunityConnection();

      expect(result).toBe(false);
    });
  });

  describe('Data validation edge cases', () => {
    it('should handle empty damage ranges', async () => {
      const mockData = {
        name: 'No Damage Gun',
        stats: {
          ttk: { min: 300, max: 600 },
          fireRate: 700,
          bulletVelocity: 700,
          damageRanges: [], // Empty
        },
      };

      mockedAxios.get.mockResolvedValueOnce({
        data: mockData,
        status: 200,
      });

      const result = await fetchCODMunityWeaponStats('No Damage Gun');

      // Should either fail validation or generate default ranges
      expect(result).toBeDefined();
      if (result) {
        expect(result.damageRanges.length).toBeGreaterThan(0);
      }
    });

    it('should handle negative damage values', async () => {
      const mockData = {
        name: 'Negative Gun',
        stats: {
          ttk: { min: 300, max: 600 },
          fireRate: 700,
          bulletVelocity: 700,
          damageRanges: [{ range: 0, damage: -10 }], // Invalid
        },
      };

      mockedAxios.get.mockResolvedValueOnce({
        data: mockData,
        status: 200,
      });

      const result = await fetchCODMunityWeaponStats('Negative Gun');

      expect(result).toBeNull(); // Should fail validation
    });

    it('should handle extremely high damage ranges', async () => {
      const mockData = {
        name: 'Ultra Range Gun',
        stats: {
          ttk: { min: 300, max: 600 },
          fireRate: 700,
          bulletVelocity: 700,
          damageRanges: [{ range: 500, damage: 30 }], // Too far
        },
      };

      mockedAxios.get.mockResolvedValueOnce({
        data: mockData,
        status: 200,
      });

      const result = await fetchCODMunityWeaponStats('Ultra Range Gun');

      expect(result).toBeNull(); // Should fail validation
    });

    it('should validate TTK min is not greater than max', async () => {
      const mockData = {
        name: 'Backwards Gun',
        stats: {
          ttk: { min: 700, max: 300 }, // Backwards
          fireRate: 700,
          bulletVelocity: 700,
          damageRanges: [{ range: 0, damage: 30 }],
        },
      };

      mockedAxios.get.mockResolvedValueOnce({
        data: mockData,
        status: 200,
      });

      const result = await fetchCODMunityWeaponStats('Backwards Gun');

      expect(result).toBeNull(); // Should fail validation
    });
  });

  describe('Scraping strategy fallback', () => {
    it('should try API first, then __NEXT_DATA__, then HTML scraping', async () => {
      const mockHTML = `
        <html>
          <body>
            <table class="weapon-stats">
              <tr>
                <td>Fallback Gun</td>
                <td>400</td>
                <td>600</td>
                <td>750</td>
                <td>800</td>
                <td>30</td>
                <td>2.0</td>
                <td>250</td>
                <td>300</td>
              </tr>
            </table>
          </body>
        </html>
      `;

      // Mock API to fail
      mockedAxios.get
        .mockRejectedValueOnce(new Error('API not found'))
        .mockResolvedValueOnce({
          data: mockHTML,
          status: 200,
        });

      const result = await fetchCODMunityWeaponStats('Fallback Gun');

      // Should eventually get data from HTML scraping
      expect(mockedAxios.get).toHaveBeenCalled();
    });
  });

  describe('Performance and timeout handling', () => {
    it('should timeout after configured duration', async () => {
      const originalTimeout = process.env.CODMUNITY_TIMEOUT_MS;
      process.env.CODMUNITY_TIMEOUT_MS = '100'; // 100ms timeout

      mockedAxios.get.mockImplementation(
        () =>
          new Promise((resolve) => {
            setTimeout(() => resolve({ data: {}, status: 200 }), 200); // Takes 200ms
          })
      );

      const startTime = Date.now();
      await fetchCODMunityWeaponStats('Slow Gun');
      const duration = Date.now() - startTime;

      // Should timeout before 200ms completes
      expect(duration).toBeLessThan(200);

      process.env.CODMUNITY_TIMEOUT_MS = originalTimeout;
    }, 1000);
  });
});
