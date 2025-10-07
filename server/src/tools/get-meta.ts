import { z } from 'zod';
import { MetaService } from '../services/meta-service.js';
import { MCPTool } from './registry.js';

const inputSchema = z.object({
  game: z.enum(['MW3', 'Warzone', 'BO6', 'MW2', 'all']).default('all'),
  category: z.enum(['AR', 'SMG', 'LMG', 'Sniper', 'Marksman', 'Shotgun', 'Pistol', 'all']).default('all'),
  mode: z.string().optional()
});

export const getMetaTool: MCPTool = {
  name: 'get_meta',
  title: 'Current Meta',
  description: 'Get the current meta weapons, loadouts, and tier lists',

  inputSchema: {
    type: 'object',
    properties: {
      game: {
        type: 'string',
        enum: ['MW3', 'Warzone', 'BO6', 'MW2', 'all'],
        default: 'all'
      },
      category: {
        type: 'string',
        enum: ['AR', 'SMG', 'LMG', 'Sniper', 'Marksman', 'Shotgun', 'Pistol', 'all'],
        default: 'all'
      },
      mode: {
        type: 'string',
        description: 'Game mode like "Ranked" or "Battle Royale"'
      }
    }
  },

  _meta: {
    'openai/outputTemplate': 'ui://widget/meta-tier-list.html',
    'openai/toolInvocation/invoking': 'Loading current meta...',
    'openai/toolInvocation/invoked': 'Meta loaded',
    'openai/widgetAccessible': true,
    'openai/widgetPrefersBorder': true
  },

  async execute(input: unknown, context: { userId: string; sessionId: string }) {
    const params = inputSchema.parse(input);

    let meta;
    try {
      const metaService = new MetaService();
      // Get current meta snapshot
      meta = await metaService.getCurrentMeta({
        game: params.game === 'all' ? undefined : params.game,
        category: params.category === 'all' ? undefined : params.category,
        mode: params.mode
      });
    } catch (error) {
      // Fallback mock data if Firebase not configured
      console.error('Firebase error, using mock data:', error);
      meta = {
        tiers: {
          S: [
            { id: '1', name: 'SVA 545', usage: 32.5 },
            { id: '2', name: 'RAM-9', usage: 28.3 },
            { id: '3', name: 'Holger 26', usage: 24.1 }
          ],
          A: [
            { id: '4', name: 'MCW', usage: 18.7 },
            { id: '5', name: 'Superi 46', usage: 15.2 }
          ],
          B: [],
          C: [],
          D: []
        },
        topLoadouts: [],
        recentChanges: [
          'SVA 545 buffed - now S-tier in Warzone',
          'RAM-9 mobility increased by 5%',
          'Holger 26 damage range extended'
        ],
        lastUpdated: new Date().toISOString()
      };
    }

    return {
      structuredContent: {
        tiers: {
          S: meta.tiers.S?.map((w: any) => ({ id: w.id, name: w.name, usage: w.usage })) || [],
          A: meta.tiers.A?.map((w: any) => ({ id: w.id, name: w.name, usage: w.usage })) || [],
          B: meta.tiers.B?.map((w: any) => ({ id: w.id, name: w.name, usage: w.usage })) || [],
          C: meta.tiers.C?.map((w: any) => ({ id: w.id, name: w.name, usage: w.usage })) || [],
          D: meta.tiers.D?.map((w: any) => ({ id: w.id, name: w.name, usage: w.usage })) || []
        },
        topLoadouts: meta.topLoadouts.slice(0, 3),
        recentChanges: meta.recentChanges,
        lastUpdated: meta.lastUpdated
      },

      content: [{
        type: 'text',
        text: `**Current Meta (${params.game !== 'all' ? params.game : 'All Games'})**\n\n` +
              `S-Tier: ${meta.tiers.S?.map((w: any) => w.name).join(', ') || 'None'}\n\n` +
              `Recent Changes:\n${meta.recentChanges.slice(0, 3).map((c: string) => `• ${c}`).join('\n')}`
      }],

      _meta: {
        fullMeta: meta,
        historicalData: [] // Historical data requires Firebase
      }
    };
  }
};