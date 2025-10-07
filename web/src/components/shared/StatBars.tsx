'use client';

import { motion } from 'framer-motion';
import { cn } from '@/lib/utils/cn';

interface StatBarsProps {
  stats: {
    damage: number;
    range: number;
    accuracy: number;
    fireRate: number;
    mobility: number;
    control: number;
  };
  className?: string;
  animated?: boolean;
}

const statConfig = [
  { key: 'damage', label: 'Damage', color: 'from-red-500 to-red-600' },
  { key: 'range', label: 'Range', color: 'from-blue-500 to-blue-600' },
  { key: 'accuracy', label: 'Accuracy', color: 'from-green-500 to-green-600' },
  { key: 'fireRate', label: 'Fire Rate', color: 'from-yellow-500 to-yellow-600' },
  { key: 'mobility', label: 'Mobility', color: 'from-purple-500 to-purple-600' },
  { key: 'control', label: 'Control', color: 'from-orange-500 to-orange-600' },
];

export function StatBars({ stats, className, animated = true }: StatBarsProps) {
  return (
    <div className={cn('space-y-3', className)}>
      {statConfig.map((stat, index) => {
        const value = stats[stat.key as keyof typeof stats] || 0;

        return (
          <div key={stat.key} className="space-y-1">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-400 font-medium">{stat.label}</span>
              <span className="text-white font-bold">{value}</span>
            </div>
            <div className="h-2 bg-cod-surface rounded-full overflow-hidden">
              <motion.div
                initial={animated ? { width: 0 } : { width: `${value}%` }}
                animate={{ width: `${value}%` }}
                transition={animated ? { delay: index * 0.1, duration: 0.5 } : undefined}
                className={cn(
                  'h-full rounded-full bg-gradient-to-r',
                  stat.color
                )}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
