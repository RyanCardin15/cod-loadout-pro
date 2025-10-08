/**
 * Meta data type definitions
 */

import { Weapon } from './weapon';

export interface MetaTiers {
  S: Weapon[];
  A: Weapon[];
  B: Weapon[];
  C: Weapon[];
  D: Weapon[];
}

export interface MetaChange {
  weaponId: string;
  weaponName: string;
  change: 'buff' | 'nerf' | 'adjustment';
  description: string;
  date: string;
}

export interface ProLoadout {
  id: string;
  proName: string;
  weaponName: string;
  tier: string;
  game: string;
}

export interface MetaData {
  tiers: MetaTiers;
  recentChanges: MetaChange[];
  proLoadouts: ProLoadout[];
  lastUpdated: string;
}

export interface MetaSnapshot {
  id: string;
  game: string;
  date: string;
  tiers: MetaTiers;
  topLoadouts?: ProLoadout[];
  recentChanges?: MetaChange[];
}
