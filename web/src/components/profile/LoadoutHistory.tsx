'use client';

import { Shield, Clock, Trash2, Star, TrendingUp } from 'lucide-react';
import type { UserProfile } from '@/hooks/useProfile';
import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';

interface LoadoutHistoryProps {
  profile: UserProfile;
}

export function LoadoutHistory({ profile }: LoadoutHistoryProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const recentLoadouts = profile.history.savedLoadouts.slice(-10).reverse();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-premium rounded-2xl p-6 space-y-6"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cod-accent to-cod-blue flex items-center justify-center">
            <Shield className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold font-rajdhani">Loadout History</h2>
            <p className="text-xs text-gray-400">
              {recentLoadouts.length} saved loadout{recentLoadouts.length !== 1 ? 's' : ''}
            </p>
          </div>
        </div>

        {/* Stats Badge */}
        {recentLoadouts.length > 0 && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="px-3 py-1.5 rounded-full bg-cod-accent/20 text-cod-accent text-sm font-semibold flex items-center gap-2"
          >
            <TrendingUp className="w-4 h-4" />
            {recentLoadouts.length} total
          </motion.div>
        )}
      </div>

      {/* Loadout List */}
      <AnimatePresence mode="popLayout">
        {recentLoadouts.length > 0 ? (
          <div className="space-y-3">
            {recentLoadouts.map((loadoutId, index) => {
              const isHovered = hoveredIndex === index;

              return (
                <motion.div
                  key={loadoutId}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ delay: index * 0.05 }}
                  onMouseEnter={() => setHoveredIndex(index)}
                  onMouseLeave={() => setHoveredIndex(null)}
                  whileHover={{ scale: 1.02, x: 5 }}
                  className="relative group"
                >
                  {/* Glow Effect */}
                  {isHovered && (
                    <motion.div
                      className="absolute -inset-0.5 bg-gradient-to-r from-cod-accent to-cod-blue rounded-xl opacity-30 blur"
                      layoutId="loadout-glow"
                    />
                  )}

                  {/* Card */}
                  <div className="relative glass rounded-xl p-4 border border-white/10 hover:border-cod-accent/50 transition-all">
                    <div className="flex items-center justify-between">
                      {/* Left: Loadout Info */}
                      <div className="flex items-center gap-4 flex-1">
                        {/* Index Badge */}
                        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-cod-accent/20 to-cod-blue/20 flex items-center justify-center">
                          <span className="text-cod-accent font-bold">#{index + 1}</span>
                        </div>

                        {/* Details */}
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <p className="font-semibold text-white">Loadout {loadoutId.slice(0, 8)}</p>
                            <motion.button
                              whileHover={{ scale: 1.2, rotate: 72 }}
                              whileTap={{ scale: 0.9 }}
                              className="text-gray-400 hover:text-yellow-500 transition-colors"
                            >
                              <Star className="w-4 h-4" />
                            </motion.button>
                          </div>

                          <div className="flex items-center gap-3 text-xs text-gray-400">
                            <div className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              <span>Recently saved</span>
                            </div>
                            <span className="text-gray-600">•</span>
                            <span className="text-cod-accent">MW3</span>
                          </div>
                        </div>
                      </div>

                      {/* Right: Actions */}
                      <div className="flex items-center gap-2">
                        <AnimatePresence>
                          {isHovered && (
                            <motion.button
                              initial={{ opacity: 0, scale: 0.8 }}
                              animate={{ opacity: 1, scale: 1 }}
                              exit={{ opacity: 0, scale: 0.8 }}
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.9 }}
                              className="p-2 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </motion.button>
                          )}
                        </AnimatePresence>

                        <motion.button
                          whileHover={{ x: 5 }}
                          className="px-4 py-2 rounded-lg bg-gradient-to-r from-cod-accent to-cod-blue text-white font-semibold hover:shadow-lg transition-shadow"
                        >
                          View
                        </motion.button>
                      </div>
                    </div>

                    {/* Progress Bar (weapon mastery indicator) */}
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: '100%' }}
                      transition={{ delay: index * 0.05 + 0.2, duration: 0.5 }}
                      className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-cod-accent to-transparent opacity-50 rounded-b-xl"
                    />
                  </div>
                </motion.div>
              );
            })}
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-16 space-y-4"
          >
            {/* Empty State Icon */}
            <motion.div
              animate={{
                y: [0, -10, 0],
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
              className="relative inline-block"
            >
              <div className="absolute inset-0 bg-cod-accent/20 rounded-full blur-xl" />
              <div className="relative w-20 h-20 bg-gradient-to-br from-cod-accent/20 to-cod-blue/20 rounded-2xl flex items-center justify-center mx-auto">
                <Shield className="w-10 h-10 text-gray-600" />
              </div>
            </motion.div>

            {/* Empty State Text */}
            <div>
              <p className="text-lg font-semibold text-gray-300 mb-2">No saved loadouts yet</p>
              <p className="text-sm text-gray-500 mb-6">Start building loadouts to see them here</p>

              {/* CTA Button */}
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="px-6 py-3 bg-gradient-to-r from-cod-accent to-cod-blue rounded-xl font-semibold text-white shadow-lg hover:shadow-xl transition-shadow"
              >
                Create Your First Loadout
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Recent Weapons */}
      {profile.history.queriedWeapons.length > 0 && (
        <div className="pt-6 border-t border-white/10">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
            Recently Viewed Weapons
          </p>
          <div className="flex flex-wrap gap-2">
            {profile.history.queriedWeapons.slice(-5).reverse().map((weapon, i) => (
              <motion.div
                key={`${weapon}-${i}`}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.05 }}
                whileHover={{ scale: 1.1, rotate: 5 }}
                className="px-3 py-1.5 rounded-lg bg-cod-black/50 border border-white/10 text-xs font-medium text-gray-300 hover:border-cod-accent/50 transition-colors cursor-pointer"
              >
                {weapon}
              </motion.div>
            ))}
          </div>
        </div>
      )}
    </motion.div>
  );
}
