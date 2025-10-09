import type { VercelRequest, VercelResponse } from '@vercel/node';
import { initializeFirebase } from '../server/src/firebase/admin.js';
import { clientsStore } from '../server/src/auth/clients-store.js';
import { FirebaseOAuthProvider } from '../server/src/auth/oauth-provider.js';
import { createHash } from 'crypto';

// Initialize Firebase
initializeFirebase();

// Create OAuth provider
const oauthProvider = new FirebaseOAuthProvider(clientsStore);

/**
 * OAuth Token Endpoint
 * Exchanges authorization code or refresh token for access tokens
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
    const {
      grant_type,
      code,
      redirect_uri,
      client_id,
      code_verifier,
      refresh_token,
      scope,
    } = req.body;

    // Validate grant type
    if (!grant_type) {
      return res.status(400).json({
        error: 'invalid_request',
        error_description: 'Missing grant_type',
      });
    }

    // Get client
    if (!client_id) {
      return res.status(400).json({
        error: 'invalid_request',
        error_description: 'Missing client_id',
      });
    }

    const client = await clientsStore.getClient(client_id);
    if (!client) {
      return res.status(400).json({
        error: 'invalid_client',
        error_description: 'Unknown client',
      });
    }

    let tokens;

    if (grant_type === 'authorization_code') {
      // Validate authorization code parameters
      if (!code || !redirect_uri || !code_verifier) {
        return res.status(400).json({
          error: 'invalid_request',
          error_description: 'Missing required parameters for authorization_code grant',
        });
      }

      // Verify PKCE challenge
      const codeChallenge = await oauthProvider.challengeForAuthorizationCode(client, code);
      const computedChallenge = createHash('sha256')
        .update(code_verifier)
        .digest('base64url');

      if (codeChallenge !== computedChallenge) {
        return res.status(400).json({
          error: 'invalid_grant',
          error_description: 'Invalid code_verifier',
        });
      }

      // Exchange code for tokens
      tokens = await oauthProvider.exchangeAuthorizationCode(
        client,
        code,
        code_verifier,
        redirect_uri
      );
    } else if (grant_type === 'refresh_token') {
      // Validate refresh token parameters
      if (!refresh_token) {
        return res.status(400).json({
          error: 'invalid_request',
          error_description: 'Missing refresh_token',
        });
      }

      // Exchange refresh token for new access token
      const requestedScopes = scope ? scope.split(' ') : undefined;
      tokens = await oauthProvider.exchangeRefreshToken(client, refresh_token, requestedScopes);
    } else {
      return res.status(400).json({
        error: 'unsupported_grant_type',
        error_description: `Grant type ${grant_type} not supported`,
      });
    }

    return res.status(200).json(tokens);
  } catch (error: any) {
    console.error('Token exchange error:', error);

    if (error.message?.includes('Invalid') || error.message?.includes('expired')) {
      return res.status(400).json({
        error: 'invalid_grant',
        error_description: error.message,
      });
    }

    return res.status(500).json({
      error: 'server_error',
      error_description: 'Token exchange failed',
    });
  }
}
