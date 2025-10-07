'use client';

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react';
import {
  User,
  signInWithPopup,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  type AuthProvider,
} from 'firebase/auth';
import { auth, googleProvider, twitterProvider, discordProvider } from '@/lib/firebase';
import { toast } from 'sonner';

export type AuthProviderType = 'google' | 'twitter' | 'discord';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signInWithProvider: (provider: AuthProviderType) => Promise<void>;
  signOut: () => Promise<void>;
  getIdToken: () => Promise<string | null>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    console.log('[AuthContext] Setting up auth state listener');

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      console.log('[AuthContext] Auth state changed:', {
        hasUser: !!user,
        userId: user?.uid,
        email: user?.email,
        displayName: user?.displayName,
      });

      setUser(user);
      setLoading(false);
    });

    return () => {
      console.log('[AuthContext] Cleaning up auth listener');
      unsubscribe();
    };
  }, []);

  const getAuthProvider = (providerType: AuthProviderType): AuthProvider => {
    switch (providerType) {
      case 'google':
        return googleProvider;
      case 'twitter':
        return twitterProvider;
      case 'discord':
        return discordProvider;
      default:
        throw new Error(`Unknown provider: ${providerType}`);
    }
  };

  const signInWithProvider = async (providerType: AuthProviderType) => {
    try {
      const provider = getAuthProvider(providerType);
      const result = await signInWithPopup(auth, provider);

      // Get ID token for backend authentication
      const idToken = await result.user.getIdToken();

      // Store token in localStorage for API calls
      localStorage.setItem('firebaseIdToken', idToken);

      toast.success(`Welcome, ${result.user.displayName || 'Operator'}!`);
    } catch (error: any) {
      console.error('Sign in error:', error);

      if (error.code === 'auth/popup-closed-by-user') {
        toast.error('Sign in cancelled');
      } else if (error.code === 'auth/popup-blocked') {
        toast.error('Pop-up blocked. Please allow pop-ups and try again.');
      } else {
        toast.error('Failed to sign in. Please try again.');
      }

      throw error;
    }
  };

  const signOut = async () => {
    try {
      await firebaseSignOut(auth);
      localStorage.removeItem('firebaseIdToken');
      toast.success('Signed out successfully');
    } catch (error) {
      console.error('Sign out error:', error);
      toast.error('Failed to sign out');
      throw error;
    }
  };

  const getIdToken = async (): Promise<string | null> => {
    if (!user) return null;

    try {
      const token = await user.getIdToken();
      localStorage.setItem('firebaseIdToken', token);
      return token;
    } catch (error) {
      console.error('Error getting ID token:', error);
      return null;
    }
  };

  const value: AuthContextType = {
    user,
    loading,
    signInWithProvider,
    signOut,
    getIdToken,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuthContext() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuthContext must be used within an AuthProvider');
  }
  return context;
}
