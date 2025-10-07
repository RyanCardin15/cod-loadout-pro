'use client';

import { useState } from 'react';
import { useProfile, type UserProfile } from '@/hooks/useProfile';
import { Crosshair, Save, Zap, Shield, Target, Wind } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface PlaystyleEditorEnhancedProps {
  profile: UserProfile;
}

const playstyles = [
  { id: 'Aggressive', name: 'Aggressive', icon: Zap, color: 'from-red-500 to-orange-500', description: 'Rush and dominate' },
  { id: 'Tactical', name: 'Tactical', icon: Shield, color: 'from-blue-500 to-cyan-500', description: 'Strategic gameplay' },
  { id: 'Sniper', name: 'Sniper', icon: Target, color: 'from-purple-500 to-pink-500', description: 'Long-range precision' },
  { id: 'Support', name: 'Support', icon: Wind, color: 'from-green-500 to-emerald-500', description: 'Team-focused play' },
] as const;

const pacings = [
  { id: 'Rusher', name: 'Rusher', emoji: '⚡', color: 'from-orange-500 to-red-500' },
  { id: 'Balanced', name: 'Balanced', emoji: '⚖️', color: 'from-blue-500 to-purple-500' },
  { id: 'Camper', name: 'Camper', emoji: '🎯', color: 'from-green-500 to-teal-500' },
] as const;

export function PlaystyleEditorEnhanced({ profile }: PlaystyleEditorEnhancedProps) {
  const { updateProfile, isUpdating } = useProfile();
  const [primary, setPrimary] = useState(profile.playstyle.primary);
  const [pacing, setPacing] = useState(profile.playstyle.pacing);
  const [ranges, setRanges] = useState(profile.playstyle.ranges);
  const [hoveredStyle, setHoveredStyle] = useState<string | null>(null);

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

  // Calculate radar chart points
  const radarData = [
    { label: 'Close', value: ranges.close, angle: 0 },
    { label: 'Medium', value: ranges.medium, angle: 120 },
    { label: 'Long', value: ranges.long, angle: 240 },
  ];

  const polarToCartesian = (angle: number, value: number, radius: number) => {
    const rad = ((angle - 90) * Math.PI) / 180;
    return {
      x: 50 + radius * (value / 100) * Math.cos(rad),
      y: 50 + radius * (value / 100) * Math.sin(rad),
    };
  };

  const radarPoints = radarData.map(d => polarToCartesian(d.angle, d.value, 40)).map(p => `${p.x},${p.y}`).join(' ');

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-premium rounded-2xl p-6 space-y-6"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cod-accent to-cod-blue flex items-center justify-center">
            <Crosshair className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold font-rajdhani">Playstyle</h2>
            <p className="text-xs text-gray-400">Customize your preferences</p>
          </div>
        </div>
        <AnimatePresence>
          {hasChanges && (
            <motion.button
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              onClick={handleSave}
              disabled={isUpdating}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-cod-accent to-cod-blue hover:from-cod-accent-dark hover:to-cod-blue-dark rounded-xl text-sm font-semibold transition-all disabled:opacity-50 shadow-lg hover:shadow-xl"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Save className="w-4 h-4" />
              {isUpdating ? 'Saving...' : 'Save'}
            </motion.button>
          )}
        </AnimatePresence>
      </div>

      {/* Primary Playstyle - Card Grid */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-3">
          Primary Style
        </label>
        <div className="grid grid-cols-2 gap-3">
          {playstyles.map((style) => {
            const Icon = style.icon;
            const isSelected = primary === style.id;
            const isHovered = hoveredStyle === style.id;

            return (
              <motion.button
                key={style.id}
                onClick={() => setPrimary(style.id as typeof primary)}
                onMouseEnter={() => setHoveredStyle(style.id)}
                onMouseLeave={() => setHoveredStyle(null)}
                className="relative group"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <div
                  className={`
                    relative overflow-hidden rounded-2xl p-4 transition-all duration-300
                    ${isSelected
                      ? 'bg-gradient-to-br ' + style.color + ' text-white shadow-lg'
                      : 'glass hover:bg-white/10 text-gray-300'
                    }
                  `}
                >
                  {/* Icon */}
                  <motion.div
                    className="flex justify-center mb-2"
                    animate={isSelected ? { rotate: [0, 360] } : {}}
                    transition={{ duration: 0.5 }}
                  >
                    <Icon className={`w-8 h-8 ${isSelected ? 'text-white' : 'text-cod-accent'}`} />
                  </motion.div>

                  {/* Text */}
                  <div className="text-center">
                    <p className="font-bold text-sm mb-1">{style.name}</p>
                    <p className={`text-xs ${isSelected ? 'text-white/80' : 'text-gray-500'}`}>
                      {style.description}
                    </p>
                  </div>

                  {/* Selection Indicator */}
                  {isSelected && (
                    <motion.div
                      className="absolute top-2 right-2 w-6 h-6 bg-white/20 rounded-full flex items-center justify-center"
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                    >
                      <div className="w-3 h-3 bg-white rounded-full" />
                    </motion.div>
                  )}

                  {/* Shimmer Effect */}
                  {isHovered && !isSelected && (
                    <motion.div
                      className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent"
                      initial={{ x: '-100%' }}
                      animate={{ x: '100%' }}
                      transition={{ duration: 0.5 }}
                    />
                  )}
                </div>
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* Pacing */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-3">
          Pacing Preference
        </label>
        <div className="grid grid-cols-3 gap-3">
          {pacings.map((pace) => {
            const isSelected = pacing === pace.id;

            return (
              <motion.button
                key={pace.id}
                onClick={() => setPacing(pace.id as typeof pacing)}
                className="relative overflow-hidden"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <div
                  className={`
                    relative rounded-xl p-3 transition-all duration-300 text-center
                    ${isSelected
                      ? 'bg-gradient-to-br ' + pace.color + ' text-white shadow-lg'
                      : 'glass hover:bg-white/10'
                    }
                  `}
                >
                  <div className="text-2xl mb-1">{pace.emoji}</div>
                  <p className={`text-sm font-semibold ${isSelected ? 'text-white' : 'text-gray-300'}`}>
                    {pace.name}
                  </p>

                  {isSelected && (
                    <motion.div
                      className="absolute inset-0 border-2 border-white/30 rounded-xl"
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                    />
                  )}
                </div>
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* Range Preferences with Radar Chart */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-3">
          Range Preferences
        </label>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Radar Chart */}
          <div className="flex items-center justify-center">
            <div className="relative w-48 h-48">
              <svg viewBox="0 0 100 100" className="w-full h-full">
                {/* Background circles */}
                {[80, 60, 40, 20].map((r, i) => (
                  <circle
                    key={i}
                    cx="50"
                    cy="50"
                    r={r / 2}
                    fill="none"
                    stroke="rgba(255,255,255,0.05)"
                    strokeWidth="0.5"
                  />
                ))}

                {/* Axes */}
                {radarData.map((d, i) => {
                  const point = polarToCartesian(d.angle, 100, 40);
                  return (
                    <g key={i}>
                      <line
                        x1="50"
                        y1="50"
                        x2={point.x}
                        y2={point.y}
                        stroke="rgba(255,255,255,0.1)"
                        strokeWidth="0.5"
                      />
                      <text
                        x={polarToCartesian(d.angle, 110, 40).x}
                        y={polarToCartesian(d.angle, 110, 40).y}
                        fill="rgba(255,255,255,0.6)"
                        fontSize="4"
                        textAnchor="middle"
                        dominantBaseline="middle"
                      >
                        {d.label}
                      </text>
                    </g>
                  );
                })}

                {/* Data polygon */}
                <motion.polygon
                  points={radarPoints}
                  fill="url(#radarGradient)"
                  fillOpacity="0.3"
                  stroke="url(#radarGradient)"
                  strokeWidth="2"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ duration: 0.5 }}
                />

                {/* Data points */}
                {radarData.map((d, i) => {
                  const point = polarToCartesian(d.angle, d.value, 40);
                  return (
                    <motion.circle
                      key={i}
                      cx={point.x}
                      cy={point.y}
                      r="2"
                      fill="#FF6B00"
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: 0.1 * i }}
                    />
                  );
                })}

                <defs>
                  <linearGradient id="radarGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#FF6B00" />
                    <stop offset="100%" stopColor="#00D4FF" />
                  </linearGradient>
                </defs>
              </svg>
            </div>
          </div>

          {/* Sliders */}
          <div className="space-y-4">
            {Object.entries(ranges).map(([range, value], i) => (
              <motion.div
                key={range}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 * i }}
              >
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-gray-300 capitalize font-medium">{range} Range</span>
                  <motion.span
                    className="text-cod-accent font-bold"
                    key={value}
                    initial={{ scale: 1.5 }}
                    animate={{ scale: 1 }}
                  >
                    {value}%
                  </motion.span>
                </div>
                <div className="relative">
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={value}
                    onChange={(e) =>
                      setRanges({ ...ranges, [range]: parseInt(e.target.value) })
                    }
                    className="w-full h-3 bg-cod-black rounded-full appearance-none cursor-pointer slider"
                    style={{
                      background: `linear-gradient(to right, #FF6B00 0%, #FF6B00 ${value}%, #0A0A0A ${value}%, #0A0A0A 100%)`
                    }}
                  />
                  <motion.div
                    className="absolute top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-gradient-to-r from-cod-accent to-cod-blue shadow-lg pointer-events-none"
                    style={{ left: `${value}%`, x: '-50%' }}
                    whileHover={{ scale: 1.2 }}
                  />
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* Summary */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="pt-4 border-t border-white/10"
      >
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-400">Current Build</span>
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-full bg-cod-accent/20 text-cod-accent text-xs font-semibold">
              {primary}
            </span>
            <span className="px-3 py-1 rounded-full bg-cod-blue/20 text-cod-blue text-xs font-semibold">
              {pacing}
            </span>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
