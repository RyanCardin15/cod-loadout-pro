# Testing Guide

Comprehensive guide to testing in the Counterplay application.

## Table of Contents

- [Overview](#overview)
- [Test Stack](#test-stack)
- [Running Tests](#running-tests)
- [Writing Tests](#writing-tests)
- [Test Utilities](#test-utilities)
- [Mocking Strategies](#mocking-strategies)
- [Coverage Requirements](#coverage-requirements)
- [Best Practices](#best-practices)
- [CI/CD Integration](#cicd-integration)

## Overview

Counterplay uses a comprehensive testing strategy to ensure code quality and prevent regressions:

- **Unit Tests**: Testing individual functions and utilities
- **Component Tests**: Testing React components in isolation
- **Hook Tests**: Testing custom React hooks
- **Integration Tests**: Testing API routes and data flow

### Coverage Targets

| Category | Coverage Target |
|----------|----------------|
| Overall | >60% |
| Utilities (`src/lib/**`) | >80% |
| Hooks (`src/hooks/**`) | >70% |
| Components | >60% |
| API Routes | >80% |

## Test Stack

- **Test Runner**: Jest 30+
- **React Testing**: React Testing Library 16+
- **DOM Testing**: @testing-library/jest-dom
- **User Interactions**: @testing-library/user-event
- **Environment**: jsdom (simulates browser environment)
- **Transformer**: @swc/jest (fast TypeScript compilation)

## Running Tests

```bash
# Run all tests once
npm test

# Run tests in watch mode (re-run on file changes)
npm run test:watch

# Run tests with coverage report
npm run test:coverage

# Run tests in CI mode (optimized for CI/CD)
npm run test:ci
```

### Filtering Tests

```bash
# Run specific test file
npm test WeaponCard

# Run tests matching pattern
npm test -- --testNamePattern="handles errors"

# Run only changed tests
npm test -- --onlyChanged

# Run tests for specific path
npm test src/hooks
```

## Writing Tests

### Component Tests

Test React components using React Testing Library:

```typescript
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '../setup/testUtils';
import { MyComponent } from '@/components/MyComponent';
import { createMockData } from '../setup/mocks';

describe('MyComponent', () => {
  it('renders correctly', () => {
    const mockData = createMockData();
    renderWithProviders(<MyComponent data={mockData} />);

    expect(screen.getByText('Expected Text')).toBeInTheDocument();
  });

  it('handles user interactions', async () => {
    const user = userEvent.setup();
    const handleClick = jest.fn();

    renderWithProviders(<MyComponent onClick={handleClick} />);

    await user.click(screen.getByRole('button'));

    expect(handleClick).toHaveBeenCalled();
  });

  it('handles errors gracefully', () => {
    const restore = suppressConsoleError();

    expect(() => {
      renderWithProviders(<MyComponent data={null} />);
    }).not.toThrow();

    restore();
  });
});
```

### Hook Tests

Test custom hooks using renderHook:

```typescript
import { renderHook, waitFor } from '@testing-library/react';
import { useMyHook } from '@/hooks/useMyHook';
import { AllProviders } from '../setup/testUtils';

describe('useMyHook', () => {
  beforeEach(() => {
    global.fetch = jest.fn();
  });

  it('fetches data successfully', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({ data: 'test' }),
    });

    const { result } = renderHook(() => useMyHook(), {
      wrapper: AllProviders,
    });

    expect(result.current.loading).toBe(true);

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.data).toBe('test');
    expect(result.current.error).toBeNull();
  });
});
```

### Utility Tests

Test pure functions and utilities:

```typescript
import { myUtilityFunction } from '@/lib/utils';

describe('myUtilityFunction', () => {
  it('handles valid input', () => {
    const result = myUtilityFunction('valid input');
    expect(result).toBe('expected output');
  });

  it('handles edge cases', () => {
    expect(myUtilityFunction('')).toBe('');
    expect(myUtilityFunction(null)).toBe(null);
  });

  it('throws on invalid input', () => {
    expect(() => {
      myUtilityFunction('invalid');
    }).toThrow('Expected error message');
  });
});
```

## Test Utilities

### Custom Render Function

Use `renderWithProviders` to render components with all necessary providers:

```typescript
import { renderWithProviders } from '../setup/testUtils';

// Renders with React Query and other providers
const { getByText } = renderWithProviders(<MyComponent />);
```

### Mock Data Factories

Use factory functions to create consistent test data:

```typescript
import {
  createMockWeapon,
  createMockLoadout,
  createMockMetaSnapshot,
  createMockApiResponse,
} from '../setup/mocks';

// Create single mock weapon
const weapon = createMockWeapon({ name: 'Custom Name' });

// Create multiple mock weapons
const weapons = createMockWeapons(5);

// Create mock API response
const response = createMockApiResponse({ weapons }, { success: true });
```

### Firebase Mocks

Firebase is automatically mocked in tests via `jest.setup.js`. For custom behavior:

```typescript
import {
  mockFirebaseAuth,
  mockFirestore,
  setMockAuthUser,
  simulateAuthStateChange,
} from '../setup/firebase-mock';

// Set authenticated user
setMockAuthUser({ uid: 'test-user', email: 'test@example.com' });

// Simulate auth state change
simulateAuthStateChange(mockUser);
```

### Suppressing Console Output

Suppress expected errors/warnings to reduce test noise:

```typescript
import { suppressConsoleError, suppressConsoleWarn } from '../setup/testUtils';

it('handles error', () => {
  const restore = suppressConsoleError();

  // Test code that logs errors

  restore(); // Restore original console.error
});
```

## Mocking Strategies

### Mocking fetch

Mock network requests globally or per-test:

```typescript
// Global mock (in beforeEach)
global.fetch = jest.fn(() =>
  Promise.resolve({
    ok: true,
    status: 200,
    json: async () => ({ data: 'test' }),
  })
);

// Mock with error
global.fetch = jest.fn(() =>
  Promise.reject(new Error('Network error'))
);

// Mock different responses
(global.fetch as jest.Mock)
  .mockResolvedValueOnce({ ok: true, json: async () => ({ result: 1 }) })
  .mockResolvedValueOnce({ ok: true, json: async () => ({ result: 2 }) });
```

### Mocking Next.js Router

Next.js router is automatically mocked in `jest.setup.js`. To customize:

```typescript
import { useRouter } from 'next/navigation';

const mockPush = jest.fn();
(useRouter as jest.Mock).mockReturnValue({
  push: mockPush,
  // ... other router methods
});

// In test
await user.click(button);
expect(mockPush).toHaveBeenCalledWith('/expected-route');
```

### Mocking External Libraries

Framer Motion is automatically mocked to render plain HTML elements.

For other libraries:

```typescript
jest.mock('some-library', () => ({
  someFunction: jest.fn(() => 'mocked result'),
}));
```

## Coverage Requirements

### Viewing Coverage

```bash
npm run test:coverage
```

Coverage reports are generated in `coverage/` directory:
- `coverage/lcov-report/index.html` - Visual HTML report
- `coverage/coverage-final.json` - Raw coverage data
- `coverage/junit.xml` - JUnit format for CI

### Coverage Thresholds

Tests will fail if coverage drops below thresholds:

```javascript
// jest.config.js
coverageThreshold: {
  global: {
    statements: 60,
    branches: 60,
    functions: 60,
    lines: 60,
  },
  './src/lib/**/*.{ts,tsx}': {
    statements: 80,
    branches: 75,
    functions: 80,
    lines: 80,
  },
  './src/hooks/**/*.{ts,tsx}': {
    statements: 70,
    branches: 65,
    functions: 70,
    lines: 70,
  },
}
```

## Best Practices

### 1. Test Behavior, Not Implementation

```typescript
// Good: Tests behavior
it('displays error message when API fails', async () => {
  renderWithProviders(<Component />);
  expect(await screen.findByText(/error occurred/i)).toBeInTheDocument();
});

// Bad: Tests implementation
it('sets error state to true', () => {
  const { result } = renderHook(() => useComponent());
  expect(result.current.hasError).toBe(true);
});
```

### 2. Use Descriptive Test Names

```typescript
// Good
it('displays validation error when email is invalid')
it('calls onSubmit with form data when submit button is clicked')

// Bad
it('works')
it('test email')
```

### 3. Arrange-Act-Assert Pattern

```typescript
it('updates count when increment button is clicked', async () => {
  // Arrange
  const user = userEvent.setup();
  renderWithProviders(<Counter initialCount={0} />);

  // Act
  await user.click(screen.getByRole('button', { name: /increment/i }));

  // Assert
  expect(screen.getByText('Count: 1')).toBeInTheDocument();
});
```

### 4. Test Edge Cases

```typescript
describe('formatCurrency', () => {
  it('handles positive numbers', () => {
    expect(formatCurrency(100)).toBe('$100.00');
  });

  it('handles zero', () => {
    expect(formatCurrency(0)).toBe('$0.00');
  });

  it('handles negative numbers', () => {
    expect(formatCurrency(-50)).toBe('-$50.00');
  });

  it('handles decimal precision', () => {
    expect(formatCurrency(12.345)).toBe('$12.35');
  });
});
```

### 5. Avoid Test Interdependence

```typescript
// Good: Each test is independent
describe('Counter', () => {
  it('starts at zero', () => {
    renderWithProviders(<Counter />);
    expect(screen.getByText('0')).toBeInTheDocument();
  });

  it('increments when clicked', async () => {
    const user = userEvent.setup();
    renderWithProviders(<Counter />);
    await user.click(screen.getByRole('button'));
    expect(screen.getByText('1')).toBeInTheDocument();
  });
});

// Bad: Tests depend on execution order
let counter;
it('initializes', () => {
  counter = new Counter();
});
it('increments', () => {
  counter.increment(); // Depends on previous test
});
```

### 6. Clean Up After Tests

```typescript
describe('Component', () => {
  let originalEnv: string;

  beforeEach(() => {
    originalEnv = process.env.NODE_ENV;
  });

  afterEach(() => {
    process.env.NODE_ENV = originalEnv;
    jest.clearAllMocks();
  });

  it('behaves differently in production', () => {
    process.env.NODE_ENV = 'production';
    // Test code
  });
});
```

## CI/CD Integration

### GitHub Actions Example

```yaml
name: Test

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm ci
      - run: npm run test:ci
      - uses: codecov/codecov-action@v3
        with:
          files: ./coverage/coverage-final.json
```

### Test Output

CI mode (`npm run test:ci`) provides:
- Non-interactive mode
- Coverage report
- JUnit XML output for CI platforms
- Optimized worker count (50% of CPUs)

## Troubleshooting

### Common Issues

**Tests timeout**
```bash
# Increase timeout
jest.setTimeout(10000); // 10 seconds
```

**Module not found**
```bash
# Clear Jest cache
npx jest --clearCache
```

**Coverage not updating**
```bash
# Remove coverage directory and re-run
rm -rf coverage
npm run test:coverage
```

**Tests fail in CI but pass locally**
- Ensure `NODE_ENV=test` in CI
- Check for timezone differences
- Use `npm ci` instead of `npm install` in CI

## Further Reading

- [Jest Documentation](https://jestjs.io/)
- [React Testing Library](https://testing-library.com/react)
- [Testing Best Practices](https://testingjavascript.com/)
- [Next.js Testing](https://nextjs.org/docs/testing)

---

For questions or issues with testing, please open an issue on GitHub.
