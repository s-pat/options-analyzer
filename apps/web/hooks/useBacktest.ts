import { useState } from 'react';
import { runBacktest } from '@/lib/api';
import type { BacktestRequest, BacktestResult } from '@/lib/types';

export function useBacktest() {
  const [result, setResult] = useState<BacktestResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const run = async (req: BacktestRequest) => {
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const data = await runBacktest(req);
      setResult(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Backtest failed');
    } finally {
      setLoading(false);
    }
  };

  return { result, loading, error, run };
}
