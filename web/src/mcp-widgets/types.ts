// Shared TypeScript types for MCP Widgets

// Common types
export interface WeaponStats {
  damage: number;
  range: number;
  mobility: number;
  control: number;
}

export interface Weapon {
  id: string;
  name: string;
  category: string;
  game?: string;
  tier?: string;
  stats?: WeaponStats;
  ttk?: number;
  popularity?: number;
  imageUrl?: string;
  usage?: number;
}

// MetaTierList types
export interface TierData {
  S: Weapon[];
  A: Weapon[];
  B: Weapon[];
  C: Weapon[];
  D: Weapon[];
}

export interface TopLoadout {
  id: string;
  name: string;
  primaryWeapon: string;
  secondaryWeapon?: string;
  popularity: number;
  winRate?: number;
}

export interface MetaTierListData {
  tiers: TierData;
  topLoadouts?: TopLoadout[];
  recentChanges?: string[];
  lastUpdated?: string;
}

// WeaponList types
export interface WeaponListData {
  weapons: Weapon[];
  filters?: {
    game?: string;
    category?: string;
    situation?: string;
  };
  // Error handling fields
  isEmpty?: boolean;
  errorState?: ErrorState;
}

// LoadoutCard types
export interface Attachment {
  id: string;
  name: string;
  slot: string;
}

export interface PrimaryWeapon {
  weaponName: string;
  weaponId: string;
  category: string;
  attachments: Attachment[];
}

export interface SecondaryWeapon {
  weaponName: string;
  attachments: string[];
}

// Error handling types
export type ErrorType =
  | 'WEAPON_NOT_FOUND'
  | 'ENEMY_WEAPON_NOT_FOUND'
  | 'NO_COUNTERS_FOUND'
  | 'NO_RESULTS'
  | 'FIREBASE_CONNECTION_ERROR'
  | 'VALIDATION_ERROR'
  | 'ATTACHMENT_FETCH_ERROR'
  | 'PERK_FETCH_ERROR'
  | 'EQUIPMENT_FETCH_ERROR'
  | 'UNKNOWN_ERROR';

export interface ErrorState {
  type: ErrorType;
  message: string;
  suggestions?: string[];
}

export interface PartialLoadInfo {
  missingData: string[];
  reason: string;
}

export interface Suggestion {
  weaponName: string;
  weaponId?: string;
  similarity?: number;
}

export interface LoadoutData {
  loadout: {
    id?: string;
    name: string;
    primary: PrimaryWeapon;
    secondary?: SecondaryWeapon | null;
    perks: Record<string, string>;
    equipment: Record<string, string>;
    stats: WeaponStats;
    effectiveRange?: string;
    difficulty?: string;
    // Error handling fields
    isEmpty?: boolean;
    errorState?: ErrorState;
    partialLoad?: PartialLoadInfo;
  };
}

// CounterSuggestions types
export interface EnemyWeapon {
  name: string;
  category: string;
  strengths: string[];
  weaknesses: string[];
}

export interface CounterWeapon {
  weaponId: string;
  weaponName: string;
  category: string;
  effectiveness: number;
  reasoning: string;
}

export interface CounterSuggestionsData {
  enemyWeapon: EnemyWeapon;
  counterWeapons: CounterWeapon[];
  strategies: string[];
  tacticalAdvice: string[];
  counterPerks?: string[];
  threatLevel?: string;
  // Error handling fields
  isEmpty?: boolean;
  errorState?: ErrorState;
  partialData?: boolean;
}

// MyLoadouts types
export interface SavedLoadout {
  id: string;
  name: string;
  primaryWeapon: string;
  game: string;
  playstyle: string;
  createdAt: string;
}

export interface MyLoadoutsData {
  loadouts: SavedLoadout[];
  count: number;
}

// PlaystyleProfile types
export interface PlaystyleRanges {
  close: number;
  medium: number;
  long: number;
}

export interface PlaystyleData {
  playstyle: {
    primary: string;
    ranges: PlaystyleRanges;
    pacing: string;
    strengths: string[];
    recommendedWeapons: string[];
    recommendedPerks: string[];
  };
}

// Base props for all widgets
export interface BaseWidgetProps<T> {
  toolOutput?: {
    structuredContent?: T;
  } & T;
}
