'use client';

import { useState } from 'react';
import { useProfile, type UserProfile } from '@/hooks/useProfile';
import { Crosshair, Save } from 'lucide-react';

interface PlaystyleEditorProps {
  profile: UserProfile;
}

const playstyles = ['Aggressive', 'Tactical', 'Sniper', 'Support'] as const;
const pacings = ['Rusher', 'Balanced', 'Camper'] as const;

export function PlaystyleEditor({ profile }: PlaystyleEditorProps) {
  const { updateProfile, isUpdating } = useProfile();
  const [primary, setPrimary] = useState(profile.playstyle.primary);
  const [pacing, setPacing] = useState(profile.playstyle.pacing);
  const [ranges, setRanges] = useState(profile.playstyle.ranges);

  const handleSave = () => {
    updateProfile({
      playstyle: {
        ...profile.playstyle,
        primary,
        pacing,
        ranges,
      },
    });
  };

  const hasChanges =
    primary !== profile.playstyle.primary ||
    pacing !== profile.playstyle.pacing ||
    JSON.stringify(ranges) !== JSON.stringify(profile.playstyle.ranges);

  return (
    <div className="bg-cod-surface border border-cod-accent/20 rounded-xl p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Crosshair className="w-5 h-5 text-cod-accent" />
          <h2 className="text-xl font-bold font-rajdhani">Playstyle</h2>
        </div>
        {hasChanges && (
          <button
            onClick={handleSave}
            disabled={isUpdating}
            className="flex items-center gap-2 px-4 py-2 bg-cod-accent hover:bg-cod-accent-dark rounded-lg text-sm font-semibold transition-colors disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            {isUpdating ? 'Saving...' : 'Save'}
          </button>
        )}
      </div>

      {/* Primary Playstyle */}
      <div>
        <label className="block text-sm font-medium text-gray-400 mb-2">
          Primary Style
        </label>
        <div className="grid grid-cols-2 gap-2">
          {playstyles.map((style) => (
            <button
              key={style}
              onClick={() => setPrimary(style)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                primary === style
                  ? 'bg-cod-accent text-white'
                  : 'bg-cod-black/50 text-gray-400 hover:bg-cod-black hover:text-white'
              }`}
            >
              {style}
            </button>
          ))}
        </div>
      </div>

      {/* Pacing */}
      <div>
        <label className="block text-sm font-medium text-gray-400 mb-2">
          Pacing
        </label>
        <div className="grid grid-cols-3 gap-2">
          {pacings.map((pace) => (
            <button
              key={pace}
              onClick={() => setPacing(pace)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                pacing === pace
                  ? 'bg-cod-accent text-white'
                  : 'bg-cod-black/50 text-gray-400 hover:bg-cod-black hover:text-white'
              }`}
            >
              {pace}
            </button>
          ))}
        </div>
      </div>

      {/* Range Preferences */}
      <div>
        <label className="block text-sm font-medium text-gray-400 mb-3">
          Range Preferences
        </label>
        <div className="space-y-3">
          {Object.entries(ranges).map(([range, value]) => (
            <div key={range}>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-300 capitalize">{range}</span>
                <span className="text-cod-accent font-semibold">{value}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={value}
                onChange={(e) =>
                  setRanges({ ...ranges, [range]: parseInt(e.target.value) })
                }
                className="w-full h-2 bg-cod-black rounded-lg appearance-none cursor-pointer accent-cod-accent"
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
