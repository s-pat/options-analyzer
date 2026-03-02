# Options Lab — Go Backend

The backend is a **Go 1.22** REST API built with [Gin](https://github.com/gin-gonic/gin). It fetches live market data from Yahoo Finance, runs all options mathematics in-process, and exposes a clean JSON API consumed by the Next.js frontend.

---

## Directory Structure

```
apps/api/
├── cmd/server/
│   └── main.go              # Entry point: wires dependencies, starts Gin + gRPC
├── internal/
│   ├── models/
│   │   └── models.go        # Shared data structs (Stock, OptionContract, …)
│   ├── math/
│   │   └── blackscholes.go  # Black-Scholes pricing, Greeks, HV, IV solver, EMA, RSI
│   ├── yahoo/
│   │   ├── client.go        # Yahoo Finance HTTP client (crumb auth, caching, rate limiting)
│   │   ├── parser.go        # Parses Yahoo JSON responses into domain models
│   │   └── synthetic.go     # Generates a BS-priced fallback chain when live data fails
│   ├── services/
│   │   ├── sp500.go         # SP500 symbol list, stock enrichment with technical indicators
│   │   ├── options.go       # Options chain fetching, scoring, filtering, recommendations
│   │   ├── expiry.go        # Expiry classification (weekly/monthly/quarterly/LEAPS), feasibility
│   │   ├── today.go         # Today's Picks engine (cost-band scanning)
│   │   ├── analysis.go      # Single-option deep analysis and thesis generation
│   │   └── backtest.go      # Historical long call/put simulation engine
│   ├── handlers/
│   │   ├── market.go        # GET /market/overview
│   │   ├── stocks.go        # GET /stocks, /stocks/:symbol, /stocks/:symbol/history
│   │   ├── options.go       # GET /stocks/:symbol/options[/filtered|/analyze]
│   │   ├── today.go         # GET /options/today
│   │   └── backtest.go      # POST /backtest
│   └── grpc/
│       └── server.go        # gRPC streaming server (option score updates, :9090)
├── proto/
│   └── market.proto         # Protobuf definitions
├── go.mod
└── Makefile
```

---

## Key Dependencies

| Package | Purpose |
|---|---|
| `github.com/gin-gonic/gin` | HTTP router and middleware |
| `github.com/gin-contrib/cors` | CORS middleware (allows localhost:3000, 3001) |
| `github.com/patrickmn/go-cache` | In-memory TTL cache for Yahoo responses |
| `google.golang.org/grpc` | gRPC server for streaming option updates |
| `google.golang.org/protobuf` | Protobuf serialisation |

All options math (Black-Scholes, Greeks, HV, RSI, EMA, IV solver) is implemented in pure Go with no external dependencies.

---

## Options Mathematics

### Black-Scholes Pricing

The Black-Scholes model prices a European option assuming the stock follows geometric Brownian motion with constant volatility. The core inputs are:

| Variable | Symbol | Meaning |
|---|---|---|
| Stock price | S | Current market price |
| Strike price | K | The price at which the option can be exercised |
| Time to expiry | T | In years (e.g. 45 days = 45/365 ≈ 0.123) |
| Risk-free rate | r | 5% (approximates US Treasury yields) |
| Volatility | σ | Annualised standard deviation of log returns |

**Call option price:**
```
Call = S × N(d₁) − K × e^(−rT) × N(d₂)
```

**Put option price:**
```
Put = K × e^(−rT) × N(−d₂) − S × N(−d₁)
```

**Where:**
```
d₁ = [ ln(S/K) + (r + σ²/2) × T ] / (σ × √T)
d₂ = d₁ − σ × √T
N  = standard normal cumulative distribution function (CDF)
```

**Code location:** `internal/math/blackscholes.go` → `BSCall`, `BSPut`

---

### Greeks

Greeks quantify the sensitivity of the option price to its inputs.

| Greek | Symbol | Formula | What it means |
|---|---|---|---|
| Delta | Δ | N(d₁) for calls; N(d₁)−1 for puts | $ change in option per $1 stock move |
| Gamma | Γ | φ(d₁) / (S·σ·√T) | Rate of change of delta |
| Theta | Θ | −[S·φ(d₁)·σ/(2·√T) ± r·K·e^(−rT)·N(±d₂)] / 365 | Daily time decay in $ |
| Vega  | ν | S·φ(d₁)·√T / 100 | Price change per 1% volatility move |

`φ` = standard normal PDF. Theta is divided by 365 for a daily figure. Vega is divided by 100 so it represents the change per 1% (not per 1.0) vol move.

**Code location:** `internal/math/blackscholes.go` → `BSGreeks`

---

### Historical Volatility (HV30)

```
1. Daily log return:  r_i = ln(close_i / close_{i-1})
2. Sample std dev:    σ_daily = std(r₁ … r₃₀)   [Bessel-corrected, n-1]
3. Annualise:         HV30 = σ_daily × √252
```

The 252-day multiplier reflects the number of US equity trading days per year.

**Code location:** `internal/math/blackscholes.go` → `HistoricalVolatility`

---

### Implied Volatility (Newton-Raphson)

IV is the σ that makes the BS price equal the observed market price. There is no closed-form inverse, so it is solved iteratively:

```
Initial guess: σ₀ = 0.25 (25%)

Update rule:
  σ_{n+1} = σ_n − (BS(σ_n) − market_price) / vega(σ_n)

Converges when |BS(σ) − market_price| < $0.0001
```

Vega acts as the derivative of the BS price with respect to σ, making this a standard application of Newton-Raphson root finding.

**Code location:** `internal/math/blackscholes.go` → `ImpliedVolatility`

---

### IV Rank

IV Rank normalises the current IV within its 52-week range:

```
IVR = (IV_current − IV_52wk_low) / (IV_52wk_high − IV_52wk_low) × 100
```

- **IVR < 30** → Options are historically cheap → favourable for buying
- **IVR > 70** → Options are historically expensive → unfavourable for buying

The 52-week IV history is approximated by computing rolling 30-day HV × 1.15 over the past 252 trading days.

**Code location:** `internal/math/blackscholes.go` → `IVRank`
**Build location:** `internal/services/sp500.go` → `computeIVHistory`

---

### Options Scoring Formula

Every option candidate is assigned a composite 0–100 score:

```
Score = IV_score × 0.30
      + Tech_score × 0.30
      + Liquidity_score × 0.20
      + RiskReward_score × 0.20
```

| Component | Max | How it is computed |
|---|---|---|
| **IV Score** | 100 | Lower IV Rank = higher score (cheap premiums are best for buyers) |
| **Tech Score** | 100 | +60 for correct EMA trend (EMA20 > EMA50 for calls), +40 for RSI in neutral-momentum zone |
| **Liquidity Score** | 100 | +60 for OI ≥ 500, +30 for OI ≥ 100; +40 for spread < 5%, +20 for spread < 8% |
| **Risk/Reward Score** | 100 | Theoretical edge = (BS fair value − ask) / ask × 100; scaled 10–100 |

Verdict thresholds: ≥75 = Strong Buy, ≥62 = Buy, ≥48 = Speculative, <48 = Pass.

---

### Expiry Classification

US equity options expire on different schedules depending on the stock:

| Category | Rule |
|---|---|
| **Weekly** | Any near-term expiry that is NOT a standard monthly |
| **Monthly** | 3rd Friday of the month (or the Thursday before, for Nasdaq stocks) |
| **Quarterly** | Standard monthly in March, June, September, December |
| **LEAPS** | DTE > 365 |

> **Nasdaq quirk:** AAPL, MSFT, NVDA, and many other Nasdaq stocks officially expire on the Thursday before the 3rd Friday (because settlement occurs Friday). The classifier checks both the date itself and `date + 1 day` to correctly identify standard monthly/quarterly expirations for both conventions.

**Code location:** `internal/services/expiry.go` → `ClassifyExpiry`

---

### Backtesting Methodology

```
For each ~21-trading-day window in the date range:

  1. Entry
     ├── Strike  = nearest $5 to closing price
     ├── DTE     = 45 days
     └── Price   = BSCall/BSPut(close, strike, 45/365, 5%, HV30 × 1.15)

  2. Daily simulation (mark-to-market each day)
     └── Re-price using current close + remaining DTE + rolling HV30

  3. Exit (whichever triggers first)
     ├── P&L ≥ +100%  → profit target hit
     ├── P&L ≤  −50%  → stop loss triggered
     └── DTE reaches 21 → time exit (avoid theta acceleration)

  4. Equity update
     └── Equity × 10% risked per trade → equity grows/shrinks proportionally
```

**Code location:** `internal/services/backtest.go` → `BacktestService.Run`

---

## Yahoo Finance Integration

Yahoo Finance requires a **crumb token** for options API calls (added ~2024). The client handles this transparently:

1. First request visits `https://finance.yahoo.com` to acquire session cookies via a `cookiejar`
2. Fetches the crumb from `https://query2.finance.yahoo.com/v1/test/getcrumb`
3. Appends `?crumb=<encoded>` to every options API call
4. Crumb is cached for 55 minutes; auto-refreshed on a 401 response

**Rate limiting:** 100ms minimum between requests
**Caching:** 5-minute in-memory TTL for quotes/chains (go-cache)
**Fallback:** When live options data is unavailable (market closed, rate limited), a synthetic Black-Scholes priced chain is returned and flagged `isSynthetic: true`

**Code location:** `internal/yahoo/client.go`

---

## Running Tests

```bash
cd apps/api
go test ./...
```

---

## Environment / Configuration

No environment variables are required. All defaults are compiled in:

| Setting | Value | Location |
|---|---|---|
| API port | `:8080` | `cmd/server/main.go` |
| gRPC port | `:9090` | `cmd/server/main.go` |
| Risk-free rate | `5%` | `internal/services/options.go` |
| Cache TTL | `5 minutes` | `internal/yahoo/client.go` |
| Crumb TTL | `55 minutes` | `internal/yahoo/client.go` |
| Rate limit | `100ms / request` | `internal/yahoo/client.go` |
| CORS origins | `localhost:3000`, `localhost:3001` | `cmd/server/main.go` |
