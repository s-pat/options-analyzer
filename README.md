# OptionLabs

A full-stack options analytics platform for retail investors. Scan S&P 500 stocks, analyze options chains grouped by expiry category, get AI-scored trade recommendations, and backtest long call/put strategies — all powered by free Yahoo Finance market data.

---

## Features

| Feature | Description |
|---|---|
| **Dashboard** | Live SPY/QQQ/DIA indices, sector heatmap, top 10 scored options |
| **Today's Picks** | Top long call/put opportunities broken down by contract cost ($0–$100, $100–$500, $500–$1.5k, $1.5k+) |
| **Options Analyzer** | Full options chain (weekly/monthly/quarterly/LEAPS) with Greeks, BS fair value, filter by budget & risk level |
| **Backtester** | Simulate long call or put strategies over 1–2 years of historical data with an equity curve |
| **Screener** | Filter 60 S&P 500 stocks by IV Rank, sector, RSI, trend |
| **Learn** | Options education from zero to first trade |
| **Strategies** | Long call, long put, covered call, spreads — explained with payoff diagrams |

---

## Architecture

```
options-analyzer/          ← Turborepo monorepo root
├── apps/
│   ├── api/               ← Go 1.22 REST + gRPC backend
│   └── web/               ← Next.js 16 frontend
├── package.json           ← Turborepo workspace config
└── turbo.json
```

**Data flow:**

```
Yahoo Finance (free, no API key)
        │  HTTP + crumb auth
        ▼
apps/api  (Go, :8080)
  ├── Yahoo Finance client   (cache 5 min, rate-limited 100ms/req)
  ├── Black-Scholes engine   (pricing, Greeks, IV solver)
  ├── Services               (SP500, Options, Today, Backtest, Analysis)
  └── Gin HTTP handlers      (REST JSON)
        │  fetch every 30s
        ▼
apps/web  (Next.js, :3000)
  ├── SWR data hooks
  ├── shadcn/ui components
  └── Recharts / lightweight-charts
```

---

## Quick Start

### Prerequisites

- Go 1.22+
- Node.js 20+ with npm

### Run the backend

```bash
cd apps/api
go mod tidy
go run ./cmd/server
# → API listening on http://localhost:8080
```

### Run the frontend

```bash
cd apps/web
npm install
npm run dev
# → App running on http://localhost:3000
```

### Run both (Turborepo)

```bash
npm install          # at repo root
npm run dev          # starts api + web in parallel
```

---

## REST API

All endpoints are prefixed `/api/v1`.

| Method | Path | Description |
|---|---|---|
| `GET` | `/market/overview` | SPY, QQQ, DIA indices + sector performance |
| `GET` | `/stocks` | All ~60 S&P 500 stocks with technical indicators |
| `GET` | `/stocks/:symbol` | Single stock with IV Rank, HV30, EMA, RSI |
| `GET` | `/stocks/:symbol/history?range=1y` | OHLCV candlestick data |
| `GET` | `/stocks/:symbol/options` | Full options chain (all categories) |
| `GET` | `/stocks/:symbol/options/filtered` | Filtered chain (see query params below) |
| `GET` | `/stocks/:symbol/options/analyze` | Full thesis for a specific contract |
| `GET` | `/options/recommendations?limit=20` | Top scored long calls + puts |
| `GET` | `/options/today` | Today's Picks by cost band |
| `POST` | `/backtest` | Run historical simulation |

**Filtered chain query params:**

| Param | Type | Description |
|---|---|---|
| `maxCapital` | float | Max contract cost in dollars (0 = no limit) |
| `riskLevel` | int 1–3 | 1 = Conservative, 2 = Moderate, 3 = Aggressive |
| `onlyCall` | bool | Show only call options |
| `onlyPut` | bool | Show only put options |

---

## Tech Stack

| Layer | Technology |
|---|---|
| Monorepo | [Turborepo](https://turbo.build/) |
| Backend language | Go 1.22 |
| HTTP framework | [Gin](https://github.com/gin-gonic/gin) |
| Frontend framework | [Next.js 16](https://nextjs.org/) App Router |
| Styling | [Tailwind CSS v4](https://tailwindcss.com/) |
| UI components | [shadcn/ui](https://ui.shadcn.com/) |
| Stock charts | [lightweight-charts v5](https://github.com/tradingview/lightweight-charts) |
| Data charts | [Recharts](https://recharts.org/) |
| Data fetching | [SWR](https://swr.vercel.app/) |
| Market data | Yahoo Finance (free, no API key) |
| Options math | Pure Go Black-Scholes implementation |

---

## Disclaimer

This tool is for educational and research purposes only. It is **not** financial advice. Options trading involves significant risk of loss. Always do your own due diligence before trading real money.
