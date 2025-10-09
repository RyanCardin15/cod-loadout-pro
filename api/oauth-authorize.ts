import type { VercelRequest, VercelResponse } from '@vercel/node';
import { initializeFirebase } from '../server/src/firebase/admin.js';
import { clientsStore } from '../server/src/auth/clients-store.js';
import { FirebaseOAuthProvider } from '../server/src/auth/oauth-provider.js';

// Initialize Firebase
initializeFirebase();

// Create OAuth provider
const oauthProvider = new FirebaseOAuthProvider(clientsStore);

/**
 * OAuth Authorization Endpoint
 * Redirects to authorization page with code
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const {
      client_id,
      redirect_uri,
      response_type,
      scope,
      state,
      code_challenge,
      code_challenge_method,
    } = req.query;

    // Validate required parameters
    if (!client_id || !redirect_uri || !code_challenge) {
      return res.status(400).json({
        error: 'invalid_request',
        error_description: 'Missing required parameters',
      });
    }

    // Get client
    const client = await clientsStore.getClient(client_id as string);
    if (!client) {
      return res.status(400).json({
        error: 'invalid_client',
        error_description: 'Unknown client',
      });
    }

    // Verify redirect URI
    if (!client.redirect_uris?.includes(redirect_uri as string)) {
      return res.status(400).json({
        error: 'invalid_request',
        error_description: 'Invalid redirect_uri',
      });
    }

    // Call provider's authorize method
    const authParams = {
      redirectUri: redirect_uri as string,
      scopes: scope ? (scope as string).split(' ') : [],
      state: state as string | undefined,
      codeChallenge: code_challenge as string,
      codeChallengeMethod: (code_challenge_method as string) || 'S256',
    };

    await oauthProvider.authorize(client, authParams, res as any);
  } catch (error: any) {
    console.error('Authorization error:', error);
    return res.status(500).json({
      error: 'server_error',
      error_description: 'Authorization failed',
    });
  }
}
