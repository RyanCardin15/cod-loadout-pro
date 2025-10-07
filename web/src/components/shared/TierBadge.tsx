import { cn } from '@/lib/utils/cn';

interface TierBadgeProps {
  tier: 'S' | 'A' | 'B' | 'C' | 'D';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function TierBadge({ tier, size = 'md', className }: TierBadgeProps) {
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
