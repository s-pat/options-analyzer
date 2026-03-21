import useSWR from 'swr';
import {
  getMarketOverview,
  getStocks,
  getStock,
  getStockHistory,
  getOptionsChain,
  getFilteredChain,
  getRecommendations,
  analyzeOption,
  getTodayOpportunities,
  getStockNews,
  getEarnings,
} from '@/lib/api';
import type { OptionsFilter } from '@/lib/types';

const REFRESH_INTERVAL = 30_000;   // 30s background refresh
const DEDUP_INTERVAL  = 3 * 60_000; // 3 min — preloaded data stays fresh this long

// On slow mobile connections (2G/3G) reduce polling so requests don't compete
// with each other and drain battery. navigator.connection is non-standard but
// supported on Chrome/Android which covers most mobile users.
function networkRefreshInterval(base: number): number {
  if (typeof navigator === 'undefined') return base;
  const conn = (navigator as unknown as { connection?: { effectiveType?: string } }).connection;
  const type = conn?.effectiveType;
  if (type === 'slow-2g' || type === '2g') return base * 4; // 2min on 2G
  if (type === '3g') return base * 2;                        // 1min on 3G
  return base;
}

export function useMarketOverview() {
  return useSWR('market/overview', getMarketOverview, {
    refreshInterval: networkRefreshInterval(REFRESH_INTERVAL),
    dedupingInterval: DEDUP_INTERVAL,
  });
}

export function useStocks() {
  return useSWR('stocks', getStocks, {
    refreshInterval: networkRefreshInterval(REFRESH_INTERVAL),
    dedupingInterval: DEDUP_INTERVAL,
  });
}

export function useStock(symbol: string | null) {
  return useSWR(symbol ? `stocks/${symbol}` : null, () => getStock(symbol!), {
    refreshInterval: networkRefreshInterval(REFRESH_INTERVAL),
  });
}

export function useStockHistory(symbol: string | null, range = '1y') {
  return useSWR(
    symbol ? `stocks/${symbol}/history/${range}` : null,
    () => getStockHistory(symbol!, range),
    { refreshInterval: networkRefreshInterval(REFRESH_INTERVAL) },
  );
}

export function useOptionsChain(symbol: string | null) {
  return useSWR(
    symbol ? `stocks/${symbol}/options` : null,
    () => getOptionsChain(symbol!),
    { refreshInterval: networkRefreshInterval(REFRESH_INTERVAL) },
  );
}

export function useFilteredChain(symbol: string | null, filter: OptionsFilter) {
  // Build a stable cache key from the filter values
  const key = symbol
    ? `stocks/${symbol}/options/filtered/${filter.maxCapital}/${filter.riskLevel}/${filter.onlyCall}/${filter.onlyPut}`
    : null;
  return useSWR(key, () => getFilteredChain(symbol!, filter), {
    refreshInterval: networkRefreshInterval(REFRESH_INTERVAL),
  });
}

export function useTodayOpportunities() {
  return useSWR('options/today', getTodayOpportunities, {
    refreshInterval: networkRefreshInterval(60_000), // 1 min base — scan is expensive
    dedupingInterval: DEDUP_INTERVAL,
  });
}

export function useRecommendations(limit = 20) {
  return useSWR(
    `options/recommendations/${limit}`,
    () => getRecommendations(limit),
    {
      refreshInterval: networkRefreshInterval(REFRESH_INTERVAL),
      dedupingInterval: DEDUP_INTERVAL,
      // Show the previous scan's data immediately while a fresh one loads.
      // Without this, every dashboard visit shows a 60-90 s spinner even
      // when the cache already has perfectly good recent data.
      keepPreviousData: true,
    },
  );
}

export function useStockNews(symbol: string | null) {
  return useSWR(
    symbol ? `stocks/${symbol}/news` : null,
    () => getStockNews(symbol!),
    {
      refreshInterval: networkRefreshInterval(5 * 60_000), // 5 min — news is cached 10 min on backend
      dedupingInterval: 4 * 60_000,
    },
  );
}

export function useEarnings(symbol: string | null) {
  return useSWR(
    symbol ? `stocks/${symbol}/earnings` : null,
    () => getEarnings(symbol!),
    { refreshInterval: 30 * 60_000, dedupingInterval: 25 * 60_000 },
  );
}

export function useOptionAnalysis(
  symbol: string | null,
  type: 'call' | 'put' | null,
  strike: number | null,
  expiration: number | null,
) {
  const key =
    symbol && type && strike && expiration
      ? `options/analyze/${symbol}/${type}/${strike}/${expiration}`
      : null;
  return useSWR(
    key,
    () => analyzeOption(symbol!, type!, strike!, expiration!),
    { revalidateOnFocus: false },
  );
}
