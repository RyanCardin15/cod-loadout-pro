'use client';

import { useAuthContext, type AuthProviderType } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';

/**
 * Custom hook for authentication operations
 * Provides easy access to auth state and methods
 */
export function useAuth() {
  const { user, loading, signInWithProvider, signOut: contextSignOut, getIdToken } = useAuthContext();
  const router = useRouter();

  const signIn = async (provider: AuthProviderType = 'google') => {
    console.log('[useAuth] Signing in with provider:', provider);
    await signInWithProvider(provider);
  };

  const signOut = async () => {
    console.log('[useAuth] Signing out');
    await contextSignOut();
    router.push('/');
  };

  const requireAuth = () => {
    console.log('[useAuth] Checking auth requirement:', { loading, hasUser: !!user });
    if (!loading && !user) {
      console.log('[useAuth] Not authenticated, redirecting to signin');
      router.push('/?signin=true');
      return false;
    }
    return true;
  };

  const isAuthenticated = !!user;
  console.log('[useAuth] Current state:', { hasUser: !!user, loading, isAuthenticated });

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
