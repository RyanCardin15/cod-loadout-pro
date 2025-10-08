import { memo } from 'react';
import { cn } from '@/lib/utils/cn';

/**
 * Tier Badge Component
 *
 * Displays a weapon or loadout tier ranking badge with customizable size and styling.
 * Uses semantic colors based on tier (S-tier gets special neon glow effect).
 *
 * @param tier - The tier level (S, A, B, C, or D)
 * @param size - Badge size variant (default: 'md')
 * @param className - Optional additional CSS classes
 *
 * @example
 * ```tsx
 * <TierBadge tier="S" size="lg" />
 * <TierBadge tier="A" />
 * ```
 */
interface TierBadgeProps {
  tier: 'S' | 'A' | 'B' | 'C' | 'D';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

function TierBadgeComponent({ tier, size = 'md', className }: TierBadgeProps) {
  const sizeClasses = {
    sm: 'w-6 h-6 text-xs',
    md: 'w-8 h-8 text-sm',
    lg: 'w-12 h-12 text-xl',
  };

  const tierClasses = {
    S: 'bg-tier-S text-white neon-glow',
    A: 'bg-tier-A text-white',
    B: 'bg-tier-B text-black',
    C: 'bg-tier-C text-black',
    D: 'bg-tier-D text-white',
  };

  return (
    <div
      className={cn(
        'flex items-center justify-center rounded-lg font-bold flex-shrink-0',
        sizeClasses[size],
        tierClasses[tier],
        className
      )}
    >
      {tier}
    </div>
  );
}

/**
 * Memoized TierBadge for optimal performance
 * Prevents unnecessary re-renders when props haven't changed
 */
export const TierBadge = memo(TierBadgeComponent);
TierBadge.displayName = 'TierBadge';
