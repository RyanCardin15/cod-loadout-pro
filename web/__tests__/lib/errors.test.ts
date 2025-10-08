/**
 * API Errors Tests
 *
 * Tests the API error classes and utilities for:
 * - Error class constructors
 * - Error serialization
 * - Error formatting
 * - Error logging
 * - Type guards
 */

import {
  ApiError,
  BadRequestError,
  UnauthorizedError,
  ForbiddenError,
  NotFoundError,
  ConflictError,
  ValidationError,
  RateLimitError,
  InternalServerError,
  ServiceUnavailableError,
  isApiError,
  formatApiError,
  logApiError,
} from '@/lib/api/errors';

describe('API Errors', () => {
  describe('ApiError', () => {
    it('creates error with message and status code', () => {
      const error = new ApiError('Test error', 400);

      expect(error.message).toBe('Test error');
      expect(error.statusCode).toBe(400);
      expect(error.name).toBe('ApiError');
    });

    it('defaults to 500 status code', () => {
      const error = new ApiError('Server error');

      expect(error.statusCode).toBe(500);
    });

    it('includes error code and details', () => {
      const error = new ApiError('Test error', 400, 'TEST_CODE', { field: 'value' });

      expect(error.code).toBe('TEST_CODE');
      expect(error.details).toEqual({ field: 'value' });
    });

    it('serializes to JSON correctly', () => {
      const error = new ApiError('Test error', 400, 'TEST_CODE', { field: 'value' });
      const json = error.toJSON();

      expect(json).toEqual({
        error: 'Test error',
        code: 'TEST_CODE',
        details: { field: 'value' },
      });
    });
  });

  describe('BadRequestError', () => {
    it('creates 400 error', () => {
      const error = new BadRequestError('Invalid input');

      expect(error.statusCode).toBe(400);
      expect(error.code).toBe('BAD_REQUEST');
      expect(error.message).toBe('Invalid input');
    });

    it('uses default message', () => {
      const error = new BadRequestError();

      expect(error.message).toBe('Bad request');
    });

    it('includes details', () => {
      const error = new BadRequestError('Invalid input', { field: 'email' });

      expect(error.details).toEqual({ field: 'email' });
    });
  });

  describe('UnauthorizedError', () => {
    it('creates 401 error', () => {
      const error = new UnauthorizedError('Not authenticated');

      expect(error.statusCode).toBe(401);
      expect(error.code).toBe('UNAUTHORIZED');
    });
  });

  describe('ForbiddenError', () => {
    it('creates 403 error', () => {
      const error = new ForbiddenError('Access denied');

      expect(error.statusCode).toBe(403);
      expect(error.code).toBe('FORBIDDEN');
    });
  });

  describe('NotFoundError', () => {
    it('creates 404 error', () => {
      const error = new NotFoundError('User');

      expect(error.statusCode).toBe(404);
      expect(error.code).toBe('NOT_FOUND');
      expect(error.message).toBe('User not found');
    });

    it('uses default resource name', () => {
      const error = new NotFoundError();

      expect(error.message).toBe('Resource not found');
    });
  });

  describe('ConflictError', () => {
    it('creates 409 error', () => {
      const error = new ConflictError('Resource already exists');

      expect(error.statusCode).toBe(409);
      expect(error.code).toBe('CONFLICT');
    });
  });

  describe('ValidationError', () => {
    it('creates 422 error', () => {
      const error = new ValidationError('Schema validation failed');

      expect(error.statusCode).toBe(422);
      expect(error.code).toBe('VALIDATION_ERROR');
    });

    it('includes validation details', () => {
      const details = {
        errors: [
          { field: 'email', message: 'Invalid email' },
          { field: 'age', message: 'Must be positive' },
        ],
      };
      const error = new ValidationError('Validation failed', details);

      expect(error.details).toEqual(details);
    });
  });

  describe('RateLimitError', () => {
    it('creates 429 error', () => {
      const error = new RateLimitError('Too many requests', 60);

      expect(error.statusCode).toBe(429);
      expect(error.code).toBe('RATE_LIMIT_EXCEEDED');
      expect(error.details).toEqual({ retryAfter: 60 });
    });

    it('uses default message', () => {
      const error = new RateLimitError();

      expect(error.message).toBe('Rate limit exceeded');
    });
  });

  describe('InternalServerError', () => {
    it('creates 500 error', () => {
      const error = new InternalServerError('Database error');

      expect(error.statusCode).toBe(500);
      expect(error.code).toBe('INTERNAL_ERROR');
    });
  });

  describe('ServiceUnavailableError', () => {
    it('creates 503 error', () => {
      const error = new ServiceUnavailableError('Database');

      expect(error.statusCode).toBe(503);
      expect(error.code).toBe('SERVICE_UNAVAILABLE');
      expect(error.message).toBe('Database is currently unavailable');
    });
  });

  describe('isApiError', () => {
    it('returns true for ApiError instances', () => {
      const error = new ApiError('Test');

      expect(isApiError(error)).toBe(true);
    });

    it('returns true for subclass instances', () => {
      expect(isApiError(new BadRequestError())).toBe(true);
      expect(isApiError(new NotFoundError())).toBe(true);
      expect(isApiError(new ValidationError())).toBe(true);
    });

    it('returns false for standard Error', () => {
      const error = new Error('Test');

      expect(isApiError(error)).toBe(false);
    });

    it('returns false for non-error values', () => {
      expect(isApiError('error')).toBe(false);
      expect(isApiError(null)).toBe(false);
      expect(isApiError(undefined)).toBe(false);
      expect(isApiError({})).toBe(false);
    });
  });

  describe('formatApiError', () => {
    it('formats ApiError correctly', () => {
      const error = new BadRequestError('Invalid input', { field: 'email' });
      const formatted = formatApiError(error);

      expect(formatted.statusCode).toBe(400);
      expect(formatted.error).toEqual({
        error: 'Invalid input',
        code: 'BAD_REQUEST',
        details: { field: 'email' },
      });
    });

    it('formats standard Error with 500 status', () => {
      const error = new Error('Something went wrong');
      const formatted = formatApiError(error);

      expect(formatted.statusCode).toBe(500);
      expect(formatted.error).toEqual({
        error: 'Something went wrong',
        code: 'INTERNAL_ERROR',
      });
    });

    it('formats unknown errors with default message', () => {
      const formatted = formatApiError('string error');

      expect(formatted.statusCode).toBe(500);
      expect(formatted.error).toEqual({
        error: 'An error occurred',
        code: 'UNKNOWN_ERROR',
      });
    });

    it('uses custom default message', () => {
      const formatted = formatApiError(null, 'Custom default');

      expect(formatted.error).toMatchObject({
        error: 'Custom default',
      });
    });

    it('handles Error without message', () => {
      const error = new Error();
      const formatted = formatApiError(error, 'Fallback message');

      expect(formatted.error).toMatchObject({
        error: 'Fallback message',
      });
    });
  });

  describe('logApiError', () => {
    let consoleWarnSpy: jest.SpyInstance;
    let consoleErrorSpy: jest.SpyInstance;

    beforeEach(() => {
      consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();
      consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
    });

    afterEach(() => {
      consoleWarnSpy.mockRestore();
      consoleErrorSpy.mockRestore();
    });

    it('logs 4xx errors as warnings', () => {
      const error = new BadRequestError('Invalid input');
      logApiError(error, { route: '/api/test' });

      expect(consoleWarnSpy).toHaveBeenCalled();
      expect(consoleErrorSpy).not.toHaveBeenCalled();
    });

    it('logs 5xx errors as errors', () => {
      const error = new InternalServerError('Server error');
      logApiError(error, { route: '/api/test' });

      expect(consoleErrorSpy).toHaveBeenCalled();
      expect(consoleWarnSpy).not.toHaveBeenCalled();
    });

    it('logs standard Error as error', () => {
      const error = new Error('Unexpected error');
      logApiError(error);

      expect(consoleErrorSpy).toHaveBeenCalled();
    });

    it('logs unknown errors as error', () => {
      logApiError('string error');

      expect(consoleErrorSpy).toHaveBeenCalled();
    });

    it('includes context in logs', () => {
      const error = new BadRequestError('Invalid');
      logApiError(error, { route: '/api/test', method: 'POST' });

      expect(consoleWarnSpy).toHaveBeenCalled();
      const logCall = consoleWarnSpy.mock.calls[0];
      expect(logCall?.[0]).toContain('API client error');
    });
  });

  describe('Error Inheritance', () => {
    it('maintains Error prototype chain', () => {
      const error = new BadRequestError('Test');

      expect(error).toBeInstanceOf(Error);
      expect(error).toBeInstanceOf(ApiError);
      expect(error).toBeInstanceOf(BadRequestError);
    });

    it('preserves stack trace', () => {
      const error = new NotFoundError('User');

      expect(error.stack).toBeDefined();
      expect(error.stack).toContain('NotFoundError');
    });
  });
});
