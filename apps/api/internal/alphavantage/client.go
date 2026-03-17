// Package alphavantage implements the datasource.DataSource interface using the
// AlphaVantage REST API (https://www.alphavantage.co).
//
// Required env var:
//
//	ALPHA_VANTAGE_API_KEY — your AlphaVantage API key
//
// Rate limits (free tier): 25 requests / day, 5 requests / minute.
// The client enforces a 15-second inter-request delay on the free tier.
// Set ALPHA_VANTAGE_PREMIUM=true to drop the delay to 500 ms.
//
// Options data: AlphaVantage offers a REALTIME_OPTIONS endpoint on premium
// plans.  When the endpoint is unavailable (free tier or network error) the
// client falls back to the same Black-Scholes synthetic chain used by the
// Yahoo Finance client.
package alphavantage

import (
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"sort"
	"strconv"
	"strings"
	"sync"
	"time"

	"github.com/patrickmn/go-cache"
	"github.com/sohanpatel/options-analyzer/api/internal/models"
	bsmath "github.com/sohanpatel/options-analyzer/api/internal/math"
)

const (
	avBaseURL    = "https://www.alphavantage.co/query"
	avCacheTTL   = 5 * time.Minute
	avCacheClean = 10 * time.Minute
	// free-tier: 5 req/min → enforce 15 s between calls to be safe
	avRateDelayFree    = 15 * time.Second
	avRateDelayPremium = 500 * time.Millisecond
)

// Client is a rate-limited AlphaVantage HTTP client with response caching.
type Client struct {
	apiKey    string
	http      *http.Client
	cache     *cache.Cache
	mu        sync.Mutex
	lastCall  time.Time
	rateDelay time.Duration
}

// NewClient creates an AlphaVantage client.
// premium should be true when using a paid AlphaVantage key.
func NewClient(apiKey string, premium bool) *Client {
	delay := avRateDelayFree
	if premium {
		delay = avRateDelayPremium
	}
	return &Client{
		apiKey: apiKey,
		http: &http.Client{
			Timeout: 20 * time.Second,
			Transport: &http.Transport{
				MaxIdleConns:        20,
				MaxIdleConnsPerHost: 5,
				IdleConnTimeout:     90 * time.Second,
			},
		},
		cache:     cache.New(avCacheTTL, avCacheClean),
		rateDelay: delay,
	}
}

func (c *Client) rateLimit() {
	c.mu.Lock()
	defer c.mu.Unlock()
	elapsed := time.Since(c.lastCall)
	if elapsed < c.rateDelay {
		time.Sleep(c.rateDelay - elapsed)
	}
	c.lastCall = time.Now()
}

func (c *Client) get(params map[string]string) ([]byte, error) {
	// Build cache key from sorted params
	var parts []string
	for k, v := range params {
		parts = append(parts, k+"="+v)
	}
	sort.Strings(parts)
	cacheKey := strings.Join(parts, "&")

	if cached, found := c.cache.Get(cacheKey); found {
		return cached.([]byte), nil
	}

	c.rateLimit()

	req, err := http.NewRequest("GET", avBaseURL, nil)
	if err != nil {
		return nil, err
	}
	q := req.URL.Query()
	for k, v := range params {
		q.Set(k, v)
	}
	q.Set("apikey", c.apiKey)
	req.URL.RawQuery = q.Encode()
	req.Header.Set("User-Agent", "OptionLabs/1.0")
	req.Header.Set("Accept", "application/json")

	resp, err := c.http.Do(req)
	if err != nil {
		return nil, fmt.Errorf("alphavantage request: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("alphavantage returned %d", resp.StatusCode)
	}

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, err
	}

	// Detect API-level errors
	if strings.Contains(string(body), `"Information"`) {
		return nil, fmt.Errorf("alphavantage rate limit or API key error: %s", string(body))
	}
	if strings.Contains(string(body), `"Error Message"`) {
		return nil, fmt.Errorf("alphavantage error: %s", string(body))
	}

	c.cache.Set(cacheKey, body, avCacheTTL)
	return body, nil
}

// ── GetQuote ──────────────────────────────────────────────────────────────────

type globalQuoteResponse struct {
	GlobalQuote struct {
		Symbol           string `json:"01. symbol"`
		Open             string `json:"02. open"`
		High             string `json:"03. high"`
		Low              string `json:"04. low"`
		Price            string `json:"05. price"`
		Volume           string `json:"06. volume"`
		PreviousClose    string `json:"08. previous close"`
		Change           string `json:"09. change"`
		ChangePercentRaw string `json:"10. change percent"`
	} `json:"Global Quote"`
}

// GetQuote implements datasource.DataSource.
func (c *Client) GetQuote(symbol string) (*models.Stock, error) {
	body, err := c.get(map[string]string{
		"function": "GLOBAL_QUOTE",
		"symbol":   symbol,
	})
	if err != nil {
		return nil, err
	}

	var r globalQuoteResponse
	if err := json.Unmarshal(body, &r); err != nil {
		return nil, fmt.Errorf("alphavantage quote parse: %w", err)
	}
	if r.GlobalQuote.Symbol == "" {
		return nil, fmt.Errorf("alphavantage: no quote data for %s", symbol)
	}

	price := parseFloat(r.GlobalQuote.Price)
	change := parseFloat(r.GlobalQuote.Change)
	changePct := parseChangePct(r.GlobalQuote.ChangePercentRaw)
	volume := parseInt64(r.GlobalQuote.Volume)

	return &models.Stock{
		Symbol:        symbol,
		Price:         price,
		Change:        change,
		ChangePercent: changePct,
		Volume:        volume,
		UpdatedAt:     time.Now(),
	}, nil
}

// ── GetHistory ────────────────────────────────────────────────────────────────

type dailyResponse struct {
	MetaData struct {
		Symbol string `json:"2. Symbol"`
	} `json:"Meta Data"`
	TimeSeries map[string]struct {
		Open   string `json:"1. open"`
		High   string `json:"2. high"`
		Low    string `json:"3. low"`
		Close  string `json:"4. close"`
		Volume string `json:"5. volume"`
	} `json:"Time Series (Daily)"`
}

// GetHistory implements datasource.DataSource.
// rangeStr is Yahoo-style ("1mo","3mo","6mo","1y","2y"); it is translated to an
// AlphaVantage outputsize and then trimmed client-side.
func (c *Client) GetHistory(symbol string, rangeStr string) ([]models.OHLCV, error) {
	outputsize := "full"
	if rangeStr == "1mo" || rangeStr == "3mo" {
		outputsize = "compact" // last 100 bars — sufficient for short ranges
	}

	body, err := c.get(map[string]string{
		"function":   "TIME_SERIES_DAILY",
		"symbol":     symbol,
		"outputsize": outputsize,
	})
	if err != nil {
		return nil, err
	}

	var r dailyResponse
	if err := json.Unmarshal(body, &r); err != nil {
		return nil, fmt.Errorf("alphavantage history parse: %w", err)
	}
	if len(r.TimeSeries) == 0 {
		return nil, fmt.Errorf("alphavantage: no history for %s", symbol)
	}

	// Collect and sort by date ascending
	type entry struct {
		date string
		ts   int64
		o, h, l, cl float64
		vol          int64
	}
	var entries []entry
	for dateStr, bar := range r.TimeSeries {
		t, err := time.Parse("2006-01-02", dateStr)
		if err != nil {
			continue
		}
		entries = append(entries, entry{
			date: dateStr,
			ts:   t.Unix(),
			o:    parseFloat(bar.Open),
			h:    parseFloat(bar.High),
			l:    parseFloat(bar.Low),
			cl:   parseFloat(bar.Close),
			vol:  parseInt64(bar.Volume),
		})
	}
	sort.Slice(entries, func(i, j int) bool { return entries[i].ts < entries[j].ts })

	// Trim to requested range
	cutoff := cutoffForRange(rangeStr)
	var ohlcvs []models.OHLCV
	for _, e := range entries {
		if e.ts < cutoff {
			continue
		}
		ohlcvs = append(ohlcvs, models.OHLCV{
			Timestamp: e.ts,
			Open:      e.o,
			High:      e.h,
			Low:       e.l,
			Close:     e.cl,
			Volume:    e.vol,
		})
	}
	return ohlcvs, nil
}

// ── GetOptionExpirations / GetOptionsForExpiry ────────────────────────────────

// realtimeOptionRow is one row returned by the AlphaVantage REALTIME_OPTIONS endpoint.
type realtimeOptionRow struct {
	ContractID     string `json:"contractID"`
	Symbol         string `json:"symbol"`
	Expiration     string `json:"expiration"`
	Strike         string `json:"strike"`
	Type           string `json:"type"` // "call" or "put"
	Last           string `json:"last"`
	Bid            string `json:"bid"`
	Ask            string `json:"ask"`
	Volume         string `json:"volume"`
	OpenInterest   string `json:"open_interest"`
	ImpliedVolatility string `json:"implied_volatility"`
}

type realtimeOptionsResponse struct {
	Data []realtimeOptionRow `json:"data"`
}

// GetOptionExpirations implements datasource.DataSource.
// Fetches the full options chain and returns unique expiry timestamps.
func (c *Client) GetOptionExpirations(symbol string) ([]int64, error) {
	rows, err := c.fetchRealtimeOptions(symbol, "")
	if err != nil {
		return nil, err
	}

	seen := map[int64]struct{}{}
	for _, row := range rows {
		ts := parseExpiry(row.Expiration)
		if ts > 0 {
			seen[ts] = struct{}{}
		}
	}

	expiries := make([]int64, 0, len(seen))
	for ts := range seen {
		expiries = append(expiries, ts)
	}
	sort.Slice(expiries, func(i, j int) bool { return expiries[i] < expiries[j] })
	return expiries, nil
}

// GetOptionsForExpiry implements datasource.DataSource.
func (c *Client) GetOptionsForExpiry(symbol string, expiry int64, stockPrice, riskFreeRate float64) (*models.OptionsChain, error) {
	// Format expiry as YYYY-MM-DD for AlphaVantage
	expiryStr := time.Unix(expiry, 0).UTC().Format("2006-01-02")

	rows, err := c.fetchRealtimeOptions(symbol, expiryStr)
	if err != nil {
		// Fall back to synthetic chain
		log.Printf("alphavantage: options unavailable for %s/%s (%v) — using synthetic chain", symbol, expiryStr, err)
		return c.syntheticChain(symbol, expiry, stockPrice, riskFreeRate), nil
	}
	if len(rows) == 0 {
		return c.syntheticChain(symbol, expiry, stockPrice, riskFreeRate), nil
	}

	chain := &models.OptionsChain{
		Symbol:      symbol,
		Expirations: []int64{expiry},
		UpdatedAt:   time.Now(),
	}

	now := time.Now()
	for _, row := range rows {
		ts := parseExpiry(row.Expiration)
		if ts == 0 {
			continue
		}
		expTime := time.Unix(ts, 0)
		dte := int(expTime.Sub(now).Hours() / 24)
		if dte <= 0 {
			continue
		}
		T := float64(dte) / 365.0

		strike := parseFloat(row.Strike)
		bid := parseFloat(row.Bid)
		ask := parseFloat(row.Ask)
		mid := (bid + ask) / 2
		spreadPct := 0.0
		if mid > 0 {
			spreadPct = (ask - bid) / mid * 100
		}

		contract := models.OptionContract{
			ContractSymbol:    row.ContractID,
			Strike:            strike,
			Currency:          "USD",
			LastPrice:         parseFloat(row.Last),
			Bid:               bid,
			Ask:               ask,
			Mid:               mid,
			Volume:            parseInt64(row.Volume),
			OpenInterest:      parseInt64(row.OpenInterest),
			ImpliedVolatility: parseFloat(row.ImpliedVolatility),
			Expiration:        ts,
			DTE:               dte,
			SpreadPct:         spreadPct,
			OptionType:        strings.ToLower(row.Type),
		}
		_ = T // used by enrichment layer in the service

		if contract.OptionType == "call" {
			chain.Calls = append(chain.Calls, contract)
		} else {
			chain.Puts = append(chain.Puts, contract)
		}
	}

	return chain, nil
}

// fetchRealtimeOptions calls the AlphaVantage REALTIME_OPTIONS endpoint.
// If expiryDate is empty, all expirations are returned.
func (c *Client) fetchRealtimeOptions(symbol, expiryDate string) ([]realtimeOptionRow, error) {
	params := map[string]string{
		"function": "REALTIME_OPTIONS",
		"symbol":   symbol,
	}
	if expiryDate != "" {
		params["date"] = expiryDate
	}

	body, err := c.get(params)
	if err != nil {
		return nil, err
	}

	var r realtimeOptionsResponse
	if err := json.Unmarshal(body, &r); err != nil {
		return nil, fmt.Errorf("alphavantage options parse: %w", err)
	}
	return r.Data, nil
}

// syntheticChain generates a Black-Scholes priced fallback chain for one expiry.
func (c *Client) syntheticChain(symbol string, expiry int64, stockPrice, riskFreeRate float64) *models.OptionsChain {
	now := time.Now()
	expTime := time.Unix(expiry, 0)
	dte := int(expTime.Sub(now).Hours() / 24)
	if dte <= 0 {
		return &models.OptionsChain{Symbol: symbol, UpdatedAt: now}
	}
	T := float64(dte) / 365.0

	// Use a reasonable default HV; the service layer will overwrite with real HV.
	hv := 0.25
	sigma := hv * 1.15

	chain := &models.OptionsChain{
		Symbol:      symbol,
		Expirations: []int64{expiry},
		IsSynthetic: true,
		UpdatedAt:   now,
	}

	// Generate strikes ±20% of spot in $5 increments
	step := 5.0
	minStrike := stockPrice * 0.80
	maxStrike := stockPrice * 1.20
	for k := minStrike; k <= maxStrike; k += step {
		strike := float64(int(k/step)) * step
		callPrice := bsmath.BSCall(stockPrice, strike, T, riskFreeRate, sigma)
		putPrice := bsmath.BSPut(stockPrice, strike, T, riskFreeRate, sigma)
		spread := callPrice * 0.08 // synthetic 8% spread

		chain.Calls = append(chain.Calls, models.OptionContract{
			ContractSymbol:    fmt.Sprintf("%s%s%08.0f", symbol, expTime.Format("060102"), strike*1000),
			Strike:            strike,
			Currency:          "USD",
			LastPrice:         callPrice,
			Bid:               callPrice - spread/2,
			Ask:               callPrice + spread/2,
			Mid:               callPrice,
			ImpliedVolatility: sigma,
			Expiration:        expiry,
			DTE:               dte,
			SpreadPct:         8.0,
			OptionType:        "call",
		})
		chain.Puts = append(chain.Puts, models.OptionContract{
			ContractSymbol:    fmt.Sprintf("%s%sP%08.0f", symbol, expTime.Format("060102"), strike*1000),
			Strike:            strike,
			Currency:          "USD",
			LastPrice:         putPrice,
			Bid:               putPrice - spread/2,
			Ask:               putPrice + spread/2,
			Mid:               putPrice,
			ImpliedVolatility: sigma,
			Expiration:        expiry,
			DTE:               dte,
			SpreadPct:         8.0,
			OptionType:        "put",
		})
	}
	return chain
}

// ── helpers ───────────────────────────────────────────────────────────────────

func parseFloat(s string) float64 {
	s = strings.TrimSpace(s)
	if s == "" || s == "N/A" {
		return 0
	}
	v, _ := strconv.ParseFloat(s, 64)
	return v
}

func parseInt64(s string) int64 {
	s = strings.TrimSpace(s)
	if s == "" || s == "N/A" {
		return 0
	}
	v, _ := strconv.ParseInt(s, 10, 64)
	return v
}

func parseChangePct(s string) float64 {
	s = strings.TrimSpace(strings.TrimSuffix(s, "%"))
	v, _ := strconv.ParseFloat(s, 64)
	return v
}

// parseExpiry converts "YYYY-MM-DD" to unix timestamp.
func parseExpiry(s string) int64 {
	t, err := time.Parse("2006-01-02", strings.TrimSpace(s))
	if err != nil {
		return 0
	}
	return t.Unix()
}

// cutoffForRange converts a Yahoo-style range string to a unix cutoff timestamp.
func cutoffForRange(rangeStr string) int64 {
	now := time.Now()
	switch rangeStr {
	case "1mo":
		return now.AddDate(0, -1, 0).Unix()
	case "3mo":
		return now.AddDate(0, -3, 0).Unix()
	case "6mo":
		return now.AddDate(0, -6, 0).Unix()
	case "1y":
		return now.AddDate(-1, 0, 0).Unix()
	default: // "2y"
		return now.AddDate(-2, 0, 0).Unix()
	}
}
