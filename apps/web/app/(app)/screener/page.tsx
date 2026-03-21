'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Header } from '@/components/layout/Header';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Card, CardContent } from '@/components/ui/card';
import { useStocks } from '@/hooks/useMarketData';
import { useSubscription } from '@/hooks/useSubscription';
import { ArrowUpDown, ArrowUp, ArrowDown, Search, ChevronRight } from 'lucide-react';
import { StockLoader } from '@/components/ui/StockLoader';
import { UpgradeGate } from '@/components/ui/UpgradeGate';
import { cn } from '@/lib/utils';
import type { Stock } from '@/lib/types';

type SortKey = keyof Stock;
type SortDir = 'asc' | 'desc';

/** IV Rank heat badge */
function IVBadge({ rank }: { rank: number }) {
  if (rank <= 30) return (
    <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold font-mono tabular-nums bg-green-500/[0.1] text-green-400 border border-green-500/[0.2]">
      {rank.toFixed(0)}
    </span>
  );
  if (rank <= 60) return (
    <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold font-mono tabular-nums bg-yellow-500/[0.1] text-yellow-400 border border-yellow-500/[0.2]">
      {rank.toFixed(0)}
    </span>
  );
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold font-mono tabular-nums bg-red-500/[0.1] text-red-400 border border-red-500/[0.2]">
      {rank.toFixed(0)}
    </span>
  );
}

/** Mobile card — replaces table row on small screens */
function StockCard({ s, onClick }: { s: Stock; onClick: () => void }) {
  const positive = s.changePercent >= 0;
  return (
    <button
      onClick={onClick}
      className={cn(
        'w-full text-left px-4 py-3.5 border-b border-white/[0.05]',
        'flex items-center gap-3 transition-colors duration-150',
        'active:bg-white/[0.06] touch-manipulation',
      )}
    >
      {/* Symbol + name */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-bold text-sm text-white/90 font-mono">{s.symbol}</span>
          <IVBadge rank={s.ivRank} />
        </div>
        <div className="text-xs text-white/35 truncate mt-0.5">{s.name}</div>
      </div>

      {/* Price + change */}
      <div className="text-right shrink-0">
        <div className="font-mono tabular-nums text-sm font-semibold text-white/85">${s.price?.toFixed(2)}</div>
        <div className={cn('font-mono tabular-nums text-xs font-medium', positive ? 'text-green-400' : 'text-red-400')}>
          {positive ? '+' : ''}{s.changePercent?.toFixed(2)}%
        </div>
      </div>

      {/* RSI */}
      <div className="text-right shrink-0 w-10 hidden xs:block">
        <div className="text-[10px] text-white/25 uppercase">RSI</div>
        <div className="font-mono tabular-nums text-xs text-white/55">{s.rsi?.toFixed(0)}</div>
      </div>

      <ChevronRight className="h-4 w-4 text-white/20 shrink-0" />
    </button>
  );
}

export default function ScreenerPage() {
  const router = useRouter();
  const { data, isLoading, error } = useStocks();
  const { limits, canAccess } = useSubscription();
  const [filter, setFilter] = useState('');
  const [sortKey, setSortKey] = useState<SortKey>('ivRank');
  const [sortDir, setSortDir] = useState<SortDir>('asc');

  const stocks = data?.stocks ?? [];

  const filtered = useMemo(() => {
    const q = filter.toLowerCase();
    return stocks.filter(
      (s) =>
        s.symbol.toLowerCase().includes(q) ||
        s.name?.toLowerCase().includes(q) ||
        s.sector?.toLowerCase().includes(q),
    );
  }, [stocks, filter]);

  const sorted = useMemo(() => {
    return [...filtered].sort((a, b) => {
      const av = a[sortKey] as number;
      const bv = b[sortKey] as number;
      if (typeof av === 'number' && typeof bv === 'number') {
        return sortDir === 'asc' ? av - bv : bv - av;
      }
      const as = String(a[sortKey]);
      const bs = String(b[sortKey]);
      return sortDir === 'asc' ? as.localeCompare(bs) : bs.localeCompare(as);
    });
  }, [filtered, sortKey, sortDir]);

  // For free tier: show first 20 visible, gate the rest.
  const isPro = canAccess('pro');
  const visibleRows = isPro ? sorted : sorted.slice(0, limits.screenerRows);
  const lockedCount = isPro ? 0 : Math.max(0, sorted.length - limits.screenerRows);

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
  };

  const SortHeader = ({ label, k, className }: { label: string; k: SortKey; className?: string }) => {
    const isActive = sortKey === k;
    const Icon = isActive ? (sortDir === 'asc' ? ArrowUp : ArrowDown) : ArrowUpDown;
    return (
      <TableHead
        className={cn(
          'cursor-pointer select-none text-[11px] uppercase tracking-wide font-medium',
          'transition-colors duration-150',
          isActive ? 'text-blue-400' : 'text-white/30 hover:text-white/60',
          className,
        )}
        onClick={() => toggleSort(k)}
      >
        <div className="flex items-center gap-1">
          {label}
          <Icon className={cn('h-3 w-3', isActive ? 'text-blue-400' : 'text-white/30')} />
        </div>
      </TableHead>
    );
  };

  const navigateTo = (symbol: string) => router.push(`/options?symbol=${symbol}`);

  return (
    <>
      <Header title="S&P 500 Screener" />
      <div className="flex-1 space-y-4">

        {/* Filter row */}
        <div className="px-4 pt-4 animate-slide-up">
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/30 pointer-events-none" />
            <input
              type="search"
              placeholder="Filter by symbol, name, or sector…"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              autoCorrect="off"
              autoCapitalize="characters"
              spellCheck={false}
              className={cn(
                'w-full pl-10 pr-4 py-3 rounded-xl',
                'bg-white/[0.04] border border-white/[0.08]',
                'text-white/80 placeholder:text-white/25',
                'focus:outline-none focus:ring-1 focus:ring-blue-500/40 focus:border-blue-500/30',
                'transition-all duration-200',
              )}
              style={{ fontSize: '16px' }}  /* prevent iOS auto-zoom */
            />
          </div>
          <div className="flex items-center justify-between mt-2">
            <span className="text-xs text-white/25 font-mono tabular-nums">
              {isPro ? sorted.length : `${visibleRows.length} of ${sorted.length}`} stocks
              {!isPro && sorted.length > limits.screenerRows && (
                <span className="text-white/20"> (upgrade to see all)</span>
              )}
            </span>
            <span className="text-[10px] text-white/20 uppercase tracking-wide">
              Sorted by {String(sortKey)} {sortDir === 'asc' ? '↑' : '↓'}
            </span>
          </div>
        </div>

        {error && <p className="text-destructive text-sm px-4">Failed to load stocks</p>}

        {isLoading ? (
          <Card className="rounded-2xl border-white/[0.08] bg-white/[0.03] mx-4">
            <CardContent className="flex justify-center py-24">
              <StockLoader size="md" message="Loading S&P 500 data…" />
            </CardContent>
          </Card>
        ) : (
          <>
            {/* ── Mobile card list (< sm) ───────────────────────────────── */}
            <div className="sm:hidden animate-slide-up delay-100">
              <div className="rounded-2xl border border-white/[0.08] bg-white/[0.03] overflow-hidden mx-4">
                {visibleRows.map((s) => (
                  <StockCard key={s.symbol} s={s} onClick={() => navigateTo(s.symbol)} />
                ))}
              </div>
              {lockedCount > 0 && (
                <div className="mx-4 mt-3">
                  <UpgradeGate required="pro" feature={`${lockedCount} more stocks`} description="Upgrade to Pro to see all 503 S&P 500 stocks with full sorting and filtering.">
                    <div className="rounded-2xl border border-white/[0.08] bg-white/[0.03] p-6 space-y-2">
                      {[...Array(Math.min(3, lockedCount))].map((_, i) => (
                        <div key={i} className="h-12 rounded-xl bg-white/[0.03] border border-white/[0.05]" />
                      ))}
                    </div>
                  </UpgradeGate>
                </div>
              )}
            </div>

            {/* ── Desktop table (≥ sm) ──────────────────────────────────── */}
            <div className="hidden sm:block px-4 animate-slide-up delay-100">
              <div className="rounded-2xl border border-white/[0.08] bg-white/[0.03] overflow-hidden">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-white/[0.06] hover:bg-transparent">
                        <SortHeader label="Symbol" k="symbol" className="pl-5" />
                        <TableHead className="hidden sm:table-cell text-[11px] uppercase tracking-wide font-medium text-white/30">Name</TableHead>
                        <TableHead className="hidden md:table-cell text-[11px] uppercase tracking-wide font-medium text-white/30">Sector</TableHead>
                        <SortHeader label="Price" k="price" />
                        <SortHeader label="% Chg" k="changePercent" />
                        <SortHeader label="IVR" k="ivRank" />
                        <SortHeader label="IV %" k="iv" className="hidden md:table-cell" />
                        <SortHeader label="HV30" k="hv30" className="hidden lg:table-cell" />
                        <SortHeader label="RSI" k="rsi" />
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {visibleRows.map((s) => (
                        <TableRow
                          key={s.symbol}
                          className={cn(
                            'cursor-pointer text-sm border-white/[0.04]',
                            'transition-all duration-150 hover:bg-white/[0.04] group',
                          )}
                          onClick={() => navigateTo(s.symbol)}
                        >
                          <TableCell className="pl-5 relative">
                            <span className="absolute left-0 top-0 bottom-0 w-0.5 bg-blue-500 opacity-0 group-hover:opacity-100 transition-opacity duration-150 rounded-r-full" />
                            <span className="font-bold text-white/90 font-mono group-hover:text-blue-400 transition-colors">{s.symbol}</span>
                          </TableCell>
                          <TableCell className="hidden sm:table-cell text-white/40 max-w-[160px] truncate text-xs">{s.name}</TableCell>
                          <TableCell className="hidden md:table-cell">
                            <Badge variant="outline" className="text-[10px] border-white/[0.08] text-white/40 bg-transparent">{s.sector}</Badge>
                          </TableCell>
                          <TableCell className="font-mono tabular-nums text-white/80">${s.price?.toFixed(2)}</TableCell>
                          <TableCell className={cn('font-mono tabular-nums font-medium', s.changePercent >= 0 ? 'text-green-400' : 'text-red-400')}>
                            {s.changePercent >= 0 ? '+' : ''}{s.changePercent?.toFixed(2)}%
                          </TableCell>
                          <TableCell><IVBadge rank={s.ivRank} /></TableCell>
                          <TableCell className="hidden md:table-cell font-mono tabular-nums text-white/50">{s.iv?.toFixed(1)}%</TableCell>
                          <TableCell className="hidden lg:table-cell font-mono tabular-nums text-white/50">{s.hv30?.toFixed(1)}%</TableCell>
                          <TableCell className="font-mono tabular-nums text-white/50">{s.rsi?.toFixed(0)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
              {/* Locked rows gate for desktop */}
              {lockedCount > 0 && (
                <div className="mt-3">
                  <UpgradeGate required="pro" feature={`${lockedCount} more stocks`} description="Upgrade to Pro to unlock all 503 S&P 500 stocks with full sorting and filtering.">
                    <div className="rounded-2xl border border-white/[0.08] bg-white/[0.03] overflow-hidden">
                      <Table>
                        <TableBody>
                          {[...Array(Math.min(5, lockedCount))].map((_, i) => (
                            <TableRow key={i} className="border-white/[0.04]">
                              {[...Array(9)].map((__, j) => (
                                <TableCell key={j}>
                                  <div className="h-4 rounded bg-white/[0.05]" />
                                </TableCell>
                              ))}
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </UpgradeGate>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </>
  );
}
