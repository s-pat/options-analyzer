'use client';

import { Header } from '@/components/layout/Header';
import { TodayOpportunities } from '@/components/today/TodayOpportunities';
import { Card, CardContent } from '@/components/ui/card';
import { useTodayOpportunities } from '@/hooks/useMarketData';
import { TrendingUp, AlertCircle } from 'lucide-react';
import { StockLoader } from '@/components/ui/StockLoader';

export default function TodayPage() {
  const { data, isLoading, error } = useTodayOpportunities();

  return (
    <>
      <Header title="Today's Picks" />
      <div className="flex-1 p-6 space-y-6">
        {/* Hero / description */}
        <div className="rounded-lg border border-border bg-card p-4">
          <div className="flex items-start gap-3">
            <TrendingUp className="h-5 w-5 text-primary mt-0.5 shrink-0" />
            <div>
              <h2 className="font-semibold text-sm">Top Options Opportunities — Right Now</h2>
              <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                Scans {30}+ liquid stocks for the highest-scoring long call and put contracts,
                broken down by contract cost so you can find opportunities that fit your budget.
                Scored on IV rank, trend alignment, liquidity, and theoretical edge.
                Refreshes every 60 seconds.
              </p>
            </div>
          </div>
        </div>

        {/* Risk disclaimer */}
        <div className="flex items-start gap-2 rounded-md border border-yellow-600/30 bg-yellow-950/10 px-4 py-2.5 text-xs text-yellow-500">
          <AlertCircle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
          <span>
            Options trading involves significant risk and is not suitable for all investors.
            These are algorithmic scores only — not financial advice. Always do your own research.
          </span>
        </div>

        {/* Content */}
        {isLoading ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-24 gap-3 text-muted-foreground">
              <StockLoader
                size="md"
                message="Scanning 30+ stocks for opportunities…"
                subtitle="This may take 15–30 seconds on first load"
              />
            </CardContent>
          </Card>
        ) : error ? (
          <Card>
            <CardContent className="flex items-center gap-3 py-8 text-destructive">
              <AlertCircle className="h-5 w-5 shrink-0" />
              <div>
                <p className="font-medium text-sm">Failed to load opportunities</p>
                <p className="text-xs text-muted-foreground mt-1">{error.message}</p>
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
