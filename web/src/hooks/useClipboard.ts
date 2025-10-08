import { useState, useCallback } from 'react';

interface UseClipboardOptions {
  timeout?: number;
  onSuccess?: () => void;
  onError?: (error: Error) => void;
}

interface UseClipboardReturn {
  copied: boolean;
  copy: (text: string) => Promise<boolean>;
  reset: () => void;
  error: Error | null;
}

/**
 * Hook for copying text to clipboard with fallback support
 * Provides feedback state and error handling
 */
export const useClipboard = (options: UseClipboardOptions = {}): UseClipboardReturn => {
  const { timeout = 2000, onSuccess, onError } = options;

  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const reset = useCallback(() => {
    setCopied(false);
    setError(null);
  }, []);

  const copy = useCallback(async (text: string): Promise<boolean> => {
    if (!text) {
      const err = new Error('No text provided to copy');
      setError(err);
      onError?.(err);
      return false;
    }

    try {
      // Try modern Clipboard API first
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(text);
        setCopied(true);
        setError(null);
        onSuccess?.();

        // Reset copied state after timeout
        setTimeout(() => {
          setCopied(false);
        }, timeout);

        return true;
      } else {
        // Fallback for older browsers or non-secure contexts
        return fallbackCopy(text);
      }
    } catch (err) {
      // If Clipboard API fails, try fallback
      return fallbackCopy(text);
    }
  }, [timeout, onSuccess, onError]);

  const fallbackCopy = (text: string): boolean => {
    try {
      // Create a temporary textarea element
      const textarea = document.createElement('textarea');
      textarea.value = text;

      // Make it invisible but accessible
      textarea.style.position = 'fixed';
      textarea.style.left = '-9999px';
      textarea.style.top = '-9999px';
      textarea.setAttribute('readonly', '');

      document.body.appendChild(textarea);

      // Select and copy the text
      textarea.select();
      textarea.setSelectionRange(0, text.length);

      const successful = document.execCommand('copy');
      document.body.removeChild(textarea);

      if (successful) {
        setCopied(true);
        setError(null);
        onSuccess?.();

        // Reset copied state after timeout
        setTimeout(() => {
          setCopied(false);
        }, timeout);

        return true;
      } else {
        throw new Error('Failed to copy text');
      }
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to copy text');
      setError(error);
      onError?.(error);
      return false;
    }
  };

  return {
    copied,
    copy,
    reset,
    error,
  };
};

/**
 * Simplified hook that just returns the copy function
 */
export const useCopyToClipboard = () => {
  const copy = useCallback(async (text: string): Promise<boolean> => {
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(text);
        return true;
      } else {
        const textarea = document.createElement('textarea');
        textarea.value = text;
        textarea.style.position = 'fixed';
        textarea.style.left = '-9999px';
        document.body.appendChild(textarea);
        textarea.select();
        const successful = document.execCommand('copy');
        document.body.removeChild(textarea);
        return successful;
      }
    } catch {
      return false;
    }
  }, []);

  return copy;
};
