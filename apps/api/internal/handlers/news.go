package handlers

import (
	"net/http"
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/sohanpatel/options-analyzer/api/internal/services"
)

// NewsHandler handles news endpoints
type NewsHandler struct {
	svc *services.NewsService
}

// NewNewsHandler creates a new NewsHandler
func NewNewsHandler(svc *services.NewsService) *NewsHandler {
	return &NewsHandler{svc: svc}
}

// GetStockNews returns classified news for a stock symbol
func (h *NewsHandler) GetStockNews(c *gin.Context) {
	symbol := strings.ToUpper(c.Param("symbol"))
	if symbol == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "symbol is required"})
		return
	}

	news, err := h.svc.GetNews(symbol)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, news)
}
