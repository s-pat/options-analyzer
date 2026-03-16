'use client';

import { useUser, useClerk } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import { Activity, Clock, RefreshCw, LogOut } from 'lucide-react';
import { useState } from 'react';

const GRID_BG = {
  backgroundImage:
    'linear-gradient(to right, rgba(255,255,255,0.025) 1px, transparent 1px),' +
    'linear-gradient(to bottom, rgba(255,255,255,0.025) 1px, transparent 1px)',
  backgroundSize: '80px 80px',
} as const;

export default function WaitlistPage() {
  const { user } = useUser();
  const { signOut } = useClerk();
  const router = useRouter();
  const [checking, setChecking] = useState(false);

  async function handleCheckStatus() {
    setChecking(true);
    try {
      await user?.reload();
      const approved = (user?.publicMetadata as { approved?: boolean })?.approved === true;
      if (approved) {
        router.push('/auth-loading');
      }
    } finally {
      setChecking(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#060608] text-white flex items-center justify-center p-5">
      {/* Grid background */}
      <div className="fixed inset-0 pointer-events-none" style={GRID_BG} />

      {/* Ambient glows */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[450px] bg-blue-600/7 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-[400px] h-[300px] bg-violet-600/5 rounded-full blur-[120px] pointer-events-none" />

      <div
        className="relative w-full max-w-md"
        style={{ animation: 'fade-in-up 0.5s ease both' }}
      >
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="flex items-center gap-2.5 mb-3">
            <div className="w-8 h-8 rounded-lg bg-blue-500/20 border border-blue-500/30 flex items-center justify-center">
              <Activity className="h-5 w-5 text-blue-400" />
            </div>
            <span className="font-semibold text-xl tracking-tight">OptionLabs</span>
          </div>
          <span className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
            Private Beta
          </span>
        </div>

        {/* Card */}
        <div className="rounded-2xl border border-white/[0.08] bg-white/[0.025] overflow-hidden shadow-2xl shadow-black/40 p-8">
          <div className="flex flex-col items-center text-center">
            {/* Icon */}
            <div className="w-14 h-14 rounded-full bg-blue-500/15 border border-blue-500/25 flex items-center justify-center mb-5">
              <Clock className="h-7 w-7 text-blue-400" />
            </div>

            <h1 className="text-lg font-semibold text-white mb-2">
              Your access is pending
            </h1>
            <p className="text-sm text-white/45 leading-relaxed mb-6">
              We&apos;ll notify you
              {user?.primaryEmailAddress?.emailAddress && (
                <>
                  {' '}at{' '}
                  <strong className="text-white/70">
                    {user.primaryEmailAddress.emailAddress}
                  </strong>
                </>
              )}{' '}
              when your account is approved.
            </p>

            {/* Check status */}
            <button
              onClick={handleCheckStatus}
              disabled={checking}
              className="w-full py-2.5 px-4 rounded-xl bg-blue-500 hover:bg-blue-400 text-white text-sm font-semibold transition-all duration-200 hover:shadow-lg hover:shadow-blue-500/25 hover:-translate-y-0.5 disabled:opacity-50 disabled:translate-y-0 disabled:shadow-none cursor-pointer flex items-center justify-center gap-2"
            >
              {checking ? (
                <>
                  <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                  Checking…
                </>
              ) : (
                <>
                  <RefreshCw className="h-3.5 w-3.5" />
                  Check status
                </>
              )}
            </button>

            {/* Sign out */}
            <button
              onClick={() => signOut({ redirectUrl: '/landing' })}
              className="mt-4 flex items-center gap-2 text-xs text-white/30 hover:text-white/60 transition-colors cursor-pointer"
            >
              <LogOut className="h-3.5 w-3.5" />
              Sign out
            </button>
          </div>
        </div>

        {/* Footer */}
        <p className="text-xs text-white/20 text-center mt-6">
          &copy; {new Date().getFullYear()} OptionLabs &middot; For informational purposes only
        </p>
      </div>
    </div>
  );
}
