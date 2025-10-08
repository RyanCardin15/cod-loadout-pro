import React, { useEffect, useState } from 'react';

interface Weapon {
  id: string;
  name: string;
  usage: number;
}

interface TierData {
  S: Weapon[];
  A: Weapon[];
  B: Weapon[];
  C: Weapon[];
  D: Weapon[];
}

interface MetaTierListProps {
  toolOutput?: {
    tiers: TierData;
    topLoadouts?: any[];
    recentChanges?: string[];
    lastUpdated?: string;
  };
}

const MetaTierList: React.FC<MetaTierListProps> = ({ toolOutput }) => {
  const [tiers, setTiers] = useState<TierData>({
    S: [],
    A: [],
    B: [],
    C: [],
    D: []
  });
  const [recentChanges, setRecentChanges] = useState<string[]>([]);
  const [lastUpdated, setLastUpdated] = useState<string>('');

  useEffect(() => {
    // Access data from window.openai.toolOutput if available
    const openai = (window as any).openai;
    const data = toolOutput || openai?.toolOutput;

    if (data) {
      setTiers(data.tiers || { S: [], A: [], B: [], C: [], D: [] });
      setRecentChanges(data.recentChanges || []);
      setLastUpdated(data.lastUpdated || '');
    }
  }, [toolOutput]);

  const getTierColor = (tier: string): string => {
    switch (tier) {
      case 'S': return 'bg-gradient-to-br from-yellow-500 to-orange-600 text-white';
      case 'A': return 'bg-gradient-to-br from-green-500 to-emerald-600 text-white';
      case 'B': return 'bg-gradient-to-br from-blue-500 to-cyan-600 text-white';
      case 'C': return 'bg-gradient-to-br from-purple-500 to-indigo-600 text-white';
      case 'D': return 'bg-gradient-to-br from-gray-500 to-slate-600 text-white';
      default: return 'bg-gray-700 text-white';
    }
  };

  const renderTier = (tierName: keyof TierData, weapons: Weapon[]) => {
    if (!weapons || weapons.length === 0) return null;

    return (
      <div key={tierName} className="mb-6">
        <div className="flex items-center gap-3 mb-3">
          <div className={`${getTierColor(tierName)} px-4 py-2 rounded-lg font-bold text-xl min-w-[60px] text-center`}>
            {tierName}
          </div>
          <div className="text-gray-400 text-sm">
            {tierName === 'S' && '🔥 Top Tier - Dominates the meta'}
            {tierName === 'A' && '✨ Excellent - Strong picks'}
            {tierName === 'B' && '⚡ Good - Viable options'}
            {tierName === 'C' && '📊 Average - Situational'}
            {tierName === 'D' && '📉 Below Average - Needs buffs'}
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {weapons.map((weapon) => (
            <div
              key={weapon.id}
              className="bg-cod-gray border border-cod-orange/30 rounded-lg p-4 hover:bg-cod-gray/70 transition-colors cursor-pointer"
            >
              <div className="flex justify-between items-start mb-2">
                <h3 className="text-white font-semibold text-lg">{weapon.name}</h3>
                {weapon.usage && (
                  <span className="text-cod-orange text-sm font-medium">
                    {weapon.usage.toFixed(1)}%
                  </span>
                )}
              </div>
              {weapon.usage && (
                <div className="w-full bg-gray-700 rounded-full h-2">
                  <div
                    className="bg-cod-orange h-2 rounded-full transition-all"
                    style={{ width: `${Math.min(weapon.usage, 100)}%` }}
                  />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="bg-cod-black text-white p-6 max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-cod-orange mb-2">
          🎯 MW3 Meta Tier List
        </h1>
        {lastUpdated && (
          <p className="text-gray-400 text-sm">
            Last updated: {new Date(lastUpdated).toLocaleDateString()}
          </p>
        )}
      </div>

      <div className="mb-8">
        {(['S', 'A', 'B', 'C', 'D'] as const).map((tier) =>
          renderTier(tier, tiers[tier])
        )}
      </div>

      {recentChanges && recentChanges.length > 0 && (
        <div className="bg-cod-gray border border-cod-orange/30 rounded-lg p-6 mt-8">
          <h2 className="text-xl font-bold text-cod-orange mb-4">
            📰 Recent Changes
          </h2>
          <ul className="space-y-2">
            {recentChanges.map((change, index) => (
              <li key={index} className="text-gray-300 flex items-start gap-2">
                <span className="text-cod-orange">•</span>
                <span>{change}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default MetaTierList;
