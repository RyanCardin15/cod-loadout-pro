/**
 * Zod validation schemas for loadout-related API endpoints
 */

import { z } from 'zod';
import { gameSchema } from './weapon.schema';

const attachmentSchema = z.object({
  id: z.string(),
  name: z.string(),
  slot: z.string(),
});

const loadoutWeaponSchema = z.object({
  id: z.string(),
  name: z.string(),
  category: z.string(),
  meta: z.object({
    tier: z.enum(['S', 'A', 'B', 'C', 'D']),
  }),
});

const loadoutWeaponDetailsSchema = z.object({
  weapon: loadoutWeaponSchema,
  attachments: z.array(attachmentSchema),
});

const perksSchema = z.object({
  perk1: z.string().optional(),
  perk2: z.string().optional(),
  perk3: z.string().optional(),
  perk4: z.string().optional(),
});

const equipmentSchema = z.object({
  lethal: z.string().optional(),
  tactical: z.string().optional(),
  fieldUpgrade: z.string().optional(),
});

export const createLoadoutSchema = z.object({
  userId: z.string().min(1, 'User ID is required'),
  name: z.string().min(1, 'Loadout name is required').max(50),
  game: z.string(),
  primary: loadoutWeaponDetailsSchema,
  secondary: loadoutWeaponDetailsSchema.optional(),
  perks: perksSchema.default({}),
  equipment: equipmentSchema.default({}),
  playstyle: z.string(),
  effectiveRange: z.string().optional(),
  difficulty: z.string().optional(),
});

export const loadoutQuerySchema = z.object({
  userId: z.string().optional(),
  game: gameSchema.optional(),
  limit: z.coerce.number().min(1).max(100).default(20),
});

export const loadoutIdSchema = z.object({
  id: z.string().min(1, 'Loadout ID is required'),
});

export type CreateLoadoutInput = z.infer<typeof createLoadoutSchema>;
export type LoadoutQuery = z.infer<typeof loadoutQuerySchema>;
export type LoadoutId = z.infer<typeof loadoutIdSchema>;
