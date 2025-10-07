'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, Search, Target, Zap, AlertCircle } from 'lucide-react';
import { useCounters } from '@/hooks/useCounters';
import { useWeapons } from '@/hooks/useWeapons';
import { SearchBar } from '@/components/shared/SearchBar';
import { EffectivenessBar } from '@/components/shared/EffectivenessBar';
import { TierBadge } from '@/components/shared/TierBadge';

export default function CountersPage() {
  const { weapons } = useWeapons();
  const { counterData, loading, analyzeCounter } = useCounters();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedWeaponId, setSelectedWeaponId] = useState<string | null>(null);

  const filteredWeapons = weapons.filter((w) =>
    w.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleWeaponSelect = async (weaponId: string) => {
    setSelectedWeaponId(weaponId);
    await analyzeCounter(weaponId);
  };

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
              <span className="gradient-text">Counter Strategies</span>
            </h1>
            <p className="text-xl text-gray-400 max-w-2xl mx-auto">
              Analyze enemy loadouts and discover the perfect counter weapons and tactics
            </p>
          </motion.div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Weapon Selector Sidebar */}
          <div className="lg:col-span-1">
            <div className="glass-premium rounded-xl p-6 border border-cod-orange/30 sticky top-24">
              <h2 className="text-xl font-display font-bold text-white mb-4 flex items-center gap-2">
                <Target className="h-5 w-5 text-cod-orange" />
                Select Enemy Weapon
              </h2>

              <SearchBar
                value={searchQuery}
                onChange={setSearchQuery}
                placeholder="Search weapons..."
                className="mb-4"
              />

              <div className="space-y-2 max-h-[600px] overflow-y-auto">
                {filteredWeapons.map((weapon) => (
                  <button
                    key={weapon.id}
                    onClick={() => handleWeaponSelect(weapon.id)}
                    className={`w-full text-left p-3 rounded-lg transition-all ${
                      selectedWeaponId === weapon.id
                        ? 'bg-cod-orange text-white'
                        : 'bg-cod-surface/50 hover:bg-cod-surface text-gray-300 hover:text-white'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-semibold">{weapon.name}</span>
                      <TierBadge tier={weapon.meta.tier} size="sm" />
                    </div>
                    <div className="text-xs opacity-75">
                      {weapon.category} • {weapon.game}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Counter Analysis */}
          <div className="lg:col-span-2">
            <AnimatePresence mode="wait">
              {!selectedWeaponId ? (
                <motion.div
                  key="empty"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex items-center justify-center h-full min-h-[400px]"
                >
                  <div className="text-center">
                    <Shield className="h-24 w-24 text-gray-600 mx-auto mb-6" />
                    <h3 className="text-2xl font-bold text-white mb-2">
                      Select a weapon to begin
                    </h3>
                    <p className="text-gray-400 max-w-md">
                      Choose an enemy weapon from the list to get counter recommendations and tactical advice
                    </p>
                  </div>
                </motion.div>
              ) : loading ? (
                <motion.div
                  key="loading"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="space-y-6"
                >
                  <div className="glass rounded-xl p-6 h-48 skeleton" />
                  <div className="glass rounded-xl p-6 h-64 skeleton" />
                  <div className="glass rounded-xl p-6 h-48 skeleton" />
                </motion.div>
              ) : counterData ? (
                <motion.div
                  key="data"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="space-y-6"
                >
                  {/* Enemy Analysis */}
                  <div className="glass-premium rounded-xl p-6 border border-cod-surface">
                    <h2 className="text-2xl font-display font-bold text-white mb-4">
                      Countering {counterData.enemyWeapon.name}
                    </h2>
                    <span className="text-cod-blue font-semibold">
                      {counterData.enemyWeapon.category}
                    </span>

                    <div className="grid md:grid-cols-2 gap-6 mt-6">
                      {/* Strengths */}
                      <div className="bg-cod-surface/30 rounded-lg p-4">
                        <h3 className="text-cod-green font-semibold mb-3 flex items-center gap-2">
                          <Zap className="h-4 w-4" />
                          Enemy Strengths
                        </h3>
                        <ul className="space-y-2">
                          {counterData.enemyWeapon.strengths.map((strength, i) => (
                            <li key={i} className="text-sm text-gray-300 flex items-start gap-2">
                              <span className="text-green-400 mt-0.5">+</span>
                              {strength}
                            </li>
                          ))}
                        </ul>
                      </div>

                      {/* Weaknesses */}
                      <div className="bg-cod-surface/30 rounded-lg p-4">
                        <h3 className="text-cod-orange font-semibold mb-3 flex items-center gap-2">
                          <AlertCircle className="h-4 w-4" />
                          Enemy Weaknesses
                        </h3>
                        <ul className="space-y-2">
                          {counterData.enemyWeapon.weaknesses.map((weakness, i) => (
                            <li key={i} className="text-sm text-gray-300 flex items-start gap-2">
                              <span className="text-red-400 mt-0.5">-</span>
                              {weakness}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>

                  {/* Counter Weapons */}
                  <div className="glass-premium rounded-xl p-6 border border-cod-surface">
                    <h3 className="text-xl font-display font-bold text-white mb-4 flex items-center gap-2">
                      <Target className="h-5 w-5 text-cod-blue" />
                      Best Counter Weapons
                    </h3>

                    <div className="space-y-4">
                      {counterData.counterWeapons.map((counter, i) => (
                        <motion.div
                          key={counter.weaponId}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: i * 0.1 }}
                          className="bg-cod-surface/50 hover:bg-cod-surface/70 rounded-lg p-5 transition-all cursor-pointer group"
                        >
                          <div className="flex items-start gap-4">
                            {/* Rank */}
                            <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-cod-orange/20 flex items-center justify-center">
                              <span className="text-cod-orange font-bold text-lg">#{i + 1}</span>
                            </div>

                            {/* Info */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between mb-2">
                                <div>
                                  <h4 className="font-semibold text-white group-hover:text-cod-orange transition-colors">
                                    {counter.weaponName}
                                  </h4>
                                  <span className="text-sm text-cod-blue">{counter.category}</span>
                                </div>
                              </div>

                              <EffectivenessBar value={counter.effectiveness} className="mb-3" />

                              <p className="text-sm text-gray-300 leading-relaxed">
                                {counter.reasoning}
                              </p>
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </div>

                  {/* Strategies & Tactics */}
                  <div className="grid md:grid-cols-2 gap-6">
                    {/* Counter Strategies */}
                    <div className="glass-premium rounded-xl p-6 border border-cod-surface">
                      <h3 className="text-lg font-display font-bold text-white mb-4 flex items-center gap-2">
                        <Shield className="h-5 w-5 text-cod-blue" />
                        Counter Strategies
                      </h3>
                      <ul className="space-y-3">
                        {counterData.strategies.map((strategy, i) => (
                          <motion.li
                            key={i}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: i * 0.05 }}
                            className="text-sm text-gray-300 flex items-start gap-2"
                          >
                            <span className="text-cod-green mt-1">🎯</span>
                            {strategy}
                          </motion.li>
                        ))}
                      </ul>
                    </div>

                    {/* Tactical Advice */}
                    <div className="glass-premium rounded-xl p-6 border border-cod-surface">
                      <h3 className="text-lg font-display font-bold text-white mb-4 flex items-center gap-2">
                        <Zap className="h-5 w-5 text-cod-orange" />
                        Tactical Advice
                      </h3>
                      <ul className="space-y-3">
                        {counterData.tacticalAdvice.map((advice, i) => (
                          <motion.li
                            key={i}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: i * 0.05 }}
                            className="text-sm text-gray-300 flex items-start gap-2"
                          >
                            <span className="text-cod-orange mt-1">💡</span>
                            {advice}
                          </motion.li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </motion.div>
              ) : null}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}
