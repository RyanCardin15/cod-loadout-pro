import type { VercelRequest, VercelResponse } from '@vercel/node';
import { initializeFirebase } from '../server/src/firebase/admin.js';
import { clientsStore } from '../server/src/auth/clients-store.js';
import { FirebaseOAuthProvider } from '../server/src/auth/oauth-provider.js';

// Initialize Firebase
initializeFirebase();

// Create OAuth provider
const oauthProvider = new FirebaseOAuthProvider(clientsStore);

/**
 * OAuth Token Revocation Endpoint
 * Revokes access or refresh tokens
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { token, token_type_hint, client_id } = req.body;

    // Validate parameters
    if (!token) {
      return res.status(400).json({
        error: 'invalid_request',
        error_description: 'Missing token',
      });
    }

    if (!client_id) {
      return res.status(400).json({
        error: 'invalid_request',
        error_description: 'Missing client_id',
      });
    }

    // Get client
    const client = await clientsStore.getClient(client_id);
    if (!client) {
      return res.status(400).json({
        error: 'invalid_client',
        error_description: 'Unknown client',
      });
    }

    // Revoke token
    await oauthProvider.revokeToken(client, {
      token,
      token_type_hint,
    });

    // RFC 7009: The revocation endpoint responds with HTTP status code 200
    // if the token has been revoked successfully or if the client submitted
    // an invalid token
    return res.status(200).end();
  } catch (error: any) {
    console.error('Token revocation error:', error);

    // Still return 200 per RFC 7009
    return res.status(200).end();
  }
}
