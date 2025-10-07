import { z } from 'zod';
import { PersonalizationService } from '../services/personalization-service.js';
import { MCPTool } from './registry.js';

const inputSchema = z.object({
  description: z.string().optional(),
  preferences: z.object({
    favoriteWeapons: z.array(z.string()).optional(),
    favoriteRange: z.enum(['Close', 'Medium', 'Long']).optional(),
    gameModes: z.array(z.string()).optional(),
    aggressiveness: z.number().min(1).max(10).optional()
  }).optional()
});

export const analyzePlaystyleTool: MCPTool = {
  name: 'analyze_playstyle',
  title: 'Analyze Playstyle',
  description: 'Analyze your playstyle to get personalized weapon and loadout recommendations',

  inputSchema: {
    type: 'object',
    properties: {
      description: {
        type: 'string',
        description: 'Describe how you play (e.g., "I like rushing with SMGs")'
      },
      preferences: {
        type: 'object',
        properties: {
          favoriteWeapons: {
            type: 'array',
            items: { type: 'string' },
            description: 'Your favorite weapons'
          },
          favoriteRange: {
            type: 'string',
            enum: ['Close', 'Medium', 'Long']
          },
          gameModes: {
            type: 'array',
            items: { type: 'string' },
            description: 'Favorite game modes'
          },
          aggressiveness: {
            type: 'number',
            minimum: 1,
            maximum: 10,
            description: 'How aggressive (1=camper, 10=rusher)'
          }
        }
      }
    }
  },

  _meta: {
    'openai/outputTemplate': 'ui://widget/playstyle-profile.html',
    'openai/toolInvocation/invoking': 'Analyzing your playstyle...',
    'openai/toolInvocation/invoked': 'Profile created',
    'openai/widgetAccessible': false
  },

  async execute(input: unknown, context: { userId: string; sessionId: string }) {
    const params = inputSchema.parse(input);
    const personalizationService = new PersonalizationService();

    // Analyze playstyle from description and preferences
    const playstyleProfile = await personalizationService.analyzePlaystyle({
      userId: context.userId,
      description: params.description,
      preferences: params.preferences
    });

    // Get recommendations based on playstyle
    const recommendations = await personalizationService.getRecommendations(playstyleProfile);

    // Save to user profile
    await personalizationService.updateUserProfile(context.userId, playstyleProfile);

    return {
      structuredContent: {
        playstyle: {
          primary: playstyleProfile.primary,
          ranges: playstyleProfile.ranges,
          pacing: playstyleProfile.pacing,
          strengths: playstyleProfile.strengths,
          recommendedWeapons: recommendations.weapons.slice(0, 5).map(w => w.name),
          recommendedPerks: recommendations.perks
        }
      },

      content: [{
        type: 'text',
        text: `**Your Playstyle: ${playstyleProfile.primary}**\n\n` +
              `You're a ${playstyleProfile.pacing} who excels at ${playstyleProfile.ranges.close > 70 ? 'close' : playstyleProfile.ranges.long > 70 ? 'long' : 'medium'} range combat.\n\n` +
              `Top weapons for you:\n${recommendations.weapons.slice(0, 3).map((w, i) => `${i + 1}. ${w.name}`).join('\n')}`
      }],

      _meta: {
        fullProfile: playstyleProfile,
        allRecommendations: recommendations
      }
    };
  }
};