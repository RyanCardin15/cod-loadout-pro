/**
 * ErrorFallback Component Tests
 *
 * Tests the ErrorFallback component for:
 * - Proper rendering of error UI
 * - Action button functionality
 * - Error message display
 * - Environment-specific behavior
 */

import React from 'react';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ErrorFallback } from '@/components/errors/ErrorFallback';
import { renderWithProviders } from '../setup/testUtils';

// Mock Next.js router
const mockPush = jest.fn();
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    replace: jest.fn(),
    prefetch: jest.fn(),
    back: jest.fn(),
  }),
  usePathname: () => '/',
  useSearchParams: () => new URLSearchParams(),
  useParams: () => ({}),
}));

describe('ErrorFallback', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('renders error icon', () => {
      renderWithProviders(<ErrorFallback error={null} />);

      // Check for Oops! heading
      expect(screen.getByText('Oops!')).toBeInTheDocument();
    });

    it('renders Try Again button', () => {
      renderWithProviders(<ErrorFallback error={null} />);

      expect(screen.getByText('Try Again')).toBeInTheDocument();
    });

    it('renders Go Home button', () => {
      renderWithProviders(<ErrorFallback error={null} />);

      expect(screen.getByText('Go Home')).toBeInTheDocument();
    });

    it('renders help text', () => {
      renderWithProviders(<ErrorFallback error={null} />);

      expect(
        screen.getByText(/if this problem persists/i)
      ).toBeInTheDocument();
    });
  });

  describe('Error Message Display', () => {
    it('shows generic message in production when error is null', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';

      renderWithProviders(<ErrorFallback error={null} />);

      expect(
        screen.getByText(/something went wrong/i)
      ).toBeInTheDocument();

      process.env.NODE_ENV = originalEnv;
    });

    it('shows actual error message in development', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';

      const testError = new Error('Test error message');
      renderWithProviders(<ErrorFallback error={testError} />);

      expect(screen.getByText('Test error message')).toBeInTheDocument();

      process.env.NODE_ENV = originalEnv;
    });

    it('shows error stack in development', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';

      const testError = new Error('Test error');
      testError.stack = 'Error: Test error\n  at test.js:1:1';

      renderWithProviders(<ErrorFallback error={testError} />);

      expect(screen.getByText(/Error Stack:/i)).toBeInTheDocument();
      expect(screen.getByText(/at test.js/i)).toBeInTheDocument();

      process.env.NODE_ENV = originalEnv;
    });

    it('does not show stack in production', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';

      const testError = new Error('Test error');
      testError.stack = 'Error: Test error\n  at test.js:1:1';

      renderWithProviders(<ErrorFallback error={testError} />);

      expect(screen.queryByText(/Error Stack:/i)).not.toBeInTheDocument();

      process.env.NODE_ENV = originalEnv;
    });

    it('handles error without message', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';

      const testError = new Error();
      renderWithProviders(<ErrorFallback error={testError} />);

      expect(
        screen.getByText(/an unexpected error occurred/i)
      ).toBeInTheDocument();

      process.env.NODE_ENV = originalEnv;
    });
  });

  describe('Button Actions', () => {
    it('calls resetError when Try Again is clicked', async () => {
      const user = userEvent.setup();
      const resetError = jest.fn();

      renderWithProviders(
        <ErrorFallback error={null} resetError={resetError} />
      );

      const tryAgainButton = screen.getByText('Try Again');
      await user.click(tryAgainButton);

      expect(resetError).toHaveBeenCalledTimes(1);
    });

    it('calls resetError and navigates home when Go Home is clicked', async () => {
      const user = userEvent.setup();
      const resetError = jest.fn();

      renderWithProviders(
        <ErrorFallback error={null} resetError={resetError} />
      );

      const goHomeButton = screen.getByText('Go Home');
      await user.click(goHomeButton);

      expect(resetError).toHaveBeenCalledTimes(1);
      expect(mockPush).toHaveBeenCalledWith('/');
    });

    it('reloads page when Try Again is clicked without resetError', async () => {
      const user = userEvent.setup();
      const reloadSpy = jest.fn();
      Object.defineProperty(window, 'location', {
        writable: true,
        value: { reload: reloadSpy },
      });

      renderWithProviders(<ErrorFallback error={null} />);

      const tryAgainButton = screen.getByText('Try Again');
      await user.click(tryAgainButton);

      expect(reloadSpy).toHaveBeenCalledTimes(1);
    });
  });

  describe('Edge Cases', () => {
    it('handles null error', () => {
      renderWithProviders(<ErrorFallback error={null} />);

      expect(screen.getByText('Oops!')).toBeInTheDocument();
    });

    it('handles error without resetError function', () => {
      const testError = new Error('Test error');

      expect(() => {
        renderWithProviders(<ErrorFallback error={testError} />);
      }).not.toThrow();
    });
  });

  describe('Accessibility', () => {
    it('has accessible buttons', () => {
      renderWithProviders(<ErrorFallback error={null} />);

      const tryAgainButton = screen.getByRole('button', { name: /try again/i });
      const goHomeButton = screen.getByRole('button', { name: /go home/i });

      expect(tryAgainButton).toBeInTheDocument();
      expect(goHomeButton).toBeInTheDocument();
    });

    it('has proper heading hierarchy', () => {
      renderWithProviders(<ErrorFallback error={null} />);

      const heading = screen.getByRole('heading', { level: 1 });
      expect(heading).toHaveTextContent('Oops!');
    });
  });
});
