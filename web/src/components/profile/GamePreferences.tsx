'use client';

import { useState } from 'react';
import { useProfile, type UserProfile } from '@/hooks/useProfile';
import { Gamepad2, Save, Check, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface GamePreferencesProps {
  profile: UserProfile;
}

const games = [
  {
    id: 'MW3',
    name: 'Modern Warfare 3',
    shortName: 'MW3',
    color: 'from-green-500 to-emerald-600',
    icon: '🎯',
    description: 'Fast-paced tactical shooter'
  },
  {
    id: 'Warzone',
    name: 'Warzone',
    shortName: 'WZ',
    color: 'from-blue-500 to-cyan-600',
    icon: '🪂',
    description: 'Battle royale mayhem'
  },
  {
    id: 'BO6',
    name: 'Black Ops 6',
    shortName: 'BO6',
    color: 'from-orange-500 to-red-600',
    icon: '⚔️',
    description: 'Classic CoD action'
  },
  {
    id: 'MW2',
    name: 'Modern Warfare 2',
    shortName: 'MW2',
    color: 'from-purple-500 to-pink-600',
    icon: '🎮',
    description: 'Tactical warfare'
  },
];

export function GamePreferences({ profile }: GamePreferencesProps) {
  const { updateProfile, isUpdating } = useProfile();
  const [selectedGames, setSelectedGames] = useState<string[]>(profile.games);
  const [hoveredGame, setHoveredGame] = useState<string | null>(null);

  const toggleGame = (gameId: string) => {
    if (selectedGames.includes(gameId)) {
      setSelectedGames(selectedGames.filter((id) => id !== gameId));
    } else {
      setSelectedGames([...selectedGames, gameId]);
    }
  };

  const handleSave = () => {
    updateProfile({ games: selectedGames });
  };

  const hasChanges = JSON.stringify(selectedGames.sort()) !== JSON.stringify(profile.games.sort());

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-premium rounded-2xl p-6 space-y-6"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cod-accent to-cod-blue flex items-center justify-center">
            <Gamepad2 className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold font-rajdhani">Games</h2>
            <p className="text-xs text-gray-400">
              {selectedGames.length} game{selectedGames.length !== 1 ? 's' : ''} selected
            </p>
          </div>
        </div>

        <AnimatePresence>
          {hasChanges && (
            <motion.button
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              onClick={handleSave}
              disabled={isUpdating}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-cod-accent to-cod-blue hover:from-cod-accent-dark hover:to-cod-blue-dark rounded-xl text-sm font-semibold transition-all disabled:opacity-50 shadow-lg hover:shadow-xl"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Save className="w-4 h-4" />
              {isUpdating ? 'Saving...' : 'Save'}
            </motion.button>
          )}
        </AnimatePresence>
      </div>

      {/* Description */}
      <p className="text-sm text-gray-400 flex items-center gap-2">
        <Sparkles className="w-4 h-4 text-cod-accent" />
        Select the games you play to personalize your experience
      </p>

      {/* Game Grid */}
      <div className="grid grid-cols-2 gap-4">
        {games.map((game, index) => {
          const isSelected = selectedGames.includes(game.id);
          const isHovered = hoveredGame === game.id;

          return (
            <motion.button
              key={game.id}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.1 }}
              onClick={() => toggleGame(game.id)}
              onMouseEnter={() => setHoveredGame(game.id)}
              onMouseLeave={() => setHoveredGame(null)}
              whileHover={{ scale: 1.05, y: -5 }}
              whileTap={{ scale: 0.95 }}
              className="relative group"
            >
              {/* Glow Effect */}
              {isSelected && (
                <motion.div
                  className={`absolute -inset-1 bg-gradient-to-br ${game.color} opacity-50 blur-lg rounded-2xl`}
                  animate={{
                    opacity: [0.3, 0.6, 0.3],
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                  }}
                />
              )}

              {/* Card */}
              <div
                className={`
                  relative overflow-hidden rounded-2xl p-6 transition-all duration-300
                  ${
                    isSelected
                      ? 'bg-gradient-to-br ' + game.color + ' shadow-xl'
                      : 'glass opacity-60 hover:opacity-100'
                  }
                `}
              >
                {/* Background Pattern */}
                <div className="absolute inset-0 opacity-10">
                  <div className="absolute inset-0 bg-[linear-gradient(45deg,transparent_25%,rgba(255,255,255,0.1)_50%,transparent_75%)] bg-[length:20px_20px]" />
                </div>

                {/* Content */}
                <div className="relative z-10 text-center space-y-3">
                  {/* Icon */}
                  <motion.div
                    animate={isSelected ? { rotate: [0, 360] } : {}}
                    transition={{ duration: 0.5 }}
                    className="text-4xl mb-2"
                  >
                    {game.icon}
                  </motion.div>

                  {/* Name */}
                  <div>
                    <p className={`font-bold text-lg ${isSelected ? 'text-white' : 'text-gray-300'}`}>
                      {game.shortName}
                    </p>
                    <p className={`text-xs ${isSelected ? 'text-white/80' : 'text-gray-500'}`}>
                      {game.description}
                    </p>
                  </div>

                  {/* Selection Indicator */}
                  <AnimatePresence>
                    {isSelected && (
                      <motion.div
                        initial={{ scale: 0, rotate: -180 }}
                        animate={{ scale: 1, rotate: 0 }}
                        exit={{ scale: 0, rotate: 180 }}
                        className="absolute top-3 right-3 w-7 h-7 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center border-2 border-white/30"
                      >
                        <Check className="w-4 h-4 text-white" />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Shimmer Effect on Hover */}
                {isHovered && !isSelected && (
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent"
                    initial={{ x: '-100%' }}
                    animate={{ x: '100%' }}
                    transition={{ duration: 0.6 }}
                  />
                )}
              </div>
            </motion.button>
          );
        })}
      </div>

      {/* Stats Footer */}
      <div className="pt-4 border-t border-white/10">
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-400">Active Games</span>
          <div className="flex items-center gap-2">
            {selectedGames.length > 0 ? (
              selectedGames.map((gameId) => {
                const game = games.find((g) => g.id === gameId);
                return (
                  <motion.span
                    key={gameId}
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className={`px-3 py-1 rounded-full bg-gradient-to-r ${game?.color} text-white text-xs font-semibold`}
                  >
                    {game?.shortName}
                  </motion.span>
                );
              })
            ) : (
              <span className="text-gray-500 text-xs">No games selected</span>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
