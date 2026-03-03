'use client';

import { useState } from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Info } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import type { BacktestResult } from '@/lib/types';

interface BacktestResultsProps {
  result: BacktestResult;
}

// Small info icon that shows a tooltip on hover
function InfoTip({ text }: { text: string }) {
  return (
    <span
      title={text}
      className="ml-1 cursor-help inline-flex items-center text-muted-foreground/40 hover:text-muted-foreground transition-colors"
    >
      <Info className="h-3 w-3" />
    </span>
  );
}

function StatCard({
  label, value, color, tip,
}: {
  label: string; value: string; color?: string; tip?: string;
}) {
  return (
    <Card>
      <CardContent className="pt-4">
        <div className="text-xs text-muted-foreground flex items-center">
          {label}
          {tip && <InfoTip text={tip} />}
        </div>
        <div className={`text-xl font-bold mt-1 ${color ?? ''}`}>{value}</div>
      </CardContent>
    </Card>
  );
}

const exitReasonLabel: Record<string, string> = {
  profit_target: 'Profit Target',
  stop_loss:     'Stop Loss',
  expiry:        'Time Exit',
};

// Full description shown in the legend below the trade log
const exitReasonDesc: Record<string, string> = {
  profit_target: 'Option gained +100% — position closed to lock in the gain.',
  stop_loss:     'Option lost −50% of its value — position closed to cap the downside.',
  expiry:        'Option reached 21 days to expiry — closed early to avoid accelerating time decay (theta).',
};

export function BacktestResults({ result }: BacktestResultsProps) {
  const [investPerTrade, setInvestPerTrade] = useState(500);
  const [taxRate, setTaxRate]               = useState(22);   // % short-term capital gains
  const [commissionPerContract, setCommissionPerContract] = useState(0.65); // $ per contract leg

  const {
    symbol, optionType, totalReturn, winRate, avgWinPct, avgLossPct,
    maxConsecLosses, totalTrades, profitFactor, equityCurve, trades,
  } = result;

  const positive = totalReturn >= 0;

  const winners = trades.filter((t) => t.winner);
  const losers  = trades.filter((t) => !t.winner);
  const avgWinDollar  = winners.length
    ? winners.reduce((s, t) => s + (t.exitPrice - t.entryPrice) * 100, 0) / winners.length
    : 0;
  const avgLossDollar = losers.length
    ? losers.reduce((s, t) => s + (t.exitPrice - t.entryPrice) * 100, 0) / losers.length
    : 0;

  // ── Recurring-buy simulation ──────────────────────────────────────────────
  // For every trade the backtest opened, simulate buying as many contracts as
  // the chosen per-trade budget allows, then collecting the actual exit price.
  const recurSim = trades.map((t) => {
    const contractCost   = t.entryPrice * 100;                         // cost to open 1 contract
    const contracts      = contractCost > 0 ? Math.floor(investPerTrade / contractCost) : 0;
    const invested       = contracts * contractCost;
    const returned       = contracts * t.exitPrice * 100;
    const grossPnl       = returned - invested;
    // Commission: paid on open AND close leg for each contract
    const commission     = contracts * commissionPerContract * 2;
    const netPnl         = grossPnl - commission;
    // Tax applies only to net gains; losses give no per-trade benefit shown here
    const tax            = netPnl > 0 ? netPnl * (taxRate / 100) : 0;
    const takeHome       = netPnl - tax;
    return { ...t, contracts, invested, returned, grossPnl, commission, netPnl, tax, takeHome };
  });

  const totalInvested      = recurSim.reduce((s, t) => s + t.invested, 0);
  const totalGrossPnl      = recurSim.reduce((s, t) => s + t.grossPnl, 0);
  const totalCommission    = recurSim.reduce((s, t) => s + t.commission, 0);
  const totalNetPnl        = recurSim.reduce((s, t) => s + t.netPnl, 0);
  const totalTax           = recurSim.reduce((s, t) => s + t.tax, 0);
  const totalTakeHome      = recurSim.reduce((s, t) => s + t.takeHome, 0);
  const totalRecurPnl      = totalNetPnl; // kept for legacy reference line below
  const totalRecurReturn   = totalInvested > 0 ? (totalTakeHome / totalInvested) * 100 : 0;
  const skipped            = recurSim.filter((t) => t.contracts === 0).length;

  return (
    <div className="space-y-6">

      {/* ── Summary stats ─────────────────────────────────────────────────── */}
      <div>
        <h2 className="text-sm font-semibold mb-3">
          {symbol} — Long {optionType.charAt(0).toUpperCase() + optionType.slice(1)} Backtest
        </h2>
        <div className="grid gap-3 sm:grid-cols-4 lg:grid-cols-8">
          <StatCard
            label="Total Return"
            value={`${positive ? '+' : ''}${totalReturn.toFixed(1)}%`}
            color={positive ? 'text-green-500' : 'text-red-500'}
            tip="Cumulative equity growth over all trades, starting from a $100 base. Calculated by risking 10% of the running equity on each trade."
          />
          <StatCard
            label="Win Rate"
            value={`${winRate.toFixed(0)}%`}
            tip="Percentage of trades that closed profitably (hit the +100% profit target or closed above entry). Does not account for trade size."
          />
          <StatCard
            label="Avg Win %"
            value={`+${avgWinPct.toFixed(1)}%`}
            color="text-green-500"
            tip="Average percentage gain on winning trades. Winning trades exit at the +100% profit target or are closed above entry at expiry."
          />
          <StatCard
            label="Avg Win $"
            value={`+$${avgWinDollar.toFixed(0)}`}
            color="text-green-500"
            tip="Average dollar gain per winning contract (1 contract = 100 shares). Equal to (exitPrice − entryPrice) × 100."
          />
          <StatCard
            label="Avg Loss %"
            value={`${avgLossPct.toFixed(1)}%`}
            color="text-red-500"
            tip="Average percentage loss on losing trades. Losing trades exit at the −50% stop loss or expire worthless."
          />
          <StatCard
            label="Avg Loss $"
            value={`−$${Math.abs(avgLossDollar).toFixed(0)}`}
            color="text-red-500"
            tip="Average dollar loss per losing contract (1 contract = 100 shares). Equal to (exitPrice − entryPrice) × 100."
          />
          <StatCard
            label="Profit Factor"
            value={profitFactor.toFixed(2)}
            tip="Total gross profit ÷ total gross loss. A value above 1.0 means the strategy made more than it lost. Above 1.5 is generally considered good."
          />
          <StatCard
            label="Max Consec. Losses"
            value={`${maxConsecLosses}`}
            tip="The longest streak of back-to-back losing trades. Useful for stress-testing your ability to stick with a strategy during a drawdown."
          />
        </div>
      </div>

      {/* ── Equity curve ──────────────────────────────────────────────────── */}
      <Card>
        <CardHeader className="pb-1">
          <CardTitle className="text-sm flex items-center">
            Equity Curve ({totalTrades} trades)
            <InfoTip text="Tracks how a hypothetical $100 portfolio grows trade by trade. Each trade risks 10% of the current equity. The dashed line at $100 is the starting point — above it means you are profitable overall." />
          </CardTitle>
          <p className="text-xs text-muted-foreground mt-1">
            Simulates reinvesting 10% of running equity per trade. Starting value = $100.
            Hover for exact equity at each date.
          </p>
        </CardHeader>
        <CardContent>
          <div className="h-52">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={equityCurve} margin={{ top: 4, right: 12, bottom: 4, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#94a3b8' }} tickCount={6} />
                <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} domain={['auto', 'auto']} />
                <Tooltip
                  formatter={(v) => [`$${Number(v).toFixed(2)}`, 'Equity']}
                  contentStyle={{ background: '#0f172a', border: '1px solid #334155', borderRadius: 6, fontSize: 12 }}
                />
                <ReferenceLine y={100} stroke="#475569" strokeDasharray="4 2" label={{ value: 'Start $100', fontSize: 9, fill: '#64748b', position: 'insideTopLeft' }} />
                <Line
                  type="monotone"
                  dataKey="value"
                  stroke={positive ? '#22c55e' : '#ef4444'}
                  dot={false}
                  strokeWidth={2}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* ── Trade log ─────────────────────────────────────────────────────── */}
      <Card>
        <CardHeader className="pb-1">
          <CardTitle className="text-sm flex items-center">
            Trade Log
            <InfoTip text="Every simulated trade. Entry/Exit prices are per share (multiply by 100 for 1 contract cost). P&L $ shows the actual dollar gain or loss on a single contract." />
          </CardTitle>
          <p className="text-xs text-muted-foreground mt-1">
            Prices are per share — 1 contract controls 100 shares.
            Entry $ and Exit $ shown per share; P&L $ / contract = difference × 100.
          </p>
        </CardHeader>
        <CardContent className="p-0 overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="text-xs">
                <TableHead>Entry Date</TableHead>
                <TableHead className="hidden sm:table-cell">Exit Date</TableHead>
                <TableHead>Strike</TableHead>
                <TableHead>Entry $</TableHead>
                <TableHead>Exit $</TableHead>
                <TableHead>P&L %</TableHead>
                <TableHead>P&L $</TableHead>
                <TableHead className="hidden md:table-cell">Days</TableHead>
                <TableHead className="hidden sm:table-cell">Exit</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {trades.map((t, i) => {
                const dollarPnl = (t.exitPrice - t.entryPrice) * 100;
                return (
                  <TableRow key={i} className="text-sm">
                    <TableCell>{t.entryDate}</TableCell>
                    <TableCell className="hidden sm:table-cell">{t.exitDate}</TableCell>
                    <TableCell>${t.strike}</TableCell>
                    <TableCell>${t.entryPrice.toFixed(2)}</TableCell>
                    <TableCell>${t.exitPrice.toFixed(2)}</TableCell>
                    <TableCell className={t.winner ? 'text-green-500' : 'text-red-500'}>
                      {t.pnlPct >= 0 ? '+' : ''}{t.pnlPct.toFixed(1)}%
                    </TableCell>
                    <TableCell className={t.winner ? 'text-green-500 font-medium' : 'text-red-500 font-medium'}>
                      {dollarPnl >= 0 ? '+' : '−'}${Math.abs(dollarPnl).toFixed(0)}
                    </TableCell>
                    <TableCell className="hidden md:table-cell">{t.daysHeld}d</TableCell>
                    <TableCell className="hidden sm:table-cell">
                      <Badge variant={t.winner ? 'default' : 'destructive'} className="text-[10px]">
                        {exitReasonLabel[t.exitReason] ?? t.exitReason}
                      </Badge>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
        {/* Exit reason legend */}
        <div className="px-4 py-3 border-t border-border space-y-1">
          <p className="text-xs font-medium text-muted-foreground mb-1">Exit reason key:</p>
          {Object.entries(exitReasonDesc).map(([key, desc]) => (
            <div key={key} className="flex gap-2 text-xs text-muted-foreground">
              <Badge
                variant={key === 'profit_target' ? 'default' : 'destructive'}
                className="text-[10px] shrink-0 self-start mt-0.5"
                style={key === 'expiry' ? { background: 'hsl(var(--muted))', color: 'hsl(var(--muted-foreground))' } : undefined}
              >
                {exitReasonLabel[key]}
              </Badge>
              <span>{desc}</span>
            </div>
          ))}
        </div>
      </Card>

      {/* ── Recurring-buy simulation ───────────────────────────────────────── */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center">
            Recurring Buy Simulation
            <InfoTip text="Shows what would happen if you invested a fixed dollar amount on every trade entry the backtest found. Contracts are whole numbers only — any leftover cash sits unused. This is separate from the equity curve above, which uses percentage-based sizing." />
          </CardTitle>
          <p className="text-xs text-muted-foreground mt-1">
            Simulates investing a fixed amount on each trade entry (~every 21 trading days).
            Contracts purchased = floor(budget ÷ contract cost). Leftover cash is not reinvested.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">

          {/* Inputs row */}
          <div className="grid gap-4 sm:grid-cols-3 p-4 rounded-lg border border-border bg-muted/20">
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground flex items-center">
                Budget per trade entry
                <InfoTip text="Maximum dollars to deploy on each trade. Whole contracts only — leftover cash is unused." />
              </label>
              <div className="flex items-center gap-1">
                <span className="text-sm text-muted-foreground">$</span>
                <input
                  type="number"
                  min={50}
                  step={50}
                  value={investPerTrade}
                  onChange={(e) => setInvestPerTrade(Math.max(0, Number(e.target.value)))}
                  className="w-full rounded-md border border-input bg-background px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground flex items-center">
                Commission per contract
                <InfoTip text="Broker fee charged per contract per leg (open + close). Robinhood: $0. TD/Schwab/IBKR: ~$0.65. Set to 0 for commission-free brokers." />
              </label>
              <div className="flex items-center gap-1">
                <span className="text-sm text-muted-foreground">$</span>
                <input
                  type="number"
                  min={0}
                  step={0.05}
                  value={commissionPerContract}
                  onChange={(e) => setCommissionPerContract(Math.max(0, Number(e.target.value)))}
                  className="w-full rounded-md border border-input bg-background px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground flex items-center">
                Tax rate on gains
                <InfoTip text="Short-term capital gains rate applied to net profitable trades. Equity options held under 1 year are taxed as ordinary income in the US. Common rates: 22% (middle bracket), 24%, 32%, 37% (top bracket). Losses are not offset per-trade here — consult a tax professional." />
              </label>
              <div className="flex items-center gap-1">
                <input
                  type="number"
                  min={0}
                  max={60}
                  step={1}
                  value={taxRate}
                  onChange={(e) => setTaxRate(Math.min(60, Math.max(0, Number(e.target.value))))}
                  className="w-full rounded-md border border-input bg-background px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                />
                <span className="text-sm text-muted-foreground">%</span>
              </div>
            </div>
          </div>

          <p className="text-xs text-muted-foreground -mt-1">
            Across {totalTrades} trade entries &nbsp;·&nbsp; {result.startDate} → {result.endDate}
          </p>

          {/* Summary numbers */}
          <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-6">
            <StatCard
              label="Total Invested"
              value={`$${totalInvested.toLocaleString('en-US', { maximumFractionDigits: 0 })}`}
              tip="Sum of all contract costs paid. Does not include skipped trades where your budget couldn't buy even one contract."
            />
            <StatCard
              label="Gross P&L"
              value={`${totalGrossPnl >= 0 ? '+' : '−'}$${Math.abs(totalGrossPnl).toLocaleString('en-US', { maximumFractionDigits: 0 })}`}
              color={totalGrossPnl >= 0 ? 'text-green-500' : 'text-red-500'}
              tip="Raw profit or loss before deducting commissions and taxes. (exitPrice − entryPrice) × 100 × contracts, summed across all trades."
            />
            <StatCard
              label="Commissions"
              value={`−$${totalCommission.toLocaleString('en-US', { maximumFractionDigits: 0 })}`}
              color="text-orange-400"
              tip={`Broker fees charged to open and close each contract. Calculated as: contracts × $${commissionPerContract.toFixed(2)} × 2 legs.`}
            />
            <StatCard
              label="Taxes on Gains"
              value={`−$${totalTax.toLocaleString('en-US', { maximumFractionDigits: 0 })}`}
              color="text-orange-400"
              tip={`Short-term capital gains tax at ${taxRate}%, applied only to net-profitable trades. Losing trades are shown at face value — consult a tax professional for loss deductions.`}
            />
            <StatCard
              label="Take-Home P&L"
              value={`${totalTakeHome >= 0 ? '+' : '−'}$${Math.abs(totalTakeHome).toLocaleString('en-US', { maximumFractionDigits: 0 })}`}
              color={totalTakeHome >= 0 ? 'text-green-500' : 'text-red-500'}
              tip="What you actually keep: Gross P&L minus commissions minus taxes on gains."
            />
            <StatCard
              label="Return on Capital"
              value={`${totalRecurReturn >= 0 ? '+' : ''}${totalRecurReturn.toFixed(1)}%`}
              color={totalRecurReturn >= 0 ? 'text-green-500' : 'text-red-500'}
              tip="Take-Home P&L divided by Total Invested. This is your real after-tax, after-fees return on deployed capital."
            />
          </div>

          {/* Per-trade breakdown table */}
          <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="text-xs">
                <TableHead>Dates</TableHead>
                <TableHead>Underlying</TableHead>
                <TableHead>Contract <span className="text-muted-foreground/60">(45 DTE)</span></TableHead>
                <TableHead>Qty / Invested</TableHead>
                <TableHead>Gross P&L</TableHead>
                <TableHead>Fees &amp; Tax</TableHead>
                <TableHead className="text-green-400">Take-Home</TableHead>
                <TableHead>Exit</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recurSim.map((t, i) => {
                const stockMove    = t.stockPriceAtExit - t.stockPriceAtEntry;
                const stockMovePct = t.stockPriceAtEntry > 0 ? (stockMove / t.stockPriceAtEntry) * 100 : 0;
                const skipped      = t.contracts === 0;
                return (
                  <TableRow key={i} className="text-xs align-top">
                    {/* Dates: entry on top, exit below */}
                    <TableCell className="whitespace-nowrap">
                      <div>{t.entryDate}</div>
                      <div className="text-muted-foreground mt-0.5">→ {t.exitDate}</div>
                    </TableCell>

                    {/* Underlying: entry price → exit price + % move */}
                    <TableCell className="whitespace-nowrap">
                      <div>${t.stockPriceAtEntry.toFixed(2)}</div>
                      <div className={`mt-0.5 ${stockMove >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                        → ${t.stockPriceAtExit.toFixed(2)}&nbsp;
                        <span className="text-muted-foreground">
                          ({stockMove >= 0 ? '+' : ''}{stockMovePct.toFixed(1)}%)
                        </span>
                      </div>
                    </TableCell>

                    {/* Contract: strike on top, cost per contract below */}
                    <TableCell className="whitespace-nowrap">
                      <div>K ${t.strike}</div>
                      <div className="text-muted-foreground mt-0.5">${(t.entryPrice * 100).toFixed(0)} / contract</div>
                    </TableCell>

                    {/* Qty + invested */}
                    <TableCell className="whitespace-nowrap">
                      {skipped
                        ? <span className="text-muted-foreground italic">skipped</span>
                        : <>
                            <div>{t.contracts} contract{t.contracts !== 1 ? 's' : ''}</div>
                            <div className="text-muted-foreground mt-0.5">${t.invested.toFixed(0)} invested</div>
                          </>
                      }
                    </TableCell>

                    {/* Gross P&L */}
                    <TableCell className={skipped ? '' : t.grossPnl >= 0 ? 'text-green-500 whitespace-nowrap' : 'text-red-500 whitespace-nowrap'}>
                      {skipped ? '—' : `${t.grossPnl >= 0 ? '+' : '−'}$${Math.abs(t.grossPnl).toFixed(0)}`}
                    </TableCell>

                    {/* Fees + tax stacked */}
                    <TableCell className="whitespace-nowrap">
                      {skipped ? '—' : (
                        <>
                          <div className="text-orange-400">−${t.commission.toFixed(2)} comm.</div>
                          <div className="text-orange-400 mt-0.5">
                            {t.tax > 0 ? `−$${t.tax.toFixed(0)} tax` : <span className="text-muted-foreground">no tax</span>}
                          </div>
                        </>
                      )}
                    </TableCell>

                    {/* Take-home — most important number */}
                    <TableCell className={skipped ? '' : t.takeHome >= 0 ? 'text-green-500 font-semibold whitespace-nowrap' : 'text-red-500 font-semibold whitespace-nowrap'}>
                      {skipped ? '—' : `${t.takeHome >= 0 ? '+' : '−'}$${Math.abs(t.takeHome).toFixed(0)}`}
                    </TableCell>

                    <TableCell>
                      {!skipped && (
                        <Badge variant={t.winner ? 'default' : 'destructive'} className="text-[10px]">
                          {exitReasonLabel[t.exitReason] ?? t.exitReason}
                        </Badge>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>

          </div>

          <p className="text-xs text-muted-foreground">
            Note: This simulation uses the same entry/exit prices as the backtest above.
            It does not account for broker commissions, bid-ask spread slippage, or partial fills.
          </p>
        </CardContent>
      </Card>

    </div>
  );
}
