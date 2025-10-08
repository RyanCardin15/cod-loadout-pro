import { useCallback, useState } from 'react';
import { toast } from 'sonner';

interface MicroInteractionOptions {
  haptic?: boolean;
  sound?: boolean;
  visual?: boolean;
}

interface RipplePosition {
  x: number;
  y: number;
}

export const useMicroInteractions = () => {
  const [ripples, setRipples] = useState<RipplePosition[]>([]);

  /**
   * Trigger haptic feedback (mobile devices)
   * Uses the Vibration API with a short, subtle vibration
   */
  const triggerHaptic = useCallback((pattern: number | number[] = 10) => {
    if ('vibrate' in navigator) {
      try {
        navigator.vibrate(pattern);
      } catch (error) {
        // Silently fail if vibration is not supported or blocked
        console.debug('Haptic feedback not available:', error);
      }
    }
  }, []);

  /**
   * Create a ripple effect at the click position
   * Returns the position for CSS animation
   */
  const createRipple = useCallback((event: React.MouseEvent<HTMLElement>) => {
    const element = event.currentTarget;
    const rect = element.getBoundingClientRect();

    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    setRipples(prev => [...prev, { x, y }]);

    // Remove ripple after animation completes
    setTimeout(() => {
      setRipples(prev => prev.slice(1));
    }, 600);

    return { x, y };
  }, []);

  /**
   * Handle click interaction with multiple feedback types
   */
  const handleInteraction = useCallback((
    event: React.MouseEvent<HTMLElement>,
    options: MicroInteractionOptions = {}
  ) => {
    const { haptic = true, visual = true } = options;

    if (haptic) {
      triggerHaptic(10); // Short, subtle vibration
    }

    if (visual) {
      createRipple(event);
    }
  }, [triggerHaptic, createRipple]);

  /**
   * Show a success toast with haptic feedback
   */
  const showSuccess = useCallback((message: string, options: MicroInteractionOptions = {}) => {
    const { haptic = true } = options;

    if (haptic) {
      triggerHaptic([10, 30, 10]); // Success pattern: short-long-short
    }

    toast.success(message, {
      duration: 2000,
      className: 'bg-gradient-to-br from-green-900/95 to-green-800/95 backdrop-blur-xl border border-green-500/30 text-white',
    });
  }, [triggerHaptic]);

  /**
   * Show an error toast with haptic feedback
   */
  const showError = useCallback((message: string, options: MicroInteractionOptions = {}) => {
    const { haptic = true } = options;

    if (haptic) {
      triggerHaptic([30, 10, 30, 10, 30]); // Error pattern: long vibrations
    }

    toast.error(message, {
      duration: 3000,
      className: 'bg-gradient-to-br from-red-900/95 to-red-800/95 backdrop-blur-xl border border-red-500/30 text-white',
    });
  }, [triggerHaptic]);

  /**
   * Show an info toast with haptic feedback
   */
  const showInfo = useCallback((message: string, options: MicroInteractionOptions = {}) => {
    const { haptic = true } = options;

    if (haptic) {
      triggerHaptic(15); // Medium vibration
    }

    toast.info(message, {
      duration: 2500,
      className: 'bg-gradient-to-br from-blue-900/95 to-blue-800/95 backdrop-blur-xl border border-blue-500/30 text-white',
    });
  }, [triggerHaptic]);

  /**
   * Show a warning toast with haptic feedback
   */
  const showWarning = useCallback((message: string, options: MicroInteractionOptions = {}) => {
    const { haptic = true } = options;

    if (haptic) {
      triggerHaptic([20, 20, 20]); // Warning pattern: three equal vibrations
    }

    toast.warning(message, {
      duration: 3000,
      className: 'bg-gradient-to-br from-yellow-900/95 to-yellow-800/95 backdrop-blur-xl border border-yellow-500/30 text-white',
    });
  }, [triggerHaptic]);

  /**
   * Trigger a subtle button press feedback
   */
  const buttonPress = useCallback(() => {
    triggerHaptic(8); // Very short, light tap
  }, [triggerHaptic]);

  /**
   * Trigger a toggle feedback (for switches, checkboxes)
   */
  const toggleFeedback = useCallback((isOn: boolean) => {
    triggerHaptic(isOn ? [5, 5, 10] : 8); // Slightly different patterns for on/off
  }, [triggerHaptic]);

  return {
    // Core functions
    handleInteraction,
    createRipple,
    triggerHaptic,

    // Toast notifications
    showSuccess,
    showError,
    showInfo,
    showWarning,

    // Specialized interactions
    buttonPress,
    toggleFeedback,

    // State
    ripples,
  };
};
