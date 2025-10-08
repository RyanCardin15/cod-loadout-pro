'use client';

import { useState, useEffect } from 'react';
import { useAuth } from './useAuth';

export interface Loadout {
  id: string;
  userId: string;
  name: string;
  game: string;
  primary: {
    weapon: {
      id: string;
      name: string;
      category: string;
      meta: {
        tier: 'S' | 'A' | 'B' | 'C' | 'D';
      };
    };
    attachments: Array<{ id: string; name: string; slot: string }>;
  };
  secondary?: {
    weapon: {
      id: string;
      name: string;
      category: string;
    };
    attachments: Array<{ id: string; name: string; slot: string }>;
  };
  perks: {
    perk1?: string;
    perk2?: string;
    perk3?: string;
    perk4?: string;
  };
  equipment: {
    lethal?: string;
    tactical?: string;
    fieldUpgrade?: string;
  };
  playstyle: string;
  effectiveRange: string;
  difficulty: string;
  overallRating?: number;
  favorites?: number;
  createdAt: string;
  updatedAt: string;
}

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
        console.error('Error fetching loadouts:', err);
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
      console.error('Error deleting loadout:', err);
      throw err;
    }
  };

  return { loadouts, loading, error, deleteLoadout };
}
