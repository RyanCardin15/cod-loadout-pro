import type { VercelRequest, VercelResponse } from '@vercel/node';
import { auth } from '../server/src/firebase/admin.js';
import { userService } from '../server/src/services/user-service.js';
import { authCodeStore } from '../server/src/auth/code-store.js';

/**
 * Associate an authorization code with a Firebase user
 *
 * This is called after successful Google Sign-In to link the
 * authorization code with the actual user who signed in
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { code, userId, idToken, email, displayName, photoURL } = req.body;

    if (!code || !userId || !idToken) {
      return res.status(400).json({ error: 'Missing required parameters' });
    }

    // Verify the Firebase ID token
    try {
      const decodedToken = await auth().verifyIdToken(idToken);
      if (decodedToken.uid !== userId) {
        return res.status(401).json({ error: 'Invalid token' });
      }
    } catch (error) {
      console.error('Token verification failed:', error);
      return res.status(401).json({ error: 'Invalid token' });
    }

    // Store the association in Firestore with 10-minute expiration
    await authCodeStore.set(code, {
      userId,
      email,
      displayName,
      photoURL,
      createdAt: Date.now(),
    });

    // Create or update user profile
    try {
      await userService.getOrCreateProfile(userId, {
        displayName,
      });
    } catch (error) {
      console.error('Failed to create user profile:', error);
      // Continue anyway - profile creation failure shouldn't block OAuth
    }

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('Association error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
