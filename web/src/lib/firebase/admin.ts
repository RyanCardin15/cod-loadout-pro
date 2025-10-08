import * as admin from 'firebase-admin';

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

  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');

  if (!projectId || !clientEmail || !privateKey) {
    const message = 'Firebase Admin credentials not configured. Please set FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, and FIREBASE_PRIVATE_KEY environment variables.';
    console.error('[Firebase Admin]', message);
    initializationError = new FirebaseAdminError(message);
    initialized = true;
    return;
  }

  try {
    if (!admin.apps.length) {
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId,
          clientEmail,
          privateKey,
        }),
        storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
      });
      console.log('[Firebase Admin] Successfully initialized');
    }

    initialized = true;
    initializationError = null;
  } catch (error) {
    const message = 'Failed to initialize Firebase Admin SDK';
    console.error('[Firebase Admin]', message, error);
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
