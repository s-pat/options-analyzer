'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Header } from '@/components/layout/Header';
import { Input } from '@/components/ui/input';
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
import { ArrowUpDown } from 'lucide-react';
import { StockLoader } from '@/components/ui/StockLoader';
import { cn } from '@/lib/utils';
import type { Stock } from '@/lib/types';

type SortKey = keyof Stock;
type SortDir = 'asc' | 'desc';

function IVBadge({ rank }: { rank: number }) {
  const variant = rank <= 30 ? 'default' : rank <= 60 ? 'secondary' : 'destructive';
  return <Badge variant={variant}>{rank.toFixed(0)}</Badge>;
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

  const SortHeader = ({ label, k, className }: { label: string; k: SortKey; className?: string }) => (
    <TableHead
      className={`cursor-pointer select-none ${className ?? ''}`}
      onClick={() => toggleSort(k)}
    >
      <div className="flex items-center gap-1">
        {label}
        <ArrowUpDown className={cn('h-3 w-3', sortKey === k ? 'text-primary' : 'text-muted-foreground')} />
      </div>
    </TableHead>
  );

  return (
    <>
      <Header title="S&P 500 Screener" />
      <div className="flex-1 p-6 space-y-4">
        <div className="flex items-center gap-4">
          <Input
            placeholder="Filter by symbol, name, or sector…"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="max-w-sm"
          />
          <span className="text-sm text-muted-foreground">{sorted.length} stocks</span>
        </div>

        {error && <p className="text-destructive text-sm">Failed to load stocks</p>}

        {isLoading ? (
          <Card>
            <CardContent className="flex justify-center py-24">
              <StockLoader size="md" message="Loading S&P 500 data…" />
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="p-0 overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="text-xs">
                    <SortHeader label="Symbol" k="symbol" />
                    <TableHead className="hidden sm:table-cell">Name</TableHead>
                    <TableHead className="hidden sm:table-cell">Sector</TableHead>
                    <SortHeader label="Price" k="price" />
                    <SortHeader label="% Chg" k="changePercent" />
                    <SortHeader label="IV Rank" k="ivRank" />
                    <SortHeader label="IV %" k="iv" className="hidden md:table-cell" />
                    <SortHeader label="HV 30" k="hv30" className="hidden sm:table-cell" />
                    <SortHeader label="RSI" k="rsi" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sorted.map((s) => (
                    <TableRow
                      key={s.symbol}
                      className="cursor-pointer hover:bg-muted/50 text-sm"
                      onClick={() => router.push(`/options?symbol=${s.symbol}`)}
                    >
                      <TableCell className="font-semibold">{s.symbol}</TableCell>
                      <TableCell className="hidden sm:table-cell text-muted-foreground max-w-[160px] truncate">{s.name}</TableCell>
                      <TableCell className="hidden sm:table-cell">
                        <Badge variant="outline" className="text-[10px]">{s.sector}</Badge>
                      </TableCell>
                      <TableCell>${s.price?.toFixed(2)}</TableCell>
                      <TableCell className={s.changePercent >= 0 ? 'text-green-500' : 'text-red-500'}>
                        {s.changePercent >= 0 ? '+' : ''}{s.changePercent?.toFixed(2)}%
                      </TableCell>
                      <TableCell><IVBadge rank={s.ivRank} /></TableCell>
                      <TableCell className="hidden md:table-cell">{s.iv?.toFixed(1)}%</TableCell>
                      <TableCell className="hidden sm:table-cell">{s.hv30?.toFixed(1)}%</TableCell>
                      <TableCell>{s.rsi?.toFixed(0)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}
      </div>
    </>
  );
}
