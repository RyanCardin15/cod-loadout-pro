import { z } from 'zod';
import { db } from '../firebase/admin.js';
import { WeaponService } from '../services/weapon-service.js';
import { MCPTool } from './registry.js';

const inputSchema = z.object({
  query: z.string().optional(),
  game: z.enum(['MW3', 'Warzone', 'BO6', 'MW2', 'all']).default('all'),
  category: z.enum(['AR', 'SMG', 'LMG', 'Sniper', 'Marksman', 'Shotgun', 'Pistol', 'all']).default('all'),
  situation: z.string().optional(),
  playstyle: z.enum(['Aggressive', 'Tactical', 'Sniper', 'Support', 'any']).default('any'),
  tier: z.array(z.enum(['S', 'A', 'B', 'C', 'D'])).optional(),
  limit: z.number().int().min(1).max(10).default(5)
});

export const searchWeaponsTool: MCPTool = {
  name: 'search_weapons',
  title: 'Search Best Weapons',
  description: 'Find the best weapons based on criteria like game, category, situation, and playstyle',

  inputSchema: {
    type: 'object',
    properties: {
      query: {
        type: 'string',
        description: 'Natural language query like "best AR for Warzone ranked"'
      },
      game: {
        type: 'string',
        enum: ['MW3', 'Warzone', 'BO6', 'MW2', 'all'],
        default: 'all',
        description: 'Which Call of Duty game'
      },
      category: {
        type: 'string',
        enum: ['AR', 'SMG', 'LMG', 'Sniper', 'Marksman', 'Shotgun', 'Pistol', 'all'],
        default: 'all',
        description: 'Weapon category'
      },
      situation: {
        type: 'string',
        description: 'Situation like "close range", "ranked", "search and destroy"'
      },
      playstyle: {
        type: 'string',
        enum: ['Aggressive', 'Tactical', 'Sniper', 'Support', 'any'],
        default: 'any'
      },
      tier: {
        type: 'array',
        items: { type: 'string', enum: ['S', 'A', 'B', 'C', 'D'] },
        description: 'Meta tier filter'
      },
      limit: {
        type: 'number',
        default: 5,
        minimum: 1,
        maximum: 10
      }
    }
  },

  _meta: {
    'openai/outputTemplate': 'ui://widget/weapon-list.html',
    'openai/toolInvocation/invoking': 'Finding best weapons...',
    'openai/toolInvocation/invoked': 'Found the top weapons',
    'openai/widgetAccessible': true,
    'openai/widgetPrefersBorder': true
  },

  async execute(input: unknown, context: { userId: string; sessionId: string }) {
    const params = inputSchema.parse(input);
    const weaponService = new WeaponService();

    // Search weapons with filters
    const weapons = await weaponService.search({
      game: params.game === 'all' ? undefined : params.game,
      category: params.category === 'all' ? undefined : params.category,
      situation: params.situation,
      playstyle: params.playstyle === 'any' ? undefined : params.playstyle,
      tier: params.tier,
      query: params.query,
      limit: params.limit
    });

    // Get user profile for personalization
    const userProfile = await db()
      .collection('users')
      .doc(context.userId)
      .get();

    return {
      structuredContent: {
        weapons: weapons.map(w => ({
          id: w.id,
          name: w.name,
          category: w.category,
          game: w.game,
          tier: w.meta.tier,
          stats: {
            damage: w.stats.damage,
            range: w.stats.range,
            mobility: w.stats.mobility,
            control: w.stats.control
          },
          ttk: w.ballistics.ttk,
          popularity: w.meta.popularity,
          imageUrl: w.imageUrl
        })),
        filters: {
          game: params.game,
          category: params.category,
          situation: params.situation
        }
      },

      content: [{
        type: 'text',
        text: `Found ${weapons.length} top weapons. The best option is the **${weapons[0]?.name}** (${weapons[0]?.category}) - currently ${weapons[0]?.meta.tier} tier with ${weapons[0]?.meta.popularity}% pick rate.`
      }],

      _meta: {
        fullWeapons: weapons,
        userPlaystyle: userProfile.data()?.playstyle,
        timestamp: new Date().toISOString()
      }
    };
  }
};