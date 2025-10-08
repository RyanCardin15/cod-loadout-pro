/**
 * useLoadouts Hook Tests
 *
 * Tests the useLoadouts custom hook for:
 * - Data fetching with authentication
 * - Loading states
 * - Error handling
 * - Delete functionality
 */

import { renderHook, waitFor, act } from '@testing-library/react';
import { useLoadouts } from '@/hooks/useLoadouts';
import { AllProviders } from '../setup/testUtils';
import { createMockLoadouts, createMockApiResponse, createMockUser } from '../setup/mocks';

// Mock useAuth hook
const mockUser = createMockUser({ uid: 'test-user-123' });
let mockAuthState = { user: null as any, loading: false };

jest.mock('@/hooks/useAuth', () => ({
  useAuth: () => mockAuthState,
}));

describe('useLoadouts', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    global.fetch = jest.fn();
    mockAuthState = { user: null, loading: false };
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Authentication Handling', () => {
    it('does not fetch when user is not authenticated', async () => {
      mockAuthState = { user: null, loading: false };

      const { result } = renderHook(() => useLoadouts(), {
        wrapper: AllProviders,
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(global.fetch).not.toHaveBeenCalled();
      expect(result.current.loadouts).toEqual([]);
      expect(result.current.error).toBeNull();
    });

    it('fetches loadouts when user is authenticated', async () => {
      mockAuthState = { user: mockUser, loading: false };

      const mockLoadouts = createMockLoadouts(3);
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ loadouts: mockLoadouts }),
      });

      const { result } = renderHook(() => useLoadouts(), {
        wrapper: AllProviders,
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(global.fetch).toHaveBeenCalledWith(
        `/api/loadouts?userId=${mockUser.uid}&limit=50`
      );
      expect(result.current.loadouts).toHaveLength(3);
    });
  });

  describe('Successful Data Fetching', () => {
    beforeEach(() => {
      mockAuthState = { user: mockUser, loading: false };
    });

    it('fetches loadouts data successfully', async () => {
      const mockLoadouts = createMockLoadouts(5);
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ loadouts: mockLoadouts }),
      });

      const { result } = renderHook(() => useLoadouts(), {
        wrapper: AllProviders,
      });

      // Initially loading
      expect(result.current.loading).toBe(true);

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.loadouts).toHaveLength(5);
      expect(result.current.error).toBeNull();
    });

    it('handles empty loadouts array', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ loadouts: [] }),
      });

      const { result } = renderHook(() => useLoadouts(), {
        wrapper: AllProviders,
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.loadouts).toEqual([]);
      expect(result.current.error).toBeNull();
    });

    it('handles missing loadouts property in response', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({}),
      });

      const { result } = renderHook(() => useLoadouts(), {
        wrapper: AllProviders,
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.loadouts).toEqual([]);
    });
  });

  describe('Error Handling', () => {
    beforeEach(() => {
      mockAuthState = { user: mockUser, loading: false };
    });

    it('handles API errors', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
      });

      const { result } = renderHook(() => useLoadouts(), {
        wrapper: AllProviders,
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.error).not.toBeNull();
      expect(result.current.error?.message).toContain('500');
      expect(result.current.loadouts).toEqual([]);
    });

    it('handles network errors', async () => {
      (global.fetch as jest.Mock).mockRejectedValueOnce(
        new Error('Network error')
      );

      const { result } = renderHook(() => useLoadouts(), {
        wrapper: AllProviders,
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.error).not.toBeNull();
      expect(result.current.loadouts).toEqual([]);
    });
  });

  describe('Delete Functionality', () => {
    beforeEach(() => {
      mockAuthState = { user: mockUser, loading: false };
    });

    it('deletes loadout successfully', async () => {
      const mockLoadouts = createMockLoadouts(3);

      // Initial fetch
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ loadouts: mockLoadouts }),
      });

      const { result } = renderHook(() => useLoadouts(), {
        wrapper: AllProviders,
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.loadouts).toHaveLength(3);

      // Delete request
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ success: true }),
      });

      await act(async () => {
        await result.current.deleteLoadout('loadout-1');
      });

      expect(global.fetch).toHaveBeenLastCalledWith('/api/loadouts/loadout-1', {
        method: 'DELETE',
      });
      expect(result.current.loadouts).toHaveLength(2);
      expect(result.current.loadouts.find(l => l.id === 'loadout-1')).toBeUndefined();
    });

    it('throws error when delete fails', async () => {
      const mockLoadouts = createMockLoadouts(2);

      // Initial fetch
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ loadouts: mockLoadouts }),
      });

      const { result } = renderHook(() => useLoadouts(), {
        wrapper: AllProviders,
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // Delete request fails
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: 'Not Found',
      });

      await expect(async () => {
        await act(async () => {
          await result.current.deleteLoadout('loadout-999');
        });
      }).rejects.toThrow();

      // Loadouts should remain unchanged
      expect(result.current.loadouts).toHaveLength(2);
    });

    it('does not remove loadout from state if delete fails', async () => {
      const mockLoadouts = createMockLoadouts(3);

      // Initial fetch
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ loadouts: mockLoadouts }),
      });

      const { result } = renderHook(() => useLoadouts(), {
        wrapper: AllProviders,
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      const initialCount = result.current.loadouts.length;

      // Delete request fails
      (global.fetch as jest.Mock).mockRejectedValueOnce(
        new Error('Network error')
      );

      await expect(async () => {
        await act(async () => {
          await result.current.deleteLoadout('loadout-1');
        });
      }).rejects.toThrow();

      expect(result.current.loadouts).toHaveLength(initialCount);
    });
  });

  describe('Loading States', () => {
    it('sets loading to true initially when user is authenticated', () => {
      mockAuthState = { user: mockUser, loading: false };

      (global.fetch as jest.Mock).mockImplementation(
        () => new Promise(() => {}) // Never resolves
      );

      const { result } = renderHook(() => useLoadouts(), {
        wrapper: AllProviders,
      });

      expect(result.current.loading).toBe(true);
    });

    it('sets loading to false when user is not authenticated', async () => {
      mockAuthState = { user: null, loading: false };

      const { result } = renderHook(() => useLoadouts(), {
        wrapper: AllProviders,
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });
    });
  });

  describe('User Change Handling', () => {
    it('refetches when user changes', async () => {
      // Start with no user
      mockAuthState = { user: null, loading: false };

      const { result, rerender } = renderHook(() => useLoadouts(), {
        wrapper: AllProviders,
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(global.fetch).not.toHaveBeenCalled();

      // User logs in
      mockAuthState = { user: mockUser, loading: false };

      const mockLoadouts = createMockLoadouts(2);
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ loadouts: mockLoadouts }),
      });

      rerender();

      await waitFor(() => {
        expect(result.current.loadouts).toHaveLength(2);
      });

      expect(global.fetch).toHaveBeenCalled();
    });
  });
});
