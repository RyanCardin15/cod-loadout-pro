'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Calendar, Users, Zap } from 'lucide-react';
import { useMeta } from '@/hooks/useMeta';
import { useWeapons } from '@/hooks/useWeapons';
import { TierBadge } from '@/components/shared/TierBadge';
import { WeaponCard } from '@/components/shared/WeaponCard';

type TierKey = 'S' | 'A' | 'B' | 'C' | 'D';

export default function MetaPage() {
  const [selectedGame, setSelectedGame] = useState<string>('MW3');
  const [selectedTier, setSelectedTier] = useState<TierKey | null>(null);

  // Fetch meta data for selected game (pass undefined for 'All')
  const gameFilter = selectedGame === 'All' ? undefined : selectedGame;
  const { metaData, loading, error } = useMeta(gameFilter);

  // Use tiers from meta data instead of grouping from weapons hook
  const weaponsByTier = metaData?.tiers || {
    S: [],
    A: [],
    B: [],
    C: [],
    D: [],
  };

  const tierConfig = [
    { tier: 'S' as TierKey, color: 'from-red-600 to-red-400', label: 'God Tier', description: 'Meta defining weapons' },
    { tier: 'A' as TierKey, color: 'from-orange-600 to-orange-400', label: 'Excellent', description: 'Competitive weapons' },
    { tier: 'B' as TierKey, color: 'from-yellow-600 to-yellow-400', label: 'Good', description: 'Viable weapons' },
    { tier: 'C' as TierKey, color: 'from-green-600 to-green-400', label: 'Average', description: 'Situational weapons' },
    { tier: 'D' as TierKey, color: 'from-blue-600 to-blue-400', label: 'Below Average', description: 'Needs buffs' },
  ];

  const getChangeIcon = (change: 'buff' | 'nerf' | 'adjustment') => {
    if (change === 'buff') return <TrendingUp className="h-5 w-5 text-cod-green" />;
    if (change === 'nerf') return <TrendingDown className="h-5 w-5 text-red-400" />;
    return <Zap className="h-5 w-5 text-cod-blue" />;
  };

  const getChangeBadge = (change: 'buff' | 'nerf' | 'adjustment') => {
    if (change === 'buff') return 'bg-cod-green/20 text-cod-green border-cod-green/50';
    if (change === 'nerf') return 'bg-red-500/20 text-red-400 border-red-400/50';
    return 'bg-cod-blue/20 text-cod-blue border-cod-blue/50';
  };

  return (
    <div className="min-h-screen bg-cod-black pb-20 md:pb-8">
      {/* Header */}
      <div className="bg-gradient-to-b from-cod-gray to-cod-black border-b border-cod-surface">
        <div className="container mx-auto px-4 py-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass border border-cod-orange/50 mb-4">
              <div className="w-2 h-2 bg-cod-orange rounded-full animate-pulse" />
              <span className="text-sm font-medium text-cod-orange">
                Updated {metaData ? new Date(metaData.lastUpdated).toLocaleDateString() : 'Recently'}
              </span>
            </div>
            <h1 className="text-4xl lg:text-5xl font-display font-bold mb-4">
              <span className="gradient-text">Current Meta</span>
            </h1>
            <p className="text-xl text-gray-400 max-w-2xl mx-auto">
              Live tier lists, weapon rankings, and balance changes tracked in real-time
            </p>
          </motion.div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Game Filter */}
        <div className="mb-8 flex justify-center">
          <div className="glass rounded-lg p-1 inline-flex gap-1">
            {['All', 'MW3', 'Warzone', 'BO6'].map((game) => (
              <button
                key={game}
                onClick={() => setSelectedGame(game)}
                className={`px-4 py-2 rounded-lg font-medium transition-all ${
                  selectedGame === game
                    ? 'bg-cod-orange text-white'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                {game}
              </button>
            ))}
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content - Tier Lists */}
          <div className="lg:col-span-2 space-y-8">
            <h2 className="text-2xl font-display font-bold text-white">Tier Rankings</h2>

            {tierConfig.map((config, index) => {
              const tierWeapons = weaponsByTier[config.tier] || [];

              return (
                <motion.div
                  key={config.tier}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="glass-premium rounded-xl p-6 border border-cod-surface"
                >
                  <div className="flex items-center gap-4 mb-6">
                    <TierBadge tier={config.tier} size="lg" />
                    <div className="flex-1">
                      <h3 className="text-2xl font-display font-bold text-white">
                        {config.label}
                      </h3>
                      <p className="text-sm text-gray-400">{config.description}</p>
                    </div>
                    <span className="text-gray-400 text-sm">
                      {tierWeapons.length} weapons
                    </span>
                  </div>

                  {tierWeapons.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {tierWeapons.map((weapon) => (
                        <div
                          key={weapon.id}
                          className="bg-cod-surface/50 hover:bg-cod-surface rounded-lg p-4 cursor-pointer transition-all group"
                        >
                          <div className="flex items-center justify-between mb-2">
                            <div>
                              <h4 className="font-semibold text-white group-hover:text-cod-orange transition-colors">
                                {weapon.name}
                              </h4>
                              <span className="text-sm text-gray-400">{weapon.category}</span>
                            </div>
                            <span className="text-xs text-gray-500">{weapon.game}</span>
                          </div>
                          <div className="flex items-center gap-4 text-xs text-gray-400">
                            <div className="flex items-center gap-1">
                              <Users className="h-3 w-3" />
                              {weapon.meta.popularity}%
                            </div>
                            <div className="flex items-center gap-1 text-cod-green">
                              <TrendingUp className="h-3 w-3" />
                              {weapon.meta.winRate}% WR
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      No weapons in this tier
                    </div>
                  )}
                </motion.div>
              );
            })}
          </div>

          {/* Sidebar - Recent Changes & Pro Loadouts */}
          <div className="space-y-6">
            {/* Recent Changes */}
            <div className="glass-premium rounded-xl p-6 border border-cod-orange/30 sticky top-24">
              <div className="flex items-center gap-2 mb-6">
                <Calendar className="h-5 w-5 text-cod-orange" />
                <h3 className="text-xl font-display font-bold text-white">Recent Changes</h3>
              </div>

              <div className="space-y-4">
                {metaData?.recentChanges.map((change, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="bg-cod-surface/50 rounded-lg p-4"
                  >
                    <div className="flex items-start gap-3 mb-2">
                      {getChangeIcon(change.change)}
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-semibold text-white">{change.weaponName}</h4>
                          <span
                            className={`px-2 py-0.5 rounded text-xs font-medium border ${getChangeBadge(
                              change.change
                            )}`}
                          >
                            {change.change}
                          </span>
                        </div>
                        <p className="text-sm text-gray-400 mb-2">{change.description}</p>
                        <span className="text-xs text-gray-500">
                          {new Date(change.date).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Pro Loadouts */}
            <div className="glass-premium rounded-xl p-6 border border-cod-blue/30">
              <div className="flex items-center gap-2 mb-6">
                <Users className="h-5 w-5 text-cod-blue" />
                <h3 className="text-xl font-display font-bold text-white">Pro Loadouts</h3>
              </div>

              <div className="space-y-3">
                {metaData?.proLoadouts.map((loadout, index) => (
                  <div
                    key={loadout.id}
                    className="bg-cod-surface/50 rounded-lg p-3 hover:bg-cod-surface transition-colors cursor-pointer"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-semibold text-white">{loadout.weaponName}</div>
                        <div className="text-sm text-gray-400">by {loadout.proName}</div>
                      </div>
                      <TierBadge tier={loadout.tier as TierKey} size="sm" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
