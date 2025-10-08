import { useEffect, useRef, useCallback, RefObject } from 'react';

interface KeyboardNavOptions {
  enabled?: boolean;
  loop?: boolean;
  orientation?: 'horizontal' | 'vertical' | 'both';
  onSelect?: (index: number) => void;
  onEscape?: () => void;
}

interface KeyboardNavReturn {
  focusedIndex: number;
  setFocusedIndex: (index: number) => void;
  handleKeyDown: (event: React.KeyboardEvent) => void;
  getItemProps: (index: number) => {
    tabIndex: number;
    'data-focused': boolean;
    onKeyDown: (event: React.KeyboardEvent) => void;
    onFocus: () => void;
    ref: RefObject<HTMLElement>;
  };
}

/**
 * Hook for managing keyboard navigation in lists and grids
 * Supports arrow keys, Enter, Space, and Escape
 */
export const useKeyboardNav = (
  itemCount: number,
  options: KeyboardNavOptions = {}
): KeyboardNavReturn => {
  const {
    enabled = true,
    loop = true,
    orientation = 'vertical',
    onSelect,
    onEscape,
  } = options;

  const focusedIndexRef = useRef(0);
  const itemRefs = useRef<Map<number, RefObject<HTMLElement>>>(new Map());

  const setFocusedIndex = useCallback((index: number) => {
    if (index < 0 || index >= itemCount) return;
    focusedIndexRef.current = index;

    // Focus the actual DOM element
    const itemRef = itemRefs.current.get(index);
    if (itemRef?.current) {
      itemRef.current.focus();
    }
  }, [itemCount]);

  const moveFocus = useCallback((direction: 'up' | 'down' | 'left' | 'right') => {
    if (!enabled || itemCount === 0) return;

    let newIndex = focusedIndexRef.current;

    switch (direction) {
      case 'up':
        if (orientation === 'vertical' || orientation === 'both') {
          newIndex = newIndex - 1;
        }
        break;
      case 'down':
        if (orientation === 'vertical' || orientation === 'both') {
          newIndex = newIndex + 1;
        }
        break;
      case 'left':
        if (orientation === 'horizontal' || orientation === 'both') {
          newIndex = newIndex - 1;
        }
        break;
      case 'right':
        if (orientation === 'horizontal' || orientation === 'both') {
          newIndex = newIndex + 1;
        }
        break;
    }

    // Handle looping
    if (loop) {
      if (newIndex < 0) {
        newIndex = itemCount - 1;
      } else if (newIndex >= itemCount) {
        newIndex = 0;
      }
    } else {
      newIndex = Math.max(0, Math.min(itemCount - 1, newIndex));
    }

    setFocusedIndex(newIndex);
  }, [enabled, itemCount, loop, orientation, setFocusedIndex]);

  const handleKeyDown = useCallback((event: React.KeyboardEvent) => {
    if (!enabled) return;

    switch (event.key) {
      case 'ArrowUp':
        event.preventDefault();
        moveFocus('up');
        break;
      case 'ArrowDown':
        event.preventDefault();
        moveFocus('down');
        break;
      case 'ArrowLeft':
        event.preventDefault();
        moveFocus('left');
        break;
      case 'ArrowRight':
        event.preventDefault();
        moveFocus('right');
        break;
      case 'Home':
        event.preventDefault();
        setFocusedIndex(0);
        break;
      case 'End':
        event.preventDefault();
        setFocusedIndex(itemCount - 1);
        break;
      case 'Enter':
      case ' ':
        event.preventDefault();
        onSelect?.(focusedIndexRef.current);
        break;
      case 'Escape':
        event.preventDefault();
        onEscape?.();
        break;
    }
  }, [enabled, itemCount, moveFocus, setFocusedIndex, onSelect, onEscape]);

  const getItemProps = useCallback((index: number) => {
    if (!itemRefs.current.has(index)) {
      itemRefs.current.set(index, { current: null });
    }

    return {
      tabIndex: focusedIndexRef.current === index ? 0 : -1,
      'data-focused': focusedIndexRef.current === index,
      onKeyDown: handleKeyDown,
      onFocus: () => setFocusedIndex(index),
      ref: itemRefs.current.get(index)!,
    };
  }, [handleKeyDown, setFocusedIndex]);

  return {
    focusedIndex: focusedIndexRef.current,
    setFocusedIndex,
    handleKeyDown,
    getItemProps,
  };
};

/**
 * Hook for managing focus trap within a modal or dialog
 */
export const useFocusTrap = (enabled: boolean = true) => {
  const containerRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (!enabled || !containerRef.current) return;

    const container = containerRef.current;
    const focusableElements = container.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );

    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Tab') return;

      if (event.shiftKey) {
        // Shift + Tab
        if (document.activeElement === firstElement) {
          event.preventDefault();
          lastElement?.focus();
        }
      } else {
        // Tab
        if (document.activeElement === lastElement) {
          event.preventDefault();
          firstElement?.focus();
        }
      }
    };

    container.addEventListener('keydown', handleKeyDown);

    // Focus first element on mount
    firstElement?.focus();

    return () => {
      container.removeEventListener('keydown', handleKeyDown);
    };
  }, [enabled]);

  return containerRef;
};

/**
 * Hook for handling escape key press
 */
export const useEscapeKey = (callback: () => void, enabled: boolean = true) => {
  useEffect(() => {
    if (!enabled) return;

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        callback();
      }
    };

    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [callback, enabled]);
};
