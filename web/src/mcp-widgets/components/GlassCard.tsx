import React from 'react';
import { motion, HTMLMotionProps } from 'framer-motion';
import { cn } from '@/lib/utils';

export type GlassCardVariant =
  | 'primary'
  | 'secondary'
  | 'accent'
  | 'danger'
  | 'success'
  | 'info'
  | 'warning';

export interface GlassCardProps extends Omit<HTMLMotionProps<'div'>, 'className'> {
  variant?: GlassCardVariant;
  interactive?: boolean;
  hover?: boolean;
  className?: string;
  children: React.ReactNode;
}

const variantStyles: Record<GlassCardVariant, string> = {
  primary: 'bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-2xl border border-white/20 shadow-2xl',
  secondary: 'bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-2xl border border-white/20 shadow-2xl',
  accent: 'bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-2xl border border-white/20 shadow-2xl',
  danger: 'bg-gradient-to-br from-red-900/20 to-red-900/10 backdrop-blur-xl border border-red-500/30 shadow-xl',
  success: 'bg-gradient-to-br from-green-900/20 to-green-900/10 backdrop-blur-xl border border-green-500/30 shadow-xl',
  info: 'bg-gradient-to-br from-blue-900/20 to-blue-900/10 backdrop-blur-xl border border-blue-500/30 shadow-xl',
  warning: 'bg-gradient-to-br from-yellow-900/20 to-yellow-900/10 backdrop-blur-xl border border-yellow-500/30 shadow-xl',
};

const hoverVariantStyles: Record<GlassCardVariant, string> = {
  primary: 'hover:border-cod-orange',
  secondary: 'hover:border-cod-orange/60',
  accent: 'hover:border-purple-500/60',
  danger: 'hover:border-red-500/60',
  success: 'hover:border-green-500/60',
  info: 'hover:border-blue-500/60',
  warning: 'hover:border-yellow-500/60',
};

export const GlassCard: React.FC<GlassCardProps> = ({
  variant = 'primary',
  interactive = false,
  hover = true,
  className,
  children,
  ...motionProps
}) => {
  const baseClasses = 'rounded-xl p-6 transition-all duration-300';
  const variantClasses = variantStyles[variant];
  const hoverClasses = hover ? hoverVariantStyles[variant] : '';
  const interactiveClasses = interactive ? 'ripple' : '';

  return (
    <motion.div
      className={cn(
        baseClasses,
        variantClasses,
        hoverClasses,
        interactiveClasses,
        className
      )}
      {...motionProps}
    >
      {children}
    </motion.div>
  );
};

export default GlassCard;
