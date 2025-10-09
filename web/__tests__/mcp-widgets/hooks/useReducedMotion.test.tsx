import { renderHook, act } from '@testing-library/react';
import { useReducedMotion } from '@/mcp-widgets/hooks/useReducedMotion';

describe('useReducedMotion', () => {
  let mockMatchMedia: any;
  let mediaQueryListeners: Array<(event: MediaQueryListEvent) => void> = [];

  beforeEach(() => {
    mediaQueryListeners = [];

    // Mock matchMedia
    mockMatchMedia = jest.fn((query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: jest.fn((callback) => {
        mediaQueryListeners.push(callback);
      }),
      removeListener: jest.fn((callback) => {
        const index = mediaQueryListeners.indexOf(callback);
        if (index > -1) {
          mediaQueryListeners.splice(index, 1);
        }
      }),
      addEventListener: jest.fn((event, callback) => {
        if (event === 'change') {
          mediaQueryListeners.push(callback);
        }
      }),
      removeEventListener: jest.fn((event, callback) => {
        if (event === 'change') {
          const index = mediaQueryListeners.indexOf(callback);
          if (index > -1) {
            mediaQueryListeners.splice(index, 1);
          }
        }
      }),
      dispatchEvent: jest.fn(),
    }));

    window.matchMedia = mockMatchMedia;
  });

  afterEach(() => {
    mediaQueryListeners = [];
  });

  it('returns false when prefers-reduced-motion is not set', () => {
    mockMatchMedia.mockReturnValue({
      matches: false,
      media: '(prefers-reduced-motion: reduce)',
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
    });

    const { result } = renderHook(() => useReducedMotion());
    expect(result.current).toBe(false);
  });

  it('returns true when prefers-reduced-motion is set', () => {
    mockMatchMedia.mockReturnValue({
      matches: true,
      media: '(prefers-reduced-motion: reduce)',
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
    });

    const { result } = renderHook(() => useReducedMotion());
    expect(result.current).toBe(true);
  });

  it('updates when media query changes', () => {
    let changeCallback: ((event: MediaQueryListEvent) => void) | null = null;

    mockMatchMedia.mockReturnValue({
      matches: false,
      media: '(prefers-reduced-motion: reduce)',
      addEventListener: jest.fn((event, callback) => {
        if (event === 'change') {
          changeCallback = callback;
        }
      }),
      removeEventListener: jest.fn(),
    });

    const { result } = renderHook(() => useReducedMotion());
    expect(result.current).toBe(false);

    // Simulate media query change
    act(() => {
      if (changeCallback) {
        changeCallback({ matches: true } as MediaQueryListEvent);
      }
    });

    expect(result.current).toBe(true);
  });

  it('cleans up event listener on unmount', () => {
    const removeEventListener = jest.fn();
    const removeListener = jest.fn();

    mockMatchMedia.mockReturnValue({
      matches: false,
      media: '(prefers-reduced-motion: reduce)',
      addEventListener: jest.fn(),
      removeEventListener,
      removeListener,
    });

    const { unmount } = renderHook(() => useReducedMotion());

    unmount();

    // Should call either removeEventListener or removeListener
    expect(removeEventListener.mock.calls.length + removeListener.mock.calls.length).toBeGreaterThan(0);
  });

  it('handles missing matchMedia gracefully', () => {
    // Remove matchMedia from window
    const originalMatchMedia = window.matchMedia;
    (window as any).matchMedia = undefined;

    const { result } = renderHook(() => useReducedMotion());

    // Should return false when matchMedia is not available
    expect(result.current).toBe(false);

    // Restore
    window.matchMedia = originalMatchMedia;
  });

  it('uses modern addEventListener API when available', () => {
    const addEventListener = jest.fn();
    const removeEventListener = jest.fn();

    mockMatchMedia.mockReturnValue({
      matches: false,
      media: '(prefers-reduced-motion: reduce)',
      addEventListener,
      removeEventListener,
    });

    const { unmount } = renderHook(() => useReducedMotion());

    expect(addEventListener).toHaveBeenCalledWith('change', expect.any(Function));

    unmount();

    expect(removeEventListener).toHaveBeenCalledWith('change', expect.any(Function));
  });

  it('falls back to addListener API for older browsers', () => {
    const addListener = jest.fn();
    const removeListener = jest.fn();

    mockMatchMedia.mockReturnValue({
      matches: false,
      media: '(prefers-reduced-motion: reduce)',
      addEventListener: undefined,
      removeEventListener: undefined,
      addListener,
      removeListener,
    });

    const { unmount } = renderHook(() => useReducedMotion());

    expect(addListener).toHaveBeenCalledWith(expect.any(Function));

    unmount();

    expect(removeListener).toHaveBeenCalledWith(expect.any(Function));
  });

  it('matches the correct media query', () => {
    renderHook(() => useReducedMotion());

    expect(mockMatchMedia).toHaveBeenCalledWith('(prefers-reduced-motion: reduce)');
  });
});
