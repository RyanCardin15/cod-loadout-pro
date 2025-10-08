/**
 * Zod validation schemas for weapon-related API endpoints
 */

import { z } from 'zod';

export const gameSchema = z.enum(['MW3', 'Warzone', 'BO6', 'MW2']);
export const categorySchema = z.enum(['AR', 'SMG', 'LMG', 'Sniper', 'Marksman', 'Shotgun', 'Pistol']);
export const tierSchema = z.enum(['S', 'A', 'B', 'C', 'D']);

export const weaponQuerySchema = z.object({
  game: gameSchema.optional(),
  category: categorySchema.optional(),
  limit: z.coerce.number().min(1).max(100).default(50),
});

export const weaponIdSchema = z.object({
  id: z.string().min(1, 'Weapon ID is required'),
});

export type WeaponQuery = z.infer<typeof weaponQuerySchema>;
export type WeaponId = z.infer<typeof weaponIdSchema>;
