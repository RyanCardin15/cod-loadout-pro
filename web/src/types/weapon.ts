/**
 * Weapon type definitions
 */

export type Game = 'MW3' | 'Warzone' | 'BO6' | 'MW2';
export type WeaponCategory = 'AR' | 'SMG' | 'LMG' | 'Sniper' | 'Marksman' | 'Shotgun' | 'Pistol';
export type Tier = 'S' | 'A' | 'B' | 'C' | 'D';
export type Playstyle = 'Aggressive' | 'Tactical' | 'Sniper' | 'Support';

export interface WeaponStats {
  damage: number;
  range: number;
  accuracy: number;
  fireRate: number;
  mobility: number;
  control: number;
  handling: number;
}

export interface DamageRange {
  range: number;
  damage: number;
}

export interface TimeToKill {
  min: number;
  max: number;
}

export interface WeaponBallistics {
  damageRanges: DamageRange[];
  ttk: TimeToKill;
  fireRate: number;
  magazineSize: number;
  reloadTime: number;
  adTime: number;
}

export interface WeaponMeta {
  tier: Tier;
  popularity: number;
  winRate: number;
  lastUpdated: string;
}

export interface AttachmentSlots {
  optic?: string[];
  barrel?: string[];
  magazine?: string[];
  underbarrel?: string[];
  stock?: string[];
  laser?: string[];
  muzzle?: string[];
  rearGrip?: string[];
}

export interface Weapon {
  id: string;
  name: string;
  game: Game;
  category: WeaponCategory;
  stats: WeaponStats;
  ballistics: WeaponBallistics;
  meta: WeaponMeta;
  bestFor: string[];
  playstyles: string[];
  imageUrl: string;
  iconUrl: string;
  attachmentSlots?: AttachmentSlots;
}

export interface WeaponSummary {
  id: string;
  name: string;
  category: WeaponCategory;
  meta: {
    tier: Tier;
  };
}
