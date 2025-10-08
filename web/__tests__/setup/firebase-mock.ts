/**
 * Firebase Mock
 *
 * Comprehensive mocks for Firebase services used in tests.
 * Provides realistic mock implementations for Auth, Firestore, and Storage.
 */

/**
 * Mock Firebase User
 */
export const mockFirebaseUser = {
  uid: 'test-user-123',
  email: 'test@example.com',
  displayName: 'Test User',
  photoURL: 'https://example.com/photo.jpg',
  emailVerified: true,
  isAnonymous: false,
  metadata: {
    creationTime: '2024-01-01T00:00:00.000Z',
    lastSignInTime: '2024-01-02T00:00:00.000Z',
  },
  providerData: [],
  refreshToken: 'mock-refresh-token',
  tenantId: null,
  delete: jest.fn(),
  getIdToken: jest.fn(() => Promise.resolve('mock-id-token')),
  getIdTokenResult: jest.fn(),
  reload: jest.fn(),
  toJSON: jest.fn(),
  phoneNumber: null,
  providerId: 'firebase',
};

/**
 * Mock Firebase Auth
 */
export const mockFirebaseAuth = {
  currentUser: null as any,
  onAuthStateChanged: jest.fn((callback) => {
    // Immediately call with null user
    callback(null);
    // Return unsubscribe function
    return jest.fn();
  }),
  signInWithPopup: jest.fn(() =>
    Promise.resolve({
      user: mockFirebaseUser,
      credential: null,
      operationType: 'signIn',
      providerId: 'google.com',
    })
  ),
  signInWithEmailAndPassword: jest.fn(() =>
    Promise.resolve({
      user: mockFirebaseUser,
    })
  ),
  createUserWithEmailAndPassword: jest.fn(() =>
    Promise.resolve({
      user: mockFirebaseUser,
    })
  ),
  signOut: jest.fn(() => Promise.resolve()),
  sendPasswordResetEmail: jest.fn(() => Promise.resolve()),
  updateProfile: jest.fn(() => Promise.resolve()),
  setPersistence: jest.fn(() => Promise.resolve()),
};

/**
 * Mock Firestore Document Reference
 */
export function createMockDocRef(id: string, data?: any) {
  return {
    id,
    path: `collection/${id}`,
    get: jest.fn(() =>
      Promise.resolve({
        id,
        exists: !!data,
        data: () => data,
        ref: this,
      })
    ),
    set: jest.fn(() => Promise.resolve()),
    update: jest.fn(() => Promise.resolve()),
    delete: jest.fn(() => Promise.resolve()),
    onSnapshot: jest.fn((callback) => {
      callback({
        id,
        exists: !!data,
        data: () => data,
      });
      return jest.fn(); // unsubscribe
    }),
  };
}

/**
 * Mock Firestore Collection Reference
 */
export function createMockCollectionRef(docs: any[] = []) {
  return {
    doc: jest.fn((id?: string) => createMockDocRef(id || 'auto-id')),
    add: jest.fn((data) => Promise.resolve(createMockDocRef('new-doc-id', data))),
    get: jest.fn(() =>
      Promise.resolve({
        docs: docs.map((doc, i) => ({
          id: doc.id || `doc-${i}`,
          data: () => doc,
          exists: true,
        })),
        empty: docs.length === 0,
        size: docs.length,
      })
    ),
    where: jest.fn(() => createMockCollectionRef(docs)),
    orderBy: jest.fn(() => createMockCollectionRef(docs)),
    limit: jest.fn((n) => createMockCollectionRef(docs.slice(0, n))),
    startAfter: jest.fn(() => createMockCollectionRef(docs)),
    onSnapshot: jest.fn((callback) => {
      callback({
        docs: docs.map((doc, i) => ({
          id: doc.id || `doc-${i}`,
          data: () => doc,
          exists: true,
        })),
        empty: docs.length === 0,
        size: docs.length,
      });
      return jest.fn(); // unsubscribe
    }),
  };
}

/**
 * Mock Firestore
 */
export const mockFirestore = {
  collection: jest.fn((path: string) => createMockCollectionRef()),
  doc: jest.fn((path: string) => createMockDocRef(path.split('/').pop() || 'doc-id')),
  runTransaction: jest.fn((callback) => Promise.resolve(callback())),
  batch: jest.fn(() => ({
    set: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    commit: jest.fn(() => Promise.resolve()),
  })),
};

/**
 * Mock Storage Reference
 */
export function createMockStorageRef(path: string) {
  return {
    fullPath: path,
    name: path.split('/').pop() || '',
    bucket: 'test-bucket',
    put: jest.fn(() =>
      Promise.resolve({
        ref: this,
        state: 'success',
        bytesTransferred: 1024,
        totalBytes: 1024,
      })
    ),
    putString: jest.fn(() =>
      Promise.resolve({
        ref: this,
        state: 'success',
        bytesTransferred: 512,
        totalBytes: 512,
      })
    ),
    getDownloadURL: jest.fn(() => Promise.resolve(`https://example.com/${path}`)),
    delete: jest.fn(() => Promise.resolve()),
    listAll: jest.fn(() =>
      Promise.resolve({
        items: [],
        prefixes: [],
      })
    ),
  };
}

/**
 * Mock Storage
 */
export const mockStorage = {
  ref: jest.fn((path?: string) => createMockStorageRef(path || '/')),
};

/**
 * Mock Firebase Admin Auth
 */
export const mockAdminAuth = {
  verifyIdToken: jest.fn((token: string) =>
    Promise.resolve({
      uid: 'test-user-123',
      email: 'test@example.com',
      email_verified: true,
      aud: 'test-project',
      auth_time: Date.now() / 1000,
      exp: Date.now() / 1000 + 3600,
      iat: Date.now() / 1000,
      iss: 'https://securetoken.google.com/test-project',
      sub: 'test-user-123',
    })
  ),
  getUser: jest.fn((uid: string) =>
    Promise.resolve({
      uid,
      email: 'test@example.com',
      emailVerified: true,
      displayName: 'Test User',
      photoURL: 'https://example.com/photo.jpg',
      disabled: false,
      metadata: {
        creationTime: '2024-01-01T00:00:00.000Z',
        lastSignInTime: '2024-01-02T00:00:00.000Z',
      },
      providerData: [],
      toJSON: () => ({}),
    })
  ),
  createUser: jest.fn(() =>
    Promise.resolve({
      uid: 'new-user-id',
      email: 'new@example.com',
    })
  ),
  updateUser: jest.fn(() => Promise.resolve({})),
  deleteUser: jest.fn(() => Promise.resolve()),
  listUsers: jest.fn(() =>
    Promise.resolve({
      users: [],
      pageToken: undefined,
    })
  ),
  setCustomUserClaims: jest.fn(() => Promise.resolve()),
};

/**
 * Mock Firebase Admin Firestore
 */
export const mockAdminFirestore = {
  collection: jest.fn((path: string) => createMockCollectionRef()),
  doc: jest.fn((path: string) => createMockDocRef(path.split('/').pop() || 'doc-id')),
  runTransaction: jest.fn((callback) => Promise.resolve(callback())),
  batch: jest.fn(() => ({
    set: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    commit: jest.fn(() => Promise.resolve()),
  })),
  FieldValue: {
    serverTimestamp: () => new Date(),
    increment: (n: number) => n,
    arrayUnion: (...elements: any[]) => elements,
    arrayRemove: (...elements: any[]) => elements,
    delete: () => null,
  },
  Timestamp: {
    now: () => ({
      toDate: () => new Date(),
      seconds: Math.floor(Date.now() / 1000),
      nanoseconds: 0,
    }),
    fromDate: (date: Date) => ({
      toDate: () => date,
      seconds: Math.floor(date.getTime() / 1000),
      nanoseconds: 0,
    }),
  },
};

/**
 * Reset all Firebase mocks
 * Call this in beforeEach or afterEach to ensure clean state
 */
export function resetFirebaseMocks(): void {
  jest.clearAllMocks();
  mockFirebaseAuth.currentUser = null;
}

/**
 * Set authenticated user for testing
 */
export function setMockAuthUser(user: typeof mockFirebaseUser | null): void {
  mockFirebaseAuth.currentUser = user;
}

/**
 * Simulate auth state change
 */
export function simulateAuthStateChange(user: typeof mockFirebaseUser | null): void {
  mockFirebaseAuth.currentUser = user;
  const callbacks = (mockFirebaseAuth.onAuthStateChanged as jest.Mock).mock.calls.map(
    (call) => call[0]
  );
  callbacks.forEach((callback) => callback(user));
}
