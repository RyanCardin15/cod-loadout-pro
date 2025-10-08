/**
 * useMeta Hook Tests
 *
 * Tests the useMeta custom hook for:
 * - Data fetching with optional game parameter
 * - Loading states
 * - Error handling
 * - Data transformation
 */

import { renderHook, waitFor } from '@testing-library/react';
import { useMeta } from '@/hooks/useMeta';
import { AllProviders } from '../setup/testUtils';
import { createMockMetaSnapshot } from '../setup/mocks';

describe('useMeta', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    global.fetch = jest.fn();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Successful Data Fetching', () => {
    it('fetches meta data without game parameter', async () => {
      const mockMetaSnapshot = createMockMetaSnapshot();
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ meta: mockMetaSnapshot }),
      });

      const { result } = renderHook(() => useMeta(), {
        wrapper: AllProviders,
      });

      expect(result.current.loading).toBe(true);

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(global.fetch).toHaveBeenCalledWith('/api/meta');
      expect(result.current.metaData).not.toBeNull();
      expect(result.current.error).toBeNull();
    });

    it('fetches meta data with game parameter', async () => {
      const mockMetaSnapshot = createMockMetaSnapshot({ game: 'MW3' });
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ meta: mockMetaSnapshot }),
      });

      const { result } = renderHook(() => useMeta('MW3'), {
        wrapper: AllProviders,
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(global.fetch).toHaveBeenCalledWith('/api/meta?game=MW3');
      expect(result.current.metaData).not.toBeNull();
    });

    it('transforms meta snapshot to MetaData format', async () => {
      const mockMetaSnapshot = createMockMetaSnapshot({
        tiers: {
          S: [{ id: 'weapon-1', name: 'Test Weapon' }],
          A: [],
          B: [],
          C: [],
          D: [],
        },
        recentChanges: [
          { weaponId: 'weapon-1', changeType: 'buff', description: 'Increased damage' },
        ],
        topLoadouts: [],
        date: '2024-01-01T00:00:00.000Z',
      });

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ meta: mockMetaSnapshot }),
      });

      const { result } = renderHook(() => useMeta(), {
        wrapper: AllProviders,
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.metaData).toMatchObject({
        tiers: expect.any(Object),
        recentChanges: expect.any(Array),
        proLoadouts: expect.any(Array),
        lastUpdated: expect.any(String),
      });
    });
  });

  describe('Error Handling', () => {
    it('handles API errors', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
      });

      const { result } = renderHook(() => useMeta(), {
        wrapper: AllProviders,
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.error).not.toBeNull();
      expect(result.current.error?.message).toContain('500');
      expect(result.current.metaData).toBeNull();
    });

    it('handles network errors', async () => {
      (global.fetch as jest.Mock).mockRejectedValueOnce(
        new Error('Network error')
      );

      const { result } = renderHook(() => useMeta(), {
        wrapper: AllProviders,
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.error).not.toBeNull();
      expect(result.current.error?.message).toContain('Network error');
      expect(result.current.metaData).toBeNull();
    });

    it('handles missing meta data in response', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({}), // No meta property
      });

      const { result } = renderHook(() => useMeta(), {
        wrapper: AllProviders,
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.error).not.toBeNull();
      expect(result.current.error?.message).toContain('No meta data available');
      expect(result.current.metaData).toBeNull();
    });

    it('handles JSON parse errors', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => {
          throw new Error('JSON parse error');
        },
      });

      const { result } = renderHook(() => useMeta(), {
        wrapper: AllProviders,
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.error).not.toBeNull();
      expect(result.current.metaData).toBeNull();
    });

    it('handles non-Error thrown values', async () => {
      (global.fetch as jest.Mock).mockRejectedValueOnce('String error');

      const { result } = renderHook(() => useMeta(), {
        wrapper: AllProviders,
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.error).not.toBeNull();
      expect(result.current.error?.message).toContain('Failed to fetch meta data');
    });
  });

  describe('Loading States', () => {
    it('sets loading to true initially', () => {
      (global.fetch as jest.Mock).mockImplementation(
        () => new Promise(() => {}) // Never resolves
      );

      const { result } = renderHook(() => useMeta(), {
        wrapper: AllProviders,
      });

      expect(result.current.loading).toBe(true);
    });

    it('sets loading to false after successful fetch', async () => {
      const mockMetaSnapshot = createMockMetaSnapshot();
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ meta: mockMetaSnapshot }),
      });

      const { result } = renderHook(() => useMeta(), {
        wrapper: AllProviders,
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });
    });

    it('sets loading to false after error', async () => {
      (global.fetch as jest.Mock).mockRejectedValueOnce(
        new Error('Error')
      );

      const { result } = renderHook(() => useMeta(), {
        wrapper: AllProviders,
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });
    });
  });

  describe('Game Parameter Changes', () => {
    it('refetches when game parameter changes', async () => {
      const mockMetaSnapshot1 = createMockMetaSnapshot({ game: 'MW3' });
      const mockMetaSnapshot2 = createMockMetaSnapshot({ game: 'BO6' });

      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: async () => ({ meta: mockMetaSnapshot1 }),
        })
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: async () => ({ meta: mockMetaSnapshot2 }),
        });

      const { result, rerender } = renderHook(
        ({ game }) => useMeta(game),
        {
          wrapper: AllProviders,
          initialProps: { game: 'MW3' },
        }
      );

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(global.fetch).toHaveBeenCalledWith('/api/meta?game=MW3');

      // Change game parameter
      rerender({ game: 'BO6' });

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith('/api/meta?game=BO6');
      });

      expect(global.fetch).toHaveBeenCalledTimes(2);
    });

    it('clears error on successful refetch', async () => {
      // First call fails
      (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Error'));

      const { result, rerender } = renderHook(() => useMeta(), {
        wrapper: AllProviders,
      });

      await waitFor(() => {
        expect(result.current.error).not.toBeNull();
      });

      // Second call succeeds
      const mockMetaSnapshot = createMockMetaSnapshot();
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ meta: mockMetaSnapshot }),
      });

      rerender();

      await waitFor(() => {
        expect(result.current.error).toBeNull();
      });

      expect(result.current.metaData).not.toBeNull();
    });
  });

  describe('Data Transformation', () => {
    it('provides default tiers when not in response', async () => {
      const mockMetaSnapshot = createMockMetaSnapshot();
      delete (mockMetaSnapshot as any).tiers;

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ meta: mockMetaSnapshot }),
      });

      const { result } = renderHook(() => useMeta(), {
        wrapper: AllProviders,
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.metaData?.tiers).toEqual({
        S: [],
        A: [],
        B: [],
        C: [],
        D: [],
      });
    });

    it('provides default recentChanges when not in response', async () => {
      const mockMetaSnapshot = createMockMetaSnapshot();
      delete (mockMetaSnapshot as any).recentChanges;

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ meta: mockMetaSnapshot }),
      });

      const { result } = renderHook(() => useMeta(), {
        wrapper: AllProviders,
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.metaData?.recentChanges).toEqual([]);
    });

    it('uses topLoadouts as proLoadouts', async () => {
      const mockMetaSnapshot = createMockMetaSnapshot({
        topLoadouts: [{ id: 'loadout-1', name: 'Test Loadout' }] as any,
      });

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ meta: mockMetaSnapshot }),
      });

      const { result } = renderHook(() => useMeta(), {
        wrapper: AllProviders,
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.metaData?.proLoadouts).toHaveLength(1);
    });
  });
});
