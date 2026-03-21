'use client';

import { useEffect } from 'react';
import { AlertTriangle, RotateCcw } from 'lucide-react';

export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex flex-1 items-center justify-center p-6 min-h-[60vh]">
      <div className="flex flex-col items-center gap-5 text-center max-w-md">
        <div className="w-14 h-14 rounded-2xl bg-red-500/[0.08] border border-red-500/[0.15] flex items-center justify-center">
          <AlertTriangle className="h-6 w-6 text-red-400" />
        </div>
        <div className="space-y-1.5">
          <h2 className="text-lg font-semibold text-white/80">Something went wrong</h2>
          <p className="text-sm text-white/40 leading-relaxed">
            {error.message ?? 'An unexpected error occurred. Please try again.'}
          </p>
        </div>
        <button
          onClick={reset}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/[0.05] border border-white/[0.08] text-sm text-white/70 hover:text-white hover:bg-white/[0.08] transition-colors"
        >
          <RotateCcw className="h-3.5 w-3.5" />
          Try again
        </button>
      </div>
    </div>
  );
}
