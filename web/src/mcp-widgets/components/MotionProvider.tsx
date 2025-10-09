import React from 'react';
import { LazyMotion, domAnimation } from 'framer-motion';

/**
 * MotionProvider - Optimized motion wrapper using LazyMotion
 *
 * This component uses Framer Motion's LazyMotion feature with domAnimation
 * to reduce bundle size by ~8KB by only loading the animation features we use.
 *
 * Features included in domAnimation:
 * - animate
 * - whileHover
 * - whileTap
 * - whileFocus
 * - whileDrag
 * - whileInView
 * - exit
 *
 * Features NOT included (reduces bundle size):
 * - layout animations
 * - drag animations beyond basic support
 * - advanced physics
 */

interface MotionProviderProps {
  children: React.ReactNode;
}

export const MotionProvider: React.FC<MotionProviderProps> = ({ children }) => {
  return (
    <LazyMotion features={domAnimation} strict>
      {children}
    </LazyMotion>
  );
};

export default MotionProvider;
