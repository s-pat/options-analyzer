import { auth } from '@clerk/nextjs/server';
import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import {
  TrendingUp,
  TrendingDown,
  Lock,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  ExternalLink,
  BarChart2,
  Clock,
  Zap,
} from 'lucide-react';
import { parseContractSymbol } from '@/lib/shareUtils';
import type { OptionAnalysis, Stock } from '@/lib/types';
import { cn } from '@/lib/utils';

// ─── Server-side API fetching ────────────────────────────────────────────────

const API_BASE = process.env.API_BACKEND_URL
  ? `${process.env.API_BACKEND_URL}/api/v1`
  : 'http://localhost:8080/api/v1';

async function fetchStock(symbol: string): Promise<Stock | null> {
  try {
    const res = await fetch(`${API_BASE}/stocks/${symbol}`, {
      next: { revalidate: 30 },
    });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

async function fetchAnalysis(
  symbol: string,
  type: string,
  strike: number,
  expiration: number,
): Promise<OptionAnalysis | null> {
  try {
    const res = await fetch(
      `${API_BASE}/stocks/${symbol}/options/analyze?type=${type}&strike=${strike}&expiration=${expiration}`,
      { next: { revalidate: 60 } },
    );
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

// ─── Metadata ────────────────────────────────────────────────────────────────

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const parsed = parseContractSymbol(slug);
  if (!parsed) return { title: 'Option Analysis | OptionLabs' };

  const { symbol, optionType, strike, expirationDate, expirationTimestamp } = parsed;
  const analysis = await fetchAnalysis(symbol, optionType, strike, expirationTimestamp);

  const expStr = expirationDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  const typeLabel = optionType === 'call' ? 'CALL' : 'PUT';
  const verdictStr = analysis?.verdict ?? 'Analysis';
  const scoreStr = analysis?.score ? ` · Score ${analysis.score}/100` : '';

  const title = `$${symbol} ${typeLabel} $${strike} (${expStr}) — ${verdictStr}${scoreStr}`;
  const description = analysis?.thesis?.[0]
    ? `${verdictStr}: ${analysis.thesis[0]}`
    : `${typeLabel} option analysis for $${symbol} expiring ${expStr}. Powered by OptionLabs.`;

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://optionslab.io';

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: 'website',
      url: `${siteUrl}/share/${slug}`,
      siteName: 'OptionLabs',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      site: '@optionslab',
    },
  };
}

// ─── Verdict styling ─────────────────────────────────────────────────────────

const VERDICT_STYLES = {
  'Strong Buy': {
    badge: 'bg-green-500/20 border-green-500/40 text-green-400',
    glow: 'from-green-500/20',
    dot: 'bg-green-400',
  },
  Buy: {
    badge: 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400',
    glow: 'from-emerald-500/20',
    dot: 'bg-emerald-400',
  },
  Speculative: {
    badge: 'bg-yellow-500/20 border-yellow-500/40 text-yellow-400',
    glow: 'from-yellow-500/20',
    dot: 'bg-yellow-400',
  },
  Pass: {
    badge: 'bg-red-500/20 border-red-500/40 text-red-400',
    glow: 'from-red-500/20',
    dot: 'bg-red-400',
  },
} as const;

// ─── Sub-components ───────────────────────────────────────────────────────────

function BlurredValue({ children }: { children: React.ReactNode }) {
  return (
    <span className="relative inline-flex items-center gap-1 select-none">
      <span className="blur-sm pointer-events-none">{children}</span>
      <Lock className="h-3 w-3 text-white/30 absolute right-0 translate-x-4" />
    </span>
  );
}

function StatCell({
  label,
  value,
  blurred = false,
}: {
  label: string;
  value: string;
  blurred?: boolean;
}) {
  return (
    <div className="flex flex-col gap-0.5 px-3 py-2 rounded-xl bg-white/[0.04] border border-white/[0.06]">
      <span className="text-[10px] text-white/35 uppercase tracking-wide font-medium">{label}</span>
      <span className="text-sm font-bold font-mono tabular-nums text-white/80">
        {blurred ? <BlurredValue>{value}</BlurredValue> : value}
      </span>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function SharePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const parsed = parseContractSymbol(slug);
  if (!parsed) notFound();

  const { symbol, optionType, strike, expirationDate, expirationTimestamp } = parsed;

  const [stock, analysis, { userId, sessionClaims }] = await Promise.all([
    fetchStock(symbol),
    fetchAnalysis(symbol, optionType, strike, expirationTimestamp),
    auth(),
  ]);

  const isApproved =
    (sessionClaims?.metadata as { approved?: boolean } | undefined)?.approved === true;
  const isAuthenticated = !!userId;
  // Full access = signed in AND approved
  const canSeeAll = isAuthenticated && isApproved;

  const expStr = expirationDate.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
  const dteMs = expirationDate.getTime() - Date.now();
  const dte = Math.max(0, Math.ceil(dteMs / (1000 * 60 * 60 * 24)));

  const verdictKey = analysis?.verdict ?? 'Pass';
  const verdictStyle = VERDICT_STYLES[verdictKey as keyof typeof VERDICT_STYLES] ?? VERDICT_STYLES['Pass'];
  const isCall = optionType === 'call';

  const positive = (stock?.changePercent ?? 0) >= 0;

  return (
    <div className="min-h-screen bg-background text-white" style={{ background: '#060608' }}>

      {/* ── Top nav ─────────────────────────────────────────────────────── */}
      <header className="border-b border-white/[0.06] px-4 sm:px-6 py-3">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <Link
            href="/landing"
            className="flex items-center gap-2 text-white/80 hover:text-white transition-colors"
          >
            <BarChart2 className="h-5 w-5 text-blue-400" />
            <span className="font-semibold text-sm">OptionLabs</span>
          </Link>

          <div className="flex items-center gap-2">
            {isAuthenticated && isApproved ? (
              <Link
                href={`/options?symbol=${symbol}`}
                className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg bg-blue-500/10 border border-blue-500/30 text-blue-400 hover:bg-blue-500/20 transition-colors"
              >
                Open Analyzer
                <ExternalLink className="h-3 w-3" />
              </Link>
            ) : isAuthenticated ? (
              <span className="text-xs text-white/40 px-3 py-1.5 rounded-lg border border-white/[0.08]">
                On waitlist
              </span>
            ) : (
              <>
                <Link
                  href="/sign-in"
                  className="text-xs text-white/50 hover:text-white transition-colors px-3 py-1.5"
                >
                  Sign in
                </Link>
                <Link
                  href="/sign-up"
                  className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-blue-500 hover:bg-blue-400 text-white transition-colors"
                >
                  Join free
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* ── Main content ─────────────────────────────────────────────────── */}
      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-8 space-y-5">

        {/* ── Stock row ──────────────────────────────────────────────────── */}
        {stock && (
          <div className="flex flex-wrap items-end gap-3 animate-slide-up">
            <div>
              <div className="font-bold text-2xl text-white/90 tracking-tight">{stock.symbol}</div>
              <div className="text-xs text-white/35 mt-0.5">{stock.name}</div>
            </div>
            <div className="flex items-end gap-2">
              <span className="font-mono text-2xl font-bold tabular-nums text-white">
                ${stock.price?.toFixed(2)}
              </span>
              <span
                className={cn(
                  'flex items-center gap-1 text-sm font-medium font-mono tabular-nums mb-0.5',
                  positive ? 'text-green-400' : 'text-red-400',
                )}
              >
                {positive ? (
                  <TrendingUp className="h-3.5 w-3.5" />
                ) : (
                  <TrendingDown className="h-3.5 w-3.5" />
                )}
                {positive ? '+' : ''}
                {stock.changePercent?.toFixed(2)}%
              </span>
            </div>
          </div>
        )}

        {/* ── Option card ────────────────────────────────────────────────── */}
        <div
          className={cn(
            'relative rounded-2xl border bg-white/[0.03] overflow-hidden animate-slide-up',
            analysis
              ? 'border-white/[0.1]'
              : 'border-white/[0.08]',
          )}
        >
          {/* Verdict glow */}
          {analysis && (
            <div
              className={cn(
                'absolute inset-x-0 top-0 h-px bg-gradient-to-r via-current to-transparent',
                verdictStyle.glow,
              )}
              style={{
                background: `linear-gradient(90deg, transparent, ${
                  verdictKey === 'Strong Buy'
                    ? 'rgba(34,197,94,0.5)'
                    : verdictKey === 'Buy'
                    ? 'rgba(16,185,129,0.5)'
                    : verdictKey === 'Speculative'
                    ? 'rgba(234,179,8,0.5)'
                    : 'rgba(239,68,68,0.5)'
                }, transparent)`,
              }}
            />
          )}

          <div className="p-5 space-y-5">

            {/* ── Option header ─────────────────────────────────────────── */}
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="space-y-1.5">
                {/* Type badge */}
                <div className="flex items-center gap-2">
                  <span
                    className={cn(
                      'inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border text-xs font-bold uppercase tracking-wide',
                      isCall
                        ? 'bg-green-500/10 border-green-500/30 text-green-400'
                        : 'bg-red-500/10 border-red-500/30 text-red-400',
                    )}
                  >
                    {isCall ? (
                      <TrendingUp className="h-3.5 w-3.5" />
                    ) : (
                      <TrendingDown className="h-3.5 w-3.5" />
                    )}
                    {optionType}
                  </span>
                  {analysis && (
                    <span
                      className={cn(
                        'inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border text-xs font-bold',
                        verdictStyle.badge,
                      )}
                    >
                      <span
                        className={cn('w-1.5 h-1.5 rounded-full', verdictStyle.dot)}
                      />
                      {verdictKey}
                    </span>
                  )}
                </div>

                {/* Strike + expiry */}
                <div className="flex items-center gap-2 text-sm text-white/50">
                  <span>
                    Strike:{' '}
                    {canSeeAll ? (
                      <span className="font-mono font-bold text-white/80">${strike.toFixed(strike % 1 === 0 ? 0 : 2)}</span>
                    ) : (
                      <BlurredValue>${strike.toFixed(strike % 1 === 0 ? 0 : 2)}</BlurredValue>
                    )}
                  </span>
                  <span className="text-white/20">·</span>
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {expStr} · {dte}d
                  </span>
                </div>
              </div>

              {/* Score */}
              {analysis && (
                <div className="text-right shrink-0">
                  <div className="font-mono text-3xl font-bold text-white/90">
                    {analysis.score.toFixed(0)}
                    <span className="text-sm text-white/30 font-normal">/100</span>
                  </div>
                  <div className="text-[11px] text-white/35 mt-0.5">Score</div>
                </div>
              )}
            </div>

            {/* ── Stats grid ────────────────────────────────────────────── */}
            {stock && (
              <div className="flex flex-wrap gap-2">
                <StatCell label="IV Rank" value={`${stock.ivRank?.toFixed(0)}`} />
                <StatCell label="IV" value={`${stock.iv?.toFixed(1)}%`} />
                <StatCell label="RSI" value={`${stock.rsi?.toFixed(0)}`} />
                <StatCell
                  label="Cost"
                  value={
                    canSeeAll
                      ? `$${(strike * 100).toFixed(0)}`
                      : '$---'
                  }
                  blurred={!canSeeAll}
                />
              </div>
            )}

            {/* ── Analysis content ──────────────────────────────────────── */}
            {analysis && (
              <div className="space-y-4">

                {/* Thesis — first bullet visible, rest blurred */}
                <div className="space-y-2">
                  <div className="text-[10px] text-white/30 uppercase tracking-widest font-medium">
                    Thesis
                  </div>
                  {analysis.thesis.map((point, i) => (
                    <div
                      key={i}
                      className={cn(
                        'flex items-start gap-2 text-sm',
                        !canSeeAll && i > 0 ? 'blur-sm select-none pointer-events-none' : '',
                      )}
                    >
                      <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0 mt-0.5" />
                      <span className="text-white/70 leading-snug">{point}</span>
                    </div>
                  ))}
                  {!canSeeAll && analysis.thesis.length > 1 && (
                    <div className="flex items-center gap-1.5 text-xs text-white/30 pl-6">
                      <Lock className="h-3 w-3" />
                      {analysis.thesis.length - 1} more point{analysis.thesis.length > 2 ? 's' : ''} — sign in to view
                    </div>
                  )}
                </div>

                {/* Signals — first 2 visible, rest blurred */}
                {analysis.signals && analysis.signals.length > 0 && (
                  <div className="space-y-1">
                    <div className="text-[10px] text-white/30 uppercase tracking-widest font-medium mb-2">
                      Signals
                    </div>
                    {analysis.signals.map((signal, i) => (
                      <div
                        key={i}
                        className={cn(
                          'flex items-start gap-2 py-1.5 border-b border-white/[0.05] last:border-0',
                          !canSeeAll && i >= 2 ? 'blur-sm select-none pointer-events-none' : '',
                        )}
                      >
                        <div className="mt-0.5 shrink-0">
                          {signal.positive ? (
                            <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />
                          ) : (
                            <XCircle className="h-3.5 w-3.5 text-red-400" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <span className="text-[11px] font-semibold text-white/40 uppercase tracking-wide">
                            {signal.label}:{' '}
                          </span>
                          <span className="text-[11px] text-white/70">{signal.value}</span>
                        </div>
                      </div>
                    ))}
                    {!canSeeAll && analysis.signals.length > 2 && (
                      <div className="flex items-center gap-1.5 text-xs text-white/30 pt-1">
                        <Lock className="h-3 w-3" />
                        {analysis.signals.length - 2} more signal{analysis.signals.length > 3 ? 's' : ''} hidden
                      </div>
                    )}
                  </div>
                )}

                {/* Key risks — blurred if not authed */}
                {analysis.keyRisks && analysis.keyRisks.length > 0 && canSeeAll && (
                  <div className="space-y-1">
                    <div className="text-[10px] text-white/30 uppercase tracking-widest font-medium mb-2">
                      Key Risks
                    </div>
                    {analysis.keyRisks.map((risk, i) => (
                      <div key={i} className="flex items-start gap-2">
                        <AlertTriangle className="h-3.5 w-3.5 text-yellow-500/70 shrink-0 mt-0.5" />
                        <span className="text-[11px] text-white/55 leading-snug">{risk}</span>
                      </div>
                    ))}
                  </div>
                )}

              </div>
            )}

            {!analysis && (
              <p className="text-sm text-white/40 py-4 text-center">
                Analysis unavailable — the market may be closed or this contract may have expired.
              </p>
            )}

          </div>
        </div>

        {/* ── Gating CTA ─────────────────────────────────────────────────── */}
        {!canSeeAll && (
          <div className="rounded-2xl border border-blue-500/[0.2] bg-blue-500/[0.05] p-6 text-center space-y-4 animate-slide-up">
            <div className="w-10 h-10 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center mx-auto">
              <Zap className="h-5 w-5 text-blue-400" />
            </div>
            <div>
              <h2 className="font-semibold text-white/90 mb-1">
                {isAuthenticated
                  ? "You're on the waitlist"
                  : 'Unlock full option analysis'}
              </h2>
              <p className="text-sm text-white/40 max-w-sm mx-auto">
                {isAuthenticated
                  ? "You'll get access to full analysis, Greeks, strike prices, and the live scanner when approved."
                  : 'See strike prices, Greeks, complete thesis, key risks, and live scoring for every S&P 500 option.'}
              </p>
            </div>
            {!isAuthenticated && (
              <div className="flex items-center justify-center gap-3">
                <Link
                  href="/sign-up"
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-500 hover:bg-blue-400 text-white text-sm font-semibold transition-colors"
                >
                  Join OptionLabs — Free
                </Link>
                <Link
                  href="/sign-in"
                  className="text-sm text-white/40 hover:text-white transition-colors"
                >
                  Sign in
                </Link>
              </div>
            )}
          </div>
        )}

        {/* ── Footer branding ────────────────────────────────────────────── */}
        <div className="flex items-center justify-between pt-2 pb-4 text-xs text-white/20">
          <span>Shared via OptionLabs</span>
          <Link href="/landing" className="hover:text-white/40 transition-colors">
            optionslab.io
          </Link>
        </div>

      </main>
    </div>
  );
}
