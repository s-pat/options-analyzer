package handlers

import (
	"net/http"
	"sync"

	"github.com/gin-gonic/gin"
	"github.com/sohanpatel/options-analyzer/api/internal/models"
	"github.com/sohanpatel/options-analyzer/api/internal/yahoo"
)

// MarketHandler handles market overview endpoints
type MarketHandler struct {
	client *yahoo.Client
}

// NewMarketHandler creates a new MarketHandler
func NewMarketHandler(client *yahoo.Client) *MarketHandler {
	return &MarketHandler{client: client}
}

var indices = []struct {
	Symbol string
	Name   string
}{
	{"SPY", "S&P 500 ETF"},
	{"QQQ", "Nasdaq 100 ETF"},
	{"DIA", "Dow Jones ETF"},
	{"IWM", "Russell 2000 ETF"},
}

var sectorETFs = []struct {
	ETF    string
	Sector string
}{
	{"XLK", "Technology"},
	{"XLV", "Healthcare"},
	{"XLF", "Financials"},
	{"XLY", "Consumer Discretionary"},
	{"XLP", "Consumer Staples"},
	{"XLE", "Energy"},
	{"XLI", "Industrials"},
	{"XLC", "Communication Services"},
	{"XLU", "Utilities"},
	{"XLRE", "Real Estate"},
	{"XLB", "Materials"},
}

// WarmCache pre-fetches all market quotes so the first real request is instant.
// Called once on server startup as a background goroutine.
func (h *MarketHandler) WarmCache() {
	var wg sync.WaitGroup
	for _, idx := range indices {
		wg.Add(1)
		go func(symbol string) {
			defer wg.Done()
			h.client.GetQuote(symbol) //nolint:errcheck — cache side-effect only
		}(idx.Symbol)
	}
	for _, sec := range sectorETFs {
		wg.Add(1)
		go func(symbol string) {
			defer wg.Done()
			h.client.GetQuote(symbol) //nolint:errcheck — cache side-effect only
		}(sec.ETF)
	}
	wg.Wait()
}

// GetOverview returns market indices + sector performance.
// Fetches all 15 symbols concurrently; the Yahoo client's semaphore caps
// simultaneous outgoing requests so we stay within its concurrency limit.
func (h *MarketHandler) GetOverview(c *gin.Context) {
	// Indices — fetch concurrently, preserve order
	mktIndices := make([]models.MarketIndex, len(indices))
	var idxWg sync.WaitGroup
	for i, idx := range indices {
		idxWg.Add(1)
		go func(i int, symbol, name string) {
			defer idxWg.Done()
			stock, err := h.client.GetQuote(symbol)
			if err != nil {
				return
			}
			trend := "neutral"
			if stock.ChangePercent > 0.3 {
				trend = "bullish"
			} else if stock.ChangePercent < -0.3 {
				trend = "bearish"
			}
			mktIndices[i] = models.MarketIndex{
				Symbol:        symbol,
				Name:          name,
				Price:         stock.Price,
				Change:        stock.Change,
				ChangePercent: stock.ChangePercent,
				Trend:         trend,
			}
		}(i, idx.Symbol, idx.Name)
	}
	idxWg.Wait()

	// Sectors — fetch concurrently, preserve order
	sectors := make([]models.SectorPerformance, len(sectorETFs))
	var secWg sync.WaitGroup
	for i, sec := range sectorETFs {
		secWg.Add(1)
		go func(i int, etf, sector string) {
			defer secWg.Done()
			stock, err := h.client.GetQuote(etf)
			if err != nil {
				return
			}
			sectors[i] = models.SectorPerformance{
				Sector:        sector,
				ETF:           etf,
				ChangePercent: stock.ChangePercent,
			}
		}(i, sec.ETF, sec.Sector)
	}
	secWg.Wait()

	// Filter out zero-value entries from any failed fetches
	var validIndices []models.MarketIndex
	for _, idx := range mktIndices {
		if idx.Symbol != "" {
			validIndices = append(validIndices, idx)
		}
	}
	var validSectors []models.SectorPerformance
	for _, sec := range sectors {
		if sec.Sector != "" {
			validSectors = append(validSectors, sec)
		}
	}

	c.JSON(http.StatusOK, models.MarketOverview{
		Indices: validIndices,
		Sectors: validSectors,
	})
}
