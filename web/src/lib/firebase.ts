/**
 * Firebase client SDK configuration
 */

import { initializeApp, getApps } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import {
  getAuth,
  GoogleAuthProvider,
  TwitterAuthProvider,
  OAuthProvider,
  connectAuthEmulator
} from 'firebase/auth';
import { logger } from '@/lib/logger';

const firebaseConfig = {
  apiKey: process.env['NEXT_PUBLIC_FIREBASE_API_KEY'],
  authDomain: process.env['NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN'],
  projectId: process.env['NEXT_PUBLIC_FIREBASE_PROJECT_ID'],
  storageBucket: process.env['NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET'],
  messagingSenderId: process.env['NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID'],
  appId: process.env['NEXT_PUBLIC_FIREBASE_APP_ID'],
};

// Initialize Firebase only if it hasn't been initialized yet
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0]!;

if (getApps().length === 1) {
  logger.info('[Firebase Client] Initialized', {
    projectId: firebaseConfig.projectId,
    hasApiKey: !!firebaseConfig.apiKey,
  });
}

// Initialize services
export const db = getFirestore(app);
export const storage = getStorage(app);
export const auth = getAuth(app);

// Configure auth emulator for local development
if (process.env['NODE_ENV'] === 'development' && process.env['NEXT_PUBLIC_USE_AUTH_EMULATOR'] === 'true') {
  connectAuthEmulator(auth, 'http://localhost:9099');
}

// OAuth Providers
export const googleProvider = new GoogleAuthProvider();
googleProvider.addScope('profile');
googleProvider.addScope('email');

export const twitterProvider = new TwitterAuthProvider();

// Discord OAuth Provider (uses generic OAuthProvider)
export const discordProvider = new OAuthProvider('oidc.discord');
discordProvider.addScope('identify');
discordProvider.addScope('email');

export { app };
