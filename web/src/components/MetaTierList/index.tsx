import React, { useEffect, useState } from 'react';
import { useOpenAI } from '../../bridge/hooks';

export const MetaTierList: React.FC = () => {
  const { toolOutput, callTool, theme } = useOpenAI();
  const [tiers, setTiers] = useState<any>(null);

  useEffect(() => {
    if (toolOutput?.structuredContent?.tiers) {
      setTiers(toolOutput.structuredContent.tiers);
    }
  }, [toolOutput]);

  const handleWeaponClick = async (weaponId: string) => {
    await callTool('get_loadout', { weaponId });
  };

  const tierColors = {
    S: 'from-red-600 to-red-400',
    A: 'from-orange-600 to-orange-400',
    B: 'from-yellow-600 to-yellow-400',
    C: 'from-green-600 to-green-400',
    D: 'from-blue-600 to-blue-400'
  };

  const tierTextColors = {
    S: 'text-red-400',
    A: 'text-orange-400',
    B: 'text-yellow-400',
    C: 'text-green-400',
    D: 'text-blue-400'
  };

  if (!tiers) return (
    <div className="flex items-center justify-center p-8">
      <div className="text-gray-500">Loading meta...</div>
    </div>
  );

  return (
    <div className={`meta-tier-list bg-gradient-to-br from-cod-black to-cod-gray text-white rounded-lg p-6 max-w-4xl mx-auto ${theme === 'dark' ? 'border-cod-orange' : 'border-gray-300'} border`}>
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-cod font-bold text-cod-orange">Current Meta Tier List</h2>
        <span className="text-cod-blue text-sm">
          Updated: {toolOutput.structuredContent.lastUpdated ? new Date(toolOutput.structuredContent.lastUpdated).toLocaleDateString() : 'Recently'}
        </span>
      </div>

      {/* Tier Lists */}
      {Object.entries(tiers).map(([tier, weapons]: [string, any]) => (
        <div key={tier} className="mb-6">
          <div className="flex items-center gap-4 mb-3">
            <div className={`w-12 h-12 rounded-lg bg-gradient-to-br ${tierColors[tier as keyof typeof tierColors]} flex items-center justify-center`}>
              <span className="text-white font-bold text-xl">{tier}</span>
            </div>
            <h3 className={`text-xl font-semibold ${tierTextColors[tier as keyof typeof tierTextColors]}`}>
              {tier}-Tier ({weapons.length} weapons)
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 ml-16">
            {weapons.map((weapon: any) => (
              <div
                key={weapon.id}
                className="bg-cod-gray/50 hover:bg-cod-gray/70 rounded-md p-3 cursor-pointer transition-colors"
                onClick={() => handleWeaponClick(weapon.id)}
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium">{weapon.name}</span>
                  <span className="text-cod-blue text-sm">{weapon.usage}% pick rate</span>
                </div>
              </div>
            ))}
            {weapons.length === 0 && (
              <div className="text-gray-400 text-sm italic col-span-full">No weapons in this tier</div>
            )}
          </div>
        </div>
      ))}

      {/* Recent Changes */}
      {toolOutput.structuredContent.recentChanges?.length > 0 && (
        <div className="mt-8 pt-6 border-t border-cod-gray">
          <h3 className="text-lg font-semibold text-cod-blue mb-3">Recent Changes</h3>
          <ul className="space-y-2">
            {toolOutput.structuredContent.recentChanges.map((change: string, i: number) => (
              <li key={i} className="text-gray-300 text-sm flex items-start gap-2">
                <span className="text-cod-green mt-1">•</span>
                {change}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};