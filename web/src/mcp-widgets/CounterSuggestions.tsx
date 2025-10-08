import React, { useEffect, useState } from 'react';
import { CounterSuggestionsData, BaseWidgetProps } from './types';

const CounterSuggestions: React.FC<BaseWidgetProps<CounterSuggestionsData>> = ({ toolOutput }) => {
  const [data, setData] = useState<CounterSuggestionsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadingTimeout, setLoadingTimeout] = useState(false);

  useEffect(() => {
    const openai = (window as any).openai;
    let rawData = toolOutput || openai?.toolOutput;
    const extractedData = rawData?.structuredContent || rawData;

    if (extractedData?.enemyWeapon) {
      setData(extractedData);
      setIsLoading(false);
    }
  }, [toolOutput]);

  // Loading timeout after 5 seconds
  useEffect(() => {
    const timer = setTimeout(() => {
      if (isLoading) {
        setLoadingTimeout(true);
      }
    }, 5000);

    return () => clearTimeout(timer);
  }, [isLoading]);

  // Loading state
  if (!data) {
    return (
      <div className="bg-cod-black text-white p-6" role="status" aria-label="Loading counter strategies">
        <div className="animate-pulse">
          <div className="h-8 bg-cod-gray rounded w-3/4 mb-4"></div>
          <div className="h-32 bg-cod-gray rounded mb-4"></div>
          {loadingTimeout && (
            <div className="bg-yellow-900/20 border border-yellow-500/30 rounded-lg p-4">
              <div className="flex items-center gap-3">
                <span className="text-yellow-500 text-2xl">⏳</span>
                <div>
                  <h3 className="text-yellow-400 font-semibold">Taking longer than expected...</h3>
                  <p className="text-yellow-200/80 text-sm">Still analyzing the enemy loadout. This might take a moment.</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Empty state - enemy weapon not found
  if (data.isEmpty && data.errorState?.type === 'ENEMY_WEAPON_NOT_FOUND') {
    return (
      <div className="bg-cod-black text-white p-6 max-w-4xl mx-auto" role="alert" aria-live="polite">
        <h1 className="text-3xl font-bold text-cod-orange mb-6">
          ⚔️ COUNTER STRATEGIES
        </h1>
        <div className="bg-cod-gray border border-cod-orange/30 rounded-lg p-12 text-center">
          <div className="text-6xl mb-4">🔍</div>
          <h3 className="text-xl font-bold text-gray-300 mb-2">
            Enemy Weapon Not Found
          </h3>
          <p className="text-gray-400 mb-6 max-w-md mx-auto">
            {data.errorState.message}
          </p>
          {data.errorState.suggestions && data.errorState.suggestions.length > 0 && (
            <div className="mt-6 text-left max-w-md mx-auto bg-cod-black/50 rounded-lg p-4">
              <p className="text-cod-orange font-semibold mb-3 text-sm uppercase tracking-wide">
                Did you mean one of these?
              </p>
              <div className="space-y-2">
                {data.errorState.suggestions.map((suggestion, idx) => (
                  <div
                    key={idx}
                    className="text-white text-sm flex items-center gap-2 hover:text-cod-orange transition-colors cursor-pointer"
                  >
                    <span className="text-cod-orange">•</span>
                    {suggestion}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Empty state - no counters found
  if (data.isEmpty && data.errorState?.type === 'NO_COUNTERS_FOUND') {
    return (
      <div className="bg-cod-black text-white p-6 max-w-4xl mx-auto" role="alert" aria-live="polite">
        <h1 className="text-3xl font-bold text-cod-orange mb-6">
          ⚔️ COUNTER STRATEGIES
        </h1>
        <div className="bg-cod-gray border border-cod-orange/30 rounded-lg p-12 text-center">
          <div className="text-6xl mb-4">🤷</div>
          <h3 className="text-xl font-bold text-gray-300 mb-2">
            No Counters Found
          </h3>
          <p className="text-gray-400 mb-6 max-w-md mx-auto">
            {data.errorState.message}
          </p>
          <p className="text-gray-500 text-sm">
            Try adjusting your playstyle or game selection to find suitable counter weapons.
          </p>
        </div>
      </div>
    );
  }

  // Empty state - Firebase connection error
  if (data.isEmpty && data.errorState?.type === 'FIREBASE_CONNECTION_ERROR') {
    return (
      <div className="bg-cod-black text-white p-6 max-w-4xl mx-auto" role="alert" aria-live="assertive">
        <h1 className="text-3xl font-bold text-cod-orange mb-6">
          ⚔️ COUNTER STRATEGIES
        </h1>
        <div className="bg-cod-gray border border-cod-orange/30 rounded-lg p-12 text-center">
          <div className="text-6xl mb-4">⚠️</div>
          <h3 className="text-xl font-bold text-gray-300 mb-2">
            Connection Error
          </h3>
          <p className="text-gray-400 mb-6 max-w-md mx-auto">
            {data.errorState.message}
          </p>
          <div className="inline-block px-6 py-3 bg-cod-orange/20 border border-cod-orange/50 rounded-lg text-cod-orange font-semibold hover:bg-cod-orange/30 transition-colors cursor-pointer">
            Try Again
          </div>
        </div>
      </div>
    );
  }

  // Empty state - unknown error
  if (data.isEmpty && data.errorState) {
    return (
      <div className="bg-cod-black text-white p-6 max-w-4xl mx-auto" role="alert" aria-live="assertive">
        <h1 className="text-3xl font-bold text-cod-orange mb-6">
          ⚔️ COUNTER STRATEGIES
        </h1>
        <div className="bg-cod-gray border border-cod-orange/30 rounded-lg p-12 text-center">
          <div className="text-6xl mb-4">❌</div>
          <h3 className="text-xl font-bold text-gray-300 mb-2">
            Something Went Wrong
          </h3>
          <p className="text-gray-400 mb-6 max-w-md mx-auto">
            {data.errorState.message}
          </p>
          <p className="text-gray-500 text-sm">
            Please try again or contact support if the issue persists.
          </p>
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
        <p className="text-gray-400">
          {data.enemyWeapon.category}
          {data.threatLevel && ` • ${data.threatLevel}`}
        </p>
      </div>

      {/* Partial Data Warning Banner */}
      {data.partialData && (
        <div className="mb-6 bg-yellow-900/20 border border-yellow-500/30 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <span className="text-yellow-500 text-2xl">⚠️</span>
            <div className="flex-1">
              <h3 className="text-yellow-400 font-semibold mb-1">
                Partial Data Loaded
              </h3>
              <p className="text-yellow-200/80 text-sm">
                Some counter strategies or tactical advice could not be loaded. The information shown may be incomplete.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Enemy Analysis */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        {/* Strengths */}
        <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-5">
          <h3 className="text-sm uppercase tracking-wide font-semibold mb-3 flex items-center gap-2 text-red-400">
            <span>⚠️</span> Enemy Strengths
          </h3>
          {data.enemyWeapon.strengths && data.enemyWeapon.strengths.length > 0 ? (
            <ul className="space-y-2">
              {data.enemyWeapon.strengths.map((strength, index) => (
                <li key={index} className="flex items-start gap-2 text-sm">
                  <span className="text-red-400 mt-0.5">•</span>
                  <span className="text-gray-300">{strength}</span>
                </li>
              ))}
            </ul>
          ) : (
            <div className="bg-cod-black/30 border border-gray-700 rounded-lg p-4 text-center">
              <p className="text-gray-500 text-sm">No significant strengths identified</p>
            </div>
          )}
        </div>

        {/* Weaknesses */}
        <div className="bg-green-900/20 border border-green-500/30 rounded-lg p-5">
          <h3 className="text-sm uppercase tracking-wide font-semibold mb-3 flex items-center gap-2 text-green-400">
            <span>💪</span> Enemy Weaknesses
          </h3>
          {data.enemyWeapon.weaknesses && data.enemyWeapon.weaknesses.length > 0 ? (
            <ul className="space-y-2">
              {data.enemyWeapon.weaknesses.map((weakness, index) => (
                <li key={index} className="flex items-start gap-2 text-sm">
                  <span className="text-green-400 mt-0.5">•</span>
                  <span className="text-gray-300">{weakness}</span>
                </li>
              ))}
            </ul>
          ) : (
            <div className="bg-cod-black/30 border border-gray-700 rounded-lg p-4 text-center">
              <p className="text-gray-500 text-sm">No significant weaknesses identified</p>
            </div>
          )}
        </div>
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

      {/* Counter Perks */}
      {data.counterPerks && data.counterPerks.length > 0 && (
        <div className="mb-6 bg-purple-900/20 border border-purple-500/30 rounded-lg p-5">
          <h3 className="text-sm uppercase tracking-wide font-semibold mb-4 flex items-center gap-2 text-purple-400">
            <span>⚡</span> RECOMMENDED COUNTER PERKS
          </h3>
          <ul className="space-y-2">
            {data.counterPerks.map((perk, index) => (
              <li key={index} className="flex items-start gap-2 text-sm">
                <span className="text-purple-400 mt-0.5">•</span>
                <span className="text-gray-300">{perk}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Key Strategies */}
      <div className="mb-6 bg-cod-gray border border-cod-orange/30 rounded-lg p-5">
        <h3 className="text-sm uppercase tracking-wide text-cod-orange font-semibold mb-4 flex items-center gap-2">
          <span>📋</span> KEY STRATEGIES
        </h3>
        {data.strategies && data.strategies.length > 0 ? (
          <ul className="space-y-3">
            {data.strategies.map((strategy, index) => (
              <li key={index} className="flex items-start gap-3">
                <span className="text-cod-orange font-bold mt-0.5">→</span>
                <span className="text-white text-sm leading-relaxed">{strategy}</span>
              </li>
            ))}
          </ul>
        ) : (
          <div className="bg-cod-black/30 border border-gray-700 rounded-lg p-4 text-center">
            <p className="text-gray-500 text-sm">No strategies available</p>
          </div>
        )}
      </div>

      {/* Tactical Advice */}
      <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-5">
        <h3 className="text-sm uppercase tracking-wide font-semibold mb-4 flex items-center gap-2 text-blue-400">
          <span>💡</span> TACTICAL ADVICE
        </h3>
        {data.tacticalAdvice && data.tacticalAdvice.length > 0 ? (
          <ul className="space-y-2">
            {data.tacticalAdvice.map((advice, index) => (
              <li key={index} className="flex items-start gap-2 text-sm">
                <span className="text-blue-400 mt-0.5">•</span>
                <span className="text-gray-300">{advice}</span>
              </li>
            ))}
          </ul>
        ) : (
          <div className="bg-cod-black/30 border border-gray-700 rounded-lg p-4 text-center">
            <p className="text-gray-500 text-sm">No tactical advice available</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default CounterSuggestions;
