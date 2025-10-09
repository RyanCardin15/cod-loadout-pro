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

/**
 * MCP Tool: Search Best Weapons
 *
 * Searches for the best weapons based on user criteria including game, category,
 * situation, and playstyle. Includes comprehensive error handling and query optimization.
 */
export const searchWeaponsTool: MCPTool = {
  name: 'search_weapons',
  title: 'Search Best Weapons',
  description: 'Find the best weapons based on criteria like game, category, situation, and playstyle',
  annotations: {
    readOnlyHint: true,
    openWorldHint: true
  },

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
    securitySchemes: [
      { type: 'noauth' }
    ],
    'openai/outputTemplate': 'ui://widget/weapon-list.html',
    'openai/toolInvocation/invoking': 'Finding best weapons...',
    'openai/toolInvocation/invoked': 'Found the top weapons',
    'openai/widgetAccessible': true,
    'openai/widgetPrefersBorder': true
  },

  /**
   * Execute the search_weapons tool
   *
   * @param input - User search parameters (validated against inputSchema)
   * @param context - Request context with userId and sessionId
   * @returns Structured weapon search results with error states
   */
  async execute(input: unknown, context: { userId: string; sessionId: string }) {
    const params = inputSchema.parse(input);
    const weaponService = new WeaponService();

    let weapons;
    let errorState = null;
    let userPlaystyle = null;

    // Triple-fallback try-catch wrapper
    try {
      console.log('[search_weapons] Searching weapons with params:', params);

      // Search weapons with filters
      weapons = await weaponService.search({
        game: params.game === 'all' ? undefined : params.game,
        category: params.category === 'all' ? undefined : params.category,
        situation: params.situation,
        playstyle: params.playstyle === 'any' ? undefined : params.playstyle,
        tier: params.tier,
        query: params.query,
        limit: params.limit
      });

      // Validate weapon documents
      if (weapons && weapons.length > 0) {
        weapons = weapons.filter(w => {
          if (!w || !w.name || !w.category) {
            console.warn('[search_weapons] Invalid weapon document, skipping:', w?.id);
            return false;
          }
          return true;
        });
      }

      console.log(`[search_weapons] Found ${weapons.length} weapons`);

      // Get user profile for personalization - handle errors gracefully
      try {
        const userProfile = await db()
          .collection('users')
          .doc(context.userId)
          .get();
        userPlaystyle = userProfile.data()?.playstyle;
      } catch (profileError: any) {
        console.warn('[search_weapons] Could not fetch user profile:', profileError.message);
        // Continue without user profile - non-critical error
      }

      // Check for zero results
      if (!weapons || weapons.length === 0) {
        console.log('[search_weapons] No weapons found for criteria');
        errorState = {
          type: 'NO_RESULTS',
          message: 'No weapons match your search criteria.',
          suggestions: []
        };
      }

    } catch (error: any) {
      console.error('[search_weapons] Error searching weapons:', error);

      // Classify error and return structured empty state
      if (error.code === 'unavailable' || error.message?.includes('Firebase')) {
        console.error('[search_weapons] Firebase connection error');
        errorState = {
          type: 'FIREBASE_CONNECTION_ERROR',
          message: 'Unable to connect to the database. Please try again later.',
          suggestions: []
        };
      } else if (error.type === 'VALIDATION_ERROR') {
        console.error('[search_weapons] Validation error:', error.message);
        errorState = {
          type: 'VALIDATION_ERROR',
          message: error.message,
          suggestions: []
        };
      } else {
        console.error('[search_weapons] Unknown error:', error);
        errorState = {
          type: 'UNKNOWN_ERROR',
          message: error.message || 'An unexpected error occurred while searching weapons',
          suggestions: []
        };
      }

      // Return structured empty state instead of throwing
      return {
        structuredContent: {
          weapons: [],
          filters: {
            game: params.game,
            category: params.category,
            situation: params.situation
          },
          isEmpty: true,
          errorState
        },
        content: [{
          type: 'text',
          text: `**Error: ${errorState.message}**\n\nPlease adjust your search criteria and try again.`
        }],
        _meta: {
          error: true,
          errorType: errorState.type,
          timestamp: new Date().toISOString()
        }
      };
    }

    // Handle zero results case (not an error, but no weapons found)
    if (errorState) {
      return {
        structuredContent: {
          weapons: [],
          filters: {
            game: params.game,
            category: params.category,
            situation: params.situation
          },
          isEmpty: true,
          errorState
        },
        content: [{
          type: 'text',
          text: `No weapons found matching your criteria. Try adjusting your filters for better results.`
        }],
        _meta: {
          userPlaystyle,
          timestamp: new Date().toISOString()
        }
      };
    }

    // Safe array access for first weapon
    const firstWeapon = weapons && weapons.length > 0 ? weapons[0] : null;

    return {
      structuredContent: {
        weapons: weapons.map(w => ({
          id: w.id,
          name: w.name,
          category: w.category,
          game: w.game,
          tier: w.meta?.tier,
          stats: {
            damage: w.stats?.damage || 0,
            range: w.stats?.range || 0,
            mobility: w.stats?.mobility || 0,
            control: w.stats?.control || 0
          },
          ttk: w.ballistics?.ttk,
          popularity: w.meta?.popularity || 0,
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
        text: firstWeapon
          ? `Found ${weapons.length} top weapons. The best option is the **${firstWeapon.name}** (${firstWeapon.category}) - currently ${firstWeapon.meta?.tier || 'N/A'} tier with ${firstWeapon.meta?.popularity || 0}% pick rate.`
          : `Found ${weapons.length} weapons.`
      }],

      _meta: {
        fullWeapons: weapons,
        userPlaystyle,
        timestamp: new Date().toISOString()
      }
    };
  }
};
