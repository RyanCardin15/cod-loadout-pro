import { db } from '../firebase/admin.js';
import { MCPTool } from './registry.js';

export const myLoadoutsTool: MCPTool = {
  name: 'my_loadouts',
  title: 'My Saved Loadouts',
  description: 'View all your saved loadouts',
  annotations: {
    readOnlyHint: true,
    openWorldHint: false
  },

  inputSchema: {
    type: 'object',
    properties: {}
  },

  _meta: {
    securitySchemes: [
      { type: 'noauth' }
    ],
    'openai/outputTemplate': 'ui://widget/my-loadouts.html',
    'openai/toolInvocation/invoking': 'Loading your loadouts...',
    'openai/toolInvocation/invoked': 'Loadouts loaded',
    'openai/widgetAccessible': true,
    'openai/widgetPrefersBorder': true
  },

  async execute(input: unknown, context: { userId: string; sessionId: string }) {
    // Get user's favorite loadouts
    const userDoc = await db()
      .collection('users')
      .doc(context.userId)
      .get();

    const favoriteIds = userDoc.data()?.favorites || [];

    if (favoriteIds.length === 0) {
      return {
        structuredContent: {
          loadouts: [],
          count: 0
        },
        content: [{
          type: 'text',
          text: 'You haven\'t saved any loadouts yet. Try asking for a weapon loadout and save it!'
        }]
      };
    }

    // Fetch all favorite loadouts
    const loadouts = await Promise.all(
      favoriteIds.map(async (id: string) => {
        const doc = await db().collection('loadouts').doc(id).get();
        return { id: doc.id, ...doc.data() };
      })
    );

    return {
      structuredContent: {
        loadouts: loadouts.map(l => ({
          id: l.id,
          name: l.name,
          primaryWeapon: l.primary?.weapon?.name,
          game: l.game,
          playstyle: l.playstyle,
          createdAt: l.createdAt
        })),
        count: loadouts.length
      },

      content: [{
        type: 'text',
        text: `You have ${loadouts.length} saved loadout${loadouts.length !== 1 ? 's' : ''}. Click any loadout to view details or ask me to build a new loadout based on one of these.`
      }],

      _meta: {
        fullLoadouts: loadouts
      }
    };
  }
};
