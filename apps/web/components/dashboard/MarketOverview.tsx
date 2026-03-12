'use client';

import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { useMarketOverview } from '@/hooks/useMarketData';
import { StockLoader } from '@/components/ui/StockLoader';
import { cn } from '@/lib/utils';

function fmt(n: number, digits = 2) {
  return n?.toFixed(digits) ?? '—';
}

const staggerDelays = ['delay-0', 'delay-100', 'delay-200', 'delay-300'];

export function MarketOverview() {
  const { data, error, isLoading } = useMarketOverview();

  if (isLoading) return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {[...Array(4)].map((_, i) => (
        <div key={i} className={cn('rounded-2xl border border-white/[0.08] bg-white/[0.03] p-5 space-y-3 animate-slide-up', staggerDelays[i])}>
          <div className="shimmer h-3 w-24 rounded-full" />
          <div className="shimmer h-7 w-32 rounded-full" />
          <div className="shimmer h-3 w-20 rounded-full" />
        </div>
      ))}
    </div>
  );

  if (error) return <div className="text-destructive text-sm">Failed to load market data</div>;

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {data?.indices?.map((idx, i) => {
        const positive = idx.changePercent >= 0;
        const neutral = idx.trend === 'neutral';
        const Icon = idx.trend === 'bullish' ? TrendingUp : idx.trend === 'bearish' ? TrendingDown : Minus;

        const accentColor = neutral
          ? 'oklch(1 0 0 / 20%)'
          : positive
          ? 'oklch(0.696 0.17 162.48 / 40%)'   /* green */
          : 'oklch(0.645 0.246 16.44 / 40%)';   /* red */

        const borderClass = neutral
          ? 'border-white/[0.08]'
          : positive
          ? 'border-green-500/[0.25]'
          : 'border-red-500/[0.25]';

        const glowStyle = neutral
          ? {}
          : { boxShadow: `0 0 24px -6px ${accentColor}` };

        return (
          <div
            key={idx.symbol}
            className={cn(
              'relative rounded-2xl border bg-white/[0.03] p-5 overflow-hidden',
              'transition-all duration-300 hover:bg-white/[0.05]',
              'animate-slide-up',
              staggerDelays[i],
              borderClass,
            )}
            style={glowStyle}
          >
            {/* Top accent line */}
            <div
              className="absolute inset-x-0 top-0 h-px"
              style={{
                background: neutral
                  ? 'oklch(1 0 0 / 12%)'
                  : positive
                  ? 'linear-gradient(90deg, transparent, oklch(0.696 0.17 162.48 / 60%), transparent)'
                  : 'linear-gradient(90deg, transparent, oklch(0.645 0.246 16.44 / 60%), transparent)',
              }}
            />

            {/* Header */}
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-medium text-white/40 uppercase tracking-wider">{idx.name}</span>
              <div className={cn(
                'flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold',
                neutral
                  ? 'bg-white/[0.06] text-white/50'
                  : positive
                  ? 'bg-green-500/[0.12] text-green-400'
                  : 'bg-red-500/[0.12] text-red-400',
              )}>
                <Icon className="h-2.5 w-2.5" />
                {idx.trend}
              </div>
            </div>

            {/* Price */}
            <div className="font-mono text-2xl font-bold tracking-tight tabular-nums">
              {idx.symbol === 'VIX' ? fmt(idx.price) : `$${fmt(idx.price)}`}
            </div>

            {/* Change */}
            <div className={cn(
              'flex items-center gap-1 text-sm mt-1.5 font-medium',
              positive ? 'text-green-400' : neutral ? 'text-white/40' : 'text-red-400',
            )}>
              <Icon className="h-3.5 w-3.5" />
              <span className="font-mono tabular-nums">
                {positive ? '+' : ''}{fmt(idx.change)} ({positive ? '+' : ''}{fmt(idx.changePercent)}%)
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
