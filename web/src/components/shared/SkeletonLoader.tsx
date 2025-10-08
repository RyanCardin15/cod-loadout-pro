import React from 'react';
import { cn } from '@/lib/utils/cn';

interface SkeletonProps {
  className?: string;
  variant?: 'text' | 'circular' | 'rectangular' | 'rounded';
}

export const Skeleton: React.FC<SkeletonProps> = ({
  className,
  variant = 'rectangular'
}) => {
  const baseClasses = 'bg-gradient-to-r from-cod-surface via-cod-gray to-cod-surface bg-[length:200%_100%] animate-skeleton';

  const variantClasses = {
    text: 'h-4 w-full rounded',
    circular: 'rounded-full',
    rectangular: 'w-full',
    rounded: 'rounded-xl'
  };

  return (
    <div
      className={cn(baseClasses, variantClasses[variant], className)}
      role="status"
      aria-label="Loading..."
    />
  );
};

// Specialized skeleton components for different widget contexts

export const LoadoutCardSkeleton: React.FC = () => {
  return (
    <div className="bg-cod-black text-white p-6 max-w-3xl mx-auto">
      {/* Header skeleton */}
      <div className="mb-6 pb-4 border-b border-gray-700">
        <div className="flex items-center gap-3 mb-2">
          <Skeleton className="h-8 w-8 rounded-lg" variant="rectangular" />
          <Skeleton className="h-8 w-64" variant="text" />
        </div>
        <Skeleton className="h-4 w-32" variant="text" />
      </div>

      {/* Primary weapon skeleton */}
      <div className="mb-6 bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-2xl border border-white/20 rounded-xl p-6">
        <div className="flex items-center gap-2 mb-4 pb-3 border-b border-gray-700">
          <Skeleton className="h-6 w-6 rounded" variant="rectangular" />
          <div className="flex-1">
            <Skeleton className="h-6 w-48 mb-2" variant="text" />
            <Skeleton className="h-4 w-32" variant="text" />
          </div>
        </div>

        {/* Attachments skeleton */}
        <div>
          <Skeleton className="h-4 w-24 mb-3" variant="text" />
          <div className="space-y-2">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex items-center gap-3 bg-cod-black/50 rounded px-3 py-2">
                <Skeleton className="h-4 w-16" variant="text" />
                <Skeleton className="h-4 w-40" variant="text" />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Perks & Equipment skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {[1, 2].map((i) => (
          <div key={i} className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-2xl border border-white/20 rounded-xl p-6">
            <Skeleton className="h-4 w-24 mb-3" variant="text" />
            <div className="space-y-2">
              {[1, 2, 3].map((j) => (
                <div key={j} className="flex items-start gap-2">
                  <Skeleton className="h-4 w-16" variant="text" />
                  <Skeleton className="h-4 w-32" variant="text" />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export const CounterSuggestionsSkeleton: React.FC = () => {
  return (
    <div className="bg-cod-black text-white p-6 max-w-4xl mx-auto">
      {/* Header skeleton */}
      <div className="mb-6 pb-4 border-b border-gray-700">
        <div className="flex items-center gap-3 mb-2">
          <Skeleton className="h-8 w-8 rounded-lg" variant="rectangular" />
          <Skeleton className="h-8 w-96" variant="text" />
        </div>
        <Skeleton className="h-4 w-48" variant="text" />
      </div>

      {/* Analysis cards skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        {[1, 2].map((i) => (
          <div key={i} className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl border border-white/20 rounded-xl p-6">
            <Skeleton className="h-4 w-32 mb-3" variant="text" />
            <div className="space-y-2">
              {[1, 2, 3].map((j) => (
                <div key={j} className="flex items-start gap-2">
                  <Skeleton className="h-4 w-4 rounded-full" variant="circular" />
                  <Skeleton className="h-4 flex-1" variant="text" />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Counter weapons skeleton */}
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-2xl border border-white/20 rounded-xl p-6">
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-1">
                  <Skeleton className="h-6 w-8" variant="text" />
                  <Skeleton className="h-6 w-48" variant="text" />
                  <Skeleton className="h-5 w-20 rounded" variant="rectangular" />
                </div>
              </div>
              <div className="text-right ml-4">
                <Skeleton className="h-4 w-24 mb-1" variant="text" />
                <Skeleton className="h-8 w-16" variant="text" />
              </div>
            </div>
            <Skeleton className="h-2 w-full mb-3 rounded-full" variant="rectangular" />
            <Skeleton className="h-12 w-full rounded" variant="rectangular" />
          </div>
        ))}
      </div>
    </div>
  );
};

export const WeaponListSkeleton: React.FC = () => {
  return (
    <div className="bg-cod-black text-white p-6 max-w-4xl mx-auto">
      {/* Header skeleton */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <Skeleton className="h-8 w-8 rounded-lg" variant="rectangular" />
          <Skeleton className="h-8 w-64" variant="text" />
        </div>
        <div className="flex gap-2 flex-wrap">
          <Skeleton className="h-6 w-20 rounded-full" variant="rectangular" />
          <Skeleton className="h-6 w-24 rounded-full" variant="rectangular" />
        </div>
      </div>

      {/* Weapon cards skeleton */}
      <div className="space-y-4">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-2xl border border-white/20 rounded-xl p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-1">
                  <Skeleton className="h-6 w-8" variant="text" />
                  <Skeleton className="h-6 w-48" variant="text" />
                  <Skeleton className="h-6 w-20 rounded" variant="rectangular" />
                </div>
                <div className="flex items-center gap-3">
                  <Skeleton className="h-4 w-24" variant="text" />
                  <Skeleton className="h-4 w-16" variant="text" />
                  <Skeleton className="h-4 w-32" variant="text" />
                </div>
              </div>
              <div className="text-right ml-4">
                <Skeleton className="h-4 w-12 mb-1" variant="text" />
                <Skeleton className="h-8 w-16" variant="text" />
              </div>
            </div>

            {/* Stats skeleton */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t border-gray-700">
              {[1, 2, 3, 4].map((j) => (
                <div key={j} className="mb-2">
                  <div className="flex justify-between mb-1">
                    <Skeleton className="h-3 w-12" variant="text" />
                    <Skeleton className="h-3 w-8" variant="text" />
                  </div>
                  <Skeleton className="h-2 w-full rounded-full" variant="rectangular" />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export const MetaTierListSkeleton: React.FC = () => {
  return (
    <div className="bg-cod-black text-white p-6 max-w-4xl mx-auto">
      {/* Header skeleton */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <Skeleton className="h-8 w-8 rounded-lg" variant="rectangular" />
          <Skeleton className="h-8 w-64" variant="text" />
        </div>
        <Skeleton className="h-4 w-40" variant="text" />
      </div>

      {/* Tier sections skeleton */}
      {[1, 2, 3].map((tier) => (
        <div key={tier} className="mb-6">
          <div className="flex items-center gap-3 mb-3">
            <Skeleton className="h-10 w-16 rounded-lg" variant="rectangular" />
            <Skeleton className="h-4 w-48" variant="text" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {[1, 2, 3].map((weapon) => (
              <div key={weapon} className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-2xl border border-white/20 rounded-xl p-5">
                <div className="flex justify-between items-start mb-2">
                  <Skeleton className="h-6 w-32" variant="text" />
                  <Skeleton className="h-4 w-12" variant="text" />
                </div>
                <Skeleton className="h-2 w-full rounded-full" variant="rectangular" />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};
