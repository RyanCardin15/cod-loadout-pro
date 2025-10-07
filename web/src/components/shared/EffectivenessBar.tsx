'use client';

import { motion } from 'framer-motion';
import { cn } from '@/lib/utils/cn';

interface EffectivenessBarProps {
  value: number;
  showLabel?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function EffectivenessBar({
  value,
  showLabel = true,
  size = 'md',
  className,
}: EffectivenessBarProps) {
  const getColor = (val: number) => {
    if (val >= 80) return { bg: 'bg-green-500', text: 'text-green-400' };
    if (val >= 60) return { bg: 'bg-yellow-500', text: 'text-yellow-400' };
    if (val >= 40) return { bg: 'bg-orange-500', text: 'text-orange-400' };
    return { bg: 'bg-red-500', text: 'text-red-400' };
  };

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
