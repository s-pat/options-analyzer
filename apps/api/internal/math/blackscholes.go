// Package math implements the mathematical models used throughout Options Lab.
//
// # Black-Scholes Model
//
// The Black-Scholes model (Fischer Black & Myron Scholes, 1973) prices European
// options assuming log-normally distributed stock returns with constant volatility.
//
// The two core pricing equations are:
//
//	Call = S·N(d₁) − K·e^(−rT)·N(d₂)
//	Put  = K·e^(−rT)·N(−d₂) − S·N(−d₁)
//
// where:
//
//	d₁ = [ ln(S/K) + (r + σ²/2)·T ] / (σ·√T)
//	d₂ = d₁ − σ·√T
//
//	S = current stock price
//	K = option strike price
//	T = time to expiration in years
//	r = risk-free interest rate (annualised, continuous)
//	σ = implied or historical volatility (annualised)
//	N = standard normal cumulative distribution function
//
// # Greeks
//
// Greeks measure how sensitively an option price changes to its inputs:
//
//	Delta (Δ) — change in option price per $1 move in the stock
//	Gamma (Γ) — change in delta per $1 move in the stock (convexity)
//	Theta (Θ) — daily time decay (option loses this much per day, all else equal)
//	Vega  (ν) — change in option price per 1% change in implied volatility
//
// # Historical Volatility
//
// Historical volatility (HV) is computed as the annualised standard deviation
// of daily log returns over a 30-day window:
//
//	r_i = ln(close_i / close_{i-1})
//	HV  = std(r₁..r_n) × √252
//
// # Implied Volatility
//
// Implied volatility (IV) is the σ that makes the BS formula match the market
// price. It is solved numerically using Newton-Raphson iteration.
//
// # IV Rank and IV Percentile
//
// IV Rank compares the current IV level to its 52-week range:
//
//	IVR = (IV_current − IV_52wk_low) / (IV_52wk_high − IV_52wk_low) × 100
//
// A low IV Rank (< 30) means options are historically cheap — a favourable
// condition for buying options. A high rank (> 70) signals expensive premiums.
//
// IV Percentile counts the fraction of past trading days where IV was below
// the current level (more robust to outlier spikes than IV Rank).
package math

import (
	"math"

	"github.com/sohanpatel/options-analyzer/api/internal/models"
)

// NormCDF is the standard normal cumulative distribution function Φ(x).
// Uses the complementary error function identity: Φ(x) = erfc(−x/√2) / 2.
func NormCDF(x float64) float64 {
	return 0.5 * math.Erfc(-x/math.Sqrt2)
}

// NormPDF is the standard normal probability density function φ(x) = e^(−x²/2) / √(2π).
func NormPDF(x float64) float64 {
	return math.Exp(-0.5*x*x) / math.Sqrt(2*math.Pi)
}

// BSCall computes the Black-Scholes price of a European call option.
//
// Parameters:
//   - S     : current stock price
//   - K     : strike price
//   - T     : time to expiration in years  (e.g. 45/365)
//   - r     : risk-free rate, annualised   (e.g. 0.05 = 5%)
//   - sigma : volatility, annualised       (e.g. 0.30 = 30%)
//
// At expiry (T ≤ 0) returns the intrinsic value max(S−K, 0).
func BSCall(S, K, T, r, sigma float64) float64 {
	if T <= 0 || sigma <= 0 {
		return math.Max(S-K, 0)
	}
	d1 := (math.Log(S/K) + (r+0.5*sigma*sigma)*T) / (sigma * math.Sqrt(T))
	d2 := d1 - sigma*math.Sqrt(T)
	return S*NormCDF(d1) - K*math.Exp(-r*T)*NormCDF(d2)
}

// BSPut computes the Black-Scholes price of a European put option.
// Put-call parity: Put = Call − S + K·e^(−rT) is implicitly satisfied.
// At expiry (T ≤ 0) returns the intrinsic value max(K−S, 0).
func BSPut(S, K, T, r, sigma float64) float64 {
	if T <= 0 || sigma <= 0 {
		return math.Max(K-S, 0)
	}
	d1 := (math.Log(S/K) + (r+0.5*sigma*sigma)*T) / (sigma * math.Sqrt(T))
	d2 := d1 - sigma*math.Sqrt(T)
	return K*math.Exp(-r*T)*NormCDF(-d2) - S*NormCDF(-d1)
}

// BSGreeks calculates all four primary Greeks for a call or put option.
//
// Formulas:
//
//	Delta(call)  = N(d₁)
//	Delta(put)   = N(d₁) − 1
//	Gamma        = φ(d₁) / (S·σ·√T)          — same for calls and puts
//	Vega         = S·φ(d₁)·√T / 100           — per 1% change in vol
//	Theta(call)  = [−S·φ(d₁)·σ/(2·√T) − r·K·e^(−rT)·N(d₂)]  / 365
//	Theta(put)   = [−S·φ(d₁)·σ/(2·√T) + r·K·e^(−rT)·N(−d₂)] / 365
//
// Theta is divided by 365 to express daily decay in dollar terms.
// Vega is divided by 100 so it represents the price change per 1% vol move.
func BSGreeks(S, K, T, r, sigma float64, optType string) models.Greeks {
	if T <= 0 || sigma <= 0 {
		return models.Greeks{}
	}
	d1 := (math.Log(S/K) + (r+0.5*sigma*sigma)*T) / (sigma * math.Sqrt(T))
	d2 := d1 - sigma*math.Sqrt(T)

	pdf_d1 := NormPDF(d1)
	sqrtT := math.Sqrt(T)

	gamma := pdf_d1 / (S * sigma * sqrtT)
	vega := S * pdf_d1 * sqrtT / 100 // per 1% change in vol

	var delta, theta float64
	if optType == "call" {
		delta = NormCDF(d1)
		theta = (-S*pdf_d1*sigma/(2*sqrtT) - r*K*math.Exp(-r*T)*NormCDF(d2)) / 365
	} else {
		delta = NormCDF(d1) - 1
		theta = (-S*pdf_d1*sigma/(2*sqrtT) + r*K*math.Exp(-r*T)*NormCDF(-d2)) / 365
	}

	return models.Greeks{
		Delta: delta,
		Gamma: gamma,
		Theta: theta,
		Vega:  vega,
	}
}

// HistoricalVolatility computes the 30-day annualised historical volatility
// from a series of closing prices.
//
// Steps:
//  1. Compute daily log returns: r_i = ln(close_i / close_{i-1})
//  2. Compute the sample standard deviation of those returns
//  3. Annualise by multiplying by √252 (trading days per year)
//
// Only the last 31 closes are used (30 log-return pairs).
// Returns 0 if fewer than 2 data points are supplied.
func HistoricalVolatility(closes []float64) float64 {
	if len(closes) < 2 {
		return 0
	}
	n := len(closes)
	if n > 31 {
		closes = closes[n-31:]
	}

	// Step 1: log returns
	returns := make([]float64, len(closes)-1)
	for i := 1; i < len(closes); i++ {
		if closes[i-1] <= 0 {
			continue
		}
		returns[i-1] = math.Log(closes[i] / closes[i-1])
	}

	// Step 2: sample mean
	sum := 0.0
	for _, r := range returns {
		sum += r
	}
	mean := sum / float64(len(returns))

	// Step 3: sample variance (Bessel-corrected, n-1 denominator)
	variance := 0.0
	for _, r := range returns {
		diff := r - mean
		variance += diff * diff
	}
	variance /= float64(len(returns) - 1)

	// Step 4: annualise
	return math.Sqrt(variance) * math.Sqrt(252)
}

// EMA computes the Exponential Moving Average for a price series using the
// standard smoothing factor k = 2/(period+1).
//
// Unlike a simple moving average, the EMA weights recent prices more heavily,
// making it responsive to recent price changes.
//
// The first value seeds the EMA; subsequent values apply the recursive formula:
//
//	EMA_t = price_t × k + EMA_{t-1} × (1−k)
func EMA(values []float64, period int) float64 {
	if len(values) == 0 || period <= 0 {
		return 0
	}
	k := 2.0 / float64(period+1)
	ema := values[0]
	for i := 1; i < len(values); i++ {
		ema = values[i]*k + ema*(1-k)
	}
	return ema
}

// RSI computes the 14-period Relative Strength Index developed by J. Welles Wilder.
//
// Algorithm (simplified Wilder method):
//  1. Compute 14 daily price changes
//  2. Separate into gains (up days) and losses (down days, absolute values)
//  3. Average Gain = sum(gains) / 14;  Average Loss = sum(losses) / 14
//  4. RS = Average Gain / Average Loss
//  5. RSI = 100 − 100 / (1 + RS)
//
// Interpretation:
//   - RSI > 70 : overbought (potential reversal / pullback)
//   - RSI < 30 : oversold  (potential bounce)
//   - RSI 40–60: neutral momentum
//
// Returns 50 (neutral) when fewer than 15 data points are available.
func RSI(closes []float64) float64 {
	period := 14
	if len(closes) < period+1 {
		return 50 // neutral if not enough data
	}

	closes = closes[len(closes)-period-1:]
	var gains, losses float64
	for i := 1; i <= period; i++ {
		diff := closes[i] - closes[i-1]
		if diff >= 0 {
			gains += diff
		} else {
			losses -= diff
		}
	}

	avgGain := gains / float64(period)
	avgLoss := losses / float64(period)
	if avgLoss == 0 {
		return 100
	}
	rs := avgGain / avgLoss
	return 100 - 100/(1+rs)
}

// IVRank normalises the current IV level within its 52-week range.
//
//	IVR = (IV_current − IV_52wk_low) / (IV_52wk_high − IV_52wk_low) × 100
//
// Examples:
//   - IVR = 0  : current IV is at its one-year low  → options historically cheap
//   - IVR = 100: current IV is at its one-year high → options historically expensive
//   - IVR = 50 : current IV is exactly at mid-range
//
// Returns 50 when ivHistory is empty (conservative neutral default).
func IVRank(currentIV float64, ivHistory []float64) float64 {
	if len(ivHistory) == 0 {
		return 50
	}
	low := ivHistory[0]
	high := ivHistory[0]
	for _, iv := range ivHistory {
		if iv < low {
			low = iv
		}
		if iv > high {
			high = iv
		}
	}
	if high == low {
		return 50
	}
	return (currentIV - low) / (high - low) * 100
}

// IVPercentile computes the percentage of past trading days on which IV was
// below the current level.
//
// Unlike IV Rank, IV Percentile is not distorted by a single outlier spike:
// if IV hit 100% once and is normally 20–40%, IV Rank would show a low number
// while IV Percentile would still reflect the true distribution.
//
// Returns 50 when ivHistory is empty.
func IVPercentile(currentIV float64, ivHistory []float64) float64 {
	if len(ivHistory) == 0 {
		return 50
	}
	below := 0
	for _, iv := range ivHistory {
		if iv < currentIV {
			below++
		}
	}
	return float64(below) / float64(len(ivHistory)) * 100
}

// ImpliedVolatility solves for the volatility σ that makes the BS model price
// equal the observed market price, using Newton-Raphson iteration.
//
// Newton-Raphson update step:
//
//	σ_{n+1} = σ_n − (BS(σ_n) − market_price) / vega(σ_n)
//
// Vega acts as the derivative of the BS price with respect to σ.
// Convergence threshold is $0.0001 per share; maximum 100 iterations.
// Initial guess is σ = 0.25 (25% annualised volatility).
//
// Returns 0 if T ≤ 0 or market_price ≤ 0 (no solution exists).
func ImpliedVolatility(marketPrice, S, K, T, r float64, optType string) float64 {
	if T <= 0 || marketPrice <= 0 {
		return 0
	}
	sigma := 0.25 // initial guess: 25% volatility
	for i := 0; i < 100; i++ {
		var price float64
		if optType == "call" {
			price = BSCall(S, K, T, r, sigma)
		} else {
			price = BSPut(S, K, T, r, sigma)
		}
		diff := price - marketPrice
		if math.Abs(diff) < 0.0001 {
			return sigma // converged
		}
		// vega = ∂price/∂σ — used as the Newton-Raphson denominator
		d1 := (math.Log(S/K) + (r+0.5*sigma*sigma)*T) / (sigma * math.Sqrt(T))
		vega := S * NormPDF(d1) * math.Sqrt(T)
		if vega == 0 {
			break
		}
		sigma -= diff / vega
		if sigma <= 0 {
			sigma = 0.001 // clamp to avoid negative vol
		}
	}
	return sigma
}
