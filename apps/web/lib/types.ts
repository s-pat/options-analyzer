// TypeScript types mirroring Go backend models

export interface OptionSignal {
  label: string;
  value: string;
  positive: boolean;
}

export interface OptionAnalysis {
  symbol: string;
  optionType: 'call' | 'put';
  verdict: 'Strong Buy' | 'Buy' | 'Speculative' | 'Pass';
  confidence: 'High' | 'Medium' | 'Low';
  riskFactor: number; // 1-5
  riskLabel: string;
  score: number;
  thesis: string[];
  keyRisks: string[];
  signals: OptionSignal[];
  maxLossPct: number;
  maxGainPct: number;
  breakevenAt: number;
}

export interface Stock {
  symbol: string;
  name: string;
  sector: string;
  price: number;
  change: number;
  changePercent: number;
  volume: number;
  marketCap: number;
  hv30: number;
  iv: number;
  ivRank: number;
  ivPercentile: number;
  ema20: number;
  ema50: number;
  rsi: number;
  updatedAt: string;
}

export interface OHLCV {
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export type ExpiryCategory = 'weekly' | 'monthly' | 'quarterly' | 'leaps';

export interface OptionContract {
  contractSymbol: string;
  strike: number;
  currency: string;
  lastPrice: number;
  bid: number;
  ask: number;
  mid: number;
  volume: number;
  openInterest: number;
  impliedVolatility: number;
  expiration: number;
  dte: number;
  delta: number;
  gamma: number;
  theta: number;
  vega: number;
  bsFairValue: number;
  spreadPct: number;
  optionType: 'call' | 'put';
  expiryCategory: ExpiryCategory;
  contractCost: number;   // ask * 100
  isFeasible: boolean;
  feasibilityNote?: string;
}

export interface OptionsFilter {
  maxCapital: number;   // 0 = no limit
  riskLevel: number;    // 0=none, 1=conservative, 2=moderate, 3=aggressive
  onlyCall: boolean;
  onlyPut: boolean;
}

export type TodayVerdict = 'Strong Buy' | 'Buy' | 'Speculative' | 'Pass';

export interface TodayOption extends OptionContract {
  stockSymbol: string;
  stockName: string;
  stockPrice: number;
  score: number;
  verdict: TodayVerdict;
  costBand: string;
  rationale: string;
  horizon: 'same-day' | 'next-day' | 'swing';
}

export interface TodayBand {
  band: string;
  label: string;
  maxCost: number;
  picks: TodayOption[];
}

export interface TodayOpportunities {
  generatedAt: string;
  bands: TodayBand[];
}

export interface OptionsChain {
  symbol: string;
  expirations: number[];
  calls: OptionContract[];
  puts: OptionContract[];
  isSynthetic: boolean;
  updatedAt: string;
}

export interface OptionRecommendation extends OptionContract {
  score: number;
  ivScore: number;
  techScore: number;
  liquidityScore: number;
  riskRewardScore: number;
  rationale: string;
  stockPrice: number;
  stockSymbol: string;
}

export interface MarketIndex {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  trend: 'bullish' | 'bearish' | 'neutral';
}

export interface SectorPerformance {
  sector: string;
  etf: string;
  changePercent: number;
}

export interface MarketOverview {
  indices: MarketIndex[];
  sectors: SectorPerformance[];
}

export interface BacktestRequest {
  symbol: string;
  type: 'call' | 'put';
  startDate: string;
  endDate: string;
  deltaTarget?: number;
  interval?: 'weekly' | 'biweekly' | 'monthly';
}

export interface BacktestTrade {
  entryDate: string;
  exitDate: string;
  strike: number;
  expiration: string;
  entryPrice: number;
  exitPrice: number;
  pnlPct: number;
  daysHeld: number;
  winner: boolean;
  exitReason: 'profit_target' | 'stop_loss' | 'expiry';
  entryDTE: number;
  stockPriceAtEntry: number;
  stockPriceAtExit: number;
}

export interface EquityPoint {
  date: string;
  value: number;
}

export interface BacktestResult {
  symbol: string;
  optionType: string;
  startDate: string;
  endDate: string;
  trades: BacktestTrade[];
  equityCurve: EquityPoint[];
  totalReturn: number;
  winRate: number;
  avgWinPct: number;
  avgLossPct: number;
  maxConsecLosses: number;
  totalTrades: number;
  profitFactor: number;
}
