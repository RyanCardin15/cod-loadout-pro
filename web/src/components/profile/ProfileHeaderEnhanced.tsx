'use client';

import { useAuth } from '@/hooks/useAuth';
import { Camera, Mail, Award, TrendingUp, Zap, Crown } from 'lucide-react';
import type { UserProfile } from '@/hooks/useProfile';
import { motion } from 'framer-motion';
import { useState } from 'react';

interface ProfileHeaderProps {
  profile: UserProfile;
}

export function ProfileHeaderEnhanced({ profile }: ProfileHeaderProps) {
  const { user } = useAuth();
  const [isHoveringAvatar, setIsHoveringAvatar] = useState(false);

  // Calculate level based on total queries
  const level = Math.floor(profile.totalQueries / 10) + 1;
  const progress = ((profile.totalQueries % 10) / 10) * 100;

  // Calculate rank based on stats
  const getRank = () => {
    const score = profile.totalQueries + profile.history.savedLoadouts.length * 5 + profile.favorites.length * 2;
    if (score >= 100) return { name: 'Elite', color: 'from-yellow-500 to-orange-500', icon: Crown };
    if (score >= 50) return { name: 'Expert', color: 'from-purple-500 to-pink-500', icon: Award };
    if (score >= 20) return { name: 'Advanced', color: 'from-blue-500 to-cyan-500', icon: TrendingUp };
    return { name: 'Beginner', color: 'from-green-500 to-emerald-500', icon: Zap };
  };

  const rank = getRank();
  const RankIcon = rank.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative overflow-hidden rounded-3xl"
    >
      {/* Animated Background */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-br from-cod-surface via-cod-gray to-cod-black" />
        <motion.div
          className="absolute inset-0 opacity-30"
          animate={{
            background: [
              'radial-gradient(circle at 20% 50%, rgba(255,107,0,0.3) 0%, transparent 50%)',
              'radial-gradient(circle at 80% 50%, rgba(0,149,255,0.3) 0%, transparent 50%)',
              'radial-gradient(circle at 20% 50%, rgba(255,107,0,0.3) 0%, transparent 50%)',
            ],
          }}
          transition={{ duration: 10, repeat: Infinity }}
        />
        {/* Grid Pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,107,0,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(255,107,0,0.05)_1px,transparent_1px)] bg-[size:2rem_2rem] opacity-30" />
      </div>

      {/* Content */}
      <div className="relative z-10 p-8 border border-white/10">
        <div className="flex flex-col md:flex-row items-center md:items-start gap-8">
          {/* Avatar Section */}
          <motion.div
            className="relative"
            onHoverStart={() => setIsHoveringAvatar(true)}
            onHoverEnd={() => setIsHoveringAvatar(false)}
            whileHover={{ scale: 1.05 }}
          >
            {/* Rank Badge */}
            <motion.div
              className={`absolute -top-2 -right-2 z-20 px-3 py-1 rounded-full bg-gradient-to-r ${rank.color} text-white text-xs font-bold shadow-lg flex items-center gap-1`}
              animate={{ y: [0, -5, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <RankIcon className="w-3 h-3" />
              {rank.name}
            </motion.div>

            {/* Level Ring */}
            <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 100 100">
              <circle
                cx="50"
                cy="50"
                r="48"
                fill="none"
                stroke="rgba(255,255,255,0.1)"
                strokeWidth="2"
              />
              <motion.circle
                cx="50"
                cy="50"
                r="48"
                fill="none"
                stroke="url(#gradient)"
                strokeWidth="2"
                strokeLinecap="round"
                strokeDasharray={`${2 * Math.PI * 48}`}
                initial={{ strokeDashoffset: 2 * Math.PI * 48 }}
                animate={{ strokeDashoffset: 2 * Math.PI * 48 * (1 - progress / 100) }}
                transition={{ duration: 1, ease: 'easeOut' }}
              />
              <defs>
                <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#FF6B00" />
                  <stop offset="100%" stopColor="#00D4FF" />
                </linearGradient>
              </defs>
            </svg>

            {/* Avatar */}
            <div className="relative w-28 h-28 rounded-2xl overflow-hidden border-4 border-cod-accent shadow-2xl shadow-cod-accent/50">
              {user?.photoURL ? (
                <motion.img
                  src={user.photoURL}
                  alt={profile.displayName || 'User'}
                  className="w-full h-full object-cover"
                  animate={isHoveringAvatar ? { scale: 1.1 } : { scale: 1 }}
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-cod-accent to-cod-accent-dark flex items-center justify-center text-white font-bold text-4xl">
                  {(profile.displayName || user?.email || 'U')[0]?.toUpperCase() || 'U'}
                </div>
              )}

              {/* Upload Overlay */}
              <motion.div
                className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center"
                initial={{ opacity: 0 }}
                animate={{ opacity: isHoveringAvatar ? 1 : 0 }}
              >
                <Camera className="w-8 h-8 text-white" />
              </motion.div>
            </div>

            {/* Level Badge */}
            <motion.div
              className="absolute -bottom-2 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-gradient-to-r from-cod-blue to-cod-green text-white text-sm font-bold shadow-lg"
              whileHover={{ scale: 1.1 }}
            >
              LVL {level}
            </motion.div>
          </motion.div>

          {/* Info Section */}
          <div className="flex-1 text-center md:text-left space-y-4">
            {/* Name & Email */}
            <div>
              <motion.h1
                className="text-4xl font-bold font-rajdhani text-white mb-2"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
              >
                {profile.displayName || 'Operator'}
              </motion.h1>

              <div className="flex items-center justify-center md:justify-start gap-2 text-gray-400 mb-2">
                <Mail className="w-4 h-4" />
                <span className="text-sm">{profile.email || user?.email}</span>
              </div>

              {/* Member Since */}
              <p className="text-xs text-gray-500">
                Member since {new Date(profile.createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
              </p>
            </div>

            {/* XP Progress */}
            <div>
              <div className="flex items-center justify-between text-sm mb-2">
                <span className="text-gray-400">Progress to Level {level + 1}</span>
                <span className="text-cod-accent font-semibold">{profile.totalQueries % 10}/{10} XP</span>
              </div>
              <div className="relative h-3 bg-cod-black rounded-full overflow-hidden">
                <motion.div
                  className="absolute inset-y-0 left-0 bg-gradient-to-r from-cod-accent to-cod-blue rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 1, ease: 'easeOut' }}
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer" />
                </motion.div>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-3 gap-4">
              {[
                { label: 'Playstyle', value: profile.playstyle.primary, color: 'cod-accent', icon: '🎯' },
                { label: 'Loadouts', value: profile.history.savedLoadouts.length, color: 'cod-blue', icon: '⚔️' },
                { label: 'Queries', value: profile.totalQueries, color: 'cod-green', icon: '📊' },
              ].map((stat, i) => (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, scale: 0.5 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.1 * i }}
                  whileHover={{ scale: 1.05, y: -5 }}
                  className="glass-premium rounded-xl p-4 text-center hover:border-cod-accent/50 transition-all"
                >
                  <div className="text-2xl mb-1">{stat.icon}</div>
                  <div className={`text-xs text-gray-400 uppercase tracking-wider mb-1`}>
                    {stat.label}
                  </div>
                  <div className={`text-2xl font-bold text-${stat.color}`}>
                    {stat.value}
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>

        {/* Achievements Row */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mt-8 pt-6 border-t border-white/10"
        >
          <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">
            Recent Achievements
          </h3>
          <div className="flex flex-wrap gap-3">
            {profile.totalQueries >= 10 && (
              <motion.div
                whileHover={{ scale: 1.1, rotate: 5 }}
                className="group relative px-4 py-2 rounded-lg bg-gradient-to-r from-yellow-500/20 to-orange-500/20 border border-yellow-500/30 hover:border-yellow-500 transition-all cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <Award className="w-4 h-4 text-yellow-500" />
                  <span className="text-sm font-semibold text-yellow-500">First Steps</span>
                </div>
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-1 bg-black/90 rounded text-xs text-white opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                  Made 10+ queries
                </div>
              </motion.div>
            )}
            {profile.history.savedLoadouts.length >= 5 && (
              <motion.div
                whileHover={{ scale: 1.1, rotate: -5 }}
                className="group relative px-4 py-2 rounded-lg bg-gradient-to-r from-blue-500/20 to-cyan-500/20 border border-blue-500/30 hover:border-blue-500 transition-all cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <Award className="w-4 h-4 text-blue-500" />
                  <span className="text-sm font-semibold text-blue-500">Collector</span>
                </div>
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-1 bg-black/90 rounded text-xs text-white opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                  Saved 5+ loadouts
                </div>
              </motion.div>
            )}
            {profile.games.length >= 3 && (
              <motion.div
                whileHover={{ scale: 1.1, rotate: 5 }}
                className="group relative px-4 py-2 rounded-lg bg-gradient-to-r from-purple-500/20 to-pink-500/20 border border-purple-500/30 hover:border-purple-500 transition-all cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <Award className="w-4 h-4 text-purple-500" />
                  <span className="text-sm font-semibold text-purple-500">Multi-Game Master</span>
                </div>
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-1 bg-black/90 rounded text-xs text-white opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                  Playing 3+ games
                </div>
              </motion.div>
            )}
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}
