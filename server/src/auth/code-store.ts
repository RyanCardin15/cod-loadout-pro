import { db } from '../firebase/admin.js';

/**
 * Store for OAuth authorization code associations
 * Uses Firestore instead of Vercel KV for simplicity
 */

export interface AuthCodeData {
  userId: string;
  email?: string;
  displayName?: string;
  photoURL?: string;
  createdAt: number;
}

const COLLECTION_NAME = 'oauth_codes';
const EXPIRATION_MS = 10 * 60 * 1000; // 10 minutes

export class AuthCodeStore {
  /**
   * Store authorization code data
   */
  async set(code: string, data: AuthCodeData): Promise<void> {
    try {
      const firestore = db();
      await firestore.collection(COLLECTION_NAME).doc(code).set({
        ...data,
        expiresAt: Date.now() + EXPIRATION_MS,
      });
    } catch (error) {
      console.error('Failed to store auth code:', error);
      throw new Error('Failed to store authorization code');
    }
  }

  /**
   * Get and delete authorization code data (one-time use)
   */
  async getAndDelete(code: string): Promise<AuthCodeData | null> {
    try {
      const firestore = db();
      const docRef = firestore.collection(COLLECTION_NAME).doc(code);
      const doc = await docRef.get();

      if (!doc.exists) {
        return null;
      }

      const data = doc.data();

      // Check expiration
      if (data && data.expiresAt < Date.now()) {
        await docRef.delete();
        return null;
      }

      // Delete the document (one-time use)
      await docRef.delete();

      return {
        userId: data!.userId,
        email: data!.email,
        displayName: data!.displayName,
        photoURL: data!.photoURL,
        createdAt: data!.createdAt,
      };
    } catch (error) {
      console.error('Failed to retrieve auth code:', error);
      return null;
    }
  }

  /**
   * Clean up expired codes (can be called periodically)
   */
  async cleanupExpired(): Promise<number> {
    try {
      const firestore = db();
      const now = Date.now();

      const snapshot = await firestore
        .collection(COLLECTION_NAME)
        .where('expiresAt', '<', now)
        .limit(100) // Batch size
        .get();

      const batch = firestore.batch();
      snapshot.docs.forEach((doc) => {
        batch.delete(doc.ref);
      });

      await batch.commit();
      return snapshot.size;
    } catch (error) {
      console.error('Failed to cleanup expired codes:', error);
      return 0;
    }
  }
}

export const authCodeStore = new AuthCodeStore();
