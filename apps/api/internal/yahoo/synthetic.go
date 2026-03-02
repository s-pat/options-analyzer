package yahoo

import (
	"fmt"
	"math"
	"time"

	bsmath "github.com/sohanpatel/options-analyzer/api/internal/math"
	"github.com/sohanpatel/options-analyzer/api/internal/models"
)

// SyntheticOptionsChain generates a realistic options chain using Black-Scholes
// when live Yahoo Finance data is unavailable (market closed, rate limited, etc.)
func SyntheticOptionsChain(symbol string, stockPrice, hv float64, riskFreeRate float64) *models.OptionsChain {
	now := time.Now()

	// Generate 4 expiration dates: ~30, ~45, ~60, ~90 DTE (next monthly expiries)
	expirations := nextMonthlyExpiries(now, 4)

	chain := &models.OptionsChain{
		Symbol:      symbol,
		UpdatedAt:   now,
		IsSynthetic: true,
	}

	// Generate strikes: ±15% around current price in ~$5 or ~$2.50 increments
	strikes := generateStrikes(stockPrice)

	for _, expDate := range expirations {
		dte := int(expDate.Sub(now).Hours() / 24)
		if dte <= 0 {
			continue
		}
		T := float64(dte) / 365.0
		expUnix := expDate.Unix()
		chain.Expirations = append(chain.Expirations, expUnix)

		// IV typically trades at a premium to HV; vary slightly by strike (vol smile)
		atmIV := hv * 1.15
		if atmIV < 0.08 {
			atmIV = 0.08
		}

		for _, strike := range strikes {
			moneyness := (strike - stockPrice) / stockPrice

			// Simple vol smile: OTM options have higher IV
			strikeIV := atmIV * (1 + 0.1*math.Abs(moneyness)*5)

			callPrice := bsmath.BSCall(stockPrice, strike, T, riskFreeRate, strikeIV)
			putPrice := bsmath.BSPut(stockPrice, strike, T, riskFreeRate, strikeIV)

			callGreeks := bsmath.BSGreeks(stockPrice, strike, T, riskFreeRate, strikeIV, "call")
			putGreeks := bsmath.BSGreeks(stockPrice, strike, T, riskFreeRate, strikeIV, "put")

			// Synthetic bid/ask: ~3% spread on mid
			callSpread := math.Max(callPrice*0.03, 0.02)
			putSpread := math.Max(putPrice*0.03, 0.02)

			// Synthetic OI: ATM has most, tapering off
			oi := syntheticOI(moneyness)
			vol := oi / 20

			callSym := fmt.Sprintf("%s%s%08.0f%s", symbol,
				expDate.Format("060102"), strike*1000, "C")
			putSym := fmt.Sprintf("%s%s%08.0f%s", symbol,
				expDate.Format("060102"), strike*1000, "P")

			if callPrice > 0.01 {
				c := models.OptionContract{
					ContractSymbol:    callSym,
					Strike:            strike,
					Currency:          "USD",
					LastPrice:         roundTo2(callPrice),
					Bid:               roundTo2(callPrice - callSpread),
					Ask:               roundTo2(callPrice + callSpread),
					Mid:               roundTo2(callPrice),
					Volume:            vol,
					OpenInterest:      oi,
					ImpliedVolatility: roundTo4(strikeIV),
					Expiration:        expUnix,
					DTE:               dte,
					Delta:             roundTo4(callGreeks.Delta),
					Gamma:             roundTo4(callGreeks.Gamma),
					Theta:             roundTo4(callGreeks.Theta),
					Vega:              roundTo4(callGreeks.Vega),
					BSFairValue:       roundTo2(callPrice),
					SpreadPct:         roundTo2(callSpread / callPrice * 100),
					OptionType:        "call",
				}
				chain.Calls = append(chain.Calls, c)
			}

			if putPrice > 0.01 {
				p := models.OptionContract{
					ContractSymbol:    putSym,
					Strike:            strike,
					Currency:          "USD",
					LastPrice:         roundTo2(putPrice),
					Bid:               roundTo2(putPrice - putSpread),
					Ask:               roundTo2(putPrice + putSpread),
					Mid:               roundTo2(putPrice),
					Volume:            vol,
					OpenInterest:      oi,
					ImpliedVolatility: roundTo4(strikeIV),
					Expiration:        expUnix,
					DTE:               dte,
					Delta:             roundTo4(putGreeks.Delta),
					Gamma:             roundTo4(putGreeks.Gamma),
					Theta:             roundTo4(putGreeks.Theta),
					Vega:              roundTo4(putGreeks.Vega),
					BSFairValue:       roundTo2(putPrice),
					SpreadPct:         roundTo2(putSpread / putPrice * 100),
					OptionType:        "put",
				}
				chain.Puts = append(chain.Puts, p)
			}
		}
	}

	return chain
}

// nextMonthlyExpiries returns the next n 3rd-Friday expiration dates
func nextMonthlyExpiries(from time.Time, n int) []time.Time {
	var dates []time.Time
	// Start from next month
	y, m, _ := from.Date()
	for len(dates) < n {
		thirdFriday := thirdFridayOf(y, m)
		// If the 3rd Friday already passed this month, skip
		if thirdFriday.After(from.AddDate(0, 0, 7)) {
			dates = append(dates, thirdFriday)
		}
		m++
		if m > 12 {
			m = 1
			y++
		}
	}
	return dates
}

func thirdFridayOf(year int, month time.Month) time.Time {
	// Find first day of month, then count to 3rd Friday
	first := time.Date(year, month, 1, 16, 0, 0, 0, time.UTC)
	fridayCount := 0
	for d := first; ; d = d.AddDate(0, 0, 1) {
		if d.Weekday() == time.Friday {
			fridayCount++
			if fridayCount == 3 {
				return d
			}
		}
	}
}

// generateStrikes creates strikes centered around stock price
func generateStrikes(price float64) []float64 {
	// Determine increment based on price level
	inc := 5.0
	if price < 50 {
		inc = 2.5
	} else if price < 200 {
		inc = 5.0
	} else if price < 500 {
		inc = 10.0
	} else {
		inc = 20.0
	}

	// ATM strike (rounded)
	atm := math.Round(price/inc) * inc

	// Generate ±15 strikes around ATM
	var strikes []float64
	for i := -12; i <= 12; i++ {
		s := atm + float64(i)*inc
		if s > 0 {
			strikes = append(strikes, s)
		}
	}
	return strikes
}

// syntheticOI generates realistic open interest based on moneyness
func syntheticOI(moneyness float64) int64 {
	base := 5000.0 * math.Exp(-math.Pow(moneyness*10, 2))
	return int64(math.Max(base, 50))
}

func roundTo2(v float64) float64 {
	return math.Round(v*100) / 100
}

func roundTo4(v float64) float64 {
	return math.Round(v*10000) / 10000
}
