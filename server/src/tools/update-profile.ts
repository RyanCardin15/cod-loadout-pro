import { z } from 'zod';
import { userService } from '../services/user-service';
import { extractAuthContext, requireAuth } from '../middleware/auth';

export const updateProfileSchema = z.object({
  playstyle: z
    .object({
      primary: z.enum(['Aggressive', 'Tactical', 'Sniper', 'Support']).optional(),
      ranges: z
        .object({
          close: z.number().min(0).max(100).optional(),
          medium: z.number().min(0).max(100).optional(),
          long: z.number().min(0).max(100).optional(),
        })
        .optional(),
      pacing: z.enum(['Rusher', 'Balanced', 'Camper']).optional(),
      strengths: z.array(z.string()).optional(),
    })
    .optional(),
  games: z.array(z.enum(['MW3', 'Warzone', 'BO6', 'MW2'])).optional(),
  displayName: z.string().optional(),
  _meta: z
    .object({
      authToken: z.string().optional(),
      firebaseToken: z.string().optional(),
      idToken: z.string().optional(),
    })
    .optional(),
});

export async function updateProfile(args: z.infer<typeof updateProfileSchema>) {
  const authContext = await extractAuthContext(args._meta);
  const userId = requireAuth(authContext);

  // Remove _meta from updates
  const { _meta, ...updates } = args;

  // Get current profile to merge updates
  const currentProfile = await userService.getUserProfile(userId);
  if (!currentProfile) {
    throw new Error('Profile not found');
  }

  // Merge playstyle updates
  const playstyleUpdates = updates.playstyle
    ? {
        playstyle: {
          primary: updates.playstyle.primary ?? currentProfile.playstyle.primary,
          ranges: {
            close: updates.playstyle.ranges?.close ?? currentProfile.playstyle.ranges.close,
            medium: updates.playstyle.ranges?.medium ?? currentProfile.playstyle.ranges.medium,
            long: updates.playstyle.ranges?.long ?? currentProfile.playstyle.ranges.long,
          },
          pacing: updates.playstyle.pacing ?? currentProfile.playstyle.pacing,
          strengths: updates.playstyle.strengths ?? currentProfile.playstyle.strengths,
        },
      }
    : {};

  await userService.updateUserProfile(userId, {
    displayName: updates.displayName,
    games: updates.games,
    ...playstyleUpdates,
  });

  const updatedProfile = await userService.getUserProfile(userId);

  return {
    content: [
      {
        type: 'text',
        text: JSON.stringify(
          {
            success: true,
            message: 'Profile updated successfully',
            profile: {
              playstyle: updatedProfile?.playstyle,
              games: updatedProfile?.games,
              displayName: updatedProfile?.displayName,
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

export const updateProfileTool = {
  name: 'update_profile',
  title: 'Update Profile',
  description:
    'Update the current user\'s profile preferences including playstyle, game preferences, and display name. Requires authentication.',
  inputSchema: {
    type: 'object',
    properties: {
      playstyle: {
        type: 'object',
        description: 'Playstyle preferences',
        properties: {
          primary: {
            type: 'string',
            enum: ['Aggressive', 'Tactical', 'Sniper', 'Support'],
            description: 'Primary playstyle',
          },
          ranges: {
            type: 'object',
            description: 'Preferred engagement ranges',
            properties: {
              close: { type: 'number', description: 'Close range preference (0-100)' },
              medium: { type: 'number', description: 'Medium range preference (0-100)' },
              long: { type: 'number', description: 'Long range preference (0-100)' },
            },
          },
          pacing: {
            type: 'string',
            enum: ['Rusher', 'Balanced', 'Camper'],
            description: 'Gameplay pacing preference',
          },
          strengths: {
            type: 'array',
            items: { type: 'string' },
            description: 'Gameplay strengths',
          },
        },
      },
      games: {
        type: 'array',
        items: {
          type: 'string',
          enum: ['MW3', 'Warzone', 'BO6', 'MW2'],
        },
        description: 'Games the user plays',
      },
      displayName: {
        type: 'string',
        description: 'Display name',
      },
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
  async execute(input: unknown, context: { userId: string; sessionId: string }) {
    return updateProfile(input as z.infer<typeof updateProfileSchema>);
  },
};
