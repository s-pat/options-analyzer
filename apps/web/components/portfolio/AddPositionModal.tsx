'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import type { PortfolioPosition } from '@/lib/types';
import { cn } from '@/lib/utils';

interface AddPositionModalProps {
  open: boolean;
  onClose: () => void;
  onAdd: (pos: Omit<PortfolioPosition, 'id' | 'status'>) => void;
}

const TODAY = new Date().toISOString().slice(0, 10);

function formatExpirationFmt(dateStr: string): string {
  if (!dateStr) return '';
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export function AddPositionModal({ open, onClose, onAdd }: AddPositionModalProps) {
  const [symbol, setSymbol] = useState('');
  const [optionType, setOptionType] = useState<'call' | 'put'>('call');
  const [strike, setStrike] = useState('');
  const [expiration, setExpiration] = useState('');
  const [contracts, setContracts] = useState('1');
  const [entryPrice, setEntryPrice] = useState('');
  const [entryDate, setEntryDate] = useState(TODAY);
  const [notes, setNotes] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  function validate() {
    const errs: Record<string, string> = {};
    if (!symbol.trim()) errs.symbol = 'Required';
    if (!strike || isNaN(Number(strike)) || Number(strike) <= 0) errs.strike = 'Enter a valid strike price';
    if (!expiration) errs.expiration = 'Required';
    if (!contracts || isNaN(Number(contracts)) || Number(contracts) === 0) errs.contracts = 'Enter number of contracts';
    if (!entryPrice || isNaN(Number(entryPrice)) || Number(entryPrice) <= 0) errs.entryPrice = 'Enter a valid entry price';
    if (!entryDate) errs.entryDate = 'Required';
    return errs;
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }

    const expirationDate = new Date(expiration + 'T00:00:00');
    const expirationTimestamp = Math.floor(expirationDate.getTime() / 1000);
    const expirationFmt = formatExpirationFmt(expiration);

    onAdd({
      symbol: symbol.trim().toUpperCase(),
      optionType,
      strike: Number(strike),
      expiration: expirationTimestamp,
      expirationFmt,
      contracts: Number(contracts),
      entryPrice: Number(entryPrice),
      entryDate,
      notes: notes.trim() || undefined,
    });

    // Reset form
    setSymbol('');
    setOptionType('call');
    setStrike('');
    setExpiration('');
    setContracts('1');
    setEntryPrice('');
    setEntryDate(TODAY);
    setNotes('');
    setErrors({});
    onClose();
  }

  function handleClose() {
    setErrors({});
    onClose();
  }

  const labelCls = 'block text-[10px] text-white/40 uppercase tracking-wide font-medium mb-1';
  const inputCls = 'w-full bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-2 text-sm text-white/90 focus:border-blue-500/50 outline-none transition-colors placeholder:text-white/20';
  const errorCls = 'text-[10px] text-red-400 mt-1';

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) handleClose(); }}>
      <DialogContent className="sm:max-w-md w-full max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add Position</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          {/* Symbol + Type row */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>Symbol</label>
              <input
                type="text"
                placeholder="AAPL"
                value={symbol}
                onChange={e => setSymbol(e.target.value.toUpperCase())}
                className={cn(inputCls, errors.symbol && 'border-red-500/50')}
              />
              {errors.symbol && <p className={errorCls}>{errors.symbol}</p>}
            </div>
            <div>
              <label className={labelCls}>Type</label>
              <div className="flex rounded-lg border border-white/[0.08] overflow-hidden">
                <button
                  type="button"
                  onClick={() => setOptionType('call')}
                  className={cn(
                    'flex-1 py-2 text-sm font-medium transition-colors',
                    optionType === 'call'
                      ? 'bg-green-500/20 text-green-400 border-r border-white/[0.08]'
                      : 'bg-white/[0.02] text-white/40 hover:text-white/60 border-r border-white/[0.08]',
                  )}
                >
                  CALL
                </button>
                <button
                  type="button"
                  onClick={() => setOptionType('put')}
                  className={cn(
                    'flex-1 py-2 text-sm font-medium transition-colors',
                    optionType === 'put'
                      ? 'bg-red-500/20 text-red-400'
                      : 'bg-white/[0.02] text-white/40 hover:text-white/60',
                  )}
                >
                  PUT
                </button>
              </div>
            </div>
          </div>

          {/* Strike + Expiration row */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>Strike Price</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-white/30">$</span>
                <input
                  type="number"
                  placeholder="185.00"
                  min="0"
                  step="0.5"
                  value={strike}
                  onChange={e => setStrike(e.target.value)}
                  className={cn(inputCls, 'pl-7', errors.strike && 'border-red-500/50')}
                />
              </div>
              {errors.strike && <p className={errorCls}>{errors.strike}</p>}
            </div>
            <div>
              <label className={labelCls}>Expiration</label>
              <input
                type="date"
                value={expiration}
                onChange={e => setExpiration(e.target.value)}
                className={cn(inputCls, errors.expiration && 'border-red-500/50')}
              />
              {errors.expiration && <p className={errorCls}>{errors.expiration}</p>}
            </div>
          </div>

          {/* Contracts + Entry Price row */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>Contracts</label>
              <input
                type="number"
                placeholder="1"
                step="1"
                value={contracts}
                onChange={e => setContracts(e.target.value)}
                className={cn(inputCls, errors.contracts && 'border-red-500/50')}
              />
              {errors.contracts && <p className={errorCls}>{errors.contracts}</p>}
            </div>
            <div>
              <label className={labelCls}>Entry Price / Share</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-white/30">$</span>
                <input
                  type="number"
                  placeholder="2.45"
                  min="0"
                  step="0.01"
                  value={entryPrice}
                  onChange={e => setEntryPrice(e.target.value)}
                  className={cn(inputCls, 'pl-7', errors.entryPrice && 'border-red-500/50')}
                />
              </div>
              {errors.entryPrice && <p className={errorCls}>{errors.entryPrice}</p>}
            </div>
          </div>

          {/* Entry Date */}
          <div>
            <label className={labelCls}>Entry Date</label>
            <input
              type="date"
              value={entryDate}
              onChange={e => setEntryDate(e.target.value)}
              className={cn(inputCls, errors.entryDate && 'border-red-500/50')}
            />
            {errors.entryDate && <p className={errorCls}>{errors.entryDate}</p>}
          </div>

          {/* Notes */}
          <div>
            <label className={labelCls}>Notes <span className="normal-case text-white/20">(optional)</span></label>
            <textarea
              placeholder="Thesis, setup notes…"
              value={notes}
              onChange={e => setNotes(e.target.value)}
              rows={2}
              className={cn(inputCls, 'resize-none')}
            />
          </div>

          {/* Footer actions */}
          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={handleClose}
              className="flex-1 py-2.5 rounded-xl border border-white/[0.08] text-sm text-white/40 hover:text-white/60 hover:bg-white/[0.04] transition-colors font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 py-2.5 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 hover:bg-blue-500/20 text-sm font-medium transition-colors"
            >
              Add Position
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
