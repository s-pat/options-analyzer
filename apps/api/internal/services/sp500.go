// Package services contains the core business-logic layer of Options Lab.
// Each service is responsible for a specific domain:
//
//   - SP500Service  : fetches and caches stock data, computes technical indicators
//   - OptionsService: enriches options chains with Greeks, fair values, feasibility
//   - TodayService  : scans the liquid universe and returns top picks by cost band
//   - BacktestService: simulates long call/put strategies over historical data
//   - AnalyzeOption  : produces a full human-readable thesis for a single contract
//
// All services share a Yahoo Finance client for market data (see package yahoo).
package services

import (
	"fmt"
	"log"
	"sync"
	"time"

	bsmath "github.com/sohanpatel/options-analyzer/api/internal/math"
	"github.com/sohanpatel/options-analyzer/api/internal/models"
	"github.com/sohanpatel/options-analyzer/api/internal/yahoo"
)

// SP500Symbols is a curated list of ~60 liquid S&P 500 constituents covering all
// 11 GICS sectors. These symbols were selected for high options liquidity (tight
// spreads, deep open interest) and broad sector representation.
var SP500Symbols = []struct {
	Symbol string
	Name   string
	Sector string
}{
	// Technology
	{"AAPL", "Apple Inc.", "Technology"},
	{"MSFT", "Microsoft Corp.", "Technology"},
	{"NVDA", "NVIDIA Corp.", "Technology"},
	{"GOOGL", "Alphabet Inc.", "Technology"},
	{"META", "Meta Platforms", "Technology"},
	{"AVGO", "Broadcom Inc.", "Technology"},
	{"AMD", "Advanced Micro Devices", "Technology"},
	{"ORCL", "Oracle Corp.", "Technology"},
	{"CRM", "Salesforce Inc.", "Technology"},
	{"ADBE", "Adobe Inc.", "Technology"},
	// Healthcare
	{"UNH", "UnitedHealth Group", "Healthcare"},
	{"JNJ", "Johnson & Johnson", "Healthcare"},
	{"LLY", "Eli Lilly & Co.", "Healthcare"},
	{"ABBV", "AbbVie Inc.", "Healthcare"},
	{"MRK", "Merck & Co.", "Healthcare"},
	{"TMO", "Thermo Fisher Scientific", "Healthcare"},
	{"ABT", "Abbott Laboratories", "Healthcare"},
	{"PFE", "Pfizer Inc.", "Healthcare"},
	// Financials
	{"BRK-B", "Berkshire Hathaway", "Financials"},
	{"JPM", "JPMorgan Chase", "Financials"},
	{"V", "Visa Inc.", "Financials"},
	{"MA", "Mastercard Inc.", "Financials"},
	{"BAC", "Bank of America", "Financials"},
	{"WFC", "Wells Fargo", "Financials"},
	{"GS", "Goldman Sachs", "Financials"},
	{"MS", "Morgan Stanley", "Financials"},
	// Consumer Discretionary
	{"AMZN", "Amazon.com Inc.", "Consumer Discretionary"},
	{"TSLA", "Tesla Inc.", "Consumer Discretionary"},
	{"HD", "Home Depot", "Consumer Discretionary"},
	{"MCD", "McDonald's Corp.", "Consumer Discretionary"},
	{"NKE", "Nike Inc.", "Consumer Discretionary"},
	{"SBUX", "Starbucks Corp.", "Consumer Discretionary"},
	// Consumer Staples
	{"WMT", "Walmart Inc.", "Consumer Staples"},
	{"PG", "Procter & Gamble", "Consumer Staples"},
	{"KO", "Coca-Cola Co.", "Consumer Staples"},
	{"PEP", "PepsiCo Inc.", "Consumer Staples"},
	{"COST", "Costco Wholesale", "Consumer Staples"},
	// Energy
	{"XOM", "Exxon Mobil Corp.", "Energy"},
	{"CVX", "Chevron Corp.", "Energy"},
	{"COP", "ConocoPhillips", "Energy"},
	{"SLB", "SLB (Schlumberger)", "Energy"},
	// Industrials
	{"CAT", "Caterpillar Inc.", "Industrials"},
	{"UPS", "United Parcel Service", "Industrials"},
	{"HON", "Honeywell International", "Industrials"},
	{"BA", "Boeing Co.", "Industrials"},
	{"GE", "GE Aerospace", "Industrials"},
	{"RTX", "RTX Corp.", "Industrials"},
	// Communication Services
	{"NFLX", "Netflix Inc.", "Communication Services"},
	{"DIS", "Walt Disney Co.", "Communication Services"},
	{"T", "AT&T Inc.", "Communication Services"},
	{"VZ", "Verizon Communications", "Communication Services"},
	// Utilities
	{"NEE", "NextEra Energy", "Utilities"},
	{"SO", "Southern Co.", "Utilities"},
	{"DUK", "Duke Energy Corp.", "Utilities"},
	// Real Estate
	{"AMT", "American Tower Corp.", "Real Estate"},
	{"PLD", "Prologis Inc.", "Real Estate"},
	{"EQIX", "Equinix Inc.", "Real Estate"},
	// Materials
	{"LIN", "Linde PLC", "Materials"},
	{"APD", "Air Products & Chemicals", "Materials"},
	{"SHW", "Sherwin-Williams", "Materials"},
}

// SP500Service fetches and enriches market data for S&P 500 stocks.
// Each stock is augmented with:
//   - 30-day Historical Volatility (HV30)
//   - EMA-20 and EMA-50 (trend indicators)
//   - 14-period RSI (momentum)
//   - IV approximation (HV × 1.15) plus a rolling IV Rank and IV Percentile
//
// Results are cached in-memory with a 5-minute TTL to avoid redundant fetches.
type SP500Service struct {
	client *yahoo.Client
	cache  map[string]*models.Stock
	mu     sync.RWMutex
}

// NewSP500Service creates a new SP500 service
func NewSP500Service(client *yahoo.Client) *SP500Service {
	return &SP500Service{
		client: client,
		cache:  make(map[string]*models.Stock),
	}
}

// GetAllStocks fetches and enriches data for all S&P 500 symbols concurrently (max 5 goroutines)
func (s *SP500Service) GetAllStocks() ([]*models.Stock, error) {
	sem := make(chan struct{}, 5)
	var wg sync.WaitGroup
	results := make([]*models.Stock, len(SP500Symbols))
	var mu sync.Mutex
	var firstErr error

	for i, sym := range SP500Symbols {
		wg.Add(1)
		go func(idx int, symbol, name, sector string) {
			defer wg.Done()
			sem <- struct{}{}
			defer func() { <-sem }()

			stock, err := s.GetStock(symbol)
			if err != nil {
				log.Printf("warn: failed to fetch %s: %v", symbol, err)
				mu.Lock()
				if firstErr == nil {
					firstErr = err
				}
				mu.Unlock()
				return
			}
			stock.Name = name
			stock.Sector = sector
			results[idx] = stock
		}(i, sym.Symbol, sym.Name, sym.Sector)
	}
	wg.Wait()

	// Filter out nils
	var stocks []*models.Stock
	for _, st := range results {
		if st != nil {
			stocks = append(stocks, st)
		}
	}
	return stocks, nil
}

// GetStock fetches a single stock with full technical indicators
func (s *SP500Service) GetStock(symbol string) (*models.Stock, error) {
	// Check cache
	s.mu.RLock()
	if cached, ok := s.cache[symbol]; ok {
		if time.Since(cached.UpdatedAt) < 5*time.Minute {
			s.mu.RUnlock()
			return cached, nil
		}
	}
	s.mu.RUnlock()

	// Fetch 2-year history for full indicator computation
	history, err := s.client.GetHistory(symbol, "2y")
	if err != nil {
		return nil, fmt.Errorf("history fetch for %s: %w", symbol, err)
	}
	if len(history) < 30 {
		return nil, fmt.Errorf("insufficient history for %s", symbol)
	}

	closes := make([]float64, len(history))
	for i, h := range history {
		closes[i] = h.Close
	}

	// Current price
	price := closes[len(closes)-1]
	prevClose := closes[len(closes)-2]
	change := price - prevClose
	changePct := change / prevClose * 100

	// Volume from latest bar
	volume := history[len(history)-1].Volume

	// Indicators
	hv30 := bsmath.HistoricalVolatility(closes)
	ema20 := bsmath.EMA(closes, 20)
	ema50 := bsmath.EMA(closes, 50)
	rsi := bsmath.RSI(closes)

	// IV approximation from HV (scale slightly)
	iv := hv30 * 1.15

	// IV history: rolling 30-day HV over past year
	ivHistory := computeIVHistory(closes, 252)
	ivRank := bsmath.IVRank(iv, ivHistory)
	ivPct := bsmath.IVPercentile(iv, ivHistory)

	stock := &models.Stock{
		Symbol:        symbol,
		Price:         price,
		Change:        change,
		ChangePercent: changePct,
		Volume:        volume,
		HV30:          hv30 * 100,
		IV:            iv * 100,
		IVRank:        ivRank,
		IVPercentile:  ivPct,
		EMA20:         ema20,
		EMA50:         ema50,
		RSI:           rsi,
		UpdatedAt:     time.Now(),
	}

	// Update cache
	s.mu.Lock()
	s.cache[symbol] = stock
	s.mu.Unlock()

	return stock, nil
}

// computeIVHistory builds a time-series of rolling 30-day IV approximations by
// sliding a 31-bar window across the last N trading days of close prices.
// Each data point represents IV = HV30 × 1.15 at that moment in time.
// This series is used to compute IV Rank and IV Percentile for the current level.
func computeIVHistory(closes []float64, days int) []float64 {
	if len(closes) < 31+days {
		days = len(closes) - 31
	}
	if days <= 0 {
		return nil
	}
	ivs := make([]float64, days)
	for i := 0; i < days; i++ {
		start := len(closes) - days - 30 + i
		end := start + 31
		if start < 0 || end > len(closes) {
			continue
		}
		ivs[i] = bsmath.HistoricalVolatility(closes[start:end]) * 1.15
	}
	return ivs
}
