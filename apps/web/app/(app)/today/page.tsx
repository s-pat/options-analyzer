'use client';

import { Header } from '@/components/layout/Header';
import { TodayOpportunities } from '@/components/today/TodayOpportunities';
import { Card, CardContent } from '@/components/ui/card';
import { useTodayOpportunities } from '@/hooks/useMarketData';
import { TrendingUp, AlertCircle, Zap, RefreshCw } from 'lucide-react';
import { StockLoader } from '@/components/ui/StockLoader';

export default function TodayPage() {
  const { data, isLoading, error } = useTodayOpportunities();

  return (
    <>
      <Header title="Today's Picks" />
      <div className="flex-1 p-6 space-y-5">

        {/* Hero callout */}
        <div className="relative rounded-2xl border border-blue-500/[0.2] bg-blue-500/[0.05] p-5 overflow-hidden animate-slide-up">
          {/* Glow */}
          <div className="absolute -top-12 -right-12 w-40 h-40 bg-blue-500/10 rounded-full blur-2xl pointer-events-none" />
          <div className="relative flex items-start gap-4">
            <div className="w-10 h-10 rounded-xl bg-blue-500/[0.15] border border-blue-500/[0.2] flex items-center justify-center shrink-0">
              <TrendingUp className="h-5 w-5 text-blue-400" />
            </div>
            <div>
              <h2 className="font-semibold text-sm text-white/90 mb-1">Top Options Opportunities — Right Now</h2>
              <p className="text-xs text-white/40 leading-relaxed">
                Scans {30}+ liquid stocks for the highest-scoring long call and put contracts,
                broken down by contract cost. Scored on IV rank, trend alignment, liquidity, and theoretical edge.
              </p>
              <div className="flex items-center gap-2 mt-2.5">
                <div className="flex items-center gap-1.5 text-[11px] text-white/30">
                  <Zap className="h-3 w-3 text-yellow-400/60" />
                  Scored on IV Rank · Trend · Liquidity · Edge
                </div>
                <div className="flex items-center gap-1 text-[11px] text-white/25">
                  <RefreshCw className="h-2.5 w-2.5" />
                  60s refresh
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Risk disclaimer */}
        <div className="flex items-start gap-3 rounded-xl border border-yellow-600/[0.2] bg-yellow-950/[0.1] px-4 py-3 animate-slide-up delay-50">
          <AlertCircle className="h-3.5 w-3.5 shrink-0 mt-0.5 text-yellow-500/70" />
          <span className="text-xs text-yellow-500/70 leading-relaxed">
            Options trading involves significant risk and is not suitable for all investors.
            These are algorithmic scores only — not financial advice. Always do your own research.
          </span>
        </div>

        {/* Content */}
        {isLoading ? (
          <Card className="rounded-2xl border-white/[0.08] bg-white/[0.03] animate-slide-up delay-100">
            <CardContent className="flex flex-col items-center justify-center py-24 gap-3">
              <StockLoader
                size="md"
                message="Scanning 30+ stocks for opportunities…"
                subtitle="This may take 15–30 seconds on first load"
              />
            </CardContent>
          </Card>
        ) : error ? (
          <Card className="rounded-2xl border-white/[0.08] bg-white/[0.03]">
            <CardContent className="flex items-center gap-3 py-8 text-destructive">
              <AlertCircle className="h-5 w-5 shrink-0" />
              <div>
                <p className="font-medium text-sm">Failed to load opportunities</p>
                <p className="text-xs text-white/30 mt-1">{error.message}</p>
              </div>
            </CardContent>
          </Card>
        ) : data ? (
          <TodayOpportunities data={data} />
        ) : null}
      </div>
    </>
  );
}
