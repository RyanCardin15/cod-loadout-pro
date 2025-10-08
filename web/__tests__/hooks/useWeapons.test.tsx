/**
 * useWeapons Hook Tests
 *
 * Tests the useWeapons custom hook for:
 * - Data fetching
 * - Loading states
 * - Error handling
 * - API integration
 */

import { renderHook, waitFor } from '@testing-library/react';
import { useWeapons } from '@/hooks/useWeapons';
import { AllProviders } from '../setup/testUtils';
import { createMockWeapons, createMockApiResponse } from '../setup/mocks';

describe('useWeapons', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    global.fetch = jest.fn();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Successful Data Fetching', () => {
    it('fetches weapons data successfully', async () => {
      const mockWeapons = createMockWeapons(5);
      const mockResponse = createMockApiResponse({ weapons: mockWeapons });

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockResponse,
      });

      const { result } = renderHook(() => useWeapons(), {
        wrapper: AllProviders,
      });

      // Initially loading
      expect(result.current.loading).toBe(true);
      expect(result.current.weapons).toEqual([]);
      expect(result.current.error).toBeNull();

      // Wait for data to load
      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // Data loaded successfully
      expect(result.current.weapons).toHaveLength(5);
      expect(result.current.error).toBeNull();
    });

    it('calls API with correct parameters', async () => {
      const mockWeapons = createMockWeapons(3);
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ weapons: mockWeapons }),
      });

      renderHook(() => useWeapons(), {
        wrapper: AllProviders,
      });

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith('/api/weapons?limit=100');
      });
    });

    it('handles empty weapons array', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ weapons: [] }),
      });

      const { result } = renderHook(() => useWeapons(), {
        wrapper: AllProviders,
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // Should treat empty array as an error
      expect(result.current.error).not.toBeNull();
      expect(result.current.error?.message).toContain('No weapons data available');
      expect(result.current.weapons).toEqual([]);
    });
  });

  describe('Error Handling', () => {
    it('handles API errors', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
      });

      const { result } = renderHook(() => useWeapons(), {
        wrapper: AllProviders,
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.error).not.toBeNull();
      expect(result.current.error?.message).toContain('500');
      expect(result.current.weapons).toEqual([]);
    });

    it('handles network errors', async () => {
      (global.fetch as jest.Mock).mockRejectedValueOnce(
        new Error('Network error')
      );

      const { result } = renderHook(() => useWeapons(), {
        wrapper: AllProviders,
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.error).not.toBeNull();
      expect(result.current.error?.message).toContain('Network error');
      expect(result.current.weapons).toEqual([]);
    });

    it('handles missing weapons data in response', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({}), // No weapons property
      });

      const { result } = renderHook(() => useWeapons(), {
        wrapper: AllProviders,
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.error).not.toBeNull();
      expect(result.current.weapons).toEqual([]);
    });

    it('handles JSON parse errors', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => {
          throw new Error('JSON parse error');
        },
      });

      const { result } = renderHook(() => useWeapons(), {
        wrapper: AllProviders,
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.error).not.toBeNull();
      expect(result.current.weapons).toEqual([]);
    });
  });

  describe('Loading States', () => {
    it('sets loading to true initially', () => {
      (global.fetch as jest.Mock).mockImplementation(
        () => new Promise(() => {}) // Never resolves
      );

      const { result } = renderHook(() => useWeapons(), {
        wrapper: AllProviders,
      });

      expect(result.current.loading).toBe(true);
    });

    it('sets loading to false after successful fetch', async () => {
      const mockWeapons = createMockWeapons(2);
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ weapons: mockWeapons }),
      });

      const { result } = renderHook(() => useWeapons(), {
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

      const { result } = renderHook(() => useWeapons(), {
        wrapper: AllProviders,
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });
    });
  });

  describe('Edge Cases', () => {
    it('handles non-Error thrown values', async () => {
      (global.fetch as jest.Mock).mockRejectedValueOnce('String error');

      const { result } = renderHook(() => useWeapons(), {
        wrapper: AllProviders,
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.error).not.toBeNull();
      expect(result.current.error?.message).toContain('Failed to fetch weapons');
    });

    it('clears error on successful refetch', async () => {
      // First call fails
      (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Error'));

      const { result, rerender } = renderHook(() => useWeapons(), {
        wrapper: AllProviders,
      });

      await waitFor(() => {
        expect(result.current.error).not.toBeNull();
      });

      // Second call succeeds
      const mockWeapons = createMockWeapons(3);
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ weapons: mockWeapons }),
      });

      rerender();

      await waitFor(() => {
        expect(result.current.error).toBeNull();
      });

      expect(result.current.weapons).toHaveLength(3);
    });
  });
});
