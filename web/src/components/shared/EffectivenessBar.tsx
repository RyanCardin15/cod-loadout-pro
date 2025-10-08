'use client';

import { memo } from 'react';
import { motion } from 'framer-motion';

import { cn } from '@/lib/utils/cn';

/**
 * Effectiveness Bar Component
 *
 * Animated horizontal bar displaying effectiveness percentage with semantic colors.
 * Color automatically changes based on value thresholds:
 * - Green: 80-100% (excellent)
 * - Yellow: 60-79% (good)
 * - Orange: 40-59% (moderate)
 * - Red: 0-39% (poor)
 *
 * @param value - Effectiveness percentage (0-100)
 * @param showLabel - Display label and value (default: true)
 * @param size - Bar height variant (default: 'md')
 * @param className - Optional additional CSS classes
 *
 * @example
 * ```tsx
 * <EffectivenessBar value={85} />
 * <EffectivenessBar value={45} showLabel={false} size="lg" />
 * ```
 */
interface EffectivenessBarProps {
  value: number;
  showLabel?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

/**
 * Determines color scheme based on effectiveness value
 * Uses semantic colors to indicate performance level
 */
function getColor(val: number) {
  if (val >= 80) return { bg: 'bg-green-500', text: 'text-green-400' };
  if (val >= 60) return { bg: 'bg-yellow-500', text: 'text-yellow-400' };
  if (val >= 40) return { bg: 'bg-orange-500', text: 'text-orange-400' };
  return { bg: 'bg-red-500', text: 'text-red-400' };
}

function EffectivenessBarComponent({
  value,
  showLabel = true,
  size = 'md',
  className,
}: EffectivenessBarProps) {

  const sizeClasses = {
    sm: 'h-1.5',
    md: 'h-2',
    lg: 'h-3',
  };

  const colors = getColor(value);

  return (
    <div className={cn('space-y-1', className)}>
      {showLabel && (
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-400 font-medium">Effectiveness</span>
          <span className={cn('font-bold', colors.text)}>{value}%</span>
        </div>
      )}
      <div className={cn('bg-cod-surface rounded-full overflow-hidden', sizeClasses[size])}>
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${value}%` }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          className={cn('h-full rounded-full', colors.bg)}
        />
      </div>
    </div>
  );
}

/**
 * Memoized EffectivenessBar for optimal performance
 * Prevents unnecessary re-renders when value hasn't changed
 */
export const EffectivenessBar = memo(EffectivenessBarComponent);
EffectivenessBar.displayName = 'EffectivenessBar';
