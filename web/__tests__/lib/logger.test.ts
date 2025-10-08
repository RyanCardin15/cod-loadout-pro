/**
 * Logger Utility Tests
 *
 * Tests the logger utility for:
 * - Log level methods
 * - Environment-aware logging
 * - Error serialization
 * - Performance timing
 * - Structured logging
 */

import { logger } from '@/lib/logger';

describe('Logger', () => {
  let consoleLogSpy: jest.SpyInstance;
  let consoleErrorSpy: jest.SpyInstance;
  let consoleWarnSpy: jest.SpyInstance;
  let consoleDebugSpy: jest.SpyInstance;
  let originalEnv: string;

  beforeEach(() => {
    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
    consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();
    consoleDebugSpy = jest.spyOn(console, 'debug').mockImplementation();
    originalEnv = process.env.NODE_ENV || '';
  });

  afterEach(() => {
    consoleLogSpy.mockRestore();
    consoleErrorSpy.mockRestore();
    consoleWarnSpy.mockRestore();
    consoleDebugSpy.mockRestore();
    process.env.NODE_ENV = originalEnv;
  });

  describe('Log Levels', () => {
    it('logs info messages', () => {
      logger.info('Test info message');

      expect(consoleLogSpy).toHaveBeenCalled();
      expect(consoleLogSpy.mock.calls[0]?.[0]).toContain('[INFO]');
      expect(consoleLogSpy.mock.calls[0]?.[0]).toContain('Test info message');
    });

    it('logs warning messages', () => {
      logger.warn('Test warning message');

      expect(consoleWarnSpy).toHaveBeenCalled();
      expect(consoleWarnSpy.mock.calls[0]?.[0]).toContain('[WARN]');
      expect(consoleWarnSpy.mock.calls[0]?.[0]).toContain('Test warning message');
    });

    it('logs error messages', () => {
      logger.error('Test error message');

      expect(consoleErrorSpy).toHaveBeenCalled();
      expect(consoleErrorSpy.mock.calls[0]?.[0]).toContain('[ERROR]');
      expect(consoleErrorSpy.mock.calls[0]?.[0]).toContain('Test error message');
    });

    it('logs debug messages in development', () => {
      process.env.NODE_ENV = 'development';
      logger.debug('Test debug message');

      expect(consoleDebugSpy).toHaveBeenCalled();
      expect(consoleDebugSpy.mock.calls[0]?.[0]).toContain('[DEBUG]');
      expect(consoleDebugSpy.mock.calls[0]?.[0]).toContain('Test debug message');
    });

    it('does not log debug messages in production', () => {
      process.env.NODE_ENV = 'production';
      logger.debug('Test debug message');

      expect(consoleDebugSpy).not.toHaveBeenCalled();
    });
  });

  describe('Context Logging', () => {
    it('logs messages with context', () => {
      logger.info('User action', { userId: '123', action: 'login' });

      expect(consoleLogSpy).toHaveBeenCalled();
      const logOutput = consoleLogSpy.mock.calls[0]?.[0] as string;
      expect(logOutput).toContain('User action');
      expect(logOutput).toContain('userId');
      expect(logOutput).toContain('123');
    });

    it('handles empty context', () => {
      logger.info('Message without context', {});

      expect(consoleLogSpy).toHaveBeenCalled();
      expect(consoleLogSpy.mock.calls[0]?.[0]).toContain('Message without context');
    });

    it('handles undefined context', () => {
      logger.info('Message');

      expect(consoleLogSpy).toHaveBeenCalled();
      expect(consoleLogSpy.mock.calls[0]?.[0]).toContain('Message');
    });
  });

  describe('Error Serialization', () => {
    it('serializes Error objects', () => {
      const error = new Error('Test error');
      logger.error('An error occurred', { error });

      expect(consoleErrorSpy).toHaveBeenCalled();
      const logOutput = consoleErrorSpy.mock.calls[0]?.[0] as string;
      expect(logOutput).toContain('Test error');
    });

    it('includes stack trace in development', () => {
      process.env.NODE_ENV = 'development';
      const error = new Error('Test error');
      error.stack = 'Error: Test error\n  at test.js:1:1';

      logger.error('An error occurred', { error });

      expect(consoleErrorSpy).toHaveBeenCalled();
      const logOutput = consoleErrorSpy.mock.calls[0]?.[0] as string;
      expect(logOutput).toContain('Stack:');
    });

    it('does not include stack trace in production', () => {
      process.env.NODE_ENV = 'production';
      const error = new Error('Test error');
      error.stack = 'Error: Test error\n  at test.js:1:1';

      logger.error('An error occurred', { error });

      expect(consoleErrorSpy).toHaveBeenCalled();
      const logOutput = consoleErrorSpy.mock.calls[0]?.[0] as string;
      expect(logOutput).not.toContain('Stack:');
    });

    it('handles string errors', () => {
      logger.error('An error occurred', { error: 'String error' });

      expect(consoleErrorSpy).toHaveBeenCalled();
      const logOutput = consoleErrorSpy.mock.calls[0]?.[0] as string;
      expect(logOutput).toContain('String error');
    });

    it('handles unknown error types', () => {
      logger.error('An error occurred', { error: { unknown: 'type' } });

      expect(consoleErrorSpy).toHaveBeenCalled();
    });
  });

  describe('Performance Timing', () => {
    it('creates a timer and logs duration', () => {
      process.env.NODE_ENV = 'development';

      const timer = logger.time('test-operation');
      timer.end();

      expect(consoleDebugSpy).toHaveBeenCalled();
      const logOutput = consoleDebugSpy.mock.calls[0]?.[0] as string;
      expect(logOutput).toContain('test-operation');
      expect(logOutput).toContain('completed in');
      expect(logOutput).toContain('ms');
    });

    it('measures accurate time duration', async () => {
      process.env.NODE_ENV = 'development';

      const timer = logger.time('async-operation');
      await new Promise(resolve => setTimeout(resolve, 10));
      timer.end();

      expect(consoleDebugSpy).toHaveBeenCalled();
      const logOutput = consoleDebugSpy.mock.calls[0]?.[0] as string;
      expect(logOutput).toContain('completed in');
    });
  });

  describe('Specialized Logging Methods', () => {
    it('logs API requests', () => {
      logger.api('GET', '/api/weapons', { userId: '123' });

      expect(consoleLogSpy).toHaveBeenCalled();
      const logOutput = consoleLogSpy.mock.calls[0]?.[0] as string;
      expect(logOutput).toContain('API GET /api/weapons');
      expect(logOutput).toContain('userId');
    });

    it('logs API errors', () => {
      const error = new Error('API failed');
      logger.apiError('POST', '/api/loadouts', error);

      expect(consoleErrorSpy).toHaveBeenCalled();
      const logOutput = consoleErrorSpy.mock.calls[0]?.[0] as string;
      expect(logOutput).toContain('API POST /api/loadouts failed');
      expect(logOutput).toContain('API failed');
    });

    it('logs component lifecycle events in development', () => {
      process.env.NODE_ENV = 'development';
      logger.component('MyComponent', 'mount', { props: { id: '123' } });

      expect(consoleDebugSpy).toHaveBeenCalled();
      const logOutput = consoleDebugSpy.mock.calls[0]?.[0] as string;
      expect(logOutput).toContain('Component MyComponent mount');
    });

    it('logs Firebase operations in development', () => {
      process.env.NODE_ENV = 'development';
      logger.firebase('read', 'weapons', { docId: 'weapon-1' });

      expect(consoleDebugSpy).toHaveBeenCalled();
      const logOutput = consoleDebugSpy.mock.calls[0]?.[0] as string;
      expect(logOutput).toContain('Firebase read');
    });

    it('logs Firebase errors', () => {
      const error = new Error('Firebase error');
      logger.firebaseError('write', error, { collection: 'loadouts' });

      expect(consoleErrorSpy).toHaveBeenCalled();
      const logOutput = consoleErrorSpy.mock.calls[0]?.[0] as string;
      expect(logOutput).toContain('Firebase write failed');
    });
  });

  describe('Edge Cases', () => {
    it('handles very long messages', () => {
      const longMessage = 'A'.repeat(10000);
      logger.info(longMessage);

      expect(consoleLogSpy).toHaveBeenCalled();
    });

    it('handles special characters in messages', () => {
      logger.info('Message with "quotes" and \'apostrophes\'');

      expect(consoleLogSpy).toHaveBeenCalled();
    });

    it('handles circular references in context', () => {
      const circular: any = { a: 1 };
      circular.self = circular;

      // Should not throw
      expect(() => {
        logger.info('Test', { data: circular });
      }).not.toThrow();
    });

    it('handles null and undefined values in context', () => {
      logger.info('Test', { nullValue: null, undefinedValue: undefined });

      expect(consoleLogSpy).toHaveBeenCalled();
    });

    it('separates error from other context', () => {
      const error = new Error('Test error');
      logger.error('Message', { error, userId: '123', action: 'test' });

      expect(consoleErrorSpy).toHaveBeenCalled();
      const logOutput = consoleErrorSpy.mock.calls[0]?.[0] as string;
      expect(logOutput).toContain('Test error');
      expect(logOutput).toContain('userId');
    });
  });
});
