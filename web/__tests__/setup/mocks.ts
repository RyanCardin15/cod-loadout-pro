/**
 * Mock Data Factories
 *
 * Functions to generate realistic mock data for testing.
 * These factories provide consistent test data across the test suite.
 */

import type { Weapon } from '@/types/weapons';
import type { Loadout } from '@/types/loadouts';
import type { MetaSnapshot } from '@/types/meta';

/**
 * Create a mock weapon with realistic defaults
 */
export function createMockWeapon(overrides?: Partial<Weapon>): Weapon {
  const defaultWeapon: Weapon = {
    id: 'weapon-1',
    name: 'Test Assault Rifle',
    category: 'Assault Rifle',
    game: 'MW3',
    description: 'A reliable assault rifle for medium-range combat',
    stats: {
      damage: 75,
      range: 65,
      accuracy: 80,
      fireRate: 70,
      mobility: 60,
      control: 75,
    },
    meta: {
      tier: 'A',
      popularity: 45,
      winRate: 52,
      pickRate: 12,
      kdRatio: 1.15,
    },
    imageUrl: 'https://example.com/weapons/test-ar.png',
    unlockLevel: 15,
    availableAttachments: {
      optic: ['Red Dot', 'Holographic', 'ACOG'],
      barrel: ['Short Barrel', 'Long Barrel'],
      magazine: ['Extended Mag', 'Fast Mag'],
      underbarrel: ['Foregrip', 'Bipod'],
      stock: ['Tactical Stock', 'Heavy Stock'],
    },
    baseStats: {
      damage: 70,
      range: 60,
      accuracy: 75,
      fireRate: 70,
      mobility: 65,
      control: 70,
    },
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
  };

  return { ...defaultWeapon, ...overrides };
}

/**
 * Create multiple mock weapons
 */
export function createMockWeapons(count: number): Weapon[] {
  return Array.from({ length: count }, (_, i) =>
    createMockWeapon({
      id: `weapon-${i + 1}`,
      name: `Test Weapon ${i + 1}`,
      meta: {
        tier: (['S', 'A', 'B', 'C', 'D'] as const)[i % 5],
        popularity: 10 + i * 5,
        winRate: 48 + i * 2,
        pickRate: 5 + i,
        kdRatio: 1.0 + i * 0.05,
      },
    })
  );
}

/**
 * Create a mock loadout with realistic defaults
 */
export function createMockLoadout(overrides?: Partial<Loadout>): Loadout {
  const defaultLoadout: Loadout = {
    id: 'loadout-1',
    name: 'Test Loadout',
    description: 'A versatile loadout for all game modes',
    game: 'MW3',
    userId: 'test-user-123',
    primary: {
      weaponId: 'weapon-1',
      weapon: {
        id: 'weapon-1',
        name: 'Test Assault Rifle',
        category: 'Assault Rifle',
        game: 'MW3',
        meta: {
          tier: 'A',
          popularity: 45,
          winRate: 52,
        },
      },
      attachments: [
        { id: 'att-1', name: 'Red Dot Sight', type: 'optic', slot: 'optic' },
        { id: 'att-2', name: 'Foregrip', type: 'underbarrel', slot: 'underbarrel' },
        { id: 'att-3', name: 'Extended Mag', type: 'magazine', slot: 'magazine' },
      ],
    },
    secondary: {
      weaponId: 'weapon-2',
      weapon: {
        id: 'weapon-2',
        name: 'Test Handgun',
        category: 'Handgun',
        game: 'MW3',
        meta: {
          tier: 'B',
          popularity: 30,
          winRate: 50,
        },
      },
      attachments: [],
    },
    equipment: {
      tactical: { id: 'eq-1', name: 'Stun Grenade', type: 'tactical' },
      lethal: { id: 'eq-2', name: 'Frag Grenade', type: 'lethal' },
    },
    perks: {
      perk1: { id: 'perk-1', name: 'Double Time', category: 'perk1' },
      perk2: { id: 'perk-2', name: 'Ghost', category: 'perk2' },
      perk3: { id: 'perk-3', name: 'Amped', category: 'perk3' },
    },
    effectiveRange: 'Medium',
    difficulty: 'Moderate',
    playstyle: ['Aggressive', 'Versatile'],
    gameMode: ['Multiplayer', 'Warzone'],
    overallRating: 8.5,
    favorites: 42,
    views: 350,
    isPublic: true,
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
  };

  return { ...defaultLoadout, ...overrides };
}

/**
 * Create multiple mock loadouts
 */
export function createMockLoadouts(count: number): Loadout[] {
  return Array.from({ length: count }, (_, i) =>
    createMockLoadout({
      id: `loadout-${i + 1}`,
      name: `Test Loadout ${i + 1}`,
      overallRating: 7 + i * 0.3,
      favorites: 20 + i * 10,
    })
  );
}

/**
 * Create a mock meta snapshot
 */
export function createMockMetaSnapshot(
  overrides?: Partial<MetaSnapshot>
): MetaSnapshot {
  const defaultSnapshot: MetaSnapshot = {
    id: 'meta-1',
    game: 'MW3',
    season: 'Season 1',
    timestamp: '2024-01-01T00:00:00.000Z',
    topWeapons: createMockWeapons(10),
    topLoadouts: createMockLoadouts(5),
    statistics: {
      totalPlayers: 1000000,
      totalMatches: 5000000,
      averageKD: 1.0,
      mostPopularMode: 'Team Deathmatch',
    },
    tierDistribution: {
      S: 5,
      A: 12,
      B: 20,
      C: 15,
      D: 8,
    },
    trends: {
      rising: ['weapon-1', 'weapon-3'],
      falling: ['weapon-7', 'weapon-9'],
      stable: ['weapon-2', 'weapon-4', 'weapon-5'],
    },
    createdAt: '2024-01-01T00:00:00.000Z',
  };

  return { ...defaultSnapshot, ...overrides };
}

/**
 * Create mock API response
 */
export function createMockApiResponse<T>(
  data: T,
  overrides?: Partial<{
    success: boolean;
    message: string;
    error: string;
    metadata: Record<string, unknown>;
  }>
) {
  return {
    success: true,
    data,
    message: 'Success',
    ...overrides,
  };
}

/**
 * Create mock API error response
 */
export function createMockApiError(
  message: string = 'An error occurred',
  code: string = 'INTERNAL_ERROR',
  statusCode: number = 500
) {
  return {
    success: false,
    error: message,
    code,
    statusCode,
  };
}

/**
 * Create mock pagination metadata
 */
export function createMockPagination(
  overrides?: Partial<{
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasMore: boolean;
  }>
) {
  const page = overrides?.page || 1;
  const limit = overrides?.limit || 20;
  const total = overrides?.total || 100;
  const totalPages = Math.ceil(total / limit);

  return {
    page,
    limit,
    total,
    totalPages,
    hasMore: page < totalPages,
    ...overrides,
  };
}
