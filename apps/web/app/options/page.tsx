'use client';

import { useState, Suspense } from 'react';
import dynamic from 'next/dynamic';
import { useSearchParams } from 'next/navigation';
import { Header } from '@/components/layout/Header';
const StockChart = dynamic(
  () => import('@/components/charts/StockChart').then((m) => ({ default: m.StockChart })),
  { ssr: false, loading: () => <div className="h-[280px] animate-pulse rounded-xl bg-white/[0.03]" /> }
);
import { OptionsChain } from '@/components/options/OptionsChain';
import { FilterPanel } from '@/components/options/FilterPanel';
import { OptionCard } from '@/components/options/OptionCard';
import { OptionAnalysisPanel } from '@/components/options/OptionAnalysis';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useStock, useStockHistory, useFilteredChain, useOptionAnalysis } from '@/hooks/useMarketData';
import type { OptionContract, OptionsFilter } from '@/lib/types';
import { AlertCircle, TrendingUp, TrendingDown } from 'lucide-react';
import { StockLoader } from '@/components/ui/StockLoader';
import { cn } from '@/lib/utils';

const DEFAULT_FILTER: OptionsFilter = {
  maxCapital: 0,
  riskLevel: 0,
  onlyCall: false,
  onlyPut: false,
};

function StatPill({ label, value, accent }: { label: string; value: string; accent?: string }) {
  return (
    <div className="flex flex-col gap-0.5 px-3 py-2 rounded-xl bg-white/[0.04] border border-white/[0.06]">
      <span className="text-[10px] text-white/35 uppercase tracking-wide font-medium">{label}</span>
      <span className={cn('text-sm font-bold font-mono tabular-nums', accent ?? 'text-white/80')}>{value}</span>
    </div>
  );
}

function OptionsPageInner() {
  const params = useSearchParams();
  const symbol = params.get('symbol') ?? 'AAPL';
  const [selectedOption, setSelectedOption] = useState<OptionContract | null>(null);
  const [filter, setFilter] = useState<OptionsFilter>(DEFAULT_FILTER);

  const { data: stock, isLoading: stockLoading } = useStock(symbol);
  const { data: histData, isLoading: histLoading } = useStockHistory(symbol);
  const { data: chain, isLoading: chainLoading } = useFilteredChain(symbol, filter);

  const { data: analysis, isLoading: analysisLoading } = useOptionAnalysis(
    selectedOption ? symbol : null,
    selectedOption?.optionType ?? null,
    selectedOption?.strike ?? null,
    selectedOption?.expiration ?? null,
  );

  const positive = (stock?.changePercent ?? 0) >= 0;
  const bullish = stock ? stock.ema20 > stock.ema50 : null;

  return (
    <>
      <Header title={`Options Analyzer — ${symbol}`} />
      <div className="flex-1 p-6 space-y-6">

        {/* Stock summary strip */}
        {stockLoading ? (
          <div className="rounded-2xl border border-white/[0.08] bg-white/[0.03] p-5 animate-pulse">
            <div className="shimmer h-8 w-48 rounded-xl mb-3" />
            <div className="flex gap-2">
              {[...Array(5)].map((_, i) => <div key={i} className="shimmer h-12 w-24 rounded-xl" />)}
            </div>
          </div>
        ) : stock ? (
          <div className="rounded-2xl border border-white/[0.08] bg-white/[0.03] p-5 animate-slide-up relative overflow-hidden">
            {/* Top accent line */}
            <div
              className="absolute inset-x-0 top-0 h-px"
              style={{
                background: positive
                  ? 'linear-gradient(90deg, transparent, oklch(0.696 0.17 162.48 / 50%), transparent)'
                  : 'linear-gradient(90deg, transparent, oklch(0.645 0.246 16.44 / 50%), transparent)',
              }}
            />

            {/* Symbol + price row */}
            <div className="flex flex-wrap items-end gap-4 mb-4">
              <div>
                <div className="font-bold text-2xl text-white/90 tracking-tight">{stock.symbol}</div>
                <div className="text-xs text-white/35 mt-0.5">{stock.name}</div>
              </div>
              <div className="flex items-end gap-2">
                <span className="font-mono text-3xl font-bold tabular-nums text-white">${stock.price?.toFixed(2)}</span>
                <span className={cn(
                  'flex items-center gap-1 text-sm font-medium font-mono tabular-nums mb-0.5',
                  positive ? 'text-green-400' : 'text-red-400',
                )}>
                  {positive ? <TrendingUp className="h-3.5 w-3.5" /> : <TrendingDown className="h-3.5 w-3.5" />}
                  {positive ? '+' : ''}{stock.changePercent?.toFixed(2)}%
                </span>
              </div>
            </div>

            {/* Stat pills */}
            <div className="flex flex-wrap gap-2">
              <StatPill
                label="IV Rank"
                value={`${stock.ivRank?.toFixed(0)}`}
                accent={stock.ivRank <= 30 ? 'text-green-400' : stock.ivRank <= 60 ? 'text-yellow-400' : 'text-red-400'}
              />
              <StatPill label="IV" value={`${stock.iv?.toFixed(1)}%`} />
              <StatPill label="HV30" value={`${stock.hv30?.toFixed(1)}%`} />
              <StatPill label="RSI" value={`${stock.rsi?.toFixed(0)}`} accent={
                stock.rsi < 30 ? 'text-green-400' : stock.rsi > 70 ? 'text-red-400' : 'text-white/80'
              } />
              <div className={cn(
                'flex flex-col gap-0.5 px-3 py-2 rounded-xl border',
                bullish
                  ? 'bg-green-500/[0.08] border-green-500/[0.2]'
                  : 'bg-red-500/[0.08] border-red-500/[0.2]',
              )}>
                <span className="text-[10px] text-white/35 uppercase tracking-wide font-medium">Trend</span>
                <span className={cn('text-sm font-bold', bullish ? 'text-green-400' : 'text-red-400')}>
                  {bullish ? '↑ Bullish' : '↓ Bearish'} (EMA)
                </span>
              </div>
            </div>
          </div>
        ) : null}

        {/* Synthetic data notice */}
        {chain?.isSynthetic && (
          <div className="flex items-center gap-2 rounded-xl border border-yellow-600/30 bg-yellow-950/[0.15] px-4 py-3 text-sm text-yellow-400 animate-slide-up">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>
              <strong>Theoretical options data</strong> — Live Yahoo Finance options are unavailable right now
              (market closed or rate limited). Prices are generated using Black-Scholes with current
              historical volatility and are for educational purposes only.
            </span>
          </div>
        )}

        {/* Chart */}
        <Card className="rounded-2xl border-white/[0.08] bg-white/[0.03] animate-slide-up delay-100">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs text-white/40 uppercase tracking-wide font-medium">Price Chart — 1 Year</CardTitle>
          </CardHeader>
          <CardContent>
            {histLoading ? (
              <div className="h-64 flex items-center justify-center">
                <StockLoader size="md" message="Loading price history…" />
              </div>
            ) : (
              <StockChart
                history={histData?.history ?? []}
                ema20={stock?.ema20}
                ema50={stock?.ema50}
              />
            )}
          </CardContent>
        </Card>

        {/* Filter + chain + detail panel */}
        <div className="grid gap-6 xl:grid-cols-4 animate-slide-up delay-200">
          {/* Filter panel */}
          <div className="xl:col-span-1">
            <FilterPanel filter={filter} onChange={setFilter} />
          </div>

          {/* Options chain */}
          <div className="xl:col-span-2">
            <Card className="rounded-2xl border-white/[0.08] bg-white/[0.03]">
              <CardHeader className="pb-2">
                <CardTitle className="text-xs text-white/40 uppercase tracking-wide font-medium flex items-center gap-2">
                  Options Chain
                  {chain?.isSynthetic && (
                    <Badge variant="outline" className="text-[10px] border-yellow-600/40 text-yellow-500 bg-yellow-950/20">
                      Synthetic
                    </Badge>
                  )}
                  <span className="text-white/25 font-normal normal-case text-[11px]">— click a row to analyze</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {chainLoading ? (
                  <div className="flex justify-center py-16">
                    <StockLoader size="md" message="Loading options chain…" />
                  </div>
                ) : chain && ((chain.calls?.length ?? 0) > 0 || (chain.puts?.length ?? 0) > 0) ? (
                  <OptionsChain
                    chain={chain}
                    stockPrice={stock?.price ?? 0}
                    onSelectOption={setSelectedOption}
                    selectedContract={selectedOption?.contractSymbol ?? null}
                  />
                ) : (
                  <p className="text-white/30 text-sm">
                    No options match the current filters. Try relaxing your capital or risk settings.
                  </p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Analysis / detail panel */}
          <div className="xl:col-span-1 space-y-4">
            {selectedOption ? (
              <Tabs defaultValue="analysis">
                <TabsList className="w-full bg-white/[0.04] border border-white/[0.06]">
                  <TabsTrigger value="analysis" className="flex-1 data-[state=active]:bg-blue-500/20 data-[state=active]:text-blue-400">Analysis</TabsTrigger>
                  <TabsTrigger value="details" className="flex-1 data-[state=active]:bg-blue-500/20 data-[state=active]:text-blue-400">Details</TabsTrigger>
                </TabsList>

                <TabsContent value="analysis" className="mt-3">
                  {analysisLoading ? (
                    <Card className="rounded-2xl border-white/[0.08] bg-white/[0.03]">
                      <CardContent className="flex justify-center py-10">
                        <StockLoader size="md" message="Analyzing option…" />
                      </CardContent>
                    </Card>
                  ) : analysis ? (
                    <OptionAnalysisPanel analysis={analysis} />
                  ) : (
                    <Card className="rounded-2xl border-white/[0.08] bg-white/[0.03]">
                      <CardContent className="pt-6 text-center text-sm text-white/30">
                        Could not load analysis
                      </CardContent>
                    </Card>
                  )}
                </TabsContent>

                <TabsContent value="details" className="mt-3">
                  <OptionCard option={selectedOption} stockPrice={stock?.price ?? 0} />
                </TabsContent>
              </Tabs>
            ) : (
              <Card className="rounded-2xl border-white/[0.08] bg-white/[0.03]">
                <CardContent className="pt-10 pb-8 text-center text-white/25 text-sm">
                  <div className="w-10 h-10 rounded-full bg-white/[0.04] flex items-center justify-center mx-auto mb-3">
                    <AlertCircle className="h-5 w-5 text-white/20" />
                  </div>
                  Select an option from the chain to see the analysis, thesis, and risk assessment
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

export default function OptionsPage() {
  return (
    <Suspense fallback={<div className="p-6"><StockLoader size="sm" message="Loading page…" /></div>}>
      <OptionsPageInner />
    </Suspense>
  );
}
