'use client';

import { cn } from '@/lib/utils';
import type { EarningsEvent } from '@/lib/types';

interface EarningsCardProps {
  earnings: EarningsEvent;
  className?: string;
}

function urgencyConfig(daysUntil: number) {
  if (daysUntil <= 7) {
    return { badge: 'bg-red-500/[0.1] border border-red-500/[0.2] text-red-400', pulse: true };
  }
  if (daysUntil <= 21) {
    return { badge: 'bg-yellow-500/[0.08] border border-yellow-500/[0.15] text-yellow-400', pulse: false };
  }
  return { badge: 'bg-white/[0.04] border border-white/[0.08] text-white/40', pulse: false };
}

export function EarningsCard({ earnings, className }: EarningsCardProps) {
  if (!earnings.hasDate) return null;

  const { badge, pulse } = urgencyConfig(earnings.daysUntil);
  const ivCrushWarning = earnings.daysUntil <= 14;
  const maxDays = 90;
  const progressPct = Math.max(0, Math.min(100, ((maxDays - earnings.daysUntil) / maxDays) * 100));

  return (
    <div className={cn('bg-white/[0.03] border border-white/[0.08] rounded-2xl p-4 space-y-4', className)}>
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <span className="text-xs text-white/40 uppercase tracking-wide font-medium">Earnings</span>
          <span className={cn('inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-semibold font-mono tabular-nums', badge)}>
            {pulse && (
              <span className="relative flex h-1.5 w-1.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-red-500" />
              </span>
            )}
            {earnings.daysUntil}d
          </span>
        </div>
        <span className="text-sm font-medium text-white/70">{earnings.earningsDateFmt}</span>
      </div>

      <div className="space-y-1">
        <div className="flex justify-between text-[10px] text-white/30">
          <span>90 days out</span>
          <span>Earnings day</span>
        </div>
        <div className="h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
          <div
            className={cn('h-full rounded-full transition-all duration-500',
              earnings.daysUntil <= 7 ? 'bg-red-500' : earnings.daysUntil <= 21 ? 'bg-yellow-500' : 'bg-blue-500'
            )}
            style={{ width: `${progressPct}%` }}
          />
        </div>
      </div>

      {(earnings.epsEstimate !== 0 || earnings.epsLow !== 0 || earnings.epsHigh !== 0) && (
        <div className="flex gap-3 flex-wrap">
          <div className="flex flex-col gap-0.5">
            <span className="text-[10px] text-white/35 uppercase tracking-wide">EPS Est.</span>
            <span className="text-sm font-bold font-mono tabular-nums text-white/80">
              {earnings.epsEstimate >= 0 ? '+' : ''}{earnings.epsEstimate.toFixed(2)}
            </span>
          </div>
          <div className="flex flex-col gap-0.5">
            <span className="text-[10px] text-white/35 uppercase tracking-wide">Low</span>
            <span className="text-sm font-mono tabular-nums text-white/50">
              {earnings.epsLow >= 0 ? '+' : ''}{earnings.epsLow.toFixed(2)}
            </span>
          </div>
          <div className="flex flex-col gap-0.5">
            <span className="text-[10px] text-white/35 uppercase tracking-wide">High</span>
            <span className="text-sm font-mono tabular-nums text-white/50">
              {earnings.epsHigh >= 0 ? '+' : ''}{earnings.epsHigh.toFixed(2)}
            </span>
          </div>
        </div>
      )}

      {ivCrushWarning && (
        <div className="flex items-start gap-2 rounded-xl border border-yellow-500/[0.15] bg-yellow-500/[0.08] px-3 py-2.5">
          <span className="text-yellow-400 text-sm leading-none mt-px shrink-0">&#9888;</span>
          <p className="text-xs text-yellow-400 leading-relaxed">
            Earnings in <span className="font-semibold font-mono">{earnings.daysUntil} days</span> — IV crush
            risk after announcement. Option premiums may collapse sharply post-earnings regardless of stock direction.
          </p>
        </div>
      )}
    </div>
  );
}
