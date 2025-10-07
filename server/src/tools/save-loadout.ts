import { z } from 'zod';
import { db, admin } from '../firebase/admin.js';
import { MCPTool } from './registry.js';

const inputSchema = z.object({
  loadoutId: z.string().optional(),
  loadout: z.object({
    name: z.string(),
    primaryWeapon: z.string(),
    attachments: z.array(z.string()),
    perks: z.object({}).passthrough(),
    equipment: z.object({}).passthrough()
  }).optional()
}).refine(data => data.loadoutId || data.loadout, {
  message: 'Either loadoutId or loadout must be provided'
});

export const saveLoadoutTool: MCPTool = {
  name: 'save_loadout',
  title: 'Save Loadout',
  description: 'Save a loadout to your favorites',
  annotations: {
    readOnlyHint: false,
    destructiveHint: false,
    idempotentHint: false
  },

  inputSchema: {
    type: 'object',
    properties: {
      loadoutId: {
        type: 'string',
        description: 'ID of existing loadout to save'
      },
      loadout: {
        type: 'object',
        description: 'Custom loadout to save',
        properties: {
          name: { type: 'string' },
          primaryWeapon: { type: 'string' },
          attachments: { type: 'array', items: { type: 'string' } },
          perks: { type: 'object' },
          equipment: { type: 'object' }
        }
      }
    }
  },

  _meta: {
    securitySchemes: [
      { type: 'noauth' }
    ],
    'openai/toolInvocation/invoking': 'Saving loadout...',
    'openai/toolInvocation/invoked': 'Loadout saved!'
  },

  async execute(input: unknown, context: { userId: string; sessionId: string }) {
    const params = inputSchema.parse(input);

    let loadoutId: string;

    if (params.loadoutId) {
      // Save existing loadout to favorites
      loadoutId = params.loadoutId;
      await db()
        .collection('users')
        .doc(context.userId)
        .update({
          favorites: admin.firestore.FieldValue.arrayUnion(loadoutId)
        });
    } else {
      // Create new custom loadout
      const loadoutRef = await db()
        .collection('loadouts')
        .add({
          ...params.loadout,
          userId: context.userId,
          createdAt: new Date().toISOString(),
          favorites: 0
        });

      loadoutId = loadoutRef.id;

      await db()
        .collection('users')
        .doc(context.userId)
        .update({
          favorites: admin.firestore.FieldValue.arrayUnion(loadoutId)
        });
    }

    return {
      structuredContent: {
        success: true,
        loadoutId,
        message: 'Loadout saved to your favorites'
      },

      content: [{
        type: 'text',
        text: `✓ Loadout saved! You can access it anytime with "show my loadouts"`
      }]
    };
  }
};
