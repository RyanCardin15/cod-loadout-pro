import * as admin from 'firebase-admin';

let initialized = false;

export function initializeFirebase() {
  if (!initialized) {
    const projectId = process.env.FIREBASE_PROJECT_ID;
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
    const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');

    if (!projectId || !clientEmail || !privateKey) {
      throw new Error('Missing Firebase configuration environment variables');
    }

    admin.initializeApp({
      credential: admin.credential.cert({
        projectId,
        clientEmail,
        privateKey,
      }),
      storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
    });

    initialized = true;
  }
}

export function db() {
  if (!initialized) {
    initializeFirebase();
  }
  return admin.firestore();
}

export function storage() {
  if (!initialized) {
    initializeFirebase();
  }
  return admin.storage();
}

export function auth() {
  if (!initialized) {
    initializeFirebase();
  }
  return admin.auth();
}

export { admin };