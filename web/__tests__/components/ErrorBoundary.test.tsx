/**
 * ErrorBoundary Component Tests
 *
 * Tests the ErrorBoundary component for:
 * - Catching and handling errors
 * - Rendering fallback UI
 * - Logging errors
 * - Reset functionality
 * - Custom fallback support
 */

import React from 'react';
import { screen } from '@testing-library/react';
import { ErrorBoundary } from '@/components/errors/ErrorBoundary';
import { renderWithProviders, suppressConsoleError } from '../setup/testUtils';

// Component that throws an error
const ThrowError = ({ shouldThrow = true }: { shouldThrow?: boolean }) => {
  if (shouldThrow) {
    throw new Error('Test error');
  }
  return <div>No error</div>;
};

describe('ErrorBoundary', () => {
  describe('Error Catching', () => {
    it('catches errors and displays fallback UI', () => {
      const restore = suppressConsoleError();

      renderWithProviders(
        <ErrorBoundary>
          <ThrowError />
        </ErrorBoundary>
      );

      // Default fallback should show "Oops!"
      expect(screen.getByText('Oops!')).toBeInTheDocument();

      restore();
    });

    it('renders children when no error occurs', () => {
      renderWithProviders(
        <ErrorBoundary>
          <ThrowError shouldThrow={false} />
        </ErrorBoundary>
      );

      expect(screen.getByText('No error')).toBeInTheDocument();
      expect(screen.queryByText('Oops!')).not.toBeInTheDocument();
    });

    it('catches errors in nested components', () => {
      const restore = suppressConsoleError();

      const NestedComponent = () => (
        <div>
          <div>
            <ThrowError />
          </div>
        </div>
      );

      renderWithProviders(
        <ErrorBoundary>
          <NestedComponent />
        </ErrorBoundary>
      );

      expect(screen.getByText('Oops!')).toBeInTheDocument();

      restore();
    });
  });

  describe('Custom Fallback', () => {
    it('renders custom fallback when provided', () => {
      const restore = suppressConsoleError();

      const CustomFallback = <div>Custom error message</div>;

      renderWithProviders(
        <ErrorBoundary fallback={CustomFallback}>
          <ThrowError />
        </ErrorBoundary>
      );

      expect(screen.getByText('Custom error message')).toBeInTheDocument();
      expect(screen.queryByText('Oops!')).not.toBeInTheDocument();

      restore();
    });
  });

  describe('Error Callback', () => {
    it('calls onError callback when error is caught', () => {
      const restore = suppressConsoleError();
      const onError = jest.fn();

      renderWithProviders(
        <ErrorBoundary onError={onError}>
          <ThrowError />
        </ErrorBoundary>
      );

      expect(onError).toHaveBeenCalledTimes(1);
      expect(onError).toHaveBeenCalledWith(
        expect.any(Error),
        expect.objectContaining({
          componentStack: expect.any(String),
        })
      );

      restore();
    });

    it('does not call onError when no error occurs', () => {
      const onError = jest.fn();

      renderWithProviders(
        <ErrorBoundary onError={onError}>
          <ThrowError shouldThrow={false} />
        </ErrorBoundary>
      );

      expect(onError).not.toHaveBeenCalled();
    });
  });

  describe('Reset Functionality', () => {
    it('displays Try Again button in fallback', () => {
      const restore = suppressConsoleError();

      renderWithProviders(
        <ErrorBoundary>
          <ThrowError />
        </ErrorBoundary>
      );

      expect(screen.getByText('Try Again')).toBeInTheDocument();

      restore();
    });

    it('displays Go Home button in fallback', () => {
      const restore = suppressConsoleError();

      renderWithProviders(
        <ErrorBoundary>
          <ThrowError />
        </ErrorBoundary>
      );

      expect(screen.getByText('Go Home')).toBeInTheDocument();

      restore();
    });
  });

  describe('Error Message Display', () => {
    it('shows error message in development mode', () => {
      const restore = suppressConsoleError();
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';

      renderWithProviders(
        <ErrorBoundary>
          <ThrowError />
        </ErrorBoundary>
      );

      // In development, the actual error message should be visible
      expect(screen.getByText(/Test error/i)).toBeInTheDocument();

      process.env.NODE_ENV = originalEnv;
      restore();
    });
  });

  describe('Multiple Errors', () => {
    it('handles multiple error boundaries independently', () => {
      const restore = suppressConsoleError();

      renderWithProviders(
        <div>
          <ErrorBoundary>
            <ThrowError />
          </ErrorBoundary>
          <ErrorBoundary>
            <div>Working component</div>
          </ErrorBoundary>
        </div>
      );

      // First boundary shows error
      expect(screen.getByText('Oops!')).toBeInTheDocument();
      // Second boundary renders normally
      expect(screen.getByText('Working component')).toBeInTheDocument();

      restore();
    });
  });

  describe('Edge Cases', () => {
    it('handles string errors', () => {
      const restore = suppressConsoleError();

      const ThrowString = () => {
        throw 'String error';
      };

      renderWithProviders(
        <ErrorBoundary>
          <ThrowString />
        </ErrorBoundary>
      );

      expect(screen.getByText('Oops!')).toBeInTheDocument();

      restore();
    });

    it('handles undefined/null errors', () => {
      const restore = suppressConsoleError();

      const ThrowUndefined = () => {
        throw undefined;
      };

      renderWithProviders(
        <ErrorBoundary>
          <ThrowUndefined />
        </ErrorBoundary>
      );

      expect(screen.getByText('Oops!')).toBeInTheDocument();

      restore();
    });

    it('handles object errors', () => {
      const restore = suppressConsoleError();

      const ThrowObject = () => {
        throw { message: 'Object error' };
      };

      renderWithProviders(
        <ErrorBoundary>
          <ThrowObject />
        </ErrorBoundary>
      );

      expect(screen.getByText('Oops!')).toBeInTheDocument();

      restore();
    });
  });
});
