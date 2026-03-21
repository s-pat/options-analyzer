'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { TodayOpportunities as TodayOpportunitiesType, TodayOption, TodayVerdict } from '@/lib/types';
import { cn } from '@/lib/utils';
import { TrendingUp, TrendingDown, Zap, Clock } from 'lucide-react';
import Link from 'next/link';
import { ShareButton } from '@/components/ui/ShareButton';

const VERDICT_CONFIG: Record<TodayVerdict, { color: string; bg: string; label: string }> = {
  'Strong Buy': { color: 'text-green-400', bg: 'bg-green-400/10 border-green-400/30', label: 'Strong Buy' },
  'Buy':        { color: 'text-emerald-400', bg: 'bg-emerald-400/10 border-emerald-400/30', label: 'Buy' },
  'Speculative':{ color: 'text-yellow-400', bg: 'bg-yellow-400/10 border-yellow-400/30', label: 'Speculative' },
  'Pass':       { color: 'text-muted-foreground', bg: 'border-border', label: 'Pass' },
};

const HORIZON_CONFIG = {
  'same-day':  { icon: Zap, label: 'Same Day', color: 'text-red-400' },
  'next-day':  { icon: Clock, label: 'Next Day', color: 'text-yellow-400' },
  'swing':     { icon: TrendingUp, label: 'Swing', color: 'text-blue-400' },
};

function PickCard({ pick }: { pick: TodayOption }) {
  const verdict = VERDICT_CONFIG[pick.verdict] ?? VERDICT_CONFIG['Pass'];
  const horizonCfg = HORIZON_CONFIG[pick.horizon] ?? HORIZON_CONFIG['swing'];
  const HorizonIcon = horizonCfg.icon;
  const isCall = pick.optionType === 'call';

  const expDate = new Date(pick.expiration * 1000).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric',
  });

  const analyzeUrl = `/options?symbol=${pick.stockSymbol}`;

  return (
    <div className={cn('border rounded-lg p-3 space-y-2', verdict.bg)}>
      {/* Header row */}
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="flex items-center gap-1.5">
            <Link href={analyzeUrl} className="font-bold text-sm hover:underline">
              {pick.stockSymbol}
            </Link>
            <span className="text-xs text-muted-foreground">{pick.stockName}</span>
          </div>
          <div className="flex items-center gap-1.5 mt-0.5">
            {isCall ? (
              <TrendingUp className="h-3 w-3 text-green-400" />
            ) : (
              <TrendingDown className="h-3 w-3 text-red-400" />
            )}
            <span className="text-xs font-medium uppercase">
              {pick.optionType} ${pick.strike.toFixed(0)}
            </span>
            <span className="text-xs text-muted-foreground">{expDate} · {pick.dte}d</span>
          </div>
        </div>
        <div className="text-right shrink-0">
          <span className={cn('text-xs font-bold', verdict.color)}>{verdict.label}</span>
          <div className="text-xs text-muted-foreground">{pick.score.toFixed(0)}/100</div>
        </div>
      </div>

      {/* Metrics row */}
      <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground">
        <span className="font-medium text-foreground">${pick.contractCost.toFixed(0)}/contract</span>
        <span>Δ {pick.delta.toFixed(2)}</span>
        <span>IV {(pick.impliedVolatility * 100).toFixed(0)}%</span>
        <span>OI {pick.openInterest.toLocaleString()}</span>
      </div>

      {/* Rationale */}
      <p className="text-[11px] text-muted-foreground leading-tight">{pick.rationale}</p>

      {/* Footer */}
      <div className="flex items-center gap-2">
        <Badge variant="outline" className={cn('text-[10px] py-0', horizonCfg.color)}>
          <HorizonIcon className="h-2.5 w-2.5 mr-1" />
          {horizonCfg.label}
        </Badge>
        <Badge variant="outline" className="text-[10px] py-0">
          {pick.expiryCategory}
        </Badge>
        <div className="ml-auto">
          <ShareButton contractSymbol={pick.contractSymbol} />
        </div>
      </div>
    </div>
  );
}

interface BandSectionProps {
  label: string;
  picks: TodayOption[];
}

function BandSection({ label, picks }: BandSectionProps) {
  if (picks.length === 0) {
    return (
      <div className="text-sm text-muted-foreground py-6 text-center">
        No opportunities found in this cost band right now.
      </div>
    );
  }

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
      {picks.map((pick) => (
        <PickCard key={`${pick.stockSymbol}-${pick.optionType}-${pick.strike}-${pick.expiration}`} pick={pick} />
      ))}
    </div>
  );
}

interface TodayOpportunitiesProps {
  data: TodayOpportunitiesType;
}

export function TodayOpportunities({ data }: TodayOpportunitiesProps) {
  const generatedAt = new Date(data.generatedAt).toLocaleTimeString('en-US', {
    hour: '2-digit', minute: '2-digit',
  });

  // Total picks across all bands
  const totalPicks = data.bands.reduce((sum, b) => sum + b.picks.length, 0);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {totalPicks} opportunities found across {data.bands.length} cost bands
        </p>
        <p className="text-xs text-muted-foreground">Generated at {generatedAt}</p>
      </div>

      <Tabs defaultValue={data.bands[0]?.band ?? '0-100'}>
        <TabsList className="flex-wrap h-auto gap-1">
          {data.bands.map((band) => (
            <TabsTrigger key={band.band} value={band.band} className="text-xs">
              {band.label}
              {band.picks.length > 0 && (
                <Badge variant="secondary" className="ml-1.5 text-[10px] py-0 px-1">
                  {band.picks.length}
                </Badge>
              )}
            </TabsTrigger>
          ))}
        </TabsList>

        {data.bands.map((band) => (
          <TabsContent key={band.band} value={band.band} className="mt-4">
            <BandSection label={band.label} picks={band.picks} />
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
