import React from 'react';
import * as TooltipPrimitive from '@radix-ui/react-tooltip';
import { cn } from '@/lib/utils/cn';

interface TooltipProps {
  children: React.ReactNode;
  content: React.ReactNode;
  side?: 'top' | 'right' | 'bottom' | 'left';
  align?: 'start' | 'center' | 'end';
  delayDuration?: number;
  className?: string;
}

export const TooltipProvider = TooltipPrimitive.Provider;

export const Tooltip: React.FC<TooltipProps> = ({
  children,
  content,
  side = 'top',
  align = 'center',
  delayDuration = 200,
  className
}) => {
  return (
    <TooltipPrimitive.Root delayDuration={delayDuration}>
      <TooltipPrimitive.Trigger asChild>
        {children}
      </TooltipPrimitive.Trigger>
      <TooltipPrimitive.Portal>
        <TooltipPrimitive.Content
          side={side}
          align={align}
          sideOffset={5}
          className={cn(
            // Base styles
            'z-50 overflow-hidden rounded-lg px-3 py-2 text-sm',
            // COD themed glassmorphism
            'bg-gradient-to-br from-cod-black/95 to-cod-gray/95 backdrop-blur-xl',
            'border border-cod-orange/30 shadow-2xl',
            // Text styling
            'text-white font-medium',
            // Glow effect
            'shadow-[0_0_20px_rgba(255,107,0,0.3)]',
            // Animation
            'animate-in fade-in-0 zoom-in-95',
            'data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95',
            'data-[side=bottom]:slide-in-from-top-2',
            'data-[side=left]:slide-in-from-right-2',
            'data-[side=right]:slide-in-from-left-2',
            'data-[side=top]:slide-in-from-bottom-2',
            className
          )}
        >
          {content}
          <TooltipPrimitive.Arrow
            className="fill-cod-orange/30"
            width={11}
            height={5}
          />
        </TooltipPrimitive.Content>
      </TooltipPrimitive.Portal>
    </TooltipPrimitive.Root>
  );
};

// Specialized stat tooltip
interface StatTooltipProps {
  label: string;
  value: number;
  description?: string;
  children: React.ReactNode;
}

export const StatTooltip: React.FC<StatTooltipProps> = ({
  label,
  value,
  description,
  children
}) => {
  return (
    <Tooltip
      content={
        <div className="max-w-xs">
          <div className="flex items-center justify-between mb-1">
            <span className="text-cod-orange font-semibold uppercase tracking-wide text-xs">
              {label}
            </span>
            <span className="text-white font-bold text-sm">{value}</span>
          </div>
          {description && (
            <p className="text-gray-300 text-xs mt-1">{description}</p>
          )}
        </div>
      }
    >
      {children}
    </Tooltip>
  );
};

// Tier badge tooltip
interface TierTooltipProps {
  tier: string;
  description: string;
  children: React.ReactNode;
}

export const TierTooltip: React.FC<TierTooltipProps> = ({
  tier,
  description,
  children
}) => {
  return (
    <Tooltip
      content={
        <div className="max-w-xs">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-cod-orange font-bold text-lg">{tier}-TIER</span>
          </div>
          <p className="text-gray-300 text-xs">{description}</p>
        </div>
      }
    >
      {children}
    </Tooltip>
  );
};

// Attachment tooltip
interface AttachmentTooltipProps {
  name: string;
  slot: string;
  effect?: string;
  children: React.ReactNode;
}

export const AttachmentTooltip: React.FC<AttachmentTooltipProps> = ({
  name,
  slot,
  effect,
  children
}) => {
  return (
    <Tooltip
      content={
        <div className="max-w-xs">
          <div className="mb-1">
            <span className="text-cod-orange font-semibold uppercase tracking-wide text-xs">
              {slot}
            </span>
          </div>
          <div className="text-white font-bold text-sm mb-1">{name}</div>
          {effect && (
            <p className="text-gray-300 text-xs mt-1">{effect}</p>
          )}
        </div>
      }
    >
      {children}
    </Tooltip>
  );
};

// Effectiveness tooltip
interface EffectivenessTooltipProps {
  percentage: number;
  description?: string;
  children: React.ReactNode;
}

export const EffectivenessTooltip: React.FC<EffectivenessTooltipProps> = ({
  percentage,
  description,
  children
}) => {
  const getEffectivenessLabel = (pct: number) => {
    if (pct >= 90) return { label: 'Excellent', color: 'text-green-400' };
    if (pct >= 75) return { label: 'Very Good', color: 'text-green-300' };
    if (pct >= 60) return { label: 'Good', color: 'text-yellow-400' };
    if (pct >= 40) return { label: 'Fair', color: 'text-orange-400' };
    return { label: 'Poor', color: 'text-red-400' };
  };

  const effectiveness = getEffectivenessLabel(percentage);

  return (
    <Tooltip
      content={
        <div className="max-w-xs">
          <div className="flex items-center justify-between mb-1">
            <span className="text-cod-orange font-semibold uppercase tracking-wide text-xs">
              Effectiveness
            </span>
            <span className={cn('font-bold text-sm', effectiveness.color)}>
              {effectiveness.label}
            </span>
          </div>
          <div className="text-white font-bold text-lg mb-1">{percentage}%</div>
          {description && (
            <p className="text-gray-300 text-xs mt-1">{description}</p>
          )}
        </div>
      }
    >
      {children}
    </Tooltip>
  );
};

// Info tooltip with icon
interface InfoTooltipProps {
  content: React.ReactNode;
  children: React.ReactNode;
}

export const InfoTooltip: React.FC<InfoTooltipProps> = ({
  content,
  children
}) => {
  return (
    <Tooltip
      content={
        <div className="max-w-xs text-gray-300 text-xs">
          {content}
        </div>
      }
    >
      {children}
    </Tooltip>
  );
};
