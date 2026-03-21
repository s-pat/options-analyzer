package services

import (
	"fmt"
	"math"
	"sort"
	"sync"
	"time"

	"github.com/sohanpatel/options-analyzer/api/internal/datasource"
	bsmath "github.com/sohanpatel/options-analyzer/api/internal/math"
	"github.com/sohanpatel/options-analyzer/api/internal/models"
	"github.com/sohanpatel/options-analyzer/api/internal/yahoo"
)

const (
	// riskFreeRate is the annualised risk-free interest rate used in all Black-Scholes
	// calculations. This approximates the current US Treasury yield.
	riskFreeRate = 0.05 // 5% risk-free rate
)

// OptionsService is the primary domain service for options data and scoring.
//
// Responsibilities:
//   - Fetching and merging multi-expiry options chains via the datasource router
//     (Tradier primary, Yahoo Finance fallback)
//   - Enriching each contract with Black-Scholes Greeks, fair value, and feasibility flags
//   - Classifying contracts into Weekly / Monthly / Quarterly / LEAPS categories
//   - Scoring and recommending the best long call/put candidates
//   - Providing a filtered chain view based on capital budget and risk level
//   - Delegating single-option deep analysis to the AnalyzeOption function
//
// The chain-fetching strategy selects a representative sample of expirations
// across all four categories to avoid fetching hundreds of redundant expiries:
//
//	Weekly    → 3 nearest  (short-term momentum plays)
//	Monthly   → 4 nearest  (standard retail-friendly expirations)
//	Quarterly → 2 nearest  (hedging / longer directional positions)
//	LEAPS     → 2 nearest  (long-dated, high-capital positions)
//
// When live data is unavailable the service transparently falls back to a
// synthetic Black-Scholes priced chain (see package yahoo/synthetic.go).
type OptionsService struct {
	router *datasource.Router
	sp500  *SP500Service

	// cached recommendations — refreshed lazily, TTL 5 min
	recsMu    sync.RWMutex
	recsCache []models.OptionRecommendation
	recsAt    time.Time
}

// NewOptionsService creates a new OptionsService
func NewOptionsService(router *datasource.Router, sp500 *SP500Service) *OptionsService {
	return &OptionsService{
		router: router,
		sp500:  sp500,
	}
}

// GetOptionsChain fetches all expiry categories (weekly / monthly / quarterly / LEAPS),
// tags each contract, enriches Greeks, and applies feasibility flags.
// Uses the datasource router (Tradier primary, Yahoo Finance fallback).
// Falls back to a synthetic BS-priced chain when all live sources are unavailable.
func (s *OptionsService) GetOptionsChain(symbol string) (*models.OptionsChain, error) {
	stock, err := s.sp500.GetStock(symbol)
	if err != nil {
		return nil, fmt.Errorf("stock fetch: %w", err)
	}
	hv := stock.HV30 / 100.0

	// Get the full expiration list. Yahoo Finance is the authoritative source
	// for the complete list of available expiration dates.
	raw0, rawErr := s.router.GetOptionsChainYahoo(symbol, 0)
	if rawErr != nil {
		chain := yahoo.SyntheticOptionsChain(symbol, stock.Price, hv, riskFreeRate)
		s.enrichAndTag(chain, stock.Price, hv)
		return chain, nil
	}

	var allExpirations []int64
	if len(raw0.OptionChain.Result) > 0 {
		allExpirations = raw0.OptionChain.Result[0].ExpirationDates
	}
	if len(allExpirations) == 0 {
		chain := yahoo.SyntheticOptionsChain(symbol, stock.Price, hv, riskFreeRate)
		s.enrichAndTag(chain, stock.Price, hv)
		return chain, nil
	}

	now := time.Now()
	byCategory := selectExpiriesByCategory(allExpirations, now)

	merged := &models.OptionsChain{
		Symbol:      symbol,
		Expirations: allExpirations,
		UpdatedAt:   now,
	}

	// Track which data source served the majority of contracts
	sourceCounts := map[string]int{}
	gotAny := false

	// Fetch in category order so the chain is naturally sorted by DTE
	for _, cat := range []string{
		models.ExpiryWeekly, models.ExpiryMonthly, models.ExpiryQuarterly, models.ExpiryLEAPS,
	} {
		for _, exp := range byCategory[cat] {
			parsed, fetchErr := s.router.GetOptionsForExpiry(symbol, exp)
			if fetchErr != nil {
				continue
			}
			// Tag every contract with its category
			expTime := time.Unix(exp, 0)
			dte := int(expTime.Sub(now).Hours() / 24)
			expCat := ClassifyExpiry(expTime, dte)
			for i := range parsed.Calls {
				parsed.Calls[i].ExpiryCategory = expCat
			}
			for i := range parsed.Puts {
				parsed.Puts[i].ExpiryCategory = expCat
			}
			merged.Calls = append(merged.Calls, parsed.Calls...)
			merged.Puts = append(merged.Puts, parsed.Puts...)
			if len(parsed.Calls) > 0 || len(parsed.Puts) > 0 {
				gotAny = true
				sourceCounts[parsed.DataSource] += len(parsed.Calls) + len(parsed.Puts)
			}
		}
	}

	if !gotAny {
		chain := yahoo.SyntheticOptionsChain(symbol, stock.Price, hv, riskFreeRate)
		s.enrichAndTag(chain, stock.Price, hv)
		return chain, nil
	}

	// Attribute the chain to whichever source served the most contracts
	merged.DataSource = dominantSource(sourceCounts)

	s.enrichAndTag(merged, stock.Price, hv)
	return merged, nil
}

// dominantSource returns the source key with the highest count.
func dominantSource(counts map[string]int) string {
	best, max := "", 0
	for src, n := range counts {
		if n > max {
			best, max = src, n
		}
	}
	return best
}

// GetFilteredChain returns an options chain with contracts filtered by capital and risk level.
func (s *OptionsService) GetFilteredChain(symbol string, f models.OptionsFilter) (*models.OptionsChain, error) {
	chain, err := s.GetOptionsChain(symbol)
	if err != nil {
		return nil, err
	}

	filterContracts := func(contracts []models.OptionContract) []models.OptionContract {
		var out []models.OptionContract
		for _, c := range contracts {
			// Hard structural filters: exclude zero-OI, negative-ask, and
			// completely unquoted contracts (bid=0 AND ask=0 — no market).
			if c.OpenInterest < 10 || c.Ask < 0 {
				continue
			}
			if c.Bid <= 0 && c.Ask <= 0 {
				continue
			}
			// Capital filter: use contractCost when ask>0, otherwise fall back to BS fair value × 100
			cost := c.ContractCost
			if cost <= 0 && c.BSFairValue > 0 {
				cost = math.Round(c.BSFairValue*100*100) / 100
			}
			if f.MaxCapital > 0 && cost > f.MaxCapital {
				continue
			}
			if f.RiskLevel > 0 && !passesRiskFilter(c, f.RiskLevel) {
				continue
			}
			out = append(out, c)
		}
		return out
	}

	if !f.OnlyPut {
		chain.Calls = filterContracts(chain.Calls)
	} else {
		chain.Calls = nil
	}
	if !f.OnlyCall {
		chain.Puts = filterContracts(chain.Puts)
	} else {
		chain.Puts = nil
	}
	return chain, nil
}

// passesRiskFilter applies DTE/delta/OI thresholds based on risk level.
// Spread check is skipped when ask=0 (after market hours) to avoid filtering out valid contracts.
func passesRiskFilter(c models.OptionContract, level int) bool {
	absDelta := math.Abs(c.Delta)
	hasLiveSpread := c.Ask > 0 // spread is only meaningful when market is open
	switch level {
	case 1: // conservative: 30-60 DTE, 0.40-0.55 delta, OI ≥ 500, spread < 6%
		spreadOK := !hasLiveSpread || c.SpreadPct < 6
		return c.DTE >= 30 && c.DTE <= 60 && absDelta >= 0.40 && absDelta <= 0.55 &&
			c.OpenInterest >= 500 && spreadOK
	case 2: // moderate: 21-90 DTE, 0.30-0.60 delta, OI ≥ 200, spread < 12%
		spreadOK := !hasLiveSpread || c.SpreadPct < 12
		return c.DTE >= 21 && c.DTE <= 90 && absDelta >= 0.30 && absDelta <= 0.60 &&
			c.OpenInterest >= 200 && spreadOK
	case 3: // aggressive: 7-180 DTE, any delta, OI ≥ 50, spread < 20%
		spreadOK := !hasLiveSpread || c.SpreadPct < 20
		return c.DTE >= 7 && c.DTE <= 180 && c.OpenInterest >= 50 && spreadOK
	}
	return true
}

// AnalyzeOption returns a full recommendation and thesis for a specific option contract
func (s *OptionsService) AnalyzeOption(symbol string, optType string, strike float64, expiration int64) (*models.OptionAnalysis, error) {
	stock, err := s.sp500.GetStock(symbol)
	if err != nil {
		return nil, fmt.Errorf("stock fetch: %w", err)
	}

	chain, err := s.GetOptionsChain(symbol)
	if err != nil {
		return nil, fmt.Errorf("chain fetch: %w", err)
	}

	// Find the matching contract
	candidates := chain.Calls
	if optType == "put" {
		candidates = chain.Puts
	}
	var best *models.OptionContract
	bestDiff := math.MaxFloat64
	for i := range candidates {
		c := &candidates[i]
		diff := math.Abs(c.Strike-strike) + math.Abs(float64(c.Expiration-expiration))/86400
		if diff < bestDiff {
			bestDiff = diff
			best = c
		}
	}
	if best == nil {
		return nil, fmt.Errorf("no matching contract found for %s %s $%.0f", symbol, optType, strike)
	}

	return AnalyzeOption(*best, stock), nil
}

// enrichAndTag computes Greeks, BS fair value, contract cost, feasibility, and expiry category
// for every contract in the chain.
func (s *OptionsService) enrichAndTag(chain *models.OptionsChain, stockPrice, hv float64) {
	now := time.Now()
	enrichContract := func(c *models.OptionContract, optType string) {
		expTime := time.Unix(c.Expiration, 0)
		dte := int(expTime.Sub(now).Hours() / 24)
		T := float64(dte) / 365.0
		if T <= 0 {
			return
		}
		sigma := c.ImpliedVolatility
		if sigma <= 0 || sigma > 5 {
			sigma = hv
		}
		greeks := bsmath.BSGreeks(stockPrice, c.Strike, T, riskFreeRate, sigma, optType)
		c.Delta = greeks.Delta
		c.Gamma = greeks.Gamma
		c.Theta = greeks.Theta
		c.Vega = greeks.Vega
		if optType == "call" {
			c.BSFairValue = bsmath.BSCall(stockPrice, c.Strike, T, riskFreeRate, sigma)
		} else {
			c.BSFairValue = bsmath.BSPut(stockPrice, c.Strike, T, riskFreeRate, sigma)
		}
		// Cost and feasibility
		c.ContractCost = math.Round(c.Ask*100*100) / 100
		ok, note := isFeasible(c.Ask, c.OpenInterest, c.SpreadPct, dte)
		c.IsFeasible = ok
		c.FeasibilityNote = note
		// Expiry category (fill in if not already set by fetcher)
		if c.ExpiryCategory == "" {
			c.ExpiryCategory = ClassifyExpiry(expTime, dte)
		}
	}
	for i := range chain.Calls {
		enrichContract(&chain.Calls[i], "call")
	}
	for i := range chain.Puts {
		enrichContract(&chain.Puts[i], "put")
	}
}

// GetRecommendations scans a focused list of liquid S&P 500 stocks and returns
// the top-N long call and put recommendations sorted by composite score.
//
// Only contracts meeting strict criteria are considered:
//   - DTE 30–60 (the "sweet spot" — enough time, not too expensive)
//   - Delta 0.35–0.50 (near-ATM, high probability, manageable premium)
//   - Score ≥ 50/100
//
// See scoreOption for the 4-component composite scoring formula.
const recsTTL = 5 * time.Minute

func (s *OptionsService) GetRecommendations(limit int) ([]models.OptionRecommendation, error) {
	// Serve from cache when fresh — avoids re-running the expensive scan on
	// every login. First cold-start after a deploy will populate the cache;
	// all subsequent calls within the TTL return instantly.
	s.recsMu.RLock()
	if s.recsCache != nil && time.Since(s.recsAt) < recsTTL {
		out := s.recsCache
		s.recsMu.RUnlock()
		if limit > 0 && len(out) > limit {
			return out[:limit], nil
		}
		return out, nil
	}
	s.recsMu.RUnlock()

	// Scan liquid stocks in parallel (max 4 concurrent) — same pattern as TodayService.
	candidates := []string{"AAPL", "MSFT", "NVDA", "GOOGL", "AMZN", "META", "TSLA", "JPM", "V", "UNH",
		"HD", "MA", "AVGO", "LLY", "XOM", "JNJ", "PG", "BAC", "MRK", "ABBV"}

	var mu sync.Mutex
	var allRecs []models.OptionRecommendation
	var wg sync.WaitGroup
	sem := make(chan struct{}, 4)

	for _, sym := range candidates {
		wg.Add(1)
		go func(symbol string) {
			defer wg.Done()
			sem <- struct{}{}
			defer func() { <-sem }()

			recs, err := s.scoreOptionsForSymbol(symbol)
			if err != nil {
				return
			}
			mu.Lock()
			allRecs = append(allRecs, recs...)
			mu.Unlock()
		}(sym)
	}
	wg.Wait()

	// Sort by score descending
	sort.Slice(allRecs, func(i, j int) bool {
		return allRecs[i].Score > allRecs[j].Score
	})

	// Cache the full sorted list; callers slice it to their limit
	s.recsMu.Lock()
	s.recsCache = allRecs
	s.recsAt = time.Now()
	s.recsMu.Unlock()

	if limit > 0 && len(allRecs) > limit {
		allRecs = allRecs[:limit]
	}
	return allRecs, nil
}

// scoreOptionsForSymbol scores all options for a symbol and returns high-scoring ones
func (s *OptionsService) scoreOptionsForSymbol(symbol string) ([]models.OptionRecommendation, error) {
	stock, err := s.sp500.GetStock(symbol)
	if err != nil {
		return nil, err
	}

	chain, err := s.GetOptionsChain(symbol)
	if err != nil {
		return nil, err
	}

	var recs []models.OptionRecommendation

	// Score calls
	for _, c := range chain.Calls {
		if c.DTE < 30 || c.DTE > 60 {
			continue
		}
		if c.Delta < 0.35 || c.Delta > 0.50 {
			continue
		}
		rec := s.scoreOption(c, stock, "call")
		if rec.Score >= 50 {
			recs = append(recs, rec)
		}
	}

	// Score puts
	for _, p := range chain.Puts {
		if p.DTE < 30 || p.DTE > 60 {
			continue
		}
		delta := math.Abs(p.Delta)
		if delta < 0.35 || delta > 0.50 {
			continue
		}
		rec := s.scoreOption(p, stock, "put")
		if rec.Score >= 50 {
			recs = append(recs, rec)
		}
	}

	return recs, nil
}

// scoreOption computes a composite 0–100 score for a long option opportunity.
//
// The score has four equally-weighted components:
//
//	Component        Weight  What it measures
//	──────────────────────────────────────────────────────────────────
//	IV Score           30%   Low IV Rank → cheap premium (best for buyers)
//	Tech Score         30%   EMA crossover (trend) + RSI (momentum)
//	Liquidity Score    20%   Open interest + bid-ask spread quality
//	Risk/Reward Score  20%   Theoretical edge = (BS fair value − ask) / ask × 100
//
// Interpretation:
//   - ≥ 75 : Strong Buy
//   - ≥ 62 : Buy
//   - ≥ 48 : Speculative
//   - < 48 : Pass
func (s *OptionsService) scoreOption(opt models.OptionContract, stock *models.Stock, optType string) models.OptionRecommendation {
	// IV Score (30%): low IV rank = good for long options (cheap)
	ivScore := 0.0
	if stock.IVRank <= 30 {
		ivScore = 100
	} else if stock.IVRank <= 50 {
		ivScore = 70
	} else if stock.IVRank <= 70 {
		ivScore = 40
	} else {
		ivScore = 10
	}

	// Tech Score (30%): trend alignment + RSI filter
	techScore := 0.0
	if optType == "call" {
		if stock.EMA20 > stock.EMA50 {
			techScore += 60
		}
		// RSI: prefer 40-65 for calls (not overbought, some momentum)
		if stock.RSI >= 40 && stock.RSI <= 65 {
			techScore += 40
		} else if stock.RSI >= 35 && stock.RSI < 40 {
			techScore += 20
		}
	} else {
		if stock.EMA20 < stock.EMA50 {
			techScore += 60
		}
		// RSI: prefer 35-60 for puts (not oversold, some weakness)
		if stock.RSI >= 35 && stock.RSI <= 60 {
			techScore += 40
		} else if stock.RSI > 60 && stock.RSI <= 70 {
			techScore += 20
		}
	}

	// Liquidity Score (20%): OI > 500, spread < 8%
	liquidityScore := 0.0
	if opt.OpenInterest >= 500 {
		liquidityScore += 60
	} else if opt.OpenInterest >= 100 {
		liquidityScore += 30
	}
	if opt.SpreadPct < 5 {
		liquidityScore += 40
	} else if opt.SpreadPct < 8 {
		liquidityScore += 20
	}

	// Risk/Reward Score (20%): theoretical edge = (BS fair - ask) / ask * 100
	rrScore := 0.0
	if opt.Ask > 0 && opt.BSFairValue > 0 {
		edge := (opt.BSFairValue - opt.Ask) / opt.Ask * 100
		if edge >= 15 {
			rrScore = 100
		} else if edge >= 5 {
			rrScore = 70
		} else if edge >= 0 {
			rrScore = 40
		} else {
			rrScore = 10
		}
	}

	totalScore := ivScore*0.30 + techScore*0.30 + liquidityScore*0.20 + rrScore*0.20

	rationale := buildRationale(opt, stock, optType, ivScore, techScore)

	return models.OptionRecommendation{
		OptionContract:  opt,
		Score:           math.Round(totalScore*10) / 10,
		IVScore:         math.Round(ivScore*10) / 10,
		TechScore:       math.Round(techScore*10) / 10,
		LiquidityScore:  math.Round(liquidityScore*10) / 10,
		RiskRewardScore: math.Round(rrScore*10) / 10,
		Rationale:       rationale,
		StockPrice:      stock.Price,
		StockSymbol:     stock.Symbol,
	}
}

func buildRationale(opt models.OptionContract, stock *models.Stock, optType string, ivScore, techScore float64) string {
	trend := "neutral"
	if stock.EMA20 > stock.EMA50 {
		trend = "bullish"
	} else if stock.EMA20 < stock.EMA50 {
		trend = "bearish"
	}
	return fmt.Sprintf("%s %s — IV Rank %.0f%% (cheap), trend %s, RSI %.0f, %d DTE",
		stock.Symbol, optType, stock.IVRank, trend, stock.RSI, opt.DTE)
}
