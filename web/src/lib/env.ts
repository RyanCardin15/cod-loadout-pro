/**
 * Environment Variable Validation
 *
 * Uses Zod to validate and provide type-safe access to environment variables.
 * This ensures all required env vars are present and correctly formatted at runtime.
 *
 * Benefits:
 * - Fail fast with clear error messages if env vars are missing
 * - Type-safe access to env vars throughout the app
 * - Single source of truth for environment configuration
 * - Helpful error messages for developers
 */

import { z } from 'zod';

/**
 * Firebase Admin SDK environment variables (server-side only)
 */
const firebaseAdminSchema = z.object({
  FIREBASE_PROJECT_ID: z.string().min(1, 'Firebase project ID is required'),
  FIREBASE_CLIENT_EMAIL: z
    .string()
    .email('Firebase client email must be a valid email'),
  FIREBASE_PRIVATE_KEY: z
    .string()
    .min(1, 'Firebase private key is required')
    .transform((key) => key.replace(/\\n/g, '\n')), // Handle escaped newlines
  FIREBASE_STORAGE_BUCKET: z.string().optional(),
});

/**
 * Firebase Client SDK environment variables (public, browser-safe)
 */
const firebaseClientSchema = z.object({
  NEXT_PUBLIC_FIREBASE_API_KEY: z
    .string()
    .min(1, 'Firebase API key is required'),
  NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: z
    .string()
    .min(1, 'Firebase auth domain is required'),
  NEXT_PUBLIC_FIREBASE_PROJECT_ID: z
    .string()
    .min(1, 'Firebase project ID is required'),
  NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET: z
    .string()
    .min(1, 'Firebase storage bucket is required'),
  NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID: z
    .string()
    .min(1, 'Firebase messaging sender ID is required'),
  NEXT_PUBLIC_FIREBASE_APP_ID: z
    .string()
    .min(1, 'Firebase app ID is required'),
  NEXT_PUBLIC_USE_AUTH_EMULATOR: z
    .string()
    .optional()
    .transform((val) => val === 'true'),
});

/**
 * OAuth configuration (optional, for ChatGPT integration)
 */
const oauthSchema = z.object({
  OAUTH_CLIENT_ID: z.string().optional(),
  OAUTH_CLIENT_SECRET: z.string().optional(),
  OAUTH_REDIRECT_URI: z.string().url().optional(),
});

/**
 * Application configuration
 */
const appConfigSchema = z.object({
  NODE_ENV: z
    .enum(['development', 'production', 'test'])
    .default('development'),
  MCP_SERVER_NAME: z.string().optional(),
  MCP_SERVER_VERSION: z.string().optional(),
});

/**
 * Complete environment schema
 */
const envSchema = z.object({
  ...firebaseAdminSchema.shape,
  ...firebaseClientSchema.shape,
  ...oauthSchema.shape,
  ...appConfigSchema.shape,
});

/**
 * Parsed and validated environment variables
 */
export type Env = z.infer<typeof envSchema>;

/**
 * Validate server-side environment variables
 * Used by Firebase Admin SDK and API routes
 */
export function validateServerEnv(): z.infer<typeof firebaseAdminSchema> {
  try {
    return firebaseAdminSchema.parse({
      FIREBASE_PROJECT_ID: process.env['FIREBASE_PROJECT_ID'],
      FIREBASE_CLIENT_EMAIL: process.env['FIREBASE_CLIENT_EMAIL'],
      FIREBASE_PRIVATE_KEY: process.env['FIREBASE_PRIVATE_KEY'],
      FIREBASE_STORAGE_BUCKET: process.env['FIREBASE_STORAGE_BUCKET'],
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      const missingVars = error.errors
        .map((err) => `  - ${err.path.join('.')}: ${err.message}`)
        .join('\n');

      throw new Error(
        `❌ Invalid server environment variables:\n${missingVars}\n\n` +
          `Please check your .env file and ensure all required Firebase Admin variables are set.\n` +
          `See .env.example for the required format.`
      );
    }
    throw error;
  }
}

/**
 * Validate client-side environment variables
 * Used by Firebase Client SDK in the browser
 */
export function validateClientEnv(): z.infer<typeof firebaseClientSchema> {
  try {
    return firebaseClientSchema.parse({
      NEXT_PUBLIC_FIREBASE_API_KEY: process.env['NEXT_PUBLIC_FIREBASE_API_KEY'],
      NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN:
        process.env['NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN'],
      NEXT_PUBLIC_FIREBASE_PROJECT_ID:
        process.env['NEXT_PUBLIC_FIREBASE_PROJECT_ID'],
      NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET:
        process.env['NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET'],
      NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID:
        process.env['NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID'],
      NEXT_PUBLIC_FIREBASE_APP_ID: process.env['NEXT_PUBLIC_FIREBASE_APP_ID'],
      NEXT_PUBLIC_USE_AUTH_EMULATOR: process.env['NEXT_PUBLIC_USE_AUTH_EMULATOR'],
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      const missingVars = error.errors
        .map((err) => `  - ${err.path.join('.')}: ${err.message}`)
        .join('\n');

      throw new Error(
        `❌ Invalid client environment variables:\n${missingVars}\n\n` +
          `Please check your .env file and ensure all required Firebase Client variables are set.\n` +
          `See .env.example for the required format.`
      );
    }
    throw error;
  }
}

/**
 * Validate all environment variables (use in development/testing)
 */
export function validateEnv(): Env {
  try {
    return envSchema.parse({
      ...process.env,
      NEXT_PUBLIC_USE_AUTH_EMULATOR: process.env['NEXT_PUBLIC_USE_AUTH_EMULATOR'],
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      const missingVars = error.errors
        .map((err) => `  - ${err.path.join('.')}: ${err.message}`)
        .join('\n');

      throw new Error(
        `❌ Invalid environment variables:\n${missingVars}\n\n` +
          `Please check your .env file and ensure all required variables are set.\n` +
          `See .env.example for the required format.`
      );
    }
    throw error;
  }
}

/**
 * Get a specific environment variable with validation
 */
export function getEnv<K extends keyof Env>(key: K): Env[K] {
  const value = process.env[key];

  if (value === undefined) {
    throw new Error(
      `Environment variable ${String(key)} is not defined.\n` +
        `Please add it to your .env file. See .env.example for reference.`
    );
  }

  return value as Env[K];
}

/**
 * Check if we're in development mode
 */
export const isDevelopment = process.env['NODE_ENV'] === 'development';

/**
 * Check if we're in production mode
 */
export const isProduction = process.env['NODE_ENV'] === 'production';

/**
 * Check if we're in test mode
 */
export const isTest = process.env['NODE_ENV'] === 'test';
