// Package models defines the shared data types used across all layers of the
// Options Lab API (handlers, services, Yahoo Finance client).
//
// All structs use JSON tags that match the frontend TypeScript types defined in
// apps/web/lib/types.ts — keeping them in sync is a manual responsibility.
package models

import "time"

// Stock represents a stock with market data
type Stock struct {
	Symbol        string    `json:"symbol"`
	Name          string    `json:"name"`
	Sector        string    `json:"sector"`
	Price         float64   `json:"price"`
	Change        float64   `json:"change"`
	ChangePercent float64   `json:"changePercent"`
	Volume        int64     `json:"volume"`
	MarketCap     float64   `json:"marketCap"`
	HV30          float64   `json:"hv30"`
	IV            float64   `json:"iv"`
	IVRank        float64   `json:"ivRank"`
	IVPercentile  float64   `json:"ivPercentile"`
	EMA20         float64   `json:"ema20"`
	EMA50         float64   `json:"ema50"`
	RSI           float64   `json:"rsi"`
	UpdatedAt     time.Time `json:"updatedAt"`
}

// OHLCV represents a candlestick data point
type OHLCV struct {
	Timestamp int64   `json:"timestamp"`
	Open      float64 `json:"open"`
	High      float64 `json:"high"`
	Low       float64 `json:"low"`
	Close     float64 `json:"close"`
	Volume    int64   `json:"volume"`
}

// ExpiryCategory classifies an option expiration
// weekly = non-standard Friday, monthly = 3rd Friday, quarterly = quarter-end monthly, leaps = DTE > 365
type ExpiryCategory = string

const (
	ExpiryWeekly    ExpiryCategory = "weekly"
	ExpiryMonthly   ExpiryCategory = "monthly"
	ExpiryQuarterly ExpiryCategory = "quarterly"
	ExpiryLEAPS     ExpiryCategory = "leaps"
)

// OptionContract represents a single option contract
type OptionContract struct {
	ContractSymbol    string  `json:"contractSymbol"`
	Strike            float64 `json:"strike"`
	Currency          string  `json:"currency"`
	LastPrice         float64 `json:"lastPrice"`
	Bid               float64 `json:"bid"`
	Ask               float64 `json:"ask"`
	Mid               float64 `json:"mid"`
	Volume            int64   `json:"volume"`
	OpenInterest      int64   `json:"openInterest"`
	ImpliedVolatility float64 `json:"impliedVolatility"`
	Expiration        int64   `json:"expiration"`
	DTE               int     `json:"dte"`
	Delta             float64 `json:"delta"`
	Gamma             float64 `json:"gamma"`
	Theta             float64 `json:"theta"`
	Vega              float64 `json:"vega"`
	BSFairValue       float64 `json:"bsFairValue"`
	SpreadPct         float64 `json:"spreadPct"`
	OptionType        string  `json:"optionType"`     // "call" or "put"
	ExpiryCategory    string  `json:"expiryCategory"` // weekly | monthly | quarterly | leaps
	ContractCost      float64 `json:"contractCost"`   // ask * 100 — actual cost for 1 contract
	IsFeasible        bool    `json:"isFeasible"`     // passes basic retail investor checks
	FeasibilityNote   string  `json:"feasibilityNote,omitempty"` // why it failed if !IsFeasible
}

// OptionsFilter is passed to filtered chain requests
type OptionsFilter struct {
	MaxCapital float64 `json:"maxCapital"` // max cost per contract in dollars (0 = no limit)
	RiskLevel  int     `json:"riskLevel"`  // 1=conservative, 2=moderate, 3=aggressive (0 = no filter)
	OnlyCall   bool    `json:"onlyCall"`
	OnlyPut    bool    `json:"onlyPut"`
}

// TodayOption is a scored option pick for the Today's Picks page
type TodayOption struct {
	OptionContract
	StockSymbol   string  `json:"stockSymbol"`
	StockName     string  `json:"stockName"`
	StockPrice    float64 `json:"stockPrice"`
	Score         float64 `json:"score"`
	Verdict       string  `json:"verdict"`
	CostBand      string  `json:"costBand"`    // "$0–100", "$100–500", "$500–1500", "$1500+"
	Rationale     string  `json:"rationale"`
	Horizon       string  `json:"horizon"` // "same-day", "next-day", "swing"
}

// TodayBand is a cost band with its top picks
type TodayBand struct {
	Band  string        `json:"band"`
	Label string        `json:"label"`
	Max   float64       `json:"maxCost"`
	Picks []TodayOption `json:"picks"`
}

// TodayOpportunities is the full Today's Picks response
type TodayOpportunities struct {
	GeneratedAt time.Time   `json:"generatedAt"`
	Bands       []TodayBand `json:"bands"`
}

// OptionsChain represents the full options chain for a stock
type OptionsChain struct {
	Symbol      string           `json:"symbol"`
	Expirations []int64          `json:"expirations"`
	Calls       []OptionContract `json:"calls"`
	Puts        []OptionContract `json:"puts"`
	IsSynthetic bool             `json:"isSynthetic"` // true when generated from BS, not live data
	UpdatedAt   time.Time        `json:"updatedAt"`
}

// OptionSignal is a named signal used in the analysis thesis
type OptionSignal struct {
	Label     string `json:"label"`
	Value     string `json:"value"`
	Positive  bool   `json:"positive"`
}

// OptionAnalysis is the recommendation, thesis, and risk assessment for an option
type OptionAnalysis struct {
	Symbol      string         `json:"symbol"`
	OptionType  string         `json:"optionType"` // "call" or "put"
	Verdict     string         `json:"verdict"`    // "Strong Buy", "Buy", "Pass", "Avoid"
	Confidence  string         `json:"confidence"` // "High", "Medium", "Low"
	RiskFactor  int            `json:"riskFactor"` // 1 (lowest) to 5 (highest)
	RiskLabel   string         `json:"riskLabel"`  // "Conservative" … "Very High Risk"
	Score       float64        `json:"score"`      // 0-100
	Thesis      []string       `json:"thesis"`     // 3-6 supporting bullets
	KeyRisks    []string       `json:"keyRisks"`   // 2-3 risk bullets
	Signals     []OptionSignal `json:"signals"`    // named signal table
	MaxLossPct  float64        `json:"maxLossPct"` // typical max loss % (stop loss level)
	MaxGainPct  float64        `json:"maxGainPct"` // theoretical max gain % at target
	BreakevenAt float64        `json:"breakevenAt"`// stock price needed to break even at expiry
}

// OptionRecommendation is a scored option opportunity
type OptionRecommendation struct {
	OptionContract
	Score          float64 `json:"score"`
	IVScore        float64 `json:"ivScore"`
	TechScore      float64 `json:"techScore"`
	LiquidityScore float64 `json:"liquidityScore"`
	RiskRewardScore float64 `json:"riskRewardScore"`
	Rationale      string  `json:"rationale"`
	StockPrice     float64 `json:"stockPrice"`
	StockSymbol    string  `json:"stockSymbol"`
}

// MarketIndex represents a market index (SPY, QQQ, DIA)
type MarketIndex struct {
	Symbol        string  `json:"symbol"`
	Name          string  `json:"name"`
	Price         float64 `json:"price"`
	Change        float64 `json:"change"`
	ChangePercent float64 `json:"changePercent"`
	Trend         string  `json:"trend"` // "bullish", "bearish", "neutral"
}

// SectorPerformance represents a GICS sector's daily performance
type SectorPerformance struct {
	Sector        string  `json:"sector"`
	ETF           string  `json:"etf"`
	ChangePercent float64 `json:"changePercent"`
}

// MarketOverview groups index + sector data
type MarketOverview struct {
	Indices []MarketIndex      `json:"indices"`
	Sectors []SectorPerformance `json:"sectors"`
}

// BacktestRequest is the input for the backtesting engine
type BacktestRequest struct {
	Symbol      string  `json:"symbol" binding:"required"`
	OptionType  string  `json:"type" binding:"required,oneof=call put"`
	StartDate   string  `json:"startDate" binding:"required"`
	EndDate     string  `json:"endDate" binding:"required"`
	DeltaTarget float64 `json:"deltaTarget"`
	// Interval controls how often a new trade is opened:
	//   "weekly" = every 5 trading days
	//   "biweekly" = every 10 trading days
	//   "monthly" = every 21 trading days (default)
	Interval string `json:"interval"`
}

// BacktestTrade is a single simulated trade
type BacktestTrade struct {
	EntryDate          string  `json:"entryDate"`
	ExitDate           string  `json:"exitDate"`
	Strike             float64 `json:"strike"`
	Expiration         string  `json:"expiration"`
	EntryPrice         float64 `json:"entryPrice"`
	ExitPrice          float64 `json:"exitPrice"`
	PnLPct             float64 `json:"pnlPct"`
	DaysHeld           int     `json:"daysHeld"`
	Winner             bool    `json:"winner"`
	ExitReason         string  `json:"exitReason"` // "profit_target", "stop_loss", "expiry"
	EntryDTE           int     `json:"entryDTE"`           // DTE when the contract was opened
	StockPriceAtEntry  float64 `json:"stockPriceAtEntry"`  // underlying close on entry date
	StockPriceAtExit   float64 `json:"stockPriceAtExit"`   // underlying close on exit date
}

// EquityPoint is a point on the equity curve
type EquityPoint struct {
	Date  string  `json:"date"`
	Value float64 `json:"value"`
}

// BacktestResult is the full backtest output
type BacktestResult struct {
	Symbol            string          `json:"symbol"`
	OptionType        string          `json:"optionType"`
	StartDate         string          `json:"startDate"`
	EndDate           string          `json:"endDate"`
	Trades            []BacktestTrade `json:"trades"`
	EquityCurve       []EquityPoint   `json:"equityCurve"`
	TotalReturn       float64         `json:"totalReturn"`
	WinRate           float64         `json:"winRate"`
	AvgWinPct         float64         `json:"avgWinPct"`
	AvgLossPct        float64         `json:"avgLossPct"`
	MaxConsecLosses   int             `json:"maxConsecLosses"`
	TotalTrades       int             `json:"totalTrades"`
	ProfitFactor      float64         `json:"profitFactor"`
}

// Greeks holds option greeks
type Greeks struct {
	Delta float64
	Gamma float64
	Theta float64
	Vega  float64
}

// NewsSentiment classifies the market sentiment of a news item
type NewsSentiment = string

const (
	SentimentBullish NewsSentiment = "bullish"
	SentimentBearish NewsSentiment = "bearish"
	SentimentNeutral NewsSentiment = "neutral"
)

// NewsCatalyst identifies a specific event type in a news item
type NewsCatalyst = string

const (
	CatalystEarnings   NewsCatalyst = "earnings"
	CatalystFDA        NewsCatalyst = "fda"
	CatalystMA         NewsCatalyst = "m&a"
	CatalystUpgrade    NewsCatalyst = "upgrade"
	CatalystDowngrade  NewsCatalyst = "downgrade"
	CatalystMacro      NewsCatalyst = "macro"
	CatalystNone       NewsCatalyst = ""
)

// NewsItem is a single news article with sentiment classification
type NewsItem struct {
	UUID         string       `json:"uuid"`
	Title        string       `json:"title"`
	Publisher    string       `json:"publisher"`
	Link         string       `json:"link"`
	PublishedAt  int64        `json:"publishedAt"` // unix timestamp
	Sentiment    NewsSentiment `json:"sentiment"`
	Catalyst     NewsCatalyst  `json:"catalyst"`
	CatalystLabel string       `json:"catalystLabel,omitempty"`
	Summary      string       `json:"summary,omitempty"` // first ~120 chars of snippet if available
}

// StockNews is the full news response for a symbol
type StockNews struct {
	Symbol          string     `json:"symbol"`
	Items           []NewsItem `json:"items"`
	OverallSentiment NewsSentiment `json:"overallSentiment"`
	BullishCount    int        `json:"bullishCount"`
	BearishCount    int        `json:"bearishCount"`
	NeutralCount    int        `json:"neutralCount"`
	UpdatedAt       time.Time  `json:"updatedAt"`
}

// EarningsEvent holds upcoming earnings date and EPS estimate data for a symbol
type EarningsEvent struct {
	Symbol          string    `json:"symbol"`
	EarningsDate    time.Time `json:"earningsDate"`    // next earnings date
	EarningsDateFmt string    `json:"earningsDateFmt"` // "Mar 28, 2026"
	DaysUntil       int       `json:"daysUntil"`       // days until earnings
	EPSEstimate     float64   `json:"epsEstimate"`     // consensus EPS
	EPSLow          float64   `json:"epsLow"`
	EPSHigh         float64   `json:"epsHigh"`
	HasDate         bool      `json:"hasDate"`    // false if no upcoming date
	UpdatedAt       time.Time `json:"updatedAt"`
}
