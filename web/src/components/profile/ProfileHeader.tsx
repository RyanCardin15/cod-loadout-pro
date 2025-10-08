'use client';

import Image from 'next/image';
import { useAuth } from '@/hooks/useAuth';
import { Camera, Mail } from 'lucide-react';
import type { UserProfile } from '@/hooks/useProfile';

interface ProfileHeaderProps {
  profile: UserProfile;
}

export function ProfileHeader({ profile }: ProfileHeaderProps) {
  const { user } = useAuth();

  return (
    <div className="bg-gradient-to-br from-cod-surface to-cod-gray border border-cod-accent/30 rounded-xl p-8 relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0" style={{
          backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 35px, rgba(255,255,255,.05) 35px, rgba(255,255,255,.05) 70px)',
        }} />
      </div>

      <div className="relative z-10 flex flex-col md:flex-row items-center md:items-start gap-6">
        {/* Avatar */}
        <div className="relative group">
          {user?.photoURL ? (
            <Image
              src={user.photoURL}
              alt={profile.displayName || 'User'}
              width={96}
              height={96}
              className="w-24 h-24 rounded-xl border-4 border-cod-accent shadow-lg"
            />
          ) : (
            <div className="w-24 h-24 rounded-xl bg-gradient-to-br from-cod-accent to-cod-accent-dark flex items-center justify-center text-white font-bold text-4xl border-4 border-cod-accent shadow-lg">
              {(profile.displayName || user?.email || 'U')[0]?.toUpperCase() || 'U'}
            </div>
          )}

          <button className="absolute inset-0 bg-black/60 rounded-xl flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
            <Camera className="w-6 h-6 text-white" />
          </button>
        </div>

        {/* User Info */}
        <div className="flex-1 text-center md:text-left">
          <h1 className="text-3xl font-bold font-rajdhani text-white mb-2">
            {profile.displayName || 'Operator'}
          </h1>

          <div className="flex items-center justify-center md:justify-start gap-2 text-gray-400 mb-4">
            <Mail className="w-4 h-4" />
            <span className="text-sm">{profile.email || user?.email}</span>
          </div>

          <div className="flex flex-wrap items-center justify-center md:justify-start gap-4">
            <div className="bg-cod-black/50 px-4 py-2 rounded-lg">
              <p className="text-xs text-gray-400 uppercase tracking-wider">Playstyle</p>
              <p className="text-lg font-semibold text-cod-accent">{profile.playstyle.primary}</p>
            </div>

            <div className="bg-cod-black/50 px-4 py-2 rounded-lg">
              <p className="text-xs text-gray-400 uppercase tracking-wider">Loadouts Saved</p>
              <p className="text-lg font-semibold text-white">{profile.history.savedLoadouts.length}</p>
            </div>

            <div className="bg-cod-black/50 px-4 py-2 rounded-lg">
              <p className="text-xs text-gray-400 uppercase tracking-wider">Total Queries</p>
              <p className="text-lg font-semibold text-white">{profile.totalQueries}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
