'use client';

import { useRouter } from 'next/navigation';
import { Header } from '@/components/layout/Header';
import { useEarnings } from '@/hooks/useMarketData';
import { cn } from '@/lib/utils';

const WATCHLIST: { symbol: string; name: string }[] = [
  { symbol: 'AAPL',  name: 'Apple Inc.' },
  { symbol: 'MSFT',  name: 'Microsoft Corp.' },
  { symbol: 'NVDA',  name: 'NVIDIA Corp.' },
  { symbol: 'AMZN',  name: 'Amazon.com Inc.' },
  { symbol: 'GOOGL', name: 'Alphabet Inc.' },
  { symbol: 'META',  name: 'Meta Platforms Inc.' },
  { symbol: 'TSLA',  name: 'Tesla Inc.' },
  { symbol: 'AMD',   name: 'Advanced Micro Devices' },
  { symbol: 'NFLX',  name: 'Netflix Inc.' },
  { symbol: 'CRM',   name: 'Salesforce Inc.' },
  { symbol: 'ORCL',  name: 'Oracle Corp.' },
  { symbol: 'ADBE',  name: 'Adobe Inc.' },
  { symbol: 'INTC',  name: 'Intel Corp.' },
  { symbol: 'QCOM',  name: 'Qualcomm Inc.' },
  { symbol: 'MU',    name: 'Micron Technology' },
];

function EarningsRow({ symbol, name, onClick }: { symbol: string; name: string; onClick: () => void }) {
  const { data: earnings, isLoading } = useEarnings(symbol);

  if (isLoading) {
    return (
      <tr className="border-b border-white/[0.04] animate-pulse">
        <td className="px-4 py-3"><div className="shimmer h-4 w-14 rounded" /></td>
        <td className="px-4 py-3 hidden sm:table-cell"><div className="shimmer h-3 w-36 rounded" /></td>
        <td className="px-4 py-3"><div className="shimmer h-4 w-20 rounded" /></td>
        <td className="px-4 py-3 hidden md:table-cell"><div className="shimmer h-4 w-12 rounded" /></td>
        <td className="px-4 py-3 hidden lg:table-cell"><div className="shimmer h-4 w-28 rounded" /></td>
        <td className="px-4 py-3" />
      </tr>
    );
  }

  const ivCrush = earnings?.hasDate && earnings.daysUntil <= 14;
  const urgency = earnings?.hasDate
    ? earnings.daysUntil <= 7 ? 'text-red-400' : earnings.daysUntil <= 21 ? 'text-yellow-400' : 'text-white/50'
    : 'text-white/25';

  return (
    <tr className="border-b border-white/[0.04] cursor-pointer hover:bg-white/[0.03] transition-colors" onClick={onClick}>
      <td className="px-4 py-3 font-mono font-bold text-sm text-white/80">{symbol}</td>
      <td className="px-4 py-3 text-sm text-white/35 hidden sm:table-cell">{name}</td>
      <td className="px-4 py-3 text-sm text-white/70">{earnings?.hasDate ? earnings.earningsDateFmt : '—'}</td>
      <td className={cn('px-4 py-3 font-mono tabular-nums text-sm font-semibold hidden md:table-cell', urgency)}>
        {earnings?.hasDate ? `${earnings.daysUntil}d` : '—'}
      </td>
      <td className="px-4 py-3 hidden lg:table-cell">
        {earnings?.hasDate && earnings.epsEstimate !== 0 && (
          <span className="font-mono tabular-nums text-sm text-white/50">
            {earnings.epsEstimate >= 0 ? '+' : ''}{earnings.epsEstimate.toFixed(2)} EPS
          </span>
        )}
      </td>
      <td className="px-4 py-3">
        {ivCrush && (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold bg-yellow-500/[0.08] border border-yellow-500/[0.15] text-yellow-400 whitespace-nowrap">
            &#9888; IV Crush Risk
          </span>
        )}
      </td>
    </tr>
  );
}

function EarningsMobileCard({ symbol, name, onClick }: { symbol: string; name: string; onClick: () => void }) {
  const { data: earnings, isLoading } = useEarnings(symbol);

  if (isLoading) {
    return (
      <div className="bg-white/[0.03] border border-white/[0.08] rounded-2xl p-4 animate-pulse space-y-2">
        <div className="flex justify-between">
          <div className="shimmer h-4 w-14 rounded" />
          <div className="shimmer h-4 w-20 rounded" />
        </div>
        <div className="shimmer h-3 w-36 rounded" />
      </div>
    );
  }

  const ivCrush = earnings?.hasDate && earnings.daysUntil <= 14;
  const urgency = earnings?.hasDate
    ? earnings.daysUntil <= 7 ? 'text-red-400' : earnings.daysUntil <= 21 ? 'text-yellow-400' : 'text-white/50'
    : 'text-white/25';

  return (
    <button
      onClick={onClick}
      className="w-full text-left bg-white/[0.03] border border-white/[0.08] rounded-2xl p-4 space-y-2 hover:bg-white/[0.05] transition-colors active:scale-[0.98]"
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="font-mono font-bold text-sm text-white/80">{symbol}</span>
          {ivCrush && (
            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-semibold bg-yellow-500/[0.08] border border-yellow-500/[0.15] text-yellow-400">
              &#9888; IV Crush
            </span>
          )}
        </div>
        <span className={cn('font-mono tabular-nums text-sm font-semibold', urgency)}>
          {earnings?.hasDate ? `${earnings.daysUntil}d` : '—'}
        </span>
      </div>
      <div className="text-xs text-white/35">{name}</div>
      {earnings?.hasDate && (
        <div className="flex items-center justify-between text-xs">
          <span className="text-white/50">{earnings.earningsDateFmt}</span>
          {earnings.epsEstimate !== 0 && (
            <span className="font-mono tabular-nums text-white/40">
              EPS {earnings.epsEstimate >= 0 ? '+' : ''}{earnings.epsEstimate.toFixed(2)}
            </span>
          )}
        </div>
      )}
    </button>
  );
}

export default function EarningsPage() {
  const router = useRouter();
  const handleClick = (symbol: string) => router.push(`/options?symbol=${symbol}`);

  return (
    <>
      <Header title="Earnings Calendar" />
      <div className="flex-1 p-4 sm:p-6 space-y-6">
        <div>
          <h2 className="text-lg font-semibold text-white/80 mb-1">Upcoming Earnings</h2>
          <p className="text-sm text-white/35">
            Earnings dates for high-interest S&amp;P 500 stocks. Click any row to open the options
            analyzer. Stocks within 14 days of earnings carry elevated IV crush risk.
          </p>
        </div>

        <div className="hidden sm:block bg-white/[0.03] border border-white/[0.08] rounded-2xl overflow-hidden">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-white/[0.06]">
                <th className="px-4 py-3 text-[10px] font-medium uppercase tracking-wide text-white/30">Symbol</th>
                <th className="px-4 py-3 text-[10px] font-medium uppercase tracking-wide text-white/30 hidden sm:table-cell">Company</th>
                <th className="px-4 py-3 text-[10px] font-medium uppercase tracking-wide text-white/30">Earnings Date</th>
                <th className="px-4 py-3 text-[10px] font-medium uppercase tracking-wide text-white/30 hidden md:table-cell">Days Until</th>
                <th className="px-4 py-3 text-[10px] font-medium uppercase tracking-wide text-white/30 hidden lg:table-cell">EPS Est.</th>
                <th className="px-4 py-3 text-[10px] font-medium uppercase tracking-wide text-white/30">Risk</th>
              </tr>
            </thead>
            <tbody>
              {WATCHLIST.map(({ symbol, name }) => (
                <EarningsRow key={symbol} symbol={symbol} name={name} onClick={() => handleClick(symbol)} />
              ))}
            </tbody>
          </table>
        </div>

        <div className="sm:hidden space-y-3">
          {WATCHLIST.map(({ symbol, name }) => (
            <EarningsMobileCard key={symbol} symbol={symbol} name={name} onClick={() => handleClick(symbol)} />
          ))}
        </div>

        <p className="text-[11px] text-white/20 text-center">
          Earnings dates sourced from Yahoo Finance &middot; Refreshed every 30 minutes
        </p>
      </div>
    </>
  );
}
