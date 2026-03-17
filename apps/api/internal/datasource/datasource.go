// Package datasource defines the DataSource interface that every market-data
// provider (Yahoo Finance, AlphaVantage, …) must implement.
//
// Adding a new provider:
//  1. Create a sub-package (e.g. internal/polygon/).
//  2. Implement all four methods on a struct.
//  3. Wire the struct in cmd/server/main.go via the DATA_SOURCE env var.
package datasource

import "github.com/sohanpatel/options-analyzer/api/internal/models"

// DataSource is the common interface for all market-data backends.
type DataSource interface {
	// GetQuote returns current price data for a single symbol.
	GetQuote(symbol string) (*models.Stock, error)

	// GetHistory returns daily OHLCV bars for a symbol.
	// rangeStr uses Yahoo-style notation: "1mo" | "3mo" | "6mo" | "1y" | "2y".
	GetHistory(symbol string, rangeStr string) ([]models.OHLCV, error)

	// GetOptionExpirations returns all available option expiry unix timestamps
	// for the given symbol.
	GetOptionExpirations(symbol string) ([]int64, error)

	// GetOptionsForExpiry returns the parsed calls and puts for one specific
	// expiry.  stockPrice and riskFreeRate are passed so that providers can
	// synthesise missing Greeks or use them as fallback pricing inputs.
	GetOptionsForExpiry(symbol string, expiry int64, stockPrice, riskFreeRate float64) (*models.OptionsChain, error)
}
