'use client';

import { cn } from '@/lib/utils';
import type { IVCrushEstimate } from '@/lib/types';

interface IVCrushPanelProps {
  estimate: IVCrushEstimate;
}

function VerdictBadge({ verdict }: { verdict: string }) {
  const styles: Record<string, string> = {
    'High Risk':     'bg-red-500/15 border-red-500/30 text-red-400',
    'Moderate Risk': 'bg-yellow-500/15 border-yellow-500/30 text-yellow-400',
    'Low Risk':      'bg-green-500/15 border-green-500/30 text-green-400',
  };
  const cls = styles[verdict] ?? 'bg-white/[0.06] border-white/[0.1] text-white/60';
  return (
    <span className={cn('inline-flex items-center gap-1 px-2 py-0.5 rounded-md border text-[11px] font-semibold uppercase tracking-wide', cls)}>
      {verdict === 'High Risk' && '⚠ '}
      {verdict}
    </span>
  );
}

function IVBox({ label, value, sub, danger }: { label: string; value: string; sub?: string; danger?: boolean }) {
  return (
    <div className={cn(
      'flex flex-col gap-1 p-3 rounded-xl border flex-1',
      danger
        ? 'bg-red-500/[0.07] border-red-500/[0.2]'
        : 'bg-white/[0.03] border-white/[0.08]',
    )}>
      <span className="text-[10px] text-white/35 uppercase tracking-wide font-medium">{label}</span>
      <span className={cn('text-xl font-bold font-mono tabular-nums', danger ? 'text-red-400' : 'text-white/90')}>
        {value}
      </span>
      {sub && <span className="text-[10px] text-white/35">{sub}</span>}
    </div>
  );
}

export function IVCrushPanel({ estimate }: IVCrushPanelProps) {
  const {
    verdict,
    currentIVPct,
    postEarningsIVPct,
    estimatedCrushPct,
    ivRank,
    currentOptionPrice,
    postEarningsPrice,
    pnlPct,
    pnlDollar,
    pnlPerContract,
    scenarios,
    warning,
    dte,
  } = estimate;

  const isLoss = pnlPct < 0;
  const pnlColor = isLoss ? 'text-red-400' : 'text-green-400';
  const pnlBg = isLoss ? 'bg-red-500/[0.07] border-red-500/[0.2]' : 'bg-green-500/[0.07] border-green-500/[0.2]';

  // Max bar width reference for scenarios (absolute pnl%)
  const maxAbsPnl = Math.max(...scenarios.map(s => Math.abs(s.pnlPct)), 1);

  return (
    <div className="rounded-2xl border border-white/[0.08] bg-white/[0.03] p-4 space-y-4 animate-slide-up">

      {/* Header */}
      <div className="flex items-center gap-2 flex-wrap">
        <VerdictBadge verdict={verdict} />
        <span className="text-sm font-semibold text-white/80">IV Crush Simulator</span>
        <span className="ml-auto text-[10px] text-white/30 font-mono">{dte}d to expiry</span>
      </div>

      {/* IV Comparison */}
      <div className="flex items-center gap-2">
        <IVBox
          label="Current IV"
          value={`${currentIVPct.toFixed(1)}%`}
          sub={`IV Rank: ${ivRank.toFixed(0)}`}
        />

        {/* Arrow with crush pct */}
        <div className="flex flex-col items-center gap-0.5 px-1 shrink-0">
          <span className="text-red-400 text-lg leading-none">→</span>
          <span className="text-[10px] text-red-400 font-mono font-bold whitespace-nowrap">
            ↓ {estimatedCrushPct.toFixed(0)}%
          </span>
        </div>

        <IVBox
          label="Post-Earnings IV (est.)"
          value={`${postEarningsIVPct.toFixed(1)}%`}
          sub="IV after crush"
          danger
        />
      </div>

      {/* P&L Impact box */}
      <div className={cn('rounded-xl border p-3 space-y-1.5', pnlBg)}>
        <div className="text-[10px] text-white/40 uppercase tracking-wide font-medium">Option Value Impact</div>
        <div className={cn('text-2xl font-bold font-mono tabular-nums', pnlColor)}>
          {pnlPct >= 0 ? '+' : ''}{pnlPct.toFixed(1)}%
        </div>
        <div className="text-xs text-white/55 font-mono">
          ${currentOptionPrice.toFixed(2)} → ${postEarningsPrice.toFixed(2)} per share
          <span className="text-white/30 mx-1">·</span>
          {pnlDollar >= 0 ? '+' : ''}${Math.abs(pnlDollar).toFixed(2)}/share
        </div>
        <div className={cn('text-sm font-semibold font-mono tabular-nums', pnlColor)}>
          Per contract: {pnlPerContract >= 0 ? '+' : ''}${pnlPerContract.toFixed(2)}
        </div>
      </div>

      {/* Scenarios table */}
      <div className="space-y-2">
        <div className="text-[10px] text-white/35 uppercase tracking-wide font-medium">Crush Scenarios</div>
        <div className="space-y-2">
          {scenarios.map((s) => {
            const barWidth = Math.min(Math.abs(s.pnlPct) / maxAbsPnl * 100, 100);
            const isNeg = s.pnlPct < 0;
            return (
              <div key={s.label} className="space-y-1">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-white/55 font-medium">{s.label}</span>
                  <div className="flex items-center gap-2 font-mono tabular-nums">
                    <span className="text-white/35">${s.optionPrice.toFixed(2)}</span>
                    <span className={isNeg ? 'text-red-400 font-semibold' : 'text-green-400 font-semibold'}>
                      {s.pnlPct >= 0 ? '+' : ''}{s.pnlPct.toFixed(1)}%
                    </span>
                  </div>
                </div>
                {/* Bar */}
                <div className="h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${barWidth}%`,
                      background: isNeg
                        ? `rgba(239, 68, 68, ${0.3 + (barWidth / 100) * 0.5})`
                        : `rgba(34, 197, 94, ${0.3 + (barWidth / 100) * 0.5})`,
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Warning text */}
      <p className="text-[11px] text-white/35 leading-relaxed border-t border-white/[0.06] pt-3">
        {warning}
      </p>
    </div>
  );
}
