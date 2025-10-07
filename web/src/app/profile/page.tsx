'use client';

import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { useProfile } from '@/hooks/useProfile';
import { ProfileHeaderEnhanced } from '@/components/profile/ProfileHeaderEnhanced';
import { PlaystyleEditorEnhanced } from '@/components/profile/PlaystyleEditorEnhanced';
import { GamePreferences } from '@/components/profile/GamePreferences';
import { LoadoutHistory } from '@/components/profile/LoadoutHistory';
import { StatsCardEnhanced } from '@/components/profile/StatsCardEnhanced';

export default function ProfilePage() {
  const { profile, isLoading, error } = useProfile();

  // Show error state
  if (error) {
    const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
    const isPermissionError = errorMessage.includes('permission') || errorMessage.includes('insufficient');

    return (
      <ProtectedRoute>
        <div className="min-h-screen flex items-center justify-center bg-cod-black p-4">
          <div className="glass-premium rounded-2xl p-8 max-w-lg mx-4 text-center space-y-6">
            <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto">
              <span className="text-4xl">⚠️</span>
            </div>

            <div>
              <h2 className="text-2xl font-bold text-white mb-2">Failed to Load Profile</h2>
              <p className="text-gray-400 mb-4">{errorMessage}</p>

              {isPermissionError && (
                <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-4 text-left space-y-3">
                  <p className="text-sm text-yellow-200 font-semibold">🔒 Firestore Permission Issue</p>
                  <div className="text-xs text-yellow-100/80 space-y-2">
                    <p>The security rules may need time to propagate (1-2 minutes).</p>
                    <p className="font-mono bg-black/30 p-2 rounded">
                      Rules deployed to: cod-loadout-pro
                    </p>
                    <p>Check browser console (F12) for detailed error logs.</p>
                  </div>
                </div>
              )}
            </div>

            <div className="flex gap-3 justify-center">
              <button
                onClick={() => window.location.reload()}
                className="px-6 py-3 bg-gradient-to-r from-cod-accent to-cod-blue rounded-xl font-semibold hover:opacity-90 transition-opacity"
              >
                Retry
              </button>
              <button
                onClick={() => window.open('https://console.firebase.google.com/project/cod-loadout-pro/firestore', '_blank')}
                className="px-6 py-3 bg-gray-700 hover:bg-gray-600 rounded-xl font-semibold transition-colors"
              >
                Check Firebase Console
              </button>
            </div>

            <p className="text-xs text-gray-500">
              See FIRESTORE_SETUP.md for troubleshooting steps
            </p>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  // Show loading state
  if (isLoading || !profile) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen flex items-center justify-center bg-cod-black">
          <div className="text-center space-y-4">
            <div className="relative w-16 h-16 mx-auto">
              <div className="absolute inset-0 border-4 border-cod-accent/20 rounded-full" />
              <div className="absolute inset-0 border-4 border-cod-accent border-t-transparent rounded-full animate-spin" />
            </div>
            <div className="space-y-2">
              <p className="text-xl font-semibold text-white">Loading profile...</p>
              <p className="text-sm text-gray-500">Connecting to Firebase</p>
            </div>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-cod-black pb-20 md:pb-8">
        <div className="container mx-auto px-4 py-8 space-y-8">
          {/* Profile Header */}
          <ProfileHeaderEnhanced profile={profile} />

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column - Playstyle & Games */}
            <div className="lg:col-span-1 space-y-6">
              <PlaystyleEditorEnhanced profile={profile} />
              <GamePreferences profile={profile} />
              <StatsCardEnhanced profile={profile} />
            </div>

            {/* Right Column - Loadout History */}
            <div className="lg:col-span-2">
              <LoadoutHistory profile={profile} />
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
