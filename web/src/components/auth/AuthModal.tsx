'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { X } from 'lucide-react';
import { SignInButton } from './SignInButton';

function AuthModalContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (searchParams.get('signin') === 'true') {
      setIsOpen(true);
    }
  }, [searchParams]);

  const handleClose = () => {
    setIsOpen(false);
    router.push('/');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="relative w-full max-w-md bg-cod-gray border border-cod-accent/30 rounded-xl shadow-2xl overflow-hidden">
        {/* Close button */}
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 p-2 rounded-lg hover:bg-cod-surface/50 transition-colors"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="px-8 pt-8 pb-6 border-b border-cod-surface">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-cod-accent to-cod-accent-dark flex items-center justify-center">
              <svg
                className="w-6 h-6 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                />
              </svg>
            </div>
            <h2 className="text-2xl font-bold font-rajdhani tracking-wide">
              Welcome, Operator
            </h2>
          </div>
          <p className="text-gray-400 text-sm">
            Sign in to save loadouts, track your stats, and get personalized recommendations.
          </p>
        </div>

        {/* Content */}
        <div className="p-8 space-y-4">
          <SignInButton provider="google" variant="primary" className="w-full" />
          <SignInButton provider="discord" variant="secondary" className="w-full" />
          <SignInButton provider="twitter" variant="secondary" className="w-full" />

          <div className="pt-4 text-center">
            <p className="text-xs text-gray-500">
              By signing in, you agree to our Terms of Service and Privacy Policy.
            </p>
          </div>
        </div>

        {/* Benefits */}
        <div className="px-8 pb-8">
          <div className="bg-cod-surface/50 rounded-lg p-4 space-y-2">
            <p className="text-xs font-semibold text-cod-accent uppercase tracking-wider">
              Member Benefits
            </p>
            <ul className="space-y-1 text-sm text-gray-300">
              <li className="flex items-center gap-2">
                <span className="text-cod-accent">✓</span>
                Save unlimited loadouts
              </li>
              <li className="flex items-center gap-2">
                <span className="text-cod-accent">✓</span>
                Personalized weapon recommendations
              </li>
              <li className="flex items-center gap-2">
                <span className="text-cod-accent">✓</span>
                Track your playstyle and stats
              </li>
              <li className="flex items-center gap-2">
                <span className="text-cod-accent">✓</span>
                Access to exclusive features
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

export function AuthModal() {
  return (
    <Suspense fallback={null}>
      <AuthModalContent />
    </Suspense>
  );
}
