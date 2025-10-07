import type { VercelRequest, VercelResponse } from '@vercel/node';
import * as admin from 'firebase-admin';

// Initialize Firebase Admin if not already initialized
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    }),
  });
}

/**
 * OAuth2 callback endpoint for ChatGPT Apps
 * This endpoint handles the OAuth2 flow for MCP authentication
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Enable CORS for ChatGPT Apps
  res.setHeader('Access-Control-Allow-Origin', 'https://chatgpt.com');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const { code, state } = req.query;

    if (!code || typeof code !== 'string') {
      return res.status(400).json({ error: 'Missing authorization code' });
    }

    // In a real implementation, you would:
    // 1. Exchange the authorization code for Firebase credentials
    // 2. Create or get user profile
    // 3. Generate a session token
    // 4. Return the token to ChatGPT

    // For now, this is a placeholder that expects a Firebase ID token
    // The actual OAuth2 flow would be implemented based on your requirements

    const idToken = code; // In reality, this would be exchanged

    try {
      // Verify the token
      const decodedToken = await admin.auth().verifyIdToken(idToken);
      const userId = decodedToken.uid;

      // Get or create user profile
      const userRef = admin.firestore().collection('users').doc(userId);
      const userDoc = await userRef.get();

      if (!userDoc.exists) {
        // Create default profile
        await userRef.set({
          userId,
          displayName: decodedToken.name || null,
          email: decodedToken.email || null,
          playstyle: {
            primary: 'Tactical',
            ranges: { close: 33, medium: 34, long: 33 },
            pacing: 'Balanced',
            strengths: [],
          },
          games: ['MW3', 'Warzone'],
          history: {
            queriedWeapons: [],
            savedLoadouts: [],
          },
          favorites: [],
          totalQueries: 0,
          createdAt: new Date().toISOString(),
          lastActive: new Date().toISOString(),
        });
      }

      // Return success with token
      return res.status(200).json({
        access_token: idToken,
        token_type: 'Bearer',
        expires_in: 3600,
        user_id: userId,
      });
    } catch (error: any) {
      console.error('Token verification error:', error);
      return res.status(401).json({ error: 'Invalid token' });
    }
  } catch (error: any) {
    console.error('OAuth callback error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
