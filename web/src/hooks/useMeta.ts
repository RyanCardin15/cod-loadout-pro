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

        const gameParam = game ? `?game=${game}` : '';
        const response = await fetch(`/api/meta${gameParam}`);

        if (!response.ok) {
          throw new Error(`API returned ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();

        if (!data.meta) {
          throw new Error('No meta data available');
        }

        const metaSnapshot = data.meta;

        // Transform to MetaData format
        const transformedMeta: MetaData = {
          tiers: metaSnapshot.tiers || {
            S: [],
            A: [],
            B: [],
            C: [],
            D: [],
          },
          recentChanges: metaSnapshot.recentChanges || [],
          proLoadouts: metaSnapshot.topLoadouts || [],
          lastUpdated: metaSnapshot.date || new Date().toISOString(),
        };

        setMetaData(transformedMeta);
        setError(null);
      } catch (err) {
        console.error('Error fetching meta:', err);
        setError(err instanceof Error ? err : new Error('Failed to fetch meta data'));
        setMetaData(null);
      } finally {
        setLoading(false);
      }
    };

    fetchMeta();
  }, [game]);

  return { metaData, loading, error };
}
