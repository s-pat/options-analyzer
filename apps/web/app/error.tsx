'use client';

import { useEffect } from 'react';
import * as Sentry from '@sentry/nextjs';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function ErrorPage({ error, reset }: ErrorProps) {
  useEffect(() => {
    // Report to Sentry — only fires in production when Sentry is enabled
    Sentry.captureException(error);
  }, [error]);

  const isApiError =
    error.message?.toLowerCase().includes('fetch') ||
    error.message?.toLowerCase().includes('network') ||
    error.message?.toLowerCase().includes('api') ||
    error.message?.toLowerCase().includes('500') ||
    error.message?.toLowerCase().includes('503');

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-6 py-16 text-center">

      {/* Ambient glow */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-red-500/5 rounded-full blur-[80px] pointer-events-none" />

      {/* Icon */}
      <div className="relative mb-6 flex items-center justify-center w-14 h-14 rounded-2xl bg-red-500/10 border border-red-500/20 animate-scale-in">
        <AlertTriangle className="h-6 w-6 text-red-400" />
      </div>

      {/* Heading */}
      <h1 className="text-lg font-semibold text-white/80 mb-2 animate-slide-up delay-50">
        {isApiError ? 'Data unavailable' : 'Something went wrong'}
      </h1>

      {/* Description */}
      <p className="text-sm text-white/35 max-w-xs leading-relaxed mb-8 animate-slide-up delay-100">
        {isApiError
          ? 'Market data could not be loaded. Check your connection or try again in a moment.'
          : 'An unexpected error occurred. This has been reported and we\'re looking into it.'}
      </p>

      {/* Digest — subtle debug info, invisible in prod unless contrast passes */}
      {error.digest && (
        <p className="text-[10px] text-white/15 font-mono mb-8 animate-slide-up delay-150">
          ref: {error.digest}
        </p>
      )}

      {/* Actions */}
      <div className="flex items-center gap-3 animate-slide-up delay-200">
        <button
          onClick={reset}
          className={cn(
            'flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200',
            'bg-blue-500/[0.12] text-blue-400 border border-blue-500/[0.2]',
            'hover:bg-blue-500/[0.18] active:scale-[0.97] touch-manipulation',
          )}
        >
          <RefreshCw className="h-3.5 w-3.5" />
          Try again
        </button>

        <Link
          href="/"
          className={cn(
            'flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200',
            'text-white/40 hover:text-white/70 hover:bg-white/[0.05]',
            'active:scale-[0.97] touch-manipulation',
          )}
        >
          <Home className="h-3.5 w-3.5" />
          Dashboard
        </Link>
      </div>
    </div>
  );
}
