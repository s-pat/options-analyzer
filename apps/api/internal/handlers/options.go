package handlers

import (
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	"github.com/sohanpatel/options-analyzer/api/internal/models"
	"github.com/sohanpatel/options-analyzer/api/internal/services"
)

// OptionsHandler handles options chain and recommendation endpoints
type OptionsHandler struct {
	svc *services.OptionsService
}

// NewOptionsHandler creates a new OptionsHandler
func NewOptionsHandler(svc *services.OptionsService) *OptionsHandler {
	return &OptionsHandler{svc: svc}
}

// GetOptionsChain returns the full options chain for a stock
func (h *OptionsHandler) GetOptionsChain(c *gin.Context) {
	symbol := c.Param("symbol")
	chain, err := h.svc.GetOptionsChain(symbol)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, chain)
}

// GetRecommendations returns top scored long call/put recommendations
func (h *OptionsHandler) GetRecommendations(c *gin.Context) {
	limitStr := c.DefaultQuery("limit", "20")
	limit, err := strconv.Atoi(limitStr)
	if err != nil || limit <= 0 || limit > 100 {
		limit = 20
	}

	recs, err := h.svc.GetRecommendations(limit)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"recommendations": recs, "total": len(recs)})
}

// GetFilteredChain returns an options chain filtered by capital and risk level.
// Query params: maxCapital (float), riskLevel (1-3), onlyCall (bool), onlyPut (bool)
func (h *OptionsHandler) GetFilteredChain(c *gin.Context) {
	symbol := c.Param("symbol")

	var f models.OptionsFilter
	if v := c.Query("maxCapital"); v != "" {
		if parsed, err := strconv.ParseFloat(v, 64); err == nil && parsed > 0 {
			f.MaxCapital = parsed
		}
	}
	if v := c.Query("riskLevel"); v != "" {
		if parsed, err := strconv.Atoi(v); err == nil && parsed >= 1 && parsed <= 3 {
			f.RiskLevel = parsed
		}
	}
	f.OnlyCall = c.Query("onlyCall") == "true"
	f.OnlyPut = c.Query("onlyPut") == "true"

	chain, err := h.svc.GetFilteredChain(symbol, f)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, chain)
}

// AnalyzeOption returns a full recommendation + thesis for a specific option
// Query params: type=call|put, strike=150.0, expiration=<unix timestamp>
func (h *OptionsHandler) AnalyzeOption(c *gin.Context) {
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

	analysis, err := h.svc.AnalyzeOption(symbol, optType, strike, expiration)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, analysis)
}
