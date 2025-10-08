import React, { useEffect, useState } from 'react';
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
        <div className="w-full bg-gray-700 rounded-full h-2">
          <div
            className="bg-gradient-to-r from-cod-orange to-yellow-500 h-2 rounded-full transition-all duration-500"
            style={{ width: `${percentage}%` }}
          />
        </div>
      </div>
    );
  };

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

  return (
    <div className="bg-cod-black text-white p-6 max-w-3xl mx-auto">
      {/* Header */}
      <div className="mb-6 pb-4 border-b border-gray-700">
        <h1 className="text-3xl font-bold text-cod-orange mb-2">
          🎮 {loadout.name}
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
      </div>

      {/* Primary Weapon */}
      <div className="mb-6 bg-cod-gray border border-cod-orange/30 rounded-lg p-5">
        <div className="flex items-center gap-2 mb-4 pb-3 border-b border-gray-700">
          <span className="text-2xl">🔫</span>
          <div>
            <h2 className="text-xl font-bold text-white">
              {loadout.primary.weaponName}
            </h2>
            <p className="text-sm text-gray-400">{loadout.primary.category}</p>
          </div>
        </div>

        {/* Attachments */}
        {loadout.primary.attachments && loadout.primary.attachments.length > 0 && (
          <div>
            <h3 className="text-xs uppercase tracking-wide text-cod-orange font-semibold mb-3">
              Attachments
            </h3>
            <div className="grid grid-cols-1 gap-2">
              {loadout.primary.attachments.map((attachment, index) => (
                <div
                  key={index}
                  className="flex items-center gap-3 bg-cod-black/50 rounded px-3 py-2"
                >
                  <span className="text-cod-orange font-semibold text-xs uppercase w-16">
                    {attachment.slot}
                  </span>
                  <span className="text-white text-sm">{attachment.name}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Secondary Weapon */}
      {loadout.secondary && (
        <div className="mb-6 bg-cod-gray border border-cod-orange/20 rounded-lg p-5">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-xl">🔫</span>
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
        </div>
      )}

      {/* Perks & Equipment */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        {/* Perks */}
        {loadout.perks && Object.keys(loadout.perks).length > 0 && (
          <div className="bg-cod-gray border border-cod-orange/20 rounded-lg p-4">
            <h3 className="text-sm uppercase tracking-wide text-cod-orange font-semibold mb-3 flex items-center gap-2">
              <span>⚡</span> Perks
            </h3>
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
          </div>
        )}

        {/* Equipment */}
        {loadout.equipment && Object.keys(loadout.equipment).length > 0 && (
          <div className="bg-cod-gray border border-cod-orange/20 rounded-lg p-4">
            <h3 className="text-sm uppercase tracking-wide text-cod-orange font-semibold mb-3 flex items-center gap-2">
              <span>💣</span> Equipment
            </h3>
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
          </div>
        )}
      </div>

      {/* Final Stats */}
      {loadout.stats && (
        <div className="bg-cod-gray border border-cod-orange/30 rounded-lg p-5">
          <h3 className="text-sm uppercase tracking-wide text-cod-orange font-semibold mb-4 flex items-center gap-2">
            <span>📊</span> Final Stats
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
        </div>
      )}

      {/* Footer */}
      <div className="mt-6 p-3 bg-cod-gray/50 border border-cod-orange/10 rounded-lg">
        <p className="text-xs text-gray-400 text-center">
          💡 Optimized for competitive play • Adjust to your playstyle
        </p>
      </div>
    </div>
  );
};

export default LoadoutCard;
