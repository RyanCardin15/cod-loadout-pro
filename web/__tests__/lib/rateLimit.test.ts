/**
 * Rate Limiting Tests
 *
 * Tests the rate limiting utility for:
 * - Rate limit enforcement
 * - Request tracking
 * - Window expiration
 * - Rate limit headers
 * - Configuration options
 */

import {
  checkRateLimit,
  getRateLimitStatus,
  addRateLimitHeaders,
  withRateLimit,
  RATE_LIMITS,
} from '@/lib/api/rateLimit';
import { RateLimitError } from '@/lib/api/errors';

describe('Rate Limiting', () => {
  let mockRequest: Request;

  beforeEach(() => {
    // Create mock request
    mockRequest = new Request('http://localhost/api/test', {
      headers: {
        'x-forwarded-for': '127.0.0.1',
        'user-agent': 'test-agent',
      },
    });

    // Clear any rate limit state
    jest.clearAllMocks();
  });

  describe('checkRateLimit', () => {
    it('allows requests within limit', () => {
      const config = { max: 5, windowMs: 60000 };

      expect(() => {
        checkRateLimit(mockRequest, 'test-endpoint', config);
      }).not.toThrow();
    });

    it('throws RateLimitError when limit exceeded', () => {
      const config = { max: 3, windowMs: 60000 };

      // Make requests up to limit
      checkRateLimit(mockRequest, 'test-endpoint-2', config);
      checkRateLimit(mockRequest, 'test-endpoint-2', config);
      checkRateLimit(mockRequest, 'test-endpoint-2', config);

      // Next request should throw
      expect(() => {
        checkRateLimit(mockRequest, 'test-endpoint-2', config);
      }).toThrow(RateLimitError);
    });

    it('includes retry-after in error details', () => {
      const config = { max: 1, windowMs: 60000 };

      checkRateLimit(mockRequest, 'test-endpoint-3', config);

      try {
        checkRateLimit(mockRequest, 'test-endpoint-3', config);
        fail('Should have thrown RateLimitError');
      } catch (error) {
        expect(error).toBeInstanceOf(RateLimitError);
        if (error instanceof RateLimitError) {
          expect(error.details).toHaveProperty('retryAfter');
          expect(typeof (error.details as any).retryAfter).toBe('number');
        }
      }
    });

    it('uses custom error message when provided', () => {
      const config = {
        max: 1,
        windowMs: 60000,
        message: 'Custom rate limit message',
      };

      checkRateLimit(mockRequest, 'test-endpoint-4', config);

      try {
        checkRateLimit(mockRequest, 'test-endpoint-4', config);
        fail('Should have thrown');
      } catch (error) {
        expect((error as Error).message).toContain('Custom rate limit message');
      }
    });

    it('resets counter after window expires', async () => {
      const config = { max: 2, windowMs: 100 }; // 100ms window

      checkRateLimit(mockRequest, 'test-endpoint-5', config);
      checkRateLimit(mockRequest, 'test-endpoint-5', config);

      // Wait for window to expire
      await new Promise(resolve => setTimeout(resolve, 150));

      // Should not throw after window expires
      expect(() => {
        checkRateLimit(mockRequest, 'test-endpoint-5', config);
      }).not.toThrow();
    });

    it('tracks different endpoints separately', () => {
      const config = { max: 2, windowMs: 60000 };

      checkRateLimit(mockRequest, 'endpoint-a', config);
      checkRateLimit(mockRequest, 'endpoint-a', config);
      checkRateLimit(mockRequest, 'endpoint-b', config);
      checkRateLimit(mockRequest, 'endpoint-b', config);

      // Both should be at limit but not over
      expect(() => {
        checkRateLimit(mockRequest, 'endpoint-a', config);
      }).toThrow();

      expect(() => {
        checkRateLimit(mockRequest, 'endpoint-b', config);
      }).toThrow();
    });

    it('skips rate limiting for IPs in skip list', () => {
      const config = {
        max: 1,
        windowMs: 60000,
        skipList: ['127.0.0.1:test-agent'],
      };

      // Should be able to make unlimited requests
      checkRateLimit(mockRequest, 'test-endpoint-6', config);
      checkRateLimit(mockRequest, 'test-endpoint-6', config);
      checkRateLimit(mockRequest, 'test-endpoint-6', config);

      expect(() => {
        checkRateLimit(mockRequest, 'test-endpoint-6', config);
      }).not.toThrow();
    });
  });

  describe('getRateLimitStatus', () => {
    it('returns correct initial status', () => {
      const config = { max: 10, windowMs: 60000 };

      const status = getRateLimitStatus(mockRequest, 'test-endpoint-7', config);

      expect(status.limit).toBe(10);
      expect(status.remaining).toBe(10);
      expect(status.reset).toBeGreaterThan(Date.now());
    });

    it('decrements remaining after requests', () => {
      const config = { max: 5, windowMs: 60000 };

      checkRateLimit(mockRequest, 'test-endpoint-8', config);
      checkRateLimit(mockRequest, 'test-endpoint-8', config);

      const status = getRateLimitStatus(mockRequest, 'test-endpoint-8', config);

      expect(status.remaining).toBe(3);
    });

    it('never goes below zero remaining', () => {
      const config = { max: 2, windowMs: 60000 };

      checkRateLimit(mockRequest, 'test-endpoint-9', config);
      checkRateLimit(mockRequest, 'test-endpoint-9', config);

      try {
        checkRateLimit(mockRequest, 'test-endpoint-9', config);
      } catch (error) {
        // Expected to throw
      }

      const status = getRateLimitStatus(mockRequest, 'test-endpoint-9', config);

      expect(status.remaining).toBe(0);
    });
  });

  describe('addRateLimitHeaders', () => {
    it('adds rate limit headers to response', () => {
      const config = { max: 100, windowMs: 60000 };
      const originalResponse = new Response('OK', { status: 200 });

      const response = addRateLimitHeaders(
        originalResponse,
        mockRequest,
        'test-endpoint-10',
        config
      );

      expect(response.headers.get('X-RateLimit-Limit')).toBe('100');
      expect(response.headers.get('X-RateLimit-Remaining')).toBe('100');
      expect(response.headers.get('X-RateLimit-Reset')).toBeTruthy();
    });

    it('preserves original response body and status', async () => {
      const config = { max: 50, windowMs: 60000 };
      const originalResponse = new Response('Test body', { status: 201 });

      const response = addRateLimitHeaders(
        originalResponse,
        mockRequest,
        'test-endpoint-11',
        config
      );

      expect(response.status).toBe(201);
      const body = await response.text();
      expect(body).toBe('Test body');
    });

    it('updates remaining count correctly', () => {
      const config = { max: 10, windowMs: 60000 };

      checkRateLimit(mockRequest, 'test-endpoint-12', config);
      checkRateLimit(mockRequest, 'test-endpoint-12', config);
      checkRateLimit(mockRequest, 'test-endpoint-12', config);

      const originalResponse = new Response('OK');
      const response = addRateLimitHeaders(
        originalResponse,
        mockRequest,
        'test-endpoint-12',
        config
      );

      expect(response.headers.get('X-RateLimit-Remaining')).toBe('7');
    });
  });

  describe('withRateLimit', () => {
    it('applies rate limiting to handler', async () => {
      const config = { max: 2, windowMs: 60000 };
      const handler = jest.fn(async () => new Response('OK'));

      const limitedHandler = withRateLimit(handler, 'test-endpoint-13', config);

      // First two requests should succeed
      await limitedHandler(mockRequest);
      await limitedHandler(mockRequest);

      expect(handler).toHaveBeenCalledTimes(2);

      // Third request should be rate limited
      const response = await limitedHandler(mockRequest);

      expect(response.status).toBe(429);
      expect(handler).toHaveBeenCalledTimes(2); // Handler not called
    });

    it('adds rate limit headers to successful responses', async () => {
      const config = { max: 100, windowMs: 60000 };
      const handler = jest.fn(async () => new Response('OK'));

      const limitedHandler = withRateLimit(handler, 'test-endpoint-14', config);

      const response = await limitedHandler(mockRequest);

      expect(response.headers.get('X-RateLimit-Limit')).toBe('100');
      expect(response.headers.get('X-RateLimit-Remaining')).toBeTruthy();
    });

    it('returns rate limit error with retry-after header', async () => {
      const config = { max: 1, windowMs: 60000 };
      const handler = jest.fn(async () => new Response('OK'));

      const limitedHandler = withRateLimit(handler, 'test-endpoint-15', config);

      await limitedHandler(mockRequest);

      const response = await limitedHandler(mockRequest);

      expect(response.status).toBe(429);
      expect(response.headers.get('Retry-After')).toBeTruthy();
      expect(response.headers.get('Content-Type')).toBe('application/json');
    });

    it('passes through other errors', async () => {
      const config = { max: 100, windowMs: 60000 };
      const handler = jest.fn(async () => {
        throw new Error('Handler error');
      });

      const limitedHandler = withRateLimit(handler, 'test-endpoint-16', config);

      await expect(limitedHandler(mockRequest)).rejects.toThrow('Handler error');
    });
  });

  describe('RATE_LIMITS constants', () => {
    it('defines STRICT rate limit', () => {
      expect(RATE_LIMITS.STRICT).toEqual({
        max: 10,
        windowMs: 60 * 1000,
      });
    });

    it('defines MODERATE rate limit', () => {
      expect(RATE_LIMITS.MODERATE).toEqual({
        max: 60,
        windowMs: 60 * 1000,
      });
    });

    it('defines GENEROUS rate limit', () => {
      expect(RATE_LIMITS.GENEROUS).toEqual({
        max: 100,
        windowMs: 60 * 1000,
      });
    });

    it('defines PUBLIC rate limit', () => {
      expect(RATE_LIMITS.PUBLIC).toEqual({
        max: 200,
        windowMs: 60 * 1000,
      });
    });
  });

  describe('Edge Cases', () => {
    it('handles requests without IP headers', () => {
      const requestWithoutIP = new Request('http://localhost/api/test', {
        headers: {
          'user-agent': 'test-agent',
        },
      });

      const config = { max: 5, windowMs: 60000 };

      expect(() => {
        checkRateLimit(requestWithoutIP, 'test-endpoint-17', config);
      }).not.toThrow();
    });

    it('handles requests without user-agent', () => {
      const requestWithoutUA = new Request('http://localhost/api/test', {
        headers: {
          'x-forwarded-for': '127.0.0.1',
        },
      });

      const config = { max: 5, windowMs: 60000 };

      expect(() => {
        checkRateLimit(requestWithoutUA, 'test-endpoint-18', config);
      }).not.toThrow();
    });

    it('handles multiple IPs in x-forwarded-for', () => {
      const requestWithMultipleIPs = new Request('http://localhost/api/test', {
        headers: {
          'x-forwarded-for': '192.168.1.1, 10.0.0.1, 172.16.0.1',
          'user-agent': 'test-agent',
        },
      });

      const config = { max: 2, windowMs: 60000 };

      checkRateLimit(requestWithMultipleIPs, 'test-endpoint-19', config);
      checkRateLimit(requestWithMultipleIPs, 'test-endpoint-19', config);

      expect(() => {
        checkRateLimit(requestWithMultipleIPs, 'test-endpoint-19', config);
      }).toThrow();
    });
  });
});
