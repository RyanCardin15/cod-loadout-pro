'use client';

import { useAuthContext, type AuthProviderType } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { logger } from '@/lib/logger';

/**
 * Custom hook for authentication operations
 * Provides easy access to auth state and methods
 */
export function useAuth() {
  const { user, loading, signInWithProvider, signOut: contextSignOut, getIdToken } = useAuthContext();
  const router = useRouter();

  const signIn = async (provider: AuthProviderType = 'google') => {
    logger.debug('User signing in', { provider });
    await signInWithProvider(provider);
  };

  const signOut = async () => {
    logger.debug('User signing out');
    await contextSignOut();
    router.push('/');
  };

  const requireAuth = () => {
    if (!loading && !user) {
      logger.debug('Auth required, redirecting to signin');
      router.push('/?signin=true');
      return false;
    }
    return true;
  };

  const isAuthenticated = !!user;

  return {
    user,
    loading,
    isAuthenticated,
    signIn,
    signOut,
    getIdToken,
    requireAuth,
  };
}
