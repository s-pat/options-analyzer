'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useState } from 'react';
import { Header } from '@/components/layout/Header';
import { useSubscription } from '@/hooks/useSubscription';
import { useUser } from '@clerk/nextjs';
import {
  CreditCard,
  Check,
  ChevronRight,
  Zap,
  Shield,
  Star,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  BarChart2,
  Search,
  GitBranch,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import type { Tier } from '@/lib/tier';

// ── Plan feature lists ────────────────────────────────────────────────────────

const PLAN_FEATURES: Record<Tier, string[]> = {
  free: [
    'S&P 500 Screener (top 20)',
    "Today's Picks (3 per day)",
    'Options chain — price, volume, OI',
    'Full Learn & Strategies library',
  ],
  pro: [
    'Full S&P 500 Screener (503 stocks)',
    "Today's Picks — all picks",
    'Options chain with Greeks (Δ Θ Γ ν)',
    'IV Rank, HV30, RSI indicators',
    'Black-Scholes fair value',
    'Backtesting — 1 yr · 5 strategies',
    'Weekly email digest',
  ],
  premium: [
    'Everything in Pro',
    'Backtesting — 5 yr · unlimited strategies',
    'Watchlists & portfolio tracker',
    'Real-time alerts (email + push)',
    'IV Surface & skew analysis',
    'Data export (CSV / JSON)',
    'API access · Priority support',
  ],
};

const TIER_COLORS = {
  free:    { badge: 'bg-white/[0.06] text-white/50 border-white/[0.1]',       glow: '' },
  pro:     { badge: 'bg-blue-500/15 text-blue-300 border-blue-500/30',        glow: 'shadow-[0_0_30px_rgba(59,130,246,0.08)]' },
  premium: { badge: 'bg-violet-500/15 text-violet-300 border-violet-500/30',  glow: '' },
};

// ── Upgrade plan card ─────────────────────────────────────────────────────────

function UpgradePlanCard({
  plan,
  price,
  highlight,
  onUpgrade,
  loading,
}: {
  plan: 'pro' | 'premium';
  price: string;
  highlight: boolean;
  onUpgrade: (plan: 'pro' | 'premium') => void;
  loading: boolean;
}) {
  const label = plan === 'pro' ? 'Pro' : 'Premium';
  const color = plan === 'pro' ? 'text-blue-400' : 'text-violet-400';
  const btn = plan === 'pro'
    ? 'bg-blue-500 hover:bg-blue-400 text-white'
    : 'bg-violet-500 hover:bg-violet-400 text-white';

  return (
    <div
      className={cn(
        'relative flex flex-col rounded-2xl border p-5 transition-all',
        highlight ? 'border-blue-500/30 bg-blue-500/[0.04] ring-1 ring-blue-500/20' : 'border-white/[0.08] bg-white/[0.03]',
      )}
    >
      {highlight && (
        <div className="absolute -top-2.5 left-4 text-[10px] font-semibold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30">
          Recommended
        </div>
      )}
      <div className={cn('text-xs font-semibold uppercase tracking-widest mb-1', color)}>{label}</div>
      <div className="flex items-end gap-1 mb-3">
        <span className="text-2xl font-bold text-white font-mono">{price}</span>
        <span className="text-white/40 text-xs mb-0.5">/mo</span>
      </div>
      <ul className="space-y-2 flex-1 mb-4">
        {PLAN_FEATURES[plan].slice(0, 5).map((f) => (
          <li key={f} className="flex items-start gap-2">
            <Check className="w-3.5 h-3.5 text-green-400 mt-0.5 shrink-0" />
            <span className="text-xs text-white/60">{f}</span>
          </li>
        ))}
      </ul>
      <button
        onClick={() => onUpgrade(plan)}
        disabled={loading}
        className={cn('flex items-center justify-center gap-1.5 text-sm font-semibold py-2.5 rounded-xl transition-colors disabled:opacity-50', btn)}
      >
        {loading ? 'Redirecting…' : <>Upgrade to {label} <ChevronRight className="w-4 h-4" /></>}
      </button>
    </div>
  );
}

// ── Account page inner (uses useSearchParams so must be wrapped in Suspense) ──

function AccountPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useUser();
  const { tier, display, limits } = useSubscription();

  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [portalLoading, setPortalLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const success = searchParams.get('success') === 'true';
  const colors = TIER_COLORS[tier];

  async function handleUpgrade(plan: 'pro' | 'premium') {
    setCheckoutLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan, billing: 'monthly' }),
      });
      const data = await res.json() as { url?: string; error?: string };
      if (data.url) {
        window.location.href = data.url;
      } else {
        setError(data.error ?? 'Failed to start checkout');
      }
    } catch {
      setError('Network error — please try again');
    } finally {
      setCheckoutLoading(false);
    }
  }

  async function handlePortal() {
    setPortalLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/stripe/portal', { method: 'POST' });
      const data = await res.json() as { url?: string; error?: string };
      if (data.url) {
        window.location.href = data.url;
      } else {
        setError(data.error ?? 'No billing account found. Subscribe first to manage billing.');
      }
    } catch {
      setError('Network error — please try again');
    } finally {
      setPortalLoading(false);
    }
  }

  return (
    <>
      <Header title="Account & Billing" />
      <div className="flex-1 p-6 space-y-5 max-w-2xl">

        {/* Success banner */}
        {success && (
          <div className="flex items-center gap-3 rounded-xl border border-green-500/20 bg-green-500/[0.05] px-4 py-3 animate-slide-up">
            <CheckCircle2 className="h-4 w-4 text-green-400 shrink-0" />
            <p className="text-sm text-green-300 font-medium">
              Subscription activated! Your new features are ready.
            </p>
          </div>
        )}

        {/* Error banner */}
        {error && (
          <div className="flex items-center gap-3 rounded-xl border border-red-500/20 bg-red-500/[0.05] px-4 py-3">
            <AlertCircle className="h-4 w-4 text-red-400 shrink-0" />
            <p className="text-sm text-red-300">{error}</p>
          </div>
        )}

        {/* Current plan card */}
        <div className={cn('rounded-2xl border p-5 animate-slide-up', colors.glow,
          tier === 'pro' ? 'border-blue-500/20 bg-blue-500/[0.03]' :
          tier === 'premium' ? 'border-violet-500/20 bg-violet-500/[0.03]' :
          'border-white/[0.08] bg-white/[0.03]'
        )}>
          <div className="flex items-start justify-between gap-4 mb-4">
            <div>
              <p className="text-xs text-white/35 uppercase tracking-wider mb-1">Current plan</p>
              <div className="flex items-center gap-2">
                <span className="text-xl font-bold text-white">{display.label}</span>
                <span className={cn('text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full border', colors.badge)}>
                  {tier === 'free' ? 'Free forever' : 'Active'}
                </span>
              </div>
              <p className={cn('text-sm font-mono mt-1', display.color)}>{display.price}</p>
            </div>
            {tier !== 'free' && (
              <button
                onClick={handlePortal}
                disabled={portalLoading}
                className="flex items-center gap-1.5 text-xs text-white/40 hover:text-white/70 transition-colors disabled:opacity-50 shrink-0 mt-1"
              >
                <CreditCard className="w-3.5 h-3.5" />
                {portalLoading ? 'Loading…' : 'Manage billing'}
                <ExternalLink className="w-3 h-3" />
              </button>
            )}
          </div>

          {/* Current plan features */}
          <div className="grid sm:grid-cols-2 gap-1.5">
            {PLAN_FEATURES[tier].map((f) => (
              <div key={f} className="flex items-center gap-2">
                <Check className="w-3.5 h-3.5 text-green-400 shrink-0" />
                <span className="text-xs text-white/55">{f}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Usage limits (for free tier) */}
        {tier === 'free' && (
          <div className="rounded-2xl border border-white/[0.08] bg-white/[0.03] p-5 animate-slide-up delay-50">
            <p className="text-xs text-white/35 uppercase tracking-wider mb-3">Free tier limits</p>
            <div className="space-y-3">
              {[
                { icon: Search,    label: 'Screener rows',    value: `${limits.screenerRows} of 503` },
                { icon: Zap,       label: "Today's Picks",    value: `${limits.todayPicks} per day` },
                { icon: GitBranch, label: 'Backtesting',      value: 'Not included' },
                { icon: BarChart2, label: 'Greeks & IV data',  value: 'Not included' },
              ].map(({ icon: Icon, label, value }) => (
                <div key={label} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Icon className="w-3.5 h-3.5 text-white/30" />
                    <span className="text-xs text-white/50">{label}</span>
                  </div>
                  <span className="text-xs font-mono text-white/40">{value}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Upgrade options (only if not on premium) */}
        {tier !== 'premium' && (
          <div className="animate-slide-up delay-100">
            <p className="text-xs text-white/35 uppercase tracking-wider mb-3">
              {tier === 'free' ? 'Upgrade your plan' : 'Upgrade to Premium'}
            </p>
            <div className={cn('grid gap-4', tier === 'free' ? 'sm:grid-cols-2' : '')}>
              {tier === 'free' && (
                <UpgradePlanCard plan="pro" price="$19" highlight onUpgrade={handleUpgrade} loading={checkoutLoading} />
              )}
              <UpgradePlanCard plan="premium" price="$49" highlight={tier === 'pro'} onUpgrade={handleUpgrade} loading={checkoutLoading} />
            </div>
            <p className="text-xs text-white/25 mt-3 text-center">
              14-day free trial · Cancel any time ·{' '}
              <Link href="/pricing" className="text-blue-400/60 hover:text-blue-400 transition-colors">
                View full pricing
              </Link>
            </p>
          </div>
        )}

        {/* Premium benefits reminder */}
        {tier === 'pro' && (
          <div className="rounded-2xl border border-violet-500/15 bg-violet-500/[0.03] p-5 animate-slide-up">
            <div className="flex items-center gap-2 mb-3">
              <Star className="w-4 h-4 text-violet-400" />
              <p className="text-sm font-semibold text-white">Unlock Premium</p>
            </div>
            <div className="grid sm:grid-cols-2 gap-1.5 mb-4">
              {['5-year backtesting', 'Watchlists & alerts', 'IV Surface analysis', 'Data export', 'API access', 'Priority support'].map((f) => (
                <div key={f} className="flex items-center gap-2">
                  <Shield className="w-3.5 h-3.5 text-violet-400 shrink-0" />
                  <span className="text-xs text-white/55">{f}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Account info */}
        <div className="rounded-2xl border border-white/[0.08] bg-white/[0.03] p-5 animate-slide-up delay-150">
          <p className="text-xs text-white/35 uppercase tracking-wider mb-3">Account</p>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs text-white/40">Email</span>
              <span className="text-xs text-white/70 font-mono">
                {user?.emailAddresses[0]?.emailAddress ?? '—'}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-white/40">Member since</span>
              <span className="text-xs text-white/70 font-mono">
                {user?.createdAt
                  ? new Date(user.createdAt).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
                  : '—'}
              </span>
            </div>
          </div>
        </div>

      </div>
    </>
  );
}

export default function AccountPage() {
  return (
    <Suspense fallback={null}>
      <AccountPageInner />
    </Suspense>
  );
}
