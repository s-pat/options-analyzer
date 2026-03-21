// news.go — News fetching and sentiment classification service.
//
// Fetches recent news articles from Yahoo Finance for a given symbol and
// classifies each headline into:
//   - Sentiment: bullish, bearish, neutral
//   - Catalyst:  earnings, fda, m&a, upgrade, downgrade, macro, or ""
//
// Classification is keyword-based (no external AI calls) so it runs
// synchronously and adds no latency beyond the Yahoo Finance fetch.
package services

import (
	"strings"
	"sync"
	"time"

	"github.com/patrickmn/go-cache"
	"github.com/sohanpatel/options-analyzer/api/internal/models"
	"github.com/sohanpatel/options-analyzer/api/internal/yahoo"
)

const newsCacheTTL = 10 * time.Minute

// NewsService fetches and classifies stock news
type NewsService struct {
	client *yahoo.Client
	cache  *cache.Cache
	mu     sync.Mutex
}

// NewNewsService creates a new NewsService
func NewNewsService(client *yahoo.Client) *NewsService {
	return &NewsService{
		client: client,
		cache:  cache.New(newsCacheTTL, 20*time.Minute),
	}
}

// GetNews returns classified news items for the given symbol.
// Results are cached for 10 minutes to limit Yahoo Finance API calls.
func (s *NewsService) GetNews(symbol string) (*models.StockNews, error) {
	cacheKey := "news:" + symbol
	if cached, found := s.cache.Get(cacheKey); found {
		return cached.(*models.StockNews), nil
	}

	s.mu.Lock()
	// Double-check after acquiring lock
	if cached, found := s.cache.Get(cacheKey); found {
		s.mu.Unlock()
		return cached.(*models.StockNews), nil
	}
	s.mu.Unlock()

	rawArticles, err := s.client.GetNews(symbol, 10)
	if err != nil {
		return nil, err
	}

	var items []models.NewsItem
	bullish, bearish, neutral := 0, 0, 0

	for _, a := range rawArticles {
		sentiment, catalyst, catalystLabel := classify(a.Title)
		item := models.NewsItem{
			UUID:          a.UUID,
			Title:         a.Title,
			Publisher:     a.Publisher,
			Link:          a.Link,
			PublishedAt:   a.PublishedAt,
			Sentiment:     sentiment,
			Catalyst:      catalyst,
			CatalystLabel: catalystLabel,
		}
		items = append(items, item)
		switch sentiment {
		case models.SentimentBullish:
			bullish++
		case models.SentimentBearish:
			bearish++
		default:
			neutral++
		}
	}

	overall := models.SentimentNeutral
	if bullish > bearish && bullish > neutral {
		overall = models.SentimentBullish
	} else if bearish > bullish && bearish > neutral {
		overall = models.SentimentBearish
	} else if bullish > bearish {
		overall = models.SentimentBullish
	}

	result := &models.StockNews{
		Symbol:           symbol,
		Items:            items,
		OverallSentiment: overall,
		BullishCount:     bullish,
		BearishCount:     bearish,
		NeutralCount:     neutral,
		UpdatedAt:        time.Now(),
	}

	s.cache.Set(cacheKey, result, newsCacheTTL)
	return result, nil
}

// --- classification helpers ---

// bullish keywords — presence suggests positive news for the stock
var bullishWords = []string{
	"beat", "beats", "surpasses", "record", "surge", "soar", "rally", "upgrade",
	"buy", "outperform", "overweight", "strong buy", "raised", "boosts", "rises",
	"jumps", "gains", "profit", "approval", "approved", "partnership", "deal",
	"expansion", "growth", "dividend", "buyback", "acquisition targets",
}

// bearish keywords — presence suggests negative news for the stock
var bearishWords = []string{
	"miss", "misses", "downgrade", "sell", "underperform", "underweight",
	"cut", "cuts", "lowered", "falls", "drops", "decline", "loss", "losses",
	"lawsuit", "investigation", "recall", "warning", "risk", "concern",
	"layoff", "layoffs", "restructuring", "disappoints", "weak", "fraud",
	"probe", "fine", "penalty", "bankruptcy", "default",
}

// catalyst keyword sets mapped to catalyst type and label
var catalystPatterns = []struct {
	keywords []string
	catalyst models.NewsCatalyst
	label    string
}{
	{[]string{"earnings", "revenue", "eps", "quarterly", "q1", "q2", "q3", "q4", "guidance", "forecast"}, models.CatalystEarnings, "Earnings"},
	{[]string{"fda", "drug", "trial", "clinical", "approval", "regulatory", "nda", "bla", "phase"}, models.CatalystFDA, "FDA/Regulatory"},
	{[]string{"acquisition", "merger", "buyout", "takeover", "acquire", "merges with", "deal with"}, models.CatalystMA, "M&A"},
	{[]string{"upgrade", "overweight", "outperform", "strong buy", "price target raised"}, models.CatalystUpgrade, "Analyst Upgrade"},
	{[]string{"downgrade", "underweight", "underperform", "sell rating", "price target cut", "price target lowered"}, models.CatalystDowngrade, "Analyst Downgrade"},
	{[]string{"fed", "federal reserve", "interest rate", "inflation", "cpi", "gdp", "recession", "tariff", "trade war"}, models.CatalystMacro, "Macro"},
}

// classify returns (sentiment, catalyst, catalystLabel) for a news headline
func classify(title string) (models.NewsSentiment, models.NewsCatalyst, string) {
	lower := strings.ToLower(title)

	// Detect catalyst first (most specific)
	catalyst := models.CatalystNone
	catalystLabel := ""
	for _, p := range catalystPatterns {
		for _, kw := range p.keywords {
			if strings.Contains(lower, kw) {
				catalyst = p.catalyst
				catalystLabel = p.label
				break
			}
		}
		if catalyst != models.CatalystNone {
			break
		}
	}

	// Catalyst-driven sentiment overrides for upgrades/downgrades
	if catalyst == models.CatalystUpgrade {
		return models.SentimentBullish, catalyst, catalystLabel
	}
	if catalyst == models.CatalystDowngrade {
		return models.SentimentBearish, catalyst, catalystLabel
	}

	// Count keyword matches
	bull, bear := 0, 0
	for _, kw := range bullishWords {
		if strings.Contains(lower, kw) {
			bull++
		}
	}
	for _, kw := range bearishWords {
		if strings.Contains(lower, kw) {
			bear++
		}
	}

	sentiment := models.SentimentNeutral
	if bull > bear {
		sentiment = models.SentimentBullish
	} else if bear > bull {
		sentiment = models.SentimentBearish
	}

	return sentiment, catalyst, catalystLabel
}
