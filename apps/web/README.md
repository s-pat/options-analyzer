# Options Lab — Next.js Frontend

The frontend is a **Next.js 16 App Router** application styled with Tailwind CSS v4 and shadcn/ui. It fetches data from the Go backend every 30 seconds using SWR and presents options analytics in a clean dark-theme dashboard.

---

## Directory Structure

```
apps/web/src/
├── app/
│   ├── layout.tsx          # Root layout (sidebar + dark theme)
│   ├── page.tsx            # Dashboard — market overview + top options
│   ├── today/page.tsx      # Today's Picks by cost band
│   ├── screener/page.tsx   # S&P 500 screener with filters
│   ├── options/page.tsx    # Options chain analyzer with filter panel
│   ├── backtest/page.tsx   # Historical backtesting tool
│   ├── learn/page.tsx      # Options education (beginner-friendly)
│   └── strategies/page.tsx # Options strategies with payoff diagrams
├── components/
│   ├── layout/
│   │   ├── Sidebar.tsx           # Navigation sidebar
│   │   └── Header.tsx            # Page header with symbol search
│   ├── dashboard/
│   │   ├── MarketOverview.tsx    # SPY/QQQ/DIA index cards
│   │   ├── TopOptions.tsx        # Top 10 scored recommendations table
│   │   └── SectorHeatmap.tsx     # 11 GICS sectors color-coded by % change
│   ├── charts/
│   │   ├── StockChart.tsx        # Candlestick + EMA overlays (lightweight-charts)
│   │   └── OptionsPayoff.tsx     # P&L at expiration diagram (Recharts)
│   ├── options/
│   │   ├── OptionsChain.tsx      # Multi-category options chain table
│   │   ├── OptionCard.tsx        # Greeks + contract detail card
│   │   ├── OptionAnalysis.tsx    # Verdict banner + thesis + risk assessment
│   │   └── FilterPanel.tsx       # Capital budget + risk level filter UI
│   ├── today/
│   │   └── TodayOpportunities.tsx # Cost-band tabs with pick cards
│   └── backtest/
│       ├── BacktestForm.tsx      # Backtest configuration form
│       └── BacktestResults.tsx   # Equity curve + trade log
├── hooks/
│   ├── useMarketData.ts    # SWR hooks for all API endpoints
│   └── useBacktest.ts      # Backtest form state + submission
└── lib/
    ├── api.ts              # Typed fetch wrappers for the Go backend
    ├── types.ts            # TypeScript types mirroring Go models
    └── utils.ts            # Utility helpers (cn classname merger)
```

---

## Key Libraries

| Library | Version | Purpose |
|---|---|---|
| [Next.js](https://nextjs.org/) | 16 | React framework with App Router, server components |
| [Tailwind CSS](https://tailwindcss.com/) | 4 | Utility-first CSS (uses `@import "tailwindcss"` syntax) |
| [shadcn/ui](https://ui.shadcn.com/) | latest | Accessible component primitives (radix-ui based) |
| [SWR](https://swr.vercel.app/) | 2 | Data fetching with caching, revalidation, and deduplication |
| [lightweight-charts](https://github.com/tradingview/lightweight-charts) | 5 | TradingView candlestick/line charts |
| [Recharts](https://recharts.org/) | 2 | Composable charts (equity curve, payoff diagram) |
| [Lucide React](https://lucide.dev/) | latest | Icon library |

---

## Data Fetching

All API calls go through `lib/api.ts`, which wraps `fetch` with typed generics:

```typescript
async function fetchJSON<T>(path: string, options?: RequestInit): Promise<T>
```

SWR hooks in `hooks/useMarketData.ts` wrap each API function with automatic:
- **30-second revalidation** for live market data
- **60-second revalidation** for the Today's Picks scan (heavier computation)
- **On-focus revalidation disabled** for analysis results (avoid flickering)

```typescript
// Example: SWR with 30s refresh
export function useOptionsChain(symbol: string | null) {
  return useSWR(
    symbol ? `stocks/${symbol}/options` : null,
    () => getOptionsChain(symbol!),
    { refreshInterval: 30_000 },
  );
}
```

The API base URL defaults to `http://localhost:8080/api/v1` and can be overridden via `NEXT_PUBLIC_API_URL`.

---

## Options Chain Component

`components/options/OptionsChain.tsx` displays contracts grouped by **expiry category** (Weekly → Monthly → Quarterly → LEAPS), each with its own sub-tab:

```
Calls  |  Puts
  ↓
  ┌─ Weekly (3) ─┬─ Monthly (4) ─┬─ Quarterly (2) ─┬─ LEAPS (2) ─┐
  │ Mar 7  6 DTE │ Apr 17  46 DTE│  Jun 20 108 DTE │ Jan 2027     │
  │ Strike table │ Strike table  │  Strike table   │ Strike table  │
  └──────────────┴───────────────┴─────────────────┴──────────────┘
```

Clicking any row fetches a full analysis from `/options/analyze` and displays the verdict panel on the right.

---

## Filter Panel

`components/options/FilterPanel.tsx` controls the filtered chain endpoint:

| Filter | Options | Backend param |
|---|---|---|
| Max cost / contract | Any / ≤$100 / ≤$500 / ≤$1,500 / ≤$5,000 | `maxCapital` |
| Risk level | All / Conservative / Moderate / Aggressive | `riskLevel` 0–3 |
| Option type | Calls & Puts / Calls Only / Puts Only | `onlyCall` / `onlyPut` |

**Risk level DTE/delta/OI thresholds:**

| Level | DTE | Delta | OI | Spread |
|---|---|---|---|---|
| Conservative | 30–60 | 0.40–0.55 | ≥ 500 | < 6% |
| Moderate | 21–90 | 0.30–0.60 | ≥ 200 | < 12% |
| Aggressive | 7–180 | any | ≥ 50 | < 20% |

---

## TypeScript Types

`lib/types.ts` mirrors the Go backend models exactly. Key interfaces:

```typescript
interface OptionContract {
  strike: number;
  expiration: number;        // Unix timestamp
  dte: number;               // Days to expiration
  delta: number;             // 0..1 for calls, −1..0 for puts
  impliedVolatility: number; // As a decimal (0.30 = 30%)
  bsFairValue: number;       // Black-Scholes theoretical price
  contractCost: number;      // ask × 100 (1 contract = 100 shares)
  expiryCategory: 'weekly' | 'monthly' | 'quarterly' | 'leaps';
  isFeasible: boolean;       // Passes retail-investor viability checks
}

interface OptionAnalysis {
  verdict: 'Strong Buy' | 'Buy' | 'Speculative' | 'Pass';
  score: number;             // 0–100 composite score
  riskFactor: number;        // 1 (lowest) to 5 (highest)
  thesis: string[];          // 5–6 explanation bullets
  keyRisks: string[];        // 3 risk bullets
  signals: OptionSignal[];   // Named signal checklist
  breakevenAt: number;       // Strike ± premium paid
}
```

---

## Running

```bash
npm install
npm run dev     # → http://localhost:3000

# Type-check only
npx tsc --noEmit

# Build for production
npm run build
```

Requires the Go backend to be running on `localhost:8080` (or set `NEXT_PUBLIC_API_URL`).

---

## Styling Notes

This project uses **Tailwind CSS v4** which differs from v3:

- No `tailwind.config.js` — configuration is done via CSS `@theme` blocks
- Import with `@import "tailwindcss"` instead of `@tailwind base/components/utilities`
- shadcn/ui uses the `radix-ui` package (not the individual `@radix-ui/*` packages)
