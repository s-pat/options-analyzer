'use client';

import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useRecommendations } from '@/hooks/useMarketData';
import { StockLoader } from '@/components/ui/StockLoader';
import { cn } from '@/lib/utils';

function ScoreBar({ score }: { score: number }) {
  const color = score >= 75
    ? 'from-blue-500 to-blue-400'
    : score >= 60
    ? 'from-blue-500/60 to-blue-400/60'
    : 'from-white/20 to-white/20';

  return (
    <div className="flex items-center gap-2 min-w-[80px]">
      <div className="flex-1 h-1.5 bg-white/[0.06] rounded-full overflow-hidden">
        <div
          className={cn('h-full rounded-full bg-gradient-to-r score-bar', color)}
          style={{ '--score-w': `${score}%` } as React.CSSProperties}
        />
      </div>
      <span className="font-mono tabular-nums text-[11px] text-white/60 w-6 text-right">{score.toFixed(0)}</span>
    </div>
  );
}

function TypeChip({ type }: { type: string }) {
  const isCall = type === 'call';
  return (
    <span className={cn(
      'inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wide',
      isCall
        ? 'bg-green-500/[0.12] text-green-400 border border-green-500/[0.2]'
        : 'bg-red-500/[0.12] text-red-400 border border-red-500/[0.2]',
    )}>
      {type}
    </span>
  );
}

export function TopOptions() {
  const { data, isLoading, error } = useRecommendations(20);

  if (isLoading) return (
    <Card className="rounded-2xl border-white/[0.08] bg-white/[0.03]">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium text-white/60">Top Options Opportunities</CardTitle>
      </CardHeader>
      <CardContent className="flex justify-center py-12">
        <StockLoader size="md" message="Scanning for top opportunities…" />
      </CardContent>
    </Card>
  );

  if (error) return <div className="text-destructive text-sm">Failed to load recommendations</div>;

  const recs = data?.recommendations ?? [];

  return (
    <Card className="rounded-2xl border-white/[0.08] bg-white/[0.03]">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium text-white/60">Top Options Opportunities</CardTitle>
          <span className="text-[11px] text-white/30">{recs.length} contracts</span>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow className="border-white/[0.06] hover:bg-transparent">
              <TableHead className="text-white/30 text-[11px] uppercase tracking-wide font-medium pl-5">Symbol</TableHead>
              <TableHead className="text-white/30 text-[11px] uppercase tracking-wide font-medium">Type</TableHead>
              <TableHead className="text-white/30 text-[11px] uppercase tracking-wide font-medium">Strike</TableHead>
              <TableHead className="text-white/30 text-[11px] uppercase tracking-wide font-medium">DTE</TableHead>
              <TableHead className="text-white/30 text-[11px] uppercase tracking-wide font-medium hidden sm:table-cell">IV</TableHead>
              <TableHead className="text-white/30 text-[11px] uppercase tracking-wide font-medium hidden sm:table-cell">δ Delta</TableHead>
              <TableHead className="text-white/30 text-[11px] uppercase tracking-wide font-medium">Score</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {recs.slice(0, 20).map((rec, i) => (
              <TableRow
                key={rec.contractSymbol}
                className={cn(
                  'border-white/[0.04] cursor-pointer group',
                  'transition-colors duration-150',
                  'hover:bg-white/[0.03]',
                  'animate-slide-up',
                  i < 5 ? `delay-${i * 50}` : '',
                )}
              >
                <TableCell className="pl-5">
                  <Link
                    href={`/options?symbol=${rec.stockSymbol}`}
                    className="flex items-center gap-1 font-bold text-sm text-white/90 hover:text-blue-400 transition-colors"
                  >
                    {rec.stockSymbol}
                    <ArrowUpRight className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity text-blue-400" />
                  </Link>
                </TableCell>
                <TableCell><TypeChip type={rec.optionType} /></TableCell>
                <TableCell className="font-mono tabular-nums text-white/70">${rec.strike.toFixed(0)}</TableCell>
                <TableCell className="font-mono tabular-nums text-white/50 text-sm">{rec.dte}<span className="text-white/25 text-[10px]">d</span></TableCell>
                <TableCell className="font-mono tabular-nums text-white/50 text-sm hidden sm:table-cell">{(rec.impliedVolatility * 100).toFixed(0)}%</TableCell>
                <TableCell className="font-mono tabular-nums text-white/50 text-sm hidden sm:table-cell">{rec.delta.toFixed(2)}</TableCell>
                <TableCell className="pr-5"><ScoreBar score={rec.score} /></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
