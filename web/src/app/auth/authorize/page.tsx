'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { signInWithPopup, GoogleAuthProvider, getAuth } from 'firebase/auth';
import { initializeApp, getApps } from 'firebase/app';

// Initialize Firebase client
const firebaseConfig = {
  apiKey: process.env['NEXT_PUBLIC_FIREBASE_API_KEY'],
  authDomain: process.env['NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN'],
  projectId: process.env['NEXT_PUBLIC_FIREBASE_PROJECT_ID'],
  storageBucket: process.env['NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET'],
  messagingSenderId: process.env['NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID'],
  appId: process.env['NEXT_PUBLIC_FIREBASE_APP_ID'],
};

if (!getApps().length) {
  initializeApp(firebaseConfig);
}

function AuthorizeContent() {
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<'loading' | 'authenticating' | 'success' | 'error'>('loading');
  const [error, setError] = useState<string | null>(null);
  const [autoSignIn] = useState(true);

  // Get OAuth parameters from URL
  const clientId = searchParams.get('client_id');
  const code = searchParams.get('code');
  const redirectUri = searchParams.get('redirect_uri');
  const state = searchParams.get('state');
  const scope = searchParams.get('scope');

  useEffect(() => {
    // Validate required parameters
    if (!clientId || !code || !redirectUri) {
      setStatus('error');
      setError('Missing required OAuth parameters');
      return;
    }

    // For ChatGPT apps SDK, automatically start sign-in
    if (autoSignIn && status === 'loading') {
      handleGoogleSignIn();
    }
  }, [clientId, code, redirectUri, autoSignIn, status]);

  const handleGoogleSignIn = async () => {
    try {
      setStatus('authenticating');
      setError(null);

      const auth = getAuth();
      const provider = new GoogleAuthProvider();

      // Add scopes if requested
      if (scope) {
        const scopes = scope.split(' ');
        scopes.forEach((s) => {
          if (s === 'profile' || s === 'email') {
            provider.addScope(s);
          }
        });
      }

      // Sign in with Google
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      // Get Firebase ID token
      const idToken = await user.getIdToken();

      // Exchange authorization code with user info
      const response = await fetch('/api/oauth/exchange', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          code,
          userId: user.uid,
          idToken,
          email: user.email,
          displayName: user.displayName,
          photoURL: user.photoURL,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to exchange authorization code');
      }

      setStatus('success');

      // Build success redirect URL
      const successUrl = new URL(redirectUri!);
      successUrl.searchParams.set('code', code!);
      if (state) {
        successUrl.searchParams.set('state', state);
      }

      // Redirect back to the OAuth client (ChatGPT)
      window.location.href = successUrl.href;
    } catch (err: any) {
      console.error('Google Sign-In error:', err);
      setStatus('error');
      setError(err.message || 'Failed to sign in with Google');

      // Build error redirect URL
      if (redirectUri) {
        const errorUrl = new URL(redirectUri);
        errorUrl.searchParams.set('error', 'access_denied');
        errorUrl.searchParams.set('error_description', err.message || 'User cancelled authorization');
        if (state) {
          errorUrl.searchParams.set('state', state);
        }

        // Give user a chance to see the error before redirecting
        setTimeout(() => {
          window.location.href = errorUrl.href;
        }, 3000);
      }
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-cod-bg p-4">
      <div className="max-w-md w-full bg-cod-gray border border-cod-accent/30 rounded-xl shadow-2xl p-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-cod-accent to-cod-accent-dark mb-4">
            <svg
              className="w-8 h-8 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
              />
            </svg>
          </div>
          <h1 className="text-2xl font-bold font-rajdhani tracking-wide mb-2">
            Authorize Counterplay
          </h1>
          <p className="text-gray-400 text-sm">
            {status === 'loading' && 'Preparing authorization...'}
            {status === 'authenticating' && 'Signing in with Google...'}
            {status === 'success' && 'Authorization successful!'}
            {status === 'error' && 'Authorization failed'}
          </p>
        </div>

        {/* Status */}
        <div className="space-y-4">
          {status === 'loading' && (
            <div className="flex justify-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cod-accent" />
            </div>
          )}

          {status === 'authenticating' && (
            <div className="space-y-4">
              <div className="flex justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cod-accent" />
              </div>
              <div className="bg-cod-surface/50 rounded-lg p-4">
                <p className="text-sm text-gray-300 text-center">
                  Please complete the Google Sign-In popup to continue...
                </p>
              </div>
            </div>
          )}

          {status === 'success' && (
            <div className="space-y-4">
              <div className="flex justify-center text-cod-accent">
                <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <div className="bg-cod-surface/50 rounded-lg p-4">
                <p className="text-sm text-gray-300 text-center">
                  Authorization successful! Redirecting you back to ChatGPT...
                </p>
              </div>
            </div>
          )}

          {status === 'error' && (
            <div className="space-y-4">
              <div className="flex justify-center text-red-500">
                <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-4">
                <p className="text-sm text-red-300 text-center">{error}</p>
              </div>
              <button
                onClick={() => {
                  setStatus('loading');
                  setError(null);
                  handleGoogleSignIn();
                }}
                className="w-full px-4 py-2 bg-cod-accent hover:bg-cod-accent-dark rounded-lg font-semibold transition-colors"
              >
                Try Again
              </button>
            </div>
          )}

          {/* Manual sign-in option */}
          {status === 'loading' && !autoSignIn && (
            <button
              onClick={handleGoogleSignIn}
              className="w-full flex items-center justify-center gap-3 px-4 py-3 bg-white hover:bg-gray-100 text-gray-800 rounded-lg font-semibold transition-colors"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path
                  fill="currentColor"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="currentColor"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="currentColor"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="currentColor"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              Sign in with Google
            </button>
          )}
        </div>

        {/* Info */}
        <div className="mt-8 pt-6 border-t border-cod-surface">
          <p className="text-xs text-gray-500 text-center">
            By authorizing, you allow ChatGPT to access your Counterplay account and use the
            available tools on your behalf.
          </p>
        </div>
      </div>
    </div>
  );
}

export default function AuthorizePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-cod-bg">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cod-accent" />
        </div>
      }
    >
      <AuthorizeContent />
    </Suspense>
  );
}
