/**
 * Test Utilities
 *
 * Custom render functions and utilities for testing React components
 * with all necessary providers (React Query, Auth Context, etc.)
 */

import React, { ReactElement } from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

/**
 * Create a new QueryClient for each test to ensure isolation
 */
export function createTestQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
        staleTime: 0,
      },
      mutations: {
        retry: false,
      },
    },
    logger: {
      log: console.log,
      warn: console.warn,
      error: () => {}, // Silence errors in tests
    },
  });
}

/**
 * All providers wrapper for testing
 */
interface AllProvidersProps {
  children: React.ReactNode;
  queryClient?: QueryClient;
}

export function AllProviders({ children, queryClient }: AllProvidersProps) {
  const client = queryClient || createTestQueryClient();

  return (
    <QueryClientProvider client={client}>
      {children}
    </QueryClientProvider>
  );
}

/**
 * Custom render with all providers
 *
 * @example
 * ```tsx
 * const { getByText } = renderWithProviders(<MyComponent />);
 * ```
 */
interface CustomRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  queryClient?: QueryClient;
}

export function renderWithProviders(
  ui: ReactElement,
  options?: CustomRenderOptions
) {
  const { queryClient, ...renderOptions } = options || {};

  const Wrapper = ({ children }: { children: React.ReactNode }) => (
    <AllProviders queryClient={queryClient}>{children}</AllProviders>
  );

  return render(ui, { wrapper: Wrapper, ...renderOptions });
}

/**
 * Wait for async updates to complete
 * Useful when testing hooks that fetch data
 */
export async function waitForLoadingToFinish() {
  await new Promise((resolve) => setTimeout(resolve, 0));
}

/**
 * Mock implementation of fetch for testing
 */
export function mockFetch<T>(
  data: T,
  options?: {
    status?: number;
    ok?: boolean;
    delay?: number;
  }
): jest.Mock {
  const { status = 200, ok = true, delay = 0 } = options || {};

  return jest.fn(() =>
    new Promise((resolve) =>
      setTimeout(
        () =>
          resolve({
            ok,
            status,
            json: async () => data,
            text: async () => JSON.stringify(data),
            headers: new Headers(),
          } as Response),
        delay
      )
    )
  );
}

/**
 * Mock implementation of fetch that rejects
 */
export function mockFetchError(
  error: Error | string = 'Network error',
  delay = 0
): jest.Mock {
  return jest.fn(
    () =>
      new Promise((_, reject) =>
        setTimeout(() => {
          reject(typeof error === 'string' ? new Error(error) : error);
        }, delay)
      )
  );
}

/**
 * Create a mock user for testing authenticated scenarios
 */
export function createMockUser(overrides?: Partial<any>) {
  return {
    uid: 'test-user-123',
    email: 'test@example.com',
    displayName: 'Test User',
    photoURL: 'https://example.com/photo.jpg',
    emailVerified: true,
    ...overrides,
  };
}

/**
 * Suppress console errors/warnings in tests
 * Useful when testing error boundaries or expected errors
 *
 * @example
 * ```tsx
 * test('handles error', () => {
 *   const restore = suppressConsoleError();
 *   // Test code that triggers error
 *   restore();
 * });
 * ```
 */
export function suppressConsoleError(): () => void {
  const originalError = console.error;
  console.error = jest.fn();
  return () => {
    console.error = originalError;
  };
}

export function suppressConsoleWarn(): () => void {
  const originalWarn = console.warn;
  console.warn = jest.fn();
  return () => {
    console.warn = originalWarn;
  };
}

// Re-export everything from Testing Library
export * from '@testing-library/react';
export { renderWithProviders as render };
