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

    // Analyze enemy weapon
    const enemyWeapon = await counterService.getWeaponByName(params.enemyWeapon);

    // Find best counters
    const counters = await counterService.findCounters({
      enemyWeapon,
      enemyLoadout: params.enemyLoadout,
      userPlaystyle: params.myPlaystyle,
      game: params.game
    });

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
        tacticalAdvice: counters.tacticalAdvice
      },

      content: [{
        type: 'text',
        text: `**Countering ${enemyWeapon.name}**\n\n` +
              `Top Counter: ${counters.weapons[0]?.weapon.name} (${counters.weapons[0]?.effectiveness}% effective)\n\n` +
              `${counters.weapons[0]?.reasoning}\n\n` +
              `Key Strategies:\n${counters.strategies.map((s: string) => `• ${s}`).join('\n')}`
      }],

      _meta: {
        allCounters: counters,
        enemyFullData: enemyWeapon,
        perksToCounter: counterService.suggestCounterPerks(enemyWeapon)
      }
    };
  }
};
