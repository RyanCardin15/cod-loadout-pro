/**
 * Centralized type exports
 * Import types from this barrel file for consistency
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
} from './weapon';

// Loadout types
export type {
  Attachment,
  LoadoutWeapon,
  LoadoutWeaponDetails,
  LoadoutPerks,
  LoadoutEquipment,
  Loadout,
  CreateLoadoutInput,
} from './loadout';

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
} from './api';
