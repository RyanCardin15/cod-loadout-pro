import React, { useEffect, useState } from 'react';
import { PlaystyleData, BaseWidgetProps } from './types';

const PlaystyleProfile: React.FC<BaseWidgetProps<PlaystyleData>> = ({ toolOutput }) => {
  const [data, setData] = useState<PlaystyleData | null>(null);

  useEffect(() => {
    const openai = (window as any).openai;
    let rawData = toolOutput || openai?.toolOutput;
    const extractedData = rawData?.structuredContent || rawData;

    if (extractedData?.playstyle) {
      setData(extractedData);
    }
  }, [toolOutput]);

  const getGradientForRange = (value: number) => {
    if (value >= 70) return 'from-red-500 to-orange-500';
    if (value >= 50) return 'from-yellow-500 to-orange-500';
    return 'from-blue-500 to-cyan-500';
  };

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

  const { playstyle } = data;

  return (
    <div className="bg-cod-black text-white p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-6 pb-4 border-b border-gray-700">
        <h1 className="text-3xl font-bold text-cod-orange mb-2">
          🎯 YOUR PLAYSTYLE: {playstyle.primary.toUpperCase()}
        </h1>
        {playstyle.pacing && (
          <p className="text-gray-400">Pacing: {playstyle.pacing}</p>
        )}
      </div>

      {/* Engagement Ranges */}
      <div className="mb-6 bg-cod-gray border border-cod-orange/30 rounded-lg p-5">
        <h3 className="text-sm uppercase tracking-wide text-cod-orange font-semibold mb-4 flex items-center gap-2">
          <span>📏</span> ENGAGEMENT RANGES
        </h3>
        <div className="space-y-4">
          {/* Close Range */}
          <div>
            <div className="flex justify-between text-sm mb-2">
              <span className="text-gray-300 font-medium">Close Range</span>
              <span className="text-cod-orange font-bold">{playstyle.ranges.close}%</span>
            </div>
            <div className="w-full bg-gray-700 rounded-full h-3">
              <div
                className={`bg-gradient-to-r ${getGradientForRange(playstyle.ranges.close)} h-3 rounded-full transition-all duration-500`}
                style={{ width: `${playstyle.ranges.close}%` }}
              />
            </div>
          </div>

          {/* Medium Range */}
          <div>
            <div className="flex justify-between text-sm mb-2">
              <span className="text-gray-300 font-medium">Medium Range</span>
              <span className="text-cod-orange font-bold">{playstyle.ranges.medium}%</span>
            </div>
            <div className="w-full bg-gray-700 rounded-full h-3">
              <div
                className={`bg-gradient-to-r ${getGradientForRange(playstyle.ranges.medium)} h-3 rounded-full transition-all duration-500`}
                style={{ width: `${playstyle.ranges.medium}%` }}
              />
            </div>
          </div>

          {/* Long Range */}
          <div>
            <div className="flex justify-between text-sm mb-2">
              <span className="text-gray-300 font-medium">Long Range</span>
              <span className="text-cod-orange font-bold">{playstyle.ranges.long}%</span>
            </div>
            <div className="w-full bg-gray-700 rounded-full h-3">
              <div
                className={`bg-gradient-to-r ${getGradientForRange(playstyle.ranges.long)} h-3 rounded-full transition-all duration-500`}
                style={{ width: `${playstyle.ranges.long}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Strengths */}
      {playstyle.strengths && playstyle.strengths.length > 0 && (
        <div className="mb-6 bg-green-900/20 border border-green-500/30 rounded-lg p-5">
          <h3 className="text-sm uppercase tracking-wide font-semibold mb-4 flex items-center gap-2 text-green-400">
            <span>💪</span> YOUR STRENGTHS
          </h3>
          <ul className="space-y-2">
            {playstyle.strengths.map((strength, index) => (
              <li key={index} className="flex items-start gap-2">
                <span className="text-green-400 mt-0.5">•</span>
                <span className="text-gray-300">{strength}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Recommended Weapons */}
      {playstyle.recommendedWeapons && playstyle.recommendedWeapons.length > 0 && (
        <div className="mb-6 bg-cod-gray border border-cod-orange/30 rounded-lg p-5">
          <h3 className="text-sm uppercase tracking-wide text-cod-orange font-semibold mb-4 flex items-center gap-2">
            <span>🔫</span> RECOMMENDED WEAPONS
          </h3>
          <div className="space-y-2">
            {playstyle.recommendedWeapons.map((weapon, index) => (
              <div
                key={index}
                className="flex items-center gap-3 bg-cod-black/50 rounded px-4 py-3 hover:bg-cod-black/70 transition-colors"
              >
                <span className="text-cod-orange font-bold text-lg w-8">
                  {index + 1}.
                </span>
                <span className="text-white font-semibold">{weapon}</span>
                {index === 0 && (
                  <span className="ml-auto px-2 py-1 bg-cod-orange/20 text-cod-orange text-xs font-bold rounded">
                    BEST FOR YOU
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recommended Perks */}
      {playstyle.recommendedPerks && playstyle.recommendedPerks.length > 0 && (
        <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-5">
          <h3 className="text-sm uppercase tracking-wide font-semibold mb-4 flex items-center gap-2 text-blue-400">
            <span>⚙️</span> RECOMMENDED PERKS
          </h3>
          <div className="flex flex-wrap gap-2">
            {playstyle.recommendedPerks.map((perk, index) => (
              <span
                key={index}
                className="px-3 py-2 bg-blue-900/30 border border-blue-500/30 rounded text-sm text-blue-200 font-medium"
              >
                {perk}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Footer Note */}
      <div className="mt-6 p-4 bg-cod-gray/50 border border-cod-orange/20 rounded-lg">
        <p className="text-xs text-gray-400 text-center">
          💡 Profile based on your preferences and play patterns
        </p>
      </div>
    </div>
  );
};

export default PlaystyleProfile;
