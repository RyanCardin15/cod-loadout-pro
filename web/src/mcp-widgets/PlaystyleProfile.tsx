import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Target, Ruler, TrendingUp, Crosshair, Settings, Lightbulb } from 'lucide-react';
import { PlaystyleData, BaseWidgetProps } from './types';

const PlaystyleProfile: React.FC<BaseWidgetProps<PlaystyleData>> = ({ toolOutput }) => {
  const [data, setData] = useState<PlaystyleData | null>(null);

  useEffect(() => {
    const openai = (window as any).openai;
    let rawData = toolOutput || openai?.toolOutput;
    const extractedData = rawData?.structuredContent || rawData;

    if (extractedData?.playstyle) {
      setData(extractedData);
    }
  }, [toolOutput]);

  const getGradientForRange = (value: number) => {
    if (value >= 70) return 'from-red-500 to-orange-500';
    if (value >= 50) return 'from-yellow-500 to-orange-500';
    return 'from-blue-500 to-cyan-500';
  };

  if (!data) {
    return (
      <div className="bg-cod-black text-white p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-cod-gray rounded w-3/4 mb-4"></div>
          <div className="h-32 bg-cod-gray rounded"></div>
        </div>
      </div>
    );
  }

  const { playstyle } = data;

  return (
    <div className="bg-cod-black text-white p-6 max-w-4xl mx-auto">
      {/* Header */}
      <motion.div
        className="mb-6 pb-4 border-b border-gray-700"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="text-3xl font-bold text-cod-orange mb-2 flex items-center gap-3">
          <Target className="w-8 h-8" /> YOUR PLAYSTYLE: {playstyle.primary.toUpperCase()}
        </h1>
        {playstyle.pacing && (
          <p className="text-gray-400">Pacing: {playstyle.pacing}</p>
        )}
      </motion.div>

      {/* Engagement Ranges */}
      <motion.div
        className="mb-6 bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-2xl border border-white/20 shadow-2xl rounded-xl p-6 hover:border-cod-orange transition-all duration-300"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <h3 className="text-sm uppercase tracking-wide text-cod-orange font-semibold mb-4 flex items-center gap-2">
          <Ruler className="w-4 h-4" /> ENGAGEMENT RANGES
        </h3>
        <div className="space-y-4">
          {/* Close Range */}
          <div>
            <div className="flex justify-between text-sm mb-2">
              <span className="text-gray-300 font-medium">Close Range</span>
              <span className="text-cod-orange font-bold">{playstyle.ranges.close}%</span>
            </div>
            <div className="w-full bg-gray-700 rounded-full h-3 relative overflow-hidden">
              <motion.div
                className={`h-full bg-gradient-to-r ${getGradientForRange(playstyle.ranges.close)} rounded-full relative`}
                initial={{ width: 0 }}
                animate={{ width: `${playstyle.ranges.close}%` }}
                transition={{ duration: 0.8, ease: 'easeOut' }}
              >
                {/* Shimmer overlay */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer" />
              </motion.div>
            </div>
          </div>

          {/* Medium Range */}
          <div>
            <div className="flex justify-between text-sm mb-2">
              <span className="text-gray-300 font-medium">Medium Range</span>
              <span className="text-cod-orange font-bold">{playstyle.ranges.medium}%</span>
            </div>
            <div className="w-full bg-gray-700 rounded-full h-3 relative overflow-hidden">
              <motion.div
                className={`h-full bg-gradient-to-r ${getGradientForRange(playstyle.ranges.medium)} rounded-full relative`}
                initial={{ width: 0 }}
                animate={{ width: `${playstyle.ranges.medium}%` }}
                transition={{ duration: 0.8, ease: 'easeOut', delay: 0.1 }}
              >
                {/* Shimmer overlay */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer" />
              </motion.div>
            </div>
          </div>

          {/* Long Range */}
          <div>
            <div className="flex justify-between text-sm mb-2">
              <span className="text-gray-300 font-medium">Long Range</span>
              <span className="text-cod-orange font-bold">{playstyle.ranges.long}%</span>
            </div>
            <div className="w-full bg-gray-700 rounded-full h-3 relative overflow-hidden">
              <motion.div
                className={`h-full bg-gradient-to-r ${getGradientForRange(playstyle.ranges.long)} rounded-full relative`}
                initial={{ width: 0 }}
                animate={{ width: `${playstyle.ranges.long}%` }}
                transition={{ duration: 0.8, ease: 'easeOut', delay: 0.2 }}
              >
                {/* Shimmer overlay */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer" />
              </motion.div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Strengths */}
      {playstyle.strengths && playstyle.strengths.length > 0 && (
        <motion.div
          className="mb-6 bg-gradient-to-br from-green-900/20 to-green-900/10 backdrop-blur-xl border border-green-500/30 shadow-xl rounded-xl p-6 hover:border-green-500/60 transition-all duration-300"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          whileHover={{ scale: 1.02, y: -5 }}
        >
          <h3 className="text-sm uppercase tracking-wide font-semibold mb-4 flex items-center gap-2 text-green-400">
            <TrendingUp className="w-4 h-4" /> YOUR STRENGTHS
          </h3>
          <ul className="space-y-2">
            {playstyle.strengths.map((strength, index) => (
              <motion.li
                key={index}
                className="flex items-start gap-2"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.05 * index }}
              >
                <span className="text-green-400 mt-0.5">•</span>
                <span className="text-gray-300">{strength}</span>
              </motion.li>
            ))}
          </ul>
        </motion.div>
      )}

      {/* Recommended Weapons */}
      {playstyle.recommendedWeapons && playstyle.recommendedWeapons.length > 0 && (
        <motion.div
          className="mb-6 bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-2xl border border-white/20 shadow-2xl rounded-xl p-6 hover:border-cod-orange transition-all duration-300"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <h3 className="text-sm uppercase tracking-wide text-cod-orange font-semibold mb-4 flex items-center gap-2">
            <Crosshair className="w-4 h-4" /> RECOMMENDED WEAPONS
          </h3>
          <div className="space-y-2">
            {playstyle.recommendedWeapons.map((weapon, index) => (
              <motion.div
                key={index}
                className="flex items-center gap-3 bg-cod-black/50 rounded px-4 py-3 hover:bg-cod-black/70 transition-colors"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.05 * index }}
                whileHover={{ x: 5 }}
              >
                <span className="text-cod-orange font-bold text-lg w-8">
                  {index + 1}.
                </span>
                <span className="text-white font-semibold">{weapon}</span>
                {index === 0 && (
                  <span className="ml-auto px-2 py-1 bg-cod-orange/20 text-cod-orange text-xs font-bold rounded">
                    BEST FOR YOU
                  </span>
                )}
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Recommended Perks */}
      {playstyle.recommendedPerks && playstyle.recommendedPerks.length > 0 && (
        <motion.div
          className="bg-gradient-to-br from-blue-900/20 to-blue-900/10 backdrop-blur-xl border border-blue-500/30 shadow-xl rounded-xl p-6 hover:border-blue-500/60 transition-all duration-300"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          whileHover={{ scale: 1.02, y: -5 }}
        >
          <h3 className="text-sm uppercase tracking-wide font-semibold mb-4 flex items-center gap-2 text-blue-400">
            <Settings className="w-4 h-4" /> RECOMMENDED PERKS
          </h3>
          <div className="flex flex-wrap gap-2">
            {playstyle.recommendedPerks.map((perk, index) => (
              <motion.span
                key={index}
                className="px-3 py-2 bg-blue-900/30 border border-blue-500/30 rounded text-sm text-blue-200 font-medium hover:bg-blue-900/50 transition-colors cursor-pointer"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.05 * index }}
                whileHover={{ scale: 1.1 }}
              >
                {perk}
              </motion.span>
            ))}
          </div>
        </motion.div>
      )}

      {/* Footer Note */}
      <motion.div
        className="mt-6 p-4 bg-gradient-to-br from-white/5 to-white/0 backdrop-blur-xl border border-white/10 shadow-xl rounded-lg"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
      >
        <p className="text-xs text-gray-400 text-center flex items-center justify-center gap-2">
          <Lightbulb className="w-3 h-3" /> Profile based on your preferences and play patterns
        </p>
      </motion.div>
    </div>
  );
};

export default PlaystyleProfile;
