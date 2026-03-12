import { Header } from '@/components/layout/Header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, Shield, Zap, BarChart3, ExternalLink } from 'lucide-react';

// ─────────────────────────────────────────────
// Shared primitives
// ─────────────────────────────────────────────

function SectionTitle({ icon: Icon, children }: { icon: React.ElementType; children: React.ReactNode }) {
  return (
    <h2 className="flex items-center gap-2 text-xl font-bold mt-12 mb-4 text-foreground border-b border-border pb-2">
      <Icon className="h-5 w-5 text-primary" />
      {children}
    </h2>
  );
}

type RiskLevel = 'Low' | 'Moderate' | 'High' | 'Very High' | 'Low (already own stock)' | 'Moderate (both premiums)';
type Outlook = 'Bullish' | 'Bearish' | 'Neutral' | 'Any' | 'Neutral–Bullish' | 'Bullish with downside protection' | 'Any — expects large move';

interface StrategyMeta {
  name: string;
  type: string;
  outlook: Outlook;
  risk: RiskLevel;
  reward: string;
  complexity: 'Beginner' | 'Intermediate' | 'Advanced';
  maxLoss: string;
  maxGain: string;
  breakeven: string;
}

function RiskBadge({ level }: { level: RiskLevel }) {
  const styles: Record<RiskLevel, string> = {
    Low:       'border-green-500/40 text-green-400',
    Moderate:  'border-yellow-500/40 text-yellow-400',
    High:      'border-orange-500/40 text-orange-400',
    'Very High': 'border-red-500/40 text-red-400',
    'Low (already own stock)': 'border-green-500/40 text-green-400',
    'Moderate (both premiums)': 'border-yellow-500/40 text-yellow-400',
  };
  return <Badge variant="outline" className={`text-[10px] ${styles[level]}`}>{level} Risk</Badge>;
}

function OutlookBadge({ outlook }: { outlook: Outlook }) {
  const styles: Record<Outlook, string> = {
    Bullish: 'bg-green-500/10 text-green-400',
    Bearish: 'bg-red-500/10 text-red-400',
    Neutral: 'bg-blue-500/10 text-blue-400',
    Any:     'bg-muted text-muted-foreground',
    'Neutral–Bullish': 'bg-green-500/10 text-green-300',
    'Bullish with downside protection': 'bg-green-500/10 text-green-400',
    'Any — expects large move': 'bg-purple-500/10 text-purple-400',
  };
  const isBullish = outlook.startsWith('Bullish');
  const isBearish = outlook === 'Bearish';
  const arrow = isBullish ? '↑' : isBearish ? '↓' : '↔';
  return (
    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded ${styles[outlook]}`}>
      {arrow} {outlook}
    </span>
  );
}

function ComplexityBadge({ level }: { level: 'Beginner' | 'Intermediate' | 'Advanced' }) {
  const styles = {
    Beginner:     'text-green-400',
    Intermediate: 'text-yellow-400',
    Advanced:     'text-red-400',
  };
  return <span className={`text-[10px] font-medium ${styles[level]}`}>{level}</span>;
}

/** Inline SVG payoff chart */
function PayoffSVG({
  title,
  lines,
  xLabels,
  height = 130,
}: {
  title: string;
  lines: { points: [number, number][]; color: string; label: string; dashed?: boolean }[];
  xLabels?: { x: number; text: string }[];
  height?: number;
}) {
  const W = 320;
  const H = height;
  const PAD = { top: 10, right: 10, bottom: 28, left: 44 };
  const innerW = W - PAD.left - PAD.right;
  const innerH = H - PAD.top - PAD.bottom;

  const allPts = lines.flatMap((l) => l.points);
  const xs = allPts.map((p) => p[0]);
  const ys = allPts.map((p) => p[1]);
  const xMin = Math.min(...xs);
  const xMax = Math.max(...xs);
  const yMin = Math.min(...ys);
  const yMax = Math.max(...ys);

  const sx = (x: number) => PAD.left + ((x - xMin) / (xMax - xMin || 1)) * innerW;
  const sy = (y: number) => PAD.top + innerH - ((y - yMin) / (yMax - yMin || 1)) * innerH;

  const zeroY = sy(0);
  const toPath = (pts: [number, number][]) =>
    pts.map(([x, y], i) => `${i === 0 ? 'M' : 'L'}${sx(x).toFixed(1)},${sy(y).toFixed(1)}`).join(' ');

  return (
    <div>
      <p className="text-[11px] text-center text-muted-foreground mb-1">{title}</p>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" aria-label={title}>
        {/* Zero reference */}
        <line x1={PAD.left} y1={zeroY} x2={W - PAD.right} y2={zeroY} stroke="#444" strokeDasharray="4 2" strokeWidth={1} />
        {/* Axes */}
        <line x1={PAD.left} y1={PAD.top} x2={PAD.left} y2={H - PAD.bottom} stroke="#555" strokeWidth={1} />
        <line x1={PAD.left} y1={H - PAD.bottom} x2={W - PAD.right} y2={H - PAD.bottom} stroke="#555" strokeWidth={1} />
        <text x={W / 2} y={H - 2} textAnchor="middle" fontSize={8} fill="#666">Stock Price at Expiry →</text>
        <text x={11} y={H / 2 + 4} textAnchor="middle" fontSize={8} fill="#666" transform={`rotate(-90,11,${H / 2})`}>P&L ($)</text>
        <text x={PAD.left - 3} y={zeroY + 3} textAnchor="end" fontSize={7} fill="#666">0</text>

        {/* Strike lines */}
        {xLabels?.map((l) => (
          <g key={l.text}>
            <line x1={sx(l.x)} y1={PAD.top} x2={sx(l.x)} y2={H - PAD.bottom} stroke="#555" strokeDasharray="2 2" strokeWidth={1} />
            <text x={sx(l.x)} y={H - PAD.bottom + 9} textAnchor="middle" fontSize={7} fill="#777">{l.text}</text>
          </g>
        ))}

        {/* Payoff curves */}
        {lines.map((l) => (
          <path
            key={l.label}
            d={toPath(l.points)}
            fill="none"
            stroke={l.color}
            strokeWidth={2}
            strokeDasharray={l.dashed ? '5 3' : undefined}
          />
        ))}
      </svg>
      <div className="flex justify-center gap-4 mt-1">
        {lines.map((l) => (
          <div key={l.label} className="flex items-center gap-1.5">
            <svg width="16" height="2">
              <line x1="0" y1="1" x2="16" y2="1" stroke={l.color} strokeWidth="2" strokeDasharray={l.dashed ? '4 2' : undefined} />
            </svg>
            <span className="text-[10px] text-muted-foreground">{l.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// Payoff helpers
// ─────────────────────────────────────────────
const range = (start: number, end: number, step = 5): number[] => {
  const arr: number[] = [];
  for (let x = start; x <= end; x += step) arr.push(x);
  return arr;
};

// ─────────────────────────────────────────────
// Strategy cards
// ─────────────────────────────────────────────

interface StrategyProps {
  meta: StrategyMeta;
  chart: React.ReactNode;
  when: string;
  howItWorks: string;
  entry: string;
  exit: string;
  pros: string[];
  cons: string[];
  example: string;
  references?: { label: string; url: string }[];
}

function StrategyCard({ meta, chart, when, howItWorks, entry, exit, pros, cons, example, references }: StrategyProps) {
  return (
    <Card className="mb-8">
      <CardHeader className="pb-3">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <CardTitle className="text-lg">{meta.name}</CardTitle>
          <div className="flex flex-wrap gap-1.5">
            <OutlookBadge outlook={meta.outlook} />
            <RiskBadge level={meta.risk} />
            <ComplexityBadge level={meta.complexity} />
          </div>
        </div>
        <div className="flex flex-wrap gap-4 text-xs text-muted-foreground pt-1">
          <span>Max Loss: <strong className="text-red-400">{meta.maxLoss}</strong></span>
          <span>Max Gain: <strong className="text-green-400">{meta.maxGain}</strong></span>
          <span>Breakeven: <strong>{meta.breakeven}</strong></span>
        </div>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="grid md:grid-cols-2 gap-6">
          {/* Payoff chart */}
          <div className="rounded-lg border border-border bg-muted/10 p-3">
            {chart}
          </div>
          {/* When to use */}
          <div className="space-y-3 text-sm">
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">When to use</p>
              <p className="text-foreground/80 text-xs leading-relaxed">{when}</p>
            </div>
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">How it works</p>
              <p className="text-foreground/80 text-xs leading-relaxed">{howItWorks}</p>
            </div>
          </div>
        </div>

        {/* Entry / Exit */}
        <div className="grid sm:grid-cols-2 gap-3">
          <div className="rounded-md bg-muted/20 border border-border p-3">
            <p className="text-[10px] font-semibold text-muted-foreground uppercase mb-1">Entry Criteria</p>
            <p className="text-xs text-foreground/80">{entry}</p>
          </div>
          <div className="rounded-md bg-muted/20 border border-border p-3">
            <p className="text-[10px] font-semibold text-muted-foreground uppercase mb-1">Exit Plan</p>
            <p className="text-xs text-foreground/80">{exit}</p>
          </div>
        </div>

        {/* Pros / Cons */}
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <p className="text-[10px] font-semibold text-green-400 uppercase mb-2">Advantages</p>
            <ul className="space-y-1">
              {pros.map((p) => <li key={p} className="text-xs text-foreground/70 flex gap-1.5"><span className="text-green-400 shrink-0">✓</span>{p}</li>)}
            </ul>
          </div>
          <div>
            <p className="text-[10px] font-semibold text-red-400 uppercase mb-2">Disadvantages</p>
            <ul className="space-y-1">
              {cons.map((c) => <li key={c} className="text-xs text-foreground/70 flex gap-1.5"><span className="text-red-400 shrink-0">✗</span>{c}</li>)}
            </ul>
          </div>
        </div>

        {/* Example */}
        <div className="rounded-md border border-border bg-muted/10 p-3">
          <p className="text-[10px] font-semibold text-muted-foreground uppercase mb-1">Worked Example</p>
          <p className="text-xs text-foreground/80 leading-relaxed">{example}</p>
        </div>

        {/* References */}
        {references && (
          <div className="flex flex-wrap gap-2">
            {references.map((r) => (
              <a key={r.url} href={r.url} target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-1 text-[10px] text-primary hover:underline">
                <ExternalLink className="h-3 w-3" />{r.label}
              </a>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ─────────────────────────────────────────────
// Individual strategies
// ─────────────────────────────────────────────

function LongCall() {
  const S = range(80, 130);
  const K = 105, prem = 5;
  const pts = S.map((s): [number, number] => [s, Math.max(s - K, 0) - prem]);

  return (
    <StrategyCard
      meta={{
        name: 'Long Call',
        type: 'single leg',
        outlook: 'Bullish',
        risk: 'Moderate',
        reward: 'Unlimited',
        complexity: 'Beginner',
        maxLoss: 'Premium paid',
        maxGain: 'Unlimited',
        breakeven: 'Strike + Premium',
      }}
      chart={
        <PayoffSVG
          title="Long Call Payoff"
          lines={[{ points: pts, color: '#4ade80', label: 'Long Call' }]}
          xLabels={[{ x: K, text: 'K' }, { x: K + prem, text: 'BE' }]}
        />
      }
      when="You believe a stock will rise significantly before expiration. Best when IV is low (IVR < 35) so you pay a cheap premium, and the EMA20 is above EMA50 (uptrend confirmed)."
      howItWorks="Buy one call contract. You profit when the stock rises above your breakeven price (strike + premium) at expiration. The call gives you leveraged upside with limited downside — you can only lose what you paid."
      entry="Look for: IVR < 35, EMA20 > EMA50, RSI 40–65, OI > 500, spread < 8%, DTE 30–60 days, delta 0.35–0.50."
      exit="Take profit at +50–100%. Cut loss at −30–50% of premium. Time exit: close at 21 DTE to avoid theta acceleration. Never hold to expiration hoping for a miracle."
      pros={[
        'Limited loss (only the premium paid)',
        'Unlimited upside if stock surges',
        'Leverage: control 100 shares with less capital',
        'Can be used to express a directional view before earnings',
      ]}
      cons={[
        'Theta works against you every day',
        'Need the stock to move — not just stay flat',
        'High IV means expensive premium (less edge)',
        'Requires correct timing of both direction AND timing',
      ]}
      example="AAPL is trading at $200. You buy 1 AAPL call with a $205 strike expiring in 45 days for $3.50 per share ($350 total). Breakeven: $208.50. If AAPL rises to $220 at expiry, your profit = ($220 − $205 − $3.50) × 100 = $1,150. If AAPL stays below $205, you lose the full $350."
      references={[
        { label: 'Investopedia: Long Call', url: 'https://www.investopedia.com/terms/l/long_call.asp' },
        { label: 'CBOE Education', url: 'https://www.cboe.com/education/' },
      ]}
    />
  );
}

function LongPut() {
  const S = range(70, 120);
  const K = 95, prem = 4;
  const pts = S.map((s): [number, number] => [s, Math.max(K - s, 0) - prem]);

  return (
    <StrategyCard
      meta={{
        name: 'Long Put',
        type: 'single leg',
        outlook: 'Bearish',
        risk: 'Moderate',
        reward: 'High (stock to zero)',
        complexity: 'Beginner',
        maxLoss: 'Premium paid',
        maxGain: 'Strike − Premium (if stock → $0)',
        breakeven: 'Strike − Premium',
      }}
      chart={
        <PayoffSVG
          title="Long Put Payoff"
          lines={[{ points: pts, color: '#f87171', label: 'Long Put' }]}
          xLabels={[{ x: K, text: 'K' }, { x: K - prem, text: 'BE' }]}
        />
      }
      when="You believe a stock will fall before expiration. Also used as portfolio insurance (protective put) to hedge existing stock positions. Best when IV is low and EMA20 < EMA50 (downtrend confirmed)."
      howItWorks="Buy one put contract. You profit when the stock falls below your breakeven price (strike − premium). The put gains value as the stock drops, acting as a hedge or speculative short position."
      entry="Look for: IVR < 35, EMA20 < EMA50, RSI 60–80 (overbought), OI > 500, spread < 8%, DTE 30–60 days, delta −0.35 to −0.50."
      exit="Take profit at +50–100% of premium. Cut loss at −30–50%. Close at 21 DTE. Consider closing before anticipated bullish catalysts."
      pros={[
        'Defined risk (only premium paid)',
        'Profits from falling stock or rising volatility',
        'Excellent portfolio hedge (protective put strategy)',
        'Much safer than short selling (no margin, no unlimited loss)',
      ]}
      cons={[
        'Theta decay erodes value every day',
        'Entire premium is lost if stock rises or stays flat',
        'IV crush after fear events can offset directional gains',
        'Requires precise market timing',
      ]}
      example="NVDA is at $130 and looks overbought (RSI 78). You buy 1 NVDA put with a $125 strike, 40 DTE, for $5 per share ($500 total). Breakeven: $120. If NVDA drops to $110 at expiry, profit = ($125 − $110 − $5) × 100 = $1,000. If NVDA stays above $125, you lose $500."
      references={[
        { label: 'Investopedia: Long Put', url: 'https://www.investopedia.com/terms/l/long_put.asp' },
        { label: 'Options Industry Council', url: 'https://www.optionseducation.org/' },
      ]}
    />
  );
}

function CoveredCall() {
  const S = range(85, 130);
  const K = 110, prem = 4;
  // Covered call = long stock − short call
  // P&L = (S - 100) - max(S - K, 0) + prem   (bought stock at 100)
  const stockCost = 100;
  const pts = S.map((s): [number, number] => [
    s,
    Math.min(s - stockCost + prem, K - stockCost + prem),
  ]);
  const stockPts = S.map((s): [number, number] => [s, s - stockCost]);

  return (
    <StrategyCard
      meta={{
        name: 'Covered Call',
        type: 'stock + short call',
        outlook: 'Neutral–Bullish',
        risk: 'Low (already own stock)',
        reward: 'Strike − Stock Cost + Premium',
        complexity: 'Intermediate',
        maxLoss: 'Stock price goes to zero (same as owning stock)',
        maxGain: '(Strike − Entry) + Premium collected',
        breakeven: 'Stock Entry Price − Premium Collected',
      }}
      chart={
        <PayoffSVG
          title="Covered Call vs Long Stock"
          lines={[
            { points: stockPts, color: '#60a5fa', label: 'Long Stock', dashed: true },
            { points: pts, color: '#a78bfa', label: 'Covered Call' },
          ]}
          xLabels={[{ x: K, text: 'K' }, { x: stockCost - prem, text: 'BE' }]}
        />
      }
      when="You own a stock and don't expect it to move much. Selling a call against your shares generates premium income. It's the most beginner-friendly 'selling' strategy because your shares cover the obligation."
      howItWorks="Own 100 shares + sell 1 call option at a higher strike. You collect the premium immediately. If the stock stays below the strike, you keep the premium and your shares. If the stock exceeds the strike, your shares are 'called away' at the strike price."
      entry="Own at least 100 shares of the stock. Sell a call 5–10% above current price with 30–45 DTE. Look for IV rank above 50% to maximise the premium collected."
      exit="Let expire worthless (keep premium), or buy back the call when it loses 50–75% of its value to free up the shares early."
      pros={[
        'Generates consistent monthly income on existing shares',
        'Reduces effective cost basis of stock ownership',
        'Lower risk than naked options (shares provide collateral)',
        'Works well in sideways or slowly rising markets',
      ]}
      cons={[
        'Caps your upside — if stock surges past the strike, you miss gains',
        'Does not protect against large downside moves in the stock',
        'Tax consequences if shares are called away (potential capital gains event)',
        'Requires owning at least 100 shares (capital intensive)',
      ]}
      example="You own 100 shares of MSFT at $400. You sell 1 MSFT call with a $415 strike, 35 DTE, and collect $5 per share ($500 premium). If MSFT stays below $415 at expiry, you keep $500. Your new cost basis is $395/share. If MSFT rises to $430, your shares are sold at $415 — you still profit $15/share + $5 premium = $2,000 total, but miss the move from $415 to $430."
      references={[
        { label: 'Investopedia: Covered Call', url: 'https://www.investopedia.com/terms/c/coveredcall.asp' },
      ]}
    />
  );
}

function BullCallSpread() {
  const S = range(90, 130);
  const K1 = 105, K2 = 115, width = K2 - K1;
  const debit = 4; // net premium paid
  const pts = S.map((s): [number, number] => [
    s,
    Math.min(Math.max(s - K1, 0), width) - debit,
  ]);

  return (
    <StrategyCard
      meta={{
        name: 'Bull Call Spread (Debit Spread)',
        type: 'two legs',
        outlook: 'Bullish',
        risk: 'Low',
        reward: 'Width of spread − debit paid',
        complexity: 'Intermediate',
        maxLoss: 'Net debit paid',
        maxGain: '(Upper Strike − Lower Strike) − Net Debit',
        breakeven: 'Lower Strike + Net Debit',
      }}
      chart={
        <PayoffSVG
          title="Bull Call Spread Payoff"
          lines={[{ points: pts, color: '#34d399', label: 'Bull Call Spread' }]}
          xLabels={[{ x: K1, text: 'K₁' }, { x: K2, text: 'K₂' }]}
        />
      }
      when="You are moderately bullish — you expect the stock to rise to a specific level but not sky-rocket. You want to reduce the cost of a long call by giving up upside beyond a target price."
      howItWorks="Buy a call at a lower strike (K₁) and sell a call at a higher strike (K₂), same expiry. The premium collected from selling K₂ partially offsets the cost of buying K₁. Max profit is capped at K₂. Max loss is the net debit."
      entry="Choose K₁ near the current stock price (ATM or slightly OTM) and K₂ at your price target. Look for 30–60 DTE, moderate bullish signals. Spread width of $5–$10 is typical."
      exit="Close when the spread is worth 75–80% of max profit (don't be greedy). Cut if down 50% of max loss. Let expire if stock is above K₂ at expiration."
      pros={[
        'Cheaper than buying a call outright — reduced capital at risk',
        'Defined max loss (net debit) and defined max gain',
        'Less sensitive to IV crush than a simple long call',
        'Works well when you have a specific price target',
      ]}
      cons={[
        'Capped upside — you miss large moves above K₂',
        'More complex to manage (two legs to close)',
        'Still requires the stock to move up to be profitable',
        'Commissions on two legs can reduce edge on small spreads',
      ]}
      example="AAPL is at $200. You buy a $200 call and sell a $210 call, both 45 DTE. Net debit: $4 ($400 per contract). Max profit if AAPL ≥ $210: ($10 − $4) × 100 = $600. Max loss: $400 (if AAPL ≤ $200). Breakeven: $204."
      references={[
        { label: 'Investopedia: Bull Call Spread', url: 'https://www.investopedia.com/terms/b/bullcallspread.asp' },
        { label: 'Tastytrade: Debit Spreads', url: 'https://tastytrade.com/learn-center/options/debit-spreads/' },
      ]}
    />
  );
}

function BearPutSpread() {
  const S = range(80, 120);
  const K1 = 105, K2 = 95, width = K1 - K2;
  const debit = 4;
  const pts = S.map((s): [number, number] => [
    s,
    Math.min(Math.max(K1 - s, 0), width) - debit,
  ]);

  return (
    <StrategyCard
      meta={{
        name: 'Bear Put Spread (Debit Spread)',
        type: 'two legs',
        outlook: 'Bearish',
        risk: 'Low',
        reward: 'Width of spread − debit paid',
        complexity: 'Intermediate',
        maxLoss: 'Net debit paid',
        maxGain: '(Upper Strike − Lower Strike) − Net Debit',
        breakeven: 'Upper Strike − Net Debit',
      }}
      chart={
        <PayoffSVG
          title="Bear Put Spread Payoff"
          lines={[{ points: pts, color: '#f87171', label: 'Bear Put Spread' }]}
          xLabels={[{ x: K1, text: 'K₁' }, { x: K2, text: 'K₂' }]}
        />
      }
      when="You expect a moderate decline in the stock. The bear put spread is the bearish equivalent of the bull call spread — you get a cheaper put by selling a lower-strike put against it."
      howItWorks="Buy a put at a higher strike (K₁) and sell a put at a lower strike (K₂), same expiry. Premium from the short put reduces your cost. Max profit when stock closes below K₂ at expiry."
      entry="Buy the upper put near the current price, sell the lower put at your downside target. Same timing criteria as bull call spread but for bearish setups."
      exit="Close when spread reaches 75–80% of max value. Cut at 50% of max loss. Note: the spread widens (becomes more valuable) as the stock drops."
      pros={[
        'Cheaper than a long put — reduced capital requirement',
        'Limited, defined max loss',
        'Less impacted by IV crush than outright long put',
        'Good for moderately bearish views with a specific target',
      ]}
      cons={[
        'Capped gain — you miss large drops below K₂',
        'Two-leg complexity',
        'Still requires a meaningful downward move',
      ]}
      example="TSLA is at $300 and looks weak (EMA20 < EMA50, RSI 65). Buy a $295 put, sell a $285 put, 40 DTE. Net debit: $4 ($400/contract). Max profit: $600 if TSLA ≤ $285. Max loss: $400 if TSLA ≥ $295. Breakeven: $291."
      references={[
        { label: 'Investopedia: Bear Put Spread', url: 'https://www.investopedia.com/terms/b/bearputspread.asp' },
      ]}
    />
  );
}

function ProtectivePut() {
  const S = range(80, 130);
  const stockCost = 105, K = 100, prem = 3;
  const pts = S.map((s): [number, number] => [
    s,
    (s - stockCost) + Math.max(K - s, 0) - prem,
  ]);
  const stockPts = S.map((s): [number, number] => [s, s - stockCost]);

  return (
    <StrategyCard
      meta={{
        name: 'Protective Put (Married Put)',
        type: 'stock + long put',
        outlook: 'Bullish with downside protection',
        risk: 'Low',
        reward: 'Unlimited upside on stock, minus premium cost',
        complexity: 'Beginner',
        maxLoss: 'Stock Entry − Put Strike + Premium',
        maxGain: 'Unlimited (stock can rise indefinitely)',
        breakeven: 'Stock Entry Price + Premium Paid',
      }}
      chart={
        <PayoffSVG
          title="Protective Put vs Long Stock"
          lines={[
            { points: stockPts, color: '#60a5fa', label: 'Long Stock', dashed: true },
            { points: pts, color: '#a78bfa', label: 'Protected Stock' },
          ]}
          xLabels={[{ x: K, text: 'Put K' }]}
        />
      }
      when="You own a stock with significant gains and want to protect against a downside event (earnings, macro news) without selling your shares. Think of it as insurance on your position."
      howItWorks="Own 100 shares + buy 1 put option at or below the current price. If the stock falls below the put strike, the put gains value, offsetting your stock losses. The maximum loss is now capped — you cannot lose more than (Stock Entry − Put Strike + Premium Paid)."
      entry="Buy a put with a strike 5–10% below the current stock price with 30–60 DTE. Choose based on how much protection you need vs. how much premium you're willing to pay."
      exit="Let the put expire if the stock stays above the strike. Sell the put if the stock drops significantly and you want to capture the protection gain. Roll the put to a later date if you want continuous protection."
      pros={[
        'Full upside participation remains intact',
        'Hard floor on losses — true insurance',
        'No margin requirement (no leverage)',
        'Peace of mind around volatile events',
      ]}
      cons={[
        'Premium is a recurring cost that reduces returns over time',
        'If the stock does not move, the premium is wasted',
        'Over-protecting every position is expensive (like over-insuring)',
      ]}
      example="You own 100 shares of GOOGL at $170. Worried about earnings, you buy a $160 put, 30 DTE, for $2 per share ($200 total). Your new max loss: $170 − $160 + $2 = $12/share ($1,200) regardless of how far GOOGL drops. Your upside remains unlimited if GOOGL rises."
      references={[
        { label: 'Investopedia: Protective Put', url: 'https://www.investopedia.com/terms/p/protective-put.asp' },
      ]}
    />
  );
}

function LongStraddle() {
  const S = range(75, 135);
  const K = 105, callPrem = 5, putPrem = 5;
  const totalPrem = callPrem + putPrem;
  const pts = S.map((s): [number, number] => [
    s,
    Math.max(s - K, 0) + Math.max(K - s, 0) - totalPrem,
  ]);

  return (
    <StrategyCard
      meta={{
        name: 'Long Straddle',
        type: 'two legs (ATM call + ATM put)',
        outlook: 'Any — expects large move',
        risk: 'Moderate (both premiums)',
        reward: 'Unlimited in either direction',
        complexity: 'Intermediate',
        maxLoss: 'Both premiums paid',
        maxGain: 'Unlimited in either direction',
        breakeven: 'Strike ± Total Premium',
      }}
      chart={
        <PayoffSVG
          title="Long Straddle Payoff"
          lines={[{ points: pts, color: '#f59e0b', label: 'Long Straddle' }]}
          xLabels={[{ x: K, text: 'K' }, { x: K - totalPrem, text: 'Lower BE' }, { x: K + totalPrem, text: 'Upper BE' }]}
        />
      }
      when="You expect a large price move but don't know the direction — such as before a major earnings announcement, FDA approval, or legal ruling. The stock just needs to move significantly in either direction."
      howItWorks="Buy an ATM call AND an ATM put with the same strike and expiration. You profit if the stock moves beyond either breakeven (strike + total premium or strike − total premium). Loss is maximised if the stock stays exactly at the strike at expiration."
      entry="Best when IV is LOW (options are cheap) and a known catalyst is coming. Avoid if IV is already elevated — the premium will be too expensive. Look for IVR < 30."
      exit="Close before the catalyst event — IV will spike before and then collapse (IV crush) during/after the event. Or close one leg when the stock moves in one direction and let the other run."
      pros={[
        'Profits from a big move in either direction',
        'Defined max loss (both premiums)',
        'Vega positive — benefits from rising IV before the event',
        'Useful before known binary events',
      ]}
      cons={[
        'Expensive — paying two premiums',
        'Need a LARGE move to be profitable (cover both premiums)',
        'Time decay (theta) works doubly against you',
        'IV crush after events often destroys the trade',
      ]}
      example="AMZN earnings in 10 days. Stock at $185, IVR = 25 (cheap). Buy a $185 call AND a $185 put for $6 each ($12 total, $1,200 per contract). Lower breakeven: $173. Upper breakeven: $197. If AMZN moves to $205, call profit = $20 − $12 = $8 × 100 = $800 gain."
      references={[
        { label: 'Investopedia: Long Straddle', url: 'https://www.investopedia.com/terms/l/longstraddle.asp' },
      ]}
    />
  );
}

// ─────────────────────────────────────────────
// Comparison table
// ─────────────────────────────────────────────

function ComparisonTable() {
  const strategies = [
    { name: 'Long Call',        outlook: 'Bullish ↑',   legs: 1, loss: 'Premium', gain: 'Unlimited', complexity: 'Beginner' },
    { name: 'Long Put',         outlook: 'Bearish ↓',   legs: 1, loss: 'Premium', gain: 'Strike − Prem', complexity: 'Beginner' },
    { name: 'Covered Call',     outlook: 'Neutral ↔',   legs: 2, loss: 'Stock → $0', gain: 'Capped', complexity: 'Intermediate' },
    { name: 'Bull Call Spread',  outlook: 'Bullish ↑',  legs: 2, loss: 'Net Debit', gain: 'Spread − Debit', complexity: 'Intermediate' },
    { name: 'Bear Put Spread',   outlook: 'Bearish ↓',  legs: 2, loss: 'Net Debit', gain: 'Spread − Debit', complexity: 'Intermediate' },
    { name: 'Protective Put',   outlook: 'Bullish ↑',   legs: 2, loss: 'Capped', gain: 'Unlimited', complexity: 'Beginner' },
    { name: 'Long Straddle',    outlook: 'Any ↕',        legs: 2, loss: '2× Premium', gain: 'Unlimited', complexity: 'Intermediate' },
  ];

  const outlookColor = (o: string) =>
    o.includes('↑') ? 'text-green-400' : o.includes('↓') ? 'text-red-400' : o.includes('↕') ? 'text-purple-400' : 'text-white/50';

  const complexityColor = (c: string) =>
    c === 'Beginner' ? 'text-green-400' : c === 'Intermediate' ? 'text-yellow-400' : 'text-red-400';

  return (
    <section className="my-8">
      <SectionTitle icon={BarChart3}>Strategy Comparison at a Glance</SectionTitle>
      <div className="rounded-2xl border border-white/[0.08] bg-white/[0.03] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs border-collapse">
            <thead>
              <tr className="border-b border-white/[0.06]">
                {['Strategy', 'Outlook', 'Legs', 'Max Loss', 'Max Gain', 'Complexity'].map((h) => (
                  <th key={h} className="text-left py-3 px-4 text-white/30 font-medium uppercase tracking-wide text-[10px]">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {strategies.map((s, i) => (
                <tr
                  key={s.name}
                  className={`border-b border-white/[0.04] transition-colors duration-150 hover:bg-white/[0.03] ${i === strategies.length - 1 ? 'border-none' : ''}`}
                >
                  <td className="py-2.5 px-4 font-semibold text-white/80">{s.name}</td>
                  <td className={`py-2.5 px-4 font-medium ${outlookColor(s.outlook)}`}>{s.outlook}</td>
                  <td className="py-2.5 px-4 text-center text-white/50 font-mono">{s.legs}</td>
                  <td className="py-2.5 px-4 text-red-400/80">{s.loss}</td>
                  <td className="py-2.5 px-4 text-green-400/80">{s.gain}</td>
                  <td className={`py-2.5 px-4 font-medium text-[11px] ${complexityColor(s.complexity)}`}>{s.complexity}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────
// Page
// ─────────────────────────────────────────────

export default function StrategiesPage() {
  return (
    <>
      <Header title="Options Strategies" />
      <div className="flex-1 p-6 max-w-5xl mx-auto w-full">
        {/* Hero */}
        <div className="relative rounded-2xl border border-blue-500/[0.2] bg-blue-500/[0.04] p-6 mb-8 overflow-hidden animate-slide-up">
          <div className="absolute -top-16 -left-16 w-56 h-56 bg-blue-500/[0.07] rounded-full blur-3xl pointer-events-none" />
          <div className="relative flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-blue-500/[0.15] border border-blue-500/[0.2] flex items-center justify-center shrink-0">
              <Zap className="h-6 w-6 text-blue-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold mb-2 text-white/90">Options Trading Strategies</h1>
              <p className="text-sm text-white/40 leading-relaxed">
                Practical guide to the most important long-options strategies. Each strategy
                includes a payoff diagram, entry/exit criteria, real-world examples, and
                honest pros and cons. This app focuses on <strong className="text-white/60">buying</strong> (long) options —
                strategies with defined risk and no margin requirements.
              </p>
              <div className="flex flex-wrap gap-1.5 mt-3">
                {['Long Call', 'Long Put', 'Covered Call', 'Bull Call Spread', 'Bear Put Spread', 'Protective Put', 'Long Straddle'].map((t) => (
                  <span key={t} className="text-[10px] px-2 py-0.5 rounded-md border border-blue-500/[0.2] bg-blue-500/[0.08] text-blue-300/70">{t}</span>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Comparison table first for quick reference */}
        <ComparisonTable />

        {/* Beginner strategies */}
        <SectionTitle icon={TrendingUp}>Beginner Strategies</SectionTitle>
        <LongCall />
        <LongPut />
        <ProtectivePut />

        {/* Intermediate strategies */}
        <SectionTitle icon={Shield}>Intermediate Strategies</SectionTitle>
        <CoveredCall />
        <BullCallSpread />
        <BearPutSpread />
        <LongStraddle />

        {/* Further reading */}
        <section className="mt-10 rounded-lg border border-border bg-muted/10 p-5">
          <h3 className="font-semibold mb-3 text-sm">Further Reading & Resources</h3>
          <ul className="space-y-2 text-xs">
            {[
              { label: 'Options Industry Council — Free Options Education', url: 'https://www.optionseducation.org/' },
              { label: 'CBOE Learning Center', url: 'https://www.cboe.com/education/' },
              { label: 'Investopedia Options Guide', url: 'https://www.investopedia.com/options-basics-tutorial-4583012' },
              { label: 'Tastytrade Concepts & Strategies', url: 'https://tastytrade.com/learn-center/options/' },
              { label: 'Options, Futures, and Other Derivatives — John C. Hull (textbook)', url: 'https://www.amazon.com/Options-Futures-Other-Derivatives-10th/dp/013447208X' },
              { label: 'Option Volatility & Pricing — Sheldon Natenberg (advanced)', url: 'https://www.amazon.com/Option-Volatility-Pricing-Strategies-Techniques/dp/0071818774' },
            ].map((r) => (
              <li key={r.url}>
                <a href={r.url} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-1.5 text-primary hover:underline">
                  <ExternalLink className="h-3 w-3 shrink-0" />{r.label}
                </a>
              </li>
            ))}
          </ul>
        </section>

        {/* Disclaimer */}
        <div className="mt-6 rounded-lg border border-yellow-500/30 bg-yellow-950/10 p-4 text-xs text-yellow-400">
          <strong>Disclaimer:</strong> All strategies presented here are for educational purposes only.
          Options trading involves significant risk of loss and is not suitable for all investors.
          Past performance does not guarantee future results. Always conduct your own due diligence
          and consider consulting a licensed financial advisor before trading.
        </div>
      </div>
    </>
  );
}
