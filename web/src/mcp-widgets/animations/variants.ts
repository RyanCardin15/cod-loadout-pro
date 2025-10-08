import { Variants, Transition } from 'framer-motion';

// Common animation variants
export const fadeInUp: Variants = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 },
};

export const fadeInDown: Variants = {
  initial: { opacity: 0, y: -20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: 20 },
};

export const fadeIn: Variants = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
};

export const scaleIn: Variants = {
  initial: { opacity: 0, scale: 0.95 },
  animate: { opacity: 1, scale: 1 },
  exit: { opacity: 0, scale: 0.95 },
};

export const slideInLeft: Variants = {
  initial: { opacity: 0, x: -20 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: 20 },
};

export const slideInRight: Variants = {
  initial: { opacity: 0, x: 20 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -20 },
};

// Interactive variants
export const hoverScale: Variants = {
  initial: { scale: 1 },
  hover: { scale: 1.02, y: -5 },
  tap: { scale: 0.98 },
};

export const hoverSlideRight: Variants = {
  initial: { x: 0 },
  hover: { x: 5 },
};

// Stagger helpers
export function staggerContainer(delayChildren = 0.1): Variants {
  return {
    animate: {
      transition: {
        staggerChildren: delayChildren,
      },
    },
  };
}

export function staggerItem(index: number, baseDelay = 0.05): Transition {
  return {
    delay: baseDelay * index,
  };
}

// Transition presets
export const transitions = {
  fast: { duration: 0.2, ease: 'easeOut' } as Transition,
  normal: { duration: 0.3, ease: 'easeOut' } as Transition,
  slow: { duration: 0.5, ease: 'easeOut' } as Transition,
  spring: { type: 'spring', stiffness: 300, damping: 30 } as Transition,
  smooth: { duration: 0.8, ease: 'easeOut' } as Transition,
};

// Progress bar animation
export function progressBarAnimation(): Transition {
  return {
    duration: 0.8,
    ease: 'easeOut',
  };
}

// Shimmer animation (for use with CSS classes)
export const shimmerVariants: Variants = {
  initial: { x: '-100%' },
  animate: {
    x: '100%',
    transition: {
      repeat: Infinity,
      duration: 2,
      ease: 'linear',
    },
  },
};

// Combined variants for common use cases
export function createCardVariants(delay = 0): Variants {
  return {
    initial: { opacity: 0, y: 20 },
    animate: {
      opacity: 1,
      y: 0,
      transition: { delay, ...transitions.normal },
    },
  };
}

export function createHeaderVariants(): Variants {
  return {
    initial: { opacity: 0, y: -20 },
    animate: {
      opacity: 1,
      y: 0,
      transition: transitions.normal,
    },
  };
}

export function createListItemVariants(index: number): Variants {
  return {
    initial: { opacity: 0, x: -20 },
    animate: {
      opacity: 1,
      x: 0,
      transition: staggerItem(index),
    },
  };
}
