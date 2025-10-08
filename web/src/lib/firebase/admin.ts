import * as admin from 'firebase-admin';

let initialized = false;

export function initializeFirebaseAdmin() {
  if (!initialized) {
    const projectId = process.env.FIREBASE_PROJECT_ID;
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
    const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');

    if (!projectId || !clientEmail || !privateKey) {
      console.warn('Firebase Admin not configured - API will return errors');
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
      }

      initialized = true;
      console.log('Firebase Admin initialized for Next.js API');
    } catch (error) {
      console.error('Failed to initialize Firebase Admin:', error);
      initialized = true;
    }
  }
}

export function db() {
  if (!initialized) {
    initializeFirebaseAdmin();
  }

  if (!admin.apps.length) {
    throw new Error('Firebase Admin not initialized');
  }

  return admin.firestore();
}

export function storage(): admin.storage.Storage {
  if (!initialized) {
    initializeFirebaseAdmin();
  }

  if (!admin.apps.length) {
    throw new Error('Firebase Admin not initialized');
  }

  return admin.storage();
}

export { admin };
