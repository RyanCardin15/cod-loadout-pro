import { renderHook, waitFor } from '@testing-library/react';
import {
  useWidgetData,
  isLoadoutData,
  isCounterSuggestionsData,
  isWeaponListData,
  isMetaTierListData,
  isMyLoadoutsData,
  isPlaystyleData,
} from '@/mcp-widgets/hooks/useWidgetData';
import type {
  LoadoutData,
  CounterSuggestionsData,
  WeaponListData,
  MetaTierListData,
} from '@/mcp-widgets/types';

describe('useWidgetData type guards', () => {
  describe('isLoadoutData', () => {
    it('returns true for valid loadout data', () => {
      const data: LoadoutData = {
        loadout: {
          name: 'Test Loadout',
          primary: {
            weaponName: 'M4A1',
            weaponId: 'm4a1',
            category: 'Assault Rifle',
            attachments: [],
          },
          perks: {},
          equipment: {},
          stats: {
            damage: 80,
            range: 70,
            mobility: 60,
            control: 75,
          },
        },
      };
      expect(isLoadoutData(data)).toBe(true);
    });

    it('returns false for invalid data', () => {
      expect(isLoadoutData(null)).toBe(false);
      expect(isLoadoutData(undefined)).toBe(false);
      expect(isLoadoutData({})).toBe(false);
      expect(isLoadoutData({ weapons: [] })).toBe(false);
    });
  });

  describe('isCounterSuggestionsData', () => {
    it('returns true for valid counter suggestions data', () => {
      const data: CounterSuggestionsData = {
        enemyWeapon: {
          name: 'SVA 545',
          category: 'Assault Rifle',
          strengths: ['High fire rate'],
          weaknesses: ['Low range'],
        },
        counterWeapons: [],
        strategies: [],
        tacticalAdvice: [],
      };
      expect(isCounterSuggestionsData(data)).toBe(true);
    });

    it('returns false for invalid data', () => {
      expect(isCounterSuggestionsData(null)).toBe(false);
      expect(isCounterSuggestionsData({})).toBe(false);
    });
  });

  describe('isWeaponListData', () => {
    it('returns true for valid weapon list data', () => {
      const data: WeaponListData = {
        weapons: [
          {
            id: '1',
            name: 'M4A1',
            category: 'AR',
          },
        ],
      };
      expect(isWeaponListData(data)).toBe(true);
    });

    it('returns true for empty weapons array', () => {
      const data: WeaponListData = {
        weapons: [],
      };
      expect(isWeaponListData(data)).toBe(true);
    });

    it('returns false for invalid data', () => {
      expect(isWeaponListData(null)).toBe(false);
      expect(isWeaponListData({})).toBe(false);
    });
  });

  describe('isMetaTierListData', () => {
    it('returns true for valid tier list data', () => {
      const data: MetaTierListData = {
        tiers: {
          S: [],
          A: [],
          B: [],
          C: [],
          D: [],
        },
      };
      expect(isMetaTierListData(data)).toBe(true);
    });

    it('returns false for invalid data', () => {
      expect(isMetaTierListData(null)).toBe(false);
      expect(isMetaTierListData({})).toBe(false);
    });
  });

  describe('isMyLoadoutsData', () => {
    it('returns true for valid loadouts data', () => {
      const data = {
        loadouts: [],
        count: 0,
      };
      expect(isMyLoadoutsData(data)).toBe(true);
    });

    it('returns false for invalid data', () => {
      expect(isMyLoadoutsData(null)).toBe(false);
      expect(isMyLoadoutsData({})).toBe(false);
    });
  });

  describe('isPlaystyleData', () => {
    it('returns true for valid playstyle data', () => {
      const data = {
        playstyle: {
          primary: 'Aggressive',
          ranges: {
            close: 70,
            medium: 20,
            long: 10,
          },
          pacing: 'Fast',
          strengths: [],
          recommendedWeapons: [],
          recommendedPerks: [],
        },
      };
      expect(isPlaystyleData(data)).toBe(true);
    });

    it('returns false for invalid data', () => {
      expect(isPlaystyleData(null)).toBe(false);
      expect(isPlaystyleData({})).toBe(false);
    });
  });
});

describe('useWidgetData hook', () => {
  beforeEach(() => {
    // Clear window.openai before each test
    (window as any).openai = undefined;
  });

  afterEach(() => {
    // Cleanup
    (window as any).openai = undefined;
  });

  it('returns null data and loading true initially', () => {
    const { result } = renderHook(() =>
      useWidgetData(undefined, isLoadoutData)
    );
    expect(result.current.data).toBeNull();
    expect(result.current.isLoading).toBe(true);
  });

  it('extracts data from toolOutput prop', async () => {
    const loadoutData: LoadoutData = {
      loadout: {
        name: 'Test Loadout',
        primary: {
          weaponName: 'M4A1',
          weaponId: 'm4a1',
          category: 'AR',
          attachments: [],
        },
        perks: {},
        equipment: {},
        stats: { damage: 80, range: 70, mobility: 60, control: 75 },
      },
    };

    const { result } = renderHook(() =>
      useWidgetData({ structuredContent: loadoutData }, isLoadoutData)
    );

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.data).toEqual(loadoutData);
  });

  it('extracts data from structuredContent wrapper', async () => {
    const weaponData: WeaponListData = {
      weapons: [{ id: '1', name: 'M4A1', category: 'AR' }],
    };

    const { result } = renderHook(() =>
      useWidgetData({ structuredContent: weaponData }, isWeaponListData)
    );

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.data).toEqual(weaponData);
  });

  it('extracts data from window.openai when toolOutput is undefined', async () => {
    const loadoutData: LoadoutData = {
      loadout: {
        name: 'Window Loadout',
        primary: {
          weaponName: 'AK-47',
          weaponId: 'ak47',
          category: 'AR',
          attachments: [],
        },
        perks: {},
        equipment: {},
        stats: { damage: 85, range: 65, mobility: 55, control: 70 },
      },
    };

    (window as any).openai = {
      toolOutput: { structuredContent: loadoutData },
    };

    const { result } = renderHook(() =>
      useWidgetData(undefined, isLoadoutData)
    );

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.data).toEqual(loadoutData);
  });

  it('handles invalid data gracefully', async () => {
    const { result } = renderHook(() =>
      useWidgetData({ invalid: 'data' }, isLoadoutData)
    );

    // Should remain in loading state since data doesn't match type guard
    expect(result.current.isLoading).toBe(true);
    expect(result.current.data).toBeNull();
  });

  it('updates when toolOutput changes', async () => {
    const data1: WeaponListData = {
      weapons: [{ id: '1', name: 'M4A1', category: 'AR' }],
    };
    const data2: WeaponListData = {
      weapons: [{ id: '2', name: 'AK-47', category: 'AR' }],
    };

    const { result, rerender } = renderHook(
      ({ toolOutput }) => useWidgetData(toolOutput, isWeaponListData),
      { initialProps: { toolOutput: { structuredContent: data1 } } }
    );

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });
    expect(result.current.data).toEqual(data1);

    // Update toolOutput
    rerender({ toolOutput: { structuredContent: data2 } });

    await waitFor(() => {
      expect(result.current.data).toEqual(data2);
    });
  });
});
