/**
 * API response type definitions
 */

import { Weapon } from './weapon';
import { Loadout } from './loadout';
import { MetaData } from './meta';

export interface ApiError {
  error: string;
  code?: string;
  details?: unknown;
}

export interface ApiResponse<T = unknown> {
  data?: T;
  error?: string;
  message?: string;
}

export interface WeaponsResponse {
  weapons: Weapon[];
}

export interface WeaponResponse {
  weapon: Weapon;
}

export interface LoadoutsResponse {
  loadouts: Loadout[];
}

export interface LoadoutResponse {
  loadout: Loadout;
  message?: string;
}

export interface MetaResponse {
  meta: MetaData;
}

export interface SuccessResponse {
  success: boolean;
  message?: string;
}
