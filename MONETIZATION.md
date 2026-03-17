# OptionLabs — Monetization Plan

## Executive Summary

OptionLabs is positioned at the intersection of retail options education and institutional-grade analysis tools. The core monetization strategy is a **freemium SaaS subscription model** with three tiers, supplemented by broker affiliate revenue and a developer API.

---

## Revenue Streams

### 1. Subscription Tiers (Primary — ~70% of revenue)

#### Free
_Permanently free. Goal: user acquisition and habit formation._

| Feature | Limit |
|---------|-------|
| S&P 500 Screener | Top 20 results, no custom sorting |
| Today's Picks | 3 picks/day |
| Options Chain | Price, Volume, OI only (no Greeks) |
| Learn & Strategies | Full access (drives upgrades) |
| Backtesting | ❌ Locked |
| IV Rank / HV30 / RSI | ❌ Locked |
| Fair Value (Black-Scholes) | ❌ Locked |

#### Pro — $19/month or $179/year (~6% discount implied, market-friendly)
_Target: active retail traders, ~500–2,000 users in year 1._

| Feature | Access |
|---------|--------|
| Full S&P 500 Screener | All 503 stocks, all sort/filter options |
| Today's Picks | All picks, all cost bands |
| Options Chain | Full Greeks (Δ, Θ, Γ, ν), IV Rank, Fair Value |
| Backtesting | 1 year historical data, 5 saved strategies |
| Options Analyzer | Complete analysis panel |
| Email digests | Weekly summary email |

#### Premium — $49/month or $449/year
_Target: serious traders, small RIAs, prop traders._

| Feature | Access |
|---------|--------|
| Everything in Pro | ✓ |
| Backtesting | 5 years of data, unlimited saved strategies |
| Watchlists & Portfolio tracker | Up to 10 watchlists |
| Real-time alerts | Email + push alerts for IV spikes, pick triggers |
| IV Surface & Skew analysis | Advanced volatility tools |
| Export data | CSV/JSON export of screener and picks |
| Priority support | <4hr response SLA |
| Early access | Beta features before public release |

---

### 2. Broker Affiliate Partnerships (~20% of revenue)

**How it works:** Add "Open an account" CTAs throughout the app linking to brokers with options capabilities. Earn per-funded-account commissions.

**Target partners:**
- **Tastytrade** — $100–$250 per funded account (options-focused, highest fit)
- **TD Ameritrade / Schwab thinkorswim** — $100–$300 per account
- **Webull** — $30–$50 per account (lower, but high conversion)
- **Interactive Brokers** — $200 per account (power users)

**Placement:**
- Today's Picks page: "Ready to trade? Open an account →"
- Options Chain page: "Execute this trade on [Broker]"
- Landing page footer: "Trusted by traders using…" logos

**Estimated revenue:** $50–$150 per 100 active monthly users

---

### 3. Developer API Access (~10% of revenue)

**Offer the Go backend as a paid API for:**
- Independent traders building custom tools
- Algo developers who want pre-calculated Greeks / IV Rank
- Small hedge funds needing a lightweight data feed

**Pricing:**
- Hobbyist: $29/month — 1,000 requests/day
- Builder: $99/month — 10,000 requests/day
- Business: $299/month — 100,000 requests/day + SLA

**Implementation:** Add API key system + rate limiting to existing Go API. Expose `/api/v1/*` routes with key-based auth.

---

## Implementation Roadmap

### Phase 1 — Foundation (Weeks 1–3)
- [ ] Add Stripe integration (subscriptions + webhooks)
- [ ] Extend Clerk `publicMetadata` with `{ tier: 'free' | 'pro' | 'premium' }`
- [ ] Build `/pricing` marketing page
- [ ] Feature-gate Free tier limits in middleware or API layer

### Phase 2 — Gate Core Features (Weeks 4–6)
- [ ] Greeks / IV Rank locked behind Pro in API response
- [ ] Screener limited to 20 rows for Free (server-side)
- [ ] Today's Picks capped at 3 for Free tier
- [ ] Backtesting locked behind Pro; upgrade modal on click
- [ ] "Upgrade to Pro" CTAs throughout app

### Phase 3 — Premium Value (Weeks 7–10)
- [ ] Watchlists & portfolio tracker
- [ ] Email alert system (SendGrid or Resend)
- [ ] CSV export endpoints
- [ ] IV Surface visualization

### Phase 4 — Affiliate & API (Weeks 11–14)
- [ ] Broker affiliate link integration
- [ ] API key management page (`/account/api-keys`)
- [ ] Go API rate limiting middleware
- [ ] API documentation page

---

## Pricing Psychology & Strategy

### Anchoring
Display Premium first (highest price), then Pro (target plan highlighted), then Free. This makes Pro feel like the rational middle choice.

### Annual Discount
Offer ~20% discount on annual plans ($179 vs $228 for Pro). This improves cash flow and reduces churn.

### Trial
- 14-day free trial for Pro (no credit card required)
- This removes friction and increases conversion from the waitlist

### Social Proof
Add to pricing page:
- Number of active traders
- Options contracts analyzed
- User testimonials / star ratings

### Launch Offer
First 100 subscribers get **lifetime 30% discount** — creates urgency and rewards early adopters.

---

## Financial Projections (Conservative)

| Month | Free Users | Pro Users | Premium Users | MRR |
|-------|-----------|-----------|---------------|-----|
| 3 | 500 | 25 | 5 | $710 |
| 6 | 1,500 | 80 | 15 | $2,255 |
| 12 | 5,000 | 250 | 50 | $7,200 |
| 18 | 12,000 | 600 | 120 | $17,280 |

_Assumes 5% free→paid conversion, $19 Pro / $49 Premium pricing._

---

## Key Metrics to Track

- **MRR** (Monthly Recurring Revenue)
- **Churn rate** (target <5%/month)
- **Free → Paid conversion** (target 4–7%)
- **ARPU** (Average Revenue Per User)
- **Payback period** (CAC / ARPU)
- **Feature usage by tier** (to inform gating decisions)

---

## Competitive Positioning

| Tool | Price | Focus |
|------|-------|-------|
| **OptionLabs** | $19–$49/mo | Options analysis + education |
| Market Chameleon | $79/mo | Options data, no education |
| Barchart Options | $99/mo | Data-heavy, complex UX |
| Unusual Whales | $50/mo | Options flow, sentiment |
| Thinkorswim | Free (broker) | Execution platform |

**Advantage:** OptionLabs occupies the "best-in-class UX + education + analysis" niche at a significantly lower price point. The `/learn` and `/strategies` pages provide genuine education value that retains beginners and drives word-of-mouth.
