'use client';

import { Header } from '@/components/layout/Header';
import { BacktestForm } from '@/components/backtest/BacktestForm';
import { BacktestResults } from '@/components/backtest/BacktestResults';
import { useBacktest } from '@/hooks/useBacktest';
import { BarChart3, AlertCircle } from 'lucide-react';

export default function BacktestPage() {
  const { result, loading, error, run } = useBacktest();

  return (
    <>
      <Header title="Backtester" />
      <div className="flex-1 p-6 space-y-6">

        {/* Hero strip */}
        <div className="relative rounded-2xl border border-blue-500/[0.15] bg-blue-500/[0.03] px-5 py-4 flex items-center gap-4 overflow-hidden animate-slide-up">
          <div className="absolute -top-10 -right-10 w-36 h-36 bg-blue-500/[0.07] rounded-full blur-2xl pointer-events-none" />
          <div className="w-9 h-9 rounded-xl bg-blue-500/[0.12] border border-blue-500/[0.2] flex items-center justify-center shrink-0">
            <BarChart3 className="h-4.5 w-4.5 text-blue-400" />
          </div>
          <div>
            <p className="text-sm font-semibold text-white/80">Strategy Backtester</p>
            <p className="text-xs text-white/35 mt-0.5">
              Simulate options strategies against historical data to evaluate performance metrics.
            </p>
          </div>
        </div>

        <div className="animate-slide-up delay-100">
          <BacktestForm onSubmit={run} loading={loading} />
        </div>

        {error && (
          <div className="flex items-center gap-3 rounded-xl border border-red-500/[0.2] bg-red-500/[0.05] px-4 py-3 text-sm text-red-400 animate-slide-up">
            <AlertCircle className="h-4 w-4 shrink-0" />
            {error}
          </div>
        )}

        {result && (
          <div className="animate-slide-up">
            <BacktestResults result={result} />
          </div>
        )}
      </div>
    </>
  );
}
