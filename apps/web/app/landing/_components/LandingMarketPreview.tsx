'use client';

import Link from 'next/link';
import useSWR from 'swr';
import { ArrowUpRight, ArrowDownRight, ChevronRight } from 'lucide-react';
import { getStocks } from '@/lib/api';
import type { Stock } from '@/lib/types';

function fmtVol(v: number): string {
  if (v >= 1e9) return `${(v / 1e9).toFixed(1)}B`;
  if (v >= 1e6) return `${(v / 1e6).toFixed(1)}M`;
  if (v >= 1e3) return `${(v / 1e3).toFixed(0)}K`;
  return String(v);
}

function ordinal(n: number): string {
  const v = Math.round(n);
  const s = ['th', 'st', 'nd', 'rd'];
  const x = v % 100;
  return v + (s[(x - 20) % 10] || s[x] || s[0]);
}

function getSignal(s: Stock): 'Bullish' | 'Bearish' | 'Neutral' {
  if (s.rsi > 60 && s.changePercent > 0) return 'Bullish';
  if (s.rsi < 40 && s.changePercent < 0) return 'Bearish';
  if (s.changePercent > 1.5) return 'Bullish';
  if (s.changePercent < -1.5) return 'Bearish';
  return 'Neutral';
}

export function LandingMarketPreview() {
  const { data: stocksData, isLoading } = useSWR('stocks', getStocks, {
    dedupingInterval: 60_000,
    refreshInterval: 0,
    revalidateOnFocus: false,
    revalidateOnReconnect: false,
  });

  const stocks = stocksData?.stocks ?? [];
  const total = stocksData?.total ?? 503;
  const previewRows = stocks.length > 0
    ? [...stocks].sort((a, b) => b.ivRank - a.ivRank).slice(0, 5)
    : null;

  return (
    <section className="relative py-12 px-5 sm:px-8 overflow-hidden">
      <div className="max-w-7xl mx-auto">
        <div className="rounded-2xl border border-white/[0.08] bg-[#0a0a11] overflow-hidden">
          <div className="px-6 py-4 border-b border-white/[0.06] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold">Live Dashboard Preview</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-green-500/10 text-green-400 border border-green-500/20 font-medium">LIVE</span>
            </div>
            <Link href="/sign-in" className="text-xs text-blue-400 hover:text-blue-300 transition-colors flex items-center gap-1">
              View full dashboard <ChevronRight className="h-3 w-3" />
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-white/[0.05]">
                  {['Symbol', 'Price', 'Change', 'IV Rank', 'Volume', 'Signal'].map((h) => (
                    <th key={h} className="px-5 py-3 text-left text-[10px] text-white/30 uppercase tracking-wider font-medium">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {isLoading || !previewRows ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i} className="border-b border-white/[0.04]">
                      {Array.from({ length: 6 }).map((_, j) => (
                        <td key={j} className="px-5 py-3.5">
                          <div className="h-3 rounded bg-white/[0.06] animate-pulse" style={{ width: j === 0 ? '3rem' : j === 1 ? '4rem' : '3.5rem' }} />
                        </td>
                      ))}
                    </tr>
                  ))
                ) : (
                  previewRows.map((row) => {
                    const up = row.changePercent >= 0;
                    const signal = getSignal(row);
                    return (
                      <tr key={row.symbol} className="border-b border-white/[0.04] hover:bg-white/[0.02] transition-colors">
                        <td className="px-5 py-3.5 font-mono font-bold text-white/80">{row.symbol}</td>
                        <td className="px-5 py-3.5 font-mono text-white/70">${row.price.toFixed(2)}</td>
                        <td className={`px-5 py-3.5 font-mono font-medium ${up ? 'text-green-400' : 'text-red-400'}`}>
                          <span className="flex items-center gap-0.5">
                            {up ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                            {up ? '+' : ''}{row.changePercent.toFixed(2)}%
                          </span>
                        </td>
                        <td className="px-5 py-3.5 font-mono text-violet-400">{ordinal(row.ivRank)}</td>
                        <td className="px-5 py-3.5 font-mono text-white/40">{fmtVol(row.volume)}</td>
                        <td className="px-5 py-3.5">
                          <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium border ${
                            signal === 'Bullish'
                              ? 'bg-green-500/10 text-green-400 border-green-500/20'
                              : signal === 'Bearish'
                              ? 'bg-red-500/10 text-red-400 border-red-500/20'
                              : 'bg-white/5 text-white/40 border-white/10'
                          }`}>
                            {signal}
                          </span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          <div className="px-6 py-4 border-t border-white/[0.06] flex items-center justify-between">
            <span className="text-xs text-white/30">
              Showing top 5 of {total.toLocaleString()} tracked symbols by IV rank
            </span>
            <Link
              href="/sign-in"
              className="text-xs font-medium px-3 py-1.5 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-400 hover:bg-blue-500/20 transition-colors"
            >
              Unlock full access →
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
