/**
 * API request/response type definitions
 *
 * This module contains all type definitions for API interactions including:
 * - Standard response envelopes
 * - Error response structures
 * - Request query parameters
 * - Endpoint-specific request/response types
 */

import { Weapon } from './weapons';
import { Loadout } from './loadouts';
import { MetaData } from './meta';

/**
 * Standard API error response
 */
export interface ApiError {
  /** Error message describing what went wrong */
  error: string;
  /** Error code for programmatic handling (optional) */
  code?: string;
  /** Additional error details (optional) */
  details?: unknown;
}

/**
 * Generic API response wrapper
 * @template T The type of data being returned
 */
export interface ApiResponse<T = unknown> {
  /** Response data (present on success) */
  data?: T;
  /** Error message (present on failure) */
  error?: string;
  /** Additional message (optional) */
  message?: string;
}

/**
 * Response type for GET /api/weapons
 */
export interface WeaponsResponse {
  /** Array of weapons */
  weapons: Weapon[];
}

/**
 * Response type for GET /api/weapons/[id]
 */
export interface WeaponResponse {
  /** Single weapon data */
  weapon: Weapon;
}

/**
 * Response type for GET /api/loadouts
 */
export interface LoadoutsResponse {
  /** Array of loadouts */
  loadouts: Loadout[];
}

/**
 * Response type for POST /api/loadouts and GET /api/loadouts/[id]
 */
export interface LoadoutResponse {
  /** Single loadout data */
  loadout: Loadout;
  /** Optional success message */
  message?: string;
}

/**
 * Response type for GET /api/meta
 */
export interface MetaResponse {
  /** Meta-game data */
  meta: MetaData;
}

/**
 * Generic success response for operations without data
 */
export interface SuccessResponse {
  /** Operation success status */
  success: boolean;
  /** Optional success message */
  message?: string;
}

/**
 * Query parameters for fetching weapons
 */
export interface WeaponQueryParams {
  /** Filter by game (optional) */
  game?: string;
  /** Filter by category (optional) */
  category?: string;
  /** Maximum number of results (optional, default: 50) */
  limit?: number;
}

/**
 * Query parameters for fetching loadouts
 */
export interface LoadoutQueryParams {
  /** Filter by user ID (optional) */
  userId?: string;
  /** Filter by game (optional) */
  game?: string;
  /** Maximum number of results (optional, default: 20) */
  limit?: number;
}

/**
 * Query parameters for fetching meta data
 */
export interface MetaQueryParams {
  /** Game to fetch meta for (optional, default: 'MW3') */
  game?: string;
}
