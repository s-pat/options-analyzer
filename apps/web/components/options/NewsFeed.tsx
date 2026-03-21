'use client';

import { ExternalLink, TrendingUp, TrendingDown, Minus, Zap, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { NewsItem, StockNews, NewsSentiment } from '@/lib/types';

// ---- Sentiment helpers ----

function sentimentColor(s: NewsSentiment) {
  if (s === 'bullish') return 'text-green-400';
  if (s === 'bearish') return 'text-red-400';
  return 'text-white/40';
}

function sentimentBg(s: NewsSentiment) {
  if (s === 'bullish') return 'bg-green-500/[0.08] border-green-500/[0.18]';
  if (s === 'bearish') return 'bg-red-500/[0.08] border-red-500/[0.18]';
  return 'bg-white/[0.03] border-white/[0.08]';
}

function SentimentIcon({ s, className }: { s: NewsSentiment; className?: string }) {
  if (s === 'bullish') return <TrendingUp className={cn('h-3 w-3', className)} />;
  if (s === 'bearish') return <TrendingDown className={cn('h-3 w-3', className)} />;
  return <Minus className={cn('h-3 w-3', className)} />;
}

function sentimentLabel(s: NewsSentiment) {
  if (s === 'bullish') return 'Bullish';
  if (s === 'bearish') return 'Bearish';
  return 'Neutral';
}

function catalystBg(catalyst: string) {
  switch (catalyst) {
    case 'earnings':    return 'bg-blue-500/10 border-blue-500/20 text-blue-400';
    case 'fda':         return 'bg-purple-500/10 border-purple-500/20 text-purple-400';
    case 'm&a':         return 'bg-yellow-500/10 border-yellow-500/20 text-yellow-400';
    case 'upgrade':     return 'bg-green-500/10 border-green-500/20 text-green-400';
    case 'downgrade':   return 'bg-red-500/10 border-red-500/20 text-red-400';
    case 'macro':       return 'bg-orange-500/10 border-orange-500/20 text-orange-400';
    default:            return '';
  }
}

function timeAgo(ts: number): string {
  const diff = Math.floor((Date.now() / 1000) - ts);
  if (diff < 60)   return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

// ---- Single news card ----

function NewsCard({ item }: { item: NewsItem }) {
  return (
    <a
      href={item.link}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(
        'group flex flex-col gap-2 rounded-xl border p-3 transition-colors hover:bg-white/[0.04] active:scale-[0.99]',
        sentimentBg(item.sentiment),
      )}
    >
      {/* Title row */}
      <div className="flex items-start gap-2">
        {/* Sentiment dot */}
        <span className={cn('mt-0.5 shrink-0', sentimentColor(item.sentiment))}>
          <SentimentIcon s={item.sentiment} className="h-3.5 w-3.5" />
        </span>
        <p className="text-[13px] leading-snug text-white/85 font-medium group-hover:text-white transition-colors line-clamp-3">
          {item.title}
        </p>
        <ExternalLink className="mt-0.5 h-3 w-3 shrink-0 text-white/20 group-hover:text-white/40 transition-colors" />
      </div>

      {/* Meta row */}
      <div className="flex flex-wrap items-center gap-1.5 pl-5">
        {/* Catalyst badge */}
        {item.catalyst && item.catalystLabel && (
          <span className={cn(
            'inline-flex items-center gap-1 rounded-md border px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide',
            catalystBg(item.catalyst),
          )}>
            <Zap className="h-2.5 w-2.5" />
            {item.catalystLabel}
          </span>
        )}

        {/* Sentiment badge */}
        <span className={cn(
          'inline-flex items-center gap-1 rounded-md border px-1.5 py-0.5 text-[10px] font-medium',
          sentimentBg(item.sentiment),
          sentimentColor(item.sentiment),
        )}>
          <SentimentIcon s={item.sentiment} />
          {sentimentLabel(item.sentiment)}
        </span>

        {/* Publisher + time */}
        <span className="ml-auto flex items-center gap-1 text-[10px] text-white/30 shrink-0">
          <Clock className="h-2.5 w-2.5" />
          {item.publisher} · {timeAgo(item.publishedAt)}
        </span>
      </div>
    </a>
  );
}

// ---- Sentiment summary bar ----

function SentimentSummary({ news }: { news: StockNews }) {
  const total = news.bullishCount + news.bearishCount + news.neutralCount;
  if (total === 0) return null;

  const bullPct = Math.round((news.bullishCount / total) * 100);
  const bearPct = Math.round((news.bearishCount / total) * 100);
  const neutPct = 100 - bullPct - bearPct;

  const overallColor = sentimentColor(news.overallSentiment);
  const overallLabel = sentimentLabel(news.overallSentiment);

  return (
    <div className="flex flex-col gap-2">
      {/* Overall label */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <span className={cn('flex items-center gap-1 text-sm font-semibold', overallColor)}>
            <SentimentIcon s={news.overallSentiment} className="h-3.5 w-3.5" />
            {overallLabel}
          </span>
          <span className="text-xs text-white/30">news sentiment</span>
        </div>
        <span className="text-[10px] text-white/25">{total} articles</span>
      </div>

      {/* Stacked bar */}
      <div className="flex h-1.5 w-full overflow-hidden rounded-full bg-white/[0.06]">
        {bullPct > 0 && (
          <div className="h-full bg-green-500/70 transition-all" style={{ width: `${bullPct}%` }} />
        )}
        {neutPct > 0 && (
          <div className="h-full bg-white/20 transition-all" style={{ width: `${neutPct}%` }} />
        )}
        {bearPct > 0 && (
          <div className="h-full bg-red-500/70 transition-all" style={{ width: `${bearPct}%` }} />
        )}
      </div>

      {/* Legend */}
      <div className="flex gap-3 text-[10px] text-white/35">
        <span className="flex items-center gap-1"><span className="h-1.5 w-1.5 rounded-full bg-green-500/70 inline-block" />{news.bullishCount} bullish</span>
        <span className="flex items-center gap-1"><span className="h-1.5 w-1.5 rounded-full bg-white/20 inline-block" />{news.neutralCount} neutral</span>
        <span className="flex items-center gap-1"><span className="h-1.5 w-1.5 rounded-full bg-red-500/70 inline-block" />{news.bearishCount} bearish</span>
      </div>
    </div>
  );
}

// ---- Skeleton loader ----

export function NewsFeedSkeleton() {
  return (
    <div className="space-y-2">
      {[...Array(4)].map((_, i) => (
        <div key={i} className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-3 animate-pulse">
          <div className="flex gap-2">
            <div className="shimmer h-3.5 w-3.5 rounded-full mt-0.5 shrink-0" />
            <div className="flex-1 space-y-1.5">
              <div className="shimmer h-3 w-full rounded" />
              <div className="shimmer h-3 w-3/4 rounded" />
              <div className="flex gap-1.5 mt-2">
                <div className="shimmer h-4 w-16 rounded" />
                <div className="shimmer h-4 w-12 rounded" />
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ---- Main NewsFeed component ----

interface NewsFeedProps {
  news: StockNews;
  /** Max number of articles to show; defaults to all */
  limit?: number;
}

export function NewsFeed({ news, limit }: NewsFeedProps) {
  const items = limit ? news.items.slice(0, limit) : news.items;

  if (items.length === 0) {
    return (
      <p className="text-sm text-white/30 text-center py-4">No recent news available.</p>
    );
  }

  return (
    <div className="space-y-3">
      <SentimentSummary news={news} />
      <div className="space-y-2">
        {items.map((item) => (
          <NewsCard key={item.uuid} item={item} />
        ))}
      </div>
    </div>
  );
}
