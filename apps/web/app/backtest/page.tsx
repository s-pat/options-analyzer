'use client';

import { Header } from '@/components/layout/Header';
import { BacktestForm } from '@/components/backtest/BacktestForm';
import { BacktestResults } from '@/components/backtest/BacktestResults';
import { useBacktest } from '@/hooks/useBacktest';

export default function BacktestPage() {
  const { result, loading, error, run } = useBacktest();

  return (
    <>
      <Header title="Backtester" />
      <div className="flex-1 p-6 space-y-6">
        <BacktestForm onSubmit={run} loading={loading} />
        {error && (
          <div className="rounded-md bg-destructive/10 border border-destructive/30 text-destructive p-4 text-sm">
            {error}
          </div>
        )}
        {result && <BacktestResults result={result} />}
      </div>
    </>
  );
}
