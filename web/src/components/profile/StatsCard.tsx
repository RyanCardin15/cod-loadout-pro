'use client';

import { BarChart3, TrendingUp, Search, Heart } from 'lucide-react';
import type { UserProfile } from '@/hooks/useProfile';

interface StatsCardProps {
  profile: UserProfile;
}

export function StatsCard({ profile }: StatsCardProps) {
  const stats = [
    {
      icon: Search,
      label: 'Total Queries',
      value: profile.totalQueries,
      color: 'text-blue-400',
    },
    {
      icon: Heart,
      label: 'Saved Loadouts',
      value: profile.history.savedLoadouts.length,
      color: 'text-red-400',
    },
    {
      icon: TrendingUp,
      label: 'Favorites',
      value: profile.favorites.length,
      color: 'text-green-400',
    },
    {
      icon: BarChart3,
      label: 'Weapons Tried',
      value: profile.history.queriedWeapons.length,
      color: 'text-purple-400',
    },
  ];

  return (
    <div className="bg-cod-surface border border-cod-accent/20 rounded-xl p-6 space-y-4">
      <div className="flex items-center gap-2 mb-4">
        <BarChart3 className="w-5 h-5 text-cod-accent" />
        <h2 className="text-xl font-bold font-rajdhani">Stats</h2>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="bg-cod-black/50 rounded-lg p-4 border border-cod-surface hover:border-cod-accent/30 transition-colors"
          >
            <stat.icon className={`w-5 h-5 ${stat.color} mb-2`} />
            <p className="text-2xl font-bold font-rajdhani text-white">{stat.value}</p>
            <p className="text-xs text-gray-400 uppercase tracking-wider">{stat.label}</p>
          </div>
        ))}
      </div>

      <div className="pt-4 border-t border-cod-surface">
        <p className="text-xs text-gray-500 text-center">
          Member since {new Date(profile.createdAt).toLocaleDateString()}
        </p>
      </div>
    </div>
  );
}
