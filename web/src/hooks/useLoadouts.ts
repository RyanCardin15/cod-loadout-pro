'use client';

import { useState, useEffect } from 'react';

import { logger } from '@/lib/logger';
import type { Loadout } from '@/types';
import { useAuth } from './useAuth';

/**
 * Loadouts Data Hook
 *
 * Fetches and manages user's loadout data from the API.
 * Automatically loads loadouts when user is authenticated.
 * Provides delete functionality for loadout management.
 *
 * @returns Object containing loadouts array, loading state, error, and delete function
 *
 * @example
 * ```tsx
 * function UserLoadouts() {
 *   const { loadouts, loading, error, deleteLoadout } = useLoadouts();
 *
 *   const handleDelete = async (id: string) => {
 *     await deleteLoadout(id);
 *     toast.success('Loadout deleted');
 *   };
 *
 *   if (loading) return <LoadingSpinner />;
 *   return <LoadoutList loadouts={loadouts} onDelete={handleDelete} />;
 * }
 * ```
 */
export function useLoadouts() {
  const [loadouts, setLoadouts] = useState<Loadout[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const { user } = useAuth();

  useEffect(() => {
    const fetchLoadouts = async () => {
      if (!user) {
        setLoadouts([]);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);

        const response = await fetch(`/api/loadouts?userId=${user.uid}&limit=50`);

        if (!response.ok) {
          throw new Error(`API returned ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();
        setLoadouts(data.loadouts || []);
        setError(null);
      } catch (err) {
        logger.apiError('GET', '/api/loadouts', err, { userId: user?.uid });
        setError(err instanceof Error ? err : new Error('Failed to fetch loadouts'));
        setLoadouts([]);
      } finally {
        setLoading(false);
      }
    };

    fetchLoadouts();
  }, [user]);

  const deleteLoadout = async (loadoutId: string) => {
    try {
      const response = await fetch(`/api/loadouts/${loadoutId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete loadout');
      }

      setLoadouts(loadouts.filter((l) => l.id !== loadoutId));
    } catch (err) {
      logger.apiError('DELETE', `/api/loadouts/${loadoutId}`, err);
      throw err;
    }
  };

  return { loadouts, loading, error, deleteLoadout };
}
