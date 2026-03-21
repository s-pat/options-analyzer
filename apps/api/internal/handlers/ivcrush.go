package handlers

import (
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	"github.com/sohanpatel/options-analyzer/api/internal/services"
)

// IVCrushHandler handles the IV crush simulation endpoint.
type IVCrushHandler struct {
	svc *services.IVCrushService
}

// NewIVCrushHandler creates a new IVCrushHandler.
func NewIVCrushHandler(svc *services.IVCrushService) *IVCrushHandler {
	return &IVCrushHandler{svc: svc}
}

// GetIVCrush estimates the IV crush impact on a specific option contract.
// Query params: type=call|put, strike=150.0, expiration=<unix timestamp>
func (h *IVCrushHandler) GetIVCrush(c *gin.Context) {
	symbol := c.Param("symbol")

	optType := c.DefaultQuery("type", "call")
	if optType != "call" && optType != "put" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "type must be 'call' or 'put'"})
		return
	}

	strikeStr := c.Query("strike")
	strike, err := strconv.ParseFloat(strikeStr, 64)
	if err != nil || strike <= 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid strike"})
		return
	}

	expStr := c.Query("expiration")
	expiration, err := strconv.ParseInt(expStr, 10, 64)
	if err != nil || expiration <= 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid expiration unix timestamp"})
		return
	}

	estimate, err := h.svc.EstimateIVCrush(symbol, optType, strike, expiration)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, estimate)
}
