// Package tradier provides an options chain client backed by the Tradier Brokerage API.
//
// Tradier offers a real-time options feed with per-contract Greeks, IV, bid/ask
// markets, and open interest. It is the primary options data source when a valid
// TRADIER_TOKEN environment variable is present; the Yahoo Finance client is used
// as a fallback.
//
// API reference: https://documentation.tradier.com/brokerage-api/markets/get-options-chains
package tradier

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
	prodBaseURL    = "https://api.tradier.com/v1"
	sandboxBaseURL = "https://sandbox.tradier.com/v1"
	cacheTTL       = 5 * time.Minute
	cacheClean     = 10 * time.Minute
	maxConcurrent  = 4
)

// DataSource is the attribution label returned in model fields.
const DataSource = "Tradier"

// Client is a Tradier Markets API client.
type Client struct {
	http    *http.Client
	cache   *cache.Cache
	sem     chan struct{}
	token   string
	baseURL string
	mu      sync.Mutex
}

// NewClient creates a Tradier client using the TRADIER_TOKEN environment variable.
// Returns nil if no token is configured — callers should fall back to Yahoo Finance.
func NewClient() *Client {
	token := strings.TrimSpace(os.Getenv("TRADIER_TOKEN"))
	if token == "" {
		return nil
	}

	// Use sandbox URL when token looks like a sandbox token (starts with "sandbox_")
	base := prodBaseURL
	if strings.HasPrefix(token, "sandbox_") || os.Getenv("TRADIER_SANDBOX") == "true" {
		base = sandboxBaseURL
	}

	c := &Client{
		http: &http.Client{
			Timeout: 10 * time.Second,
			Transport: &http.Transport{
				MaxIdleConns:        50,
				MaxIdleConnsPerHost: 10,
				IdleConnTimeout:     90 * time.Second,
			},
		},
		cache:   cache.New(cacheTTL, cacheClean),
		sem:     make(chan struct{}, maxConcurrent),
		token:   token,
		baseURL: base,
	}
	log.Printf("tradier: client initialised (base=%s)", base)
	return c
}

// IsAvailable returns true when the client was successfully initialised with a token.
func (c *Client) IsAvailable() bool {
	return c != nil && c.token != ""
}

func (c *Client) get(rawURL string) ([]byte, error) {
	if cached, found := c.cache.Get(rawURL); found {
		return cached.([]byte), nil
	}

	c.sem <- struct{}{}
	defer func() { <-c.sem }()

	req, err := http.NewRequest("GET", rawURL, nil)
	if err != nil {
		return nil, err
	}
	req.Header.Set("Authorization", "Bearer "+c.token)
	req.Header.Set("Accept", "application/json")

	resp, err := c.http.Do(req)
	if err != nil {
		return nil, fmt.Errorf("tradier request: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode == http.StatusUnauthorized {
		return nil, fmt.Errorf("tradier: 401 unauthorized — check TRADIER_TOKEN")
	}
	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("tradier: HTTP %d for %s", resp.StatusCode, rawURL)
	}

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, err
	}
	c.cache.Set(rawURL, body, cacheTTL)
	return body, nil
}

// ---- Tradier response types ----

type expirationResponse struct {
	Expirations struct {
		Date []string `json:"date"`
	} `json:"expirations"`
}

type chainResponse struct {
	Options struct {
		Option []rawOption `json:"option"`
	} `json:"options"`
}

type rawOption struct {
	Symbol            string  `json:"symbol"`
	Description       string  `json:"description"`
	ExpirationDate    string  `json:"expiration_date"` // "2025-01-17"
	Strike            float64 `json:"strike"`
	OptionType        string  `json:"option_type"` // "call" | "put"
	Last              float64 `json:"last"`
	Bid               float64 `json:"bid"`
	Ask               float64 `json:"ask"`
	Volume            int64   `json:"volume"`
	OpenInterest      int64   `json:"open_interest"`
	ImpliedVolatility float64 `json:"greeks.mid_iv"`
	Greeks            struct {
		Delta   float64 `json:"delta"`
		Gamma   float64 `json:"gamma"`
		Theta   float64 `json:"theta"`
		Vega    float64 `json:"vega"`
		MidIV   float64 `json:"mid_iv"`
		BidIV   float64 `json:"bid_iv"`
		AskIV   float64 `json:"ask_iv"`
	} `json:"greeks"`
}

// GetExpirations returns available expiration dates for a symbol as unix timestamps.
func (c *Client) GetExpirations(symbol string) ([]int64, error) {
	rawURL := fmt.Sprintf("%s/markets/options/expirations?symbol=%s&includeAllRoots=true&strikes=false", c.baseURL, symbol)
	body, err := c.get(rawURL)
	if err != nil {
		return nil, err
	}

	var resp expirationResponse
	if err := json.Unmarshal(body, &resp); err != nil {
		return nil, fmt.Errorf("tradier: parse expirations: %w", err)
	}

	loc := time.UTC
	var out []int64
	for _, d := range resp.Expirations.Date {
		t, err := time.ParseInLocation("2006-01-02", d, loc)
		if err != nil {
			continue
		}
		// Tradier expirations are end-of-day; match Yahoo's convention
		out = append(out, t.Unix())
	}
	return out, nil
}

// GetOptionsChain fetches calls and puts for a specific expiration.
// expiry must be in "YYYY-MM-DD" format (Tradier convention).
func (c *Client) GetOptionsChain(symbol, expiry string) (*models.OptionsChain, error) {
	rawURL := fmt.Sprintf(
		"%s/markets/options/chains?symbol=%s&expiration=%s&greeks=true",
		c.baseURL, symbol, expiry,
	)
	body, err := c.get(rawURL)
	if err != nil {
		return nil, err
	}

	var resp chainResponse
	if err := json.Unmarshal(body, &resp); err != nil {
		return nil, fmt.Errorf("tradier: parse chain: %w", err)
	}
	if len(resp.Options.Option) == 0 {
		return nil, fmt.Errorf("tradier: empty chain for %s %s", symbol, expiry)
	}

	now := time.Now()
	chain := &models.OptionsChain{
		Symbol:     symbol,
		UpdatedAt:  now,
		DataSource: DataSource,
	}

	for _, o := range resp.Options.Option {
		expTime, err := time.ParseInLocation("2006-01-02", o.ExpirationDate, time.UTC)
		if err != nil {
			continue
		}
		dte := int(expTime.Sub(now).Hours() / 24)
		if dte < 0 {
			continue
		}
		T := float64(dte) / 365.0

		mid := (o.Bid + o.Ask) / 2
		spreadPct := 0.0
		if mid > 0 {
			spreadPct = (o.Ask - o.Bid) / mid * 100
		}

		iv := o.Greeks.MidIV
		if iv == 0 {
			iv = o.ImpliedVolatility
		}

		contract := models.OptionContract{
			ContractSymbol:    o.Symbol,
			Strike:            o.Strike,
			Currency:          "USD",
			LastPrice:         o.Last,
			Bid:               o.Bid,
			Ask:               o.Ask,
			Mid:               mid,
			Volume:            o.Volume,
			OpenInterest:      o.OpenInterest,
			ImpliedVolatility: iv,
			Expiration:        expTime.Unix(),
			DTE:               dte,
			SpreadPct:         spreadPct,
			OptionType:        o.OptionType,
			ContractCost:      o.Ask * 100,
			// Greeks pre-supplied by Tradier — no need to recompute
			Delta: o.Greeks.Delta,
			Gamma: o.Greeks.Gamma,
			Theta: o.Greeks.Theta / 365.0 * T, // Tradier theta is per-day; normalise
			Vega:  o.Greeks.Vega,
		}
		if o.OptionType == "call" {
			chain.Calls = append(chain.Calls, contract)
		} else {
			chain.Puts = append(chain.Puts, contract)
		}
	}

	return chain, nil
}
