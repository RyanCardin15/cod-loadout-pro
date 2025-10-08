import React, { useEffect, useState } from 'react';
import { MyLoadoutsData, BaseWidgetProps } from './types';

const MyLoadouts: React.FC<BaseWidgetProps<MyLoadoutsData>> = ({ toolOutput }) => {
  const [data, setData] = useState<MyLoadoutsData | null>(null);

  useEffect(() => {
    const openai = (window as any).openai;
    let rawData = toolOutput || openai?.toolOutput;
    const extractedData = rawData?.structuredContent || rawData;

    if (extractedData) {
      setData(extractedData);
    }
  }, [toolOutput]);

  if (!data) {
    return (
      <div className="bg-cod-black text-white p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-cod-gray rounded w-3/4 mb-4"></div>
          <div className="h-32 bg-cod-gray rounded"></div>
        </div>
      </div>
    );
  }

  // Empty state
  if (!data.loadouts || data.loadouts.length === 0) {
    return (
      <div className="bg-cod-black text-white p-6 max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold text-cod-orange mb-6">
          💾 MY SAVED LOADOUTS
        </h1>
        <div className="bg-cod-gray border border-cod-orange/30 rounded-lg p-12 text-center">
          <div className="text-6xl mb-4">📦</div>
          <h3 className="text-xl font-bold text-gray-300 mb-2">
            No saved loadouts yet
          </h3>
          <p className="text-gray-400 mb-6 max-w-md mx-auto">
            Try asking for a weapon loadout and save it to your favorites!
          </p>
          <div className="inline-block px-6 py-3 bg-cod-orange/20 border border-cod-orange/50 rounded-lg text-cod-orange font-semibold hover:bg-cod-orange/30 transition-colors cursor-pointer">
            Explore Meta Weapons →
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-cod-black text-white p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-6 pb-4 border-b border-gray-700">
        <h1 className="text-3xl font-bold text-cod-orange mb-2">
          💾 MY SAVED LOADOUTS
        </h1>
        <p className="text-gray-400">
          {data.count} saved loadout{data.count !== 1 ? 's' : ''}
        </p>
      </div>

      {/* Loadout Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {data.loadouts.map((loadout) => (
          <div
            key={loadout.id}
            className="bg-cod-gray border border-cod-orange/30 rounded-lg p-5 hover:bg-cod-gray/70 transition-all duration-200 hover:scale-[1.02] cursor-pointer"
          >
            {/* Loadout Header */}
            <div className="mb-4 pb-3 border-b border-gray-700">
              <div className="flex items-start justify-between mb-2">
                <h3 className="text-xl font-bold text-white flex items-center gap-2">
                  <span>⭐</span>
                  {loadout.name}
                </h3>
              </div>
              <div className="flex flex-wrap gap-2">
                <span className="px-2 py-1 bg-cod-black/50 text-xs text-cod-orange font-semibold rounded">
                  {loadout.game}
                </span>
                {loadout.playstyle && (
                  <span className="px-2 py-1 bg-cod-black/50 text-xs text-gray-400 rounded">
                    {loadout.playstyle}
                  </span>
                )}
              </div>
            </div>

            {/* Primary Weapon */}
            <div className="mb-4">
              <div className="text-xs text-gray-400 uppercase tracking-wide mb-1">
                Primary Weapon
              </div>
              <div className="text-white font-semibold flex items-center gap-2">
                <span>🔫</span>
                {loadout.primaryWeapon}
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between pt-3 border-t border-gray-700">
              <span className="text-xs text-gray-400">
                Created {new Date(loadout.createdAt).toLocaleDateString()}
              </span>
              <span className="text-cod-orange text-sm font-semibold hover:text-yellow-500 transition-colors">
                View Details →
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Add New Loadout CTA */}
      <div className="mt-6 p-5 bg-cod-gray/50 border border-cod-orange/20 rounded-lg text-center hover:bg-cod-gray/70 transition-colors cursor-pointer">
        <p className="text-gray-300 mb-2">
          ✨ Want to create a new loadout?
        </p>
        <p className="text-sm text-gray-400">
          Ask me for weapon recommendations or loadout suggestions
        </p>
      </div>
    </div>
  );
};

export default MyLoadouts;
