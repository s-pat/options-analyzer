package handlers

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/sohanpatel/options-analyzer/api/internal/services"
)

// TodayHandler serves the Today's Picks endpoint
type TodayHandler struct {
	svc *services.TodayService
}

// NewTodayHandler creates a TodayHandler
func NewTodayHandler(svc *services.TodayService) *TodayHandler {
	return &TodayHandler{svc: svc}
}

// GetOpportunities scans the liquid universe and returns top picks per cost band
func (h *TodayHandler) GetOpportunities(c *gin.Context) {
	opps, err := h.svc.GetOpportunities()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, opps)
}
