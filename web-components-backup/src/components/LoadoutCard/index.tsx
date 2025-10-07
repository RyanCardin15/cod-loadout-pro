import React, { useEffect, useState } from 'react';
import { useOpenAI } from '../../bridge/hooks';

export const LoadoutCard: React.FC = () => {
  const { toolOutput, callTool, theme } = useOpenAI();
  const [loadout, setLoadout] = useState<any>(null);
  const isDarkTheme = theme === 'dark' || theme === 'high_contrast';

  useEffect(() => {
    if (toolOutput?.structuredContent?.loadout) {
      setLoadout(toolOutput.structuredContent.loadout);
    }
  }, [toolOutput]);

  const handleSaveLoadout = async () => {
    const loadoutId = toolOutput?._meta?.loadoutId;
    await callTool('save_loadout', { loadoutId });
  };

  if (!loadout) return (
    <div className="flex items-center justify-center p-8">
      <div className="text-gray-500">Loading loadout...</div>
    </div>
  );

  return (
    <div className={`bg-gradient-to-br from-gray-900 to-gray-800 text-white rounded-lg p-6 max-w-2xl mx-auto border ${isDarkTheme ? 'border-orange-500' : 'border-gray-300'}`}>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-orange-500">{loadout.name}</h2>
        <button
          onClick={handleSaveLoadout}
          className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-md transition-colors flex items-center gap-2"
        >
          <span>⭐</span>
          Save Loadout
        </button>
      </div>

      <div className="mb-6">
        <h3 className="text-xl font-semibold">{loadout.primary.weaponName}</h3>
        <span className="text-blue-400">{loadout.primary.category}</span>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-gray-700 rounded-md p-3">
          <span className="text-blue-400 text-sm">Effective Range</span>
          <div className="text-lg font-semibold">{loadout.effectiveRange}</div>
        </div>
        <div className="bg-gray-700 rounded-md p-3">
          <span className="text-blue-400 text-sm">Difficulty</span>
          <div className="text-lg font-semibold">{loadout.difficulty}</div>
        </div>
      </div>
    </div>
  );
};
