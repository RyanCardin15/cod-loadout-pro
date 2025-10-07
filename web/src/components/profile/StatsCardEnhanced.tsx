'use client';

import { BarChart3, TrendingUp, Search, Heart, Zap, Award } from 'lucide-react';
import type { UserProfile } from '@/hooks/useProfile';
import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';

interface StatsCardEnhancedProps {
  profile: UserProfile;
}

export function StatsCardEnhanced({ profile }: StatsCardEnhancedProps) {
  const [hoveredStat, setHoveredStat] = useState<number | null>(null);

  const stats = [
    {
      icon: Search,
      label: 'Total Queries',
      value: profile.totalQueries,
      color: 'from-blue-500 to-cyan-500',
      textColor: 'text-blue-400',
      max: 100,
    },
    {
      icon: Heart,
      label: 'Saved Loadouts',
      value: profile.history.savedLoadouts.length,
      color: 'from-red-500 to-pink-500',
      textColor: 'text-red-400',
      max: 50,
    },
    {
      icon: TrendingUp,
      label: 'Favorites',
      value: profile.favorites.length,
      color: 'from-green-500 to-emerald-500',
      textColor: 'text-green-400',
      max: 20,
    },
    {
      icon: BarChart3,
      label: 'Weapons Tried',
      value: profile.history.queriedWeapons.length,
      color: 'from-purple-500 to-pink-500',
      textColor: 'text-purple-400',
      max: 30,
    },
  ];

  // Calculate total activity score
  const activityScore = stats.reduce((acc, stat) => acc + Math.min((stat.value / stat.max) * 100, 100), 0) / stats.length;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-premium rounded-2xl p-6 space-y-6"
    >
      {/* Header with Activity Score */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cod-green to-cod-blue flex items-center justify-center">
              <BarChart3 className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold font-rajdhani">Activity Stats</h2>
              <p className="text-xs text-gray-400">Your performance metrics</p>
            </div>
          </div>

          {/* Activity Score Ring */}
          <div className="relative w-16 h-16">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
              <circle
                cx="50"
                cy="50"
                r="45"
                fill="none"
                stroke="rgba(255,255,255,0.1)"
                strokeWidth="8"
              />
              <motion.circle
                cx="50"
                cy="50"
                r="45"
                fill="none"
                stroke="url(#activityGradient)"
                strokeWidth="8"
                strokeLinecap="round"
                strokeDasharray={`${2 * Math.PI * 45}`}
                initial={{ strokeDashoffset: 2 * Math.PI * 45 }}
                animate={{ strokeDashoffset: 2 * Math.PI * 45 * (1 - activityScore / 100) }}
                transition={{ duration: 1, ease: 'easeOut' }}
              />
              <defs>
                <linearGradient id="activityGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#00FF88" />
                  <stop offset="100%" stopColor="#00D4FF" />
                </linearGradient>
              </defs>
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-xs font-bold text-cod-green">{Math.round(activityScore)}%</span>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="space-y-4">
        {stats.map((stat, i) => {
          const Icon = stat.icon;
          const percentage = Math.min((stat.value / stat.max) * 100, 100);
          const isHovered = hoveredStat === i;

          return (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 * i }}
              onMouseEnter={() => setHoveredStat(i)}
              onMouseLeave={() => setHoveredStat(null)}
              whileHover={{ scale: 1.02 }}
              className="relative group"
            >
              {/* Stat Header */}
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <motion.div
                    className={`p-2 rounded-lg bg-gradient-to-br ${stat.color} bg-opacity-20`}
                    animate={isHovered ? { rotate: 360 } : {}}
                    transition={{ duration: 0.5 }}
                  >
                    <Icon className={`w-4 h-4 ${stat.textColor}`} />
                  </motion.div>
                  <span className="text-sm text-gray-300 font-medium">{stat.label}</span>
                </div>
                <motion.div
                  key={stat.value}
                  initial={{ scale: 1.5, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className={`text-2xl font-bold ${stat.textColor}`}
                >
                  {stat.value}
                </motion.div>
              </div>

              {/* Progress Bar */}
              <div className="relative h-3 bg-cod-black rounded-full overflow-hidden">
                <motion.div
                  className={`absolute inset-y-0 left-0 bg-gradient-to-r ${stat.color} rounded-full`}
                  initial={{ width: 0 }}
                  animate={{ width: `${percentage}%` }}
                  transition={{ duration: 1, delay: 0.1 * i, ease: 'easeOut' }}
                >
                  {/* Shimmer Effect */}
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer" />
                </motion.div>

                {/* Goal Marker */}
                {percentage < 100 && (
                  <div
                    className="absolute top-0 bottom-0 w-0.5 bg-white/30"
                    style={{ left: '100%' }}
                  />
                )}
              </div>

              {/* Hover Details */}
              <AnimatePresence>
                {isHovered && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="absolute -top-12 left-1/2 -translate-x-1/2 px-4 py-2 bg-black/90 rounded-lg text-xs text-white whitespace-nowrap z-10 shadow-xl"
                  >
                    {stat.value} / {stat.max} ({Math.round(percentage)}%)
                    <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-full w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-black/90" />
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          );
        })}
      </div>

      {/* Achievement Milestones */}
      <div className="pt-4 border-t border-white/10">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
          Next Milestones
        </p>
        <div className="space-y-2">
          {profile.totalQueries < 50 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex items-center justify-between text-xs"
            >
              <div className="flex items-center gap-2">
                <Zap className="w-3 h-3 text-yellow-500" />
                <span className="text-gray-400">Power User</span>
              </div>
              <span className="text-gray-500">{50 - profile.totalQueries} queries away</span>
            </motion.div>
          )}
          {profile.history.savedLoadouts.length < 25 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex items-center justify-between text-xs"
            >
              <div className="flex items-center gap-2">
                <Award className="w-3 h-3 text-blue-500" />
                <span className="text-gray-400">Loadout Master</span>
              </div>
              <span className="text-gray-500">{25 - profile.history.savedLoadouts.length} loadouts away</span>
            </motion.div>
          )}
        </div>
      </div>

      {/* Member Since Footer */}
      <div className="pt-4 border-t border-white/10">
        <p className="text-xs text-gray-500 text-center">
          Member since {new Date(profile.createdAt).toLocaleDateString('en-US', {
            month: 'long',
            day: 'numeric',
            year: 'numeric'
          })}
        </p>
      </div>
    </motion.div>
  );
}
