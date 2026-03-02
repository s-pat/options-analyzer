// analysis.go — Single-option deep analysis and thesis generation.
//
// AnalyzeOption evaluates one specific option contract and produces:
//
//  1. A checklist of 7 named signals (IV Rank, HV vs IV, Trend, RSI,
//     Liquidity, DTE, BS Edge), each marked positive or negative.
//  2. A composite score 0–100 using the same weighted formula as the
//     recommendation engine.
//  3. A verdict: "Strong Buy" / "Buy" / "Speculative" / "Pass"
//  4. A risk factor 1–5 based on DTE, delta, IV Rank, and liquidity.
//  5. A 5–6 bullet thesis explaining the opportunity in plain English.
//  6. Three key risk bullets quantifying theta decay, IV crush risk,
//     and maximum loss.
//  7. Breakeven price at expiration: strike ± premium paid.
package services

import (
	"fmt"
	"math"

	"github.com/sohanpatel/options-analyzer/api/internal/models"
)

// AnalyzeOption produces a full recommendation + thesis for a given option contract.
func AnalyzeOption(opt models.OptionContract, stock *models.Stock) *models.OptionAnalysis {
	optType := opt.OptionType

	// ---- Signals ----
	var signals []models.OptionSignal

	// 1. IV Rank signal
	ivRankDesc, ivRankPos := ivRankSignalFor(stock.IVRank)
	signals = append(signals, models.OptionSignal{
		Label: "IV Rank", Value: fmt.Sprintf("%.0f%% — %s", stock.IVRank, ivRankDesc), Positive: ivRankPos,
	})

	// 2. HV vs IV spread
	hvIVPos := stock.HV30 > stock.IV
	hvIVLabel := "IV < HV (options cheap)"
	if !hvIVPos {
		hvIVLabel = "IV > HV (options expensive)"
	}
	signals = append(signals, models.OptionSignal{
		Label: "HV vs IV", Value: hvIVLabel, Positive: hvIVPos,
	})

	// 3. Trend (EMA crossover)
	trendPos := false
	trendLabel := ""
	if optType == "call" {
		trendPos = stock.EMA20 > stock.EMA50
		if trendPos {
			trendLabel = "Bullish — EMA20 > EMA50"
		} else {
			trendLabel = "Bearish — EMA20 < EMA50"
		}
	} else {
		trendPos = stock.EMA20 < stock.EMA50
		if trendPos {
			trendLabel = "Bearish — EMA20 < EMA50"
		} else {
			trendLabel = "Bullish — EMA20 > EMA50"
		}
	}
	signals = append(signals, models.OptionSignal{
		Label: "Trend", Value: trendLabel, Positive: trendPos,
	})

	// 4. RSI signal
	rsiPos, rsiLabel := rsiSignal(stock.RSI, optType)
	signals = append(signals, models.OptionSignal{
		Label: "RSI", Value: fmt.Sprintf("%.0f — %s", stock.RSI, rsiLabel), Positive: rsiPos,
	})

	// 5. Liquidity
	liqPos := opt.OpenInterest >= 500 && opt.SpreadPct < 8
	liqLabel := fmt.Sprintf("OI %s, spread %.1f%%", fmtInt(opt.OpenInterest), opt.SpreadPct)
	signals = append(signals, models.OptionSignal{
		Label: "Liquidity", Value: liqLabel, Positive: liqPos,
	})

	// 6. DTE
	dtePos := opt.DTE >= 30 && opt.DTE <= 60
	dteLabel := fmt.Sprintf("%d days to expiry", opt.DTE)
	if !dtePos {
		if opt.DTE < 30 {
			dteLabel += " (too short — high theta risk)"
		} else {
			dteLabel += " (long-dated — higher premium)"
		}
	} else {
		dteLabel += " (sweet spot)"
	}
	signals = append(signals, models.OptionSignal{
		Label: "DTE", Value: dteLabel, Positive: dtePos,
	})

	// 7. Theoretical edge
	edgePos := false
	edgeLabel := "—"
	if opt.Ask > 0 && opt.BSFairValue > 0 {
		edge := (opt.BSFairValue - opt.Ask) / opt.Ask * 100
		edgePos = edge >= 5
		edgeLabel = fmt.Sprintf("%.1f%% edge vs BS fair value", edge)
	}
	signals = append(signals, models.OptionSignal{
		Label: "BS Edge", Value: edgeLabel, Positive: edgePos,
	})

	// ---- Score ----
	score := scoreSignals(signals, stock, opt)

	// ---- Verdict ----
	verdict, confidence := verdictFrom(score, signals)

	// ---- Risk Factor (1-5) ----
	riskFactor, riskLabel := computeRisk(opt, stock)

	// ---- Thesis bullets ----
	thesis := buildThesis(opt, stock, signals, optType)

	// ---- Key risks ----
	keyRisks := buildRisks(opt, stock, optType)

	// ---- Breakeven ----
	var breakevenAt float64
	if optType == "call" {
		breakevenAt = opt.Strike + opt.Ask
	} else {
		breakevenAt = opt.Strike - opt.Ask
	}

	return &models.OptionAnalysis{
		Symbol:      stock.Symbol,
		OptionType:  optType,
		Verdict:     verdict,
		Confidence:  confidence,
		RiskFactor:  riskFactor,
		RiskLabel:   riskLabel,
		Score:       math.Round(score*10) / 10,
		Thesis:      thesis,
		KeyRisks:    keyRisks,
		Signals:     signals,
		MaxLossPct:  50.0,
		MaxGainPct:  100.0,
		BreakevenAt: math.Round(breakevenAt*100) / 100,
	}
}

// ---- helpers ----

func ivRankSignalFor(rank float64) (string, bool) {
	switch {
	case rank <= 20:
		return "Very low — historically cheap options", true
	case rank <= 35:
		return "Low — favorable for long options", true
	case rank <= 55:
		return "Moderate — fair pricing", false
	case rank <= 75:
		return "High — options are pricey", false
	default:
		return "Very high — expensive, avoid long options", false
	}
}

func rsiSignal(rsi float64, optType string) (bool, string) {
	if optType == "call" {
		switch {
		case rsi < 30:
			return true, "oversold — potential bounce (call catalyst)"
		case rsi <= 50:
			return true, "neutral-low — room to run"
		case rsi <= 65:
			return false, "mid-range — momentum mixed"
		case rsi <= 75:
			return false, "elevated — approaching overbought"
		default:
			return false, "overbought — correction risk"
		}
	}
	// put
	switch {
	case rsi > 70:
		return true, "overbought — potential reversal (put catalyst)"
	case rsi >= 55:
		return true, "elevated — weakness likely"
	case rsi >= 40:
		return false, "mid-range — no clear directional signal"
	case rsi >= 30:
		return false, "low — oversold, risky for puts"
	default:
		return false, "very oversold — bounce likely, avoid puts"
	}
}

func fmtInt(n int64) string {
	if n >= 1000 {
		return fmt.Sprintf("%.1fk", float64(n)/1000)
	}
	return fmt.Sprintf("%d", n)
}

func scoreSignals(sigs []models.OptionSignal, stock *models.Stock, opt models.OptionContract) float64 {
	// Weighted scoring matching the recommendation engine
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
	trendSig := sigs[2] // trend signal
	rsiSig := sigs[3]   // rsi signal
	if trendSig.Positive {
		techScore += 60
	}
	if rsiSig.Positive {
		techScore += 40
	}

	liqScore := 0.0
	if opt.OpenInterest >= 500 {
		liqScore += 60
	} else if opt.OpenInterest >= 100 {
		liqScore += 30
	}
	if opt.SpreadPct < 5 {
		liqScore += 40
	} else if opt.SpreadPct < 8 {
		liqScore += 20
	}

	rrScore := 0.0
	if opt.Ask > 0 && opt.BSFairValue > 0 {
		edge := (opt.BSFairValue - opt.Ask) / opt.Ask * 100
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

	return ivScore*0.30 + techScore*0.30 + liqScore*0.20 + rrScore*0.20
}

func verdictFrom(score float64, sigs []models.OptionSignal) (string, string) {
	posCount := 0
	for _, s := range sigs {
		if s.Positive {
			posCount++
		}
	}

	switch {
	case score >= 75 && posCount >= 5:
		return "Strong Buy", "High"
	case score >= 62:
		return "Buy", "Medium"
	case score >= 48:
		return "Speculative", "Low"
	default:
		return "Pass", "Low"
	}
}

func computeRisk(opt models.OptionContract, stock *models.Stock) (int, string) {
	risk := 2 // base

	// High IV rank = higher risk for long options (paying up)
	if stock.IVRank > 60 {
		risk++
	}
	// Short DTE = more risk
	if opt.DTE < 21 {
		risk += 2
	} else if opt.DTE < 30 {
		risk++
	}
	// OTM increases risk
	delta := math.Abs(opt.Delta)
	if delta < 0.25 {
		risk += 2
	} else if delta < 0.35 {
		risk++
	}
	// Poor liquidity
	if opt.OpenInterest < 100 || opt.SpreadPct > 10 {
		risk++
	}

	if risk > 5 {
		risk = 5
	}
	if risk < 1 {
		risk = 1
	}

	labels := map[int]string{
		1: "Conservative",
		2: "Moderate",
		3: "Elevated",
		4: "High Risk",
		5: "Very High Risk",
	}
	return risk, labels[risk]
}

func buildThesis(opt models.OptionContract, stock *models.Stock, sigs []models.OptionSignal, optType string) []string {
	var bullets []string

	// IV / pricing
	switch {
	case stock.IVRank <= 25:
		bullets = append(bullets, fmt.Sprintf(
			"IV Rank is very low at %.0f%% — options are historically cheap, keeping premium cost down",
			stock.IVRank))
	case stock.IVRank <= 40:
		bullets = append(bullets, fmt.Sprintf(
			"IV Rank of %.0f%% is below average — relatively affordable entry for a long option",
			stock.IVRank))
	default:
		bullets = append(bullets, fmt.Sprintf(
			"IV Rank is elevated at %.0f%% — you are paying a premium; needs strong directional conviction",
			stock.IVRank))
	}

	// HV vs IV
	if stock.HV30 > stock.IV {
		bullets = append(bullets, fmt.Sprintf(
			"Realized volatility (HV30: %.1f%%) exceeds implied volatility (IV: %.1f%%) — options appear underpriced relative to actual price movement",
			stock.HV30, stock.IV))
	} else {
		bullets = append(bullets, fmt.Sprintf(
			"Implied volatility (%.1f%%) exceeds realized HV30 (%.1f%%) — the market is pricing in more uncertainty than recently observed",
			stock.IV, stock.HV30))
	}

	// Trend
	if optType == "call" {
		if stock.EMA20 > stock.EMA50 {
			bullets = append(bullets, fmt.Sprintf(
				"Short-term trend is bullish: EMA20 ($%.2f) > EMA50 ($%.2f) — price momentum supports a call position",
				stock.EMA20, stock.EMA50))
		} else {
			bullets = append(bullets, fmt.Sprintf(
				"Trend is bearish (EMA20 $%.2f < EMA50 $%.2f) — this is a counter-trend call; requires a catalyst",
				stock.EMA20, stock.EMA50))
		}
	} else {
		if stock.EMA20 < stock.EMA50 {
			bullets = append(bullets, fmt.Sprintf(
				"Short-term trend is bearish: EMA20 ($%.2f) < EMA50 ($%.2f) — price momentum aligns with a put position",
				stock.EMA20, stock.EMA50))
		} else {
			bullets = append(bullets, fmt.Sprintf(
				"Trend is bullish (EMA20 $%.2f > EMA50 $%.2f) — this is a counter-trend put; requires a clear reversal signal",
				stock.EMA20, stock.EMA50))
		}
	}

	// RSI
	if optType == "call" {
		if stock.RSI < 40 {
			bullets = append(bullets, fmt.Sprintf(
				"RSI at %.0f is near oversold territory — a mean-reversion bounce could provide a quick gain on the call",
				stock.RSI))
		} else if stock.RSI <= 60 {
			bullets = append(bullets, fmt.Sprintf(
				"RSI at %.0f is neutral — no overbought/oversold extreme; trade depends on trend continuation",
				stock.RSI))
		} else {
			bullets = append(bullets, fmt.Sprintf(
				"RSI at %.0f is elevated — momentum is extended, which increases the risk of a pullback against the call",
				stock.RSI))
		}
	} else {
		if stock.RSI > 65 {
			bullets = append(bullets, fmt.Sprintf(
				"RSI at %.0f signals overbought conditions — a mean-reversion pullback could benefit the put",
				stock.RSI))
		} else if stock.RSI >= 45 {
			bullets = append(bullets, fmt.Sprintf(
				"RSI at %.0f is mid-range — watch for a further weakening signal before the put thesis plays out",
				stock.RSI))
		} else {
			bullets = append(bullets, fmt.Sprintf(
				"RSI at %.0f is already low — downside may be limited; put carries more rebound risk",
				stock.RSI))
		}
	}

	// DTE + structure
	bullets = append(bullets, fmt.Sprintf(
		"%d DTE provides enough time for the thesis to develop while keeping theta decay manageable; breakeven at $%.2f",
		opt.DTE, func() float64 {
			if optType == "call" {
				return opt.Strike + opt.Ask
			}
			return opt.Strike - opt.Ask
		}()))

	// Liquidity / trade execution
	if opt.OpenInterest >= 1000 && opt.SpreadPct < 5 {
		bullets = append(bullets, fmt.Sprintf(
			"Excellent liquidity: %.1fk open interest and a tight %.1f%% bid-ask spread means minimal slippage on entry and exit",
			float64(opt.OpenInterest)/1000, opt.SpreadPct))
	} else if opt.OpenInterest >= 200 {
		bullets = append(bullets, fmt.Sprintf(
			"Adequate liquidity with %s open interest; use limit orders near mid ($%.2f) to avoid excessive slippage",
			fmtInt(opt.OpenInterest), opt.Mid))
	} else {
		bullets = append(bullets, fmt.Sprintf(
			"Low open interest (%s) — use limit orders and be aware that exiting early may be difficult",
			fmtInt(opt.OpenInterest)))
	}

	return bullets
}

func buildRisks(opt models.OptionContract, stock *models.Stock, optType string) []string {
	var risks []string

	// Theta / time decay risk
	risks = append(risks, fmt.Sprintf(
		"Time decay (theta $%.3f/day): the option loses value every day even if the stock stays flat — the position needs to move in your direction within %d days",
		math.Abs(opt.Theta), opt.DTE))

	// IV contraction risk
	if stock.IVRank <= 40 {
		risks = append(risks, fmt.Sprintf(
			"If IV rises further from current levels (rank %.0f%%), vega exposure ($%.3f) will help; however if the trade is directional but IV collapses, gains may be muted",
			stock.IVRank, opt.Vega))
	} else {
		risks = append(risks, fmt.Sprintf(
			"IV crush risk: at IV rank %.0f%%, a volatility contraction after an event could rapidly erode option value even if the stock moves in your direction",
			stock.IVRank))
	}

	// Directional risk
	if optType == "call" {
		risks = append(risks, fmt.Sprintf(
			"If %s trades below $%.2f at expiration, the entire premium ($%.2f per share / $%.0f per contract) is lost — only risk capital you can afford to lose",
			stock.Symbol, opt.Strike, opt.Ask, opt.Ask*100))
	} else {
		risks = append(risks, fmt.Sprintf(
			"If %s trades above $%.2f at expiration, the entire premium ($%.2f per share / $%.0f per contract) is lost — only risk capital you can afford to lose",
			stock.Symbol, opt.Strike, opt.Ask, opt.Ask*100))
	}

	return risks
}
