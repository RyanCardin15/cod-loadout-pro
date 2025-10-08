/**
 * Reusable API middleware and utilities
 *
 * This module provides standardized middleware for API routes including:
 * - Request/response handling
 * - Error handling
 * - Validation
 * - CORS
 * - Method checking
 */

import { NextRequest, NextResponse } from 'next/server';
import { ZodSchema } from 'zod';
import { logger } from '@/lib/logger';
import { formatApiError, logApiError, BadRequestError } from './errors';
import { safeValidate } from '@/lib/validation/validators';

/**
 * API handler function type
 */
export type ApiHandler = (request: NextRequest, context?: any) => Promise<NextResponse> | NextResponse;

/**
 * Middleware function type
 */
export type Middleware = (
  request: NextRequest,
  context: any,
  next: () => Promise<NextResponse>
) => Promise<NextResponse>;

/**
 * Options for createApiHandler
 */
export interface ApiHandlerOptions {
  /** Enable CORS (default: true) */
  cors?: boolean;
  /** Allowed HTTP methods (default: all) */
  allowedMethods?: string[];
  /** Custom error message for method not allowed */
  methodNotAllowedMessage?: string;
}

/**
 * Create a standardized API handler with error handling
 *
 * Wraps your handler function with consistent error handling, logging, and formatting
 *
 * @param handler - Your API route handler
 * @param options - Configuration options
 * @returns Wrapped handler with error handling
 *
 * @example
 * ```typescript
 * export const GET = createApiHandler(async (request) => {
 *   const data = await fetchData();
 *   return createSuccessResponse({ data });
 * });
 * ```
 */
export function createApiHandler(
  handler: ApiHandler,
  options: ApiHandlerOptions = {}
): ApiHandler {
  return async (request: NextRequest, context?: any) => {
    const startTime = Date.now();
    const method = request.method;
    const url = request.url;

    try {
      // Check allowed methods
      if (options.allowedMethods && !options.allowedMethods.includes(method)) {
        throw new BadRequestError(
          options.methodNotAllowedMessage || `Method ${method} not allowed`,
          { allowedMethods: options.allowedMethods }
        );
      }

      // Execute handler
      const response = await handler(request, context);

      // Add CORS headers if enabled
      if (options.cors !== false) {
        return addCorsHeaders(response);
      }

      // Log successful request
      const duration = Date.now() - startTime;
      logger.debug('API request completed', {
        method,
        url,
        status: response.status,
        duration,
      });

      return response;
    } catch (error) {
      // Log error
      logApiError(error, { method, url });

      // Format error response
      const { error: errorBody, statusCode } = formatApiError(error);

      const response = NextResponse.json(errorBody, { status: statusCode });

      // Add CORS headers if enabled
      if (options.cors !== false) {
        return addCorsHeaders(response);
      }

      return response;
    }
  };
}

/**
 * Create a success response with consistent formatting
 *
 * @param data - The data to return
 * @param status - HTTP status code (default: 200)
 * @param headers - Optional additional headers
 * @returns Formatted NextResponse
 *
 * @example
 * ```typescript
 * return createSuccessResponse({ weapons: [...] });
 * ```
 */
export function createSuccessResponse(
  data: unknown,
  status: number = 200,
  headers?: HeadersInit
): NextResponse {
  return NextResponse.json(data, { status, headers });
}

/**
 * Create an error response with consistent formatting
 *
 * @param message - Error message
 * @param status - HTTP status code (default: 500)
 * @param code - Optional error code
 * @param details - Optional error details
 * @returns Formatted NextResponse
 *
 * @example
 * ```typescript
 * return createErrorResponse('Weapon not found', 404, 'NOT_FOUND');
 * ```
 */
export function createErrorResponse(
  message: string,
  status: number = 500,
  code?: string,
  details?: unknown
): NextResponse {
  return NextResponse.json(
    {
      error: message,
      code,
      details,
    },
    { status }
  );
}

/**
 * Add CORS headers to a response
 *
 * @param response - The response to modify
 * @returns Response with CORS headers
 */
export function addCorsHeaders(response: NextResponse): NextResponse {
  const headers = new Headers(response.headers);

  headers.set('Access-Control-Allow-Origin', '*');
  headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  return new NextResponse(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

/**
 * Handle OPTIONS requests for CORS preflight
 *
 * @returns Empty 200 response with CORS headers
 *
 * @example
 * ```typescript
 * export async function OPTIONS() {
 *   return handleCorsPrelight();
 * }
 * ```
 */
export function handleCorsPreflight(): NextResponse {
  return addCorsHeaders(new NextResponse(null, { status: 200 }));
}

/**
 * Validate request query parameters
 *
 * @param request - The incoming request
 * @param schema - Zod schema to validate against
 * @returns Validated query parameters
 * @throws BadRequestError if validation fails
 *
 * @example
 * ```typescript
 * const params = validateQuery(request, weaponQuerySchema);
 * ```
 */
export function validateQuery<T>(request: NextRequest, schema: ZodSchema<T>): T {
  const searchParams = request.nextUrl.searchParams;
  const params = Object.fromEntries(searchParams.entries());

  const result = safeValidate(schema, params, 'QueryParams');

  if (!result.success) {
    throw new BadRequestError('Invalid query parameters', result.details);
  }

  return result.data;
}

/**
 * Validate request body
 *
 * @param request - The incoming request
 * @param schema - Zod schema to validate against
 * @returns Validated body data
 * @throws BadRequestError if validation fails or body is not JSON
 *
 * @example
 * ```typescript
 * const data = await validateBody(request, createLoadoutSchema);
 * ```
 */
export async function validateBody<T>(request: NextRequest, schema: ZodSchema<T>): Promise<T> {
  try {
    const body = await request.json();
    const result = safeValidate(schema, body, 'RequestBody');

    if (!result.success) {
      throw new BadRequestError('Invalid request body', result.details);
    }

    return result.data;
  } catch (error) {
    if (error instanceof BadRequestError) {
      throw error;
    }

    // JSON parsing error
    throw new BadRequestError('Invalid JSON in request body');
  }
}

/**
 * Validate route parameters
 *
 * @param params - Route parameters object
 * @param schema - Zod schema to validate against
 * @returns Validated parameters
 * @throws BadRequestError if validation fails
 *
 * @example
 * ```typescript
 * const { id } = validateParams(params, weaponIdSchema);
 * ```
 */
export function validateParams<T>(params: unknown, schema: ZodSchema<T>): T {
  const result = safeValidate(schema, params, 'RouteParams');

  if (!result.success) {
    throw new BadRequestError('Invalid route parameters', result.details);
  }

  return result.data;
}

/**
 * Compose multiple middleware functions
 *
 * @param middlewares - Array of middleware functions
 * @returns Composed middleware function
 */
export function composeMiddleware(...middlewares: Middleware[]): Middleware {
  return async (request: NextRequest, context: any, next: () => Promise<NextResponse>) => {
    let index = 0;

    const dispatch = async (): Promise<NextResponse> => {
      if (index >= middlewares.length) {
        return next();
      }

      const middleware = middlewares[index++];
      if (!middleware) {
        return next();
      }
      return middleware(request, context, dispatch);
    };

    return dispatch();
  };
}

/**
 * Logging middleware
 *
 * Logs all incoming requests with timing
 */
export const loggingMiddleware: Middleware = async (request, _context, next) => {
  const startTime = Date.now();
  const method = request.method;
  const url = request.url;

  logger.debug('API request received', { method, url });

  const response = await next();

  const duration = Date.now() - startTime;
  logger.debug('API request completed', {
    method,
    url,
    status: response.status,
    duration,
  });

  return response;
};

/**
 * Method restriction middleware
 *
 * @param allowedMethods - Array of allowed HTTP methods
 * @returns Middleware that checks method
 */
export function methodMiddleware(allowedMethods: string[]): Middleware {
  return async (request, _context, next) => {
    if (!allowedMethods.includes(request.method)) {
      throw new BadRequestError(`Method ${request.method} not allowed`, {
        allowedMethods,
      });
    }
    return next();
  };
}

/**
 * Extract user ID from authorization header
 *
 * Simple helper for authenticated routes
 * In production, you'd verify the token properly
 *
 * @param request - The incoming request
 * @returns User ID if authenticated
 * @throws UnauthorizedError if not authenticated
 */
export function extractUserId(request: NextRequest): string {
  const authHeader = request.headers.get('authorization');

  if (!authHeader) {
    throw new BadRequestError('Missing authorization header');
  }

  // This is simplified - in production, verify JWT token
  const userId = authHeader.replace('Bearer ', '');

  if (!userId) {
    throw new BadRequestError('Invalid authorization header');
  }

  return userId;
}
