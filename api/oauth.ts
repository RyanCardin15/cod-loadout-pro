import type { VercelRequest, VercelResponse } from '@vercel/node';
import express from 'express';
import { mcpAuthRouter } from '@modelcontextprotocol/sdk/server/auth/router.js';
import { FirebaseOAuthProvider } from '../server/src/auth/oauth-provider.js';
import { clientsStore } from '../server/src/auth/clients-store.js';
import { initializeFirebase } from '../server/src/firebase/admin.js';

// Initialize Firebase
initializeFirebase();

// Create OAuth provider
const oauthProvider = new FirebaseOAuthProvider(clientsStore);

// Get base URL for OAuth endpoints
const getBaseUrl = (req: VercelRequest): URL => {
  const protocol = req.headers['x-forwarded-proto'] || 'https';
  const host = req.headers['x-forwarded-host'] || req.headers.host;
  return new URL(`${protocol}://${host}`);
};

// Create Express app for OAuth router
const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Mount MCP OAuth router
app.use(
  mcpAuthRouter({
    provider: oauthProvider,
    issuerUrl: new URL(process.env.OAUTH_ISSUER_URL || 'https://counterplay.vercel.app'),
    baseUrl: new URL(process.env.OAUTH_BASE_URL || 'https://counterplay.vercel.app/api/oauth'),
    serviceDocumentationUrl: new URL(
      process.env.OAUTH_DOCS_URL || 'https://counterplay.vercel.app/docs'
    ),
  })
);

/**
 * Vercel serverless function handler for OAuth endpoints
 *
 * Handles:
 * - /.well-known/oauth-authorization-server (OAuth discovery)
 * - /authorize (Authorization endpoint)
 * - /token (Token endpoint)
 * - /revoke (Token revocation endpoint)
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Enable CORS for OAuth
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    // Convert Vercel request to Express request
    const expressReq = req as any;
    const expressRes = res as any;

    // Pass through to Express router
    return new Promise<void>((resolve, reject) => {
      app(expressReq, expressRes, (err: any) => {
        if (err) {
          console.error('OAuth router error:', err);
          reject(err);
        } else {
          resolve();
        }
      });
    });
  } catch (error) {
    console.error('OAuth handler error:', error);
    return res.status(500).json({
      error: 'server_error',
      error_description: 'Internal server error',
    });
  }
}
