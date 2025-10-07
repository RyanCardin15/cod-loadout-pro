import React, { useEffect, useState } from 'react';
import { useOpenAI } from '../../bridge/hooks';

export const MyLoadouts: React.FC = () => {
  const { toolOutput, callTool, theme } = useOpenAI();
  const [loadouts, setLoadouts] = useState<any[]>([]);

  useEffect(() => {
    if (toolOutput?.structuredContent?.loadouts) {
      setLoadouts(toolOutput.structuredContent.loadouts);
    }
  }, [toolOutput]);

  const handleLoadoutClick = async (loadoutId: string) => {
    await callTool('get_loadout', { loadoutId });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const getPlaystyleColor = (playstyle: string) => {
    const colors: Record<string, string> = {
      Aggressive: 'text-red-400',
      Tactical: 'text-blue-400',
      Sniper: 'text-green-400',
      Support: 'text-yellow-400'
    };
    return colors[playstyle] || 'text-gray-400';
  };

  const getPlaystyleIcon = (playstyle: string) => {
    const icons: Record<string, string> = {
      Aggressive: '⚡',
      Tactical: '🎯',
      Sniper: '🔭',
      Support: '🛡️'
    };
    return icons[playstyle] || '⚙️';
  };

  if (loadouts.length === 0) {
    return (
      <div className={`my-loadouts bg-gradient-to-br from-cod-black to-cod-gray text-white rounded-lg p-6 max-w-4xl mx-auto ${theme === 'dark' ? 'border-cod-orange' : 'border-gray-300'} border`}>
        <h2 className="text-2xl font-cod font-bold text-cod-orange mb-6">My Saved Loadouts</h2>
        <div className="text-center py-12">
          <div className="text-6xl mb-4">📦</div>
          <h3 className="text-xl text-gray-300 mb-2">No Saved Loadouts</h3>
          <p className="text-gray-400">
            You haven't saved any loadouts yet. Try asking for a weapon loadout and save it!
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={`my-loadouts bg-gradient-to-br from-cod-black to-cod-gray text-white rounded-lg p-6 max-w-4xl mx-auto ${theme === 'dark' ? 'border-cod-orange' : 'border-gray-300'} border`}>
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-cod font-bold text-cod-orange">My Saved Loadouts</h2>
        <span className="text-cod-blue">
          {loadouts.length} loadout{loadouts.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Loadouts Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {loadouts.map((loadout) => (
          <div
            key={loadout.id}
            className="bg-cod-gray/50 hover:bg-cod-gray/70 rounded-lg p-4 cursor-pointer transition-all duration-200 hover:scale-105"
            onClick={() => handleLoadoutClick(loadout.id)}
          >
            {/* Loadout Header */}
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-lg truncate">{loadout.name}</h3>
              <span className={`text-lg ${getPlaystyleColor(loadout.playstyle)}`}>
                {getPlaystyleIcon(loadout.playstyle)}
              </span>
            </div>

            {/* Primary Weapon */}
            <div className="mb-3">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-cod-green text-sm">🔫</span>
                <span className="font-medium">{loadout.primaryWeapon}</span>
              </div>
              <span className="text-cod-blue text-sm">{loadout.game}</span>
            </div>

            {/* Playstyle & Date */}
            <div className="flex justify-between items-center text-sm">
              <span className={`${getPlaystyleColor(loadout.playstyle)} font-medium`}>
                {loadout.playstyle}
              </span>
              <span className="text-gray-400">
                {loadout.createdAt ? formatDate(loadout.createdAt) : 'Recently'}
              </span>
            </div>

            {/* Hover Indicator */}
            <div className="mt-3 text-center">
              <span className="text-cod-orange text-xs opacity-0 group-hover:opacity-100 transition-opacity">
                Click to view details
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="mt-6 pt-4 border-t border-cod-gray text-center">
        <p className="text-gray-400 text-sm">
          Click any loadout to view details or ask me to build a new loadout based on one of these.
        </p>
      </div>
    </div>
  );
};