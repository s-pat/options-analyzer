'use client';

import { useState } from 'react';
import { Trash2, X, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { PortfolioPosition } from '@/lib/types';

interface PositionRowProps {
  position: PortfolioPosition;
  onClose: (id: string, closedPrice: number) => void;
  onDelete: (id: string) => void;
}

function daysUntil(expirationTimestamp: number): number {
  const now = Date.now();
  const expMs = expirationTimestamp * 1000;
  return Math.ceil((expMs - now) / (1000 * 60 * 60 * 24));
}

function formatMonthDay(expirationFmt: string): string {
  // "Mar 28, 2026" -> "Mar 28"
  const parts = expirationFmt.split(',');
  return parts[0]?.trim() ?? expirationFmt;
}

export function PositionRow({ position, onClose, onDelete }: PositionRowProps) {
  const [showCloseInput, setShowCloseInput] = useState(false);
  const [closePrice, setClosePrice] = useState('');

  const dte = daysUntil(position.expiration);
  const cost = position.entryPrice * Math.abs(position.contracts) * 100;
  const isClosed = position.status === 'closed';

  // P&L calculation
  let pnlDollar = 0;
  let pnlPct = 0;
  if (isClosed && position.closedPrice != null) {
    pnlDollar = (position.closedPrice - position.entryPrice) * Math.abs(position.contracts) * 100;
    if (position.contracts < 0) pnlDollar = -pnlDollar;
    pnlPct = cost > 0 ? (pnlDollar / cost) * 100 : 0;
  }

  const pnlPositive = pnlDollar >= 0;
  const contractsAbs = Math.abs(position.contracts);
  const direction = position.contracts > 0 ? 'Long' : 'Short';

  function handleConfirmClose() {
    const price = parseFloat(closePrice);
    if (!isNaN(price) && price >= 0) {
      onClose(position.id, price);
      setShowCloseInput(false);
      setClosePrice('');
    }
  }

  return (
    <div className={cn(
      'rounded-xl border border-white/[0.08] bg-white/[0.03] p-4 transition-colors',
      isClosed && 'opacity-60',
    )}>
      {/* Top row: Symbol + badge + actions */}
      <div className="flex items-start justify-between gap-2 mb-3">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-mono font-bold text-white/90 text-sm">{position.symbol}</span>
          <span className={cn(
            'text-[10px] font-bold uppercase px-1.5 py-0.5 rounded border',
            position.optionType === 'call'
              ? 'bg-green-500/10 border-green-500/20 text-green-400'
              : 'bg-red-500/10 border-red-500/20 text-red-400',
          )}>
            {position.optionType}
          </span>
          <span className="text-xs text-white/50 font-mono">${position.strike}</span>
          <span className="text-xs text-white/40">{formatMonthDay(position.expirationFmt)}</span>

          {/* Days to expiry badge */}
          {!isClosed && (
            <span className={cn(
              'text-[10px] font-medium px-1.5 py-0.5 rounded border',
              dte < 0
                ? 'bg-red-500/20 border-red-500/30 text-red-300'
                : dte < 7
                ? 'bg-red-500/10 border-red-500/20 text-red-400'
                : dte < 14
                ? 'bg-yellow-500/10 border-yellow-500/20 text-yellow-400'
                : 'bg-white/[0.04] border-white/[0.08] text-white/30',
            )}>
              {dte < 0 ? 'Expired' : `${dte}d`}
            </span>
          )}

          {isClosed && (
            <span className="text-[10px] font-medium px-1.5 py-0.5 rounded border bg-white/[0.04] border-white/[0.08] text-white/30">
              Closed {position.closedDate}
            </span>
          )}
        </div>

        {/* Actions */}
        {!isClosed && (
          <div className="flex items-center gap-1.5 shrink-0">
            {!showCloseInput ? (
              <>
                <button
                  onClick={() => setShowCloseInput(true)}
                  className="text-[11px] font-medium px-2.5 py-1.5 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-400 hover:bg-blue-500/20 transition-colors"
                >
                  Close
                </button>
                <button
                  onClick={() => onDelete(position.id)}
                  className="p-1.5 rounded-lg hover:bg-white/[0.05] transition-colors"
                  title="Delete position"
                >
                  <Trash2 className="h-3.5 w-3.5 text-red-400/60 hover:text-red-400" />
                </button>
              </>
            ) : (
              <div className="flex items-center gap-1.5">
                <div className="relative">
                  <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs text-white/30">$</span>
                  <input
                    type="number"
                    placeholder="0.00"
                    min="0"
                    step="0.01"
                    value={closePrice}
                    onChange={e => setClosePrice(e.target.value)}
                    className="w-20 pl-5 pr-2 py-1.5 text-xs bg-white/[0.04] border border-white/[0.08] rounded-lg text-white/80 focus:border-blue-500/50 outline-none"
                    autoFocus
                  />
                </div>
                <button
                  onClick={handleConfirmClose}
                  className="p-1.5 rounded-lg bg-green-500/10 border border-green-500/20 hover:bg-green-500/20 transition-colors"
                  title="Confirm close"
                >
                  <Check className="h-3.5 w-3.5 text-green-400" />
                </button>
                <button
                  onClick={() => { setShowCloseInput(false); setClosePrice(''); }}
                  className="p-1.5 rounded-lg hover:bg-white/[0.05] transition-colors"
                  title="Cancel"
                >
                  <X className="h-3.5 w-3.5 text-white/40" />
                </button>
              </div>
            )}
          </div>
        )}

        {isClosed && (
          <button
            onClick={() => onDelete(position.id)}
            className="p-1.5 rounded-lg hover:bg-white/[0.05] transition-colors shrink-0"
            title="Delete position"
          >
            <Trash2 className="h-3.5 w-3.5 text-red-400/60 hover:text-red-400" />
          </button>
        )}
      </div>

      {/* Stats row */}
      <div className="flex flex-wrap gap-4">
        {/* Entry */}
        <div>
          <span className="text-[10px] text-white/35 uppercase tracking-wide font-medium block mb-0.5">Entry</span>
          <span className="font-mono text-xs text-white/70 tabular-nums">
            ${position.entryPrice.toFixed(2)} × {contractsAbs} {contractsAbs === 1 ? 'contract' : 'contracts'}
          </span>
          <span className="text-[10px] text-white/30 ml-1">({direction})</span>
        </div>

        {/* Cost basis */}
        <div>
          <span className="text-[10px] text-white/35 uppercase tracking-wide font-medium block mb-0.5">Cost Basis</span>
          <span className="font-mono text-xs text-white/70 tabular-nums">${cost.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
        </div>

        {/* P&L (closed only) */}
        {isClosed && (
          <>
            <div>
              <span className="text-[10px] text-white/35 uppercase tracking-wide font-medium block mb-0.5">Close Price</span>
              <span className="font-mono text-xs text-white/70 tabular-nums">${position.closedPrice?.toFixed(2)}</span>
            </div>
            <div>
              <span className="text-[10px] text-white/35 uppercase tracking-wide font-medium block mb-0.5">Realized P&L</span>
              <span className={cn(
                'font-mono text-xs font-bold tabular-nums',
                pnlPositive ? 'text-green-400' : 'text-red-400',
              )}>
                {pnlPositive ? '+' : ''}${pnlDollar >= 0 ? '' : '−'}{Math.abs(pnlDollar).toFixed(2)} ({pnlPositive ? '+' : ''}{pnlPct.toFixed(1)}%)
              </span>
            </div>
          </>
        )}

        {/* For open positions: show note about live pricing */}
        {!isClosed && (
          <div>
            <span className="text-[10px] text-white/35 uppercase tracking-wide font-medium block mb-0.5">Live P&L</span>
            <span className="text-[10px] text-white/25 italic">Use Options Analyzer for live pricing</span>
          </div>
        )}
      </div>

      {/* Notes */}
      {position.notes && (
        <div className="mt-3 pt-3 border-t border-white/[0.06]">
          <span className="text-[10px] text-white/25 italic">{position.notes}</span>
        </div>
      )}
    </div>
  );
}
