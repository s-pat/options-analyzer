'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { preload } from 'swr';
import { Activity, ArrowLeft, Check, ChevronRight, Eye, EyeOff } from 'lucide-react';
import { StockLoader } from '@/components/ui/StockLoader';
import {
  getMarketOverview,
  getStocks,
  getTodayOpportunities,
  getRecommendations,
} from '@/lib/api';

function preloadAllPages() {
  preload('market/overview', getMarketOverview);
  preload('stocks', getStocks);
  preload('options/today', getTodayOpportunities);
  preload('options/recommendations/20', () => getRecommendations(20));
}

const BUFFER_MS = 10_000;

const GRID_BG = {
  backgroundImage:
    'linear-gradient(to right, rgba(255,255,255,0.025) 1px, transparent 1px),' +
    'linear-gradient(to bottom, rgba(255,255,255,0.025) 1px, transparent 1px)',
  backgroundSize: '80px 80px',
} as const;

// ── Buffer screen (shown after successful auth) ───────────────────────────────

function BufferScreen() {
  return (
    <div className="min-h-screen bg-[#060608] text-white flex items-center justify-center p-4">
      <div className="fixed inset-0 pointer-events-none" style={GRID_BG} />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-blue-600/8 rounded-full blur-[130px] pointer-events-none" />

      <div
        className="relative flex flex-col items-center gap-8 w-full max-w-xs"
        style={{ animation: 'fade-in-up 0.5s ease both' }}
      >
        {/* Logo */}
        <div className="flex flex-col items-center gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-500/20 border border-blue-500/30 flex items-center justify-center">
              <Activity className="h-5 w-5 text-blue-400" />
            </div>
            <span className="font-semibold text-xl tracking-tight">OptionsLab</span>
          </div>
          <span className="text-xs font-medium px-3 py-1 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20">
            Private Beta
          </span>
        </div>

        {/* Loader */}
        <StockLoader size="md" />

        {/* Progress */}
        <div className="w-full space-y-2">
          <div className="h-0.5 w-full rounded-full bg-white/[0.08] overflow-hidden">
            <div
              className="h-full rounded-full bg-blue-500"
              style={{
                width: '0%',
                animation: `progress-10s ${BUFFER_MS}ms linear forwards`,
              }}
            />
          </div>
          <p className="text-xs text-white/35 text-center">Preparing your dashboard…</p>
        </div>
      </div>
    </div>
  );
}

// ── Gate page ─────────────────────────────────────────────────────────────────

type Tab = 'password' | 'access';

export default function GatePage() {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>('password');
  const [authenticated, setAuthenticated] = useState(false);

  // Password tab
  const [password, setPassword]   = useState('');
  const [showPw, setShowPw]       = useState(false);
  const [pwError, setPwError]     = useState('');
  const [pwLoading, setPwLoading] = useState(false);

  // Access tab
  const [name, setName]               = useState('');
  const [email, setEmail]             = useState('');
  const [reason, setReason]           = useState('');
  const [submitted, setSubmitted]     = useState(false);
  const [accessError, setAccessError] = useState('');
  const [accessLoading, setAccessLoading] = useState(false);

  useEffect(() => {
    if (!authenticated) return;
    const t = setTimeout(() => router.push('/'), BUFFER_MS);
    return () => clearTimeout(t);
  }, [authenticated, router]);

  async function handlePassword(e: React.FormEvent) {
    e.preventDefault();
    setPwError('');
    setPwLoading(true);
    try {
      const res = await fetch('/api/auth/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });
      if (res.ok) {
        setAuthenticated(true);
        preloadAllPages();
      } else {
        const data = await res.json().catch(() => ({}));
        setPwError(data.error ?? 'Invalid password');
      }
    } catch {
      setPwError('Network error. Please try again.');
    } finally {
      setPwLoading(false);
    }
  }

  async function handleAccess(e: React.FormEvent) {
    e.preventDefault();
    setAccessError('');
    setAccessLoading(true);
    try {
      const res = await fetch('/api/waitlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, reason }),
      });
      if (res.ok) {
        setSubmitted(true);
      } else {
        const data = await res.json().catch(() => ({}));
        setAccessError(data.error ?? 'Something went wrong. Please try again.');
      }
    } catch {
      setAccessError('Network error. Please try again.');
    } finally {
      setAccessLoading(false);
    }
  }

  if (authenticated) return <BufferScreen />;

  return (
    <div className="min-h-screen bg-[#060608] text-white flex items-center justify-center p-5">
      {/* Grid background */}
      <div className="fixed inset-0 pointer-events-none" style={GRID_BG} />

      {/* Ambient glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[450px] bg-blue-600/7 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-[400px] h-[300px] bg-violet-600/5 rounded-full blur-[120px] pointer-events-none" />

      <div
        className="relative w-full max-w-md"
        style={{ animation: 'fade-in-up 0.5s ease both' }}
      >
        {/* Back link */}
        <Link
          href="/landing"
          className="inline-flex items-center gap-1.5 text-xs text-white/35 hover:text-white/70 transition-colors mb-8 group"
        >
          <ArrowLeft className="h-3 w-3 group-hover:-translate-x-0.5 transition-transform" />
          Back to home
        </Link>

        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="flex items-center gap-2.5 mb-3">
            <div className="w-8 h-8 rounded-lg bg-blue-500/20 border border-blue-500/30 flex items-center justify-center">
              <Activity className="h-5 w-5 text-blue-400" />
            </div>
            <span className="font-semibold text-xl tracking-tight">OptionsLab</span>
          </div>
          <span className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
            Private Beta
          </span>
        </div>

        {/* Card */}
        <div className="rounded-2xl border border-white/[0.08] bg-white/[0.025] overflow-hidden shadow-2xl shadow-black/40">

          {/* Tabs */}
          <div className="flex border-b border-white/[0.07]">
            {(['password', 'access'] as Tab[]).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`flex-1 py-3.5 text-sm font-medium transition-all duration-200 cursor-pointer ${
                  tab === t
                    ? 'text-white border-b-2 border-blue-500 -mb-px bg-white/[0.03]'
                    : 'text-white/35 hover:text-white/65 hover:bg-white/[0.02]'
                }`}
              >
                {t === 'password' ? 'Preview access' : 'Request access'}
              </button>
            ))}
          </div>

          <div className="p-6">
            {/* ── Password tab ── */}
            {tab === 'password' && (
              <form onSubmit={handlePassword} className="space-y-4">
                <div className="text-center mb-5">
                  <p className="text-sm text-white/45 leading-relaxed">
                    Enter your preview password to access the dashboard.
                  </p>
                </div>

                <div>
                  <label className="block text-xs text-white/45 mb-1.5 font-medium">
                    Preview password
                  </label>
                  <div className="relative">
                    <input
                      type={showPw ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter preview password"
                      required
                      autoFocus
                      className="w-full px-3.5 py-2.5 pr-10 rounded-xl bg-white/[0.06] border border-white/[0.1] text-sm text-white placeholder:text-white/25 focus:outline-none focus:border-blue-500/60 focus:ring-1 focus:ring-blue-500/30 transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPw((v) => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors cursor-pointer"
                      aria-label={showPw ? 'Hide password' : 'Show password'}
                    >
                      {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                {pwError && (
                  <p className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
                    {pwError}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={pwLoading}
                  className="w-full py-2.5 px-4 rounded-xl bg-blue-500 hover:bg-blue-400 text-white text-sm font-semibold transition-all duration-200 hover:shadow-lg hover:shadow-blue-500/25 hover:-translate-y-0.5 disabled:opacity-50 disabled:translate-y-0 disabled:shadow-none cursor-pointer flex items-center justify-center gap-2"
                >
                  {pwLoading ? (
                    <>
                      <span className="w-3.5 h-3.5 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                      Verifying…
                    </>
                  ) : (
                    <>
                      Enter dashboard
                      <ChevronRight className="h-4 w-4" />
                    </>
                  )}
                </button>

                <p className="text-xs text-white/25 text-center">
                  Don&apos;t have a password?{' '}
                  <button
                    type="button"
                    onClick={() => setTab('access')}
                    className="text-blue-400 hover:text-blue-300 transition-colors cursor-pointer"
                  >
                    Request access →
                  </button>
                </p>
              </form>
            )}

            {/* ── Access tab ── */}
            {tab === 'access' && (
              submitted ? (
                <div className="py-4 text-center">
                  <div className="w-12 h-12 rounded-full bg-green-500/15 border border-green-500/25 flex items-center justify-center mx-auto mb-4">
                    <Check className="h-6 w-6 text-green-400" />
                  </div>
                  <p className="font-semibold text-white mb-1">You&apos;re on the list!</p>
                  <p className="text-sm text-white/45 leading-relaxed">
                    We&apos;ll be in touch at{' '}
                    <strong className="text-white/70">{email}</strong>{' '}
                    when your spot opens up.
                  </p>
                  <button
                    onClick={() => { setSubmitted(false); setTab('password'); }}
                    className="mt-5 text-xs text-blue-400 hover:text-blue-300 transition-colors cursor-pointer"
                  >
                    ← Back to sign in
                  </button>
                </div>
              ) : (
                <form onSubmit={handleAccess} className="space-y-4">
                  <div className="text-center mb-5">
                    <p className="text-sm text-white/45 leading-relaxed">
                      Tell us a bit about yourself and we&apos;ll reach out when your spot is ready.
                    </p>
                  </div>

                  {/* Name + Email row */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs text-white/45 mb-1.5 font-medium">Name</label>
                      <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Your name"
                        required
                        className="w-full px-3.5 py-2.5 rounded-xl bg-white/[0.06] border border-white/[0.1] text-sm text-white placeholder:text-white/25 focus:outline-none focus:border-blue-500/60 focus:ring-1 focus:ring-blue-500/30 transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-white/45 mb-1.5 font-medium">Email</label>
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="you@example.com"
                        required
                        className="w-full px-3.5 py-2.5 rounded-xl bg-white/[0.06] border border-white/[0.1] text-sm text-white placeholder:text-white/25 focus:outline-none focus:border-blue-500/60 focus:ring-1 focus:ring-blue-500/30 transition-all"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs text-white/45 mb-1.5 font-medium">
                      Why do you want access?{' '}
                      <span className="text-white/25 font-normal">(optional)</span>
                    </label>
                    <textarea
                      value={reason}
                      onChange={(e) => setReason(e.target.value)}
                      placeholder="Tell us a bit about yourself…"
                      rows={3}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-white/[0.06] border border-white/[0.1] text-sm text-white placeholder:text-white/25 focus:outline-none focus:border-blue-500/60 focus:ring-1 focus:ring-blue-500/30 transition-all resize-none"
                    />
                  </div>

                  {accessError && (
                    <p className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
                      {accessError}
                    </p>
                  )}

                  <button
                    type="submit"
                    disabled={accessLoading}
                    className="w-full py-2.5 px-4 rounded-xl bg-white/[0.08] hover:bg-white/[0.13] border border-white/[0.1] text-white text-sm font-semibold transition-all duration-200 disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2"
                  >
                    {accessLoading ? (
                      <>
                        <span className="w-3.5 h-3.5 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                        Submitting…
                      </>
                    ) : (
                      'Request access →'
                    )}
                  </button>

                  <p className="text-xs text-white/25 text-center">
                    Already have a password?{' '}
                    <button
                      type="button"
                      onClick={() => setTab('password')}
                      className="text-blue-400 hover:text-blue-300 transition-colors cursor-pointer"
                    >
                      Sign in →
                    </button>
                  </p>
                </form>
              )
            )}
          </div>
        </div>

        {/* Footer */}
        <p className="text-xs text-white/20 text-center mt-6">
          © {new Date().getFullYear()} OptionsLab · For informational purposes only
        </p>
      </div>
    </div>
  );
}
