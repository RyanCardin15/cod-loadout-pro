import { z } from 'zod';
import { CounterService } from '../services/counter-service.js';
import { MCPTool } from './registry.js';

const inputSchema = z.object({
  enemyWeapon: z.string(),
  enemyLoadout: z.object({
    attachments: z.array(z.string()).optional(),
    perks: z.array(z.string()).optional()
  }).optional(),
  game: z.enum(['MW3', 'Warzone', 'BO6', 'MW2']).optional(),
  myPlaystyle: z.enum(['Aggressive', 'Tactical', 'Sniper', 'Support']).optional()
});

export const counterLoadoutTool: MCPTool = {
  name: 'counter_loadout',
  title: 'Counter Enemy Loadout',
  description: 'Get the best counters and strategies against an enemy weapon or loadout',
  annotations: {
    readOnlyHint: true,
    openWorldHint: true
  },

  inputSchema: {
    type: 'object',
    properties: {
      enemyWeapon: {
        type: 'string',
        description: 'Enemy weapon name or ID'
      },
      enemyLoadout: {
        type: 'object',
        properties: {
          attachments: {
            type: 'array',
            items: { type: 'string' }
          },
          perks: {
            type: 'array',
            items: { type: 'string' }
          }
        }
      },
      game: {
        type: 'string',
        enum: ['MW3', 'Warzone', 'BO6', 'MW2']
      },
      myPlaystyle: {
        type: 'string',
        enum: ['Aggressive', 'Tactical', 'Sniper', 'Support']
      }
    },
    required: ['enemyWeapon']
  },

  _meta: {
    securitySchemes: [
      { type: 'noauth' }
    ],
    'openai/outputTemplate': 'ui://widget/counter-suggestions.html',
    'openai/toolInvocation/invoking': 'Analyzing enemy loadout...',
    'openai/toolInvocation/invoked': 'Counter strategies ready',
    'openai/widgetAccessible': true,
    'openai/widgetPrefersBorder': true
  },

  async execute(input: unknown, context: { userId: string; sessionId: string }) {
    const params = inputSchema.parse(input);
    const counterService = new CounterService();

    let enemyWeapon;
    let counters;
    let errorState = null;
    let partialData = false;

    // Triple-fallback try-catch wrapper
    try {
      console.log('[counter_loadout] Analyzing enemy weapon:', params.enemyWeapon);

      // Analyze enemy weapon
      enemyWeapon = await counterService.getWeaponByName(params.enemyWeapon, params.game);

      console.log('[counter_loadout] Enemy weapon found:', enemyWeapon.name);

      // Find best counters
      counters = await counterService.findCounters({
        enemyWeapon,
        enemyLoadout: params.enemyLoadout,
        userPlaystyle: params.myPlaystyle,
        game: params.game
      });

      // Check for partial data (strategies or advice missing)
      if (!counters.strategies || counters.strategies.length === 0 ||
          !counters.tacticalAdvice || counters.tacticalAdvice.length === 0) {
        console.warn('[counter_loadout] Partial data - some strategies or advice missing');
        partialData = true;
      }

      console.log('[counter_loadout] Counter analysis complete');
    } catch (error: any) {
      console.error('[counter_loadout] Error analyzing enemy loadout:', error);

      // Classify error and return structured empty state
      if (error.type === 'ENEMY_WEAPON_NOT_FOUND') {
        console.log('[counter_loadout] Enemy weapon not found, returning error state with suggestions');
        errorState = {
          type: 'ENEMY_WEAPON_NOT_FOUND',
          message: error.message,
          suggestions: error.suggestions || []
        };
      } else if (error.type === 'NO_COUNTERS_FOUND') {
        console.log('[counter_loadout] No counters found');
        errorState = {
          type: 'NO_COUNTERS_FOUND',
          message: error.message,
          suggestions: []
        };
      } else if (error.code === 'unavailable' || error.message?.includes('Firebase') || error.type === 'FIREBASE_CONNECTION_ERROR') {
        console.error('[counter_loadout] Firebase connection error');
        errorState = {
          type: 'FIREBASE_CONNECTION_ERROR',
          message: 'Unable to connect to the database. Please try again later.',
          suggestions: []
        };
      } else {
        console.error('[counter_loadout] Unknown error:', error);
        errorState = {
          type: 'UNKNOWN_ERROR',
          message: error.message || 'An unexpected error occurred while analyzing the enemy loadout',
          suggestions: []
        };
      }

      // Return structured empty state instead of throwing
      return {
        structuredContent: {
          enemyWeapon: {
            name: params.enemyWeapon,
            category: '',
            strengths: [],
            weaknesses: []
          },
          counterWeapons: [],
          strategies: [],
          tacticalAdvice: [],
          isEmpty: true,
          errorState
        },
        content: [{
          type: 'text',
          text: `**Error: ${errorState.message}**\n\n` +
                (errorState.suggestions.length > 0
                  ? `Did you mean one of these?\n${errorState.suggestions.map((s: string) => `• ${s}`).join('\n')}`
                  : 'Please check the weapon name and try again.')
        }],
        _meta: {
          error: true,
          errorType: errorState.type
        }
      };
    }

    // Get counter perks
    const counterPerks = counterService.suggestCounterPerks(enemyWeapon);

    return {
      structuredContent: {
        enemyWeapon: {
          name: enemyWeapon.name,
          category: enemyWeapon.category,
          strengths: counters.enemyStrengths,
          weaknesses: counters.enemyWeaknesses
        },
        counterWeapons: counters.weapons.map((c: any) => ({
          weaponId: c.weapon.id,
          weaponName: c.weapon.name,
          category: c.weapon.category,
          effectiveness: c.effectiveness,
          reasoning: c.reasoning
        })),
        strategies: counters.strategies,
        tacticalAdvice: counters.tacticalAdvice,
        threatLevel: counters.threatLevel,
        counterPerks,
        partialData
      },

      content: [{
        type: 'text',
        text: `**Countering ${enemyWeapon.name}**\n\n` +
              `Threat Level: ${counters.threatLevel}\n\n` +
              `Top Counter: ${counters.weapons[0]?.weapon.name} (${counters.weapons[0]?.effectiveness}% effective)\n\n` +
              `${counters.weapons[0]?.reasoning}\n\n` +
              `Key Strategies:\n${counters.strategies.map((s: string) => `• ${s}`).join('\n')}` +
              (partialData ? '\n\n⚠️ Note: Some data could not be loaded' : '')
      }],

      _meta: {
        allCounters: counters,
        enemyFullData: enemyWeapon,
        perksToCounter: counterPerks
      }
    };
  }
};
