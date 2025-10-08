/**
 * Validation utilities for API routes
 */

import { NextRequest, NextResponse } from 'next/server';
import { z, ZodError } from 'zod';
import { logger } from '@/lib/logger';

export class ValidationError extends Error {
  constructor(
    public errors: z.ZodIssue[],
    message = 'Validation failed'
  ) {
    super(message);
    this.name = 'ValidationError';
  }
}

/**
 * Validates query parameters from a NextRequest
 */
export function validateQuery<T extends z.ZodType>(
  request: NextRequest,
  schema: T
): z.infer<T> {
  try {
    const searchParams = request.nextUrl.searchParams;
    const params = Object.fromEntries(searchParams.entries());
    return schema.parse(params);
  } catch (error) {
    if (error instanceof ZodError) {
      throw new ValidationError(error.errors);
    }
    throw error;
  }
}

/**
 * Validates JSON body from a NextRequest
 */
export async function validateBody<T extends z.ZodType>(
  request: NextRequest,
  schema: T
): Promise<z.infer<T>> {
  try {
    const body = await request.json();
    return schema.parse(body);
  } catch (error) {
    if (error instanceof ZodError) {
      throw new ValidationError(error.errors);
    }
    throw error;
  }
}

/**
 * Validates route parameters (like [id])
 */
export function validateParams<T extends z.ZodType>(
  params: unknown,
  schema: T
): z.infer<T> {
  try {
    return schema.parse(params);
  } catch (error) {
    if (error instanceof ZodError) {
      throw new ValidationError(error.errors);
    }
    throw error;
  }
}

/**
 * Creates a formatted error response from validation errors
 */
export function validationErrorResponse(error: ValidationError): NextResponse {
  return NextResponse.json(
    {
      error: 'Validation failed',
      details: error.errors.map((err) => ({
        field: err.path.join('.'),
        message: err.message,
        code: err.code,
      })),
    },
    { status: 400 }
  );
}

/**
 * Generic error handler for API routes
 */
export function handleApiError(error: unknown): NextResponse {
  if (error instanceof ValidationError) {
    logger.warn('API validation error', { errors: error.errors });
    return validationErrorResponse(error);
  }

  if (error instanceof Error) {
    logger.error('API error', { error, message: error.message });
    return NextResponse.json(
      {
        error: error.message || 'Internal server error',
      },
      { status: 500 }
    );
  }

  logger.error('Unknown API error', { error });
  return NextResponse.json(
    {
      error: 'Unknown error occurred',
    },
    { status: 500 }
  );
}
