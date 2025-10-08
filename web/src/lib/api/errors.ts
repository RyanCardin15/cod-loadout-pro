/**
 * Standard API error classes and utilities
 *
 * This module provides consistent error handling across all API routes
 * with proper status codes, error messages, and logging integration.
 */

import { logger } from '@/lib/logger';

/**
 * Base API error class
 */
export class ApiError extends Error {
  constructor(
    message: string,
    public statusCode: number = 500,
    public code?: string,
    public details?: unknown
  ) {
    super(message);
    this.name = 'ApiError';
    Object.setPrototypeOf(this, ApiError.prototype);
  }

  /**
   * Convert error to JSON response format
   */
  toJSON() {
    return {
      error: this.message,
      code: this.code,
      details: this.details,
    };
  }
}

/**
 * 400 Bad Request - Client sent invalid data
 */
export class BadRequestError extends ApiError {
  constructor(message: string = 'Bad request', details?: unknown) {
    super(message, 400, 'BAD_REQUEST', details);
    this.name = 'BadRequestError';
  }
}

/**
 * 401 Unauthorized - Authentication required
 */
export class UnauthorizedError extends ApiError {
  constructor(message: string = 'Unauthorized', details?: unknown) {
    super(message, 401, 'UNAUTHORIZED', details);
    this.name = 'UnauthorizedError';
  }
}

/**
 * 403 Forbidden - Authenticated but not allowed
 */
export class ForbiddenError extends ApiError {
  constructor(message: string = 'Forbidden', details?: unknown) {
    super(message, 403, 'FORBIDDEN', details);
    this.name = 'ForbiddenError';
  }
}

/**
 * 404 Not Found - Resource doesn't exist
 */
export class NotFoundError extends ApiError {
  constructor(resource: string = 'Resource', details?: unknown) {
    super(`${resource} not found`, 404, 'NOT_FOUND', details);
    this.name = 'NotFoundError';
  }
}

/**
 * 409 Conflict - Resource already exists or conflict
 */
export class ConflictError extends ApiError {
  constructor(message: string = 'Conflict', details?: unknown) {
    super(message, 409, 'CONFLICT', details);
    this.name = 'ConflictError';
  }
}

/**
 * 422 Unprocessable Entity - Validation failed
 */
export class ValidationError extends ApiError {
  constructor(message: string = 'Validation failed', details?: unknown) {
    super(message, 422, 'VALIDATION_ERROR', details);
    this.name = 'ValidationError';
  }
}

/**
 * 429 Too Many Requests - Rate limit exceeded
 */
export class RateLimitError extends ApiError {
  constructor(message: string = 'Rate limit exceeded', retryAfter?: number) {
    super(message, 429, 'RATE_LIMIT_EXCEEDED', { retryAfter });
    this.name = 'RateLimitError';
  }
}

/**
 * 500 Internal Server Error - Something went wrong
 */
export class InternalServerError extends ApiError {
  constructor(message: string = 'Internal server error', details?: unknown) {
    super(message, 500, 'INTERNAL_ERROR', details);
    this.name = 'InternalServerError';
  }
}

/**
 * 503 Service Unavailable - External service down
 */
export class ServiceUnavailableError extends ApiError {
  constructor(service: string = 'Service', details?: unknown) {
    super(`${service} is currently unavailable`, 503, 'SERVICE_UNAVAILABLE', details);
    this.name = 'ServiceUnavailableError';
  }
}

/**
 * Type guard to check if error is an ApiError
 */
export function isApiError(error: unknown): error is ApiError {
  return error instanceof ApiError;
}

/**
 * Format any error into a standardized API error response
 *
 * @param error - The error to format
 * @param defaultMessage - Fallback message if error is not standard
 * @returns Formatted error object and status code
 */
export function formatApiError(
  error: unknown,
  defaultMessage: string = 'An error occurred'
): { error: object; statusCode: number } {
  // ApiError instances
  if (isApiError(error)) {
    return {
      error: error.toJSON(),
      statusCode: error.statusCode,
    };
  }

  // Standard Error instances
  if (error instanceof Error) {
    logger.error('Unhandled error in API', { error, message: error.message });
    return {
      error: {
        error: error.message || defaultMessage,
        code: 'INTERNAL_ERROR',
      },
      statusCode: 500,
    };
  }

  // Unknown error types
  logger.error('Unknown error type in API', { error });
  return {
    error: {
      error: defaultMessage,
      code: 'UNKNOWN_ERROR',
    },
    statusCode: 500,
  };
}

/**
 * Log API error with appropriate level based on status code
 *
 * @param error - The error to log
 * @param context - Additional context (route, method, etc.)
 */
export function logApiError(error: unknown, context?: Record<string, unknown>): void {
  if (isApiError(error)) {
    // Client errors (4xx) are warnings
    if (error.statusCode >= 400 && error.statusCode < 500) {
      logger.warn(`API client error: ${error.message}`, {
        statusCode: error.statusCode,
        code: error.code,
        details: error.details,
        ...context,
      });
    }
    // Server errors (5xx) are errors
    else if (error.statusCode >= 500) {
      logger.error(`API server error: ${error.message}`, {
        statusCode: error.statusCode,
        code: error.code,
        details: error.details,
        ...context,
      });
    }
  } else if (error instanceof Error) {
    logger.error(`Unhandled API error: ${error.message}`, {
      error,
      ...context,
    });
  } else {
    logger.error('Unknown API error', {
      error,
      ...context,
    });
  }
}
