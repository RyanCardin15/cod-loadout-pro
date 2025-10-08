import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Swords, Search, AlertTriangle, XCircle, TrendingUp, Zap, Target, Lightbulb, Hourglass } from 'lucide-react';
import { CounterSuggestionsData, BaseWidgetProps } from './types';

const CounterSuggestions: React.FC<BaseWidgetProps<CounterSuggestionsData>> = ({ toolOutput }) => {
  const [data, setData] = useState<CounterSuggestionsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadingTimeout, setLoadingTimeout] = useState(false);

  useEffect(() => {
    const openai = (window as any).openai;
    let rawData = toolOutput || openai?.toolOutput;
    const extractedData = rawData?.structuredContent || rawData;

    if (extractedData?.enemyWeapon) {
      setData(extractedData);
      setIsLoading(false);
    }
  }, [toolOutput]);

  // Loading timeout after 5 seconds
  useEffect(() => {
    const timer = setTimeout(() => {
      if (isLoading) {
        setLoadingTimeout(true);
      }
    }, 5000);

    return () => clearTimeout(timer);
  }, [isLoading]);

  // Loading state
  if (!data) {
    return (
      <div className="bg-cod-black text-white p-6" role="status" aria-label="Loading counter strategies">
        <div className="animate-pulse">
          <div className="h-8 bg-cod-gray rounded w-3/4 mb-4"></div>
          <div className="h-32 bg-cod-gray rounded mb-4"></div>
          {loadingTimeout && (
            <motion.div
              className="bg-yellow-900/20 border border-yellow-500/30 rounded-lg p-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <div className="flex items-center gap-3">
                <Hourglass className="w-6 h-6 text-yellow-500" />
                <div>
                  <h3 className="text-yellow-400 font-semibold">Taking longer than expected...</h3>
                  <p className="text-yellow-200/80 text-sm">Still analyzing the enemy loadout. This might take a moment.</p>
                </div>
              </div>
            </motion.div>
          )}
        </div>
      </div>
    );
  }

  // Empty state - enemy weapon not found
  if (data.isEmpty && data.errorState?.type === 'ENEMY_WEAPON_NOT_FOUND') {
    return (
      <div className="bg-cod-black text-white p-6 max-w-4xl mx-auto" role="alert" aria-live="polite">
        <motion.h1
          className="text-3xl font-bold text-cod-orange mb-6 flex items-center gap-3"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Swords className="w-8 h-8" /> COUNTER STRATEGIES
        </motion.h1>
        <motion.div
          className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-2xl border border-white/20 shadow-2xl rounded-xl p-12 text-center hover:border-cod-orange transition-all duration-300"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
        >
          <Search className="w-16 h-16 mx-auto mb-4 text-gray-400" />
          <h3 className="text-xl font-bold text-gray-300 mb-2">
            Enemy Weapon Not Found
          </h3>
          <p className="text-gray-400 mb-6 max-w-md mx-auto">
            {data.errorState.message}
          </p>
          {data.errorState.suggestions && data.errorState.suggestions.length > 0 && (
            <motion.div
              className="mt-6 text-left max-w-md mx-auto bg-cod-black/50 rounded-lg p-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              <p className="text-cod-orange font-semibold mb-3 text-sm uppercase tracking-wide">
                Did you mean one of these?
              </p>
              <div className="space-y-2">
                {data.errorState.suggestions.map((suggestion, idx) => (
                  <motion.div
                    key={idx}
                    className="text-white text-sm flex items-center gap-2 hover:text-cod-orange transition-colors cursor-pointer"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.05 * idx }}
                    whileHover={{ x: 5 }}
                  >
                    <span className="text-cod-orange">•</span>
                    {suggestion}
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}
        </motion.div>
      </div>
    );
  }

  // Empty state - no counters found
  if (data.isEmpty && data.errorState?.type === 'NO_COUNTERS_FOUND') {
    return (
      <div className="bg-cod-black text-white p-6 max-w-4xl mx-auto" role="alert" aria-live="polite">
        <motion.h1
          className="text-3xl font-bold text-cod-orange mb-6 flex items-center gap-3"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Swords className="w-8 h-8" /> COUNTER STRATEGIES
        </motion.h1>
        <motion.div
          className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-2xl border border-white/20 shadow-2xl rounded-xl p-12 text-center hover:border-cod-orange transition-all duration-300"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
        >
          <Search className="w-16 h-16 mx-auto mb-4 text-gray-400" />
          <h3 className="text-xl font-bold text-gray-300 mb-2">
            No Counters Found
          </h3>
          <p className="text-gray-400 mb-6 max-w-md mx-auto">
            {data.errorState.message}
          </p>
          <p className="text-gray-500 text-sm">
            Try adjusting your playstyle or game selection to find suitable counter weapons.
          </p>
        </motion.div>
      </div>
    );
  }

  // Empty state - Firebase connection error
  if (data.isEmpty && data.errorState?.type === 'FIREBASE_CONNECTION_ERROR') {
    return (
      <div className="bg-cod-black text-white p-6 max-w-4xl mx-auto" role="alert" aria-live="assertive">
        <motion.h1
          className="text-3xl font-bold text-cod-orange mb-6 flex items-center gap-3"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Swords className="w-8 h-8" /> COUNTER STRATEGIES
        </motion.h1>
        <motion.div
          className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-2xl border border-white/20 shadow-2xl rounded-xl p-12 text-center hover:border-cod-orange transition-all duration-300"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
        >
          <AlertTriangle className="w-16 h-16 mx-auto mb-4 text-yellow-500" />
          <h3 className="text-xl font-bold text-gray-300 mb-2">
            Connection Error
          </h3>
          <p className="text-gray-400 mb-6 max-w-md mx-auto">
            {data.errorState.message}
          </p>
          <div className="inline-block px-6 py-3 bg-cod-orange/20 border border-cod-orange/50 rounded-lg text-cod-orange font-semibold hover:bg-cod-orange/30 transition-colors cursor-pointer">
            Try Again
          </div>
        </motion.div>
      </div>
    );
  }

  // Empty state - unknown error
  if (data.isEmpty && data.errorState) {
    return (
      <div className="bg-cod-black text-white p-6 max-w-4xl mx-auto" role="alert" aria-live="assertive">
        <motion.h1
          className="text-3xl font-bold text-cod-orange mb-6 flex items-center gap-3"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Swords className="w-8 h-8" /> COUNTER STRATEGIES
        </motion.h1>
        <motion.div
          className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-2xl border border-white/20 shadow-2xl rounded-xl p-12 text-center hover:border-cod-orange transition-all duration-300"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
        >
          <XCircle className="w-16 h-16 mx-auto mb-4 text-red-500" />
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

  return (
    <div className="bg-cod-black text-white p-6 max-w-4xl mx-auto">
      {/* Header */}
      <motion.div
        className="mb-6 pb-4 border-b border-gray-700"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="text-3xl font-bold text-cod-orange mb-2 flex items-center gap-3">
          <Swords className="w-8 h-8" /> COUNTERING: {data.enemyWeapon.name}
        </h1>
        <p className="text-gray-400">
          {data.enemyWeapon.category}
          {data.threatLevel && ` • ${data.threatLevel}`}
        </p>
      </motion.div>

      {/* Partial Data Warning Banner */}
      {data.partialData && (
        <motion.div
          className="mb-6 bg-yellow-900/20 border border-yellow-500/30 rounded-lg p-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-6 h-6 text-yellow-500 flex-shrink-0" />
            <div className="flex-1">
              <h3 className="text-yellow-400 font-semibold mb-1">
                Partial Data Loaded
              </h3>
              <p className="text-yellow-200/80 text-sm">
                Some counter strategies or tactical advice could not be loaded. The information shown may be incomplete.
              </p>
            </div>
          </div>
        </motion.div>
      )}

      {/* Enemy Analysis */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        {/* Strengths */}
        <motion.div
          className="bg-gradient-to-br from-red-900/20 to-red-900/10 backdrop-blur-xl border border-red-500/30 shadow-xl rounded-xl p-6 hover:border-red-500/60 transition-all duration-300"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.15 }}
          whileHover={{ scale: 1.02, y: -5 }}
        >
          <h3 className="text-sm uppercase tracking-wide font-semibold mb-3 flex items-center gap-2 text-red-400">
            <AlertTriangle className="w-4 h-4" /> Enemy Strengths
          </h3>
          {data.enemyWeapon.strengths && data.enemyWeapon.strengths.length > 0 ? (
            <ul className="space-y-2">
              {data.enemyWeapon.strengths.map((strength, index) => (
                <motion.li
                  key={index}
                  className="flex items-start gap-2 text-sm"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.05 * index }}
                >
                  <span className="text-red-400 mt-0.5">•</span>
                  <span className="text-gray-300">{strength}</span>
                </motion.li>
              ))}
            </ul>
          ) : (
            <div className="bg-cod-black/30 border border-gray-700 rounded-lg p-4 text-center">
              <p className="text-gray-500 text-sm">No significant strengths identified</p>
            </div>
          )}
        </motion.div>

        {/* Weaknesses */}
        <motion.div
          className="bg-gradient-to-br from-green-900/20 to-green-900/10 backdrop-blur-xl border border-green-500/30 shadow-xl rounded-xl p-6 hover:border-green-500/60 transition-all duration-300"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          whileHover={{ scale: 1.02, y: -5 }}
        >
          <h3 className="text-sm uppercase tracking-wide font-semibold mb-3 flex items-center gap-2 text-green-400">
            <TrendingUp className="w-4 h-4" /> Enemy Weaknesses
          </h3>
          {data.enemyWeapon.weaknesses && data.enemyWeapon.weaknesses.length > 0 ? (
            <ul className="space-y-2">
              {data.enemyWeapon.weaknesses.map((weakness, index) => (
                <motion.li
                  key={index}
                  className="flex items-start gap-2 text-sm"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.05 * index }}
                >
                  <span className="text-green-400 mt-0.5">•</span>
                  <span className="text-gray-300">{weakness}</span>
                </motion.li>
              ))}
            </ul>
          ) : (
            <div className="bg-cod-black/30 border border-gray-700 rounded-lg p-4 text-center">
              <p className="text-gray-500 text-sm">No significant weaknesses identified</p>
            </div>
          )}
        </motion.div>
      </div>

      {/* Top Counters */}
      {data.counterWeapons && data.counterWeapons.length > 0 && (
        <motion.div
          className="mb-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
        >
          <h2 className="text-xl font-bold text-cod-orange mb-4 flex items-center gap-2">
            <Target className="w-6 h-6" /> TOP COUNTER WEAPONS
          </h2>
          <div className="space-y-3">
            {data.counterWeapons.map((counter, index) => (
              <motion.div
                key={index}
                className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-2xl border border-white/20 shadow-2xl rounded-xl p-6 hover:border-cod-orange transition-all duration-300"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.05 * index }}
                whileHover={{ scale: 1.02, y: -5 }}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-1">
                      <span className="text-cod-orange font-bold text-lg">
                        #{index + 1}
                      </span>
                      <h3 className="text-white font-bold text-lg">
                        {counter.weaponName}
                      </h3>
                      <span className="text-xs text-gray-400 px-2 py-0.5 bg-cod-black rounded">
                        {counter.category}
                      </span>
                    </div>
                  </div>
                  <div className="text-right ml-4">
                    <div className="text-xs text-gray-400 uppercase tracking-wide">
                      Effectiveness
                    </div>
                    <div className="text-2xl font-bold text-green-400">
                      {counter.effectiveness}%
                    </div>
                  </div>
                </div>

                {/* Effectiveness Bar */}
                <div className="mb-3">
                  <div className="w-full bg-gray-700 rounded-full h-2 relative overflow-hidden">
                    <motion.div
                      className="h-full bg-gradient-to-r from-green-500 to-green-400 rounded-full relative"
                      initial={{ width: 0 }}
                      animate={{ width: `${counter.effectiveness}%` }}
                      transition={{ duration: 0.8, ease: 'easeOut' }}
                    >
                      {/* Shimmer overlay */}
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer" />
                    </motion.div>
                  </div>
                </div>

                {/* Reasoning */}
                {counter.reasoning && (
                  <p className="text-sm text-gray-300 leading-relaxed bg-cod-black/30 p-3 rounded">
                    {counter.reasoning}
                  </p>
                )}
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Counter Perks */}
      {data.counterPerks && data.counterPerks.length > 0 && (
        <motion.div
          className="mb-6 bg-gradient-to-br from-purple-900/20 to-purple-900/10 backdrop-blur-xl border border-purple-500/30 shadow-xl rounded-xl p-6 hover:border-purple-500/60 transition-all duration-300"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          whileHover={{ scale: 1.02, y: -5 }}
        >
          <h3 className="text-sm uppercase tracking-wide font-semibold mb-4 flex items-center gap-2 text-purple-400">
            <Zap className="w-4 h-4" /> RECOMMENDED COUNTER PERKS
          </h3>
          <ul className="space-y-2">
            {data.counterPerks.map((perk, index) => (
              <motion.li
                key={index}
                className="flex items-start gap-2 text-sm"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.05 * index }}
              >
                <span className="text-purple-400 mt-0.5">•</span>
                <span className="text-gray-300">{perk}</span>
              </motion.li>
            ))}
          </ul>
        </motion.div>
      )}

      {/* Key Strategies */}
      <motion.div
        className="mb-6 bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-2xl border border-white/20 shadow-2xl rounded-xl p-6 hover:border-cod-orange transition-all duration-300"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.35 }}
      >
        <h3 className="text-sm uppercase tracking-wide text-cod-orange font-semibold mb-4 flex items-center gap-2">
          <Target className="w-4 h-4" /> KEY STRATEGIES
        </h3>
        {data.strategies && data.strategies.length > 0 ? (
          <ul className="space-y-3">
            {data.strategies.map((strategy, index) => (
              <motion.li
                key={index}
                className="flex items-start gap-3"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.05 * index }}
              >
                <span className="text-cod-orange font-bold mt-0.5">→</span>
                <span className="text-white text-sm leading-relaxed">{strategy}</span>
              </motion.li>
            ))}
          </ul>
        ) : (
          <div className="bg-cod-black/30 border border-gray-700 rounded-lg p-4 text-center">
            <p className="text-gray-500 text-sm">No strategies available</p>
          </div>
        )}
      </motion.div>

      {/* Tactical Advice */}
      <motion.div
        className="bg-gradient-to-br from-blue-900/20 to-blue-900/10 backdrop-blur-xl border border-blue-500/30 shadow-xl rounded-xl p-6 hover:border-blue-500/60 transition-all duration-300"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        whileHover={{ scale: 1.02, y: -5 }}
      >
        <h3 className="text-sm uppercase tracking-wide font-semibold mb-4 flex items-center gap-2 text-blue-400">
          <Lightbulb className="w-4 h-4" /> TACTICAL ADVICE
        </h3>
        {data.tacticalAdvice && data.tacticalAdvice.length > 0 ? (
          <ul className="space-y-2">
            {data.tacticalAdvice.map((advice, index) => (
              <motion.li
                key={index}
                className="flex items-start gap-2 text-sm"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.05 * index }}
              >
                <span className="text-blue-400 mt-0.5">•</span>
                <span className="text-gray-300">{advice}</span>
              </motion.li>
            ))}
          </ul>
        ) : (
          <div className="bg-cod-black/30 border border-gray-700 rounded-lg p-4 text-center">
            <p className="text-gray-500 text-sm">No tactical advice available</p>
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default CounterSuggestions;
