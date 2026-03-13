import { Compass, Home } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-6 py-16 text-center">

      {/* Ambient glow */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-blue-500/[0.04] rounded-full blur-[80px] pointer-events-none" />

      {/* Monospaced 404 — treat it like a data point, not a headline */}
      <p className="font-mono text-[11px] text-white/20 tracking-[0.2em] uppercase mb-5 animate-slide-up">
        404
      </p>

      {/* Icon */}
      <div className="relative mb-5 flex items-center justify-center w-14 h-14 rounded-2xl bg-white/[0.04] border border-white/[0.08] animate-scale-in">
        <Compass className="h-6 w-6 text-white/30" />
      </div>

      {/* Heading */}
      <h1 className="text-base font-semibold text-white/70 mb-2 animate-slide-up delay-50">
        Page not found
      </h1>

      <p className="text-sm text-white/30 max-w-[260px] leading-relaxed mb-8 animate-slide-up delay-100">
        This route doesn&apos;t exist. Head back to the dashboard to continue.
      </p>

      <Link
        href="/"
        className={cn(
          'flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200',
          'bg-blue-500/[0.12] text-blue-400 border border-blue-500/[0.2]',
          'hover:bg-blue-500/[0.18] active:scale-[0.97] touch-manipulation',
          'animate-slide-up delay-150',
        )}
      >
        <Home className="h-3.5 w-3.5" />
        Go to Dashboard
      </Link>
    </div>
  );
}
