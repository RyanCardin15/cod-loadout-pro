/**
 * Jest Configuration for Next.js + TypeScript
 *
 * This configuration sets up Jest to work with:
 * - Next.js 14
 * - TypeScript
 * - React Testing Library
 * - CSS Modules & Tailwind
 * - Path aliases (@/*)
 */

const nextJest = require('next/jest');

// Create Jest config using Next.js helper
const createJestConfig = nextJest({
  // Path to Next.js app directory
  dir: './',
});

/** @type {import('jest').Config} */
const customJestConfig = {
  // Setup files to run before each test
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],

  // Test environment
  testEnvironment: 'jest-environment-jsdom',

  // Module name mapper for path aliases and static assets
  moduleNameMapper: {
    // Path alias
    '^@/(.*)$': '<rootDir>/src/$1',

    // Mock static file imports
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
    '\\.(jpg|jpeg|png|gif|svg|webp)$': '<rootDir>/__mocks__/fileMock.js',
  },

  // Coverage configuration
  collectCoverageFrom: [
    'src/**/*.{js,jsx,ts,tsx}',
    '!src/**/*.d.ts',
    '!src/**/*.stories.{js,jsx,ts,tsx}',
    '!src/**/__tests__/**',
    '!src/**/__mocks__/**',
    '!src/**/types/**',
    '!src/app/layout.tsx', // Next.js root layout
    '!src/app/**/layout.tsx', // Route layouts
    '!src/app/**/page.tsx', // Page components (tested via E2E)
  ],

  // Coverage thresholds
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
  },

  // Test match patterns
  testMatch: [
    '**/__tests__/**/*.(test|spec).[jt]s?(x)',
    '**/?(*.)+(spec|test).[jt]s?(x)',
  ],

  // Transform configuration
  transform: {
    '^.+\\.(js|jsx|ts|tsx)$': ['@swc/jest', {
      jsc: {
        transform: {
          react: {
            runtime: 'automatic',
          },
        },
      },
    }],
  },

  // Module file extensions
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json'],

  // Ignore patterns
  testPathIgnorePatterns: [
    '/node_modules/',
    '/.next/',
    '/out/',
    '/build/',
  ],

  // Reporters
  reporters: [
    'default',
    [
      'jest-junit',
      {
        outputDirectory: './coverage',
        outputName: 'junit.xml',
        classNameTemplate: '{classname}',
        titleTemplate: '{title}',
      },
    ],
  ],

  // Verbose output
  verbose: true,

  // Clear mocks between tests
  clearMocks: true,
  resetMocks: true,
  restoreMocks: true,

  // Maximum workers (use 50% of available CPUs)
  maxWorkers: '50%',
};

// Export config with Next.js integration
module.exports = createJestConfig(customJestConfig);
