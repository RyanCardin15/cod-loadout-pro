import { Response } from 'express';
import {
  OAuthServerProvider,
  AuthorizationParams,
} from '@modelcontextprotocol/sdk/server/auth/provider.js';
import { OAuthRegisteredClientsStore } from '@modelcontextprotocol/sdk/server/auth/clients.js';
import {
  OAuthClientInformationFull,
  OAuthTokens,
  OAuthTokenRevocationRequest,
} from '@modelcontextprotocol/sdk/shared/auth.js';
import { AuthInfo } from '@modelcontextprotocol/sdk/server/auth/types.js';
import { auth, admin } from '../firebase/admin.js';
import { userService } from '../services/user-service.js';
import { randomBytes } from 'crypto';

interface AuthorizationState {
  authorizationCode: string;
  codeChallenge: string;
  redirectUri: string;
  scopes: string[];
  state?: string;
  clientId: string;
  createdAt: number;
  expiresAt: number;
}

interface RefreshTokenData {
  userId: string;
  clientId: string;
  scopes: string[];
  createdAt: number;
}

/**
 * Firebase-based OAuth Provider for MCP Server
 *
 * This provider implements OAuth 2.1 with PKCE flow and integrates with
 * Firebase Authentication for Google Sign-In. It's designed to work seamlessly
 * with ChatGPT apps SDK and other MCP clients.
 */
export class FirebaseOAuthProvider implements OAuthServerProvider {
  private authorizationCodes = new Map<string, AuthorizationState>();
  private refreshTokens = new Map<string, RefreshTokenData>();
  private clientsStoreInstance: OAuthRegisteredClientsStore;

  // Cleanup expired authorization codes every 5 minutes
  private cleanupInterval: NodeJS.Timeout;

  constructor(clientsStore: OAuthRegisteredClientsStore) {
    this.clientsStoreInstance = clientsStore;

    // Start cleanup interval
    this.cleanupInterval = setInterval(() => {
      this.cleanupExpiredCodes();
    }, 5 * 60 * 1000);
  }

  get clientsStore(): OAuthRegisteredClientsStore {
    return this.clientsStoreInstance;
  }

  /**
   * Begin authorization flow
   * For ChatGPT apps SDK, this will redirect to a Google Sign-In page
   */
  async authorize(
    client: OAuthClientInformationFull,
    params: AuthorizationParams,
    res: Response
  ): Promise<void> {
    try {
      // Generate authorization code
      const authorizationCode = this.generateCode();

      // Store authorization state
      const now = Date.now();
      this.authorizationCodes.set(authorizationCode, {
        authorizationCode,
        codeChallenge: params.codeChallenge,
        redirectUri: params.redirectUri,
        scopes: params.scopes || [],
        state: params.state,
        clientId: client.client_id,
        createdAt: now,
        expiresAt: now + 10 * 60 * 1000, // 10 minutes
      });

      // For apps SDK, we want automatic sign-in flow
      // The authorization page will handle Google OAuth and automatically create/sign-in users
      const authUrl = this.buildAuthorizationUrl(client, params, authorizationCode);

      res.redirect(302, authUrl);
    } catch (error) {
      console.error('Authorization error:', error);
      const errorUrl = this.buildErrorRedirect(
        params.redirectUri,
        'server_error',
        'Failed to initiate authorization',
        params.state
      );
      res.redirect(302, errorUrl);
    }
  }

  /**
   * Build authorization URL that points to our custom auth page
   */
  private buildAuthorizationUrl(
    client: OAuthClientInformationFull,
    params: AuthorizationParams,
    code: string
  ): string {
    // This should point to your hosted authorization page
    // The page will handle Google Sign-In and automatically exchange the code
    const baseUrl = process.env.OAUTH_AUTHORIZATION_PAGE_URL ||
                    process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}/auth/authorize` :
                    'http://localhost:3000/auth/authorize';

    const url = new URL(baseUrl);
    url.searchParams.set('client_id', client.client_id);
    url.searchParams.set('code', code);
    url.searchParams.set('redirect_uri', params.redirectUri);
    if (params.state) {
      url.searchParams.set('state', params.state);
    }
    if (params.scopes && params.scopes.length > 0) {
      url.searchParams.set('scope', params.scopes.join(' '));
    }

    return url.href;
  }

  /**
   * Get the code challenge for an authorization code
   */
  async challengeForAuthorizationCode(
    client: OAuthClientInformationFull,
    authorizationCode: string
  ): Promise<string> {
    const state = this.authorizationCodes.get(authorizationCode);

    if (!state) {
      throw new Error('Invalid or expired authorization code');
    }

    if (state.clientId !== client.client_id) {
      throw new Error('Client mismatch');
    }

    return state.codeChallenge;
  }

  /**
   * Exchange authorization code for tokens
   * This is called after the user completes Google Sign-In
   */
  async exchangeAuthorizationCode(
    client: OAuthClientInformationFull,
    authorizationCode: string,
    codeVerifier?: string,
    redirectUri?: string,
    resource?: URL
  ): Promise<OAuthTokens> {
    const state = this.authorizationCodes.get(authorizationCode);

    if (!state) {
      throw new Error('Invalid or expired authorization code');
    }

    // Verify client
    if (state.clientId !== client.client_id) {
      throw new Error('Client mismatch');
    }

    // Verify redirect URI
    if (redirectUri && state.redirectUri !== redirectUri) {
      throw new Error('Redirect URI mismatch');
    }

    // Check expiration
    if (Date.now() > state.expiresAt) {
      this.authorizationCodes.delete(authorizationCode);
      throw new Error('Authorization code expired');
    }

    // PKCE verification is handled by the MCP SDK if skipLocalPkceValidation is false
    // We don't need to verify it here

    // The authorization code should have been exchanged after successful Google Sign-In
    // At this point, we need to get or create a Firebase custom token for the user
    // The actual user ID should be passed through the authorization flow

    // For now, we'll create a token for a demo user
    // In production, this should be the actual Firebase user ID from Google Sign-In
    const userId = await this.getUserIdFromAuthCode(authorizationCode);

    // Create or get user profile
    await userService.getOrCreateProfile(userId);

    // Generate tokens
    const accessToken = await this.createAccessToken(userId, client.client_id, state.scopes);
    const refreshToken = this.createRefreshToken(userId, client.client_id, state.scopes);

    // Clean up authorization code
    this.authorizationCodes.delete(authorizationCode);

    return {
      access_token: accessToken,
      token_type: 'Bearer',
      expires_in: 3600, // 1 hour
      refresh_token: refreshToken,
      scope: state.scopes.join(' '),
    };
  }

  /**
   * Exchange refresh token for new access token
   */
  async exchangeRefreshToken(
    client: OAuthClientInformationFull,
    refreshToken: string,
    scopes?: string[],
    resource?: URL
  ): Promise<OAuthTokens> {
    const tokenData = this.refreshTokens.get(refreshToken);

    if (!tokenData) {
      throw new Error('Invalid refresh token');
    }

    if (tokenData.clientId !== client.client_id) {
      throw new Error('Client mismatch');
    }

    // Use requested scopes if provided, otherwise use original scopes
    const effectiveScopes = scopes || tokenData.scopes;

    // Verify requested scopes don't exceed original scopes
    if (scopes) {
      for (const scope of scopes) {
        if (!tokenData.scopes.includes(scope)) {
          throw new Error(`Scope ${scope} not granted in original authorization`);
        }
      }
    }

    // Generate new access token
    const accessToken = await this.createAccessToken(
      tokenData.userId,
      client.client_id,
      effectiveScopes
    );

    return {
      access_token: accessToken,
      token_type: 'Bearer',
      expires_in: 3600, // 1 hour
      scope: effectiveScopes.join(' '),
    };
  }

  /**
   * Verify access token and return auth info
   */
  async verifyAccessToken(token: string): Promise<AuthInfo> {
    try {
      // Verify Firebase ID token
      const decodedToken = await auth().verifyIdToken(token);

      return {
        token,
        clientId: decodedToken.aud, // Firebase app ID
        scopes: decodedToken.scope?.split(' ') || [],
        extra: {
          userId: decodedToken.uid,
        },
      };
    } catch (error) {
      throw new Error('Invalid access token');
    }
  }

  /**
   * Revoke a token (access or refresh)
   */
  async revokeToken(
    client: OAuthClientInformationFull,
    request: OAuthTokenRevocationRequest
  ): Promise<void> {
    const token = request.token;

    // Try to revoke as refresh token first
    const tokenData = this.refreshTokens.get(token);
    if (tokenData && tokenData.clientId === client.client_id) {
      this.refreshTokens.delete(token);
      return;
    }

    // If it's an access token, we can try to revoke it in Firebase
    // For now, we'll just ignore it as access tokens are short-lived
    // In production, you might want to maintain a blacklist
  }

  /**
   * Helper: Create Firebase custom token as access token
   */
  private async createAccessToken(
    userId: string,
    clientId: string,
    scopes: string[]
  ): Promise<string> {
    try {
      // Create a Firebase custom token with custom claims
      const customToken = await auth().createCustomToken(userId, {
        clientId,
        scope: scopes.join(' '),
        tokenType: 'mcp_access',
      });

      return customToken;
    } catch (error) {
      console.error('Failed to create access token:', error);
      throw new Error('Failed to generate access token');
    }
  }

  /**
   * Helper: Create refresh token
   */
  private createRefreshToken(userId: string, clientId: string, scopes: string[]): string {
    const token = this.generateCode();

    this.refreshTokens.set(token, {
      userId,
      clientId,
      scopes,
      createdAt: Date.now(),
    });

    return token;
  }

  /**
   * Helper: Generate random code
   */
  private generateCode(): string {
    return randomBytes(32).toString('base64url');
  }

  /**
   * Helper: Get user ID from authorization code
   * Retrieves the user info stored in Firestore after Google Sign-In
   */
  private async getUserIdFromAuthCode(authorizationCode: string): Promise<string> {
    try {
      const { authCodeStore } = await import('./code-store.js');

      const userInfo = await authCodeStore.getAndDelete(authorizationCode);

      if (!userInfo) {
        throw new Error('No user info found for authorization code');
      }

      return userInfo.userId;
    } catch (error) {
      console.error('Failed to retrieve user ID from auth code:', error);
      throw new Error('Invalid authorization code or user info not found');
    }
  }

  /**
   * Helper: Build error redirect URL
   */
  private buildErrorRedirect(
    redirectUri: string,
    error: string,
    description: string,
    state?: string
  ): string {
    const url = new URL(redirectUri);
    url.searchParams.set('error', error);
    url.searchParams.set('error_description', description);
    if (state) {
      url.searchParams.set('state', state);
    }
    return url.href;
  }

  /**
   * Helper: Clean up expired authorization codes
   */
  private cleanupExpiredCodes(): void {
    const now = Date.now();
    for (const [code, state] of this.authorizationCodes.entries()) {
      if (now > state.expiresAt) {
        this.authorizationCodes.delete(code);
      }
    }
  }

  /**
   * Cleanup on shutdown
   */
  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
  }
}
