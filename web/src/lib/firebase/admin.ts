import * as admin from 'firebase-admin';
import { logger } from '@/lib/logger';
import { validateServerEnv } from '@/lib/env';

let initialized = false;
let initializationError: Error | null = null;

/**
 * Custom error class for Firebase Admin initialization failures
 */
export class FirebaseAdminError extends Error {
  constructor(message: string, public originalError?: unknown) {
    super(message);
    this.name = 'FirebaseAdminError';
  }
}

/**
 * Initialize Firebase Admin SDK with proper error handling
 */
export function initializeFirebaseAdmin(): void {
  if (initialized) {
    return;
  }

  try {
    // Validate environment variables first
    const env = validateServerEnv();

    if (!admin.apps.length) {
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId: env.FIREBASE_PROJECT_ID,
          clientEmail: env.FIREBASE_CLIENT_EMAIL,
          privateKey: env.FIREBASE_PRIVATE_KEY,
        }),
        storageBucket: env.FIREBASE_STORAGE_BUCKET,
      });
      logger.info('[Firebase Admin] Successfully initialized', {
        projectId: env.FIREBASE_PROJECT_ID,
      });
    }

    initialized = true;
    initializationError = null;
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : 'Failed to initialize Firebase Admin SDK';

    logger.firebaseError('initialize', error);
    initializationError = new FirebaseAdminError(message, error);
    initialized = true;
  }
}

/**
 * Get Firestore database instance
 * @throws {FirebaseAdminError} If Firebase Admin is not properly initialized
 */
export function db(): admin.firestore.Firestore {
  if (!initialized) {
    initializeFirebaseAdmin();
  }

  if (initializationError) {
    throw initializationError;
  }

  if (!admin.apps.length) {
    throw new FirebaseAdminError('Firebase Admin app not found');
  }

  return admin.firestore();
}

/**
 * Get Firebase Storage instance
 * @throws {FirebaseAdminError} If Firebase Admin is not properly initialized
 */
export function storage(): admin.storage.Storage {
  if (!initialized) {
    initializeFirebaseAdmin();
  }

  if (initializationError) {
    throw initializationError;
  }

  if (!admin.apps.length) {
    throw new FirebaseAdminError('Firebase Admin app not found');
  }

  return admin.storage();
}

/**
 * Check if Firebase Admin is properly initialized
 */
export function isInitialized(): boolean {
  return initialized && !initializationError && admin.apps.length > 0;
}

/**
 * Get initialization error if any
 */
export function getInitializationError(): Error | null {
  return initializationError;
}

export { admin };
