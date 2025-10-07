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

// Mock loadouts
const mockLoadouts: Loadout[] = [
  {
    id: '1',
    userId: 'user1',
    name: 'Aggressive MCW',
    game: 'MW3',
    primary: {
      weapon: {
        id: 'mcw',
        name: 'MCW',
        category: 'AR',
        meta: { tier: 'S' },
      },
      attachments: [
        { id: 'barrel1', name: 'Tempus Barrel', slot: 'barrel' },
        { id: 'optic1', name: 'Slate Reflector', slot: 'optic' },
        { id: 'mag1', name: '40 Round Mag', slot: 'magazine' },
        { id: 'stock1', name: 'MCW Stock', slot: 'stock' },
        { id: 'grip1', name: 'Commando Foregrip', slot: 'underbarrel' },
      ],
    },
    perks: {
      perk1: 'Double Time',
      perk2: 'Sleight of Hand',
      perk3: 'Tempered',
      perk4: 'Quick Fix',
    },
    equipment: {
      lethal: 'Frag Grenade',
      tactical: 'Flash Grenade',
      fieldUpgrade: 'Trophy System',
    },
    playstyle: 'Aggressive',
    effectiveRange: 'Medium',
    difficulty: 'Medium',
    overallRating: 4.5,
    favorites: 142,
    createdAt: '2025-10-01',
    updatedAt: '2025-10-07',
  },
  {
    id: '2',
    userId: 'user1',
    name: 'Striker Rush',
    game: 'MW3',
    primary: {
      weapon: {
        id: 'striker',
        name: 'Striker',
        category: 'SMG',
        meta: { tier: 'S' },
      },
      attachments: [
        { id: 'barrel2', name: 'Strike Barrel', slot: 'barrel' },
        { id: 'laser1', name: 'Tac Laser', slot: 'laser' },
        { id: 'mag2', name: '50 Round Drum', slot: 'magazine' },
        { id: 'stock2', name: 'No Stock', slot: 'stock' },
        { id: 'grip2', name: 'Commando Foregrip', slot: 'underbarrel' },
      ],
    },
    perks: {
      perk1: 'Lightweight',
      perk2: 'Double Time',
      perk3: 'Quick Fix',
      perk4: 'Ghost',
    },
    equipment: {
      lethal: 'Semtex',
      tactical: 'Stun Grenade',
      fieldUpgrade: 'Dead Silence',
    },
    playstyle: 'Aggressive',
    effectiveRange: 'Close',
    difficulty: 'Easy',
    overallRating: 4.7,
    favorites: 218,
    createdAt: '2025-09-28',
    updatedAt: '2025-10-05',
  },
];

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
        // In production: API call to fetch user loadouts
        await new Promise((resolve) => setTimeout(resolve, 500));

        setLoadouts(mockLoadouts);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to fetch loadouts'));
      } finally {
        setLoading(false);
      }
    };

    fetchLoadouts();
  }, [user]);

  const deleteLoadout = async (loadoutId: string) => {
    setLoadouts(loadouts.filter((l) => l.id !== loadoutId));
  };

  return { loadouts, loading, error, deleteLoadout };
}
