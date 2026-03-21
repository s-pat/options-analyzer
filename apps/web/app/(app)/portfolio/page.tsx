'use client';

import { useState, useMemo } from 'react';
import { Briefcase, Plus, ChevronDown, ChevronUp } from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { PositionRow } from '@/components/portfolio/PositionRow';
import { AddPositionModal } from '@/components/portfolio/AddPositionModal';
import { usePortfolio } from '@/hooks/usePortfolio';
import { cn } from '@/lib/utils';
import type { PortfolioPosition } from '@/lib/types';

function daysUntil(expirationTimestamp: number): number {
  const now = Date.now();
  return Math.ceil((expirationTimestamp * 1000 - now) / (1000 * 60 * 60 * 24));
}

function StatCard({ label, value, accent }: { label: string; value: string; accent?: string }) {
  return (
    <div className="flex flex-col gap-1 px-4 py-3 rounded-xl bg-white/[0.03] border border-white/[0.06]">
      <span className="text-[10px] text-white/35 uppercase tracking-wide font-medium">{label}</span>
      <span className={cn('font-mono tabular-nums font-bold text-sm', accent ?? 'text-white/80')}>{value}</span>
    </div>
  );
}

function EmptyState({ onAdd }: { onAdd: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
      <div className="w-14 h-14 rounded-2xl bg-white/[0.04] border border-white/[0.08] flex items-center justify-center mb-4">
        <Briefcase className="h-6 w-6 text-white/20" />
      </div>
      <h3 className="text-sm font-semibold text-white/60 mb-1">No positions yet</h3>
      <p className="text-xs text-white/30 max-w-xs leading-relaxed mb-5">
        Add your first trade to track your P&L in real time.
      </p>
      <button
        onClick={onAdd}
        className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 hover:bg-blue-500/20 text-sm font-medium transition-colors"
      >
        <Plus className="h-4 w-4" />
        Add Position
      </button>
    </div>
  );
}

export default function PortfolioPage() {
  const { positions, openPositions, closedPositions, addPosition, closePosition, deletePosition, loaded } = usePortfolio();
  const [modalOpen, setModalOpen] = useState(false);
  const [closedExpanded, setClosedExpanded] = useState(false);

  // Sort open positions by days to expiry ascending
  const sortedOpen = useMemo(() => {
    return [...openPositions].sort((a, b) => daysUntil(a.expiration) - daysUntil(b.expiration));
  }, [openPositions]);

  // Summary stats
  const totalCost = openPositions.reduce((sum, p) => sum + p.entryPrice * Math.abs(p.contracts) * 100, 0);

  const closedPnL = closedPositions.reduce((sum, p) => {
    if (p.closedPrice == null) return sum;
    const direction = p.contracts > 0 ? 1 : -1;
    return sum + (p.closedPrice - p.entryPrice) * Math.abs(p.contracts) * 100 * direction;
  }, 0);

  const winners = closedPositions.filter(p => {
    if (p.closedPrice == null) return false;
    const direction = p.contracts > 0 ? 1 : -1;
    return (p.closedPrice - p.entryPrice) * direction > 0;
  }).length;
  const losers = closedPositions.length - winners;

  const hasPositions = positions.length > 0;

  if (!loaded) {
    return (
      <>
        <Header title="Portfolio Tracker" />
        <div className="flex-1 p-4 sm:p-6">
          <div className="rounded-2xl border border-white/[0.08] bg-white/[0.03] h-40 animate-pulse" />
        </div>
      </>
    );
  }

  return (
    <>
      <Header title="Portfolio Tracker" />
      <div className="flex-1 p-4 sm:p-6 space-y-4 sm:space-y-6">

        {/* Summary strip */}
        <div className="rounded-2xl border border-white/[0.08] bg-white/[0.03] p-4 sm:p-5 animate-slide-up">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-semibold text-white/80">Portfolio Summary</h2>
              <p className="text-[11px] text-white/30 mt-0.5">localStorage — no backend required</p>
            </div>
            <button
              onClick={() => setModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 hover:bg-blue-500/20 text-sm font-medium transition-colors"
            >
              <Plus className="h-4 w-4" />
              <span className="hidden sm:inline">Add Position</span>
              <span className="sm:hidden">Add</span>
            </button>
          </div>

          {hasPositions ? (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <StatCard label="Open Positions" value={String(openPositions.length)} />
              <StatCard
                label="Capital Deployed"
                value={`$${totalCost.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`}
              />
              <StatCard
                label="Realized P&L"
                value={`${closedPnL >= 0 ? '+' : ''}$${Math.abs(closedPnL).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                accent={closedPositions.length === 0 ? 'text-white/40' : closedPnL >= 0 ? 'text-green-400' : 'text-red-400'}
              />
              <StatCard
                label="Win / Loss"
                value={closedPositions.length > 0 ? `${winners}W / ${losers}L` : '—'}
                accent={closedPositions.length === 0 ? 'text-white/40' : winners >= losers ? 'text-green-400' : 'text-red-400'}
              />
            </div>
          ) : (
            <p className="text-xs text-white/30">No positions yet. Add your first trade to track your P&L in real time.</p>
          )}
        </div>

        {/* Open Positions */}
        {sortedOpen.length > 0 && (
          <div className="space-y-3 animate-slide-up delay-50">
            <div className="flex items-center gap-2">
              <h3 className="text-xs text-white/40 uppercase tracking-wide font-medium">Open Positions</h3>
              <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-blue-500/10 border border-blue-500/20 text-blue-400">
                {sortedOpen.length}
              </span>
            </div>
            <div className="space-y-2">
              {sortedOpen.map((pos: PortfolioPosition) => (
                <PositionRow
                  key={pos.id}
                  position={pos}
                  onClose={closePosition}
                  onDelete={deletePosition}
                />
              ))}
            </div>
          </div>
        )}

        {/* Empty state */}
        {!hasPositions && (
          <EmptyState onAdd={() => setModalOpen(true)} />
        )}

        {hasPositions && openPositions.length === 0 && closedPositions.length > 0 && (
          <div className="rounded-2xl border border-white/[0.08] bg-white/[0.03] p-6 text-center animate-slide-up">
            <p className="text-sm text-white/30">No open positions. All trades have been closed.</p>
            <button
              onClick={() => setModalOpen(true)}
              className="mt-3 flex items-center gap-2 mx-auto px-4 py-2 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 hover:bg-blue-500/20 text-sm font-medium transition-colors"
            >
              <Plus className="h-4 w-4" />
              Add Position
            </button>
          </div>
        )}

        {/* Closed Positions (collapsible) */}
        {closedPositions.length > 0 && (
          <div className="space-y-3 animate-slide-up delay-100">
            <button
              onClick={() => setClosedExpanded(prev => !prev)}
              className="flex items-center gap-2 w-full text-left"
            >
              <h3 className="text-xs text-white/40 uppercase tracking-wide font-medium">Closed Positions</h3>
              <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-white/[0.04] border border-white/[0.08] text-white/30">
                {closedPositions.length}
              </span>
              <span className="ml-auto text-white/30">
                {closedExpanded
                  ? <ChevronUp className="h-3.5 w-3.5" />
                  : <ChevronDown className="h-3.5 w-3.5" />
                }
              </span>
            </button>

            {closedExpanded && (
              <div className="space-y-2">
                {closedPositions.map((pos: PortfolioPosition) => (
                  <PositionRow
                    key={pos.id}
                    position={pos}
                    onClose={closePosition}
                    onDelete={deletePosition}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* Disclaimer */}
        <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] px-4 py-3 text-[11px] text-white/25 leading-relaxed animate-slide-up delay-150">
          Positions are stored locally in your browser. Live option pricing is unavailable — use the Options Analyzer to check current market prices. This is not financial advice.
        </div>
      </div>

      <AddPositionModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onAdd={addPosition}
      />
    </>
  );
}
