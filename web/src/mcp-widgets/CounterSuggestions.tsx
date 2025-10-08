import React, { useEffect, useState } from 'react';
import { CounterSuggestionsData, BaseWidgetProps } from './types';

const CounterSuggestions: React.FC<BaseWidgetProps<CounterSuggestionsData>> = ({ toolOutput }) => {
  const [data, setData] = useState<CounterSuggestionsData | null>(null);

  useEffect(() => {
    const openai = (window as any).openai;
    let rawData = toolOutput || openai?.toolOutput;
    const extractedData = rawData?.structuredContent || rawData;

    if (extractedData?.enemyWeapon) {
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

  return (
    <div className="bg-cod-black text-white p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-6 pb-4 border-b border-gray-700">
        <h1 className="text-3xl font-bold text-cod-orange mb-2">
          ⚔️ COUNTERING: {data.enemyWeapon.name}
        </h1>
        <p className="text-gray-400">{data.enemyWeapon.category} • Long Range Threat</p>
      </div>

      {/* Enemy Analysis */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        {/* Strengths */}
        {data.enemyWeapon.strengths && data.enemyWeapon.strengths.length > 0 && (
          <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-5">
            <h3 className="text-sm uppercase tracking-wide font-semibold mb-3 flex items-center gap-2 text-red-400">
              <span>⚠️</span> Enemy Strengths
            </h3>
            <ul className="space-y-2">
              {data.enemyWeapon.strengths.map((strength, index) => (
                <li key={index} className="flex items-start gap-2 text-sm">
                  <span className="text-red-400 mt-0.5">•</span>
                  <span className="text-gray-300">{strength}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Weaknesses */}
        {data.enemyWeapon.weaknesses && data.enemyWeapon.weaknesses.length > 0 && (
          <div className="bg-green-900/20 border border-green-500/30 rounded-lg p-5">
            <h3 className="text-sm uppercase tracking-wide font-semibold mb-3 flex items-center gap-2 text-green-400">
              <span>💪</span> Enemy Weaknesses
            </h3>
            <ul className="space-y-2">
              {data.enemyWeapon.weaknesses.map((weakness, index) => (
                <li key={index} className="flex items-start gap-2 text-sm">
                  <span className="text-green-400 mt-0.5">•</span>
                  <span className="text-gray-300">{weakness}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Top Counters */}
      {data.counterWeapons && data.counterWeapons.length > 0 && (
        <div className="mb-6">
          <h2 className="text-xl font-bold text-cod-orange mb-4 flex items-center gap-2">
            <span>🎯</span> TOP COUNTER WEAPONS
          </h2>
          <div className="space-y-3">
            {data.counterWeapons.map((counter, index) => (
              <div
                key={index}
                className="bg-cod-gray border border-cod-orange/30 rounded-lg p-5 hover:bg-cod-gray/70 transition-all duration-200"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-1">
                      <span className="text-cod-orange font-bold text-lg">
                        #{index + 1}
                      </span>
                      <h3 className="text-white font-bold text-lg">
                        {counter.weaponName}
                      </h3>
                      <span className="text-xs text-gray-400 px-2 py-0.5 bg-cod-black rounded">
                        {counter.category}
                      </span>
                    </div>
                  </div>
                  <div className="text-right ml-4">
                    <div className="text-xs text-gray-400 uppercase tracking-wide">
                      Effectiveness
                    </div>
                    <div className="text-2xl font-bold text-green-400">
                      {counter.effectiveness}%
                    </div>
                  </div>
                </div>

                {/* Effectiveness Bar */}
                <div className="mb-3">
                  <div className="w-full bg-gray-700 rounded-full h-2">
                    <div
                      className="bg-gradient-to-r from-green-500 to-green-400 h-2 rounded-full"
                      style={{ width: `${counter.effectiveness}%` }}
                    />
                  </div>
                </div>

                {/* Reasoning */}
                {counter.reasoning && (
                  <p className="text-sm text-gray-300 leading-relaxed bg-cod-black/30 p-3 rounded">
                    {counter.reasoning}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Key Strategies */}
      {data.strategies && data.strategies.length > 0 && (
        <div className="mb-6 bg-cod-gray border border-cod-orange/30 rounded-lg p-5">
          <h3 className="text-sm uppercase tracking-wide text-cod-orange font-semibold mb-4 flex items-center gap-2">
            <span>📋</span> KEY STRATEGIES
          </h3>
          <ul className="space-y-3">
            {data.strategies.map((strategy, index) => (
              <li key={index} className="flex items-start gap-3">
                <span className="text-cod-orange font-bold mt-0.5">→</span>
                <span className="text-white text-sm leading-relaxed">{strategy}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Tactical Advice */}
      {data.tacticalAdvice && data.tacticalAdvice.length > 0 && (
        <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-5">
          <h3 className="text-sm uppercase tracking-wide font-semibold mb-4 flex items-center gap-2 text-blue-400">
            <span>💡</span> TACTICAL ADVICE
          </h3>
          <ul className="space-y-2">
            {data.tacticalAdvice.map((advice, index) => (
              <li key={index} className="flex items-start gap-2 text-sm">
                <span className="text-blue-400 mt-0.5">•</span>
                <span className="text-gray-300">{advice}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default CounterSuggestions;
