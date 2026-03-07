'use client';

import { useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Header } from '@/components/layout/Header';
import { StockChart } from '@/components/charts/StockChart';
import { OptionsChain } from '@/components/options/OptionsChain';
import { FilterPanel } from '@/components/options/FilterPanel';
import { OptionCard } from '@/components/options/OptionCard';
import { OptionAnalysisPanel } from '@/components/options/OptionAnalysis';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useStock, useStockHistory, useFilteredChain, useOptionAnalysis } from '@/hooks/useMarketData';
import type { OptionContract, OptionsFilter } from '@/lib/types';
import { AlertCircle } from 'lucide-react';
import { StockLoader } from '@/components/ui/StockLoader';

const DEFAULT_FILTER: OptionsFilter = {
  maxCapital: 0,
  riskLevel: 0,
  onlyCall: false,
  onlyPut: false,
};

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

  return (
    <>
      <Header title={`Options Analyzer — ${symbol}`} />
      <div className="flex-1 p-6 space-y-6">
        {/* Stock summary */}
        {stockLoading ? (
          <Card>
            <CardContent className="flex justify-center py-8">
              <StockLoader size="sm" message="Fetching stock data…" />
            </CardContent>
          </Card>
        ) : stock ? (
          <Card>
            <CardContent className="pt-4">
              <div className="flex flex-wrap items-center gap-6">
                <div>
                  <div className="text-2xl font-bold">{stock.symbol}</div>
                  <div className="text-sm text-muted-foreground">{stock.name}</div>
                </div>
                <div>
                  <div className="text-2xl font-bold">${stock.price?.toFixed(2)}</div>
                  <div className={`text-sm ${stock.changePercent >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                    {stock.changePercent >= 0 ? '+' : ''}{stock.changePercent?.toFixed(2)}%
                  </div>
                </div>
                <div className="flex gap-3 flex-wrap">
                  <Badge variant="outline">IV Rank: {stock.ivRank?.toFixed(0)}</Badge>
                  <Badge variant="outline">IV: {stock.iv?.toFixed(1)}%</Badge>
                  <Badge variant="outline">HV30: {stock.hv30?.toFixed(1)}%</Badge>
                  <Badge variant="outline">RSI: {stock.rsi?.toFixed(0)}</Badge>
                  <Badge variant={stock.ema20 > stock.ema50 ? 'default' : 'secondary'}>
                    {stock.ema20 > stock.ema50 ? 'Bullish (EMA)' : 'Bearish (EMA)'}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        ) : null}

        {/* Synthetic data notice */}
        {chain?.isSynthetic && (
          <div className="flex items-center gap-2 rounded-md border border-yellow-600/40 bg-yellow-950/20 px-4 py-2.5 text-sm text-yellow-400">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>
              <strong>Theoretical options data</strong> — Live Yahoo Finance options are unavailable right now
              (market closed or rate limited). Prices are generated using Black-Scholes with current
              historical volatility and are for educational purposes only.
            </span>
          </div>
        )}

        {/* Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Price Chart (1Y)</CardTitle>
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
        <div className="grid gap-6 xl:grid-cols-4">
          {/* Filter panel — left column */}
          <div className="xl:col-span-1">
            <FilterPanel filter={filter} onChange={setFilter} />
          </div>

          {/* Options chain — center 2 columns */}
          <div className="xl:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">
                  Options Chain
                  {chain?.isSynthetic && (
                    <Badge variant="outline" className="ml-2 text-[10px] border-yellow-600 text-yellow-500">
                      Synthetic
                    </Badge>
                  )}
                  <span className="text-muted-foreground font-normal ml-1">— click a row to analyze</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {chainLoading ? (
                  <div className="flex justify-center py-16">
                    <StockLoader size="md" message="Loading options chain…" />
                  </div>
                ) : chain && (chain.calls.length > 0 || chain.puts.length > 0) ? (
                  <OptionsChain
                    chain={chain}
                    stockPrice={stock?.price ?? 0}
                    onSelectOption={setSelectedOption}
                    selectedContract={selectedOption?.contractSymbol ?? null}
                  />
                ) : (
                  <p className="text-muted-foreground text-sm">
                    No options match the current filters. Try relaxing your capital or risk settings.
                  </p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Analysis / detail panel — right column */}
          <div className="xl:col-span-1 space-y-4">
            {selectedOption ? (
              <Tabs defaultValue="analysis">
                <TabsList className="w-full">
                  <TabsTrigger value="analysis" className="flex-1">Analysis</TabsTrigger>
                  <TabsTrigger value="details" className="flex-1">Details</TabsTrigger>
                </TabsList>

                <TabsContent value="analysis" className="mt-3">
                  {analysisLoading ? (
                    <Card>
                      <CardContent className="flex justify-center py-10">
                        <StockLoader size="md" message="Analyzing option…" />
                      </CardContent>
                    </Card>
                  ) : analysis ? (
                    <OptionAnalysisPanel analysis={analysis} />
                  ) : (
                    <Card>
                      <CardContent className="pt-6 text-center text-sm text-muted-foreground">
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
              <Card>
                <CardContent className="pt-8 text-center text-muted-foreground text-sm">
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
