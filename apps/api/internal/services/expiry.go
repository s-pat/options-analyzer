package services

import (
	"time"

	"github.com/sohanpatel/options-analyzer/api/internal/models"
)

// expiry.go — Expiration date classification and feasibility filtering.
//
// US equity options follow a strict expiry calendar:
//
//	Weekly    (non-standard): any Friday (or the Thursday before) that is NOT
//	                          the 3rd Friday of the month.
//	Monthly   (standard):     3rd Friday of Jan / Feb / Apr / May / Jul / Aug / Oct / Nov.
//	                          (The last trading day is often the Thursday before.)
//	Quarterly (standard):     3rd Friday of Mar / Jun / Sep / Dec — higher OI,
//	                          commonly used for hedging.
//	LEAPS:                    expirations with > 365 DTE; typically January of
//	                          the following 1–2 years.
//
// Important: many Nasdaq-listed stocks (AAPL, MSFT, NVDA …) expire on Thursdays
// because settlement occurs on the following Friday. ClassifyExpiry handles both
// conventions by checking both the expiry date and (date + 1 day).

// ClassifyExpiry categorises an expiration date as weekly / monthly / quarterly / leaps.
//
// Rules (matching standard US equity options conventions):
//   - LEAPS     : DTE > 365
//   - Quarterly : standard monthly expiry in March / June / September / December
//   - Monthly   : standard monthly expiry in any other month
//   - Weekly    : all other near-term expirations
//
// "Standard monthly expiry" = the date on or immediately before the 3rd Friday of the
// month. Nasdaq-listed stocks (AAPL, MSFT, etc.) expire on Thursday (the day before the
// 3rd Friday settlement). This function accepts both conventions.
func ClassifyExpiry(exp time.Time, dte int) string {
	if dte > 365 {
		return models.ExpiryLEAPS
	}
	// Check the date itself AND the next calendar day for being the 3rd Friday.
	// This covers Thursday-expiry stocks (Nasdaq) where the 3rd Friday is t+1.
	if isThirdFriday(exp) || isThirdFriday(exp.AddDate(0, 0, 1)) {
		m := exp.Month()
		if m == time.March || m == time.June || m == time.September || m == time.December {
			return models.ExpiryQuarterly
		}
		return models.ExpiryMonthly
	}
	return models.ExpiryWeekly
}

// isThirdFriday returns true if t is the 3rd Friday of its month.
func isThirdFriday(t time.Time) bool {
	if t.Weekday() != time.Friday {
		return false
	}
	// Day of month must be 15–21 (3rd Friday can only land here)
	d := t.Day()
	return d >= 15 && d <= 21
}

// selectExpiriesByCategory picks up to maxPerCategory expirations for each
// category from the full Yahoo-returned list.
func selectExpiriesByCategory(expirations []int64, now time.Time) map[string][]int64 {
	counts := map[string]int{
		models.ExpiryWeekly:    0,
		models.ExpiryMonthly:   0,
		models.ExpiryQuarterly: 0,
		models.ExpiryLEAPS:     0,
	}
	maxPerCat := map[string]int{
		models.ExpiryWeekly:    3,  // next 3 weeklies
		models.ExpiryMonthly:   4,  // next 4 monthlies
		models.ExpiryQuarterly: 2,  // next 2 quarterlies
		models.ExpiryLEAPS:     2,  // up to 2 LEAPS
	}
	selected := map[string][]int64{}

	for _, exp := range expirations {
		t := time.Unix(exp, 0)
		dte := int(t.Sub(now).Hours() / 24)
		if dte < 1 {
			continue
		}
		cat := ClassifyExpiry(t, dte)
		if counts[cat] < maxPerCat[cat] {
			selected[cat] = append(selected[cat], exp)
			counts[cat]++
		}
	}
	return selected
}

// isFeasible checks whether an option contract is practical for a retail investor.
// Returns (ok, reason).
func isFeasible(ask float64, oi int64, spreadPct float64, dte int) (bool, string) {
	cost := ask * 100
	switch {
	case ask <= 0:
		return false, "no ask price"
	case cost > 50000:
		return false, "contract cost > $50,000"
	case oi < 10:
		return false, "open interest < 10 (illiquid)"
	case spreadPct > 25:
		return false, "bid-ask spread > 25% (excessive slippage)"
	case dte < 1:
		return false, "expires today"
	default:
		return true, ""
	}
}
