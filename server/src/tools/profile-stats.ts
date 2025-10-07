import { z } from 'zod';
import { userService } from '../services/user-service';
import { extractAuthContext, requireAuth } from '../middleware/auth';

export const profileStatsSchema = z.object({
  _meta: z.object({
    authToken: z.string().optional(),
    firebaseToken: z.string().optional(),
    idToken: z.string().optional(),
  }).optional(),
});

export async function profileStats(args: z.infer<typeof profileStatsSchema>) {
  const authContext = await extractAuthContext(args._meta);
  const userId = requireAuth(authContext);

  const stats = await userService.getProfileStats(userId);

  return {
    content: [
      {
        type: 'text',
        text: JSON.stringify(
          {
            stats: {
              activity: {
                totalQueries: stats.totalQueries,
                savedLoadouts: stats.savedLoadouts,
                uniqueWeapons: stats.uniqueWeapons,
                favorites: stats.favorites,
              },
              preferences: {
                playstyle: stats.playstyle.primary,
                pacing: stats.playstyle.pacing,
                ranges: stats.playstyle.ranges,
                games: stats.games,
              },
              account: {
                memberSince: stats.memberSince,
                lastActive: stats.lastActive,
              },
            },
          },
          null,
          2
        ),
      },
    ],
    _meta: {
      progressStatus: 'complete',
    },
  };
}

export const profileStatsTool = {
  name: 'profile_stats',
  description:
    'Get detailed statistics for the current user including activity metrics, preferences, and account information. Requires authentication.',
  inputSchema: {
    type: 'object',
    properties: {
      _meta: {
        type: 'object',
        description: 'Authentication metadata',
        properties: {
          authToken: { type: 'string', description: 'Firebase ID token' },
          firebaseToken: { type: 'string', description: 'Firebase ID token (alternative)' },
          idToken: { type: 'string', description: 'Firebase ID token (alternative)' },
        },
      },
    },
  },
};
