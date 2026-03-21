// earnings.go — Earnings calendar service.
//
// Fetches upcoming earnings date and EPS estimates from Yahoo Finance for a
// given symbol. Results are cached for 30 minutes because earnings dates
// are published well in advance and change infrequently.
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
// Results are cached for 30 minutes.
func (s *EarningsService) GetEarnings(symbol string) (*models.EarningsEvent, error) {
	cacheKey := "earnings:" + symbol
	if cached, found := s.cache.Get(cacheKey); found {
		return cached.(*models.EarningsEvent), nil
	}

	s.mu.Lock()
	// Double-check after acquiring lock
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
