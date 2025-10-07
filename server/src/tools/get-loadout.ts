import { z } from 'zod';
import { LoadoutService } from '../services/loadout-service.js';
import { MCPTool } from './registry.js';

const inputSchema = z.object({
  weaponId: z.string().optional(),
  weaponName: z.string().optional(),
  game: z.enum(['MW3', 'Warzone', 'BO6', 'MW2']).optional(),
  situation: z.string().optional(),
  playstyle: z.enum(['Aggressive', 'Tactical', 'Sniper', 'Support']).optional()
}).refine(data => data.weaponId || data.weaponName, {
  message: 'Either weaponId or weaponName must be provided'
});

export const getLoadoutTool: MCPTool = {
  name: 'get_loadout',
  title: 'Build Complete Loadout',
  description: 'Get a complete loadout with attachments, perks, and equipment for a weapon',

  inputSchema: {
    type: 'object',
    properties: {
      weaponId: {
        type: 'string',
        description: 'Weapon ID to build loadout for'
      },
      weaponName: {
        type: 'string',
        description: 'Weapon name (if ID not available)'
      },
      game: {
        type: 'string',
        enum: ['MW3', 'Warzone', 'BO6', 'MW2'],
        description: 'Game version'
      },
      situation: {
        type: 'string',
        description: 'Situation like "ranked", "close range", "search and destroy"'
      },
      playstyle: {
        type: 'string',
        enum: ['Aggressive', 'Tactical', 'Sniper', 'Support'],
        description: 'Your playstyle'
      }
    }
  },

  _meta: {
    'openai/outputTemplate': 'ui://widget/loadout-card.html',
    'openai/toolInvocation/invoking': 'Building your loadout...',
    'openai/toolInvocation/invoked': 'Loadout ready!',
    'openai/widgetAccessible': true,
    'openai/widgetPrefersBorder': true
  },

  async execute(input: unknown, context: { userId: string; sessionId: string }) {
    const params = inputSchema.parse(input);
    const loadoutService = new LoadoutService();

    // Build optimal loadout
    const loadout = await loadoutService.buildLoadout({
      weaponId: params.weaponId,
      weaponName: params.weaponName,
      game: params.game,
      situation: params.situation,
      playstyle: params.playstyle,
      userId: context.userId
    });

    // Calculate overall stats
    const finalStats = loadoutService.calculateFinalStats(loadout);

    return {
      structuredContent: {
        loadout: {
          id: loadout.id,
          name: loadout.name,
          primary: {
            weaponName: loadout.primary.weapon.name,
            weaponId: loadout.primary.weapon.id,
            category: loadout.primary.weapon.category,
            attachments: loadout.primary.attachments.map(a => ({
              id: a.id,
              name: a.name,
              slot: a.slot
            }))
          },
          secondary: loadout.secondary ? {
            weaponName: loadout.secondary.weapon.name,
            attachments: loadout.secondary.attachments.map(a => a.name)
          } : null,
          perks: loadout.perks,
          equipment: loadout.equipment,
          stats: finalStats,
          effectiveRange: loadout.effectiveRange,
          difficulty: loadout.difficulty
        }
      },

      content: [{
        type: 'text',
        text: `**${loadout.name}**\n\n` +
              `Primary: ${loadout.primary.weapon.name} (${loadout.primary.weapon.category})\n` +
              `Attachments: ${loadout.primary.attachments.map(a => a.name).join(', ')}\n\n` +
              `${loadout.description}\n\n` +
              `Pro Tips:\n${loadout.tips?.map(t => `• ${t}`).join('\n')}`
      }],

      _meta: {
        fullLoadout: loadout,
        alternativeAttachments: await loadoutService.getAlternatives(loadout),
        canSave: true,
        loadoutId: loadout.id
      }
    };
  }
};