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
import { ArrowUpDown, ArrowUp, ArrowDown, Search } from 'lucide-react';
import { StockLoader } from '@/components/ui/StockLoader';
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

export default function ScreenerPage() {
  const router = useRouter();
  const { data, isLoading, error } = useStocks();
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

  return (
    <>
      <Header title="S&P 500 Screener" />
      <div className="flex-1 p-6 space-y-4">

        {/* Filter row */}
        <div className="flex items-center gap-4 animate-slide-up">
          <div className="relative max-w-sm w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-white/30 pointer-events-none" />
            <input
              type="text"
              placeholder="Filter by symbol, name, or sector…"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className={cn(
                'w-full pl-9 pr-4 py-2 text-sm rounded-xl',
                'bg-white/[0.04] border border-white/[0.08]',
                'text-white/80 placeholder:text-white/25',
                'focus:outline-none focus:ring-1 focus:ring-blue-500/40 focus:border-blue-500/30',
                'transition-all duration-200',
              )}
            />
          </div>
          <span className="text-sm text-white/30 shrink-0 font-mono tabular-nums">
            {sorted.length} <span className="text-white/20">stocks</span>
          </span>
        </div>

        {error && <p className="text-destructive text-sm animate-slide-up">Failed to load stocks</p>}

        {isLoading ? (
          <Card className="rounded-2xl border-white/[0.08] bg-white/[0.03]">
            <CardContent className="flex justify-center py-24">
              <StockLoader size="md" message="Loading S&P 500 data…" />
            </CardContent>
          </Card>
        ) : (
          <div className="rounded-2xl border border-white/[0.08] bg-white/[0.03] overflow-hidden animate-slide-up delay-100">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-white/[0.06] hover:bg-transparent">
                    <SortHeader label="Symbol" k="symbol" className="pl-5" />
                    <TableHead className="hidden sm:table-cell text-[11px] uppercase tracking-wide font-medium text-white/30">Name</TableHead>
                    <TableHead className="hidden sm:table-cell text-[11px] uppercase tracking-wide font-medium text-white/30">Sector</TableHead>
                    <SortHeader label="Price" k="price" />
                    <SortHeader label="% Chg" k="changePercent" />
                    <SortHeader label="IVR" k="ivRank" />
                    <SortHeader label="IV %" k="iv" className="hidden md:table-cell" />
                    <SortHeader label="HV30" k="hv30" className="hidden sm:table-cell" />
                    <SortHeader label="RSI" k="rsi" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sorted.map((s, i) => (
                    <TableRow
                      key={s.symbol}
                      className={cn(
                        'cursor-pointer text-sm border-white/[0.04]',
                        'transition-all duration-150',
                        'hover:bg-white/[0.04]',
                        'group',
                      )}
                      onClick={() => router.push(`/options?symbol=${s.symbol}`)}
                    >
                      {/* Left accent on hover */}
                      <TableCell className="pl-5 relative">
                        <span className="absolute left-0 top-0 bottom-0 w-0.5 bg-blue-500 opacity-0 group-hover:opacity-100 transition-opacity duration-150 rounded-r-full" />
                        <span className="font-bold text-white/90 font-mono group-hover:text-blue-400 transition-colors">{s.symbol}</span>
                      </TableCell>
                      <TableCell className="hidden sm:table-cell text-white/40 max-w-[160px] truncate text-xs">{s.name}</TableCell>
                      <TableCell className="hidden sm:table-cell">
                        <Badge variant="outline" className="text-[10px] border-white/[0.08] text-white/40 bg-transparent">{s.sector}</Badge>
                      </TableCell>
                      <TableCell className="font-mono tabular-nums text-white/80">${s.price?.toFixed(2)}</TableCell>
                      <TableCell className={cn(
                        'font-mono tabular-nums font-medium',
                        s.changePercent >= 0 ? 'text-green-400' : 'text-red-400',
                      )}>
                        {s.changePercent >= 0 ? '+' : ''}{s.changePercent?.toFixed(2)}%
                      </TableCell>
                      <TableCell><IVBadge rank={s.ivRank} /></TableCell>
                      <TableCell className="hidden md:table-cell font-mono tabular-nums text-white/50">{s.iv?.toFixed(1)}%</TableCell>
                      <TableCell className="hidden sm:table-cell font-mono tabular-nums text-white/50">{s.hv30?.toFixed(1)}%</TableCell>
                      <TableCell className="font-mono tabular-nums text-white/50">{s.rsi?.toFixed(0)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
