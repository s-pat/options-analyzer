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
} from './types';

// NEXT_PUBLIC_API_URL defaults to a relative path so all API calls are proxied
// through the Next.js server (see next.config.ts rewrites).  Override only if
// you need to point the browser directly at the backend (e.g. local mobile dev).
const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? '/api/v1';

async function fetchJSON<T>(path: string, options?: RequestInit): Promise<T> {
  const { signal: callerSignal, ...restOptions } = options ?? {};
  // 10s timeout prevents requests hanging indefinitely on poor mobile connections.
  // If the caller passes its own signal, merge both via AbortSignal.any().
  const timeoutSignal = AbortSignal.timeout(10_000);
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

// Options recommendations
export const getRecommendations = (limit = 20) =>
  fetchJSON<{ recommendations: OptionRecommendation[]; total: number }>(
    `/options/recommendations?limit=${limit}`,
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

// Today's Picks
export const getTodayOpportunities = () =>
  fetchJSON<TodayOpportunities>('/options/today');

// Backtest
export const runBacktest = (req: BacktestRequest) =>
  fetchJSON<BacktestResult>('/backtest', {
    method: 'POST',
    body: JSON.stringify(req),
  });

