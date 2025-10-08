import React from 'react';
import { motion } from 'framer-motion';
import { Swords, TrendingUp, Zap, Target, Lightbulb, AlertTriangle } from './icons';
import { BaseWidgetProps } from './types';
import { CounterSuggestionsSkeleton } from '@/components/shared/SkeletonLoader';
import { ErrorCard } from '@/components/shared/ErrorCard';
import { CopyWeaponButton } from '@/components/shared/CopyButton';
import { useCounterSuggestionsData } from './hooks/useWidgetData';
import { GlassCard } from './components/GlassCard';
import { fadeInDown, fadeInUp, createListItemVariants, transitions } from './animations/variants';
import { useReducedMotion } from './hooks/useReducedMotion';

const CounterSuggestions: React.FC<BaseWidgetProps<any>> = ({ toolOutput }) => {
  const { data, isLoading } = useCounterSuggestionsData(toolOutput);
  const prefersReducedMotion = useReducedMotion();

  // Enhanced loading state with skeleton
  if (isLoading || !data) {
    return <CounterSuggestionsSkeleton />;
  }

  // Enhanced error states using ErrorCard
  if (data.isEmpty && data.errorState?.type === 'ENEMY_WEAPON_NOT_FOUND') {
    return (
      <div className="bg-cod-black text-white p-6 max-w-4xl mx-auto">
        <motion.h1
          className="text-3xl font-bold gradient-text-premium mb-6 flex items-center gap-3"
          {...(prefersReducedMotion ? {} : fadeInDown)}
        >
          <Swords className="w-8 h-8 text-cod-orange" /> COUNTER STRATEGIES
        </motion.h1>
        <ErrorCard
          type="ENEMY_WEAPON_NOT_FOUND"
          title="Enemy Weapon Not Found"
          message={data.errorState.message || 'The enemy weapon could not be found.'}
          suggestions={data.errorState.suggestions}
        />
      </div>
    );
  }

  if (data.isEmpty && data.errorState?.type === 'NO_COUNTERS_FOUND') {
    return (
      <div className="bg-cod-black text-white p-6 max-w-4xl mx-auto">
        <motion.h1
          className="text-3xl font-bold gradient-text-premium mb-6 flex items-center gap-3"
          {...(prefersReducedMotion ? {} : fadeInDown)}
        >
          <Swords className="w-8 h-8 text-cod-orange" /> COUNTER STRATEGIES
        </motion.h1>
        <ErrorCard
          type="NO_COUNTERS_FOUND"
          title="No Counters Found"
          message={data.errorState.message || 'No counter weapons found for this enemy loadout.'}
        />
      </div>
    );
  }

  if (data.isEmpty && data.errorState?.type === 'FIREBASE_CONNECTION_ERROR') {
    return (
      <div className="bg-cod-black text-white p-6 max-w-4xl mx-auto">
        <motion.h1
          className="text-3xl font-bold gradient-text-premium mb-6 flex items-center gap-3"
          {...(prefersReducedMotion ? {} : fadeInDown)}
        >
          <Swords className="w-8 h-8 text-cod-orange" /> COUNTER STRATEGIES
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

  if (data.isEmpty && data.errorState) {
    return (
      <div className="bg-cod-black text-white p-6 max-w-4xl mx-auto">
        <motion.h1
          className="text-3xl font-bold gradient-text-premium mb-6 flex items-center gap-3"
          {...(prefersReducedMotion ? {} : fadeInDown)}
        >
          <Swords className="w-8 h-8 text-cod-orange" /> COUNTER STRATEGIES
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

  return (
    <div className="bg-cod-black text-white p-6 max-w-4xl mx-auto">
      {/* Header with gradient text */}
      <motion.div
        className="mb-6 pb-4 border-b border-gray-700"
        {...(prefersReducedMotion ? {} : fadeInDown)}
      >
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold gradient-text-premium mb-2 flex items-center gap-3">
            <Swords className="w-8 h-8 text-cod-orange" /> COUNTERING: {data.enemyWeapon.name}
          </h1>
          <CopyWeaponButton weaponName={data.enemyWeapon.name} />
        </div>
        <p className="text-gray-400">
          {data.enemyWeapon.category}
          {data.threatLevel && ` • ${data.threatLevel}`}
        </p>
      </motion.div>

      {/* Partial Data Warning Banner */}
      {data.partialData && (
        <GlassCard
          variant="warning"
          className="mb-6"
          {...(prefersReducedMotion ? {} : { ...fadeInUp, transition: { delay: 0.1, ...transitions.normal } })}
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
        </GlassCard>
      )}

      {/* Enemy Analysis with micro-interactions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        {/* Strengths */}
        <GlassCard
          variant="danger"
          interactive
          {...(prefersReducedMotion ? {} : {
            initial: { opacity: 0, x: -20 },
            animate: { opacity: 1, x: 0 },
            transition: { delay: 0.15, ...transitions.normal },
            whileHover: { scale: 1.02, y: -5 },
            whileTap: { scale: 0.98 }
          })}
          tabIndex={0}
          role="article"
          aria-label="Enemy strengths"
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
                  {...(prefersReducedMotion ? {} : createListItemVariants(index))}
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
        </GlassCard>

        {/* Weaknesses */}
        <GlassCard
          variant="success"
          interactive
          {...(prefersReducedMotion ? {} : {
            initial: { opacity: 0, x: 20 },
            animate: { opacity: 1, x: 0 },
            transition: { delay: 0.2, ...transitions.normal },
            whileHover: { scale: 1.02, y: -5 },
            whileTap: { scale: 0.98 }
          })}
          tabIndex={0}
          role="article"
          aria-label="Enemy weaknesses"
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
                  {...(prefersReducedMotion ? {} : createListItemVariants(index))}
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
        </GlassCard>
      </div>

      {/* Top Counters with gradient text and copy */}
      {data.counterWeapons && data.counterWeapons.length > 0 && (
        <motion.div
          className="mb-6"
          {...(prefersReducedMotion ? {} : { ...fadeInUp, transition: { delay: 0.25, ...transitions.normal } })}
        >
          <h2 className="text-xl font-bold gradient-text-premium mb-4 flex items-center gap-2">
            <Target className="w-6 h-6 text-cod-orange" /> TOP COUNTER WEAPONS
          </h2>
          <div className="space-y-3">
            {data.counterWeapons.map((counter, index) => (
              <GlassCard
                key={index}
                variant="primary"
                interactive
                {...(prefersReducedMotion ? {} : {
                  initial: { opacity: 0, y: 20 },
                  animate: { opacity: 1, y: 0 },
                  transition: { delay: 0.05 * index, ...transitions.normal },
                  whileHover: { scale: 1.02, y: -5 },
                  whileTap: { scale: 0.98 }
                })}
                tabIndex={0}
                role="article"
                aria-label={`Counter weapon ${index + 1}: ${counter.weaponName}`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-1">
                      <span className="text-cod-orange font-bold text-lg gradient-text-premium">
                        #{index + 1}
                      </span>
                      <h3 className="text-white font-bold text-lg">
                        {counter.weaponName}
                      </h3>
                      <CopyWeaponButton weaponName={counter.weaponName} />
                      <span className="text-xs text-gray-400 px-2 py-0.5 bg-cod-black rounded">
                        {counter.category}
                      </span>
                    </div>
                  </div>
                  <div className="text-right ml-4">
                    <div className="text-xs text-gray-400 uppercase tracking-wide">
                      Effectiveness
                    </div>
                    <div className="text-2xl font-bold gradient-text-s-tier">
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
              </GlassCard>
            ))}
          </div>
        </motion.div>
      )}

      {/* Counter Perks with enhanced interactions */}
      {data.counterPerks && data.counterPerks.length > 0 && (
        <GlassCard
          variant="accent"
          interactive
          className="mb-6 hover:border-purple-500/60"
          {...(prefersReducedMotion ? {} : {
            ...fadeInUp,
            transition: { delay: 0.3, ...transitions.normal },
            whileHover: { scale: 1.02, y: -5 },
            whileTap: { scale: 0.98 }
          })}
          tabIndex={0}
          role="article"
          aria-label="Recommended counter perks"
        >
          <h3 className="text-sm uppercase tracking-wide font-semibold mb-4 flex items-center gap-2 text-purple-400">
            <Zap className="w-4 h-4" /> RECOMMENDED COUNTER PERKS
          </h3>
          <ul className="space-y-2">
            {data.counterPerks.map((perk, index) => (
              <motion.li
                key={index}
                className="flex items-start gap-2 text-sm"
                {...(prefersReducedMotion ? {} : createListItemVariants(index))}
              >
                <span className="text-purple-400 mt-0.5">•</span>
                <span className="text-gray-300">{perk}</span>
              </motion.li>
            ))}
          </ul>
        </GlassCard>
      )}

      {/* Key Strategies with gradient text */}
      <GlassCard
        variant="primary"
        interactive
        className="mb-6"
        {...(prefersReducedMotion ? {} : {
          ...fadeInUp,
          transition: { delay: 0.35, ...transitions.normal },
          whileTap: { scale: 0.98 }
        })}
        tabIndex={0}
        role="region"
        aria-label="Key strategies"
      >
        <h3 className="text-sm uppercase tracking-wide gradient-text-premium font-semibold mb-4 flex items-center gap-2">
          <Target className="w-4 h-4 text-cod-orange" /> KEY STRATEGIES
        </h3>
        {data.strategies && data.strategies.length > 0 ? (
          <ul className="space-y-3">
            {data.strategies.map((strategy, index) => (
              <motion.li
                key={index}
                className="flex items-start gap-3"
                {...(prefersReducedMotion ? {} : createListItemVariants(index))}
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
      </GlassCard>

      {/* Tactical Advice with enhanced interactions */}
      <GlassCard
        variant="info"
        interactive
        {...(prefersReducedMotion ? {} : {
          ...fadeInUp,
          transition: { delay: 0.4, ...transitions.normal },
          whileHover: { scale: 1.02, y: -5 },
          whileTap: { scale: 0.98 }
        })}
        tabIndex={0}
        role="article"
        aria-label="Tactical advice"
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
                {...(prefersReducedMotion ? {} : createListItemVariants(index))}
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
      </GlassCard>
    </div>
  );
};

export default CounterSuggestions;
