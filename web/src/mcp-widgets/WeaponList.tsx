import React, { useEffect, useState } from 'react';
import { WeaponListData, Weapon, BaseWidgetProps } from './types';

const WeaponList: React.FC<BaseWidgetProps<WeaponListData>> = ({ toolOutput }) => {
  const [weapons, setWeapons] = useState<Weapon[]>([]);
  const [filters, setFilters] = useState<Record<string, string>>({});

  useEffect(() => {
    const openai = (window as any).openai;
    let rawData = toolOutput || openai?.toolOutput;
    const data = rawData?.structuredContent || rawData;

    if (data?.weapons) {
      setWeapons(data.weapons);
      setFilters(data.filters || {});
    }
  }, [toolOutput]);

  const getTierColor = (tier?: string): string => {
    switch (tier) {
      case 'S': return 'bg-yellow-500 text-black';
      case 'A': return 'bg-green-500 text-white';
      case 'B': return 'bg-blue-500 text-white';
      case 'C': return 'bg-purple-500 text-white';
      case 'D': return 'bg-gray-500 text-white';
      default: return 'bg-gray-600 text-white';
    }
  };

  const getStatBar = (value: number, label: string) => {
    const percentage = Math.min(value, 100);
    return (
      <div className="mb-2">
        <div className="flex justify-between text-xs mb-1">
          <span className="text-gray-400 uppercase tracking-wide">{label}</span>
          <span className="text-cod-orange font-semibold">{value}</span>
        </div>
        <div className="w-full bg-gray-700 rounded-full h-1.5">
          <div
            className="bg-gradient-to-r from-cod-orange to-yellow-500 h-1.5 rounded-full transition-all duration-500"
            style={{ width: `${percentage}%` }}
          />
        </div>
      </div>
    );
  };

  if (weapons.length === 0) {
    return (
      <div className="bg-cod-black text-white p-6 max-w-4xl mx-auto">
        <div className="bg-cod-gray border border-cod-orange/30 rounded-lg p-8 text-center">
          <p className="text-gray-400 text-lg mb-2">🔫 No weapons found</p>
          <p className="text-gray-500 text-sm">Try adjusting your search filters</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-cod-black text-white p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-cod-orange mb-2">
          🔫 TOP {weapons.length} WEAPONS
        </h1>
        {Object.keys(filters).length > 0 && (
          <div className="flex gap-2 flex-wrap">
            {filters['game'] && filters['game'] !== 'all' && (
              <span className="px-3 py-1 bg-cod-gray border border-cod-orange/30 rounded-full text-xs text-gray-300">
                {filters['game']}
              </span>
            )}
            {filters['category'] && filters['category'] !== 'all' && (
              <span className="px-3 py-1 bg-cod-gray border border-cod-orange/30 rounded-full text-xs text-gray-300">
                {filters['category']}
              </span>
            )}
            {filters['situation'] && (
              <span className="px-3 py-1 bg-cod-gray border border-cod-orange/30 rounded-full text-xs text-gray-300">
                {filters['situation']}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Weapon Cards */}
      <div className="space-y-4">
        {weapons.map((weapon, index) => (
          <div
            key={weapon.id}
            className="bg-cod-gray border border-cod-orange/30 rounded-lg p-5 hover:bg-cod-gray/70 transition-all duration-200 hover:scale-[1.02]"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-1">
                  <span className="text-cod-orange font-bold text-lg">
                    #{index + 1}
                  </span>
                  <h3 className="text-white font-bold text-xl">
                    {weapon.name}
                  </h3>
                  {weapon.tier && (
                    <span className={`${getTierColor(weapon.tier)} px-2.5 py-0.5 rounded text-xs font-bold uppercase tracking-wider`}>
                      {weapon.tier}-TIER
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-3 text-sm text-gray-400">
                  <span>{weapon.category}</span>
                  {weapon.game && (
                    <>
                      <span>•</span>
                      <span>{weapon.game}</span>
                    </>
                  )}
                  {weapon.popularity !== undefined && (
                    <>
                      <span>•</span>
                      <span className="text-cod-orange font-semibold">
                        {weapon.popularity.toFixed(1)}% Pick Rate
                      </span>
                    </>
                  )}
                </div>
              </div>

              {weapon.ttk && (
                <div className="text-right ml-4">
                  <div className="text-xs text-gray-400 uppercase tracking-wide">TTK</div>
                  <div className="text-2xl font-bold text-cod-orange">
                    {weapon.ttk}
                    <span className="text-xs text-gray-400 ml-1">ms</span>
                  </div>
                </div>
              )}
            </div>

            {/* Stats Section */}
            {weapon.stats && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t border-gray-700">
                {getStatBar(weapon.stats.damage, 'DMG')}
                {getStatBar(weapon.stats.range, 'RNG')}
                {getStatBar(weapon.stats.mobility, 'MOB')}
                {getStatBar(weapon.stats.control, 'CTL')}
              </div>
            )}

            {/* Popularity Bar */}
            {weapon.popularity !== undefined && (
              <div className="mt-4 pt-4 border-t border-gray-700">
                <div className="flex justify-between text-xs mb-2">
                  <span className="text-gray-400">Popularity</span>
                  <span className="text-cod-orange font-semibold">{weapon.popularity.toFixed(1)}%</span>
                </div>
                <div className="w-full bg-gray-700 rounded-full h-2">
                  <div
                    className="bg-gradient-to-r from-cod-orange to-yellow-500 h-2 rounded-full"
                    style={{ width: `${Math.min(weapon.popularity, 100)}%` }}
                  />
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Footer Note */}
      <div className="mt-6 p-4 bg-cod-gray/50 border border-cod-orange/20 rounded-lg">
        <p className="text-xs text-gray-400 text-center">
          💡 Stats based on competitive meta and community data
        </p>
      </div>
    </div>
  );
};

export default WeaponList;
