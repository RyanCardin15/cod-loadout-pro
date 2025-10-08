import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Gamepad2, Crosshair, Zap, Bomb, BarChart3, Search, AlertTriangle, XCircle } from 'lucide-react';
import { LoadoutData, BaseWidgetProps } from './types';

const LoadoutCard: React.FC<BaseWidgetProps<LoadoutData>> = ({ toolOutput }) => {
  const [loadout, setLoadout] = useState<LoadoutData['loadout'] | null>(null);

  useEffect(() => {
    const openai = (window as any).openai;
    let rawData = toolOutput || openai?.toolOutput;
    const data = rawData?.structuredContent || rawData;

    if (data?.loadout) {
      setLoadout(data.loadout);
    }
  }, [toolOutput]);

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

  const getStatBar = (value: number, label: string, maxWidth: boolean = false) => {
    const percentage = Math.min(value, 100);
    return (
      <div className={maxWidth ? '' : 'flex-1'}>
        <div className="flex justify-between text-xs mb-1.5">
          <span className="text-gray-400 uppercase tracking-wide font-medium">{label}</span>
          <span className="text-cod-orange font-bold">{value}</span>
        </div>
        <div className="w-full bg-gray-700 rounded-full h-2 relative overflow-hidden">
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
  if (!loadout) {
    return (
      <div className="bg-cod-black text-white p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-cod-gray rounded w-3/4 mb-4"></div>
          <div className="h-32 bg-cod-gray rounded"></div>
        </div>
      </div>
    );
  }

  // Empty state - weapon not found
  if (loadout.isEmpty && loadout.errorState?.type === 'WEAPON_NOT_FOUND') {
    return (
      <div className="bg-cod-black text-white p-6 max-w-3xl mx-auto">
        <motion.h1
          className="text-3xl font-bold text-cod-orange mb-6 flex items-center gap-3"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Gamepad2 className="w-8 h-8" /> LOADOUT BUILDER
        </motion.h1>
        <motion.div
          className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-2xl border border-white/20 shadow-2xl rounded-xl p-12 text-center hover:border-cod-orange transition-all duration-300"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
        >
          <Search className="w-16 h-16 mx-auto mb-4 text-gray-400" />
          <h3 className="text-xl font-bold text-gray-300 mb-2">
            Weapon Not Found
          </h3>
          <p className="text-gray-400 mb-6 max-w-md mx-auto">
            {loadout.errorState.message}
          </p>
          {loadout.errorState.suggestions && loadout.errorState.suggestions.length > 0 && (
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
                {loadout.errorState.suggestions.map((suggestion, idx) => (
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

  // Empty state - Firebase connection error
  if (loadout.isEmpty && loadout.errorState?.type === 'FIREBASE_CONNECTION_ERROR') {
    return (
      <div className="bg-cod-black text-white p-6 max-w-3xl mx-auto">
        <motion.h1
          className="text-3xl font-bold text-cod-orange mb-6 flex items-center gap-3"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Gamepad2 className="w-8 h-8" /> LOADOUT BUILDER
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
            {loadout.errorState.message}
          </p>
          <div className="inline-block px-6 py-3 bg-cod-orange/20 border border-cod-orange/50 rounded-lg text-cod-orange font-semibold hover:bg-cod-orange/30 transition-colors cursor-pointer">
            Try Again
          </div>
        </motion.div>
      </div>
    );
  }

  // Empty state - unknown error
  if (loadout.isEmpty && loadout.errorState) {
    return (
      <div className="bg-cod-black text-white p-6 max-w-3xl mx-auto">
        <motion.h1
          className="text-3xl font-bold text-cod-orange mb-6 flex items-center gap-3"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Gamepad2 className="w-8 h-8" /> LOADOUT BUILDER
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
            {loadout.errorState.message}
          </p>
          <p className="text-gray-500 text-sm">
            Please try again or contact support if the issue persists.
          </p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="bg-cod-black text-white p-6 max-w-3xl mx-auto">
      {/* Header */}
      <motion.div
        className="mb-6 pb-4 border-b border-gray-700"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="text-3xl font-bold text-cod-orange mb-2 flex items-center gap-3">
          <Gamepad2 className="w-8 h-8" /> {loadout.name}
        </h1>
        {loadout.difficulty && (
          <div className="flex items-center gap-2 text-sm">
            <span className="text-gray-400">Difficulty:</span>
            <span className="text-cod-orange font-mono text-lg tracking-wider">
              {getDifficultyStars(loadout.difficulty)}
            </span>
            <span className="text-gray-500">{loadout.difficulty}</span>
          </div>
        )}
      </motion.div>

      {/* Partial Load Warning Banner */}
      {loadout.partialLoad && (
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
                {loadout.partialLoad.reason}
              </p>
              {loadout.partialLoad.missingData && loadout.partialLoad.missingData.length > 0 && (
                <p className="text-yellow-200/60 text-xs mt-2">
                  Missing: {loadout.partialLoad.missingData.join(', ')}
                </p>
              )}
            </div>
          </div>
        </motion.div>
      )}

      {/* Primary Weapon */}
      <motion.div
        className="mb-6 bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-2xl border border-white/20 shadow-2xl rounded-xl p-6 hover:border-cod-orange transition-all duration-300"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        whileHover={{ scale: 1.02, y: -5 }}
      >
        <div className="flex items-center gap-2 mb-4 pb-3 border-b border-gray-700">
          <Crosshair className="w-6 h-6 text-cod-orange" />
          <div>
            <h2 className="text-xl font-bold text-white">
              {loadout.primary.weaponName}
            </h2>
            <p className="text-sm text-gray-400">{loadout.primary.category}</p>
          </div>
        </div>

        {/* Attachments */}
        <div>
          <h3 className="text-xs uppercase tracking-wide text-cod-orange font-semibold mb-3">
            Attachments
          </h3>
          {loadout.primary.attachments && loadout.primary.attachments.length > 0 ? (
            <div className="grid grid-cols-1 gap-2">
              {loadout.primary.attachments.map((attachment, index) => (
                <motion.div
                  key={index}
                  className="flex items-center gap-3 bg-cod-black/50 rounded px-3 py-2"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.05 * index }}
                  whileHover={{ x: 5 }}
                >
                  <span className="text-cod-orange font-semibold text-xs uppercase w-16">
                    {attachment.slot}
                  </span>
                  <span className="text-white text-sm">{attachment.name}</span>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="bg-cod-black/30 border border-gray-700 rounded-lg p-4 text-center">
              <p className="text-gray-500 text-sm">No attachments available</p>
            </div>
          )}
        </div>
      </motion.div>

      {/* Secondary Weapon */}
      {loadout.secondary && (
        <motion.div
          className="mb-6 bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-2xl border border-white/20 shadow-2xl rounded-xl p-6 hover:border-cod-orange/60 transition-all duration-300"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          whileHover={{ scale: 1.02, y: -5 }}
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
                  className="px-2 py-1 bg-cod-black/50 text-xs text-gray-300 rounded"
                >
                  {att}
                </span>
              ))}
            </div>
          )}
        </motion.div>
      )}

      {/* Perks & Equipment */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        {/* Perks */}
        <motion.div
          className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-2xl border border-white/20 shadow-2xl rounded-xl p-6 hover:border-purple-500/60 transition-all duration-300"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.25 }}
          whileHover={{ scale: 1.02, y: -5 }}
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
        </motion.div>

        {/* Equipment */}
        <motion.div
          className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-2xl border border-white/20 shadow-2xl rounded-xl p-6 hover:border-red-500/60 transition-all duration-300"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
          whileHover={{ scale: 1.02, y: -5 }}
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
        </motion.div>
      </div>

      {/* Final Stats */}
      {loadout.stats && (
        <motion.div
          className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-2xl border border-white/20 shadow-2xl rounded-xl p-6 hover:border-cod-orange transition-all duration-300"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
        >
          <h3 className="text-sm uppercase tracking-wide text-cod-orange font-semibold mb-4 flex items-center gap-2">
            <BarChart3 className="w-4 h-4" /> Final Stats
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
            {getStatBar(loadout.stats.mobility, 'Mobility', true)}
            {getStatBar(loadout.stats.control, 'Control', true)}
            {getStatBar(loadout.stats.range, 'Range', true)}
            {getStatBar(loadout.stats.damage, 'Damage', true)}
          </div>

          {/* Additional Info */}
          {(loadout.effectiveRange || loadout.difficulty) && (
            <div className="mt-4 pt-4 border-t border-gray-700 flex flex-wrap gap-4 text-sm">
              {loadout.effectiveRange && (
                <div>
                  <span className="text-gray-400">Effective Range:</span>
                  <span className="text-white ml-2 font-semibold">
                    {loadout.effectiveRange}
                  </span>
                </div>
              )}
            </div>
          )}
        </motion.div>
      )}

      {/* Footer */}
      <motion.div
        className="mt-6 p-3 bg-gradient-to-br from-white/5 to-white/0 backdrop-blur-xl border border-white/10 shadow-xl rounded-lg"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
      >
        <p className="text-xs text-gray-400 text-center flex items-center justify-center gap-2">
          <Zap className="w-3 h-3" /> Optimized for competitive play • Adjust to your playstyle
        </p>
      </motion.div>
    </div>
  );
};

export default LoadoutCard;
