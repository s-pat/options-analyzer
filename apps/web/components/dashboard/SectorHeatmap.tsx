'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useMarketOverview } from '@/hooks/useMarketData';
import { cn } from '@/lib/utils';

function heatColor(pct: number): string {
  if (pct >= 2) return 'bg-green-700 text-white';
  if (pct >= 1) return 'bg-green-600 text-white';
  if (pct >= 0.3) return 'bg-green-500 text-white';
  if (pct >= 0) return 'bg-green-900/40 text-green-300';
  if (pct >= -0.3) return 'bg-red-900/40 text-red-300';
  if (pct >= -1) return 'bg-red-500 text-white';
  if (pct >= -2) return 'bg-red-600 text-white';
  return 'bg-red-700 text-white';
}

export function SectorHeatmap() {
  const { data, isLoading, error } = useMarketOverview();

  if (isLoading) return <div className="text-muted-foreground text-sm">Loading sectors…</div>;
  if (error) return <div className="text-destructive text-sm">Failed to load sectors</div>;

  const sectors = data?.sectors ?? [];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Sector Performance</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-3 sm:grid-cols-4 xl:grid-cols-6 gap-2">
          {sectors.map((s) => (
            <div
              key={s.sector}
              className={cn(
                'rounded-md p-3 text-center text-xs font-medium transition-colors',
                heatColor(s.changePercent),
              )}
            >
              <div className="font-semibold truncate">{s.etf}</div>
              <div className="mt-0.5 text-[11px] opacity-80 truncate">{s.sector.split(' ')[0]}</div>
              <div className="mt-1 font-bold">
                {s.changePercent >= 0 ? '+' : ''}{s.changePercent.toFixed(2)}%
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
