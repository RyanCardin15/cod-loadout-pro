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
}

// Mock data for initial implementation
const mockWeapons: Weapon[] = [
  {
    id: 'mcw',
    name: 'MCW',
    game: 'MW3',
    category: 'AR',
    stats: { damage: 75, range: 80, accuracy: 85, fireRate: 70, mobility: 60, control: 82, handling: 68 },
    ballistics: {
      damageRanges: [{ range: 20, damage: 30 }, { range: 40, damage: 24 }],
      ttk: { min: 0.24, max: 0.36 },
      fireRate: 750,
      magazineSize: 30,
      reloadTime: 2.1,
      adTime: 0.25,
    },
    meta: { tier: 'S', popularity: 92, winRate: 54, lastUpdated: '2025-10-07' },
    bestFor: ['Medium Range', 'Versatile'],
    playstyles: ['Aggressive', 'Tactical'],
    imageUrl: '/weapons/mcw.png',
    iconUrl: '/weapons/mcw-icon.png',
  },
  {
    id: 'sva-545',
    name: 'SVA 545',
    game: 'MW3',
    category: 'AR',
    stats: { damage: 80, range: 75, accuracy: 78, fireRate: 82, mobility: 65, control: 75, handling: 70 },
    ballistics: {
      damageRanges: [{ range: 18, damage: 32 }, { range: 35, damage: 26 }],
      ttk: { min: 0.22, max: 0.34 },
      fireRate: 800,
      magazineSize: 30,
      reloadTime: 2.2,
      adTime: 0.26,
    },
    meta: { tier: 'S', popularity: 88, winRate: 53, lastUpdated: '2025-10-07' },
    bestFor: ['Close-Medium Range', 'Aggressive'],
    playstyles: ['Aggressive'],
    imageUrl: '/weapons/sva-545.png',
    iconUrl: '/weapons/sva-545-icon.png',
  },
  {
    id: 'bp50',
    name: 'BP50',
    game: 'MW3',
    category: 'AR',
    stats: { damage: 72, range: 82, accuracy: 88, fireRate: 68, mobility: 58, control: 85, handling: 65 },
    ballistics: {
      damageRanges: [{ range: 22, damage: 28 }, { range: 45, damage: 22 }],
      ttk: { min: 0.26, max: 0.38 },
      fireRate: 720,
      magazineSize: 30,
      reloadTime: 2.0,
      adTime: 0.24,
    },
    meta: { tier: 'A', popularity: 78, winRate: 51, lastUpdated: '2025-10-07' },
    bestFor: ['Long Range', 'Precision'],
    playstyles: ['Tactical'],
    imageUrl: '/weapons/bp50.png',
    iconUrl: '/weapons/bp50-icon.png',
  },
  {
    id: 'holger-556',
    name: 'Holger 556',
    game: 'MW3',
    category: 'AR',
    stats: { damage: 78, range: 85, accuracy: 80, fireRate: 72, mobility: 55, control: 88, handling: 62 },
    ballistics: {
      damageRanges: [{ range: 25, damage: 29 }, { range: 50, damage: 23 }],
      ttk: { min: 0.25, max: 0.37 },
      fireRate: 740,
      magazineSize: 30,
      reloadTime: 2.3,
      adTime: 0.27,
    },
    meta: { tier: 'A', popularity: 82, winRate: 52, lastUpdated: '2025-10-07' },
    bestFor: ['Long Range', 'Versatile'],
    playstyles: ['Tactical', 'Support'],
    imageUrl: '/weapons/holger-556.png',
    iconUrl: '/weapons/holger-556-icon.png',
  },
  {
    id: 'striker',
    name: 'Striker',
    game: 'MW3',
    category: 'SMG',
    stats: { damage: 70, range: 55, accuracy: 72, fireRate: 88, mobility: 85, control: 68, handling: 82 },
    ballistics: {
      damageRanges: [{ range: 12, damage: 28 }, { range: 25, damage: 20 }],
      ttk: { min: 0.18, max: 0.30 },
      fireRate: 900,
      magazineSize: 40,
      reloadTime: 1.8,
      adTime: 0.20,
    },
    meta: { tier: 'S', popularity: 85, winRate: 55, lastUpdated: '2025-10-07' },
    bestFor: ['Close Range', 'Aggressive'],
    playstyles: ['Aggressive'],
    imageUrl: '/weapons/striker.png',
    iconUrl: '/weapons/striker-icon.png',
  },
  {
    id: 'amr9',
    name: 'AMR9',
    game: 'MW3',
    category: 'SMG',
    stats: { damage: 75, range: 60, accuracy: 78, fireRate: 85, mobility: 82, control: 72, handling: 80 },
    ballistics: {
      damageRanges: [{ range: 15, damage: 30 }, { range: 28, damage: 22 }],
      ttk: { min: 0.19, max: 0.32 },
      fireRate: 880,
      magazineSize: 30,
      reloadTime: 1.9,
      adTime: 0.21,
    },
    meta: { tier: 'A', popularity: 76, winRate: 52, lastUpdated: '2025-10-07' },
    bestFor: ['Close-Medium Range', 'Versatile'],
    playstyles: ['Aggressive', 'Tactical'],
    imageUrl: '/weapons/amr9.png',
    iconUrl: '/weapons/amr9-icon.png',
  },
];

export function useWeapons() {
  const [weapons, setWeapons] = useState<Weapon[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    // Simulate API call
    const fetchWeapons = async () => {
      try {
        setLoading(true);
        // In production, this would be an API call
        // const response = await fetch('/api/weapons');
        // const data = await response.json();

        // Simulate network delay
        await new Promise((resolve) => setTimeout(resolve, 500));

        setWeapons(mockWeapons);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to fetch weapons'));
      } finally {
        setLoading(false);
      }
    };

    fetchWeapons();
  }, []);

  return { weapons, loading, error };
}
