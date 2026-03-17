package handlers

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/sohanpatel/options-analyzer/api/internal/datasource"
	"github.com/sohanpatel/options-analyzer/api/internal/models"
)

// MarketHandler handles market overview endpoints
type MarketHandler struct {
	client datasource.DataSource
}

// NewMarketHandler creates a new MarketHandler
func NewMarketHandler(client datasource.DataSource) *MarketHandler {
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

// GetOverview returns market indices + sector performance
func (h *MarketHandler) GetOverview(c *gin.Context) {
	var mktIndices []models.MarketIndex
	for _, idx := range indices {
		stock, err := h.client.GetQuote(idx.Symbol)
		if err != nil {
			continue
		}
		trend := "neutral"
		if stock.ChangePercent > 0.3 {
			trend = "bullish"
		} else if stock.ChangePercent < -0.3 {
			trend = "bearish"
		}
		mktIndices = append(mktIndices, models.MarketIndex{
			Symbol:        idx.Symbol,
			Name:          idx.Name,
			Price:         stock.Price,
			Change:        stock.Change,
			ChangePercent: stock.ChangePercent,
			Trend:         trend,
		})
	}

	var sectors []models.SectorPerformance
	for _, sec := range sectorETFs {
		stock, err := h.client.GetQuote(sec.ETF)
		if err != nil {
			continue
		}
		sectors = append(sectors, models.SectorPerformance{
			Sector:        sec.Sector,
			ETF:           sec.ETF,
			ChangePercent: stock.ChangePercent,
		})
	}

	c.JSON(http.StatusOK, models.MarketOverview{
		Indices: mktIndices,
		Sectors: sectors,
	})
}
