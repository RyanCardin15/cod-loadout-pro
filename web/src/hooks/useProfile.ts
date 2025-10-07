'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from './useAuth';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { toast } from 'sonner';

export interface UserProfile {
  userId: string;
  displayName?: string;
  email?: string;
  photoURL?: string;

  playstyle: {
    primary: 'Aggressive' | 'Tactical' | 'Sniper' | 'Support';
    ranges: {
      close: number;
      medium: number;
      long: number;
    };
    pacing: 'Rusher' | 'Balanced' | 'Camper';
    strengths?: string[];
  };

  games: string[];

  history: {
    queriedWeapons: string[];
    savedLoadouts: string[];
    playtimeByMode?: { [mode: string]: number };
  };

  favorites: string[];

  totalQueries: number;
  createdAt: string;
  lastActive: string;
}

const DEFAULT_PROFILE: Omit<UserProfile, 'userId' | 'displayName' | 'email' | 'photoURL'> = {
  playstyle: {
    primary: 'Tactical',
    ranges: {
      close: 33,
      medium: 34,
      long: 33,
    },
    pacing: 'Balanced',
    strengths: [],
  },
  games: ['MW3', 'Warzone'],
  history: {
    queriedWeapons: [],
    savedLoadouts: [],
  },
  favorites: [],
  totalQueries: 0,
  createdAt: new Date().toISOString(),
  lastActive: new Date().toISOString(),
};

/**
 * Custom hook for user profile management
 */
export function useProfile() {
  const { user, isAuthenticated } = useAuth();
  const queryClient = useQueryClient();

  // Fetch user profile
  const {
    data: profile,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['profile', user?.uid],
    queryFn: async (): Promise<UserProfile | null> => {
      console.log('[useProfile] Query function called', {
        hasUser: !!user,
        userId: user?.uid,
        isAuthenticated,
      });

      if (!user) {
        console.log('[useProfile] No user, returning null');
        return null;
      }

      try {
        console.log('[useProfile] Fetching profile from Firestore for user:', user.uid);
        const docRef = doc(db, 'users', user.uid);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          console.log('[useProfile] Profile found:', docSnap.data());
          return docSnap.data() as UserProfile;
        }

        // Create default profile if doesn't exist
        console.log('[useProfile] Creating new profile for user:', user.uid);
        const newProfile: UserProfile = {
          ...DEFAULT_PROFILE,
          userId: user.uid,
          displayName: user.displayName || undefined,
          email: user.email || undefined,
          photoURL: user.photoURL || undefined,
        };

        await setDoc(docRef, newProfile);
        console.log('[useProfile] Profile created successfully');
        return newProfile;
      } catch (err: any) {
        console.error('[useProfile] Error in queryFn:', err);
        console.error('[useProfile] Error details:', {
          code: err?.code,
          message: err?.message,
          name: err?.name,
        });
        throw err;
      }
    },
    enabled: isAuthenticated && !!user,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });

  // Update profile mutation
  const updateProfile = useMutation({
    mutationFn: async (updates: Partial<UserProfile>) => {
      if (!user) throw new Error('Not authenticated');

      const docRef = doc(db, 'users', user.uid);
      await updateDoc(docRef, {
        ...updates,
        lastActive: new Date().toISOString(),
      });

      return updates;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile', user?.uid] });
      toast.success('Profile updated successfully');
    },
    onError: (error) => {
      console.error('Error updating profile:', error);
      toast.error('Failed to update profile');
    },
  });

  // Track activity
  const trackActivity = async (activityType: 'query' | 'save', data: string) => {
    if (!user || !profile) return;

    try {
      const updates: Partial<UserProfile> = {
        lastActive: new Date().toISOString(),
      };

      if (activityType === 'query') {
        updates.history = {
          ...profile.history,
          queriedWeapons: [
            ...new Set([...profile.history.queriedWeapons, data]),
          ].slice(-50), // Keep last 50
        };
        updates.totalQueries = profile.totalQueries + 1;
      } else if (activityType === 'save') {
        updates.history = {
          ...profile.history,
          savedLoadouts: [...profile.history.savedLoadouts, data],
        };
      }

      const docRef = doc(db, 'users', user.uid);
      await updateDoc(docRef, updates);

      queryClient.invalidateQueries({ queryKey: ['profile', user?.uid] });
    } catch (error) {
      console.error('Error tracking activity:', error);
    }
  };

  // Add to favorites
  const toggleFavorite = async (loadoutId: string) => {
    if (!user || !profile) return;

    try {
      const isFavorite = profile.favorites.includes(loadoutId);
      const updates: Partial<UserProfile> = {
        favorites: isFavorite
          ? profile.favorites.filter((id) => id !== loadoutId)
          : [...profile.favorites, loadoutId],
      };

      const docRef = doc(db, 'users', user.uid);
      await updateDoc(docRef, updates);

      queryClient.invalidateQueries({ queryKey: ['profile', user?.uid] });

      toast.success(isFavorite ? 'Removed from favorites' : 'Added to favorites');
    } catch (error) {
      console.error('Error toggling favorite:', error);
      toast.error('Failed to update favorites');
    }
  };

  return {
    profile,
    isLoading,
    error,
    updateProfile: updateProfile.mutate,
    isUpdating: updateProfile.isPending,
    trackActivity,
    toggleFavorite,
  };
}
