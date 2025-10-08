'use client';

import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface ErrorFallbackProps {
  error: Error | null;
  resetError?: () => void;
}

/**
 * Error Fallback UI Component
 *
 * Displays a user-friendly error message with actions to recover.
 * Used by ErrorBoundary components when an error is caught.
 *
 * Features:
 * - Shows error message (sanitized for production)
 * - Provides "Try Again" action to reset the error boundary
 * - Provides "Go Home" action to navigate to safety
 * - Consistent with app's design system
 */
export function ErrorFallback({ error, resetError }: ErrorFallbackProps) {
  const router = useRouter();

  const handleGoHome = () => {
    if (resetError) {
      resetError();
    }
    router.push('/');
  };

  const handleTryAgain = () => {
    if (resetError) {
      resetError();
    } else {
      // Fallback: reload the page
      window.location.reload();
    }
  };

  // In production, show generic message; in dev, show actual error
  const errorMessage =
    process.env.NODE_ENV === 'development'
      ? error?.message || 'An unexpected error occurred'
      : 'Something went wrong. Please try again.';

  const showStack = process.env.NODE_ENV === 'development' && error?.stack;

  return (
    <div className="flex min-h-screen items-center justify-center bg-cod-black px-4">
      <div className="w-full max-w-md space-y-6 text-center">
        {/* Error Icon */}
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-red-500/10 ring-1 ring-red-500/20">
          <AlertTriangle className="h-10 w-10 text-red-500" />
        </div>

        {/* Error Title */}
        <div className="space-y-2">
          <h1 className="text-4xl font-bold text-cod-accent">
            Oops!
          </h1>
          <p className="text-lg text-gray-400">
            {errorMessage}
          </p>
        </div>

        {/* Error Details (Dev only) */}
        {showStack && (
          <div className="rounded-lg border border-red-500/20 bg-red-500/10 p-4 text-left">
            <p className="mb-2 font-semibold text-red-400">Error Stack:</p>
            <pre className="overflow-x-auto font-mono text-xs text-red-300">
              {error.stack}
            </pre>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-4">
          <button
            onClick={handleTryAgain}
            className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-cod-accent px-6 py-3 font-semibold text-cod-black transition-colors hover:bg-cod-accent/90"
          >
            <RefreshCw className="h-5 w-5" />
            Try Again
          </button>
          <button
            onClick={handleGoHome}
            className="flex flex-1 items-center justify-center gap-2 rounded-lg border border-cod-surface bg-cod-gray px-6 py-3 font-semibold text-white transition-colors hover:bg-cod-surface"
          >
            <Home className="h-5 w-5" />
            Go Home
          </button>
        </div>

        {/* Help Text */}
        <p className="text-sm text-gray-500">
          If this problem persists, please contact support or try again later.
        </p>
      </div>
    </div>
  );
}
