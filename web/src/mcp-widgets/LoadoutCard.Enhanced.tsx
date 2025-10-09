import React from 'react';
import { motion } from 'framer-motion';
import { Gamepad2, Crosshair, Zap, Bomb, BarChart3 } from './icons';
import { BaseWidgetProps } from './types';
import { LoadoutCardSkeleton } from '@/components/shared/SkeletonLoader';
import { ErrorCard } from '@/components/shared/ErrorCard';
import { StatTooltip, AttachmentTooltip } from '@/components/shared/Tooltip';
import { CopyWeaponButton } from '@/components/shared/CopyButton';
import { useLoadoutData } from './hooks/useWidgetData';
import { GlassCard } from './components/GlassCard';
import { fadeInDown, fadeInUp, createListItemVariants, transitions } from './animations/variants';
import { useReducedMotion } from './hooks/useReducedMotion';

const LoadoutCardEnhanced: React.FC<BaseWidgetProps<any>> = ({ toolOutput }) => {
  const { data: loadoutData, isLoading } = useLoadoutData(toolOutput);
  const prefersReducedMotion = useReducedMotion();
  const loadout = loadoutData?.loadout;

  const getDifficultyStars = (difficulty?: string) => {
    const levels: Record<string, number> = {
      'Easy': 1,
      'Medium': 2,
      'Hard': 3,
      'Expert': 4,
      'Master': 5
    };
    const level = difficulty ? levels[difficulty] || 3 : 3;
    return '●'.repeat(level) + '○'.repeat(5 - level);
  };

  const getStatBar = (value: number, label: string, description?: string) => {
    const percentage = Math.min(value, 100);
    return (
      <StatTooltip label={label} value={value} description={description}>
        <div className="cursor-help">
          <div className="flex justify-between text-xs mb-1.5">
            <span className="text-gray-400 uppercase tracking-wide font-medium">{label}</span>
            <span className="text-cod-orange font-bold gradient-text-premium">{value}</span>
          </div>
          <div className="w-full bg-gray-700 rounded-full h-2 relative overflow-hidden">
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
  if (isLoading || !loadout) {
    return <LoadoutCardSkeleton />;
  }

  // Enhanced error states using ErrorCard
  if (loadout.isEmpty && loadout.errorState?.type === 'WEAPON_NOT_FOUND') {
    return (
      <div className="bg-cod-black text-white p-6 max-w-3xl mx-auto">
        <motion.h1
          className="text-3xl font-bold gradient-text-premium mb-6 flex items-center gap-3"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Gamepad2 className="w-8 h-8 text-cod-orange" /> LOADOUT BUILDER
        </motion.h1>
        <ErrorCard
          type="WEAPON_NOT_FOUND"
          title="Weapon Not Found"
          message={loadout.errorState.message || 'The weapon you searched for could not be found.'}
          suggestions={loadout.errorState.suggestions}
        />
      </div>
    );
  }

  if (loadout.isEmpty && loadout.errorState?.type === 'FIREBASE_CONNECTION_ERROR') {
    return (
      <div className="bg-cod-black text-white p-6 max-w-3xl mx-auto">
        <motion.h1
          className="text-3xl font-bold gradient-text-premium mb-6 flex items-center gap-3"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Gamepad2 className="w-8 h-8 text-cod-orange" /> LOADOUT BUILDER
        </motion.h1>
        <ErrorCard
          type="FIREBASE_CONNECTION_ERROR"
          title="Connection Error"
          message={loadout.errorState.message || 'Unable to connect to the server.'}
          onRetry={() => window.location.reload()}
          retryLabel="Reconnect"
        />
      </div>
    );
  }

  if (loadout.isEmpty && loadout.errorState) {
    return (
      <div className="bg-cod-black text-white p-6 max-w-3xl mx-auto">
        <motion.h1
          className="text-3xl font-bold gradient-text-premium mb-6 flex items-center gap-3"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Gamepad2 className="w-8 h-8 text-cod-orange" /> LOADOUT BUILDER
        </motion.h1>
        <ErrorCard
          type="UNKNOWN_ERROR"
          title="Something Went Wrong"
          message={loadout.errorState.message || 'An unexpected error occurred.'}
          onRetry={() => window.location.reload()}
        />
      </div>
    );
  }

  return (
    <div className="bg-cod-black text-white p-6 max-w-3xl mx-auto">
      {/* Header with gradient text */}
      <motion.div
        className="mb-6 pb-4 border-b border-gray-700"
        {...(prefersReducedMotion ? {} : fadeInDown)}
      >
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold gradient-text-premium flex items-center gap-3">
            <Gamepad2 className="w-8 h-8 text-cod-orange" /> {loadout.name}
          </h1>
          <CopyWeaponButton weaponName={loadout.primary.weaponName} />
        </div>
        {loadout.difficulty && (
          <div className="flex items-center gap-2 text-sm mt-2">
            <span className="text-gray-400">Difficulty:</span>
            <span className="text-cod-orange font-mono text-lg tracking-wider">
              {getDifficultyStars(loadout.difficulty)}
            </span>
            <span className="text-gray-500">{loadout.difficulty}</span>
          </div>
        )}
      </motion.div>

      {/* Partial Load Warning - using enhanced styling */}
      {loadout.partialLoad && (
        <GlassCard
          variant="warning"
          className="mb-6"
          {...(prefersReducedMotion ? {} : { ...fadeInUp, transition: { delay: 0.1, ...transitions.normal } })}
          role="alert"
          aria-live="polite"
        >
          <div className="flex items-start gap-3">
            <Zap className="w-6 h-6 text-yellow-500 flex-shrink-0" />
            <div className="flex-1">
              <h3 className="text-yellow-400 font-semibold mb-1">
                Partial Data Loaded
              </h3>
              <p className="text-yellow-200/80 text-sm">
                {loadout.partialLoad.reason}
              </p>
              {loadout.partialLoad.missingData && loadout.partialLoad.missingData.length > 0 && (
                <p className="text-yellow-200/60 text-xs mt-2">
                  Missing: {loadout.partialLoad.missingData.join(', ')}
                </p>
              )}
            </div>
          </div>
        </GlassCard>
      )}

      {/* Primary Weapon with tooltips */}
      <GlassCard
        variant="primary"
        interactive
        className="mb-6"
        {...(prefersReducedMotion ? {} : {
          ...fadeInUp,
          transition: { delay: 0.15, ...transitions.normal },
          whileHover: { scale: 1.02, y: -5 },
          whileTap: { scale: 0.98 }
        })}
        tabIndex={0}
        role="article"
        aria-label={`Primary weapon: ${loadout.primary.weaponName}`}
      >
        <div className="flex items-center gap-2 mb-4 pb-3 border-b border-gray-700">
          <Crosshair className="w-6 h-6 text-cod-orange" />
          <div className="flex-1">
            <h2 className="text-xl font-bold text-white">
              {loadout.primary.weaponName}
            </h2>
            <p className="text-sm text-gray-400">{loadout.primary.category}</p>
          </div>
        </div>

        {/* Attachments with tooltips */}
        <div>
          <h3 className="text-xs uppercase tracking-wide text-cod-orange font-semibold mb-3">
            Attachments
          </h3>
          {loadout.primary.attachments && loadout.primary.attachments.length > 0 ? (
            <div className="grid grid-cols-1 gap-2">
              {loadout.primary.attachments.map((attachment, index) => (
                <AttachmentTooltip
                  key={index}
                  name={attachment.name}
                  slot={attachment.slot}
                  effect={`Improves ${attachment.slot.toLowerCase()} performance`}
                >
                  <motion.div
                    className="flex items-center gap-3 bg-cod-black/50 rounded px-3 py-2 cursor-help hover:bg-cod-black/70 transition-colors"
                    {...(prefersReducedMotion ? {} : {
                      ...createListItemVariants(index),
                      whileHover: { x: 5 }
                    })}
                    tabIndex={0}
                    role="listitem"
                  >
                    <span className="text-cod-orange font-semibold text-xs uppercase w-20">
                      {attachment.slot}
                    </span>
                    <span className="text-white text-sm flex-1">{attachment.name}</span>
                  </motion.div>
                </AttachmentTooltip>
              ))}
            </div>
          ) : (
            <div className="bg-cod-black/30 border border-gray-700 rounded-lg p-4 text-center">
              <p className="text-gray-500 text-sm">No attachments available</p>
            </div>
          )}
        </div>
      </GlassCard>

      {/* Secondary Weapon */}
      {loadout.secondary && (
        <GlassCard
          variant="secondary"
          interactive
          className="mb-6"
          {...(prefersReducedMotion ? {} : {
            ...fadeInUp,
            transition: { delay: 0.2, ...transitions.normal },
            whileHover: { scale: 1.02, y: -5 },
            whileTap: { scale: 0.98 }
          })}
          tabIndex={0}
          role="article"
          aria-label="Secondary weapon"
        >
          <div className="flex items-center gap-2 mb-3">
            <Crosshair className="w-5 h-5 text-cod-orange" />
            <div>
              <h2 className="text-lg font-bold text-white">
                {loadout.secondary.weaponName}
              </h2>
              <p className="text-xs text-gray-400">Secondary</p>
            </div>
          </div>
          {loadout.secondary.attachments && loadout.secondary.attachments.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-2">
              {loadout.secondary.attachments.map((att, index) => (
                <span
                  key={index}
                  className="px-2 py-1 bg-cod-black/50 text-xs text-gray-300 rounded hover:bg-cod-black/70 transition-colors"
                >
                  {att}
                </span>
              ))}
            </div>
          )}
        </GlassCard>
      )}

      {/* Perks & Equipment - keyboard navigable */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <GlassCard
          variant="accent"
          interactive
          hover={false}
          className="hover:border-purple-500/60 focus-ring"
          {...(prefersReducedMotion ? {} : {
            initial: { opacity: 0, x: -20 },
            animate: { opacity: 1, x: 0 },
            transition: { delay: 0.25, ...transitions.normal },
            whileHover: { scale: 1.02, y: -5 },
            whileTap: { scale: 0.98 }
          })}
          tabIndex={0}
          role="article"
          aria-label="Perks"
        >
          <h3 className="text-sm uppercase tracking-wide text-cod-orange font-semibold mb-3 flex items-center gap-2">
            <Zap className="w-4 h-4" /> Perks
          </h3>
          {loadout.perks && Object.keys(loadout.perks).length > 0 ? (
            <div className="space-y-2">
              {Object.entries(loadout.perks).map(([slot, perk], index) => (
                <div key={index} className="flex items-start gap-2">
                  <span className="text-cod-orange text-xs font-semibold w-16">
                    {slot}:
                  </span>
                  <span className="text-white text-sm flex-1">{perk}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-cod-black/30 border border-gray-700 rounded-lg p-4 text-center">
              <p className="text-gray-500 text-sm">No perks configured</p>
            </div>
          )}
        </GlassCard>

        <GlassCard
          variant="danger"
          interactive
          hover={false}
          className="hover:border-red-500/60 focus-ring"
          {...(prefersReducedMotion ? {} : {
            initial: { opacity: 0, x: 20 },
            animate: { opacity: 1, x: 0 },
            transition: { delay: 0.3, ...transitions.normal },
            whileHover: { scale: 1.02, y: -5 },
            whileTap: { scale: 0.98 }
          })}
          tabIndex={0}
          role="article"
          aria-label="Equipment"
        >
          <h3 className="text-sm uppercase tracking-wide text-cod-orange font-semibold mb-3 flex items-center gap-2">
            <Bomb className="w-4 h-4" /> Equipment
          </h3>
          {loadout.equipment && Object.keys(loadout.equipment).length > 0 ? (
            <div className="space-y-2">
              {Object.entries(loadout.equipment).map(([slot, item], index) => (
                <div key={index} className="flex items-start gap-2">
                  <span className="text-cod-orange text-xs font-semibold w-16">
                    {slot}:
                  </span>
                  <span className="text-white text-sm flex-1">{item}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-cod-black/30 border border-gray-700 rounded-lg p-4 text-center">
              <p className="text-gray-500 text-sm">No equipment configured</p>
            </div>
          )}
        </GlassCard>
      </div>

      {/* Final Stats with gradient text and tooltips */}
      {loadout.stats && (
        <GlassCard
          variant="primary"
          className="mb-6"
          {...(prefersReducedMotion ? {} : {
            ...fadeInUp,
            transition: { delay: 0.35, ...transitions.normal }
          })}
          role="region"
          aria-label="Final stats"
        >
          <h3 className="text-sm uppercase tracking-wide gradient-text-premium font-semibold mb-4 flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-cod-orange" /> Final Stats
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
            {getStatBar(loadout.stats.mobility, 'Mobility', 'Movement speed and agility')}
            {getStatBar(loadout.stats.control, 'Control', 'Recoil control and accuracy')}
            {getStatBar(loadout.stats.range, 'Range', 'Effective damage range')}
            {getStatBar(loadout.stats.damage, 'Damage', 'Damage output per shot')}
          </div>

          {(loadout.effectiveRange || loadout.difficulty) && (
            <div className="mt-4 pt-4 border-t border-gray-700 flex flex-wrap gap-4 text-sm">
              {loadout.effectiveRange && (
                <div>
                  <span className="text-gray-400">Effective Range:</span>
                  <span className="text-white ml-2 font-semibold gradient-text-premium">
                    {loadout.effectiveRange}
                  </span>
                </div>
              )}
            </div>
          )}
        </GlassCard>
      )}

      {/* Footer */}
      <GlassCard
        variant="secondary"
        hover={false}
        className="mt-6"
        {...(prefersReducedMotion ? {} : {
          initial: { opacity: 0 },
          animate: { opacity: 1 },
          transition: { delay: 0.4, ...transitions.normal }
        })}
      >
        <p className="text-xs text-gray-400 text-center flex items-center justify-center gap-2">
          <Zap className="w-3 h-3" /> Optimized for competitive play • Adjust to your playstyle
        </p>
      </GlassCard>
    </div>
  );
};

export default LoadoutCardEnhanced;
