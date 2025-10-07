'use client';

import { useState, useEffect } from 'react';
import { Weapon } from './useWeapons';

export interface MetaData {
  tiers: {
    S: Weapon[];
    A: Weapon[];
    B: Weapon[];
    C: Weapon[];
    D: Weapon[];
  };
  recentChanges: Array<{
    weaponId: string;
    weaponName: string;
    change: 'buff' | 'nerf' | 'adjustment';
    description: string;
    date: string;
  }>;
  proLoadouts: Array<{
    id: string;
    proName: string;
    weaponName: string;
    tier: string;
    game: string;
  }>;
  lastUpdated: string;
}

export function useMeta(game?: string) {
  const [metaData, setMetaData] = useState<MetaData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchMeta = async () => {
      try {
        setLoading(true);
        // In production: API call to fetch meta data
        await new Promise((resolve) => setTimeout(resolve, 500));

        // Mock data
        const mockMeta: MetaData = {
          tiers: {
            S: [],
            A: [],
            B: [],
            C: [],
            D: [],
          },
          recentChanges: [
            {
              weaponId: 'mcw',
              weaponName: 'MCW',
              change: 'buff',
              description: 'Increased damage range by 10%',
              date: '2025-10-05',
            },
            {
              weaponId: 'sva-545',
              weaponName: 'SVA 545',
              change: 'buff',
              description: 'Reduced recoil, improved accuracy',
              date: '2025-10-04',
            },
            {
              weaponId: 'bp50',
              weaponName: 'BP50',
              change: 'nerf',
              description: 'Decreased fire rate by 5%',
              date: '2025-10-03',
            },
          ],
          proLoadouts: [
            {
              id: '1',
              proName: 'Scump',
              weaponName: 'MCW',
              tier: 'S',
              game: 'MW3',
            },
            {
              id: '2',
              proName: 'Shotzzy',
              weaponName: 'Striker',
              tier: 'S',
              game: 'MW3',
            },
          ],
          lastUpdated: '2025-10-07T12:00:00Z',
        };

        setMetaData(mockMeta);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to fetch meta data'));
      } finally {
        setLoading(false);
      }
    };

    fetchMeta();
  }, [game]);

  return { metaData, loading, error };
}
