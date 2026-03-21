// Server component — static pricing page, no client JS needed.
// Linked from /landing and the in-app upgrade modals.

import Link from 'next/link';
import {
  Check,
  Zap,
  Star,
  Shield,
  ChevronRight,
  BarChart2,
  Search,
  GitBranch,
  BookOpen,
  Bell,
  Download,
  Key,
  TrendingUp,
} from 'lucide-react';

// ── Tier data ─────────────────────────────────────────────────────────────────

const TIERS = [
  {
    id: 'free',
    name: 'Free',
    price: 0,
    annualPrice: 0,
    description: 'Get started with the basics. No credit card required.',
    cta: 'Start for free',
    ctaHref: '/sign-up',
    highlight: false,
    badge: null,
    color: 'white',
    features: [
      { text: 'S&P 500 Screener — top 20 results', included: true },
      { text: "Today's Picks — 3 per day", included: true },
      { text: 'Options chain — price, volume, OI', included: true },
      { text: 'Full Learn & Strategies library', included: true },
      { text: 'Greeks & IV Rank', included: false },
      { text: 'Fair value (Black-Scholes)', included: false },
      { text: 'Backtesting engine', included: false },
      { text: 'Watchlists & alerts', included: false },
      { text: 'Data export (CSV / JSON)', included: false },
    ],
  },
  {
    id: 'pro',
    name: 'Pro',
    price: 19,
    annualPrice: 179,
    description: 'Everything you need to trade options with conviction.',
    cta: 'Start 14-day free trial',
    ctaHref: '/sign-up?plan=pro',
    highlight: true,
    badge: 'Most Popular',
    color: 'blue',
    features: [
      { text: 'Full S&P 500 Screener (503 stocks)', included: true },
      { text: "Today's Picks — all picks, all cost bands", included: true },
      { text: 'Full options chain with Greeks (Δ Θ Γ ν)', included: true },
      { text: 'IV Rank, HV30, RSI indicators', included: true },
      { text: 'Fair value via Black-Scholes model', included: true },
      { text: 'Backtesting — 1 yr data, 5 strategies', included: true },
      { text: 'Full Learn & Strategies library', included: true },
      { text: 'Weekly email digest', included: true },
      { text: 'Watchlists & alerts', included: false },
      { text: 'Data export (CSV / JSON)', included: false },
    ],
  },
  {
    id: 'premium',
    name: 'Premium',
    price: 49,
    annualPrice: 449,
    description: 'Advanced tools for serious and professional traders.',
    cta: 'Start 14-day free trial',
    ctaHref: '/sign-up?plan=premium',
    highlight: false,
    badge: 'Best Value',
    color: 'violet',
    features: [
      { text: 'Everything in Pro', included: true },
      { text: 'Backtesting — 5 yr data, unlimited strategies', included: true },
      { text: 'Watchlists & portfolio tracker', included: true },
      { text: 'Real-time alerts (email + push)', included: true },
      { text: 'IV Surface & skew analysis', included: true },
      { text: 'Data export (CSV / JSON)', included: true },
      { text: 'API access (1,000 req/day)', included: true },
      { text: 'Priority support (<4hr SLA)', included: true },
      { text: 'Early access to new features', included: true },
    ],
  },
] as const;

const FAQS = [
  {
    q: 'Do I need a credit card to start the free trial?',
    a: 'No. You can start a 14-day free trial for Pro or Premium without entering payment details. You\'ll only be charged if you choose to subscribe after the trial.',
  },
  {
    q: 'Can I switch plans at any time?',
    a: 'Yes. Upgrade or downgrade whenever you like. Upgrades take effect immediately; downgrades apply at the end of your current billing cycle.',
  },
  {
    q: 'What data does OptionLabs use?',
    a: 'All market data is sourced from Yahoo Finance in real-time. Options chains, price history, and fundamentals are refreshed continuously during market hours.',
  },
  {
    q: 'Is OptionLabs available outside the US?',
    a: 'Yes — the platform is accessible globally. However, options data is currently limited to US-listed equities (S&P 500).',
  },
  {
    q: 'Do you offer discounts for teams or students?',
    a: 'We offer a 20% discount on annual plans for verified students. Team pricing for 5+ seats is available — contact us for a custom quote.',
  },
  {
    q: 'Can I get a refund?',
    a: 'We offer a 7-day money-back guarantee on first-time paid subscriptions, no questions asked.',
  },
] as const;

const COMPARE_FEATURES = [
  { label: 'S&P 500 Screener', free: '20 results', pro: 'All 503 stocks', premium: 'All 503 stocks' },
  { label: "Today's Picks", free: '3 / day', pro: 'Unlimited', premium: 'Unlimited' },
  { label: 'Options Chain', free: 'Basic', pro: 'Full + Greeks', premium: 'Full + Greeks' },
  { label: 'IV Rank / HV30 / RSI', free: '—', pro: '✓', premium: '✓' },
  { label: 'Black-Scholes Fair Value', free: '—', pro: '✓', premium: '✓' },
  { label: 'Backtesting history', free: '—', pro: '1 year', premium: '5 years' },
  { label: 'Saved strategies', free: '—', pro: '5', premium: 'Unlimited' },
  { label: 'Watchlists', free: '—', pro: '—', premium: '10 lists' },
  { label: 'Alerts', free: '—', pro: 'Email digest', premium: 'Email + Push' },
  { label: 'Data export', free: '—', pro: '—', premium: 'CSV / JSON' },
  { label: 'API access', free: '—', pro: '—', premium: '1,000 req/day' },
  { label: 'Support', free: 'Community', pro: 'Email', premium: 'Priority (<4hr)' },
] as const;

// ── Color maps ────────────────────────────────────────────────────────────────

const TIER_COLORS = {
  white:  { bg: 'bg-white/[0.03]',    border: 'border-white/[0.08]',    text: 'text-white/70',    badge: 'bg-white/[0.08] text-white/60',       glow: '' },
  blue:   { bg: 'bg-blue-500/[0.06]', border: 'border-blue-500/30',    text: 'text-blue-400',    badge: 'bg-blue-500/20 text-blue-300 border border-blue-500/30', glow: 'shadow-[0_0_40px_rgba(59,130,246,0.12)]' },
  violet: { bg: 'bg-white/[0.03]',    border: 'border-white/[0.08]',    text: 'text-violet-400',  badge: 'bg-violet-500/20 text-violet-300 border border-violet-500/30', glow: '' },
} as const;

// ── Sub-components ────────────────────────────────────────────────────────────

function PricingCard({ tier, annual }: { tier: typeof TIERS[number]; annual: boolean }) {
  const c = TIER_COLORS[tier.color];
  const displayPrice = annual ? Math.round(tier.annualPrice / 12) : tier.price;
  const billingLabel = tier.price === 0
    ? 'Free forever'
    : annual
    ? `Billed $${tier.annualPrice}/yr`
    : 'Billed monthly';

  return (
    <div
      className={`relative flex flex-col rounded-2xl border ${c.border} ${c.bg} ${c.glow} p-7 transition-all duration-300
        ${tier.highlight ? 'ring-1 ring-blue-500/40 scale-[1.02]' : 'hover:border-white/[0.14] hover:bg-white/[0.045]'}`}
    >
      {tier.badge && (
        <div className={`absolute -top-3 left-1/2 -translate-x-1/2 text-[10px] font-semibold uppercase tracking-wider px-3 py-1 rounded-full ${c.badge}`}>
          {tier.badge}
        </div>
      )}

      <div className="mb-6">
        <h3 className={`text-sm font-semibold uppercase tracking-widest mb-1 ${c.text}`}>{tier.name}</h3>
        <div className="flex items-end gap-1.5 mt-3 mb-2">
          {tier.price === 0 ? (
            <span className="text-4xl font-bold text-white">Free</span>
          ) : (
            <>
              <span className="text-4xl font-bold text-white font-mono">${displayPrice}</span>
              <span className="text-white/40 text-sm mb-1.5">/mo</span>
            </>
          )}
        </div>
        <p className="text-[11px] text-white/35">{billingLabel}</p>
        <p className="text-sm text-white/50 mt-3 leading-relaxed">{tier.description}</p>
      </div>

      <Link
        href={tier.ctaHref}
        className={`block text-center text-sm font-semibold py-2.5 rounded-xl mb-6 transition-all duration-200
          ${tier.highlight
            ? 'bg-blue-500 hover:bg-blue-400 text-white'
            : 'bg-white/[0.07] hover:bg-white/[0.12] text-white border border-white/[0.1]'}`}
      >
        {tier.cta}
      </Link>

      <ul className="space-y-3 flex-1">
        {tier.features.map((f) => (
          <li key={f.text} className="flex items-start gap-2.5">
            <span className={`mt-0.5 flex-shrink-0 w-4 h-4 rounded-full flex items-center justify-center
              ${f.included ? 'bg-green-500/15 text-green-400' : 'bg-white/[0.05] text-white/20'}`}>
              <Check className="w-2.5 h-2.5" strokeWidth={3} />
            </span>
            <span className={`text-sm ${f.included ? 'text-white/70' : 'text-white/25 line-through'}`}>
              {f.text}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-[#060608] text-white selection:bg-blue-500/30 overflow-x-hidden">

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

      {/* Ambient glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 bg-blue-600/8 rounded-full pointer-events-none hidden sm:block w-[800px] h-[400px] blur-[150px]" />

      <div className="relative max-w-6xl mx-auto px-5 sm:px-8 py-24">

        {/* ── Header ──────────────────────────────────────────────────────── */}
        <div className="text-center mb-16" style={{ animation: 'fade-in-up 0.5s ease both' }}>
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/[0.07] border border-white/[0.12] text-xs text-white/60 mb-6 font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
            14-day free trial · No credit card required
          </div>

          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight leading-tight mb-4">
            Simple, transparent pricing
          </h1>
          <p className="text-lg text-white/45 max-w-xl mx-auto">
            Start free. Upgrade when you're ready. Cancel any time.
          </p>

          {/* Annual / Monthly toggle — static hint (interactive version would need 'use client') */}
          <div className="inline-flex items-center gap-2 mt-8 px-1 py-1 rounded-xl bg-white/[0.05] border border-white/[0.08]">
            <span className="px-4 py-1.5 rounded-lg bg-white/[0.08] text-sm text-white font-medium">Monthly</span>
            <Link
              href="/pricing?billing=annual"
              className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-sm text-white/50 hover:text-white/80 transition-colors"
            >
              Annual
              <span className="text-[10px] font-semibold text-green-400 bg-green-500/15 border border-green-500/20 px-1.5 py-0.5 rounded-full">
                Save 20%
              </span>
            </Link>
          </div>
        </div>

        {/* ── Pricing cards ────────────────────────────────────────────────── */}
        <div className="grid md:grid-cols-3 gap-5 mb-20" style={{ animation: 'fade-in-up 0.6s ease 0.1s both' }}>
          {TIERS.map((tier) => (
            <PricingCard key={tier.id} tier={tier} annual={false} />
          ))}
        </div>

        {/* ── Launch offer banner ──────────────────────────────────────────── */}
        <div className="relative rounded-2xl border border-amber-500/20 bg-amber-500/[0.04] p-6 mb-20 overflow-hidden">
          <div className="absolute right-6 top-1/2 -translate-y-1/2 text-amber-500/10 pointer-events-none">
            <Star className="w-32 h-32" />
          </div>
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-amber-500/15 border border-amber-500/25 flex items-center justify-center">
              <Zap className="w-5 h-5 text-amber-400" />
            </div>
            <div className="flex-1">
              <div className="text-sm font-semibold text-amber-300 mb-0.5">Founding Member Offer</div>
              <p className="text-sm text-white/50">
                First 100 subscribers get a <strong className="text-white/80">lifetime 30% discount</strong> locked in forever. 47 spots remaining.
              </p>
            </div>
            <Link
              href="/sign-up?plan=pro&offer=founding"
              className="flex-shrink-0 flex items-center gap-1.5 bg-amber-500 hover:bg-amber-400 text-black text-sm font-semibold px-4 py-2 rounded-xl transition-colors"
            >
              Claim offer <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
        </div>

        {/* ── Feature comparison table ─────────────────────────────────────── */}
        <div className="mb-20" style={{ animation: 'fade-in-up 0.6s ease 0.2s both' }}>
          <h2 className="text-2xl font-bold text-center mb-2">Compare plans</h2>
          <p className="text-white/40 text-sm text-center mb-10">Full feature breakdown across all tiers.</p>

          <div className="rounded-2xl border border-white/[0.08] overflow-hidden">
            {/* Header row */}
            <div className="grid grid-cols-4 bg-white/[0.03] border-b border-white/[0.08]">
              <div className="p-4 text-xs text-white/35 uppercase tracking-wider">Feature</div>
              {TIERS.map((t) => (
                <div key={t.id} className={`p-4 text-center text-sm font-semibold ${TIER_COLORS[t.color].text}`}>
                  {t.name}
                </div>
              ))}
            </div>

            {/* Feature rows */}
            {COMPARE_FEATURES.map((row, i) => (
              <div
                key={row.label}
                className={`grid grid-cols-4 border-b border-white/[0.05] last:border-0 ${i % 2 === 0 ? '' : 'bg-white/[0.015]'}`}
              >
                <div className="p-4 text-sm text-white/60">{row.label}</div>
                <div className="p-4 text-center text-sm text-white/40 font-mono">{row.free}</div>
                <div className="p-4 text-center text-sm text-white/70 font-mono">{row.pro}</div>
                <div className="p-4 text-center text-sm text-white/70 font-mono">{row.premium}</div>
              </div>
            ))}
          </div>
        </div>

        {/* ── What you get callouts ─────────────────────────────────────────── */}
        <div className="grid sm:grid-cols-3 gap-4 mb-20">
          {[
            { icon: BarChart2, color: 'blue', title: 'Institutional-grade data', desc: 'Live options chains, Greeks, IV surface, and historical volatility sourced from Yahoo Finance.' },
            { icon: Shield,    color: 'green', title: 'No lock-in, ever', desc: 'Cancel any time. Export your data. We compete on quality, not contracts.' },
            { icon: BookOpen,  color: 'violet', title: 'Built-in education', desc: 'Learn options from the ground up — Greeks, payoff diagrams, strategy guides — all free.' },
          ].map(({ icon: Icon, color, title, desc }) => {
            const colors = {
              blue:   { bg: 'bg-blue-500/10',   border: 'border-blue-500/20',   text: 'text-blue-400'   },
              green:  { bg: 'bg-green-500/10',  border: 'border-green-500/20',  text: 'text-green-400'  },
              violet: { bg: 'bg-violet-500/10', border: 'border-violet-500/20', text: 'text-violet-400' },
            }[color]!;
            return (
              <div key={title} className="rounded-2xl border border-white/[0.08] bg-white/[0.03] p-6">
                <div className={`w-10 h-10 rounded-xl ${colors.bg} ${colors.border} border flex items-center justify-center mb-4`}>
                  <Icon className={`w-5 h-5 ${colors.text}`} />
                </div>
                <h3 className="text-sm font-semibold text-white mb-2">{title}</h3>
                <p className="text-sm text-white/45 leading-relaxed">{desc}</p>
              </div>
            );
          })}
        </div>

        {/* ── FAQ ──────────────────────────────────────────────────────────── */}
        <div className="mb-20">
          <h2 className="text-2xl font-bold text-center mb-2">Frequently asked questions</h2>
          <p className="text-white/40 text-sm text-center mb-10">Still have questions? <a href="mailto:hello@optionlabs.io" className="text-blue-400 hover:text-blue-300 transition-colors">Email us.</a></p>

          <div className="grid sm:grid-cols-2 gap-4">
            {FAQS.map((faq) => (
              <div key={faq.q} className="rounded-2xl border border-white/[0.08] bg-white/[0.03] p-6">
                <h3 className="text-sm font-semibold text-white mb-2">{faq.q}</h3>
                <p className="text-sm text-white/50 leading-relaxed">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>

        {/* ── Final CTA ────────────────────────────────────────────────────── */}
        <div className="text-center rounded-2xl border border-white/[0.08] bg-white/[0.03] p-12">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-xs text-blue-400 mb-6 font-medium">
            <TrendingUp className="w-3.5 h-3.5" />
            Start trading smarter today
          </div>
          <h2 className="text-3xl font-bold mb-3">Ready to get an edge?</h2>
          <p className="text-white/45 mb-8 max-w-md mx-auto text-sm leading-relaxed">
            Join hundreds of traders using OptionLabs to find high-probability options setups every day.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/sign-up"
              className="flex items-center justify-center gap-2 bg-blue-500 hover:bg-blue-400 text-white font-semibold px-6 py-3 rounded-xl transition-colors text-sm"
            >
              Get started free <ChevronRight className="w-4 h-4" />
            </Link>
            <Link
              href="/sign-up?plan=pro"
              className="flex items-center justify-center gap-2 bg-white/[0.07] hover:bg-white/[0.12] border border-white/[0.1] text-white font-semibold px-6 py-3 rounded-xl transition-colors text-sm"
            >
              Start Pro trial
            </Link>
          </div>
          <p className="text-xs text-white/25 mt-5">No credit card required · Cancel any time · 7-day money-back guarantee</p>
        </div>

      </div>
    </div>
  );
}
