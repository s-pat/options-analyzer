'use client';

import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useMarketOverview } from '@/hooks/useMarketData';
import { StockLoader } from '@/components/ui/StockLoader';

function fmt(n: number, digits = 2) {
  return n?.toFixed(digits) ?? '—';
}

export function MarketOverview() {
  const { data, error, isLoading } = useMarketOverview();

  if (isLoading) return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <div className="col-span-full flex justify-center py-14">
        <StockLoader size="md" message="Fetching market data…" />
      </div>
    </div>
  );
  if (error) return <div className="text-destructive text-sm">Failed to load market data</div>;

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {data?.indices?.map((idx) => {
        const positive = idx.changePercent >= 0;
        const Icon = idx.trend === 'bullish' ? TrendingUp : idx.trend === 'bearish' ? TrendingDown : Minus;
        return (
          <Card key={idx.symbol}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{idx.name}</CardTitle>
              <Badge variant={idx.trend === 'bullish' ? 'default' : idx.trend === 'bearish' ? 'destructive' : 'secondary'}>
                {idx.trend}
              </Badge>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${fmt(idx.price)}</div>
              <div className={`flex items-center gap-1 text-sm mt-1 ${positive ? 'text-green-500' : 'text-red-500'}`}>
                <Icon className="h-3.5 w-3.5" />
                <span>{positive ? '+' : ''}{fmt(idx.change)} ({positive ? '+' : ''}{fmt(idx.changePercent)}%)</span>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
