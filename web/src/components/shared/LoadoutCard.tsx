'use client';

import { motion } from 'framer-motion';
import { Star, Trash2, Share2, Edit } from 'lucide-react';
import { TierBadge } from './TierBadge';
import { cn } from '@/lib/utils/cn';

interface LoadoutCardProps {
  loadout: {
    id: string;
    name: string;
    game: string;
    primary: {
      weapon: {
        name: string;
        category: string;
        meta: {
          tier: 'S' | 'A' | 'B' | 'C' | 'D';
        };
      };
      attachments: Array<{ name: string }>;
    };
    effectiveRange: string;
    difficulty: string;
    overallRating?: number;
    favorites?: number;
  };
  onEdit?: () => void;
  onDelete?: () => void;
  onShare?: () => void;
  onFavorite?: () => void;
  showActions?: boolean;
  className?: string;
}

export function LoadoutCard({
  loadout,
  onEdit,
  onDelete,
  onShare,
  showActions = true,
  className,
}: LoadoutCardProps) {
  return (
    <motion.div
      whileHover={{ scale: 1.01 }}
      className={cn(
        'glass-premium rounded-xl p-6 border border-cod-surface hover:border-cod-orange transition-all duration-300',
        className
      )}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <h3 className="font-display font-bold text-xl text-white mb-1">
            {loadout.name}
          </h3>
          <span className="text-sm text-cod-blue">{loadout.game}</span>
        </div>
        <TierBadge tier={loadout.primary.weapon.meta.tier} />
      </div>

      {/* Weapon */}
      <div className="mb-4">
        <div className="flex items-center gap-2 mb-2">
          <h4 className="font-semibold text-white">{loadout.primary.weapon.name}</h4>
          <span className="text-sm text-gray-400">({loadout.primary.weapon.category})</span>
        </div>

        {/* Attachments */}
        <div className="flex flex-wrap gap-2">
          {loadout.primary.attachments.slice(0, 5).map((att, idx) => (
            <span
              key={idx}
              className="px-2 py-1 bg-cod-surface rounded text-xs text-gray-300"
            >
              {att.name}
            </span>
          ))}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="bg-cod-surface/50 rounded-lg p-3">
          <div className="text-xs text-gray-400 mb-1">Effective Range</div>
          <div className="text-sm font-semibold text-white">{loadout.effectiveRange}</div>
        </div>
        <div className="bg-cod-surface/50 rounded-lg p-3">
          <div className="text-xs text-gray-400 mb-1">Difficulty</div>
          <div className="text-sm font-semibold text-white">{loadout.difficulty}</div>
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between pt-4 border-t border-cod-surface">
        <div className="flex items-center gap-4">
          {loadout.overallRating && (
            <div className="flex items-center gap-1">
              <Star className="h-4 w-4 text-cod-orange fill-cod-orange" />
              <span className="text-sm font-semibold text-white">
                {loadout.overallRating.toFixed(1)}
              </span>
            </div>
          )}
          {loadout.favorites !== undefined && (
            <div className="flex items-center gap-1">
              <Star className="h-4 w-4 text-gray-400" />
              <span className="text-sm text-gray-400">{loadout.favorites}</span>
            </div>
          )}
        </div>

        {showActions && (
          <div className="flex items-center gap-2">
            {onShare && (
              <button
                onClick={onShare}
                className="p-2 hover:bg-cod-surface rounded-lg transition-colors"
                title="Share"
              >
                <Share2 className="h-4 w-4 text-gray-400 hover:text-cod-blue" />
              </button>
            )}
            {onEdit && (
              <button
                onClick={onEdit}
                className="p-2 hover:bg-cod-surface rounded-lg transition-colors"
                title="Edit"
              >
                <Edit className="h-4 w-4 text-gray-400 hover:text-cod-green" />
              </button>
            )}
            {onDelete && (
              <button
                onClick={onDelete}
                className="p-2 hover:bg-cod-surface rounded-lg transition-colors"
                title="Delete"
              >
                <Trash2 className="h-4 w-4 text-gray-400 hover:text-red-400" />
              </button>
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
}
