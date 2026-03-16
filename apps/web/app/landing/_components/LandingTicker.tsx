'use client';

import { useRef, useEffect, memo, useMemo } from 'react';
import useSWR from 'swr';
import { ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { getStocks } from '@/lib/api';
import type { Stock } from '@/lib/types';

const TICKERS = [
  { symbol: 'SPY',   price: '587.42', pct: '+0.21%', up: true  },
  { symbol: 'AAPL',  price: '224.18', pct: '+1.56%', up: true  },
  { symbol: 'TSLA',  price: '281.33', pct: '-1.48%', up: false },
  { symbol: 'NVDA',  price: '952.11', pct: '+1.97%', up: true  },
  { symbol: 'QQQ',   price: '498.76', pct: '+0.43%', up: true  },
  { symbol: 'MSFT',  price: '418.92', pct: '-0.45%', up: false },
  { symbol: 'AMZN',  price: '196.45', pct: '+1.20%', up: true  },
  { symbol: 'META',  price: '524.77', pct: '+1.73%', up: true  },
  { symbol: 'GOOGL', price: '178.34', pct: '-0.51%', up: false },
  { symbol: 'GLD',   price: '231.55', pct: '+0.38%', up: true  },
  { symbol: 'IWM',   price: '215.67', pct: '+0.40%', up: true  },
  { symbol: 'VIX',   price: '14.82',  pct: '-3.21%', up: false },
];

type TickerItem = { symbol: string; price: string; pct: string; up: boolean };

function stocksToTicker(stocks: Stock[]): TickerItem[] {
  return stocks
    .slice()
    .sort((a, b) => b.volume - a.volume)
    .slice(0, 20)
    .map((s) => ({
      symbol: s.symbol,
      price: s.price.toFixed(2),
      pct: `${s.changePercent >= 0 ? '+' : ''}${s.changePercent.toFixed(2)}%`,
      up: s.changePercent >= 0,
    }));
}

const Marquee = memo(function Marquee({ items }: { items: TickerItem[] }) {
  const doubled = [...items, ...items];
  const trackRef = useRef<HTMLDivElement>(null);

  // Apply animation via ref so React never restarts it on data updates
  useEffect(() => {
    if (trackRef.current) {
      trackRef.current.style.animation = 'ticker-scroll 40s linear infinite';
    }
  }, []);

  return (
    <div className="relative overflow-hidden border-y border-white/[0.06] bg-white/[0.015] py-3">
      <div className="absolute inset-y-0 left-0 w-16 bg-gradient-to-r from-[#060608] to-transparent z-10 pointer-events-none" />
      <div className="absolute inset-y-0 right-0 w-16 bg-gradient-to-l from-[#060608] to-transparent z-10 pointer-events-none" />
      <div ref={trackRef} className="flex gap-3 w-max will-change-transform">
        {doubled.map((t, i) => (
          <div
            key={i}
            className="flex items-center gap-2.5 px-3 py-1.5 rounded-lg bg-white/[0.04] border border-white/[0.07] shrink-0"
          >
            <span className="font-mono text-xs font-bold text-white/80">{t.symbol}</span>
            <span className="font-mono text-xs text-white/55">${t.price}</span>
            <span className={`font-mono text-[11px] flex items-center gap-0.5 font-medium ${t.up ? 'text-green-400' : 'text-red-400'}`}>
              {t.up ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
              {t.pct}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
});

export function LandingTicker() {
  const { data: stocksData } = useSWR('stocks', getStocks, {
    dedupingInterval: 60_000,
    refreshInterval: 0,
    revalidateOnFocus: false,
    revalidateOnReconnect: false,
  });

  const stocks = stocksData?.stocks ?? [];
  const items = useMemo(
    () => (stocks.length > 0 ? stocksToTicker(stocks) : TICKERS),
    [stocks],
  );

  return <Marquee items={items} />;
}
