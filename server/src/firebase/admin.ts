import * as admin from 'firebase-admin';

let initialized = false;

export function initializeFirebase() {
  if (!initialized) {
    const projectId = process.env.FIREBASE_PROJECT_ID;
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
    const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');

    if (!projectId || !clientEmail || !privateKey) {
      console.warn('Firebase environment variables not configured. Tools will return mock data.');
      initialized = true; // Mark as initialized to prevent retries
      return;
    }

    try {
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId,
          clientEmail,
          privateKey,
        }),
        storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
      });

      initialized = true;
      console.log('Firebase initialized successfully');
    } catch (error) {
      console.error('Failed to initialize Firebase:', error);
      initialized = true; // Mark as initialized to prevent retries
    }
  }
}

export function db() {
  if (!initialized) {
    initializeFirebase();
  }

  // Check if Firebase is actually available
  if (!admin.apps.length) {
    throw new Error('Firebase not initialized - environment variables missing');
  }

  return admin.firestore();
}

export function storage(): admin.storage.Storage {
  if (!initialized) {
    initializeFirebase();
  }

  // Check if Firebase is actually available
  if (!admin.apps.length) {
    throw new Error('Firebase not initialized - environment variables missing');
  }

  return admin.storage();
}

export function auth(): admin.auth.Auth {
  if (!initialized) {
    initializeFirebase();
  }

  // Check if Firebase is actually available
  if (!admin.apps.length) {
    throw new Error('Firebase not initialized - environment variables missing');
  }

  return admin.auth();
}

export { admin };