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
  annotations: {
    readOnlyHint: true,
    openWorldHint: true
  },

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
    securitySchemes: [
      { type: 'noauth' }
    ],
    'openai/outputTemplate': 'ui://widget/loadout-card.html',
    'openai/toolInvocation/invoking': 'Building your loadout...',
    'openai/toolInvocation/invoked': 'Loadout ready!',
    'openai/widgetAccessible': true,
    'openai/widgetPrefersBorder': true
  },

  async execute(input: unknown, context: { userId: string; sessionId: string }) {
    const params = inputSchema.parse(input);
    const loadoutService = new LoadoutService();

    let loadout;
    let errorState = null;
    let partialLoad = null;

    // Triple-fallback try-catch wrapper
    try {
      console.log('[get_loadout] Building loadout for:', params);

      // Build optimal loadout
      loadout = await loadoutService.buildLoadout({
        weaponId: params.weaponId,
        weaponName: params.weaponName,
        game: params.game,
        situation: params.situation,
        playstyle: params.playstyle,
        userId: context.userId
      });

      // Check for partial load (missing attachments)
      if ((loadout as any).hadAttachmentErrors || loadout.primary.attachments.length === 0) {
        console.warn('[get_loadout] Partial load - some attachments could not be fetched');
        partialLoad = {
          missingData: loadout.primary.attachments.length === 0 ? ['attachments'] : ['some attachments'],
          reason: 'Some attachment data could not be loaded from the database'
        };
      }

      console.log('[get_loadout] Loadout built successfully');
    } catch (error: any) {
      console.error('[get_loadout] Error building loadout:', error);

      // Classify error and return structured empty state
      if (error.type === 'WEAPON_NOT_FOUND') {
        console.log('[get_loadout] Weapon not found, returning error state with suggestions');
        errorState = {
          type: 'WEAPON_NOT_FOUND',
          message: error.message,
          suggestions: error.suggestions || []
        };
      } else if (error.code === 'unavailable' || error.message?.includes('Firebase')) {
        console.error('[get_loadout] Firebase connection error');
        errorState = {
          type: 'FIREBASE_CONNECTION_ERROR',
          message: 'Unable to connect to the database. Please try again later.',
          suggestions: []
        };
      } else {
        console.error('[get_loadout] Unknown error:', error);
        errorState = {
          type: 'UNKNOWN_ERROR',
          message: error.message || 'An unexpected error occurred while building the loadout',
          suggestions: []
        };
      }

      // Return structured empty state instead of throwing
      return {
        structuredContent: {
          loadout: {
            name: 'Loadout Error',
            primary: {
              weaponName: params.weaponName || params.weaponId || 'Unknown',
              weaponId: params.weaponId || '',
              category: '',
              attachments: []
            },
            secondary: null,
            perks: {},
            equipment: {},
            stats: { damage: 0, range: 0, mobility: 0, control: 0 },
            isEmpty: true,
            errorState
          }
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
          difficulty: loadout.difficulty,
          partialLoad
        }
      },

      content: [{
        type: 'text',
        text: `**${loadout.name}**\n\n` +
              `Primary: ${loadout.primary.weapon.name} (${loadout.primary.weapon.category})\n` +
              `Attachments: ${loadout.primary.attachments.map(a => a.name).join(', ')}\n\n` +
              `${loadout.description}\n\n` +
              `Pro Tips:\n${loadout.tips?.map(t => `• ${t}`).join('\n')}` +
              (partialLoad ? `\n\n⚠️ Note: ${partialLoad.reason}` : '')
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
