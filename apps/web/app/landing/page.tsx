'use client';

import { useState, useEffect, memo, useMemo } from 'react';
import Link from 'next/link';
import useSWR from 'swr';
import { getStocks } from '@/lib/api';
import type { Stock } from '@/lib/types';
import {
  Activity,
  BarChart2,
  Zap,
  ArrowUpRight,
  ArrowDownRight,
  Target,
  BookOpen,
  ChevronRight,
  Check,
  LineChart,
  Search,
  GitBranch,
  Star,
  Shield,
  TrendingUp,
} from 'lucide-react';

// ── Static data ───────────────────────────────────────────────────────────────

const TICKERS = [
  { symbol: 'SPY',  price: '587.42', pct: '+0.21%', up: true  },
  { symbol: 'AAPL', price: '224.18', pct: '+1.56%', up: true  },
  { symbol: 'TSLA', price: '281.33', pct: '-1.48%', up: false },
  { symbol: 'NVDA', price: '952.11', pct: '+1.97%', up: true  },
  { symbol: 'QQQ',  price: '498.76', pct: '+0.43%', up: true  },
  { symbol: 'MSFT', price: '418.92', pct: '-0.45%', up: false },
  { symbol: 'AMZN', price: '196.45', pct: '+1.20%', up: true  },
  { symbol: 'META', price: '524.77', pct: '+1.73%', up: true  },
  { symbol: 'GOOGL', price: '178.34', pct: '-0.51%', up: false },
  { symbol: 'GLD',  price: '231.55', pct: '+0.38%', up: true  },
  { symbol: 'IWM',  price: '215.67', pct: '+0.40%', up: true  },
  { symbol: 'VIX',  price: '14.82',  pct: '-3.21%', up: false },
];

const FEATURES = [
  {
    icon: Search,
    title: 'Smart Screener',
    description:
      'Filter the entire S&P 500 options universe by IV rank, delta, expiry, premium, and open interest—surfacing only the highest-conviction setups.',
    color: 'blue',
    large: true,
  },
  {
    icon: BarChart2,
    title: "Today's Picks",
    description:
      'Curated high-probability trade ideas updated daily based on technical signals and volatility regimes.',
    color: 'green',
    large: false,
  },
  {
    icon: LineChart,
    title: 'Options Chain',
    description:
      'Full-depth chains with real-time Greeks, open interest, and IV surface across all expirations.',
    color: 'violet',
    large: false,
  },
  {
    icon: GitBranch,
    title: 'Backtesting',
    description:
      'Validate any options strategy against years of historical data before risking real capital.',
    color: 'orange',
    large: false,
  },
  {
    icon: BookOpen,
    title: 'Learn & Strategies',
    description:
      'Built-in education modules and pre-built strategy templates for every market condition.',
    color: 'teal',
    large: false,
  },
] as const;

const STATS = [
  { value: '503',  suffix: '',   label: 'S&P 500 Stocks Covered' },
  { value: '2M+',  suffix: '',   label: 'Options Contracts Tracked' },
  { value: '99.9', suffix: '%',  label: 'Platform Uptime' },
  { value: '<100', suffix: 'ms', label: 'Data Latency' },
];

const HOW_IT_WORKS = [
  {
    step: '01',
    title: 'Scan the market',
    description:
      'Our screener analyzes thousands of live options contracts, surfacing the highest-conviction setups in seconds.',
    icon: Search,
  },
  {
    step: '02',
    title: 'Analyze with precision',
    description:
      'Dive into options chains, Greeks, IV percentile, and payoff diagrams—everything you need to size a trade confidently.',
    icon: BarChart2,
  },
  {
    step: '03',
    title: 'Backtest & validate',
    description:
      'Before risking capital, run your strategy against historical data to confirm your thesis has edge.',
    icon: GitBranch,
  },
];

// SVG line chart path — simulates an upward-trending price chart (viewBox 360×120)
const LINE =
  'M0,105 C15,98 25,102 40,90 C55,78 65,83 80,70 C95,57 105,63 120,50 C135,37 145,44 160,32 C175,22 185,28 200,17 C215,9 225,14 240,7 C255,3 265,5 280,2 C295,0 310,1 330,1 C345,0 352,0 360,0';
const AREA = `${LINE} L360,120 L0,120 Z`;

const VOLUME_BARS = [0.4, 0.65, 0.5, 0.8, 0.72, 0.9, 0.6, 0.75, 1.0, 0.82, 0.7, 0.88, 0.6, 0.78, 0.68, 0.85, 0.58, 0.72, 0.9, 0.62];

// Color tokens for feature cards
const COLORS: Record<string, { bg: string; border: string; text: string }> = {
  blue:   { bg: 'bg-blue-500/10',   border: 'border-blue-500/20',   text: 'text-blue-400'   },
  green:  { bg: 'bg-green-500/10',  border: 'border-green-500/20',  text: 'text-green-400'  },
  violet: { bg: 'bg-violet-500/10', border: 'border-violet-500/20', text: 'text-violet-400' },
  orange: { bg: 'bg-orange-500/10', border: 'border-orange-500/20', text: 'text-orange-400' },
  teal:   { bg: 'bg-teal-500/10',   border: 'border-teal-500/20',   text: 'text-teal-400'   },
};

// ── Sub-components ────────────────────────────────────────────────────────────

function Navbar() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 24);
    window.addEventListener('scroll', handler, { passive: true });
    return () => window.removeEventListener('scroll', handler);
  }, []);

  return (
    <header
      className={`fixed top-0 inset-x-0 z-50 transition-all duration-300 ${
        scrolled
          ? 'bg-[#060608]/85 backdrop-blur-2xl border-b border-white/[0.07]'
          : ''
      }`}
    >
      <div className="max-w-7xl mx-auto px-5 sm:px-8 h-16 flex items-center justify-between">
        {/* Logo */}
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-blue-500/20 border border-blue-500/30 flex items-center justify-center">
            <Activity className="h-4 w-4 text-blue-400" />
          </div>
          <span className="font-semibold text-base tracking-tight text-white">OptionsLab</span>
        </div>

        {/* Nav links */}
        <nav className="hidden md:flex items-center gap-7 text-sm text-white/50">
          <a href="#features"     className="hover:text-white transition-colors duration-200">Features</a>
          <a href="#how-it-works" className="hover:text-white transition-colors duration-200">How it works</a>
          <a href="#waitlist"     className="hover:text-white transition-colors duration-200">Early access</a>
        </nav>

        {/* CTAs */}
        <div className="flex items-center gap-3">
          <Link
            href="/gate"
            className="text-sm text-white/50 hover:text-white transition-colors duration-200 hidden sm:block"
          >
            Sign in
          </Link>
          <Link
            href="/gate"
            className="text-sm font-medium px-4 py-2 rounded-lg bg-blue-500 hover:bg-blue-400 text-white transition-all duration-200 hover:shadow-lg hover:shadow-blue-500/30"
          >
            Get Access
          </Link>
        </div>
      </div>
    </header>
  );
}

const HeroChart = memo(function HeroChart() {
  return (
    <div className="relative w-full rounded-2xl overflow-hidden border border-white/[0.08] bg-[#0a0a11] shadow-2xl">
      {/* Header */}
      <div className="px-5 pt-4 pb-3 flex items-start justify-between border-b border-white/[0.06]">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-sm font-semibold text-white">SPY</span>
            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-green-500/10 text-green-400 border border-green-500/20 font-medium">
              LIVE
            </span>
          </div>
          <div className="font-mono text-2xl font-bold text-white leading-none">$587.42</div>
        </div>
        <div className="text-right">
          <div className="flex items-center justify-end gap-0.5 text-green-400 text-sm font-medium">
            <ArrowUpRight className="h-4 w-4" />
            <span>+1.23</span>
          </div>
          <div className="text-[11px] text-white/35 mt-1">+0.21% today</div>
        </div>
      </div>

      {/* Line chart */}
      <div className="h-32 relative">
        <svg className="w-full h-full" viewBox="0 0 360 120" preserveAspectRatio="none">
          <defs>
            <linearGradient id="areaG" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%"   stopColor="#3B82F6" stopOpacity="0.28" />
              <stop offset="100%" stopColor="#3B82F6" stopOpacity="0.01" />
            </linearGradient>
            <linearGradient id="lineG" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%"   stopColor="#3B82F6" />
              <stop offset="70%"  stopColor="#22C55E" />
              <stop offset="100%" stopColor="#22C55E" />
            </linearGradient>
          </defs>
          {/* Subtle grid */}
          {[40, 80].map((y) => (
            <line key={y} x1="0" y1={y} x2="360" y2={y} stroke="white" strokeOpacity="0.04" strokeWidth="1" />
          ))}
          <path d={AREA} fill="url(#areaG)" />
          <path d={LINE} fill="none" stroke="url(#lineG)" strokeWidth="2" strokeLinecap="round" />
          {/* Pulsing end dot */}
          <circle cx="360" cy="0" r="3" fill="#22C55E">
            <animate attributeName="r"       values="3;5;3" dur="2s" repeatCount="indefinite" />
            <animate attributeName="opacity" values="1;0.4;1" dur="2s" repeatCount="indefinite" />
          </circle>
        </svg>
      </div>

      {/* Options signals */}
      <div className="px-4 py-3 border-t border-white/[0.06] grid grid-cols-2 gap-2">
        <div className="bg-green-500/[0.07] border border-green-500/20 rounded-xl p-2.5">
          <div className="text-[9px] text-white/35 uppercase tracking-wider mb-1 font-medium">Bullish Setup</div>
          <div className="text-xs font-semibold text-green-400">CALL 590 · Mar 21</div>
          <div className="text-[10px] text-white/40 mt-0.5">IV: 18.2% · Δ 0.42</div>
        </div>
        <div className="bg-blue-500/[0.07] border border-blue-500/20 rounded-xl p-2.5">
          <div className="text-[9px] text-white/35 uppercase tracking-wider mb-1 font-medium">Hedge</div>
          <div className="text-xs font-semibold text-blue-400">PUT 575 · Mar 21</div>
          <div className="text-[10px] text-white/40 mt-0.5">IV: 21.4% · Δ −0.38</div>
        </div>
      </div>

      {/* Volume bars */}
      <div className="px-4 pb-4">
        <div className="flex items-end gap-0.5 h-8">
          {VOLUME_BARS.map((h, i) => (
            <div
              key={i}
              className="flex-1 rounded-[2px] bg-blue-500/20"
              style={{ height: `${h * 100}%` }}
            />
          ))}
        </div>
        <div className="text-[9px] text-white/25 mt-1 uppercase tracking-wider font-medium">Volume</div>
      </div>
    </div>
  );
});

// ── Live data helpers ────────────────────────────────────────────────────────

function fmtVol(v: number): string {
  if (v >= 1e9) return `${(v / 1e9).toFixed(1)}B`;
  if (v >= 1e6) return `${(v / 1e6).toFixed(1)}M`;
  if (v >= 1e3) return `${(v / 1e3).toFixed(0)}K`;
  return String(v);
}

function ordinal(n: number): string {
  const v = Math.round(n);
  const s = ['th', 'st', 'nd', 'rd'];
  const x = v % 100;
  return v + (s[(x - 20) % 10] || s[x] || s[0]);
}

function getSignal(s: Stock): 'Bullish' | 'Bearish' | 'Neutral' {
  if (s.rsi > 60 && s.changePercent > 0) return 'Bullish';
  if (s.rsi < 40 && s.changePercent < 0) return 'Bearish';
  if (s.changePercent > 1.5) return 'Bullish';
  if (s.changePercent < -1.5) return 'Bearish';
  return 'Neutral';
}

type TickerItem = { symbol: string; price: string; pct: string; up: boolean };

function stocksToTicker(stocks: Stock[]): TickerItem[] {
  return stocks
    .slice()
    .sort((a, b) => b.volume - a.volume)
    .slice(0, 20)
    .map((s) => ({
      symbol: s.symbol,
      price: s.price.toFixed(2),
      pct: `${s.changePercent >= 0 ? '+' : ''}${s.changePercent.toFixed(2)}%`,
      up: s.changePercent >= 0,
    }));
}

// ── Sub-components ────────────────────────────────────────────────────────────

const TickerMarquee = memo(function TickerMarquee({ items }: { items: TickerItem[] }) {
  const data = items.length > 0 ? items : TICKERS;
  const doubled = [...data, ...data];
  return (
    <div className="relative overflow-hidden border-y border-white/[0.06] bg-white/[0.015] py-3">
      {/* Fade edges */}
      <div className="absolute inset-y-0 left-0 w-16 bg-gradient-to-r from-[#060608] to-transparent z-10 pointer-events-none" />
      <div className="absolute inset-y-0 right-0 w-16 bg-gradient-to-l from-[#060608] to-transparent z-10 pointer-events-none" />
      <div
        className="flex gap-3 w-max will-change-transform"
        style={{ animation: 'ticker-scroll 40s linear infinite' }}
      >
        {doubled.map((t, i) => (
          <div
            key={i}
            className="flex items-center gap-2.5 px-3 py-1.5 rounded-lg bg-white/[0.04] border border-white/[0.07] shrink-0"
          >
            <span className="font-mono text-xs font-bold text-white/80">{t.symbol}</span>
            <span className="font-mono text-xs text-white/55">${t.price}</span>
            <span
              className={`font-mono text-[11px] flex items-center gap-0.5 font-medium ${
                t.up ? 'text-green-400' : 'text-red-400'
              }`}
            >
              {t.up
                ? <ArrowUpRight className="h-3 w-3" />
                : <ArrowDownRight className="h-3 w-3" />}
              {t.pct}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
});

function FeatureCard({ feature }: { feature: typeof FEATURES[number] }) {
  const c = COLORS[feature.color];
  const Icon = feature.icon;
  return (
    <div
      className={`group relative rounded-2xl border border-white/[0.08] bg-white/[0.03] p-6
        hover:bg-white/[0.055] hover:border-white/[0.14] transition-all duration-300
        ${feature.large ? 'md:col-span-2' : ''}`}
    >
      <div
        className={`inline-flex items-center justify-center w-10 h-10 rounded-xl ${c.bg} ${c.border} border mb-4`}
      >
        <Icon className={`h-5 w-5 ${c.text}`} />
      </div>
      <h3 className="text-sm font-semibold text-white mb-2">{feature.title}</h3>
      <p className="text-sm text-white/45 leading-relaxed">{feature.description}</p>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function LandingPage() {
  const [name, setName]           = useState('');
  const [email, setEmail]         = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading]     = useState(false);
  const [formError, setFormError] = useState('');

  // Live market data — cached for 60s, no auto-refresh on landing page to reduce API load
  const { data: stocksData, isLoading: stocksLoading } = useSWR('stocks', getStocks, {
    dedupingInterval: 60_000,     // share cache across all components using 'stocks' key
    refreshInterval: 0,           // no polling on the landing page (it's just a preview)
    revalidateOnFocus: false,     // don't refetch when user tabs back
    revalidateOnReconnect: false, // don't refetch on network reconnect
  });
  const stocks = stocksData?.stocks ?? [];
  const total  = stocksData?.total ?? 503;

  // Stable reference — only recompute when actual ticker symbols/prices change
  const tickerKey = stocks.map((s) => `${s.symbol}${s.price}`).join(',');
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const tickerItems = useMemo(
    () => (stocks.length > 0 ? stocksToTicker(stocks) : TICKERS),
    [tickerKey],
  );

  // Top 5 by IV rank — highest IV = most actionable options setups
  const previewRows = stocks.length > 0
    ? [...stocks].sort((a, b) => b.ivRank - a.ivRank).slice(0, 5)
    : null;

  async function handleWaitlist(e: React.FormEvent) {
    e.preventDefault();
    setFormError('');
    setLoading(true);
    try {
      const res = await fetch('/api/waitlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email }),
      });
      if (res.ok) {
        setSubmitted(true);
      } else {
        const data = await res.json().catch(() => ({}));
        setFormError(data.error ?? 'Something went wrong. Please try again.');
      }
    } catch {
      setFormError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#060608] text-white selection:bg-blue-500/30 selection:text-white overflow-x-hidden">

      {/* Background grid */}
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          backgroundImage:
            'linear-gradient(to right, rgba(255,255,255,0.025) 1px, transparent 1px),' +
            'linear-gradient(to bottom, rgba(255,255,255,0.025) 1px, transparent 1px)',
          backgroundSize: '80px 80px',
        }}
      />

      <Navbar />

      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <section className="relative pt-28 pb-20 px-5 sm:px-8">
        {/* Ambient glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[500px] bg-blue-600/8 rounded-full blur-[150px] pointer-events-none" />
        <div className="absolute top-20 left-1/4 w-[400px] h-[300px] bg-violet-600/6 rounded-full blur-[120px] pointer-events-none" />

        <div className="relative max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-14 items-center">

            {/* Left: copy */}
            <div style={{ animation: 'fade-in-up 0.6s ease both' }}>
              {/* Badge */}
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/[0.07] border border-white/[0.12] text-xs text-white/60 mb-7 font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                Live S&P 500 options data
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold leading-[1.08] tracking-tight mb-6">
                Options trading,{' '}
                <span
                  className="bg-clip-text text-transparent"
                  style={{
                    backgroundImage: 'linear-gradient(135deg, #60A5FA 0%, #A78BFA 50%, #34D399 100%)',
                  }}
                >
                  made precise.
                </span>
              </h1>

              <p className="text-lg text-white/50 leading-relaxed mb-9 max-w-md">
                Scan the entire S&P 500 options market, analyze chains with real-time Greeks,
                and backtest strategies—all in one institutional-grade platform.
              </p>

              <div className="flex flex-col sm:flex-row gap-3">
                <Link
                  href="/gate"
                  className="inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-xl bg-blue-500 hover:bg-blue-400 text-white font-semibold text-sm transition-all duration-200 hover:shadow-xl hover:shadow-blue-500/30 hover:-translate-y-0.5"
                >
                  Get Beta Access
                  <ChevronRight className="h-4 w-4" />
                </Link>
                <a
                  href="#features"
                  className="inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-xl bg-white/[0.07] hover:bg-white/[0.11] border border-white/[0.1] text-white/80 font-semibold text-sm transition-all duration-200"
                >
                  Explore Features
                </a>
              </div>

              {/* Trust row */}
              <div className="flex flex-wrap items-center gap-x-5 gap-y-2 mt-9">
                <div className="flex items-center gap-1">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
                <div className="flex items-center gap-1.5 text-xs text-white/35">
                  <Shield className="h-3 w-3" />
                  <span>Real-time data · Low latency · Institutional grade</span>
                </div>
              </div>
            </div>

            {/* Right: chart + floating badges */}
            <div
              className="relative"
              style={{ animation: 'fade-in-up 0.6s ease 0.15s both' }}
            >
              <HeroChart />

              {/* Floating badge: IV — desktop only */}
              <div
                className="absolute -top-3 -right-3 bg-[#0d0d15] border border-white/[0.1] rounded-xl px-3 py-2 text-xs shadow-2xl hidden lg:block"
                style={{ animation: 'float-y 4s ease-in-out infinite' }}
              >
                <div className="text-white/40 mb-0.5 text-[10px] uppercase tracking-wider font-medium">IV Rank</div>
                <div className="font-mono font-bold text-violet-400 text-sm">78th %ile</div>
              </div>

              {/* Floating badge: scanned — desktop only */}
              <div
                className="absolute -bottom-3 -left-3 bg-[#0d0d15] border border-white/[0.1] rounded-xl px-3 py-2 text-xs shadow-2xl hidden lg:block"
                style={{ animation: 'float-y 4s ease-in-out 1.5s infinite' }}
              >
                <div className="text-white/40 mb-0.5 text-[10px] uppercase tracking-wider font-medium">Contracts Scanned</div>
                <div className="font-mono font-bold text-green-400 text-sm">2,847</div>
              </div>

              {/* Floating badge: edge — desktop only */}
              <div
                className="absolute top-1/2 -left-5 -translate-y-1/2 bg-[#0d0d15] border border-white/[0.1] rounded-xl px-3 py-2 text-xs shadow-2xl hidden xl:block"
                style={{ animation: 'float-y 4s ease-in-out 0.8s infinite' }}
              >
                <div className="text-white/40 mb-0.5 text-[10px] uppercase tracking-wider font-medium">Today&apos;s Edge</div>
                <div className="font-mono font-bold text-blue-400 text-sm flex items-center gap-1">
                  <TrendingUp className="h-3 w-3" />
                  +3 setups
                </div>
              </div>

              {/* Mobile stat chips — shown only on mobile/tablet */}
              <div className="grid grid-cols-3 gap-2 mt-3 lg:hidden">
                {[
                  { label: 'IV Rank',  value: '78th %ile', color: 'text-violet-400', delay: '0.3s' },
                  { label: 'Scanned',  value: '2,847',     color: 'text-green-400',  delay: '0.45s' },
                  { label: 'Edge',     value: '+3 setups', color: 'text-blue-400',   delay: '0.6s' },
                ].map((chip) => (
                  <div
                    key={chip.label}
                    className="bg-[#0d0d15] border border-white/[0.1] rounded-xl px-2 py-2 text-center"
                    style={{ animation: `fade-in-up 0.5s ease ${chip.delay} both` }}
                  >
                    <div className="text-[9px] text-white/35 uppercase tracking-wider font-medium mb-0.5">{chip.label}</div>
                    <div className={`font-mono font-bold text-xs ${chip.color}`}
                      style={{ animation: `float-y 4s ease-in-out ${chip.delay} infinite` }}
                    >
                      {chip.value}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Ticker marquee ──────────────────────────────────────────────── */}
      <TickerMarquee items={tickerItems} />

      {/* ── Features ────────────────────────────────────────────────────── */}
      <section id="features" className="relative py-24 px-5 sm:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-14">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/[0.07] border border-white/[0.1] text-xs text-white/55 mb-5 font-medium">
              <Zap className="h-3 w-3 text-yellow-400" />
              Everything you need to trade options
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">
              A complete options{' '}
              <span
                className="bg-clip-text text-transparent"
                style={{ backgroundImage: 'linear-gradient(135deg, #60A5FA, #A78BFA)' }}
              >
                intelligence suite
              </span>
            </h2>
            <p className="text-white/45 mt-4 max-w-xl mx-auto text-sm leading-relaxed">
              From screening to backtesting, OptionsLab gives you every tool professional
              traders use—without the complexity or the Bloomberg terminal price tag.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-4">
            {FEATURES.map((f, i) => (
              <FeatureCard key={i} feature={f} />
            ))}
          </div>
        </div>
      </section>

      {/* ── Stats bar ───────────────────────────────────────────────────── */}
      <section id="stats" className="relative py-6 px-5 sm:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="rounded-2xl border border-white/[0.08] bg-white/[0.025] p-8 md:p-12">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              {STATS.map((s, i) => (
                <div key={i} className="text-center">
                  <div className="font-mono text-3xl md:text-4xl font-bold text-white tracking-tight">
                    {s.value}
                    <span className="text-blue-400">{s.suffix}</span>
                  </div>
                  <div className="text-xs text-white/40 mt-2 leading-snug">{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── How it works ─────────────────────────────────────────────────── */}
      <section id="how-it-works" className="relative py-24 px-5 sm:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">
              From scan to trade in{' '}
              <span
                className="bg-clip-text text-transparent"
                style={{ backgroundImage: 'linear-gradient(135deg, #34D399, #22D3EE)' }}
              >
                minutes
              </span>
            </h2>
            <p className="text-white/45 mt-4 text-sm max-w-lg mx-auto leading-relaxed">
              A streamlined workflow that turns market noise into clear,
              actionable options trade ideas.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 relative">
            {HOW_IT_WORKS.map((step, i) => {
              const Icon = step.icon;
              return (
                <div key={i} className="relative">
                  {/* Connector line */}
                  {i < HOW_IT_WORKS.length - 1 && (
                    <div className="hidden md:block absolute top-[18px] left-[calc(100%-16px)] w-[calc(100%-8px)] h-px bg-gradient-to-r from-white/10 via-white/5 to-transparent z-10" />
                  )}
                  <div className="rounded-2xl border border-white/[0.08] bg-white/[0.03] p-6 hover:bg-white/[0.05] hover:border-white/[0.12] transition-all duration-300">
                    <div className="flex items-center gap-3 mb-5">
                      <span className="font-mono text-xs text-white/20 font-bold tracking-widest">{step.step}</span>
                      <div className="flex-1 h-px bg-white/[0.06]" />
                      <div className="w-9 h-9 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
                        <Icon className="h-4 w-4 text-blue-400" />
                      </div>
                    </div>
                    <h3 className="font-semibold text-white mb-2">{step.title}</h3>
                    <p className="text-sm text-white/45 leading-relaxed">{step.description}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── Market preview strip ─────────────────────────────────────────── */}
      <section className="relative py-12 px-5 sm:px-8 overflow-hidden">
        <div className="max-w-7xl mx-auto">
          <div className="rounded-2xl border border-white/[0.08] bg-[#0a0a11] overflow-hidden">
            <div className="px-6 py-4 border-b border-white/[0.06] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold">Live Dashboard Preview</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-green-500/10 text-green-400 border border-green-500/20 font-medium">LIVE</span>
              </div>
              <Link href="/gate" className="text-xs text-blue-400 hover:text-blue-300 transition-colors flex items-center gap-1">
                View full dashboard <ChevronRight className="h-3 w-3" />
              </Link>
            </div>

            {/* Mini market table — live data sorted by IV rank */}
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-white/[0.05]">
                    {['Symbol', 'Price', 'Change', 'IV Rank', 'Volume', 'Signal'].map((h) => (
                      <th key={h} className="px-5 py-3 text-left text-[10px] text-white/30 uppercase tracking-wider font-medium">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {stocksLoading || !previewRows ? (
                    // Skeleton rows while data loads
                    Array.from({ length: 5 }).map((_, i) => (
                      <tr key={i} className="border-b border-white/[0.04]">
                        {Array.from({ length: 6 }).map((_, j) => (
                          <td key={j} className="px-5 py-3.5">
                            <div className="h-3 rounded bg-white/[0.06] animate-pulse" style={{ width: j === 0 ? '3rem' : j === 1 ? '4rem' : '3.5rem' }} />
                          </td>
                        ))}
                      </tr>
                    ))
                  ) : (
                    previewRows.map((row) => {
                      const up     = row.changePercent >= 0;
                      const signal = getSignal(row);
                      return (
                        <tr key={row.symbol} className="border-b border-white/[0.04] hover:bg-white/[0.02] transition-colors">
                          <td className="px-5 py-3.5 font-mono font-bold text-white/80">{row.symbol}</td>
                          <td className="px-5 py-3.5 font-mono text-white/70">${row.price.toFixed(2)}</td>
                          <td className={`px-5 py-3.5 font-mono font-medium ${up ? 'text-green-400' : 'text-red-400'}`}>
                            <span className="flex items-center gap-0.5">
                              {up ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                              {up ? '+' : ''}{row.changePercent.toFixed(2)}%
                            </span>
                          </td>
                          <td className="px-5 py-3.5 font-mono text-violet-400">{ordinal(row.ivRank)}</td>
                          <td className="px-5 py-3.5 font-mono text-white/40">{fmtVol(row.volume)}</td>
                          <td className="px-5 py-3.5">
                            <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium border ${
                              signal === 'Bullish'
                                ? 'bg-green-500/10 text-green-400 border-green-500/20'
                                : signal === 'Bearish'
                                ? 'bg-red-500/10 text-red-400 border-red-500/20'
                                : 'bg-white/5 text-white/40 border-white/10'
                            }`}>
                              {signal}
                            </span>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Footer */}
            <div className="relative px-6 py-4 border-t border-white/[0.06] flex items-center justify-between">
              <span className="text-xs text-white/30">
                Showing top 5 of {total.toLocaleString()} tracked symbols by IV rank
              </span>
              <Link
                href="/gate"
                className="text-xs font-medium px-3 py-1.5 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-400 hover:bg-blue-500/20 transition-colors"
              >
                Unlock full access →
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA / Waitlist ───────────────────────────────────────────────── */}
      <section id="waitlist" className="relative py-24 px-5 sm:px-8">
        {/* Ambient glow */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-[700px] h-[350px] bg-blue-600/7 rounded-full blur-[120px]" />
        </div>

        <div className="relative max-w-2xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/[0.07] border border-white/[0.12] text-xs text-white/55 mb-7 font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
            Private Beta · Limited spots
          </div>

          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-4">
            Ready to trade with an edge?
          </h2>
          <p className="text-white/45 text-sm leading-relaxed mb-10 max-w-lg mx-auto">
            Enter your beta access code to get started immediately,
            or join the waitlist to be notified when new spots open.
          </p>

          {/* Primary CTA */}
          <div className="flex justify-center mb-10">
            <Link
              href="/gate"
              className="inline-flex items-center gap-2 px-8 py-4 rounded-xl bg-blue-500 hover:bg-blue-400 text-white font-semibold text-sm transition-all duration-200 hover:shadow-2xl hover:shadow-blue-500/30 hover:-translate-y-0.5"
            >
              Enter Beta Access
              <ChevronRight className="h-4 w-4" />
            </Link>
          </div>

          {/* Divider */}
          <div className="flex items-center gap-4 mb-8">
            <div className="flex-1 h-px bg-white/[0.08]" />
            <span className="text-xs text-white/30">or join the waitlist</span>
            <div className="flex-1 h-px bg-white/[0.08]" />
          </div>

          {/* Waitlist form */}
          {submitted ? (
            <div className="rounded-2xl border border-green-500/20 bg-green-500/[0.06] p-8">
              <div className="flex items-center justify-center gap-2 text-green-400 font-semibold mb-2">
                <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center">
                  <Check className="h-4 w-4" />
                </div>
                You&apos;re on the list!
              </div>
              <p className="text-sm text-white/45 mt-2">
                We&apos;ll reach out to{' '}
                <strong className="text-white/70">{email}</strong>{' '}
                when your spot is ready.
              </p>
            </div>
          ) : (
            <form
              onSubmit={handleWaitlist}
              className="rounded-2xl border border-white/[0.08] bg-white/[0.025] p-6 text-left"
            >
              <div className="grid sm:grid-cols-2 gap-3 mb-3">
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
              {formError && (
                <p className="text-xs text-red-400 mb-3">{formError}</p>
              )}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 rounded-xl bg-white/[0.07] hover:bg-white/[0.12] border border-white/[0.1] text-sm font-semibold text-white transition-all duration-200 disabled:opacity-50 cursor-pointer"
              >
                {loading ? 'Joining…' : 'Request waitlist access →'}
              </button>
            </form>
          )}

          {/* Social proof */}
          <div className="flex flex-wrap items-center justify-center gap-6 mt-10 text-xs text-white/30">
            <div className="flex items-center gap-1.5">
              <Shield className="h-3.5 w-3.5" />
              No spam, ever
            </div>
            <div className="flex items-center gap-1.5">
              <Target className="h-3.5 w-3.5" />
              Institutional data
            </div>
            <div className="flex items-center gap-1.5">
              <Zap className="h-3.5 w-3.5" />
              Free during beta
            </div>
          </div>
        </div>
      </section>

      {/* ── Footer ───────────────────────────────────────────────────────── */}
      <footer className="border-t border-white/[0.06] py-8 px-5 sm:px-8">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-blue-500/20 border border-blue-500/30 flex items-center justify-center">
              <Activity className="h-3.5 w-3.5 text-blue-400" />
            </div>
            <span className="text-sm font-semibold">OptionsLab</span>
          </div>
          <p className="text-xs text-white/25 text-center">
            © {new Date().getFullYear()} OptionsLab. For informational purposes only. Not financial advice.
          </p>
          <div className="flex items-center gap-5 text-xs text-white/35">
            <Link href="/gate" className="hover:text-white/70 transition-colors">Sign In</Link>
            <Link href="/gate" className="hover:text-white/70 transition-colors">Request Access</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
