/**
 * Centralized type exports
 *
 * This barrel file provides a single import point for all type definitions.
 * Import types from here for consistency across the codebase.
 *
 * @example
 * ```typescript
 * import { Weapon, Loadout, MetaData } from '@/types';
 * ```
 */

// Weapon types
export type {
  Game,
  WeaponCategory,
  Tier,
  Playstyle,
  WeaponStats,
  DamageRange,
  TimeToKill,
  WeaponBallistics,
  WeaponMeta,
  AttachmentSlots,
  Weapon,
  WeaponSummary,
} from './weapons';

// Loadout types
export type {
  Attachment,
  LoadoutWeapon,
  LoadoutWeaponDetails,
  LoadoutPerks,
  LoadoutEquipment,
  Loadout,
  CreateLoadoutInput,
} from './loadouts';

// Meta types
export type {
  MetaTiers,
  MetaChange,
  ProLoadout,
  MetaData,
  MetaSnapshot,
} from './meta';

// API types
export type {
  ApiError,
  ApiResponse,
  WeaponsResponse,
  WeaponResponse,
  LoadoutsResponse,
  LoadoutResponse,
  MetaResponse,
  SuccessResponse,
  WeaponQueryParams,
  LoadoutQueryParams,
  MetaQueryParams,
} from './api';
