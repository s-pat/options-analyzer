// Package datasource implements a multi-source data router for the Options Lab API.
//
// Different market data types are served from specialised providers:
//
//	Options chains  → Tradier (primary) → Yahoo Finance (fallback)
//	Live quotes     → Polygon.io (primary) → Yahoo Finance (fallback)
//	Historical OHLCV → Yahoo Finance (primary, broadest history coverage)
//
// Every provider is optional. When no API credentials are configured for a
// premium provider, the router silently routes to Yahoo Finance. The data
// source that actually served a response is recorded in the returned model
// (OptionsChain.DataSource, Stock.QuoteSource) for frontend attribution.
package datasource

import (
	"fmt"
	"log"
	"time"

	"github.com/sohanpatel/options-analyzer/api/internal/models"
	"github.com/sohanpatel/options-analyzer/api/internal/polygon"
	"github.com/sohanpatel/options-analyzer/api/internal/tradier"
	"github.com/sohanpatel/options-analyzer/api/internal/yahoo"
)

const yahooDataSource = "Yahoo Finance"

// Router dispatches market data requests across multiple providers with
// automatic fallback to Yahoo Finance when premium providers are unavailable
// or return an error.
type Router struct {
	yahoo   *yahoo.Client
	tradier *tradier.Client
	polygon *polygon.Client
}

// New creates a Router. yahoo must not be nil; tradier and polygon are optional
// (pass nil to skip them and always use Yahoo Finance).
func New(yc *yahoo.Client, tc *tradier.Client, pc *polygon.Client) *Router {
	r := &Router{yahoo: yc, tradier: tc, polygon: pc}
	if tc != nil && tc.IsAvailable() {
		log.Printf("datasource: Tradier client available — options chains will prefer Tradier")
	}
	if pc != nil && pc.IsAvailable() {
		log.Printf("datasource: Polygon.io client available — live quotes will prefer Polygon.io")
	}
	return r
}

// ---- Options chain ----

// GetOptionsExpirations returns all available expiration dates for a symbol.
// Prefers Tradier; falls back to Yahoo Finance.
func (r *Router) GetOptionsExpirations(symbol string) ([]int64, string, error) {
	if r.tradier != nil && r.tradier.IsAvailable() {
		exps, err := r.tradier.GetExpirations(symbol)
		if err == nil && len(exps) > 0 {
			return exps, tradier.DataSource, nil
		}
		log.Printf("datasource: Tradier expirations failed for %s (%v); falling back to Yahoo Finance", symbol, err)
	}
	return nil, yahooDataSource, fmt.Errorf("no tradier expirations; caller should use Yahoo Finance")
}

// GetOptionsForExpiry fetches calls and puts for a specific expiration timestamp.
// Prefers Tradier; falls back to Yahoo Finance.
func (r *Router) GetOptionsForExpiry(symbol string, expiry int64) (*models.OptionsChain, error) {
	if r.tradier != nil && r.tradier.IsAvailable() {
		dateStr := time.Unix(expiry, 0).UTC().Format("2006-01-02")
		chain, err := r.tradier.GetOptionsChain(symbol, dateStr)
		if err == nil && (len(chain.Calls) > 0 || len(chain.Puts) > 0) {
			chain.DataSource = tradier.DataSource
			return chain, nil
		}
		log.Printf("datasource: Tradier chain failed for %s %d (%v); falling back to Yahoo Finance", symbol, expiry, err)
	}

	// Yahoo Finance fallback
	raw, _, err := r.yahoo.GetOptionsChain(symbol, expiry)
	if err != nil {
		return nil, err
	}
	chain := yahoo.ParseOptionsChain(symbol, raw, 0, 0)
	chain.DataSource = yahooDataSource
	return chain, nil
}

// GetOptionsChainYahoo is a direct pass-through to the Yahoo Finance options
// endpoint. Used to retrieve the list of all available expirations when Tradier
// is unavailable, because Yahoo returns ExpirationDates in the first response.
func (r *Router) GetOptionsChainYahoo(symbol string, expiry int64) (*yahoo.OptionsResponse, error) {
	raw, _, err := r.yahoo.GetOptionsChain(symbol, expiry)
	return raw, err
}

// ---- Stock quotes ----

// GetQuote fetches the latest real-time quote for a symbol.
// Prefers Polygon.io; falls back to Yahoo Finance.
func (r *Router) GetQuote(symbol string) (*models.Stock, error) {
	if r.polygon != nil && r.polygon.IsAvailable() {
		stock, err := r.polygon.GetQuote(symbol)
		if err == nil && stock.Price > 0 {
			stock.QuoteSource = polygon.DataSource
			return stock, nil
		}
		log.Printf("datasource: Polygon quote failed for %s (%v); falling back to Yahoo Finance", symbol, err)
	}

	stock, err := r.yahoo.GetQuote(symbol)
	if err != nil {
		return nil, err
	}
	stock.QuoteSource = yahooDataSource
	return stock, nil
}

// ---- Historical data ----

// GetHistory fetches daily OHLCV bars.
// Always uses Yahoo Finance (broadest historical coverage).
func (r *Router) GetHistory(symbol, rangeStr string) ([]models.OHLCV, error) {
	return r.yahoo.GetHistory(symbol, rangeStr)
}

// ---- News ----

// GetNews fetches recent news for a symbol from Yahoo Finance.
func (r *Router) GetNews(symbol string, count int) ([]yahoo.NewsArticle, error) {
	return r.yahoo.GetNews(symbol, count)
}
