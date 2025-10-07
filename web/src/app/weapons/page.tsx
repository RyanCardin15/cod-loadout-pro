'use client';

import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Crosshair, SlidersHorizontal } from 'lucide-react';
import { useWeapons, Weapon } from '@/hooks/useWeapons';
import { WeaponCard } from '@/components/shared/WeaponCard';
import { SearchBar } from '@/components/shared/SearchBar';
import { FilterPanel, FilterOptions } from '@/components/shared/FilterPanel';
import { StatBars } from '@/components/shared/StatBars';

export default function WeaponsPage() {
  const { weapons, loading, error } = useWeapons();
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState<FilterOptions>({
    games: [],
    categories: [],
    tiers: [],
    playstyles: [],
  });
  const [sortBy, setSortBy] = useState<'popularity' | 'tier' | 'name'>('popularity');
  const [selectedWeapon, setSelectedWeapon] = useState<Weapon | null>(null);

  // Filter and sort weapons
  const filteredWeapons = useMemo(() => {
    let result = weapons;

    // Apply search
    if (searchQuery) {
      result = result.filter((w) =>
        w.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Apply filters
    if (filters.games.length > 0) {
      result = result.filter((w) => filters.games.includes(w.game));
    }
    if (filters.categories.length > 0) {
      result = result.filter((w) => filters.categories.includes(w.category));
    }
    if (filters.tiers.length > 0) {
      result = result.filter((w) => filters.tiers.includes(w.meta.tier));
    }
    if (filters.playstyles.length > 0) {
      result = result.filter((w) =>
        w.playstyles.some((ps) => filters.playstyles.includes(ps))
      );
    }

    // Sort
    result.sort((a, b) => {
      if (sortBy === 'popularity') {
        return b.meta.popularity - a.meta.popularity;
      } else if (sortBy === 'tier') {
        const tierOrder = { S: 0, A: 1, B: 2, C: 3, D: 4 };
        return tierOrder[a.meta.tier] - tierOrder[b.meta.tier];
      } else {
        return a.name.localeCompare(b.name);
      }
    });

    return result;
  }, [weapons, searchQuery, filters, sortBy]);

  if (error) {
    return (
      <div className="min-h-screen bg-cod-black flex items-center justify-center p-4">
        <div className="glass-premium rounded-2xl p-8 max-w-md text-center">
          <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <Crosshair className="h-8 w-8 text-red-400" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Error Loading Weapons</h2>
          <p className="text-gray-400">{error.message}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cod-black pb-20 md:pb-8">
      {/* Header */}
      <div className="bg-gradient-to-b from-cod-gray to-cod-black border-b border-cod-surface">
        <div className="container mx-auto px-4 py-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center"
          >
            <h1 className="text-4xl lg:text-5xl font-display font-bold mb-4">
              <span className="gradient-text">Weapon Arsenal</span>
            </h1>
            <p className="text-xl text-gray-400 max-w-2xl mx-auto">
              Explore every weapon with detailed stats, meta rankings, and loadout recommendations
            </p>
          </motion.div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Search and Filters */}
        <div className="mb-8 space-y-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <SearchBar
                value={searchQuery}
                onChange={setSearchQuery}
                placeholder="Search weapons..."
              />
            </div>
            <div className="flex gap-2">
              <FilterPanel filters={filters} onFilterChange={setFilters} />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="px-4 py-2 bg-cod-surface border border-cod-gray rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-cod-orange"
              >
                <option value="popularity">Most Popular</option>
                <option value="tier">Tier Ranking</option>
                <option value="name">Alphabetical</option>
              </select>
            </div>
          </div>

          <div className="text-sm text-gray-400">
            Showing {filteredWeapons.length} of {weapons.length} weapons
          </div>
        </div>

        {/* Loading State */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="glass rounded-xl p-6 h-64 skeleton" />
            ))}
          </div>
        ) : (
          /* Weapons Grid */
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {filteredWeapons.map((weapon, index) => (
              <motion.div
                key={weapon.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <WeaponCard
                  weapon={weapon}
                  onClick={() => setSelectedWeapon(weapon)}
                />
              </motion.div>
            ))}
          </motion.div>
        )}

        {/* Empty State */}
        {!loading && filteredWeapons.length === 0 && (
          <div className="text-center py-16">
            <Crosshair className="h-16 w-16 text-gray-600 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-white mb-2">No weapons found</h3>
            <p className="text-gray-400">Try adjusting your search or filters</p>
          </div>
        )}
      </div>

      {/* Weapon Detail Modal */}
      {selectedWeapon && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          onClick={() => setSelectedWeapon(null)}
          className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            onClick={(e) => e.stopPropagation()}
            className="glass-premium rounded-2xl p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-cod-orange/30"
          >
            {/* Header */}
            <div className="flex items-start justify-between mb-6">
              <div>
                <h2 className="text-3xl font-display font-bold text-white mb-2">
                  {selectedWeapon.name}
                </h2>
                <div className="flex items-center gap-3">
                  <span className="text-cod-blue font-semibold">{selectedWeapon.category}</span>
                  <span className="text-gray-500">•</span>
                  <span className="text-gray-400">{selectedWeapon.game}</span>
                </div>
              </div>
              <button
                onClick={() => setSelectedWeapon(null)}
                className="text-gray-400 hover:text-white transition-colors"
              >
                ✕
              </button>
            </div>

            {/* Stats */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-white mb-4">Weapon Stats</h3>
              <StatBars stats={selectedWeapon.stats} />
            </div>

            {/* Ballistics */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-white mb-4">Ballistics</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-cod-surface/50 rounded-lg p-4">
                  <div className="text-sm text-gray-400 mb-1">Fire Rate</div>
                  <div className="text-lg font-bold text-white">
                    {selectedWeapon.ballistics.fireRate} RPM
                  </div>
                </div>
                <div className="bg-cod-surface/50 rounded-lg p-4">
                  <div className="text-sm text-gray-400 mb-1">Magazine</div>
                  <div className="text-lg font-bold text-white">
                    {selectedWeapon.ballistics.magazineSize} rounds
                  </div>
                </div>
                <div className="bg-cod-surface/50 rounded-lg p-4">
                  <div className="text-sm text-gray-400 mb-1">TTK (Min)</div>
                  <div className="text-lg font-bold text-cod-green">
                    {selectedWeapon.ballistics.ttk.min}s
                  </div>
                </div>
                <div className="bg-cod-surface/50 rounded-lg p-4">
                  <div className="text-sm text-gray-400 mb-1">ADS Time</div>
                  <div className="text-lg font-bold text-white">
                    {selectedWeapon.ballistics.adTime}s
                  </div>
                </div>
              </div>
            </div>

            {/* Meta Info */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-white mb-4">Meta Information</h3>
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-cod-surface/50 rounded-lg p-4 text-center">
                  <div className="text-sm text-gray-400 mb-1">Tier</div>
                  <div className="text-2xl font-bold text-cod-orange">
                    {selectedWeapon.meta.tier}
                  </div>
                </div>
                <div className="bg-cod-surface/50 rounded-lg p-4 text-center">
                  <div className="text-sm text-gray-400 mb-1">Pick Rate</div>
                  <div className="text-2xl font-bold text-white">
                    {selectedWeapon.meta.popularity}%
                  </div>
                </div>
                <div className="bg-cod-surface/50 rounded-lg p-4 text-center">
                  <div className="text-sm text-gray-400 mb-1">Win Rate</div>
                  <div className="text-2xl font-bold text-cod-green">
                    {selectedWeapon.meta.winRate}%
                  </div>
                </div>
              </div>
            </div>

            {/* Best For */}
            <div>
              <h3 className="text-lg font-semibold text-white mb-3">Best For</h3>
              <div className="flex flex-wrap gap-2">
                {selectedWeapon.bestFor.map((item) => (
                  <span
                    key={item}
                    className="px-3 py-1.5 bg-cod-orange/20 border border-cod-orange/50 rounded-lg text-cod-orange text-sm font-medium"
                  >
                    {item}
                  </span>
                ))}
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
}
