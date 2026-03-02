'use client';

import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
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

function ScoreBadge({ score }: { score: number }) {
  const color = score >= 75 ? 'default' : score >= 60 ? 'secondary' : 'outline';
  return <Badge variant={color}>{score.toFixed(0)}</Badge>;
}

export function TopOptions() {
  const { data, isLoading, error } = useRecommendations(20);

  if (isLoading) return <div className="text-muted-foreground text-sm">Loading recommendations…</div>;
  if (error) return <div className="text-destructive text-sm">Failed to load recommendations</div>;

  const recs = data?.recommendations ?? [];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Top Options Opportunities</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Symbol</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Strike</TableHead>
              <TableHead>DTE</TableHead>
              <TableHead>IV</TableHead>
              <TableHead>Delta</TableHead>
              <TableHead>Score</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {recs.slice(0, 20).map((rec) => (
              <TableRow key={rec.contractSymbol} className="cursor-pointer hover:bg-muted/50">
                <TableCell>
                  <Link href={`/options?symbol=${rec.stockSymbol}`} className="font-medium hover:underline">
                    {rec.stockSymbol}
                  </Link>
                </TableCell>
                <TableCell>
                  <Badge variant={rec.optionType === 'call' ? 'default' : 'secondary'}>
                    {rec.optionType}
                  </Badge>
                </TableCell>
                <TableCell>${rec.strike.toFixed(0)}</TableCell>
                <TableCell>{rec.dte}d</TableCell>
                <TableCell>{(rec.impliedVolatility * 100).toFixed(0)}%</TableCell>
                <TableCell>{rec.delta.toFixed(2)}</TableCell>
                <TableCell><ScoreBadge score={rec.score} /></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
