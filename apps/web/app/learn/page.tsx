import { Header } from '@/components/layout/Header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  TrendingUp, TrendingDown, Clock, DollarSign, AlertTriangle,
  BookOpen, Lightbulb, Target, Shield,
} from 'lucide-react';

// ─────────────────────────────────────────────
// Shared primitives
// ─────────────────────────────────────────────

function SectionTitle({ icon: Icon, children }: { icon: React.ElementType; children: React.ReactNode }) {
  return (
    <h2 className="flex items-center gap-2 text-xl font-bold mt-10 mb-4 text-foreground">
      <Icon className="h-5 w-5 text-primary" />
      {children}
    </h2>
  );
}

function CalloutBox({ type, children }: { type: 'tip' | 'warning' | 'key'; children: React.ReactNode }) {
  const styles = {
    tip:     'border-blue-500/40 bg-blue-950/20 text-blue-300',
    warning: 'border-yellow-500/40 bg-yellow-950/20 text-yellow-300',
    key:     'border-green-500/40 bg-green-950/20 text-green-300',
  }[type];
  const icons = { tip: Lightbulb, warning: AlertTriangle, key: Target };
  const Icon = icons[type];
  return (
    <div className={`flex gap-3 rounded-lg border px-4 py-3 my-4 text-sm ${styles}`}>
      <Icon className="h-4 w-4 shrink-0 mt-0.5" />
      <div>{children}</div>
    </div>
  );
}

function Vocab({ term, children }: { term: string; children: React.ReactNode }) {
  return (
    <div className="border-l-2 border-primary/40 pl-4 py-1 my-3">
      <span className="font-semibold text-primary">{term}</span>
      <span className="text-muted-foreground"> — </span>
      <span className="text-sm text-foreground/80">{children}</span>
    </div>
  );
}

// ─────────────────────────────────────────────
// SVG payoff diagrams
// ─────────────────────────────────────────────

/** Simple inline SVG payoff chart */
function PayoffChart({
  lines,
  labels,
  title,
  height = 120,
}: {
  lines: { points: [number, number][]; color: string; label: string }[];
  labels: { x: number; text: string }[];
  title: string;
  height?: number;
}) {
  const W = 300;
  const H = height;
  const PAD = { top: 12, right: 12, bottom: 28, left: 40 };
  const innerW = W - PAD.left - PAD.right;
  const innerH = H - PAD.top - PAD.bottom;

  // Collect all points to auto-scale
  const allPts = lines.flatMap((l) => l.points);
  const xs = allPts.map((p) => p[0]);
  const ys = allPts.map((p) => p[1]);
  const xMin = Math.min(...xs);
  const xMax = Math.max(...xs);
  const yMin = Math.min(...ys);
  const yMax = Math.max(...ys);

  const scaleX = (x: number) => PAD.left + ((x - xMin) / (xMax - xMin)) * innerW;
  const scaleY = (y: number) => PAD.top + innerH - ((y - yMin) / (yMax - yMin)) * innerH;

  const zeroY = scaleY(0);
  const toPath = (pts: [number, number][]) =>
    pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${scaleX(p[0]).toFixed(1)} ${scaleY(p[1]).toFixed(1)}`).join(' ');

  return (
    <div className="my-4">
      <p className="text-xs text-center text-muted-foreground mb-1">{title}</p>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full max-w-xs mx-auto" aria-label={title}>
        {/* Zero line */}
        <line x1={PAD.left} y1={zeroY} x2={W - PAD.right} y2={zeroY} stroke="#444" strokeDasharray="4 2" strokeWidth={1} />

        {/* Axes */}
        <line x1={PAD.left} y1={PAD.top} x2={PAD.left} y2={H - PAD.bottom} stroke="#555" strokeWidth={1} />
        <line x1={PAD.left} y1={H - PAD.bottom} x2={W - PAD.right} y2={H - PAD.bottom} stroke="#555" strokeWidth={1} />

        {/* Axis labels */}
        <text x={W / 2} y={H - 4} textAnchor="middle" fontSize={9} fill="#666">Stock Price at Expiry</text>
        <text x={8} y={H / 2} textAnchor="middle" fontSize={9} fill="#666" transform={`rotate(-90,8,${H / 2})`}>P&L</text>
        <text x={PAD.left - 2} y={zeroY + 4} textAnchor="end" fontSize={8} fill="#666">0</text>

        {/* Strike labels */}
        {labels.map((l) => (
          <g key={l.text}>
            <line x1={scaleX(l.x)} y1={PAD.top} x2={scaleX(l.x)} y2={H - PAD.bottom} stroke="#555" strokeDasharray="2 3" strokeWidth={1} />
            <text x={scaleX(l.x)} y={H - PAD.bottom + 10} textAnchor="middle" fontSize={8} fill="#777">{l.text}</text>
          </g>
        ))}

        {/* Payoff lines */}
        {lines.map((l) => (
          <path key={l.label} d={toPath(l.points)} fill="none" stroke={l.color} strokeWidth={2} />
        ))}
      </svg>
      {/* Legend */}
      <div className="flex justify-center gap-4 mt-1">
        {lines.map((l) => (
          <div key={l.label} className="flex items-center gap-1">
            <div className="w-4 h-0.5" style={{ backgroundColor: l.color }} />
            <span className="text-[10px] text-muted-foreground">{l.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// Payoff data helpers
// ─────────────────────────────────────────────

// Long call payoff: max(S-K,0) - premium
function longCallPayoff(K: number, premium: number, prices: number[]) {
  return prices.map((S): [number, number] => [S, Math.max(S - K, 0) - premium]);
}
// Long put payoff: max(K-S,0) - premium
function longPutPayoff(K: number, premium: number, prices: number[]) {
  return prices.map((S): [number, number] => [S, Math.max(K - S, 0) - premium]);
}

const CALL_PRICES = [80, 90, 95, 100, 105, 110, 115, 120, 130];
const PUT_PRICES  = [70, 80, 85, 90, 95, 100, 105, 110, 120];

// ─────────────────────────────────────────────
// Section components
// ─────────────────────────────────────────────

function WhatIsAnOption() {
  return (
    <section>
      <SectionTitle icon={BookOpen}>What Is an Option?</SectionTitle>
      <p className="text-sm text-foreground/80 leading-relaxed mb-3">
        An <strong>option</strong> is a contract between a buyer and a seller. It gives the buyer the
        <em> right, but not the obligation</em>, to buy or sell 100 shares of a stock at a specific
        price on or before a specific date.
      </p>
      <p className="text-sm text-foreground/80 leading-relaxed mb-3">
        Think of it like a reservation. If you put down a $200 deposit to reserve a house for
        purchase at $400,000 within 30 days, you can walk away and only lose your $200 deposit —
        you are not forced to buy the house. An option works the same way.
      </p>
      <CalloutBox type="key">
        One option contract always controls <strong>100 shares</strong>. If an option is priced
        at $3.00, the actual cost for one contract is $3.00 × 100 = <strong>$300</strong>.
        This is called the <em>contract cost</em> or <em>premium</em>.
      </CalloutBox>

      {/* Visual: option = right, not obligation */}
      <div className="grid sm:grid-cols-2 gap-4 my-4">
        <div className="rounded-lg border border-green-500/30 bg-green-950/10 p-4">
          <div className="font-semibold text-green-400 mb-2 flex items-center gap-2">
            <TrendingUp className="h-4 w-4" /> Call Option
          </div>
          <p className="text-xs text-foreground/70 leading-relaxed">
            Right to <strong>buy</strong> 100 shares at the strike price.<br />
            You profit when the stock goes <strong>up</strong>.<br />
            Maximum loss = premium paid.
          </p>
        </div>
        <div className="rounded-lg border border-red-500/30 bg-red-950/10 p-4">
          <div className="font-semibold text-red-400 mb-2 flex items-center gap-2">
            <TrendingDown className="h-4 w-4" /> Put Option
          </div>
          <p className="text-xs text-foreground/70 leading-relaxed">
            Right to <strong>sell</strong> 100 shares at the strike price.<br />
            You profit when the stock goes <strong>down</strong>.<br />
            Maximum loss = premium paid.
          </p>
        </div>
      </div>
    </section>
  );
}

function KeyTerms() {
  return (
    <section>
      <SectionTitle icon={BookOpen}>Key Vocabulary</SectionTitle>
      <div className="space-y-1">
        <Vocab term="Premium">
          The price you pay to buy the option contract. This is your maximum possible loss.
          If an option costs $3.50 per share, one contract costs $350.
        </Vocab>
        <Vocab term="Strike Price (K)">
          The price at which you can buy (call) or sell (put) the underlying stock if you
          exercise the option. Also written as the &quot;exercise price.&quot;
        </Vocab>
        <Vocab term="Expiration Date">
          The last date the option is valid. Most equity options expire on the third Friday
          of the month (or the Thursday before for Nasdaq-listed stocks). After this date the
          option is worthless if not exercised.
        </Vocab>
        <Vocab term="DTE — Days to Expiration">
          How many calendar days remain until the option expires. Shorter DTE = faster time
          decay. Most traders target 30–60 DTE for balanced risk.
        </Vocab>
        <Vocab term="In-the-Money (ITM)">
          A call is ITM when the stock price is <em>above</em> the strike.
          A put is ITM when the stock price is <em>below</em> the strike.
          ITM options have intrinsic value.
        </Vocab>
        <Vocab term="Out-of-the-Money (OTM)">
          A call is OTM when the stock is <em>below</em> the strike.
          A put is OTM when the stock is <em>above</em> the strike.
          OTM options are cheaper but require a larger move to become profitable.
        </Vocab>
        <Vocab term="At-the-Money (ATM)">
          When the strike price equals (or is very close to) the current stock price.
          ATM options have the highest time value and are most commonly traded.
        </Vocab>
        <Vocab term="Intrinsic Value">
          The immediate exercise value. For a call: max(Stock − Strike, 0).
          For a put: max(Strike − Stock, 0). An OTM option has zero intrinsic value.
        </Vocab>
        <Vocab term="Time Value (Extrinsic Value)">
          Option premium above intrinsic value. Reflects uncertainty and time remaining.
          A call on a $100 stock with a $100 strike worth $4 has $4 of pure time value.
          Time value decays away as expiration approaches (theta decay).
        </Vocab>
        <Vocab term="Open Interest (OI)">
          The total number of open option contracts for a given strike and expiry.
          Higher OI = more liquid = tighter spreads = easier to enter and exit.
          Look for OI &gt; 500 before trading.
        </Vocab>
        <Vocab term="Bid-Ask Spread">
          The difference between the highest buyer price (bid) and the lowest seller
          price (ask). A wide spread (e.g. $0.50 on a $1.00 option = 50%) means you
          immediately lose a lot when you enter. Target spreads below 5–8%.
        </Vocab>
        <Vocab term="Implied Volatility (IV)">
          The market&apos;s forecast of future price swings, expressed as an annualised
          percentage. Higher IV = more expensive options. IV is derived by working the
          Black-Scholes formula backwards from the market price.
        </Vocab>
        <Vocab term="IV Rank (IVR)">
          Where current IV sits within its 52-week range. IVR of 0% means IV is at its
          lowest in a year (options are historically cheap — great for buyers).
          IVR of 100% means IV is at its annual peak (options are expensive).
        </Vocab>
        <Vocab term="Historical Volatility (HV / HV30)">
          The realised standard deviation of daily price returns over the past 30 days,
          annualised. Comparing HV to IV shows whether the market is over- or under-pricing
          uncertainty.
        </Vocab>
      </div>
    </section>
  );
}

function GreeksSection() {
  return (
    <section>
      <SectionTitle icon={Target}>The Greeks — Your Risk Dashboard</SectionTitle>
      <p className="text-sm text-foreground/80 leading-relaxed mb-4">
        Greeks are numbers that tell you exactly how your option&apos;s price will change when
        market conditions shift. You don&apos;t need to memorise formulas — just understand
        what each one means.
      </p>

      {/* Greeks visual table */}
      <div className="space-y-3">
        {[
          {
            letter: 'Δ',
            name: 'Delta',
            color: 'text-blue-400',
            border: 'border-blue-500/30',
            bg: 'bg-blue-950/10',
            simple: 'How much does the option move per $1 stock move?',
            detail: 'A delta of 0.40 means your option gains ~$40 for every $100 the stock rises (1 contract). Calls have positive delta (0 to 1). Puts have negative delta (−1 to 0). Delta also approximates the probability the option expires in-the-money.',
            example: 'AAPL call delta 0.45: stock goes up $1 → option goes up ~$0.45 per share ($45 per contract)',
          },
          {
            letter: 'Θ',
            name: 'Theta',
            color: 'text-red-400',
            border: 'border-red-500/30',
            bg: 'bg-red-950/10',
            simple: 'How much value does the option lose per day (all else equal)?',
            detail: 'Time decay works against option buyers. A theta of −0.05 means the option loses $0.05 per share ($5 per contract) every day, even if the stock does not move. Decay accelerates in the final 30 days.',
            example: 'Option priced at $3.00 with theta −0.04: worth ~$2.96 tomorrow, ~$2.72 in one week',
          },
          {
            letter: 'Γ',
            name: 'Gamma',
            color: 'text-purple-400',
            border: 'border-purple-500/30',
            bg: 'bg-purple-950/10',
            simple: 'How fast does delta change as the stock moves?',
            detail: 'High gamma = delta changes rapidly. ATM options near expiration have the highest gamma. This makes them exciting but also riskier. LEAPS have very low gamma.',
            example: 'Delta 0.40, gamma 0.06: stock moves up $1 → delta becomes ~0.46',
          },
          {
            letter: 'ν',
            name: 'Vega',
            color: 'text-yellow-400',
            border: 'border-yellow-500/30',
            bg: 'bg-yellow-950/10',
            simple: 'How much does the option move per 1% change in implied volatility?',
            detail: 'Options buyers benefit from rising IV (vega is positive). A vega of 0.10 means the option gains $0.10 per share ($10 per contract) for every 1% rise in IV. Long-dated options have high vega; short-dated have low vega.',
            example: 'IV rises from 30% to 35% (+5%): option with vega 0.10 gains ~$0.50 per share ($50 per contract)',
          },
        ].map((g) => (
          <div key={g.name} className={`rounded-lg border ${g.border} ${g.bg} p-4`}>
            <div className="flex items-start gap-3">
              <div className={`text-2xl font-bold font-mono ${g.color} w-8 shrink-0`}>{g.letter}</div>
              <div className="flex-1">
                <div className="font-semibold mb-1">{g.name}</div>
                <p className="text-xs text-foreground/80 mb-1"><strong>{g.simple}</strong></p>
                <p className="text-xs text-muted-foreground leading-relaxed mb-1">{g.detail}</p>
                <p className="text-[11px] text-muted-foreground/70 italic">{g.example}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <CalloutBox type="tip">
        <strong>Quick rule of thumb:</strong> When buying options, you want <em>high delta</em> (big moves),
        <em> low theta</em> (slow decay), and <em>low IV rank</em> (cheap premium). The scoring engine
        in this app weights these factors automatically.
      </CalloutBox>
    </section>
  );
}

function HowPricingWorks() {
  return (
    <section>
      <SectionTitle icon={DollarSign}>How Are Options Priced?</SectionTitle>
      <p className="text-sm text-foreground/80 leading-relaxed mb-3">
        Option prices have two components:
      </p>

      {/* Equation visual */}
      <div className="flex flex-wrap items-center gap-2 my-4 text-sm font-mono bg-muted/30 rounded-lg p-4">
        <span className="text-yellow-400 font-bold">Option Price</span>
        <span className="text-muted-foreground">=</span>
        <span className="text-green-400 font-bold">Intrinsic Value</span>
        <span className="text-muted-foreground">+</span>
        <span className="text-blue-400 font-bold">Time Value</span>
      </div>

      <div className="grid sm:grid-cols-2 gap-4 my-4">
        <div className="rounded-lg border border-green-500/20 bg-green-950/10 p-4">
          <div className="font-semibold text-green-400 text-sm mb-2">Intrinsic Value</div>
          <p className="text-xs text-foreground/70 leading-relaxed">
            The value if you exercised right now.<br /><br />
            <strong>Call:</strong> max(Stock − Strike, 0)<br />
            <strong>Put:</strong> max(Strike − Stock, 0)<br /><br />
            Example: Stock at $105, Call strike $100 → intrinsic value = $5
          </p>
        </div>
        <div className="rounded-lg border border-blue-500/20 bg-blue-950/10 p-4">
          <div className="font-semibold text-blue-400 text-sm mb-2">Time Value</div>
          <p className="text-xs text-foreground/70 leading-relaxed">
            The extra amount the market pays for the <em>chance</em> the option moves in
            your favour before expiry. Driven by DTE, implied volatility, and interest rates.
            Decays to zero at expiration (theta decay).
          </p>
        </div>
      </div>

      <p className="text-sm text-foreground/80 leading-relaxed mb-3">
        The dominant pricing model is <strong>Black-Scholes</strong> (1973), which calculates a fair
        theoretical price based on the stock price, strike, DTE, risk-free rate, and volatility.
        Options Lab shows this as &quot;BS Fair Value&quot; — if the market price is below the fair
        value, the option has positive theoretical edge.
      </p>

      <CalloutBox type="warning">
        Black-Scholes assumes <em>constant volatility</em> and <em>no dividends</em>. Real markets
        have volatility smiles, earnings events, and gaps. Always treat the BS fair value as an
        approximation, not a guarantee.
      </CalloutBox>
    </section>
  );
}

function ExpirySection() {
  return (
    <section>
      <SectionTitle icon={Clock}>Expiration Categories Explained</SectionTitle>
      <p className="text-sm text-foreground/80 leading-relaxed mb-4">
        Options come with different expiry cycles. Choosing the right one affects your trade risk significantly.
      </p>
      <div className="grid sm:grid-cols-2 gap-3">
        {[
          {
            badge: 'Weekly',
            badgeColor: 'bg-blue-500/20 text-blue-300',
            dte: '1–14 DTE',
            desc: 'Expire every Friday. Very cheap (low premium) but lose value extremely fast. Even a correct directional call can lose money if the move happens slowly. Best left to experienced traders.',
            risk: 'Very High',
          },
          {
            badge: 'Monthly',
            badgeColor: 'bg-green-500/20 text-green-300',
            dte: '15–60 DTE',
            desc: 'Standard expiry — 3rd Friday of each month. The "sweet spot" for most retail traders. Enough time for your thesis to play out, but not so far out that you overpay for time value.',
            risk: 'Moderate',
          },
          {
            badge: 'Quarterly',
            badgeColor: 'bg-purple-500/20 text-purple-300',
            dte: '60–365 DTE',
            desc: 'Expire in March, June, September, December. High liquidity, commonly used by institutions for hedging. Good for macro-level trades (earnings season, rate decisions).',
            risk: 'Moderate',
          },
          {
            badge: 'LEAPS',
            badgeColor: 'bg-orange-500/20 text-orange-300',
            dte: '365+ DTE',
            desc: 'Long-Term Equity AnticiPation Securities. Expire 1–2 years out. Very expensive (high time value) but behave more like stock ownership. Used as a stock replacement strategy.',
            risk: 'Lower',
          },
        ].map((e) => (
          <div key={e.badge} className="rounded-lg border border-border p-4">
            <div className="flex items-center justify-between mb-2">
              <span className={`text-xs font-semibold px-2 py-0.5 rounded ${e.badgeColor}`}>{e.badge}</span>
              <span className="text-xs text-muted-foreground">{e.dte}</span>
            </div>
            <p className="text-xs text-foreground/70 leading-relaxed mb-2">{e.desc}</p>
            <div className="text-[10px] text-muted-foreground">Risk level: <span className="font-medium">{e.risk}</span></div>
          </div>
        ))}
      </div>
      <CalloutBox type="tip">
        <strong>For most beginners:</strong> start with <em>monthly options at 30–45 DTE</em>.
        You have time for the trade to work, time decay isn&apos;t crushing you yet, and the
        market is liquid enough to exit early if needed.
      </CalloutBox>
    </section>
  );
}

function PayoffSection() {
  const callPts = longCallPayoff(100, 4, CALL_PRICES);
  const putPts  = longPutPayoff(100, 4, PUT_PRICES);

  return (
    <section>
      <SectionTitle icon={TrendingUp}>Payoff Diagrams — What You Win or Lose</SectionTitle>
      <p className="text-sm text-foreground/80 leading-relaxed mb-4">
        A payoff diagram shows profit and loss at expiration for every possible stock price.
        The x-axis is the stock price at expiry; the y-axis is your P&L.
      </p>

      <div className="grid sm:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-green-400">Long Call — Example</CardTitle>
            <p className="text-xs text-muted-foreground">Strike $100, Premium $4 per share ($400 total)</p>
          </CardHeader>
          <CardContent>
            <PayoffChart
              title="Long Call P&L at Expiration"
              lines={[{ points: callPts, color: '#4ade80', label: 'Long Call' }]}
              labels={[{ x: 100, text: 'K=$100' }, { x: 104, text: 'Breakeven' }]}
            />
            <div className="space-y-1 text-xs text-foreground/70 mt-2">
              <p>📍 <strong>Breakeven:</strong> $104 (strike + premium)</p>
              <p>📉 <strong>Max loss:</strong> $400 (if stock stays below $100)</p>
              <p>📈 <strong>Profit potential:</strong> Unlimited (stock can rise indefinitely)</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-red-400">Long Put — Example</CardTitle>
            <p className="text-xs text-muted-foreground">Strike $100, Premium $4 per share ($400 total)</p>
          </CardHeader>
          <CardContent>
            <PayoffChart
              title="Long Put P&L at Expiration"
              lines={[{ points: putPts, color: '#f87171', label: 'Long Put' }]}
              labels={[{ x: 100, text: 'K=$100' }, { x: 96, text: 'Breakeven' }]}
            />
            <div className="space-y-1 text-xs text-foreground/70 mt-2">
              <p>📍 <strong>Breakeven:</strong> $96 (strike − premium)</p>
              <p>📉 <strong>Max loss:</strong> $400 (if stock stays above $100)</p>
              <p>📈 <strong>Profit potential:</strong> Up to $9,600 (if stock goes to $0)</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <CalloutBox type="key">
        <strong>The single most important rule:</strong> When you BUY an option, the most you
        can ever lose is the premium you paid. You cannot lose more than your initial cost.
        This is what makes buying options less risky than selling options (short selling),
        which carries theoretically unlimited loss.
      </CalloutBox>
    </section>
  );
}

function IVSection() {
  return (
    <section>
      <SectionTitle icon={Target}>Implied Volatility — The Most Important Number</SectionTitle>
      <p className="text-sm text-foreground/80 leading-relaxed mb-3">
        Implied Volatility (IV) is the market&apos;s expectation of how much a stock will move.
        High IV = expensive options. Low IV = cheap options.
      </p>
      <p className="text-sm text-foreground/80 leading-relaxed mb-4">
        IV Rank (IVR) tells you <em>where</em> current IV sits relative to its 52-week range.
        An IVR of 0 means IV is at an annual low — options are the cheapest they&apos;ve been
        all year. This is the best time to buy options.
      </p>

      {/* IV Rank scale */}
      <div className="rounded-lg border border-border bg-muted/10 p-4 my-4">
        <p className="text-xs font-semibold text-muted-foreground mb-3 uppercase tracking-wide">IV Rank Scale</p>
        <div className="flex rounded-full overflow-hidden h-5 text-[10px] font-semibold">
          <div className="bg-green-500 flex items-center justify-center text-white" style={{ width: '30%' }}>0–30 Cheap</div>
          <div className="bg-yellow-500 flex items-center justify-center text-black" style={{ width: '40%' }}>30–70 Normal</div>
          <div className="bg-red-500 flex items-center justify-center text-white" style={{ width: '30%' }}>70–100 Expensive</div>
        </div>
        <div className="flex justify-between text-[10px] text-muted-foreground mt-1">
          <span>Best for buying</span>
          <span>OK</span>
          <span>Avoid buying</span>
        </div>
      </div>

      <CalloutBox type="warning">
        IV spikes <em>before</em> earnings announcements, FDA decisions, and major macro events.
        Buying options right before earnings and holding through the announcement is usually
        a losing strategy because IV collapses immediately after the event (&quot;IV crush&quot;),
        often losing 30–60% of option value even if the stock moves in your direction.
      </CalloutBox>
    </section>
  );
}

function RiskSection() {
  return (
    <section>
      <SectionTitle icon={Shield}>Risk Management for Beginners</SectionTitle>
      <div className="space-y-3 text-sm text-foreground/80">
        <div className="rounded-lg border border-border p-4">
          <p className="font-semibold mb-1">1. Only risk what you can afford to lose completely</p>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Options can expire worthless. Never invest money you need for rent, food, or bills.
            A common rule: risk no more than 2–5% of your total portfolio on a single options trade.
          </p>
        </div>
        <div className="rounded-lg border border-border p-4">
          <p className="font-semibold mb-1">2. Start with 30–60 DTE, 0.30–0.50 delta</p>
          <p className="text-xs text-muted-foreground leading-relaxed">
            These contracts are cheap enough to be affordable but liquid enough to exit early.
            Avoid weekly options until you have significant experience. They expire too fast.
          </p>
        </div>
        <div className="rounded-lg border border-border p-4">
          <p className="font-semibold mb-1">3. Plan your exit before you enter</p>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Set a profit target (+50–100%) and a stop loss (−30–50%) before placing the trade.
            Most successful options traders close winners early rather than holding to expiration.
          </p>
        </div>
        <div className="rounded-lg border border-border p-4">
          <p className="font-semibold mb-1">4. Check liquidity before you trade</p>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Look for open interest ≥ 500 and a bid-ask spread below 8%. Wide spreads mean
            you lose money immediately just from the entry. Use limit orders, never market orders.
          </p>
        </div>
        <div className="rounded-lg border border-border p-4">
          <p className="font-semibold mb-1">5. Avoid earnings with long options</p>
          <p className="text-xs text-muted-foreground leading-relaxed">
            IV is artificially high before earnings because nobody knows which direction the stock
            will move. Even if you guess right, IV crush can wipe out your gains. Wait until after
            earnings to enter long options positions.
          </p>
        </div>
      </div>
    </section>
  );
}

function GlossaryQuiz() {
  const items = [
    { q: 'A call option is profitable when the stock goes…', a: 'UP (above the strike + premium paid)' },
    { q: 'A put option is profitable when the stock goes…', a: 'DOWN (below the strike − premium paid)' },
    { q: 'What is the maximum loss when buying a call or put?', a: 'The premium paid (contract cost)' },
    { q: 'IV Rank of 15% means options are…', a: 'Historically cheap — good time to buy' },
    { q: 'Theta measures…', a: 'Daily time decay (how much value the option loses per day)' },
    { q: 'One contract controls how many shares?', a: '100 shares' },
  ];

  return (
    <section>
      <SectionTitle icon={Lightbulb}>Quick Knowledge Check</SectionTitle>
      <p className="text-xs text-white/30 mb-4">Hover each card to reveal the answer.</p>
      <div className="grid sm:grid-cols-2 gap-3">
        {items.map((item, i) => (
          <div
            key={item.q}
            className="flip-card rounded-xl h-[88px]"
          >
            <div className="flip-card-inner rounded-xl">
              {/* Front */}
              <div className="flip-card-front rounded-xl border border-white/[0.08] bg-white/[0.03] p-4 flex flex-col justify-center">
                <div className="flex items-start gap-2">
                  <span className="text-[10px] font-bold text-white/25 mt-0.5 shrink-0">Q{i + 1}</span>
                  <p className="text-sm font-medium text-white/80 leading-snug">{item.q}</p>
                </div>
                <p className="text-[10px] text-white/25 mt-2 ml-5">hover to reveal →</p>
              </div>
              {/* Back */}
              <div className="flip-card-back rounded-xl border border-green-500/[0.25] bg-green-500/[0.06] p-4 flex flex-col justify-center">
                <div className="flex items-start gap-2">
                  <span className="text-[10px] font-bold text-green-400/50 mt-0.5 shrink-0">A{i + 1}</span>
                  <p className="text-sm font-semibold text-green-400 leading-snug">{item.a}</p>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────
// Page
// ─────────────────────────────────────────────

export default function LearnPage() {
  return (
    <>
      <Header title="Learn Options" />
      <div className="flex-1 p-6 max-w-4xl mx-auto w-full">
        {/* Hero */}
        <div className="relative rounded-2xl border border-blue-500/[0.2] bg-blue-500/[0.04] p-6 mb-8 overflow-hidden animate-slide-up">
          <div className="absolute -top-16 -right-16 w-56 h-56 bg-blue-500/[0.08] rounded-full blur-3xl pointer-events-none" />
          <div className="relative flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-blue-500/[0.15] border border-blue-500/[0.2] flex items-center justify-center shrink-0">
              <BookOpen className="h-6 w-6 text-blue-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold mb-2 text-white/90">Options Trading — From Zero</h1>
              <p className="text-sm text-white/40 leading-relaxed">
                This guide explains options from the very basics. No prior finance knowledge
                required. By the end you will understand what calls and puts are, how they are
                priced, what the Greeks mean, and how to manage risk as a beginner.
              </p>
              <div className="flex flex-wrap gap-1.5 mt-3">
                {['What is an Option', 'Key Vocabulary', 'The Greeks', 'Pricing', 'Expiry Types', 'Payoff Diagrams', 'IV', 'Risk Management'].map((t) => (
                  <span key={t} className="text-[10px] px-2 py-0.5 rounded-md border border-blue-500/[0.2] bg-blue-500/[0.08] text-blue-300/70">{t}</span>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Sections */}
        <WhatIsAnOption />
        <KeyTerms />
        <HowPricingWorks />
        <PayoffSection />
        <GreeksSection />
        <IVSection />
        <ExpirySection />
        <RiskSection />
        <GlossaryQuiz />

        {/* Footer */}
        <div className="mt-12 rounded-lg border border-yellow-500/30 bg-yellow-950/10 p-4 text-xs text-yellow-400">
          <strong>Disclaimer:</strong> This guide is for educational purposes only and does not
          constitute financial advice. Options trading involves significant risk of loss. Past
          performance does not guarantee future results. Always consult a licensed financial
          advisor before trading.
        </div>
      </div>
    </>
  );
}
