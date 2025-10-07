import React, { useEffect, useState } from 'react';
import { useOpenAI } from '../../bridge/hooks';

export const CounterSuggestions: React.FC = () => {
  const { toolOutput, callTool, theme } = useOpenAI();
  const [counterData, setCounterData] = useState<any>(null);

  useEffect(() => {
    if (toolOutput?.structuredContent) {
      setCounterData(toolOutput.structuredContent);
    }
  }, [toolOutput]);

  const handleWeaponClick = async (weaponId: string) => {
    await callTool('get_loadout', { weaponId });
  };

  const getEffectivenessColor = (effectiveness: number) => {
    if (effectiveness >= 80) return 'text-green-400';
    if (effectiveness >= 60) return 'text-yellow-400';
    if (effectiveness >= 40) return 'text-orange-400';
    return 'text-red-400';
  };

  const getEffectivenessBar = (effectiveness: number) => {
    if (effectiveness >= 80) return 'bg-green-500';
    if (effectiveness >= 60) return 'bg-yellow-500';
    if (effectiveness >= 40) return 'bg-orange-500';
    return 'bg-red-500';
  };

  if (!counterData) return (
    <div className="flex items-center justify-center p-8">
      <div className="text-gray-500">Loading counter strategies...</div>
    </div>
  );

  return (
    <div className={`counter-suggestions bg-gradient-to-br from-cod-black to-cod-gray text-white rounded-lg p-6 max-w-4xl mx-auto ${theme === 'dark' ? 'border-cod-orange' : 'border-gray-300'} border`}>
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-2xl font-cod font-bold text-cod-orange mb-2">
          Countering {counterData.enemyWeapon?.name}
        </h2>
        <div className="text-cod-blue">{counterData.enemyWeapon?.category}</div>
      </div>

      {/* Enemy Analysis */}
      <div className="grid md:grid-cols-2 gap-4 mb-6">
        <div className="bg-cod-gray/30 rounded-lg p-4">
          <h3 className="text-cod-green font-semibold mb-2">Enemy Strengths</h3>
          <ul className="space-y-1">
            {counterData.enemyWeapon?.strengths?.map((strength: string, i: number) => (
              <li key={i} className="text-sm text-gray-300 flex items-start gap-2">
                <span className="text-green-400 mt-1">+</span>
                {strength}
              </li>
            ))}
          </ul>
        </div>

        <div className="bg-cod-gray/30 rounded-lg p-4">
          <h3 className="text-cod-orange font-semibold mb-2">Enemy Weaknesses</h3>
          <ul className="space-y-1">
            {counterData.enemyWeapon?.weaknesses?.map((weakness: string, i: number) => (
              <li key={i} className="text-sm text-gray-300 flex items-start gap-2">
                <span className="text-red-400 mt-1">-</span>
                {weakness}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Counter Weapons */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-cod-blue mb-4">Best Counter Weapons</h3>
        <div className="space-y-3">
          {counterData.counterWeapons?.map((counter: any, i: number) => (
            <div
              key={counter.weaponId}
              className="bg-cod-gray/50 hover:bg-cod-gray/70 rounded-lg p-4 cursor-pointer transition-colors"
              onClick={() => handleWeaponClick(counter.weaponId)}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-3">
                  <span className="text-cod-orange font-bold text-lg">#{i + 1}</span>
                  <div>
                    <h4 className="font-semibold">{counter.weaponName}</h4>
                    <span className="text-cod-blue text-sm">{counter.category}</span>
                  </div>
                </div>
                <div className="text-right">
                  <div className={`font-bold ${getEffectivenessColor(counter.effectiveness)}`}>
                    {counter.effectiveness}% effective
                  </div>
                  <div className="w-20 bg-cod-black rounded-full h-2 mt-1">
                    <div
                      className={`h-full rounded-full ${getEffectivenessBar(counter.effectiveness)}`}
                      style={{ width: `${counter.effectiveness}%` }}
                    />
                  </div>
                </div>
              </div>
              <p className="text-gray-300 text-sm">{counter.reasoning}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Strategies */}
      <div className="grid md:grid-cols-2 gap-6">
        <div>
          <h3 className="text-lg font-semibold text-cod-blue mb-3">Counter Strategies</h3>
          <ul className="space-y-2">
            {counterData.strategies?.map((strategy: string, i: number) => (
              <li key={i} className="text-gray-300 text-sm flex items-start gap-2">
                <span className="text-cod-green mt-1">🎯</span>
                {strategy}
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h3 className="text-lg font-semibold text-cod-blue mb-3">Tactical Advice</h3>
          <ul className="space-y-2">
            {counterData.tacticalAdvice?.map((advice: string, i: number) => (
              <li key={i} className="text-gray-300 text-sm flex items-start gap-2">
                <span className="text-cod-orange mt-1">💡</span>
                {advice}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};