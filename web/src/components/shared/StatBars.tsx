'use client';

import { memo } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils/cn';

/**
 * Weapon Statistics Display Component
 *
 * Renders animated horizontal bars showing weapon stats on a 0-100 scale.
 * Each stat has a distinct color gradient for visual distinction.
 * Supports optional animation for initial render.
 *
 * @param stats - Weapon statistics object (all values 0-100)
 * @param className - Optional additional CSS classes
 * @param animated - Enable entrance animation (default: true)
 *
 * @example
 * ```tsx
 * <StatBars
 *   stats={{
 *     damage: 85,
 *     range: 70,
 *     accuracy: 90,
 *     fireRate: 75,
 *     mobility: 65,
 *     control: 80
 *   }}
 * />
 * ```
 */
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

/**
 * Configuration for stat display order and styling
 * Each stat has a unique color gradient for visual distinction
 */
const statConfig = [
  { key: 'damage', label: 'Damage', color: 'from-red-500 to-red-600' },
  { key: 'range', label: 'Range', color: 'from-blue-500 to-blue-600' },
  { key: 'accuracy', label: 'Accuracy', color: 'from-green-500 to-green-600' },
  { key: 'fireRate', label: 'Fire Rate', color: 'from-yellow-500 to-yellow-600' },
  { key: 'mobility', label: 'Mobility', color: 'from-purple-500 to-purple-600' },
  { key: 'control', label: 'Control', color: 'from-orange-500 to-orange-600' },
] as const;

function StatBarsComponent({ stats, className, animated = true }: StatBarsProps) {
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

/**
 * Memoized StatBars for optimal performance
 * Prevents unnecessary re-renders when stats haven't changed
 */
export const StatBars = memo(StatBarsComponent);
StatBars.displayName = 'StatBars';
