package yahoo

import (
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"net/http/cookiejar"
	"net/url"
	"strings"
	"sync"
	"time"

	"github.com/patrickmn/go-cache"
	"github.com/sohanpatel/options-analyzer/api/internal/models"
)

const (
	baseURL1   = "https://query1.finance.yahoo.com"
	baseURL2   = "https://query2.finance.yahoo.com"
	rateDelay  = 100 * time.Millisecond
	cacheTTL   = 5 * time.Minute
	cacheClean = 10 * time.Minute
	crumbTTL   = 55 * time.Minute // rotate crumb every 55 minutes
)

// Client is a rate-limited Yahoo Finance HTTP client with crumb auth and caching
type Client struct {
	http        *http.Client
	cache       *cache.Cache
	mu          sync.Mutex // protects crumb state only
	rateMu      sync.Mutex // protects rate-limit state; kept separate so crumb
	// refreshes are never blocked while a goroutine sleeps in rateLimit().
	lastCall    time.Time
	crumb       string
	crumbExpiry time.Time
}

// NewClient creates a new Yahoo Finance client and bootstraps crumb auth
func NewClient() *Client {
	jar, _ := cookiejar.New(nil)
	c := &Client{
		http: &http.Client{
			Timeout: 15 * time.Second,
			Jar:     jar,
			Transport: &http.Transport{
				MaxIdleConns:        100,
				MaxIdleConnsPerHost: 10,
				IdleConnTimeout:     90 * time.Second,
			},
		},
		cache: cache.New(cacheTTL, cacheClean),
	}
	// Bootstrap crumb in the background so first real request is fast
	go func() {
		if err := c.refreshCrumb(); err != nil {
			log.Printf("yahoo: crumb bootstrap failed: %v (options will use synthetic fallback)", err)
		}
	}()
	return c
}

// refreshCrumb fetches a fresh crumb + cookie from Yahoo Finance
func (c *Client) refreshCrumb() error {
	c.mu.Lock()
	defer c.mu.Unlock()

	// Step 1: visit Yahoo Finance to get session cookies
	req, _ := http.NewRequest("GET", "https://finance.yahoo.com/", nil)
	c.setHeaders(req)
	req.Header.Set("Accept", "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8")
	resp, err := c.http.Do(req)
	if err != nil {
		return fmt.Errorf("cookie fetch: %w", err)
	}
	resp.Body.Close()

	// Small pause to avoid rate limiting
	time.Sleep(2 * time.Second)

	// Step 2: fetch crumb using the cookies we just got
	for _, base := range []string{baseURL2, baseURL1} {
		req2, _ := http.NewRequest("GET", base+"/v1/test/getcrumb", nil)
		c.setHeaders(req2)
		resp2, err := c.http.Do(req2)
		if err != nil {
			continue
		}
		body, _ := io.ReadAll(resp2.Body)
		resp2.Body.Close()

		crumb := strings.TrimSpace(string(body))
		if len(crumb) > 3 && !strings.HasPrefix(crumb, "{") && !strings.HasPrefix(crumb, "Too") {
			c.crumb = crumb
			c.crumbExpiry = time.Now().Add(crumbTTL)
			log.Printf("yahoo: crumb acquired (%d chars)", len(crumb))
			return nil
		}
	}
	return fmt.Errorf("could not obtain valid crumb")
}

// getCrumb returns a valid crumb, refreshing if stale
func (c *Client) getCrumb() (string, error) {
	c.mu.Lock()
	crumb := c.crumb
	expiry := c.crumbExpiry
	c.mu.Unlock()

	if crumb != "" && time.Now().Before(expiry) {
		return crumb, nil
	}
	if err := c.refreshCrumb(); err != nil {
		return "", err
	}
	c.mu.Lock()
	defer c.mu.Unlock()
	return c.crumb, nil
}

func (c *Client) setHeaders(req *http.Request) {
	req.Header.Set("User-Agent", "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36")
	req.Header.Set("Accept-Language", "en-US,en;q=0.9")
	// Do NOT set Accept-Encoding manually — Go's Transport adds it automatically
	// and handles transparent decompression. Setting it manually bypasses that.
}

// rateLimit enforces minimum delay between requests.
// Uses rateMu (not mu) so crumb operations are never blocked during the sleep.
func (c *Client) rateLimit() {
	c.rateMu.Lock()
	defer c.rateMu.Unlock()
	elapsed := time.Since(c.lastCall)
	if elapsed < rateDelay {
		time.Sleep(rateDelay - elapsed)
	}
	c.lastCall = time.Now()
}

// get performs a GET request with caching
func (c *Client) get(rawURL string) ([]byte, error) {
	if cached, found := c.cache.Get(rawURL); found {
		return cached.([]byte), nil
	}

	c.rateLimit()

	req, err := http.NewRequest("GET", rawURL, nil)
	if err != nil {
		return nil, err
	}
	c.setHeaders(req)
	req.Header.Set("Accept", "application/json")

	resp, err := c.http.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	if resp.StatusCode == http.StatusUnauthorized || resp.StatusCode == 429 {
		return nil, fmt.Errorf("yahoo finance returned %d for %s", resp.StatusCode, rawURL)
	}
	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("yahoo finance returned %d for %s", resp.StatusCode, rawURL)
	}

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, err
	}

	c.cache.Set(rawURL, body, cacheTTL)
	return body, nil
}

// getWithCrumb performs a GET request that requires crumb auth
func (c *Client) getWithCrumb(rawURL string) ([]byte, error) {
	crumb, err := c.getCrumb()
	if err != nil {
		return nil, fmt.Errorf("no crumb: %w", err)
	}

	separator := "?"
	if strings.Contains(rawURL, "?") {
		separator = "&"
	}
	fullURL := rawURL + separator + "crumb=" + url.QueryEscape(crumb)

	// Check cache with crumb-aware key
	cacheKey := rawURL + "|crumbed"
	if cached, found := c.cache.Get(cacheKey); found {
		return cached.([]byte), nil
	}

	c.rateLimit()

	req, err := http.NewRequest("GET", fullURL, nil)
	if err != nil {
		return nil, err
	}
	c.setHeaders(req)
	req.Header.Set("Accept", "application/json")

	resp, err := c.http.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	body, _ := io.ReadAll(resp.Body)

	// Check for crumb-related errors and retry once with fresh crumb
	if resp.StatusCode == http.StatusUnauthorized || (resp.StatusCode == http.StatusOK && isUnauthorizedBody(body)) {
		log.Printf("yahoo: crumb invalid, refreshing...")
		c.mu.Lock()
		c.crumb = ""
		c.mu.Unlock()

		newCrumb, err := c.getCrumb()
		if err != nil {
			return nil, fmt.Errorf("crumb refresh failed: %w", err)
		}
		fullURL2 := rawURL + separator + "crumb=" + url.QueryEscape(newCrumb)
		req2, _ := http.NewRequest("GET", fullURL2, nil)
		c.setHeaders(req2)
		req2.Header.Set("Accept", "application/json")
		resp2, err := c.http.Do(req2)
		if err != nil {
			return nil, err
		}
		defer resp2.Body.Close()
		body, err = io.ReadAll(resp2.Body)
		if err != nil {
			return nil, err
		}
		if isUnauthorizedBody(body) {
			return nil, fmt.Errorf("yahoo options unauthorized after crumb refresh")
		}
	}

	if resp.StatusCode != http.StatusOK && resp.StatusCode != 0 {
		return nil, fmt.Errorf("yahoo finance returned %d", resp.StatusCode)
	}

	c.cache.Set(cacheKey, body, cacheTTL)
	return body, nil
}

func isUnauthorizedBody(body []byte) bool {
	s := string(body)
	return strings.Contains(s, `"Unauthorized"`) || strings.Contains(s, `"Invalid Crumb"`) || strings.Contains(s, "Too Many")
}

// --- Yahoo Finance response types ---

type chartResponse struct {
	Chart struct {
		Result []struct {
			Meta struct {
				Symbol             string  `json:"symbol"`
				RegularMarketPrice float64 `json:"regularMarketPrice"`
				PreviousClose      float64 `json:"chartPreviousClose"`
				Currency           string  `json:"currency"`
			} `json:"meta"`
			Timestamp  []int64 `json:"timestamp"`
			Indicators struct {
				Quote []struct {
					Open   []float64 `json:"open"`
					High   []float64 `json:"high"`
					Low    []float64 `json:"low"`
					Close  []float64 `json:"close"`
					Volume []int64   `json:"volume"`
				} `json:"quote"`
			} `json:"indicators"`
		} `json:"result"`
		Error interface{} `json:"error"`
	} `json:"chart"`
}

// OptionsResponse is the parsed Yahoo v7 options chain
type OptionsResponse struct {
	OptionChain struct {
		Result []struct {
			ExpirationDates []int64 `json:"expirationDates"`
			Options         []struct {
				ExpirationDate int64       `json:"expirationDate"`
				Calls          []RawOption `json:"calls"`
				Puts           []RawOption `json:"puts"`
			} `json:"options"`
		} `json:"result"`
		Error interface{} `json:"error"`
	} `json:"optionChain"`
}

// RawOption is a single Yahoo Finance option contract
type RawOption struct {
	ContractSymbol    string  `json:"contractSymbol"`
	Strike            float64 `json:"strike"`
	Currency          string  `json:"currency"`
	LastPrice         float64 `json:"lastPrice"`
	Bid               float64 `json:"bid"`
	Ask               float64 `json:"ask"`
	Volume            int64   `json:"volume"`
	OpenInterest      int64   `json:"openInterest"`
	ImpliedVolatility float64 `json:"impliedVolatility"`
	Expiration        int64   `json:"expiration"`
}

// GetQuote fetches current price data for a symbol
func (c *Client) GetQuote(symbol string) (*models.Stock, error) {
	rawURL := fmt.Sprintf("%s/v8/finance/chart/%s?interval=1d&range=1d", baseURL1, symbol)
	body, err := c.get(rawURL)
	if err != nil {
		return nil, err
	}

	var resp chartResponse
	if err := json.Unmarshal(body, &resp); err != nil {
		return nil, err
	}
	if len(resp.Chart.Result) == 0 {
		return nil, fmt.Errorf("no data for symbol %s", symbol)
	}

	r := resp.Chart.Result[0]
	price := r.Meta.RegularMarketPrice
	prevClose := r.Meta.PreviousClose
	if prevClose == 0 {
		prevClose = price
	}
	change := price - prevClose
	changePct := 0.0
	if prevClose != 0 {
		changePct = (change / prevClose) * 100
	}

	return &models.Stock{
		Symbol:        symbol,
		Price:         price,
		Change:        change,
		ChangePercent: changePct,
		UpdatedAt:     time.Now(),
	}, nil
}

// GetHistory fetches historical OHLCV data for a symbol
func (c *Client) GetHistory(symbol string, rangeStr string) ([]models.OHLCV, error) {
	rawURL := fmt.Sprintf("%s/v8/finance/chart/%s?interval=1d&range=%s", baseURL1, symbol, rangeStr)
	body, err := c.get(rawURL)
	if err != nil {
		return nil, err
	}

	var resp chartResponse
	if err := json.Unmarshal(body, &resp); err != nil {
		return nil, err
	}
	if len(resp.Chart.Result) == 0 {
		return nil, fmt.Errorf("no history for symbol %s", symbol)
	}

	r := resp.Chart.Result[0]
	if len(r.Indicators.Quote) == 0 {
		return nil, fmt.Errorf("no quote data for symbol %s", symbol)
	}

	q := r.Indicators.Quote[0]
	var ohlcvs []models.OHLCV
	for i, ts := range r.Timestamp {
		if i >= len(q.Close) || i >= len(q.Open) {
			break
		}
		if q.Close[i] == 0 {
			continue
		}
		vol := int64(0)
		if i < len(q.Volume) {
			vol = q.Volume[i]
		}
		ohlcvs = append(ohlcvs, models.OHLCV{
			Timestamp: ts,
			Open:      q.Open[i],
			High:      q.High[i],
			Low:       q.Low[i],
			Close:     q.Close[i],
			Volume:    vol,
		})
	}
	return ohlcvs, nil
}

// GetOptionsChain fetches the full options chain for a symbol using crumb auth.
// Returns (response, isSynthetic, error).
func (c *Client) GetOptionsChain(symbol string, expiry int64) (*OptionsResponse, bool, error) {
	rawURL := fmt.Sprintf("%s/v7/finance/options/%s", baseURL2, symbol)
	if expiry > 0 {
		rawURL += fmt.Sprintf("?date=%d", expiry)
	}

	body, err := c.getWithCrumb(rawURL)
	if err != nil {
		return nil, false, fmt.Errorf("options fetch: %w", err)
	}

	var resp OptionsResponse
	if err := json.Unmarshal(body, &resp); err != nil {
		return nil, false, fmt.Errorf("options parse: %w", err)
	}

	// Check if Yahoo returned an error result
	if resp.OptionChain.Error != nil || len(resp.OptionChain.Result) == 0 {
		return nil, false, fmt.Errorf("yahoo options: empty or error result")
	}

	return &resp, false, nil
}

// ParseOptionsChain converts raw Yahoo options data into model contracts
func ParseOptionsChain(symbol string, raw *OptionsResponse, stockPrice float64, riskFreeRate float64) *models.OptionsChain {
	chain := &models.OptionsChain{
		Symbol:    symbol,
		UpdatedAt: time.Now(),
	}

	if len(raw.OptionChain.Result) == 0 {
		return chain
	}

	r := raw.OptionChain.Result[0]
	chain.Expirations = r.ExpirationDates

	now := time.Now()
	for _, opt := range r.Options {
		expTime := time.Unix(opt.ExpirationDate, 0)
		dte := int(expTime.Sub(now).Hours() / 24)
		T := float64(dte) / 365.0
		if T <= 0 {
			continue
		}
		for _, raw := range opt.Calls {
			chain.Calls = append(chain.Calls, convertOption(raw, "call", T, dte))
		}
		for _, raw := range opt.Puts {
			chain.Puts = append(chain.Puts, convertOption(raw, "put", T, dte))
		}
	}

	return chain
}

func convertOption(raw RawOption, optType string, T float64, dte int) models.OptionContract {
	mid := (raw.Bid + raw.Ask) / 2
	spreadPct := 0.0
	if mid > 0 {
		spreadPct = (raw.Ask - raw.Bid) / mid * 100
	}
	return models.OptionContract{
		ContractSymbol:    raw.ContractSymbol,
		Strike:            raw.Strike,
		Currency:          raw.Currency,
		LastPrice:         raw.LastPrice,
		Bid:               raw.Bid,
		Ask:               raw.Ask,
		Mid:               mid,
		Volume:            raw.Volume,
		OpenInterest:      raw.OpenInterest,
		ImpliedVolatility: raw.ImpliedVolatility,
		Expiration:        raw.Expiration,
		DTE:               dte,
		SpreadPct:         spreadPct,
		OptionType:        optType,
	}
}
