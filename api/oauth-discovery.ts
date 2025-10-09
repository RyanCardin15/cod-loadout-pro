import type { VercelRequest, VercelResponse } from '@vercel/node';

/**
 * OAuth 2.1 Discovery Document
 * Returns metadata about the OAuth authorization server
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const baseUrl = `https://${req.headers.host}`;

  const discoveryDocument = {
    issuer: baseUrl,
    authorization_endpoint: `${baseUrl}/api/oauth-authorize`,
    token_endpoint: `${baseUrl}/api/oauth-token`,
    revocation_endpoint: `${baseUrl}/api/oauth-revoke`,
    scopes_supported: ['read', 'write', 'profile'],
    response_types_supported: ['code'],
    grant_types_supported: ['authorization_code', 'refresh_token'],
    code_challenge_methods_supported: ['S256'],
    token_endpoint_auth_methods_supported: ['none'],
    service_documentation: `${baseUrl}/docs`,
  };

  return res.status(200).json(discoveryDocument);
}
