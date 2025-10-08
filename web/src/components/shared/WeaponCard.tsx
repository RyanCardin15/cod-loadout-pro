'use client';

import { memo } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, Users } from 'lucide-react';

import { cn } from '@/lib/utils/cn';
import { TierBadge } from './TierBadge';

/**
 * Weapon Card Component
 *
 * Interactive card displaying weapon information including stats, tier, and meta data.
 * Features smooth hover animations and displays key weapon metrics visually.
 *
 * @param weapon - Complete weapon data object
 * @param onClick - Optional click handler for weapon selection
 * @param className - Optional additional CSS classes
 *
 * @example
 * ```tsx
 * <WeaponCard
 *   weapon={weaponData}
 *   onClick={() => navigateToWeapon(weaponData.id)}
 * />
 * ```
 */
interface WeaponCardProps {
  weapon: {
    id: string;
    name: string;
    category: string;
    game: string;
    stats: {
      damage: number;
      range: number;
      accuracy: number;
      fireRate: number;
      mobility: number;
      control: number;
    };
    meta: {
      tier: 'S' | 'A' | 'B' | 'C' | 'D';
      popularity: number;
      winRate: number;
    };
    imageUrl?: string;
  };
  onClick?: () => void;
  className?: string;
}

function WeaponCardComponent({ weapon, onClick, className }: WeaponCardProps) {
  return (
    <motion.div
      whileHover={{ scale: 1.02, y: -5 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className={cn(
        'glass-premium rounded-xl p-6 cursor-pointer transition-all duration-300 border border-cod-surface hover:border-cod-orange group',
        className
      )}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <h3 className="font-display font-bold text-xl text-white mb-1 group-hover:text-cod-orange transition-colors">
            {weapon.name}
          </h3>
          <div className="flex items-center gap-2 text-sm">
            <span className="text-cod-blue">{weapon.category}</span>
            <span className="text-gray-500">•</span>
            <span className="text-gray-400">{weapon.game}</span>
          </div>
        </div>
        <TierBadge tier={weapon.meta.tier} />
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        <div className="space-y-1">
          <div className="text-xs text-gray-400">Damage</div>
          <div className="h-1.5 bg-cod-surface rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-red-500 to-red-600 rounded-full"
              style={{ width: `${weapon.stats.damage}%` }}
            />
          </div>
        </div>
        <div className="space-y-1">
          <div className="text-xs text-gray-400">Range</div>
          <div className="h-1.5 bg-cod-surface rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-blue-500 to-blue-600 rounded-full"
              style={{ width: `${weapon.stats.range}%` }}
            />
          </div>
        </div>
        <div className="space-y-1">
          <div className="text-xs text-gray-400">Accuracy</div>
          <div className="h-1.5 bg-cod-surface rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-green-500 to-green-600 rounded-full"
              style={{ width: `${weapon.stats.accuracy}%` }}
            />
          </div>
        </div>
      </div>

      {/* Meta Stats */}
      <div className="flex items-center justify-between pt-4 border-t border-cod-surface">
        <div className="flex items-center gap-2 text-sm">
          <Users className="h-4 w-4 text-gray-400" />
          <span className="text-gray-400">{weapon.meta.popularity}%</span>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <TrendingUp className="h-4 w-4 text-cod-green" />
          <span className="text-cod-green font-semibold">{weapon.meta.winRate}% WR</span>
        </div>
      </div>
    </motion.div>
  );
}

/**
 * Memoized WeaponCard for optimal performance
 * Prevents unnecessary re-renders when weapon data hasn't changed
 */
export const WeaponCard = memo(WeaponCardComponent);
WeaponCard.displayName = 'WeaponCard';
