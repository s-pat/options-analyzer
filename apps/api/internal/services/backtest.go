// backtest.go — Historical long call/put simulation engine.
//
// # Methodology
//
// The backtest simulates buying one ATM option contract per month over a
// historical date range using the following rules:
//
//  1. Entry:   First trading day of each ~21-day window.
//              Strike = nearest $5 increment to the closing stock price.
//              DTE = 45 days (target expiry).
//              Entry price = Black-Scholes price using HV30 × 1.15 as IV.
//
//  2. Daily mark-to-market:
//              Re-price the option each day using the current close price,
//              remaining DTE, and the rolling 30-day HV at that date.
//
//  3. Exit rules (whichever comes first):
//              a. Profit target: position P&L ≥ +100% → close at profit
//              b. Stop loss:     position P&L ≤ −50%  → close at stop
//              c. Time exit:     remaining DTE hits 21  → close to avoid
//                 accelerating theta decay in the final weeks
//
//  4. Position sizing:
//              Each trade risks 10% of the current portfolio equity.
//              This allows the equity curve to compound/decay realistically
//              rather than using fixed dollar sizes.
//
// # Limitations
//
//   - Uses Black-Scholes with historical vol — not live implied vol
//   - No transaction costs or slippage modelled
//   - Only one contract per trade; no position scaling
//   - Historical vol is a lagging indicator; real IV differs significantly
//     around earnings and macro events
package services

import (
	"fmt"
	"math"
	"time"

	"github.com/sohanpatel/options-analyzer/api/internal/datasource"
	bsmath "github.com/sohanpatel/options-analyzer/api/internal/math"
	"github.com/sohanpatel/options-analyzer/api/internal/models"
)

// BacktestService runs historical long call/put option simulations.
type BacktestService struct {
	client datasource.DataSource
}

// NewBacktestService creates a new BacktestService
func NewBacktestService(client datasource.DataSource) *BacktestService {
	return &BacktestService{client: client}
}

const (
	profitTargetPct = 1.00 // +100% gain triggers an early exit to lock profits
	stopLossPct     = 0.50 // -50% loss triggers stop to limit maximum drawdown
	exitDTE         = 21   // time-based exit: close position at 21 DTE to avoid gamma/theta acceleration
)

// Run executes a backtest for the given request
func (b *BacktestService) Run(req models.BacktestRequest) (*models.BacktestResult, error) {
	// Parse dates
	startDate, err := time.Parse("2006-01-02", req.StartDate)
	if err != nil {
		return nil, fmt.Errorf("invalid startDate: %w", err)
	}
	endDate, err := time.Parse("2006-01-02", req.EndDate)
	if err != nil {
		return nil, fmt.Errorf("invalid endDate: %w", err)
	}
	if endDate.Before(startDate) {
		return nil, fmt.Errorf("endDate must be after startDate")
	}

	// Fetch full historical data (up to 2y)
	history, err := b.client.GetHistory(req.Symbol, "2y")
	if err != nil {
		return nil, fmt.Errorf("history fetch: %w", err)
	}
	if len(history) < 60 {
		return nil, fmt.Errorf("insufficient historical data for %s", req.Symbol)
	}

	// Filter to requested date range
	var filtered []models.OHLCV
	for _, bar := range history {
		t := time.Unix(bar.Timestamp, 0)
		if !t.Before(startDate) && !t.After(endDate) {
			filtered = append(filtered, bar)
		}
	}
	if len(filtered) < 20 {
		return nil, fmt.Errorf("not enough data in date range for %s", req.Symbol)
	}

	// Build full close price series for HV calculations
	allCloses := make([]float64, len(history))
	for i, h := range history {
		allCloses[i] = h.Close
	}

	deltaTarget := req.DeltaTarget
	if deltaTarget == 0 {
		deltaTarget = 0.40
	}

	var trades []models.BacktestTrade
	equity := 100.0 // start with $100 normalized
	var equityCurve []models.EquityPoint

	equityCurve = append(equityCurve, models.EquityPoint{
		Date:  time.Unix(filtered[0].Timestamp, 0).Format("2006-01-02"),
		Value: math.Round(equity*100) / 100,
	})

	// Simulate trades at the requested cadence (default monthly)
	tradeInterval := 21
	switch req.Interval {
	case "weekly":
		tradeInterval = 5
	case "biweekly":
		tradeInterval = 10
	}
	i := 0
	for i < len(filtered)-5 {
		bar := filtered[i]
		entryDate := time.Unix(bar.Timestamp, 0)
		stockPrice := bar.Close

		// Find 30-day HV at this point
		hv := computeHVAtIndex(allCloses, history, bar.Timestamp)
		if hv <= 0 {
			hv = 0.25
		}

		// Synthetic option: ATM with 45 DTE target
		strike := math.Round(stockPrice/5) * 5 // round to nearest $5
		T := 45.0 / 365.0
		sigma := hv * 1.15 // use IV approximation

		var entryPrice float64
		if req.OptionType == "call" {
			entryPrice = bsmath.BSCall(stockPrice, strike, T, riskFreeRate, sigma)
		} else {
			entryPrice = bsmath.BSPut(stockPrice, strike, T, riskFreeRate, sigma)
		}

		if entryPrice < 0.01 {
			i += tradeInterval
			continue
		}

		// Simulate daily mark-to-market
		daysHeld := 0
		exitPrice := entryPrice
		exitReason := "expiry"
		exitBar := bar

		for j := i + 1; j < len(filtered) && daysHeld < 45; j++ {
			dBar := filtered[j]
			daysHeld = j - i
			remainingDTE := 45 - daysHeld
			if remainingDTE <= exitDTE {
				exitBar = dBar
				exitReason = "expiry"
				break
			}

			dStockPrice := dBar.Close
			dT := float64(remainingDTE) / 365.0
			dHV := computeHVAtIndex(allCloses, history, dBar.Timestamp)
			if dHV <= 0 {
				dHV = hv
			}
			dSigma := dHV * 1.15

			var currentPrice float64
			if req.OptionType == "call" {
				currentPrice = bsmath.BSCall(dStockPrice, strike, dT, riskFreeRate, dSigma)
			} else {
				currentPrice = bsmath.BSPut(dStockPrice, strike, dT, riskFreeRate, dSigma)
			}

			pnlPct := (currentPrice - entryPrice) / entryPrice
			if pnlPct >= profitTargetPct {
				exitPrice = currentPrice
				exitReason = "profit_target"
				exitBar = dBar
				break
			}
			if pnlPct <= -stopLossPct {
				exitPrice = currentPrice
				exitReason = "stop_loss"
				exitBar = dBar
				break
			}
		}

		if exitPrice == entryPrice && daysHeld > 0 {
			// Use last available price at 21 DTE
			exitIdx := i + daysHeld
			if exitIdx >= len(filtered) {
				exitIdx = len(filtered) - 1
			}
			exitBar = filtered[exitIdx]
			dStockPrice := exitBar.Close
			dT := 21.0 / 365.0
			dHV := computeHVAtIndex(allCloses, history, exitBar.Timestamp)
			if dHV <= 0 {
				dHV = hv
			}
			if req.OptionType == "call" {
				exitPrice = bsmath.BSCall(dStockPrice, strike, dT, riskFreeRate, dHV*1.15)
			} else {
				exitPrice = bsmath.BSPut(dStockPrice, strike, dT, riskFreeRate, dHV*1.15)
			}
		}

		pnlPct := (exitPrice - entryPrice) / entryPrice * 100
		winner := pnlPct > 0

		// Update equity curve: each trade risks 10% of equity
		riskAmt := equity * 0.10
		equityChange := riskAmt * pnlPct / 100
		equity += equityChange
		equity = math.Max(equity, 0)

		exitDate := time.Unix(exitBar.Timestamp, 0)
		trades = append(trades, models.BacktestTrade{
			EntryDate:         entryDate.Format("2006-01-02"),
			ExitDate:          exitDate.Format("2006-01-02"),
			Strike:            strike,
			Expiration:        entryDate.AddDate(0, 0, 45).Format("2006-01-02"),
			EntryPrice:        math.Round(entryPrice*100) / 100,
			ExitPrice:         math.Round(exitPrice*100) / 100,
			PnLPct:            math.Round(pnlPct*100) / 100,
			DaysHeld:          daysHeld,
			Winner:            winner,
			ExitReason:        exitReason,
			EntryDTE:          45,
			StockPriceAtEntry: math.Round(stockPrice*100) / 100,
			StockPriceAtExit:  math.Round(exitBar.Close*100) / 100,
		})

		equityCurve = append(equityCurve, models.EquityPoint{
			Date:  exitDate.Format("2006-01-02"),
			Value: math.Round(equity*100) / 100,
		})

		i += tradeInterval
	}

	return summarize(req, trades, equityCurve), nil
}

// computeHVAtIndex finds HV using 30 days of closes prior to the given timestamp
func computeHVAtIndex(allCloses []float64, history []models.OHLCV, ts int64) float64 {
	idx := -1
	for i, h := range history {
		if h.Timestamp == ts {
			idx = i
			break
		}
	}
	if idx < 30 {
		return 0.25
	}
	window := allCloses[idx-30 : idx+1]
	return bsmath.HistoricalVolatility(window)
}

func summarize(req models.BacktestRequest, trades []models.BacktestTrade, equityCurve []models.EquityPoint) *models.BacktestResult {
	if len(trades) == 0 {
		return &models.BacktestResult{
			Symbol:      req.Symbol,
			OptionType:  req.OptionType,
			StartDate:   req.StartDate,
			EndDate:     req.EndDate,
			Trades:      trades,
			EquityCurve: equityCurve,
		}
	}

	wins := 0
	totalWinPct := 0.0
	totalLossPct := 0.0
	totalPnl := 0.0
	maxConsec := 0
	curConsec := 0
	totalGross := 0.0
	totalLoss := 0.0

	for _, t := range trades {
		totalPnl += t.PnLPct
		if t.Winner {
			wins++
			totalWinPct += t.PnLPct
			totalGross += t.PnLPct
			curConsec = 0
		} else {
			totalLossPct += t.PnLPct
			totalLoss += math.Abs(t.PnLPct)
			curConsec++
			if curConsec > maxConsec {
				maxConsec = curConsec
			}
		}
	}

	n := len(trades)
	winRate := float64(wins) / float64(n) * 100
	avgWin := 0.0
	if wins > 0 {
		avgWin = totalWinPct / float64(wins)
	}
	avgLoss := 0.0
	losers := n - wins
	if losers > 0 {
		avgLoss = totalLossPct / float64(losers)
	}
	profitFactor := 0.0
	if totalLoss > 0 {
		profitFactor = math.Round(totalGross/totalLoss*100) / 100
	}

	startEquity := 100.0
	endEquity := startEquity
	if len(equityCurve) > 0 {
		endEquity = equityCurve[len(equityCurve)-1].Value
	}
	totalReturn := (endEquity - startEquity) / startEquity * 100

	return &models.BacktestResult{
		Symbol:          req.Symbol,
		OptionType:      req.OptionType,
		StartDate:       req.StartDate,
		EndDate:         req.EndDate,
		Trades:          trades,
		EquityCurve:     equityCurve,
		TotalReturn:     math.Round(totalReturn*100) / 100,
		WinRate:         math.Round(winRate*100) / 100,
		AvgWinPct:       math.Round(avgWin*100) / 100,
		AvgLossPct:      math.Round(avgLoss*100) / 100,
		MaxConsecLosses: maxConsec,
		TotalTrades:     n,
		ProfitFactor:    profitFactor,
	}
}
