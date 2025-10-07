import React from 'react';

interface WeaponStatsProps {
  stats: {
    damage: number;
    range: number;
    accuracy: number;
    fireRate: number;
    mobility: number;
    control: number;
  };
}

export const WeaponStats: React.FC<WeaponStatsProps> = ({ stats }) => {
  const statOrder = [
    { key: 'damage', label: 'Damage', color: 'bg-red-500' },
    { key: 'range', label: 'Range', color: 'bg-blue-500' },
    { key: 'accuracy', label: 'Accuracy', color: 'bg-green-500' },
    { key: 'fireRate', label: 'Fire Rate', color: 'bg-yellow-500' },
    { key: 'mobility', label: 'Mobility', color: 'bg-purple-500' },
    { key: 'control', label: 'Control', color: 'bg-pink-500' }
  ];

  return (
    <div className="weapon-stats bg-cod-gray/30 rounded-lg p-4 mb-4">
      <h5 className="text-sm font-semibold text-cod-blue mb-3">WEAPON STATS</h5>
      <div className="space-y-2">
        {statOrder.map(({ key, label, color }) => (
          <div key={key} className="flex items-center gap-3">
            <span className="text-sm text-gray-300 w-20">{label}</span>
            <div className="flex-1 bg-cod-black rounded-full h-2 relative overflow-hidden">
              <div
                className={`absolute top-0 left-0 h-full ${color} transition-all duration-300`}
                style={{ width: `${stats[key as keyof typeof stats]}%` }}
              />
            </div>
            <span className="text-sm text-white w-8 text-right">
              {stats[key as keyof typeof stats]}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};