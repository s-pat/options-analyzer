package handlers

import (
	"net/http"
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/sohanpatel/options-analyzer/api/internal/services"
)

// EarningsHandler handles earnings calendar endpoints
type EarningsHandler struct {
	svc *services.EarningsService
}

// NewEarningsHandler creates a new EarningsHandler
func NewEarningsHandler(svc *services.EarningsService) *EarningsHandler {
	return &EarningsHandler{svc: svc}
}

// GetEarnings returns the upcoming earnings event for a stock symbol
func (h *EarningsHandler) GetEarnings(c *gin.Context) {
	symbol := strings.ToUpper(c.Param("symbol"))
	if symbol == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "symbol is required"})
		return
	}

	event, err := h.svc.GetEarnings(symbol)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, event)
}
