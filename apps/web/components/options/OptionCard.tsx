'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { OptionsPayoff } from '@/components/charts/OptionsPayoff';
import type { OptionContract } from '@/lib/types';

interface OptionCardProps {
  option: OptionContract;
  stockPrice: number;
}

function Greek({ label, value }: { label: string; value: string }) {
  return (
    <div className="text-center">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="text-sm font-semibold mt-0.5">{value}</div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between py-1.5 border-b border-border last:border-0">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="text-sm font-medium">{value}</span>
    </div>
  );
}

export function OptionCard({ option, stockPrice }: OptionCardProps) {
  const {
    optionType, strike, dte, bid, ask, mid, impliedVolatility,
    openInterest, volume, delta, gamma, theta, vega, bsFairValue, spreadPct,
  } = option;

  const edge = ask > 0 && bsFairValue > 0
    ? ((bsFairValue - ask) / ask * 100).toFixed(1)
    : '—';

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">
            ${strike} {optionType.toUpperCase()} — {dte} DTE
          </CardTitle>
          <Badge variant={optionType === 'call' ? 'default' : 'secondary'}>
            {optionType}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Greeks */}
        <div className="grid grid-cols-4 gap-2 bg-muted/40 rounded-lg p-3">
          <Greek label="Delta" value={delta.toFixed(3)} />
          <Greek label="Gamma" value={gamma.toFixed(4)} />
          <Greek label="Theta" value={theta.toFixed(3)} />
          <Greek label="Vega" value={vega.toFixed(3)} />
        </div>

        {/* Details */}
        <div>
          <Row label="Bid / Ask" value={`$${bid.toFixed(2)} / $${ask.toFixed(2)}`} />
          <Row label="Mid" value={`$${mid.toFixed(2)}`} />
          <Row label="BS Fair Value" value={`$${bsFairValue.toFixed(2)}`} />
          <Row label="Theoretical Edge" value={`${edge}%`} />
          <Row label="IV" value={`${(impliedVolatility * 100).toFixed(1)}%`} />
          <Row label="Spread" value={`${spreadPct.toFixed(1)}%`} />
          <Row label="Open Interest" value={openInterest.toLocaleString()} />
          <Row label="Volume" value={volume.toLocaleString()} />
        </div>

        {/* Payoff diagram */}
        <div>
          <div className="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wide">P&L at Expiration</div>
          <OptionsPayoff option={option} stockPrice={stockPrice} />
        </div>
      </CardContent>
    </Card>
  );
}
