import { userService } from '../services/user-service';

export interface AuthContext {
  userId: string | null;
  isAuthenticated: boolean;
}

/**
 * Extract authentication context from request metadata
 * For MCP protocol, auth token can be passed in _meta field
 */
export async function extractAuthContext(meta?: any): Promise<AuthContext> {
  const context: AuthContext = {
    userId: null,
    isAuthenticated: false,
  };

  if (!meta) {
    return context;
  }

  // Check for Firebase ID token in meta
  const idToken = meta.authToken || meta.firebaseToken || meta.idToken;

  if (idToken) {
    try {
      const userId = await userService.verifyToken(idToken);
      context.userId = userId;
      context.isAuthenticated = true;
    } catch (error) {
      console.error('Auth token verification failed:', error);
      // Continue with unauthenticated context
    }
  }

  return context;
}

/**
 * Require authentication for a tool
 * Throws error if user is not authenticated
 */
export function requireAuth(context: AuthContext): string {
  if (!context.isAuthenticated || !context.userId) {
    throw new Error('Authentication required. Please sign in to use this feature.');
  }
  return context.userId;
}

/**
 * Optional authentication for a tool
 * Returns userId if authenticated, null otherwise
 */
export function optionalAuth(context: AuthContext): string | null {
  return context.userId;
}
