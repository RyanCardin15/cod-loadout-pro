/**
 * Environment Validation Tests
 *
 * Tests the env validation utility for:
 * - Server environment validation
 * - Client environment validation
 * - Error messaging
 * - Type safety
 */

import {
  validateServerEnv,
  validateClientEnv,
  validateEnv,
  getEnv,
  isDevelopment,
  isProduction,
  isTest,
} from '@/lib/env';

describe('Environment Validation', () => {
  let originalEnv: NodeJS.ProcessEnv;

  beforeEach(() => {
    originalEnv = { ...process.env };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe('validateServerEnv', () => {
    it('validates correct server environment variables', () => {
      process.env.FIREBASE_PROJECT_ID = 'test-project';
      process.env.FIREBASE_CLIENT_EMAIL = 'test@test-project.iam.gserviceaccount.com';
      process.env.FIREBASE_PRIVATE_KEY = '-----BEGIN PRIVATE KEY-----\ntest-key\n-----END PRIVATE KEY-----';

      expect(() => validateServerEnv()).not.toThrow();

      const env = validateServerEnv();
      expect(env.FIREBASE_PROJECT_ID).toBe('test-project');
      expect(env.FIREBASE_CLIENT_EMAIL).toBe('test@test-project.iam.gserviceaccount.com');
      expect(env.FIREBASE_PRIVATE_KEY).toContain('test-key');
    });

    it('transforms escaped newlines in private key', () => {
      process.env.FIREBASE_PROJECT_ID = 'test-project';
      process.env.FIREBASE_CLIENT_EMAIL = 'test@test-project.iam.gserviceaccount.com';
      process.env.FIREBASE_PRIVATE_KEY = '-----BEGIN PRIVATE KEY-----\\ntest-key\\n-----END PRIVATE KEY-----';

      const env = validateServerEnv();
      expect(env.FIREBASE_PRIVATE_KEY).toContain('\n');
      expect(env.FIREBASE_PRIVATE_KEY).not.toContain('\\n');
    });

    it('throws error when FIREBASE_PROJECT_ID is missing', () => {
      delete process.env.FIREBASE_PROJECT_ID;
      process.env.FIREBASE_CLIENT_EMAIL = 'test@test-project.iam.gserviceaccount.com';
      process.env.FIREBASE_PRIVATE_KEY = 'test-key';

      expect(() => validateServerEnv()).toThrow(/FIREBASE_PROJECT_ID/);
    });

    it('throws error when FIREBASE_CLIENT_EMAIL is invalid', () => {
      process.env.FIREBASE_PROJECT_ID = 'test-project';
      process.env.FIREBASE_CLIENT_EMAIL = 'not-an-email';
      process.env.FIREBASE_PRIVATE_KEY = 'test-key';

      expect(() => validateServerEnv()).toThrow(/email/i);
    });

    it('throws error when FIREBASE_PRIVATE_KEY is missing', () => {
      process.env.FIREBASE_PROJECT_ID = 'test-project';
      process.env.FIREBASE_CLIENT_EMAIL = 'test@test-project.iam.gserviceaccount.com';
      delete process.env.FIREBASE_PRIVATE_KEY;

      expect(() => validateServerEnv()).toThrow(/FIREBASE_PRIVATE_KEY/);
    });

    it('accepts optional FIREBASE_STORAGE_BUCKET', () => {
      process.env.FIREBASE_PROJECT_ID = 'test-project';
      process.env.FIREBASE_CLIENT_EMAIL = 'test@test-project.iam.gserviceaccount.com';
      process.env.FIREBASE_PRIVATE_KEY = 'test-key';
      process.env.FIREBASE_STORAGE_BUCKET = 'test-bucket.appspot.com';

      const env = validateServerEnv();
      expect(env.FIREBASE_STORAGE_BUCKET).toBe('test-bucket.appspot.com');
    });
  });

  describe('validateClientEnv', () => {
    it('validates correct client environment variables', () => {
      process.env.NEXT_PUBLIC_FIREBASE_API_KEY = 'test-api-key';
      process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN = 'test-project.firebaseapp.com';
      process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID = 'test-project';
      process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET = 'test-project.appspot.com';
      process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID = '123456789';
      process.env.NEXT_PUBLIC_FIREBASE_APP_ID = '1:123456789:web:abcdef';

      expect(() => validateClientEnv()).not.toThrow();

      const env = validateClientEnv();
      expect(env.NEXT_PUBLIC_FIREBASE_API_KEY).toBe('test-api-key');
    });

    it('throws error when NEXT_PUBLIC_FIREBASE_API_KEY is missing', () => {
      delete process.env.NEXT_PUBLIC_FIREBASE_API_KEY;

      expect(() => validateClientEnv()).toThrow(/NEXT_PUBLIC_FIREBASE_API_KEY/);
    });

    it('transforms USE_AUTH_EMULATOR to boolean', () => {
      process.env.NEXT_PUBLIC_FIREBASE_API_KEY = 'test-api-key';
      process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN = 'test-project.firebaseapp.com';
      process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID = 'test-project';
      process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET = 'test-project.appspot.com';
      process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID = '123456789';
      process.env.NEXT_PUBLIC_FIREBASE_APP_ID = '1:123456789:web:abcdef';
      process.env.NEXT_PUBLIC_USE_AUTH_EMULATOR = 'true';

      const env = validateClientEnv();
      expect(env.NEXT_PUBLIC_USE_AUTH_EMULATOR).toBe(true);
    });

    it('handles missing optional USE_AUTH_EMULATOR', () => {
      process.env.NEXT_PUBLIC_FIREBASE_API_KEY = 'test-api-key';
      process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN = 'test-project.firebaseapp.com';
      process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID = 'test-project';
      process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET = 'test-project.appspot.com';
      process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID = '123456789';
      process.env.NEXT_PUBLIC_FIREBASE_APP_ID = '1:123456789:web:abcdef';
      delete process.env.NEXT_PUBLIC_USE_AUTH_EMULATOR;

      expect(() => validateClientEnv()).not.toThrow();
    });
  });

  describe('validateEnv', () => {
    it('validates all environment variables', () => {
      // Set all required env vars
      process.env.NODE_ENV = 'test';
      process.env.FIREBASE_PROJECT_ID = 'test-project';
      process.env.FIREBASE_CLIENT_EMAIL = 'test@test-project.iam.gserviceaccount.com';
      process.env.FIREBASE_PRIVATE_KEY = 'test-key';
      process.env.NEXT_PUBLIC_FIREBASE_API_KEY = 'test-api-key';
      process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN = 'test-project.firebaseapp.com';
      process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID = 'test-project';
      process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET = 'test-project.appspot.com';
      process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID = '123456789';
      process.env.NEXT_PUBLIC_FIREBASE_APP_ID = '1:123456789:web:abcdef';

      expect(() => validateEnv()).not.toThrow();
    });

    it('provides helpful error message on validation failure', () => {
      delete process.env.FIREBASE_PROJECT_ID;

      try {
        validateEnv();
        fail('Should have thrown error');
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
        expect((error as Error).message).toContain('Invalid environment variables');
        expect((error as Error).message).toContain('.env');
      }
    });
  });

  describe('getEnv', () => {
    it('returns environment variable value', () => {
      process.env.TEST_VAR = 'test-value';

      const value = getEnv('TEST_VAR' as any);
      expect(value).toBe('test-value');
    });

    it('throws error when variable is not defined', () => {
      delete process.env.UNDEFINED_VAR;

      expect(() => getEnv('UNDEFINED_VAR' as any)).toThrow(/not defined/);
    });

    it('provides helpful error message', () => {
      delete process.env.MISSING_VAR;

      try {
        getEnv('MISSING_VAR' as any);
        fail('Should have thrown error');
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
        expect((error as Error).message).toContain('MISSING_VAR');
        expect((error as Error).message).toContain('.env');
      }
    });
  });

  describe('Environment Flags', () => {
    it('isDevelopment is true in development', () => {
      const originalNodeEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';

      // Re-import to get updated values
      jest.resetModules();
      const { isDevelopment: isDev } = require('@/lib/env');

      expect(isDev).toBe(true);

      process.env.NODE_ENV = originalNodeEnv;
    });

    it('isProduction is true in production', () => {
      const originalNodeEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';

      jest.resetModules();
      const { isProduction: isProd } = require('@/lib/env');

      expect(isProd).toBe(true);

      process.env.NODE_ENV = originalNodeEnv;
    });

    it('isTest is true in test environment', () => {
      expect(isTest).toBe(true);
    });
  });

  describe('Edge Cases', () => {
    it('handles empty string values', () => {
      process.env.FIREBASE_PROJECT_ID = '';
      process.env.FIREBASE_CLIENT_EMAIL = 'test@test-project.iam.gserviceaccount.com';
      process.env.FIREBASE_PRIVATE_KEY = 'test-key';

      expect(() => validateServerEnv()).toThrow();
    });

    it('handles whitespace-only values', () => {
      process.env.FIREBASE_PROJECT_ID = '   ';
      process.env.FIREBASE_CLIENT_EMAIL = 'test@test-project.iam.gserviceaccount.com';
      process.env.FIREBASE_PRIVATE_KEY = 'test-key';

      expect(() => validateServerEnv()).toThrow();
    });
  });
});
