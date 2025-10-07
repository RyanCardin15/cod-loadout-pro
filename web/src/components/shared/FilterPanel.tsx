'use client';

import { useState } from 'react';
import { Filter, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils/cn';

export interface FilterOptions {
  games: string[];
  categories: string[];
  tiers: string[];
  playstyles: string[];
}

interface FilterPanelProps {
  filters: FilterOptions;
  onFilterChange: (filters: FilterOptions) => void;
  className?: string;
}

const GAMES = ['MW3', 'Warzone', 'BO6', 'MW2'];
const CATEGORIES = ['AR', 'SMG', 'LMG', 'Sniper', 'Marksman', 'Shotgun', 'Pistol'];
const TIERS = ['S', 'A', 'B', 'C', 'D'];
const PLAYSTYLES = ['Aggressive', 'Tactical', 'Sniper', 'Support'];

export function FilterPanel({ filters, onFilterChange, className }: FilterPanelProps) {
  const [isOpen, setIsOpen] = useState(false);

  const toggleFilter = (category: keyof FilterOptions, value: string) => {
    const current = filters[category];
    const updated = current.includes(value)
      ? current.filter((v) => v !== value)
      : [...current, value];

    onFilterChange({ ...filters, [category]: updated });
  };

  const clearAll = () => {
    onFilterChange({
      games: [],
      categories: [],
      tiers: [],
      playstyles: [],
    });
  };

  const activeCount =
    filters.games.length +
    filters.categories.length +
    filters.tiers.length +
    filters.playstyles.length;

  return (
    <div className={cn('relative', className)}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-4 py-2 bg-cod-surface border border-cod-gray rounded-lg text-white hover:bg-cod-gray transition-colors"
      >
        <Filter className="h-5 w-5" />
        <span>Filters</span>
        {activeCount > 0 && (
          <span className="px-2 py-0.5 bg-cod-orange rounded-full text-xs font-bold">
            {activeCount}
          </span>
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute top-full mt-2 right-0 w-80 glass-premium rounded-xl p-6 z-50 border border-cod-orange/30"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-display font-bold text-lg">Filters</h3>
              <button
                onClick={() => setIsOpen(false)}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4 max-h-96 overflow-y-auto">
              {/* Games */}
              <div>
                <h4 className="text-sm font-semibold text-cod-blue mb-2">Game</h4>
                <div className="flex flex-wrap gap-2">
                  {GAMES.map((game) => (
                    <button
                      key={game}
                      onClick={() => toggleFilter('games', game)}
                      className={cn(
                        'px-3 py-1.5 rounded-lg text-sm font-medium transition-all',
                        filters.games.includes(game)
                          ? 'bg-cod-orange text-white'
                          : 'bg-cod-surface text-gray-400 hover:text-white'
                      )}
                    >
                      {game}
                    </button>
                  ))}
                </div>
              </div>

              {/* Categories */}
              <div>
                <h4 className="text-sm font-semibold text-cod-blue mb-2">Category</h4>
                <div className="flex flex-wrap gap-2">
                  {CATEGORIES.map((cat) => (
                    <button
                      key={cat}
                      onClick={() => toggleFilter('categories', cat)}
                      className={cn(
                        'px-3 py-1.5 rounded-lg text-sm font-medium transition-all',
                        filters.categories.includes(cat)
                          ? 'bg-cod-orange text-white'
                          : 'bg-cod-surface text-gray-400 hover:text-white'
                      )}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              {/* Tiers */}
              <div>
                <h4 className="text-sm font-semibold text-cod-blue mb-2">Tier</h4>
                <div className="flex flex-wrap gap-2">
                  {TIERS.map((tier) => (
                    <button
                      key={tier}
                      onClick={() => toggleFilter('tiers', tier)}
                      className={cn(
                        'px-3 py-1.5 rounded-lg text-sm font-medium transition-all',
                        filters.tiers.includes(tier)
                          ? 'bg-cod-orange text-white'
                          : 'bg-cod-surface text-gray-400 hover:text-white'
                      )}
                    >
                      {tier}
                    </button>
                  ))}
                </div>
              </div>

              {/* Playstyles */}
              <div>
                <h4 className="text-sm font-semibold text-cod-blue mb-2">Playstyle</h4>
                <div className="flex flex-wrap gap-2">
                  {PLAYSTYLES.map((style) => (
                    <button
                      key={style}
                      onClick={() => toggleFilter('playstyles', style)}
                      className={cn(
                        'px-3 py-1.5 rounded-lg text-sm font-medium transition-all',
                        filters.playstyles.includes(style)
                          ? 'bg-cod-orange text-white'
                          : 'bg-cod-surface text-gray-400 hover:text-white'
                      )}
                    >
                      {style}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {activeCount > 0 && (
              <button
                onClick={clearAll}
                className="mt-4 w-full py-2 text-sm text-cod-orange hover:bg-cod-orange/10 rounded-lg transition-colors"
              >
                Clear All Filters
              </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
