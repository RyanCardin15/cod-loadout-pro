'use client';

import React, { Component, ReactNode } from 'react';
import { logger } from '@/lib/logger';
import { usePathname } from 'next/navigation';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

/**
 * Route-specific Error Boundary
 *
 * Automatically resets when the route changes, preventing error states
 * from persisting across navigation.
 *
 * Usage:
 * ```tsx
 * <RouteErrorBoundary>
 *   <PageContent />
 * </RouteErrorBoundary>
 * ```
 */
class RouteErrorBoundaryClass extends Component<Props & { pathname: string }, State> {
  constructor(props: Props & { pathname: string }) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
    };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
    };
  }

  override componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    logger.error('Route Error Boundary caught an error', {
      error,
      componentStack: errorInfo.componentStack,
      pathname: this.props.pathname,
    });
  }

  override componentDidUpdate(prevProps: Props & { pathname: string }): void {
    // Reset error state when route changes
    if (prevProps.pathname !== this.props.pathname && this.state.hasError) {
      logger.debug('Route changed, resetting error boundary', {
        from: prevProps.pathname,
        to: this.props.pathname,
      });
      this.setState({
        hasError: false,
        error: null,
      });
    }
  }

  handleReset = (): void => {
    this.setState({
      hasError: false,
      error: null,
    });
  };

  override render(): ReactNode {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-screen items-center justify-center bg-cod-black px-4">
          <div className="w-full max-w-md space-y-6 text-center">
            <div className="space-y-2">
              <h1 className="text-4xl font-bold text-cod-accent">
                Route Error
              </h1>
              <p className="text-lg text-gray-400">
                Something went wrong loading this page
              </p>
            </div>

            {this.state.error && (
              <div className="rounded-lg border border-red-500/20 bg-red-500/10 p-4 text-left">
                <p className="font-mono text-sm text-red-400">
                  {this.state.error.message}
                </p>
              </div>
            )}

            <div className="flex gap-4">
              <button
                onClick={this.handleReset}
                className="flex-1 rounded-lg bg-cod-accent px-6 py-3 font-semibold text-cod-black transition-colors hover:bg-cod-accent/90"
              >
                Try Again
              </button>
              <button
                onClick={() => window.location.href = '/'}
                className="flex-1 rounded-lg border border-cod-surface bg-cod-gray px-6 py-3 font-semibold text-white transition-colors hover:bg-cod-surface"
              >
                Go Home
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

/**
 * Wrapper component that provides pathname to the class component
 */
export function RouteErrorBoundary({ children }: Props) {
  const pathname = usePathname();

  return (
    <RouteErrorBoundaryClass pathname={pathname}>
      {children}
    </RouteErrorBoundaryClass>
  );
}
