// ivcrush.go — IV Crush Simulator service.
package services

import (
	"fmt"
	"math"
	"time"

	bsmath "github.com/sohanpatel/options-analyzer/api/internal/math"
	"github.com/sohanpatel/options-analyzer/api/internal/models"
)

// IVCrushService estimates the IV crush risk for a specific option contract.
type IVCrushService struct {
	optionsSvc *OptionsService
	sp500      *SP500Service
}

// NewIVCrushService creates a new IVCrushService.
func NewIVCrushService(optionsSvc *OptionsService, sp500 *SP500Service) *IVCrushService {
	return &IVCrushService{
		optionsSvc: optionsSvc,
		sp500:      sp500,
	}
}

// EstimateIVCrush runs the full IV crush simulation for the given contract.
func (s *IVCrushService) EstimateIVCrush(symbol, optType string, strike float64, expiration int64) (*models.IVCrushEstimate, error) {
	stock, err := s.sp500.GetStock(symbol)
	if err != nil {
		return nil, fmt.Errorf("stock fetch: %w", err)
	}

	chain, err := s.optionsSvc.GetOptionsChain(symbol)
	if err != nil {
		return nil, fmt.Errorf("chain fetch: %w", err)
	}

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

	currentIV := best.ImpliedVolatility
	if currentIV <= 0 || currentIV > 5 {
		currentIV = stock.IV / 100.0
	}
	if currentIV <= 0 {
		currentIV = 0.30
	}

	var crushRatio float64
	switch {
	case stock.IVRank > 60:
		crushRatio = 0.55
	case stock.IVRank < 30:
		crushRatio = 0.35
	default:
		crushRatio = 0.45
	}

	postEarningsIV := currentIV * (1 - crushRatio)

	now := time.Now()
	expTime := time.Unix(expiration, 0)
	dte := int(expTime.Sub(now).Hours() / 24)
	if dte < 0 {
		dte = 0
	}
	T := float64(dte) / 365.0

	currentPrice := best.Ask
	if currentPrice <= 0 {
		currentPrice = best.LastPrice
	}
	if currentPrice <= 0 {
		currentPrice = best.BSFairValue
	}
	if currentPrice <= 0 {
		if optType == "call" {
			currentPrice = bsmath.BSCall(stock.Price, strike, T, riskFreeRate, currentIV)
		} else {
			currentPrice = bsmath.BSPut(stock.Price, strike, T, riskFreeRate, currentIV)
		}
	}

	var postPrice float64
	if T > 0 && postEarningsIV > 0 {
		if optType == "call" {
			postPrice = bsmath.BSCall(stock.Price, strike, T, riskFreeRate, postEarningsIV)
		} else {
			postPrice = bsmath.BSPut(stock.Price, strike, T, riskFreeRate, postEarningsIV)
		}
	}

	var pnlPct, pnlDollar, pnlPerContract float64
	if currentPrice > 0 {
		pnlPct = (postPrice - currentPrice) / currentPrice * 100
		pnlDollar = postPrice - currentPrice
		pnlPerContract = pnlDollar * 100
	}

	verdict := ivCrushVerdictFromPnL(pnlPct)
	warning := buildIVCrushWarning(symbol, optType, stock.IVRank, currentIV*100, crushRatio*100, pnlPct, currentPrice, postPrice)
	scenarios := buildIVCrushScenarios(stock.Price, strike, T, optType, currentIV, currentPrice)

	return &models.IVCrushEstimate{
		Symbol:             symbol,
		OptionType:         optType,
		Strike:             strike,
		Expiration:         expiration,
		DTE:                dte,
		CurrentIV:          math.Round(currentIV*10000) / 10000,
		CurrentIVPct:       math.Round(currentIV*1000) / 10,
		IVRank:             math.Round(stock.IVRank*10) / 10,
		EstimatedCrushPct:  math.Round(crushRatio*1000) / 10,
		PostEarningsIV:     math.Round(postEarningsIV*10000) / 10000,
		PostEarningsIVPct:  math.Round(postEarningsIV*1000) / 10,
		CurrentOptionPrice: math.Round(currentPrice*100) / 100,
		PostEarningsPrice:  math.Round(postPrice*100) / 100,
		PnLPct:             math.Round(pnlPct*10) / 10,
		PnLDollar:          math.Round(pnlDollar*100) / 100,
		PnLPerContract:     math.Round(pnlPerContract*100) / 100,
		Verdict:            verdict,
		Warning:            warning,
		Scenarios:          scenarios,
	}, nil
}

func ivCrushVerdictFromPnL(pnlPct float64) string {
	switch {
	case pnlPct < -30:
		return "High Risk"
	case pnlPct < -15:
		return "Moderate Risk"
	default:
		return "Low Risk"
	}
}

func buildIVCrushWarning(symbol, optType string, ivRank, currentIVPct, crushPct, pnlPct, currentPrice, postPrice float64) string {
	riskLevel := "moderate"
	if pnlPct < -30 {
		riskLevel = "severe"
	} else if pnlPct >= -15 {
		riskLevel = "limited"
	}

	var ivRankDesc string
	switch {
	case ivRank > 70:
		ivRankDesc = "very elevated"
	case ivRank > 50:
		ivRankDesc = "elevated"
	case ivRank > 30:
		ivRankDesc = "moderate"
	default:
		ivRankDesc = "low"
	}

	var advice string
	switch {
	case pnlPct < -30:
		advice = "Consider closing the position before earnings or switching to a defined-risk spread to limit IV crush exposure."
	case pnlPct < -15:
		advice = "Evaluate whether the expected directional move justifies holding through earnings, or consider reducing size."
	default:
		advice = "IV crush risk is manageable here, but monitor the position closely around the earnings date."
	}

	return fmt.Sprintf(
		"%s has an IV Rank of %.0f%%, meaning its implied volatility (%.1f%%) is %s relative to the past year. "+
			"Post-earnings, IV typically collapses — our model estimates a %.0f%% IV crush, dropping IV to roughly %.1f%%. "+
			"This alone would reprice your %s from $%.2f to $%.2f per share — a %s impact of %.1f%% on option value, "+
			"even if the stock doesn't move. %s",
		symbol, ivRank, currentIVPct, ivRankDesc,
		crushPct, currentIVPct*(1-crushPct/100),
		optType, currentPrice, postPrice,
		riskLevel, pnlPct,
		advice,
	)
}

func buildIVCrushScenarios(stockPrice, strike, T float64, optType string, currentIV, currentPrice float64) []models.IVCrushScenario {
	type scenarioDef struct {
		label    string
		crushPct float64
	}
	defs := []scenarioDef{
		{"Mild Crush (25%)", 25},
		{"Base Case (45%)", 45},
		{"Severe Crush (65%)", 65},
	}

	var scenarios []models.IVCrushScenario
	for _, def := range defs {
		postIV := currentIV * (1 - def.crushPct/100)

		var optPrice float64
		if T > 0 && postIV > 0 {
			if optType == "call" {
				optPrice = bsmath.BSCall(stockPrice, strike, T, riskFreeRate, postIV)
			} else {
				optPrice = bsmath.BSPut(stockPrice, strike, T, riskFreeRate, postIV)
			}
		}

		var pnlPct float64
		if currentPrice > 0 {
			pnlPct = (optPrice - currentPrice) / currentPrice * 100
		}

		scenarios = append(scenarios, models.IVCrushScenario{
			Label:       def.label,
			CrushPct:    def.crushPct,
			PostIV:      math.Round(postIV*10000) / 10000,
			OptionPrice: math.Round(optPrice*100) / 100,
			PnLPct:      math.Round(pnlPct*10) / 10,
		})
	}
	return scenarios
}
