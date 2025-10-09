import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Save, Package, Star, Crosshair, Sparkles, ChevronRight } from 'lucide-react';
import { MyLoadoutsData, BaseWidgetProps } from './types';
import { LoadoutCardSkeleton } from '@/components/shared/SkeletonLoader';
import { CopyButton } from '@/components/shared/CopyButton';

const MyLoadouts: React.FC<BaseWidgetProps<MyLoadoutsData>> = ({ toolOutput }) => {
  const [data, setData] = useState<MyLoadoutsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const openai = (window as any).openai;
    let rawData = toolOutput || openai?.toolOutput;
    const extractedData = rawData?.structuredContent || rawData;

    if (extractedData) {
      setData(extractedData);
      setIsLoading(false);
    }
  }, [toolOutput]);

  // Enhanced loading state with skeleton
  if (isLoading || !data) {
    return <LoadoutCardSkeleton />;
  }

  // Empty state
  if (!data.loadouts || data.loadouts.length === 0) {
    return (
      <div className="bg-cod-black text-white p-6 max-w-3xl mx-auto">
        <motion.h1
          className="text-3xl font-bold gradient-text-premium mb-6 flex items-center gap-3"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Save className="w-8 h-8 text-cod-orange" /> MY SAVED LOADOUTS
        </motion.h1>
        <motion.div
          className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-2xl border border-white/20 shadow-2xl rounded-xl p-12 text-center hover:border-cod-orange transition-all duration-300 ripple"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
          whileTap={{ scale: 0.98 }}
        >
          <Package className="w-16 h-16 mx-auto mb-4 text-gray-400" />
          <h3 className="text-xl font-bold text-gray-300 mb-2">
            No saved loadouts yet
          </h3>
          <p className="text-gray-400 mb-6 max-w-md mx-auto">
            Try asking for a weapon loadout and save it to your favorites!
          </p>
          <div className="inline-block px-6 py-3 bg-cod-orange/20 border border-cod-orange/50 rounded-lg text-cod-orange font-semibold hover:bg-cod-orange/30 transition-colors cursor-pointer flex items-center gap-2 ripple">
            Explore Meta Weapons <ChevronRight className="w-4 h-4" />
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="bg-cod-black text-white p-6 max-w-4xl mx-auto">
      {/* Header with gradient text */}
      <motion.div
        className="mb-6 pb-4 border-b border-gray-700"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="text-3xl font-bold gradient-text-premium mb-2 flex items-center gap-3">
          <Save className="w-8 h-8 text-cod-orange" /> MY SAVED LOADOUTS
        </h1>
        <p className="text-gray-400">
          {data.count} saved loadout{data.count !== 1 ? 's' : ''}
        </p>
      </motion.div>

      {/* Loadout Cards with P1 enhancements */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {data.loadouts.map((loadout, index) => (
          <motion.div
            key={loadout.id}
            className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-2xl border border-white/20 shadow-2xl rounded-xl p-6 hover:border-cod-orange transition-all duration-300 cursor-pointer ripple"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 * index }}
            whileHover={{ scale: 1.02, y: -5 }}
            whileTap={{ scale: 0.98 }}
            tabIndex={0}
            role="article"
            aria-label={`Saved loadout: ${loadout.name}`}
          >
            {/* Loadout Header */}
            <div className="mb-4 pb-3 border-b border-gray-700">
              <div className="flex items-start justify-between mb-2">
                <h3 className="text-xl font-bold gradient-text-premium flex items-center gap-2">
                  <Star className="w-5 h-5 text-yellow-500 fill-yellow-500" />
                  {loadout.name}
                </h3>
                <CopyButton text={loadout.name} label="loadout name" />
              </div>
              <div className="flex flex-wrap gap-2">
                <span className="px-2 py-1 bg-cod-black/50 text-xs text-cod-orange font-semibold rounded gradient-text-premium">
                  {loadout.game}
                </span>
                {loadout.playstyle && (
                  <span className="px-2 py-1 bg-cod-black/50 text-xs text-gray-400 rounded">
                    {loadout.playstyle}
                  </span>
                )}
              </div>
            </div>

            {/* Primary Weapon */}
            <div className="mb-4">
              <div className="text-xs text-gray-400 uppercase tracking-wide mb-1">
                Primary Weapon
              </div>
              <div className="text-white font-semibold flex items-center gap-2">
                <Crosshair className="w-4 h-4 text-cod-orange" />
                {loadout.primaryWeapon}
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between pt-3 border-t border-gray-700">
              <span className="text-xs text-gray-400">
                Created {new Date(loadout.createdAt).toLocaleDateString()}
              </span>
              <span className="text-cod-orange text-sm font-semibold hover:text-yellow-500 transition-colors flex items-center gap-1 gradient-text-premium">
                View Details <ChevronRight className="w-4 h-4" />
              </span>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Add New Loadout CTA with enhanced interactions */}
      <motion.div
        className="mt-6 p-5 bg-gradient-to-br from-white/5 to-white/0 backdrop-blur-xl border border-white/10 shadow-xl rounded-lg text-center hover:bg-white/10 transition-colors cursor-pointer ripple"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        tabIndex={0}
        role="button"
        aria-label="Create new loadout"
      >
        <p className="text-gray-300 mb-2 flex items-center justify-center gap-2">
          <Sparkles className="w-4 h-4 text-cod-orange" /> Want to create a new loadout?
        </p>
        <p className="text-sm text-gray-400">
          Ask me for weapon recommendations or loadout suggestions
        </p>
      </motion.div>
    </div>
  );
};

export default MyLoadouts;
