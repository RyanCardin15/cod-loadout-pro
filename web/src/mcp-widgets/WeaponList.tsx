import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Crosshair, AlertTriangle, XCircle, Search, BarChart3 } from 'lucide-react';
import { WeaponListData, BaseWidgetProps } from './types';
import { cn } from '@/lib/utils';

const WeaponList: React.FC<BaseWidgetProps<WeaponListData>> = ({ toolOutput }) => {
  const [data, setData] = useState<WeaponListData | null>(null);

  useEffect(() => {
    const openai = (window as any).openai;
    let rawData = toolOutput || openai?.toolOutput;
    const extractedData = rawData?.structuredContent || rawData;

    if (extractedData?.weapons !== undefined) {
      setData(extractedData);
    }
  }, [toolOutput]);

  const getTierColor = (tier?: string): string => {
    switch (tier) {
      case 'S': return 'bg-tier-S text-white neon-glow';
      case 'A': return 'bg-tier-A text-white';
      case 'B': return 'bg-tier-B text-black';
      case 'C': return 'bg-tier-C text-black';
      case 'D': return 'bg-tier-D text-white';
      default: return 'bg-gray-600 text-white';
    }
  };

  const getStatBar = (value: number, label: string) => {
    const percentage = Math.min(value, 100);
    return (
      <div className="mb-2">
        <div className="flex justify-between text-xs mb-1">
          <span className="text-gray-400 uppercase tracking-wide">{label}</span>
          <span className="text-cod-orange font-semibold">{value}</span>
        </div>
        <div className="w-full bg-gray-700 rounded-full h-1.5 relative overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-cod-orange to-yellow-500 rounded-full relative"
            initial={{ width: 0 }}
            animate={{ width: `${percentage}%` }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
          >
            {/* Shimmer overlay */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer" />
          </motion.div>
        </div>
      </div>
    );
  };

  // Loading state
  if (!data) {
    return (
      <div className="bg-cod-black text-white p-6 max-w-4xl mx-auto">
        <div className="animate-pulse">
          <div className="h-8 bg-cod-gray rounded w-3/4 mb-4"></div>
          <div className="h-32 bg-cod-gray rounded mb-4"></div>
          <div className="h-32 bg-cod-gray rounded mb-4"></div>
          <div className="h-32 bg-cod-gray rounded"></div>
        </div>
      </div>
    );
  }

  // Empty state - Firebase connection error
  if (data.isEmpty && data.errorState?.type === 'FIREBASE_CONNECTION_ERROR') {
    return (
      <div className="bg-cod-black text-white p-6 max-w-4xl mx-auto">
        <motion.h1
          className="text-3xl font-bold text-cod-orange mb-6 flex items-center gap-3"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Crosshair className="w-8 h-8" /> WEAPON SEARCH
        </motion.h1>
        <motion.div
          className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-2xl border border-white/20 shadow-2xl rounded-xl p-12 text-center hover:border-cod-orange transition-all duration-300"
          role="alert"
          aria-live="polite"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
        >
          <AlertTriangle className="w-16 h-16 mx-auto mb-4 text-yellow-500" aria-hidden="true" />
          <h3 className="text-xl font-bold text-gray-300 mb-2">
            Connection Error
          </h3>
          <p className="text-gray-400 mb-6 max-w-md mx-auto">
            {data.errorState.message}
          </p>
          <div
            className="inline-block px-6 py-3 bg-cod-orange/20 border border-cod-orange/50 rounded-lg text-cod-orange font-semibold hover:bg-cod-orange/30 transition-colors cursor-pointer"
            role="button"
            tabIndex={0}
            aria-label="Retry weapon search"
          >
            Try Again
          </div>
        </motion.div>
      </div>
    );
  }

  // Empty state - validation error
  if (data.isEmpty && data.errorState?.type === 'VALIDATION_ERROR') {
    return (
      <div className="bg-cod-black text-white p-6 max-w-4xl mx-auto">
        <motion.h1
          className="text-3xl font-bold text-cod-orange mb-6 flex items-center gap-3"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Crosshair className="w-8 h-8" /> WEAPON SEARCH
        </motion.h1>
        <motion.div
          className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-2xl border border-white/20 shadow-2xl rounded-xl p-12 text-center hover:border-cod-orange transition-all duration-300"
          role="alert"
          aria-live="polite"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
        >
          <AlertTriangle className="w-16 h-16 mx-auto mb-4 text-yellow-500" aria-hidden="true" />
          <h3 className="text-xl font-bold text-gray-300 mb-2">
            Invalid Search Parameters
          </h3>
          <p className="text-gray-400 mb-6 max-w-md mx-auto">
            {data.errorState.message}
          </p>
          <p className="text-gray-500 text-sm">
            Please check your search criteria and try again.
          </p>
        </motion.div>
      </div>
    );
  }

  // Empty state - unknown error
  if (data.isEmpty && data.errorState && data.errorState.type === 'UNKNOWN_ERROR') {
    return (
      <div className="bg-cod-black text-white p-6 max-w-4xl mx-auto">
        <motion.h1
          className="text-3xl font-bold text-cod-orange mb-6 flex items-center gap-3"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Crosshair className="w-8 h-8" /> WEAPON SEARCH
        </motion.h1>
        <motion.div
          className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-2xl border border-white/20 shadow-2xl rounded-xl p-12 text-center hover:border-cod-orange transition-all duration-300"
          role="alert"
          aria-live="polite"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
        >
          <XCircle className="w-16 h-16 mx-auto mb-4 text-red-500" aria-hidden="true" />
          <h3 className="text-xl font-bold text-gray-300 mb-2">
            Something Went Wrong
          </h3>
          <p className="text-gray-400 mb-6 max-w-md mx-auto">
            {data.errorState.message}
          </p>
          <p className="text-gray-500 text-sm">
            Please try again or contact support if the issue persists.
          </p>
        </motion.div>
      </div>
    );
  }

  // Empty state - no results found (not an error, just no matches)
  if (!data.weapons || data.weapons.length === 0) {
    return (
      <div className="bg-cod-black text-white p-6 max-w-4xl mx-auto">
        <motion.h1
          className="text-3xl font-bold text-cod-orange mb-6 flex items-center gap-3"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Crosshair className="w-8 h-8" /> WEAPON SEARCH
        </motion.h1>
        <motion.div
          className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-2xl border border-white/20 shadow-2xl rounded-xl p-12 text-center hover:border-cod-orange transition-all duration-300"
          role="status"
          aria-live="polite"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
        >
          <Search className="w-16 h-16 mx-auto mb-4 text-gray-400" aria-hidden="true" />
          <h3 className="text-xl font-bold text-gray-300 mb-2">
            No Weapons Found
          </h3>
          <p className="text-gray-400 mb-6 max-w-md mx-auto">
            {data.errorState?.message || 'No weapons match your search criteria.'}
          </p>

          {/* Show active filters */}
          {data.filters && Object.keys(data.filters).length > 0 && (
            <div className="mt-6 text-left max-w-md mx-auto bg-cod-black/50 rounded-lg p-4">
              <p className="text-cod-orange font-semibold mb-3 text-sm uppercase tracking-wide">
                Active Filters:
              </p>
              <div className="space-y-2">
                {data.filters.game && data.filters.game !== 'all' && (
                  <div className="text-white text-sm flex items-center gap-2">
                    <span className="text-cod-orange">•</span>
                    <span className="text-gray-400">Game:</span>
                    <span>{data.filters.game}</span>
                  </div>
                )}
                {data.filters.category && data.filters.category !== 'all' && (
                  <div className="text-white text-sm flex items-center gap-2">
                    <span className="text-cod-orange">•</span>
                    <span className="text-gray-400">Category:</span>
                    <span>{data.filters.category}</span>
                  </div>
                )}
                {data.filters.situation && (
                  <div className="text-white text-sm flex items-center gap-2">
                    <span className="text-cod-orange">•</span>
                    <span className="text-gray-400">Situation:</span>
                    <span>{data.filters.situation}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Suggestions */}
          <div className="mt-6">
            <p className="text-gray-500 text-sm mb-3">Try:</p>
            <div className="flex flex-wrap gap-2 justify-center">
              <span className="px-3 py-1 bg-cod-gray border border-cod-orange/30 rounded-full text-xs text-gray-300 hover:bg-cod-orange/20 transition-colors cursor-pointer">
                Removing filters
              </span>
              <span className="px-3 py-1 bg-cod-gray border border-cod-orange/30 rounded-full text-xs text-gray-300 hover:bg-cod-orange/20 transition-colors cursor-pointer">
                Different category
              </span>
              <span className="px-3 py-1 bg-cod-gray border border-cod-orange/30 rounded-full text-xs text-gray-300 hover:bg-cod-orange/20 transition-colors cursor-pointer">
                Broader search
              </span>
            </div>
          </div>
        </motion.div>
      </div>
    );
  }

  const weapons = data.weapons;
  const filters = data.filters || {};

  return (
    <div className="bg-cod-black text-white p-6 max-w-4xl mx-auto">
      {/* Header */}
      <motion.div
        className="mb-6"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="text-3xl font-bold text-cod-orange mb-2 flex items-center gap-3">
          <Crosshair className="w-8 h-8" /> TOP {weapons.length} WEAPONS
        </h1>
        {Object.keys(filters).length > 0 && (
          <div className="flex gap-2 flex-wrap">
            {filters['game'] && filters['game'] !== 'all' && (
              <span className="px-3 py-1 bg-cod-gray border border-cod-orange/30 rounded-full text-xs text-gray-300">
                {filters['game']}
              </span>
            )}
            {filters['category'] && filters['category'] !== 'all' && (
              <span className="px-3 py-1 bg-cod-gray border border-cod-orange/30 rounded-full text-xs text-gray-300">
                {filters['category']}
              </span>
            )}
            {filters['situation'] && (
              <span className="px-3 py-1 bg-cod-gray border border-cod-orange/30 rounded-full text-xs text-gray-300">
                {filters['situation']}
              </span>
            )}
          </div>
        )}
      </motion.div>

      {/* Weapon Cards */}
      <div className="space-y-4">
        {weapons.map((weapon, index) => (
          <motion.div
            key={weapon?.id || index}
            className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-2xl border border-white/20 shadow-2xl rounded-xl p-6 hover:border-cod-orange transition-all duration-300"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 * index }}
            whileHover={{ scale: 1.02, y: -5 }}
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-1">
                  <span className="text-cod-orange font-bold text-lg">
                    #{index + 1}
                  </span>
                  <h3 className="text-white font-bold text-xl">
                    {weapon?.name || 'Unknown Weapon'}
                  </h3>
                  {weapon?.tier && (
                    <span className={cn(
                      "px-2.5 py-0.5 rounded text-xs font-bold uppercase tracking-wider",
                      getTierColor(weapon.tier)
                    )}>
                      {weapon.tier}-TIER
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-3 text-sm text-gray-400">
                  <span>{weapon?.category || 'N/A'}</span>
                  {weapon?.game && (
                    <>
                      <span>•</span>
                      <span>{weapon.game}</span>
                    </>
                  )}
                  {weapon?.popularity !== undefined && weapon?.popularity !== null && (
                    <>
                      <span>•</span>
                      <span className="text-cod-orange font-semibold">
                        {weapon.popularity.toFixed(1)}% Pick Rate
                      </span>
                    </>
                  )}
                </div>
              </div>

              {weapon?.ttk !== undefined && weapon?.ttk !== null && (
                <div className="text-right ml-4">
                  <div className="text-xs text-gray-400 uppercase tracking-wide">TTK</div>
                  <div className="text-2xl font-bold text-cod-orange">
                    {weapon.ttk}
                    <span className="text-xs text-gray-400 ml-1">ms</span>
                  </div>
                </div>
              )}
            </div>

            {/* Stats Section */}
            {weapon?.stats && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t border-gray-700">
                {getStatBar(weapon.stats?.damage || 0, 'DMG')}
                {getStatBar(weapon.stats?.range || 0, 'RNG')}
                {getStatBar(weapon.stats?.mobility || 0, 'MOB')}
                {getStatBar(weapon.stats?.control || 0, 'CTL')}
              </div>
            )}

            {/* Popularity Bar */}
            {weapon?.popularity !== undefined && weapon?.popularity !== null && (
              <div className="mt-4 pt-4 border-t border-gray-700">
                <div className="flex justify-between text-xs mb-2">
                  <span className="text-gray-400">Popularity</span>
                  <span className="text-cod-orange font-semibold">{weapon.popularity.toFixed(1)}%</span>
                </div>
                <div className="w-full bg-gray-700 rounded-full h-2 relative overflow-hidden">
                  <motion.div
                    className="h-full bg-gradient-to-r from-cod-orange to-yellow-500 rounded-full relative"
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.min(weapon.popularity, 100)}%` }}
                    transition={{ duration: 0.8, ease: 'easeOut' }}
                  >
                    {/* Shimmer overlay */}
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer" />
                  </motion.div>
                </div>
              </div>
            )}
          </motion.div>
        ))}
      </div>

      {/* Footer Note */}
      <motion.div
        className="mt-6 p-4 bg-gradient-to-br from-white/5 to-white/0 backdrop-blur-xl border border-white/10 shadow-xl rounded-lg"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
      >
        <p className="text-xs text-gray-400 text-center flex items-center justify-center gap-2">
          <BarChart3 className="w-3 h-3" /> Stats based on competitive meta and community data
        </p>
      </motion.div>
    </div>
  );
};

export default WeaponList;
