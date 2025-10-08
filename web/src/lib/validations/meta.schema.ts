/**
 * Zod validation schemas for meta-related API endpoints
 */

import { z } from 'zod';
import { gameSchema } from './weapon.schema';

export const metaQuerySchema = z.object({
  game: gameSchema.default('MW3'),
});

export type MetaQuery = z.infer<typeof metaQuerySchema>;
