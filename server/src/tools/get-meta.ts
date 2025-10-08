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
  annotations: {
    readOnlyHint: true,
    openWorldHint: true
  },

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
    securitySchemes: [
      { type: 'noauth' }
    ],
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
      console.error('[get_meta] Error fetching meta data:', error);
      // Return empty structure with error message
      meta = {
        tiers: { S: [], A: [], B: [], C: [], D: [] },
        topLoadouts: [],
        recentChanges: ['Error loading meta data - please check database configuration'],
        lastUpdated: new Date().toISOString()
      };
    }

    // Find highest tier with weapons
    const findHighestTier = () => {
      const tiers = ['S', 'A', 'B', 'C', 'D'];
      for (const tier of tiers) {
        if (meta.tiers[tier]?.length > 0) {
          return tier;
        }
      }
      return null;
    };

    const highestTier = findHighestTier();
    const sTierWeapons = meta.tiers.S?.map((w: any) => ({ id: w.id, name: w.name, usage: w.usage })) || [];

    // Add a note if S-tier is empty but other tiers have data
    const recentChanges = [...meta.recentChanges];
    if (sTierWeapons.length === 0 && highestTier && highestTier !== 'S') {
      recentChanges.unshift(`No S-tier weapons for ${params.category !== 'all' ? params.category : 'current filter'} — ${highestTier}-tier shown`);
    }

    return {
      structuredContent: {
        tiers: {
          S: sTierWeapons,
          A: meta.tiers.A?.map((w: any) => ({ id: w.id, name: w.name, usage: w.usage })) || [],
          B: meta.tiers.B?.map((w: any) => ({ id: w.id, name: w.name, usage: w.usage })) || [],
          C: meta.tiers.C?.map((w: any) => ({ id: w.id, name: w.name, usage: w.usage })) || [],
          D: meta.tiers.D?.map((w: any) => ({ id: w.id, name: w.name, usage: w.usage })) || []
        },
        topLoadouts: meta.topLoadouts.slice(0, 3),
        recentChanges,
        lastUpdated: meta.lastUpdated
      },

      content: [{
        type: 'text',
        text: `**Current Meta (${params.game !== 'all' ? params.game : 'All Games'})**\n\n` +
              `${sTierWeapons.length > 0
                ? `S-Tier: ${sTierWeapons.map((w: any) => w.name).join(', ')}`
                : highestTier
                  ? `Highest Tier (${highestTier}): ${meta.tiers[highestTier]?.slice(0, 3).map((w: any) => w.name).join(', ')}`
                  : 'No meta data available'
              }\n\n` +
              `Recent Changes:\n${recentChanges.slice(0, 3).map((c: string) => `• ${c}`).join('\n')}`
      }],

      _meta: {
        fullMeta: meta,
        historicalData: [] // Historical data requires Firebase
      }
    };
  }
};
