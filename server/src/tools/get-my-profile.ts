import { z } from 'zod';
import { userService } from '../services/user-service';
import { extractAuthContext, requireAuth } from '../middleware/auth';

export const getMyProfileSchema = z.object({
  _meta: z.object({
    authToken: z.string().optional(),
    firebaseToken: z.string().optional(),
    idToken: z.string().optional(),
  }).optional(),
});

export async function getMyProfile(args: z.infer<typeof getMyProfileSchema>) {
  const authContext = await extractAuthContext(args._meta);
  const userId = requireAuth(authContext);

  const profile = await userService.getOrCreateProfile(userId);

  return {
    content: [
      {
        type: 'text',
        text: JSON.stringify(
          {
            profile: {
              userId: profile.userId,
              displayName: profile.displayName,
              playstyle: profile.playstyle,
              games: profile.games,
              stats: {
                totalQueries: profile.totalQueries,
                savedLoadouts: profile.history.savedLoadouts.length,
                favorites: profile.favorites.length,
                uniqueWeapons: profile.history.queriedWeapons.length,
              },
              memberSince: profile.createdAt,
              lastActive: profile.lastActive,
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

export const getMyProfileTool = {
  name: 'get_my_profile',
  description: 'Get the current user\'s profile including playstyle preferences, stats, and activity history. Requires authentication.',
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
