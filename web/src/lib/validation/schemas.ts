/**
 * Comprehensive Zod validation schemas
 *
 * This module provides runtime validation schemas for all data types
 * using Zod. These schemas are used at system boundaries (API, Firebase, scrapers)
 * to ensure data integrity and type safety.
 */

import { z } from 'zod';

// ============================================================================
// Base Type Schemas
// ============================================================================

/**
 * Supported Call of Duty games
 */
export const gameSchema = z.enum(['MW3', 'Warzone', 'BO6', 'MW2'], {
  errorMap: () => ({ message: 'Invalid game. Must be MW3, Warzone, BO6, or MW2' }),
});

/**
 * Weapon category classifications
 */
export const weaponCategorySchema = z.enum(
  ['AR', 'SMG', 'LMG', 'Sniper', 'Marksman', 'Shotgun', 'Pistol'],
  {
    errorMap: () => ({
      message: 'Invalid weapon category. Must be AR, SMG, LMG, Sniper, Marksman, Shotgun, or Pistol',
    }),
  }
);

/**
 * Meta tier ranking
 */
export const tierSchema = z.enum(['S', 'A', 'B', 'C', 'D'], {
  errorMap: () => ({ message: 'Invalid tier. Must be S, A, B, C, or D' }),
});

/**
 * Player playstyle preferences
 */
export const playstyleSchema = z.enum(['Aggressive', 'Tactical', 'Sniper', 'Support'], {
  errorMap: () => ({
    message: 'Invalid playstyle. Must be Aggressive, Tactical, Sniper, or Support',
  }),
});

// ============================================================================
// Weapon Schemas
// ============================================================================

/**
 * Base weapon statistics (normalized 0-100 scale)
 */
export const weaponStatsSchema = z.object({
  damage: z.number().min(0).max(100),
  range: z.number().min(0).max(100),
  accuracy: z.number().min(0).max(100),
  fireRate: z.number().min(0).max(100),
  mobility: z.number().min(0).max(100),
  control: z.number().min(0).max(100),
  handling: z.number().min(0).max(100),
});

/**
 * Damage at specific range breakpoints
 */
export const damageRangeSchema = z.object({
  range: z.number().min(0),
  damage: z.number().min(0),
});

/**
 * Time-to-kill metrics in milliseconds
 */
export const timeToKillSchema = z.object({
  min: z.number().min(0),
  max: z.number().min(0),
});

/**
 * Detailed weapon ballistics
 */
export const weaponBallisticsSchema = z.object({
  damageRanges: z.array(damageRangeSchema).min(1),
  ttk: timeToKillSchema,
  fireRate: z.number().min(0),
  magazineSize: z.number().int().min(1),
  reloadTime: z.number().min(0),
  adTime: z.number().min(0),
});

/**
 * Meta-game statistics
 */
export const weaponMetaSchema = z.object({
  tier: tierSchema,
  popularity: z.number().min(0).max(100),
  winRate: z.number().min(0).max(100),
  lastUpdated: z.string().datetime(),
});

/**
 * Available attachment slots
 */
export const attachmentSlotsSchema = z.object({
  optic: z.array(z.string()).optional(),
  barrel: z.array(z.string()).optional(),
  magazine: z.array(z.string()).optional(),
  underbarrel: z.array(z.string()).optional(),
  stock: z.array(z.string()).optional(),
  laser: z.array(z.string()).optional(),
  muzzle: z.array(z.string()).optional(),
  rearGrip: z.array(z.string()).optional(),
});

/**
 * Complete weapon schema
 */
export const weaponSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1).max(100),
  game: gameSchema,
  category: weaponCategorySchema,
  stats: weaponStatsSchema,
  ballistics: weaponBallisticsSchema,
  meta: weaponMetaSchema,
  bestFor: z.array(z.string()),
  playstyles: z.array(z.string()),
  imageUrl: z.string().url(),
  iconUrl: z.string().url(),
  attachmentSlots: attachmentSlotsSchema.optional(),
});

/**
 * Simplified weapon summary schema
 */
export const weaponSummarySchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  category: weaponCategorySchema,
  meta: z.object({
    tier: tierSchema,
  }),
});

// ============================================================================
// Loadout Schemas
// ============================================================================

/**
 * Individual weapon attachment
 */
export const attachmentSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1).max(100),
  slot: z.string().min(1).max(50),
});

/**
 * Simplified weapon reference for loadouts
 */
export const loadoutWeaponSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  category: weaponCategorySchema,
  meta: z.object({
    tier: tierSchema,
  }),
});

/**
 * Complete weapon configuration with attachments
 */
export const loadoutWeaponDetailsSchema = z.object({
  weapon: loadoutWeaponSchema,
  attachments: z.array(attachmentSchema).max(5), // Most COD games have 5 attachment slots
});

/**
 * Perk configuration
 */
export const loadoutPerksSchema = z.object({
  perk1: z.string().max(100).optional(),
  perk2: z.string().max(100).optional(),
  perk3: z.string().max(100).optional(),
  perk4: z.string().max(100).optional(),
});

/**
 * Equipment configuration
 */
export const loadoutEquipmentSchema = z.object({
  lethal: z.string().max(100).optional(),
  tactical: z.string().max(100).optional(),
  fieldUpgrade: z.string().max(100).optional(),
});

/**
 * Complete loadout schema
 */
export const loadoutSchema = z.object({
  id: z.string().min(1),
  userId: z.string().min(1),
  name: z.string().min(1).max(50),
  game: z.string().min(1).max(50),
  primary: loadoutWeaponDetailsSchema,
  secondary: loadoutWeaponDetailsSchema.optional(),
  perks: loadoutPerksSchema,
  equipment: loadoutEquipmentSchema,
  playstyle: z.string().min(1).max(50),
  effectiveRange: z.string().min(1).max(50),
  difficulty: z.string().min(1).max(50),
  overallRating: z.number().min(0).max(10).optional(),
  favorites: z.number().int().min(0).optional(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

/**
 * Create loadout input schema
 */
export const createLoadoutInputSchema = z.object({
  userId: z.string().min(1, 'User ID is required'),
  name: z.string().min(1, 'Loadout name is required').max(50, 'Name must be 50 characters or less'),
  game: z.string().min(1, 'Game is required'),
  primary: loadoutWeaponDetailsSchema,
  secondary: loadoutWeaponDetailsSchema.optional(),
  perks: loadoutPerksSchema.default({}),
  equipment: loadoutEquipmentSchema.default({}),
  playstyle: z.string().min(1, 'Playstyle is required'),
  effectiveRange: z.string().max(50).optional(),
  difficulty: z.string().max(50).optional(),
});

// ============================================================================
// Meta Schemas
// ============================================================================

/**
 * Weapons organized by tier
 */
export const metaTiersSchema = z.object({
  S: z.array(weaponSchema),
  A: z.array(weaponSchema),
  B: z.array(weaponSchema),
  C: z.array(weaponSchema),
  D: z.array(weaponSchema),
});

/**
 * Record of weapon balance changes
 */
export const metaChangeSchema = z.object({
  weaponId: z.string().min(1),
  weaponName: z.string().min(1),
  change: z.enum(['buff', 'nerf', 'adjustment']),
  description: z.string().min(1).max(500),
  date: z.string().datetime(),
});

/**
 * Professional player loadout reference
 */
export const proLoadoutSchema = z.object({
  id: z.string().min(1),
  proName: z.string().min(1).max(100),
  weaponName: z.string().min(1).max(100),
  tier: z.string().min(1).max(10),
  game: z.string().min(1).max(50),
});

/**
 * Current meta-game data
 */
export const metaDataSchema = z.object({
  tiers: metaTiersSchema,
  recentChanges: z.array(metaChangeSchema),
  proLoadouts: z.array(proLoadoutSchema),
  lastUpdated: z.string().datetime(),
});

/**
 * Historical meta snapshot
 */
export const metaSnapshotSchema = z.object({
  id: z.string().min(1),
  game: z.string().min(1),
  date: z.string().datetime(),
  tiers: metaTiersSchema,
  topLoadouts: z.array(proLoadoutSchema).optional(),
  recentChanges: z.array(metaChangeSchema).optional(),
});

// ============================================================================
// API Query Parameter Schemas
// ============================================================================

/**
 * Query parameters for fetching weapons
 */
export const weaponQuerySchema = z.object({
  game: gameSchema.optional(),
  category: weaponCategorySchema.optional(),
  limit: z.coerce.number().int().min(1).max(100).default(50),
});

/**
 * Weapon ID parameter schema
 */
export const weaponIdSchema = z.object({
  id: z.string().min(1, 'Weapon ID is required'),
});

/**
 * Query parameters for fetching loadouts
 */
export const loadoutQuerySchema = z.object({
  userId: z.string().optional(),
  game: gameSchema.optional(),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

/**
 * Loadout ID parameter schema
 */
export const loadoutIdSchema = z.object({
  id: z.string().min(1, 'Loadout ID is required'),
});

/**
 * Query parameters for fetching meta data
 */
export const metaQuerySchema = z.object({
  game: gameSchema.default('MW3'),
});

// ============================================================================
// Type Inference Exports
// ============================================================================

export type Game = z.infer<typeof gameSchema>;
export type WeaponCategory = z.infer<typeof weaponCategorySchema>;
export type Tier = z.infer<typeof tierSchema>;
export type Playstyle = z.infer<typeof playstyleSchema>;
export type WeaponStats = z.infer<typeof weaponStatsSchema>;
export type DamageRange = z.infer<typeof damageRangeSchema>;
export type TimeToKill = z.infer<typeof timeToKillSchema>;
export type WeaponBallistics = z.infer<typeof weaponBallisticsSchema>;
export type WeaponMeta = z.infer<typeof weaponMetaSchema>;
export type AttachmentSlots = z.infer<typeof attachmentSlotsSchema>;
export type Weapon = z.infer<typeof weaponSchema>;
export type WeaponSummary = z.infer<typeof weaponSummarySchema>;
export type Attachment = z.infer<typeof attachmentSchema>;
export type LoadoutWeapon = z.infer<typeof loadoutWeaponSchema>;
export type LoadoutWeaponDetails = z.infer<typeof loadoutWeaponDetailsSchema>;
export type LoadoutPerks = z.infer<typeof loadoutPerksSchema>;
export type LoadoutEquipment = z.infer<typeof loadoutEquipmentSchema>;
export type Loadout = z.infer<typeof loadoutSchema>;
export type CreateLoadoutInput = z.infer<typeof createLoadoutInputSchema>;
export type MetaTiers = z.infer<typeof metaTiersSchema>;
export type MetaChange = z.infer<typeof metaChangeSchema>;
export type ProLoadout = z.infer<typeof proLoadoutSchema>;
export type MetaData = z.infer<typeof metaDataSchema>;
export type MetaSnapshot = z.infer<typeof metaSnapshotSchema>;
export type WeaponQuery = z.infer<typeof weaponQuerySchema>;
export type WeaponId = z.infer<typeof weaponIdSchema>;
export type LoadoutQuery = z.infer<typeof loadoutQuerySchema>;
export type LoadoutId = z.infer<typeof loadoutIdSchema>;
export type MetaQuery = z.infer<typeof metaQuerySchema>;
