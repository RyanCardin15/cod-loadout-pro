'use client';

import { useState, useEffect } from 'react';

export interface Weapon {
  id: string;
  name: string;
  game: 'MW3' | 'Warzone' | 'BO6' | 'MW2';
  category: 'AR' | 'SMG' | 'LMG' | 'Sniper' | 'Marksman' | 'Shotgun' | 'Pistol';
  stats: {
    damage: number;
    range: number;
    accuracy: number;
    fireRate: number;
    mobility: number;
    control: number;
    handling: number;
  };
  ballistics: {
    damageRanges: Array<{ range: number; damage: number }>;
    ttk: { min: number; max: number };
    fireRate: number;
    magazineSize: number;
    reloadTime: number;
    adTime: number;
  };
  meta: {
    tier: 'S' | 'A' | 'B' | 'C' | 'D';
    popularity: number;
    winRate: number;
    lastUpdated: string;
  };
  bestFor: string[];
  playstyles: string[];
  imageUrl: string;
  iconUrl: string;
  attachmentSlots?: {
    optic?: string[];
    barrel?: string[];
    magazine?: string[];
    underbarrel?: string[];
    stock?: string[];
    laser?: string[];
    muzzle?: string[];
    rearGrip?: string[];
  };
}

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
        console.error('Error fetching weapons:', err);
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
