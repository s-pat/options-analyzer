'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useMarketOverview } from '@/hooks/useMarketData';
import { cn } from '@/lib/utils';
import { StockLoader } from '@/components/ui/StockLoader';

/** Returns tailwind classes + inline style for a given change % */
function heatStyle(pct: number): { className: string; style: React.CSSProperties } {
  if (pct >= 2)   return { className: 'text-white border-green-500/40',  style: { background: 'linear-gradient(135deg, oklch(0.367 0.12 162) 0%, oklch(0.3 0.1 162) 100%)' } };
  if (pct >= 1)   return { className: 'text-white border-green-400/30',  style: { background: 'linear-gradient(135deg, oklch(0.44 0.14 162) 0%, oklch(0.36 0.11 162) 100%)' } };
  if (pct >= 0.3) return { className: 'text-green-300 border-green-500/20', style: { background: 'oklch(0.696 0.17 162.48 / 12%)' } };
  if (pct >= 0)   return { className: 'text-green-400/70 border-green-500/10', style: { background: 'oklch(0.696 0.17 162.48 / 5%)' } };
  if (pct >= -0.3)return { className: 'text-red-400/70 border-red-500/10',   style: { background: 'oklch(0.645 0.246 16.44 / 5%)' } };
  if (pct >= -1)  return { className: 'text-red-300 border-red-500/20',   style: { background: 'oklch(0.645 0.246 16.44 / 12%)' } };
  if (pct >= -2)  return { className: 'text-white border-red-400/30',     style: { background: 'linear-gradient(135deg, oklch(0.44 0.18 16) 0%, oklch(0.36 0.14 16) 100%)' } };
  return           { className: 'text-white border-red-500/40',            style: { background: 'linear-gradient(135deg, oklch(0.367 0.2 16) 0%, oklch(0.3 0.16 16) 100%)' } };
}

const staggerDelays = ['delay-0', 'delay-50', 'delay-100', 'delay-150', 'delay-200', 'delay-250', 'delay-300', 'delay-400', 'delay-500'];

export function SectorHeatmap() {
  const { data, isLoading, error } = useMarketOverview();

  if (isLoading) return (
    <Card className="rounded-2xl border-white/[0.08] bg-white/[0.03]">
      <CardHeader>
        <CardTitle className="text-sm font-medium text-white/60">Sector Performance</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-2">
          {[...Array(6)].map((_, i) => (
            <div key={i} className={cn('rounded-xl h-20 shimmer animate-slide-up', staggerDelays[i])} />
          ))}
        </div>
      </CardContent>
    </Card>
  );

  if (error) return <div className="text-destructive text-sm">Failed to load sectors</div>;

  const sectors = data?.sectors ?? [];

  return (
    <Card className="rounded-2xl border-white/[0.08] bg-white/[0.03]">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium text-white/60">Sector Performance</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-2">
          {sectors.map((s, i) => {
            const { className, style } = heatStyle(s.changePercent);
            const isPos = s.changePercent >= 0;
            return (
              <div
                key={s.sector}
                className={cn(
                  'rounded-xl border p-3 text-center text-xs font-medium',
                  'transition-all duration-200 hover:scale-[1.03] hover:brightness-110 cursor-default',
                  'animate-slide-up',
                  staggerDelays[i] ?? 'delay-500',
                  className,
                )}
                style={style}
              >
                <div className="font-bold text-sm font-mono">{s.etf}</div>
                <div className="mt-0.5 text-[10px] opacity-60 truncate">{s.sector.split(' ')[0]}</div>
                <div className="mt-1.5 font-bold font-mono tabular-nums text-[13px]">
                  {isPos ? '+' : ''}{s.changePercent.toFixed(2)}%
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
