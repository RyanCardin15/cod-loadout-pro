'use client';

import { useState, useEffect } from 'react';

import { logger } from '@/lib/logger';
import type { Weapon } from '@/types';

/**
 * Weapons Data Hook
 *
 * Fetches and manages weapon data from the API.
 * Automatically loads weapons on mount and handles loading/error states.
 *
 * @returns Object containing weapons array, loading state, and error
 *
 * @example
 * ```tsx
 * function WeaponList() {
 *   const { weapons, loading, error } = useWeapons();
 *
 *   if (loading) return <LoadingSpinner />;
 *   if (error) return <ErrorMessage error={error} />;
 *
 *   return <WeaponGrid weapons={weapons} />;
 * }
 * ```
 */
export function useWeapons() {
  const [weapons, setWeapons] = useState<Weapon[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchWeapons = async () => {
      try {
        setLoading(true);

        const response = await fetch('/api/weapons?limit=100');

        if (!response.ok) {
          throw new Error(`API returned ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();

        if (!data.weapons || data.weapons.length === 0) {
          throw new Error('No weapons data available');
        }

        setWeapons(data.weapons);
        setError(null);
      } catch (err) {
        logger.apiError('GET', '/api/weapons', err);
        setError(err instanceof Error ? err : new Error('Failed to fetch weapons'));
        setWeapons([]);
      } finally {
        setLoading(false);
      }
    };

    fetchWeapons();
  }, []);

  return { weapons, loading, error };
}
