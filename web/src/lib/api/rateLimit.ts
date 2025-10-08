/**
 * Rate limiting utility for API routes
 *
 * This module provides in-memory rate limiting to prevent abuse
 * of public endpoints. For production, consider using Redis or
 * a dedicated rate limiting service.
 */

import { logger } from '@/lib/logger';
import { RateLimitError } from './errors';

/**
 * Rate limit configuration
 */
export interface RateLimitConfig {
  /** Maximum number of requests allowed in the window */
  max: number;
  /** Time window in milliseconds */
  windowMs: number;
  /** Optional custom error message */
  message?: string;
  /** Skip rate limiting for certain IPs (optional) */
  skipList?: string[];
}

/**
 * Request tracking entry
 */
interface RequestEntry {
  count: number;
  resetTime: number;
}

/**
 * In-memory store for rate limiting
 * Key format: "identifier:endpoint"
 */
const requestStore = new Map<string, RequestEntry>();

/**
 * Clean up expired entries every 5 minutes
 */
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of requestStore.entries()) {
    if (entry.resetTime < now) {
      requestStore.delete(key);
    }
  }
}, 5 * 60 * 1000);

/**
 * Default rate limit configurations for different endpoint types
 */
export const RATE_LIMITS = {
  /** Strict limits for write operations */
  STRICT: {
    max: 10,
    windowMs: 60 * 1000, // 1 minute
  },
  /** Moderate limits for authenticated endpoints */
  MODERATE: {
    max: 60,
    windowMs: 60 * 1000, // 1 minute
  },
  /** Generous limits for read-only endpoints */
  GENEROUS: {
    max: 100,
    windowMs: 60 * 1000, // 1 minute
  },
  /** Very permissive for public data */
  PUBLIC: {
    max: 200,
    windowMs: 60 * 1000, // 1 minute
  },
} as const;

/**
 * Get client identifier from request
 *
 * Uses IP address and User-Agent for identification.
 * In production, you might want to use user ID for authenticated requests.
 *
 * @param request - The incoming request
 * @returns Client identifier string
 */
function getClientIdentifier(request: Request): string {
  // Try to get IP from various headers (for proxy/load balancer support)
  const forwardedFor = request.headers.get('x-forwarded-for');
  const realIp = request.headers.get('x-real-ip');
  const ip = forwardedFor?.split(',')[0] || realIp || 'unknown';

  // Include user agent for additional uniqueness
  const userAgent = request.headers.get('user-agent') || 'unknown';

  // Create a simple hash of the identifier
  const identifier = `${ip}:${userAgent.substring(0, 50)}`;

  return identifier;
}

/**
 * Check rate limit for a request
 *
 * @param request - The incoming request
 * @param endpoint - Endpoint identifier (e.g., 'GET:/api/weapons')
 * @param config - Rate limit configuration
 * @throws RateLimitError if limit exceeded
 *
 * @example
 * ```typescript
 * // In your API route
 * export async function GET(request: Request) {
 *   checkRateLimit(request, 'GET:/api/weapons', RATE_LIMITS.GENEROUS);
 *   // ... rest of your handler
 * }
 * ```
 */
export function checkRateLimit(
  request: Request,
  endpoint: string,
  config: RateLimitConfig
): void {
  const identifier = getClientIdentifier(request);
  const key = `${identifier}:${endpoint}`;

  // Check if identifier is in skip list
  if (config.skipList?.includes(identifier)) {
    return;
  }

  const now = Date.now();
  const entry = requestStore.get(key);

  // No previous requests or window expired
  if (!entry || entry.resetTime < now) {
    requestStore.set(key, {
      count: 1,
      resetTime: now + config.windowMs,
    });
    return;
  }

  // Increment request count
  entry.count++;

  // Check if limit exceeded
  if (entry.count > config.max) {
    const retryAfter = Math.ceil((entry.resetTime - now) / 1000);

    logger.warn('Rate limit exceeded', {
      identifier,
      endpoint,
      count: entry.count,
      max: config.max,
      retryAfter,
    });

    throw new RateLimitError(
      config.message || `Rate limit exceeded. Try again in ${retryAfter} seconds.`,
      retryAfter
    );
  }
}

/**
 * Get rate limit status for a request (without incrementing)
 *
 * Useful for adding rate limit headers to responses
 *
 * @param request - The incoming request
 * @param endpoint - Endpoint identifier
 * @returns Rate limit status
 */
export function getRateLimitStatus(
  request: Request,
  endpoint: string,
  config: RateLimitConfig
): {
  limit: number;
  remaining: number;
  reset: number;
} {
  const identifier = getClientIdentifier(request);
  const key = `${identifier}:${endpoint}`;
  const now = Date.now();
  const entry = requestStore.get(key);

  if (!entry || entry.resetTime < now) {
    return {
      limit: config.max,
      remaining: config.max,
      reset: now + config.windowMs,
    };
  }

  return {
    limit: config.max,
    remaining: Math.max(0, config.max - entry.count),
    reset: entry.resetTime,
  };
}

/**
 * Add rate limit headers to a response
 *
 * @param response - The response to modify
 * @param request - The original request
 * @param endpoint - Endpoint identifier
 * @param config - Rate limit configuration
 * @returns Response with rate limit headers
 */
export function addRateLimitHeaders(
  response: Response,
  request: Request,
  endpoint: string,
  config: RateLimitConfig
): Response {
  const status = getRateLimitStatus(request, endpoint, config);

  const headers = new Headers(response.headers);
  headers.set('X-RateLimit-Limit', status.limit.toString());
  headers.set('X-RateLimit-Remaining', status.remaining.toString());
  headers.set('X-RateLimit-Reset', Math.ceil(status.reset / 1000).toString());

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

/**
 * Create a rate-limited API handler
 *
 * Wrapper function that applies rate limiting to an API route handler
 *
 * @param handler - The API route handler function
 * @param endpoint - Endpoint identifier
 * @param config - Rate limit configuration
 * @returns Wrapped handler with rate limiting
 *
 * @example
 * ```typescript
 * export const GET = withRateLimit(
 *   async (request: Request) => {
 *     // Your handler logic
 *   },
 *   'GET:/api/weapons',
 *   RATE_LIMITS.GENEROUS
 * );
 * ```
 */
export function withRateLimit(
  handler: (...args: any[]) => Promise<Response>,
  endpoint: string,
  config: RateLimitConfig
) {
  return async (...args: any[]): Promise<Response> => {
    const request = args[0] as Request;

    try {
      checkRateLimit(request, endpoint, config);
      const response = await handler(...args);
      return addRateLimitHeaders(response, request, endpoint, config);
    } catch (error) {
      if (error instanceof RateLimitError) {
        const headers = new Headers();
        headers.set('Content-Type', 'application/json');
        if (error.details && typeof error.details === 'object' && 'retryAfter' in error.details) {
          headers.set('Retry-After', String(error.details.retryAfter));
        }

        return new Response(JSON.stringify(error.toJSON()), {
          status: error.statusCode,
          headers,
        });
      }
      throw error;
    }
  };
}
