import axios from 'axios';
import { rateLimiters } from '../utils/rate-limiter';
import { cache } from '../utils/cache';

const CODARMORY_BASE_URL =
  'https://raw.githubusercontent.com/tzurbaev/codarmory.com/main/src/database';

export interface CODArmoryWeapon {
  name: string;
  game: string;
  category: string;
  stats?: Record<string, number>;
  attachments?: Record<string, string[]>;
  [key: string]: any;
}

export interface CODArmoryAttachment {
  name: string;
  slot: string;
  weapons?: string[];
  stats?: Record<string, number>;
  [key: string]: any;
}

/**
 * Fetch weapons data from CODArmory GitHub repository
 */
export async function fetchCODArmoryWeapons(): Promise<CODArmoryWeapon[]> {
  console.log('📥 Fetching weapons from CODArmory...');

  return cache.cached(
    'codarmory-weapons',
    async () => {
      const url = `${CODARMORY_BASE_URL}/weapons.json`;

      const response = await rateLimiters.github.execute(() =>
        axios.get(url, {
          headers: {
            'User-Agent': 'Counterplay/1.0 (COD Loadout App)',
            Accept: 'application/json',
          },
        })
      );

      if (!Array.isArray(response.data)) {
        console.warn('⚠️  Weapons data is not an array, attempting to extract...');

        // Sometimes the structure might be nested
        if (response.data.weapons && Array.isArray(response.data.weapons)) {
          return response.data.weapons;
        }

        // Try to find any array in the response
        const firstArray = Object.values(response.data).find(
          (val) => Array.isArray(val)
        );

        if (firstArray) {
          return firstArray as CODArmoryWeapon[];
        }

        throw new Error('Could not find weapons array in response');
      }

      console.log(`✅ Fetched ${response.data.length} weapons`);
      return response.data;
    },
    7 * 24 * 60 * 60 * 1000 // Cache for 7 days
  );
}

/**
 * Fetch attachments data from CODArmory GitHub repository
 */
export async function fetchCODArmoryAttachments(): Promise<CODArmoryAttachment[]> {
  console.log('📥 Fetching attachments from CODArmory...');

  return cache.cached(
    'codarmory-attachments',
    async () => {
      const url = `${CODARMORY_BASE_URL}/attachments.json`;

      const response = await rateLimiters.github.execute(() =>
        axios.get(url, {
          headers: {
            'User-Agent': 'Counterplay/1.0 (COD Loadout App)',
            Accept: 'application/json',
          },
        })
      );

      if (!Array.isArray(response.data)) {
        console.warn('⚠️  Attachments data is not an array, attempting to extract...');

        if (response.data.attachments && Array.isArray(response.data.attachments)) {
          return response.data.attachments;
        }

        const firstArray = Object.values(response.data).find(
          (val) => Array.isArray(val)
        );

        if (firstArray) {
          return firstArray as CODArmoryAttachment[];
        }

        throw new Error('Could not find attachments array in response');
      }

      console.log(`✅ Fetched ${response.data.length} attachments`);
      return response.data;
    },
    7 * 24 * 60 * 60 * 1000 // Cache for 7 days
  );
}

/**
 * Fetch attachment categories from CODArmory
 */
export async function fetchCODArmoryCategories(): Promise<any> {
  console.log('📥 Fetching categories from CODArmory...');

  return cache.cached(
    'codarmory-categories',
    async () => {
      const url = `${CODARMORY_BASE_URL}/attachment-categories.json`;

      try {
        const response = await rateLimiters.github.execute(() =>
          axios.get(url, {
            headers: {
              'User-Agent': 'Counterplay/1.0 (COD Loadout App)',
              Accept: 'application/json',
            },
          })
        );

        console.log(`✅ Fetched attachment categories`);
        return response.data;
      } catch (error) {
        console.warn('⚠️  Could not fetch categories (optional)');
        return {};
      }
    },
    7 * 24 * 60 * 60 * 1000
  );
}

/**
 * Fetch all CODArmory data
 */
export async function fetchAllCODArmoryData() {
  console.log('🔄 Fetching all CODArmory data...');

  const [weapons, attachments, categories] = await Promise.all([
    fetchCODArmoryWeapons(),
    fetchCODArmoryAttachments(),
    fetchCODArmoryCategories(),
  ]);

  console.log('✅ Successfully fetched all CODArmory data');
  console.log(`   📊 ${weapons.length} weapons`);
  console.log(`   🔧 ${attachments.length} attachments`);

  return { weapons, attachments, categories };
}

/**
 * Test connection to CODArmory repository
 */
export async function testCODArmoryConnection(): Promise<boolean> {
  try {
    console.log('🔍 Testing CODArmory connection...');

    // Test the actual weapons.json file instead of the directory
    const testUrl = `${CODARMORY_BASE_URL}/weapons.json`;
    const response = await axios.head(testUrl, {
      timeout: 5000,
    });

    if (response.status === 200 || response.status === 301) {
      console.log('✅ CODArmory connection successful');
      return true;
    }

    console.warn('⚠️  CODArmory returned unexpected status:', response.status);
    return false;
  } catch (error) {
    console.error('❌ CODArmory connection failed');
    if (error instanceof Error) {
      console.error('   Error:', error.message);
    }
    return false;
  }
}
