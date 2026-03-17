// Package handlers implements the HTTP request handlers (controllers) for the
// Options Lab REST API. Each handler:
//   - Validates path/query parameters
//   - Delegates business logic to a service
//   - Returns JSON or an error response
//
// All handlers follow Gin's context-based request/response pattern.
// Error responses use the shape {"error": "message"} with an appropriate
// HTTP status code (400 Bad Request, 500 Internal Server Error).
package handlers

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/sohanpatel/options-analyzer/api/internal/datasource"
	"github.com/sohanpatel/options-analyzer/api/internal/services"
)

// StocksHandler handles stock data endpoints
type StocksHandler struct {
	sp500  *services.SP500Service
	client datasource.DataSource
}

// NewStocksHandler creates a new StocksHandler
func NewStocksHandler(sp500 *services.SP500Service, client datasource.DataSource) *StocksHandler {
	return &StocksHandler{sp500: sp500, client: client}
}

// ListStocks returns all S&P 500 stocks with IV metrics
func (h *StocksHandler) ListStocks(c *gin.Context) {
	stocks, err := h.sp500.GetAllStocks()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"stocks": stocks, "total": len(stocks)})
}

// GetStock returns a single stock with full metrics
func (h *StocksHandler) GetStock(c *gin.Context) {
	symbol := c.Param("symbol")
	stock, err := h.sp500.GetStock(symbol)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
		return
	}

	// Look up name/sector from our list
	for _, s := range services.SP500Symbols {
		if s.Symbol == symbol {
			stock.Name = s.Name
			stock.Sector = s.Sector
			break
		}
	}

	c.JSON(http.StatusOK, stock)
}

// GetHistory returns OHLCV history for a stock
func (h *StocksHandler) GetHistory(c *gin.Context) {
	symbol := c.Param("symbol")
	rangeParam := c.DefaultQuery("range", "1y")

	// Validate range
	validRanges := map[string]bool{
		"1mo": true, "3mo": true, "6mo": true, "1y": true, "2y": true,
	}
	if !validRanges[rangeParam] {
		rangeParam = "1y"
	}

	history, err := h.client.GetHistory(symbol, rangeParam)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"symbol": symbol, "history": history})
}
