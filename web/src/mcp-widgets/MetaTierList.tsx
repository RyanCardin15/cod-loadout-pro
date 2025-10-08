import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Target, Flame, Sparkles, Zap, BarChart3, TrendingDown, Newspaper } from 'lucide-react';
import { MetaTierListData, TierData, Weapon, BaseWidgetProps } from './types';
import { cn } from '@/lib/utils';

const MetaTierList: React.FC<BaseWidgetProps<MetaTierListData>> = ({ toolOutput }) => {
  const [tiers, setTiers] = useState<TierData>({
    S: [],
    A: [],
    B: [],
    C: [],
    D: []
  });
  const [recentChanges, setRecentChanges] = useState<string[]>([]);
  const [lastUpdated, setLastUpdated] = useState<string>('');

  useEffect(() => {
    // Access data from window.openai.toolOutput if available
    const openai = (window as any).openai;
    let rawData = toolOutput || openai?.toolOutput;

    // Handle nested structuredContent from MCP tool response
    const data = rawData?.structuredContent || rawData;

    if (data?.tiers) {
      setTiers(data.tiers);
      setRecentChanges(data.recentChanges || []);
      setLastUpdated(data.lastUpdated || '');
    }
  }, [toolOutput]);

  const getTierIcon = (tier: string) => {
    switch (tier) {
      case 'S': return <Flame className="w-4 h-4" />;
      case 'A': return <Sparkles className="w-4 h-4" />;
      case 'B': return <Zap className="w-4 h-4" />;
      case 'C': return <BarChart3 className="w-4 h-4" />;
      case 'D': return <TrendingDown className="w-4 h-4" />;
      default: return null;
    }
  };

  const getTierColor = (tier: string): string => {
    switch (tier) {
      case 'S': return 'bg-gradient-to-br from-yellow-500 to-orange-600 text-white neon-glow';
      case 'A': return 'bg-gradient-to-br from-green-500 to-emerald-600 text-white';
      case 'B': return 'bg-gradient-to-br from-blue-500 to-cyan-600 text-white';
      case 'C': return 'bg-gradient-to-br from-purple-500 to-indigo-600 text-white';
      case 'D': return 'bg-gradient-to-br from-gray-500 to-slate-600 text-white';
      default: return 'bg-gray-700 text-white';
    }
  };

  const getTierDescription = (tierName: string) => {
    switch (tierName) {
      case 'S': return { icon: getTierIcon('S'), text: 'Top Tier - Dominates the meta' };
      case 'A': return { icon: getTierIcon('A'), text: 'Excellent - Strong picks' };
      case 'B': return { icon: getTierIcon('B'), text: 'Good - Viable options' };
      case 'C': return { icon: getTierIcon('C'), text: 'Average - Situational' };
      case 'D': return { icon: getTierIcon('D'), text: 'Below Average - Needs buffs' };
      default: return { icon: null, text: '' };
    }
  };

  const renderTier = (tierName: keyof TierData, weapons: Weapon[]) => {
    if (!weapons || weapons.length === 0) return null;

    const tierDesc = getTierDescription(tierName);

    return (
      <motion.div
        key={tierName}
        className="mb-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 * (['S', 'A', 'B', 'C', 'D'].indexOf(tierName)) }}
      >
        <div className="flex items-center gap-3 mb-3">
          <div className={cn(
            "px-4 py-2 rounded-lg font-bold text-xl min-w-[60px] text-center flex items-center justify-center gap-2",
            getTierColor(tierName)
          )}>
            {tierDesc.icon}
            {tierName}
          </div>
          <div className="text-gray-400 text-sm flex items-center gap-2">
            {tierDesc.text}
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {weapons.map((weapon, index) => (
            <motion.div
              key={weapon.id}
              className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-2xl border border-white/20 shadow-2xl rounded-xl p-5 hover:border-cod-orange transition-all duration-300 cursor-pointer"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.05 * index }}
              whileHover={{ scale: 1.05, y: -5 }}
            >
              <div className="flex justify-between items-start mb-2">
                <h3 className="text-white font-semibold text-lg">{weapon.name}</h3>
                {weapon.usage && (
                  <span className="text-cod-orange text-sm font-medium">
                    {weapon.usage.toFixed(1)}%
                  </span>
                )}
              </div>
              {weapon.usage && (
                <div className="w-full bg-gray-700 rounded-full h-2 relative overflow-hidden">
                  <motion.div
                    className="h-full bg-cod-orange rounded-full relative"
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.min(weapon.usage, 100)}%` }}
                    transition={{ duration: 0.8, ease: 'easeOut' }}
                  >
                    {/* Shimmer overlay */}
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer" />
                  </motion.div>
                </div>
              )}
            </motion.div>
          ))}
        </div>
      </motion.div>
    );
  };

  // Find the highest non-empty tier
  const getHighestTier = (): keyof TierData | null => {
    const tierOrder: (keyof TierData)[] = ['S', 'A', 'B', 'C', 'D'];
    return tierOrder.find(tier => tiers[tier]?.length > 0) || null;
  };

  // Check if there's any data at all
  const hasAnyData = Object.values(tiers).some(tierWeapons => tierWeapons?.length > 0);
  const highestTier = getHighestTier();
  const showEmptySTierNotice = tiers.S?.length === 0 && highestTier && highestTier !== 'S';

  return (
    <div className="bg-cod-black text-white p-6 max-w-4xl mx-auto">
      <motion.div
        className="mb-8"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="text-3xl font-bold text-cod-orange mb-2 flex items-center gap-3">
          <Target className="w-8 h-8" /> MW3 Meta Tier List
        </h1>
        {lastUpdated && (
          <p className="text-gray-400 text-sm">
            Last updated: {new Date(lastUpdated).toLocaleDateString()}
          </p>
        )}
      </motion.div>

      {!hasAnyData ? (
        <motion.div
          className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-2xl border border-white/20 shadow-2xl rounded-xl p-8 text-center"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
        >
          <BarChart3 className="w-16 h-16 mx-auto mb-4 text-gray-400" />
          <p className="text-gray-400 text-lg mb-2">No meta data available yet</p>
          <p className="text-gray-500 text-sm">Check back soon for updated weapon rankings</p>
        </motion.div>
      ) : (
        <>
          {showEmptySTierNotice && (
            <motion.div
              className="bg-cod-gray/50 border border-yellow-500/30 rounded-lg p-4 mb-6"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.1 }}
            >
              <p className="text-yellow-400 text-sm flex items-center gap-2">
                <Flame className="w-4 h-4" /> No S-tier weapons currently — showing highest available tier ({highestTier})
              </p>
            </motion.div>
          )}

          <div className="mb-8">
            {(['S', 'A', 'B', 'C', 'D'] as const).map((tier) =>
              renderTier(tier, tiers[tier])
            )}
          </div>
        </>
      )}

      {recentChanges && recentChanges.length > 0 && (
        <motion.div
          className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-2xl border border-white/20 shadow-2xl rounded-xl p-6 mt-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <h2 className="text-xl font-bold text-cod-orange mb-4 flex items-center gap-2">
            <Newspaper className="w-6 h-6" /> Recent Changes
          </h2>
          <ul className="space-y-2">
            {recentChanges.map((change, index) => (
              <motion.li
                key={index}
                className="text-gray-300 flex items-start gap-2"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.05 * index }}
              >
                <span className="text-cod-orange">•</span>
                <span>{change}</span>
              </motion.li>
            ))}
          </ul>
        </motion.div>
      )}
    </div>
  );
};

export default MetaTierList;
