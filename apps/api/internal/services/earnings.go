// earnings.go — Earnings calendar service.
package services

import (
	"sync"
	"time"

	"github.com/patrickmn/go-cache"
	"github.com/sohanpatel/options-analyzer/api/internal/models"
	"github.com/sohanpatel/options-analyzer/api/internal/yahoo"
)

const earningsCacheTTL = 30 * time.Minute

// EarningsService fetches earnings calendar data
type EarningsService struct {
	client *yahoo.Client
	cache  *cache.Cache
	mu     sync.Mutex
}

// NewEarningsService creates a new EarningsService
func NewEarningsService(client *yahoo.Client) *EarningsService {
	return &EarningsService{
		client: client,
		cache:  cache.New(earningsCacheTTL, 60*time.Minute),
	}
}

// GetEarnings returns the next earnings event for the given symbol.
func (s *EarningsService) GetEarnings(symbol string) (*models.EarningsEvent, error) {
	cacheKey := "earnings:" + symbol
	if cached, found := s.cache.Get(cacheKey); found {
		return cached.(*models.EarningsEvent), nil
	}

	s.mu.Lock()
	if cached, found := s.cache.Get(cacheKey); found {
		s.mu.Unlock()
		return cached.(*models.EarningsEvent), nil
	}
	s.mu.Unlock()

	event, err := s.client.GetEarnings(symbol)
	if err != nil {
		return nil, err
	}

	s.cache.Set(cacheKey, event, earningsCacheTTL)
	return event, nil
}
