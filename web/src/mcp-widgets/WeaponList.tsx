import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Crosshair, BarChart3 } from 'lucide-react';
import { WeaponListData, BaseWidgetProps } from './types';
import { cn } from '@/lib/utils';
import { WeaponListSkeleton } from '@/components/shared/SkeletonLoader';
import { ErrorCard } from '@/components/shared/ErrorCard';
import { StatTooltip } from '@/components/shared/Tooltip';
import { CopyWeaponButton } from '@/components/shared/CopyButton';

const WeaponList: React.FC<BaseWidgetProps<WeaponListData>> = ({ toolOutput }) => {
  const [data, setData] = useState<WeaponListData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const openai = (window as any).openai;
    let rawData = toolOutput || openai?.toolOutput;
    const extractedData = rawData?.structuredContent || rawData;

    if (extractedData?.weapons !== undefined) {
      setData(extractedData);
      setIsLoading(false);
    }
  }, [toolOutput]);

  const getTierColor = (tier?: string): string => {
    switch (tier) {
      case 'S': return 'bg-tier-S text-white neon-glow gradient-text-s-tier';
      case 'A': return 'bg-tier-A text-white gradient-text-a-tier';
      case 'B': return 'bg-tier-B text-black';
      case 'C': return 'bg-tier-C text-black';
      case 'D': return 'bg-tier-D text-white';
      default: return 'bg-gray-600 text-white';
    }
  };

  const getStatBar = (value: number, label: string) => {
    const percentage = Math.min(value, 100);
    return (
      <StatTooltip label={label} value={value} description={`${label} stat value`}>
        <div className="mb-2 cursor-help">
          <div className="flex justify-between text-xs mb-1">
            <span className="text-gray-400 uppercase tracking-wide">{label}</span>
            <span className="text-cod-orange font-semibold gradient-text-premium">{value}</span>
          </div>
          <div className="w-full bg-gray-700 rounded-full h-1.5 relative overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-cod-orange to-yellow-500 rounded-full relative"
              initial={{ width: 0 }}
              animate={{ width: `${percentage}%` }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer" />
            </motion.div>
          </div>
        </div>
      </StatTooltip>
    );
  };

  // Enhanced loading state with skeleton
  if (isLoading || !data) {
    return <WeaponListSkeleton />;
  }

  // Enhanced error states using ErrorCard
  if (data.isEmpty && data.errorState?.type === 'FIREBASE_CONNECTION_ERROR') {
    return (
      <div className="bg-cod-black text-white p-6 max-w-4xl mx-auto">
        <motion.h1
          className="text-3xl font-bold gradient-text-premium mb-6 flex items-center gap-3"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Crosshair className="w-8 h-8 text-cod-orange" /> WEAPON SEARCH
        </motion.h1>
        <ErrorCard
          type="FIREBASE_CONNECTION_ERROR"
          title="Connection Error"
          message={data.errorState.message || 'Unable to connect to the server.'}
          onRetry={() => window.location.reload()}
          retryLabel="Reconnect"
        />
      </div>
    );
  }

  if (data.isEmpty && data.errorState?.type === 'VALIDATION_ERROR') {
    return (
      <div className="bg-cod-black text-white p-6 max-w-4xl mx-auto">
        <motion.h1
          className="text-3xl font-bold gradient-text-premium mb-6 flex items-center gap-3"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Crosshair className="w-8 h-8 text-cod-orange" /> WEAPON SEARCH
        </motion.h1>
        <ErrorCard
          type="VALIDATION_ERROR"
          title="Invalid Search Parameters"
          message={data.errorState.message || 'Please check your search criteria and try again.'}
        />
      </div>
    );
  }

  if (data.isEmpty && data.errorState && data.errorState.type === 'UNKNOWN_ERROR') {
    return (
      <div className="bg-cod-black text-white p-6 max-w-4xl mx-auto">
        <motion.h1
          className="text-3xl font-bold gradient-text-premium mb-6 flex items-center gap-3"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Crosshair className="w-8 h-8 text-cod-orange" /> WEAPON SEARCH
        </motion.h1>
        <ErrorCard
          type="UNKNOWN_ERROR"
          title="Something Went Wrong"
          message={data.errorState.message || 'An unexpected error occurred.'}
          onRetry={() => window.location.reload()}
        />
      </div>
    );
  }

  if (!data.weapons || data.weapons.length === 0) {
    return (
      <div className="bg-cod-black text-white p-6 max-w-4xl mx-auto">
        <motion.h1
          className="text-3xl font-bold gradient-text-premium mb-6 flex items-center gap-3"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Crosshair className="w-8 h-8 text-cod-orange" /> WEAPON SEARCH
        </motion.h1>
        <ErrorCard
          type="WEAPON_NOT_FOUND"
          title="No Weapons Found"
          message={data.errorState?.message || 'No weapons match your search criteria.'}
        />
      </div>
    );
  }

  const weapons = data.weapons;
  const filters = data.filters || {};

  return (
    <div className="bg-cod-black text-white p-6 max-w-4xl mx-auto">
      {/* Header with gradient text */}
      <motion.div
        className="mb-6"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="text-3xl font-bold gradient-text-premium mb-2 flex items-center gap-3">
          <Crosshair className="w-8 h-8 text-cod-orange" /> TOP {weapons.length} WEAPONS
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

      {/* Weapon Cards with P1 enhancements */}
      <div className="space-y-4">
        {weapons.map((weapon, index) => (
          <motion.div
            key={weapon?.id || index}
            className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-2xl border border-white/20 shadow-2xl rounded-xl p-6 hover:border-cod-orange transition-all duration-300 ripple"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 * index }}
            whileHover={{ scale: 1.02, y: -5 }}
            whileTap={{ scale: 0.98 }}
            tabIndex={0}
            role="article"
            aria-label={`Weapon ${index + 1}: ${weapon?.name || 'Unknown'}`}
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-1">
                  <span className="text-cod-orange font-bold text-lg gradient-text-premium">
                    #{index + 1}
                  </span>
                  <h3 className="text-white font-bold text-xl">
                    {weapon?.name || 'Unknown Weapon'}
                  </h3>
                  <CopyWeaponButton weaponName={weapon?.name || ''} />
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
                      <span className="text-cod-orange font-semibold gradient-text-premium">
                        {weapon.popularity.toFixed(1)}% Pick Rate
                      </span>
                    </>
                  )}
                </div>
              </div>

              {weapon?.ttk !== undefined && weapon?.ttk !== null && (
                <div className="text-right ml-4">
                  <div className="text-xs text-gray-400 uppercase tracking-wide">TTK</div>
                  <div className="text-2xl font-bold gradient-text-s-tier">
                    {weapon.ttk}
                    <span className="text-xs text-gray-400 ml-1">ms</span>
                  </div>
                </div>
              )}
            </div>

            {/* Stats Section with tooltips */}
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
                  <span className="text-cod-orange font-semibold gradient-text-premium">{weapon.popularity.toFixed(1)}%</span>
                </div>
                <div className="w-full bg-gray-700 rounded-full h-2 relative overflow-hidden">
                  <motion.div
                    className="h-full bg-gradient-to-r from-cod-orange to-yellow-500 rounded-full relative"
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.min(weapon.popularity, 100)}%` }}
                    transition={{ duration: 0.8, ease: 'easeOut' }}
                  >
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
