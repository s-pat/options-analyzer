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
} from '@/lib/api';
import type { OptionsFilter } from '@/lib/types';

const REFRESH_INTERVAL = 30_000; // 30s

export function useMarketOverview() {
  return useSWR('market/overview', getMarketOverview, {
    refreshInterval: REFRESH_INTERVAL,
  });
}

export function useStocks() {
  return useSWR('stocks', getStocks, {
    refreshInterval: REFRESH_INTERVAL,
  });
}

export function useStock(symbol: string | null) {
  return useSWR(symbol ? `stocks/${symbol}` : null, () => getStock(symbol!), {
    refreshInterval: REFRESH_INTERVAL,
  });
}

export function useStockHistory(symbol: string | null, range = '1y') {
  return useSWR(
    symbol ? `stocks/${symbol}/history/${range}` : null,
    () => getStockHistory(symbol!, range),
    { refreshInterval: REFRESH_INTERVAL },
  );
}

export function useOptionsChain(symbol: string | null) {
  return useSWR(
    symbol ? `stocks/${symbol}/options` : null,
    () => getOptionsChain(symbol!),
    { refreshInterval: REFRESH_INTERVAL },
  );
}

export function useFilteredChain(symbol: string | null, filter: OptionsFilter) {
  // Build a stable cache key from the filter values
  const key = symbol
    ? `stocks/${symbol}/options/filtered/${filter.maxCapital}/${filter.riskLevel}/${filter.onlyCall}/${filter.onlyPut}`
    : null;
  return useSWR(key, () => getFilteredChain(symbol!, filter), {
    refreshInterval: REFRESH_INTERVAL,
  });
}

export function useTodayOpportunities() {
  return useSWR('options/today', getTodayOpportunities, {
    refreshInterval: 60_000, // 1 min — this scan is expensive
  });
}

export function useRecommendations(limit = 20) {
  return useSWR(
    `options/recommendations/${limit}`,
    () => getRecommendations(limit),
    { refreshInterval: REFRESH_INTERVAL },
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
