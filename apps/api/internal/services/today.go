// today.go — Today's Picks engine.
//
// GetOpportunities scans a universe of ~30 highly-liquid stocks and ETFs,
// scores every feasible option contract using a 4-component algorithm,
// and returns the top 8 picks per cost band:
//
//	Band         Contract cost (ask × 100)
//	──────────────────────────────────────
//	$0 – $100    Entry-level / deep OTM lottery tickets
//	$100 – $500  Retail-friendly near-ATM options
//	$500 – $1,500 Standard liquid single-leg trades
//	$1,500+      High-conviction / ITM positions
//
// Scoring algorithm (same weights as the main options engine):
//
//	IV Score    30% — low IV Rank → historically cheap premium
//	Tech Score  30% — EMA20 vs EMA50 trend + RSI range check
//	Liquidity   20% — open interest ≥ 500 and bid-ask spread < 5%
//	R/R Score   20% — theoretical edge = (BS fair value − ask) / ask × 100
//
// Candidates are fetched concurrently with a semaphore (max 4 goroutines).
// Contracts with DTE < 1 or DTE > 180 are excluded.
// Duplicate (symbol, type, strike, expiry) combinations keep the highest score.
package services

import (
	"fmt"
	"math"
	"sort"
	"sync"
	"time"

	"github.com/sohanpatel/options-analyzer/api/internal/models"
)

// todaySymbols is the liquid universe we scan for Today's Picks
var todaySymbols = []string{
	"AAPL", "MSFT", "NVDA", "TSLA", "AMZN", "META", "GOOGL", "AMD", "NFLX", "AVGO",
	"SPY", "QQQ", "IWM",                              // broad ETFs
	"JPM", "BAC", "GS", "V", "MA",                   // financials
	"XOM", "CVX",                                     // energy
	"UNH", "LLY", "ABBV",                             // healthcare
	"HD", "COST", "WMT",                              // consumer
	"CRM", "ORCL", "ADBE",                            // software
}

// cost band definitions (cost = ask * 100)
var costBands = []struct {
	id    string
	label string
	min   float64
	max   float64
}{
	{"0-100", "$0 – $100 / contract", 0, 100},
	{"100-500", "$100 – $500 / contract", 100, 500},
	{"500-1500", "$500 – $1,500 / contract", 500, 1500},
	{"1500+", "$1,500+ / contract", 1500, math.MaxFloat64},
}

// TodayService builds the Today's Picks list
type TodayService struct {
	optSvc *OptionsService
	sp500  *SP500Service
}

// NewTodayService creates a TodayService
func NewTodayService(optSvc *OptionsService, sp500 *SP500Service) *TodayService {
	return &TodayService{optSvc: optSvc, sp500: sp500}
}

// GetOpportunities scans the liquid universe and returns top picks per cost band.
func (t *TodayService) GetOpportunities() (*models.TodayOpportunities, error) {
	var mu sync.Mutex
	var allPicks []models.TodayOption
	var wg sync.WaitGroup
	sem := make(chan struct{}, 4) // max 4 concurrent fetches

	for _, sym := range todaySymbols {
		wg.Add(1)
		go func(symbol string) {
			defer wg.Done()
			sem <- struct{}{}
			defer func() { <-sem }()

			picks, err := t.picksForSymbol(symbol)
			if err != nil {
				return
			}
			mu.Lock()
			allPicks = append(allPicks, picks...)
			mu.Unlock()
		}(sym)
	}
	wg.Wait()

	// Bucket by cost band, keep top 8 per band sorted by score
	bands := make([]models.TodayBand, len(costBands))
	for i, cb := range costBands {
		var inBand []models.TodayOption
		for _, p := range allPicks {
			if p.ContractCost >= cb.min && p.ContractCost < cb.max {
				inBand = append(inBand, p)
			}
		}
		sort.Slice(inBand, func(a, b int) bool {
			return inBand[a].Score > inBand[b].Score
		})
		if len(inBand) > 8 {
			inBand = inBand[:8]
		}
		bands[i] = models.TodayBand{
			Band:  cb.id,
			Label: cb.label,
			Max:   cb.max,
			Picks: inBand,
		}
	}

	return &models.TodayOpportunities{
		GeneratedAt: time.Now(),
		Bands:       bands,
	}, nil
}

// picksForSymbol scores all feasible options for a symbol and returns good candidates
func (t *TodayService) picksForSymbol(symbol string) ([]models.TodayOption, error) {
	stock, err := t.sp500.GetStock(symbol)
	if err != nil {
		return nil, err
	}
	chain, err := t.optSvc.GetOptionsChain(symbol)
	if err != nil {
		return nil, err
	}

	name := stock.Name
	for _, s := range SP500Symbols {
		if s.Symbol == symbol {
			name = s.Name
			break
		}
	}

	var picks []models.TodayOption

	addPicks := func(contracts []models.OptionContract, optType string) {
		for _, c := range contracts {
			if !c.IsFeasible {
				continue
			}
			// Skip 0-DTE (too speculative for this list) and > 180 DTE
			if c.DTE < 1 || c.DTE > 180 {
				continue
			}
			score, verdict, rationale := scoreTodayOption(c, stock, optType)
			if score < 40 {
				continue
			}
			horizon := horizonLabel(c.DTE)
			picks = append(picks, models.TodayOption{
				OptionContract: c,
				StockSymbol:    symbol,
				StockName:      name,
				StockPrice:     stock.Price,
				Score:          math.Round(score*10) / 10,
				Verdict:        verdict,
				CostBand:       costBandFor(c.ContractCost),
				Rationale:      rationale,
				Horizon:        horizon,
			})
		}
	}

	addPicks(chain.Calls, "call")
	addPicks(chain.Puts, "put")

	// Deduplicate: keep best score per (symbol, type, strike, expiry)
	return dedup(picks), nil
}

func scoreTodayOption(c models.OptionContract, stock *models.Stock, optType string) (float64, string, string) {
	// Re-use the same 4-component scoring from the main scoring engine
	ivScore := 0.0
	switch {
	case stock.IVRank <= 20:
		ivScore = 100
	case stock.IVRank <= 35:
		ivScore = 85
	case stock.IVRank <= 50:
		ivScore = 60
	case stock.IVRank <= 70:
		ivScore = 35
	default:
		ivScore = 10
	}

	techScore := 0.0
	if optType == "call" {
		if stock.EMA20 > stock.EMA50 {
			techScore += 60
		}
		if stock.RSI >= 38 && stock.RSI <= 65 {
			techScore += 40
		}
	} else {
		if stock.EMA20 < stock.EMA50 {
			techScore += 60
		}
		if stock.RSI >= 38 && stock.RSI <= 65 {
			techScore += 40
		}
	}

	liqScore := 0.0
	if c.OpenInterest >= 500 {
		liqScore += 60
	} else if c.OpenInterest >= 100 {
		liqScore += 30
	}
	if c.SpreadPct < 5 {
		liqScore += 40
	} else if c.SpreadPct < 10 {
		liqScore += 20
	}

	rrScore := 0.0
	if c.Ask > 0 && c.BSFairValue > 0 {
		edge := (c.BSFairValue - c.Ask) / c.Ask * 100
		switch {
		case edge >= 15:
			rrScore = 100
		case edge >= 5:
			rrScore = 70
		case edge >= 0:
			rrScore = 40
		default:
			rrScore = 10
		}
	}

	total := ivScore*0.30 + techScore*0.30 + liqScore*0.20 + rrScore*0.20

	// Verdict
	verdict := "Pass"
	switch {
	case total >= 75:
		verdict = "Strong Buy"
	case total >= 62:
		verdict = "Buy"
	case total >= 48:
		verdict = "Speculative"
	}

	// Rationale
	trend := "neutral"
	if stock.EMA20 > stock.EMA50 {
		trend = "↑ bullish"
	} else if stock.EMA20 < stock.EMA50 {
		trend = "↓ bearish"
	}
	rationale := fmt.Sprintf("IV rank %.0f%%, trend %s, RSI %.0f, %d DTE, $%.0f/contract",
		stock.IVRank, trend, stock.RSI, c.DTE, c.ContractCost)

	return total, verdict, rationale
}

func horizonLabel(dte int) string {
	switch {
	case dte <= 1:
		return "same-day"
	case dte <= 5:
		return "next-day"
	default:
		return "swing"
	}
}

func costBandFor(cost float64) string {
	switch {
	case cost < 100:
		return "$0–100"
	case cost < 500:
		return "$100–500"
	case cost < 1500:
		return "$500–1500"
	default:
		return "$1500+"
	}
}

func dedup(picks []models.TodayOption) []models.TodayOption {
	seen := map[string]int{} // key → index in out
	var out []models.TodayOption
	for _, p := range picks {
		key := fmt.Sprintf("%s|%s|%.0f|%d", p.StockSymbol, p.OptionType, p.Strike, p.Expiration)
		if idx, exists := seen[key]; exists {
			if p.Score > out[idx].Score {
				out[idx] = p
			}
		} else {
			seen[key] = len(out)
			out = append(out, p)
		}
	}
	return out
}
