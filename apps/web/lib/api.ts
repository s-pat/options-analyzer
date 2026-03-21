import type {
  BacktestRequest,
  BacktestResult,
  MarketOverview,
  OptionsChain,
  OptionsFilter,
  OptionAnalysis,
  OptionRecommendation,
  TodayOpportunities,
  OHLCV,
  Stock,
  StockNews,
} from './types';

// NEXT_PUBLIC_API_URL defaults to a relative path so all API calls are proxied
// through the Next.js server (see next.config.ts rewrites).  Override only if
// you need to point the browser directly at the backend (e.g. local mobile dev).
const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? '/api/v1';

async function fetchJSON<T>(path: string, options?: RequestInit & { timeoutMs?: number }): Promise<T> {
  const { signal: callerSignal, timeoutMs = 10_000, ...restOptions } = options ?? {};
  // Timeout prevents requests hanging indefinitely on poor mobile connections.
  // Expensive scan endpoints (options/today, options/recommendations) pass a
  // longer timeout because they fan out across 20-30 stocks before responding.
  // If the caller passes its own signal, merge both via AbortSignal.any().
  const timeoutSignal = AbortSignal.timeout(timeoutMs);
  const signal = callerSignal
    ? AbortSignal.any([timeoutSignal, callerSignal])
    : timeoutSignal;

  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    signal,
    ...restOptions,
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`API error ${res.status}: ${text}`);
  }
  return res.json() as Promise<T>;
}

// Market
export const getMarketOverview = () =>
  fetchJSON<MarketOverview>('/market/overview');

// Stocks
export const getStocks = () =>
  fetchJSON<{ stocks: Stock[]; total: number }>('/stocks');

export const getStock = (symbol: string) =>
  fetchJSON<Stock>(`/stocks/${symbol}`);

export const getStockHistory = (symbol: string, range = '1y') =>
  fetchJSON<{ symbol: string; history: OHLCV[] }>(`/stocks/${symbol}/history?range=${range}`);

export const getOptionsChain = (symbol: string) =>
  fetchJSON<OptionsChain>(`/stocks/${symbol}/options`);

export const getFilteredChain = (symbol: string, f: OptionsFilter) => {
  const params = new URLSearchParams();
  if (f.maxCapital > 0) params.set('maxCapital', String(f.maxCapital));
  if (f.riskLevel > 0) params.set('riskLevel', String(f.riskLevel));
  if (f.onlyCall) params.set('onlyCall', 'true');
  if (f.onlyPut) params.set('onlyPut', 'true');
  const qs = params.toString();
  return fetchJSON<OptionsChain>(`/stocks/${symbol}/options/filtered${qs ? `?${qs}` : ''}`);
};

// Options recommendations — 20 s timeout. Backend scans 20 stocks in parallel
// and pre-warms the cache on startup, so cold-start responses arrive in ~15 s.
// Keeping the timeout below 30 s means the user sees an error/retry state
// rather than an infinite spinner if the API is temporarily unavailable.
export const getRecommendations = (limit = 20) =>
  fetchJSON<{ recommendations: OptionRecommendation[]; total: number }>(
    `/options/recommendations?limit=${limit}`,
    { timeoutMs: 20_000 },
  );

// Option analysis
export const analyzeOption = (
  symbol: string,
  type: 'call' | 'put',
  strike: number,
  expiration: number,
) =>
  fetchJSON<OptionAnalysis>(
    `/stocks/${symbol}/options/analyze?type=${type}&strike=${strike}&expiration=${expiration}`,
  );

// Today's Picks — allow up to 60 s: backend scans 30 stocks (4 concurrent)
export const getTodayOpportunities = () =>
  fetchJSON<TodayOpportunities>('/options/today', { timeoutMs: 60_000 });

// Stock news with sentiment classification
export const getStockNews = (symbol: string) =>
  fetchJSON<StockNews>(`/stocks/${symbol}/news`);

// Backtest
export const runBacktest = (req: BacktestRequest) =>
  fetchJSON<BacktestResult>('/backtest', {
    method: 'POST',
    body: JSON.stringify(req),
  });

