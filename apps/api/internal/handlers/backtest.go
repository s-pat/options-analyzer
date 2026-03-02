package handlers

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/sohanpatel/options-analyzer/api/internal/models"
	"github.com/sohanpatel/options-analyzer/api/internal/services"
)

// BacktestHandler handles backtesting endpoints
type BacktestHandler struct {
	svc *services.BacktestService
}

// NewBacktestHandler creates a new BacktestHandler
func NewBacktestHandler(svc *services.BacktestService) *BacktestHandler {
	return &BacktestHandler{svc: svc}
}

// RunBacktest executes a backtest from the request body
func (h *BacktestHandler) RunBacktest(c *gin.Context) {
	var req models.BacktestRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	result, err := h.svc.Run(req)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, result)
}
