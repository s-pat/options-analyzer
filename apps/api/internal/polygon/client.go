// Package polygon provides a stock quote client backed by the Polygon.io REST API.
//
// Polygon.io offers real-time and delayed stock quotes, OHLCV snapshots, and
// market-wide data feeds. It is used as the primary source for live stock price
// data when a POLYGON_API_KEY environment variable is present; Yahoo Finance is
// used as a fallback.
//
// API reference: https://polygon.io/docs/stocks/get_v2_snapshot_locale_us_markets_stocks_tickers__stocksTicker
package polygon

import (
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"os"
	"strings"
	"sync"
	"time"

	"github.com/patrickmn/go-cache"
	"github.com/sohanpatel/options-analyzer/api/internal/models"
)

const (
	baseURL    = "https://api.polygon.io"
	cacheTTL   = 1 * time.Minute // quotes refresh quickly
	cacheClean = 5 * time.Minute
	maxConc    = 8
)

// DataSource is the attribution label for data served by this client.
const DataSource = "Polygon.io"

// Client is a Polygon.io REST API client.
type Client struct {
	http  *http.Client
	cache *cache.Cache
	sem   chan struct{}
	key   string
	mu    sync.Mutex
}

// NewClient creates a Polygon.io client using the POLYGON_API_KEY environment variable.
// Returns nil when no API key is configured so callers can fall back to Yahoo Finance.
func NewClient() *Client {
	key := strings.TrimSpace(os.Getenv("POLYGON_API_KEY"))
	if key == "" {
		return nil
	}

	c := &Client{
		http: &http.Client{
			Timeout: 10 * time.Second,
			Transport: &http.Transport{
				MaxIdleConns:        100,
				MaxIdleConnsPerHost: 20,
				IdleConnTimeout:     90 * time.Second,
			},
		},
		cache: cache.New(cacheTTL, cacheClean),
		sem:   make(chan struct{}, maxConc),
		key:   key,
	}
	log.Printf("polygon: client initialised")
	return c
}

// IsAvailable returns true when the client was successfully initialised with an API key.
func (c *Client) IsAvailable() bool {
	return c != nil && c.key != ""
}

func (c *Client) get(rawURL string) ([]byte, error) {
	sep := "?"
	if strings.Contains(rawURL, "?") {
		sep = "&"
	}
	fullURL := rawURL + sep + "apiKey=" + c.key

	if cached, found := c.cache.Get(rawURL); found {
		return cached.([]byte), nil
	}

	c.sem <- struct{}{}
	defer func() { <-c.sem }()

	req, err := http.NewRequest("GET", fullURL, nil)
	if err != nil {
		return nil, err
	}
	req.Header.Set("Accept", "application/json")

	resp, err := c.http.Do(req)
	if err != nil {
		return nil, fmt.Errorf("polygon request: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode == http.StatusUnauthorized || resp.StatusCode == http.StatusForbidden {
		return nil, fmt.Errorf("polygon: auth error (%d) — check POLYGON_API_KEY", resp.StatusCode)
	}
	if resp.StatusCode == 429 {
		return nil, fmt.Errorf("polygon: rate limited")
	}
	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("polygon: HTTP %d for %s", resp.StatusCode, rawURL)
	}

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, err
	}
	c.cache.Set(rawURL, body, cacheTTL)
	return body, nil
}

// ---- Polygon.io response types ----

type snapshotResponse struct {
	Status  string `json:"status"`
	Ticker  struct {
		Ticker          string  `json:"ticker"`
		Day             struct {
			Open   float64 `json:"o"`
			High   float64 `json:"h"`
			Low    float64 `json:"l"`
			Close  float64 `json:"c"`
			Volume float64 `json:"v"`
		} `json:"day"`
		LastTrade struct {
			Price float64 `json:"p"`
		} `json:"lastTrade"`
		PrevDay struct {
			Close float64 `json:"c"`
		} `json:"prevDay"`
		TodaysChangePerc float64 `json:"todaysChangePerc"`
		TodaysChange     float64 `json:"todaysChange"`
	} `json:"ticker"`
}

type prevCloseResponse struct {
	Status  string `json:"status"`
	Results []struct {
		T int64   `json:"t"` // timestamp ms
		O float64 `json:"o"`
		H float64 `json:"h"`
		L float64 `json:"l"`
		C float64 `json:"c"`
		V float64 `json:"v"`
	} `json:"results"`
}

type aggResponse struct {
	Status  string `json:"status"`
	Results []struct {
		T int64   `json:"t"` // unix ms
		O float64 `json:"o"`
		H float64 `json:"h"`
		L float64 `json:"l"`
		C float64 `json:"c"`
		V float64 `json:"v"`
	} `json:"results"`
}

// GetQuote fetches the latest snapshot for a ticker and returns a Stock with
// price, change, volume populated and QuoteSource set to "Polygon.io".
func (c *Client) GetQuote(symbol string) (*models.Stock, error) {
	rawURL := fmt.Sprintf("%s/v2/snapshot/locale/us/markets/stocks/tickers/%s", baseURL, symbol)
	body, err := c.get(rawURL)
	if err != nil {
		return nil, err
	}

	var resp snapshotResponse
	if err := json.Unmarshal(body, &resp); err != nil {
		return nil, fmt.Errorf("polygon: parse snapshot: %w", err)
	}
	if resp.Status != "OK" {
		return nil, fmt.Errorf("polygon: snapshot status=%s for %s", resp.Status, symbol)
	}

	t := resp.Ticker
	price := t.LastTrade.Price
	if price == 0 {
		price = t.Day.Close
	}

	return &models.Stock{
		Symbol:        symbol,
		Price:         price,
		Change:        t.TodaysChange,
		ChangePercent: t.TodaysChangePerc,
		Volume:        int64(t.Day.Volume),
		QuoteSource:   DataSource,
		UpdatedAt:     time.Now(),
	}, nil
}

// GetHistory fetches daily OHLCV bars for the given date range (inclusive).
// from / to must be "YYYY-MM-DD" strings.
func (c *Client) GetHistory(symbol, from, to string) ([]models.OHLCV, error) {
	rawURL := fmt.Sprintf(
		"%s/v2/aggs/ticker/%s/range/1/day/%s/%s?adjusted=true&sort=asc&limit=500",
		baseURL, symbol, from, to,
	)
	body, err := c.get(rawURL)
	if err != nil {
		return nil, err
	}

	var resp aggResponse
	if err := json.Unmarshal(body, &resp); err != nil {
		return nil, fmt.Errorf("polygon: parse aggs: %w", err)
	}

	var out []models.OHLCV
	for _, r := range resp.Results {
		out = append(out, models.OHLCV{
			Timestamp: r.T / 1000, // Polygon returns ms; convert to seconds
			Open:      r.O,
			High:      r.H,
			Low:       r.L,
			Close:     r.C,
			Volume:    int64(r.V),
		})
	}
	return out, nil
}
