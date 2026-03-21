package handlers

import (
	"fmt"
	"net/http"
	"time"

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

// GetOpportunities returns the cached top picks. The result is pre-computed by
// a background goroutine (refreshed every ~22 min), so this is nearly instant
// after the first server startup scan completes.
func (h *TodayHandler) GetOpportunities(c *gin.Context) {
	opps, err := h.svc.GetOpportunities()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	age := int(time.Since(opps.GeneratedAt).Seconds())
	c.Header("Cache-Control", "public, max-age=1200") // clients may cache for 20 min
	c.Header("X-Cache-Age", fmt.Sprintf("%ds", age))
	c.Header("X-Generated-At", opps.GeneratedAt.UTC().Format(time.RFC3339))
	c.JSON(http.StatusOK, opps)
}
