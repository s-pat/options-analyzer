'use client';

import { useEffect, useRef } from 'react';
import {
  createChart,
  ColorType,
  CandlestickSeries,
  HistogramSeries,
  LineSeries,
} from 'lightweight-charts';
import type { OHLCV } from '@/lib/types';

interface StockChartProps {
  history: OHLCV[];
  ema20?: number;
  ema50?: number;
}

export function StockChart({ history, ema20, ema50 }: StockChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current || history.length === 0) return;

    const chart = createChart(containerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: 'transparent' },
        textColor: '#94a3b8',
      },
      grid: {
        vertLines: { color: '#1e293b' },
        horzLines: { color: '#1e293b' },
      },
      crosshair: { mode: 1 },
      rightPriceScale: { borderColor: '#334155' },
      timeScale: { borderColor: '#334155', timeVisible: true },
      width: containerRef.current.clientWidth,
      height: 340,
    });

    // Candlestick
    const candleSeries = chart.addSeries(CandlestickSeries, {
      upColor: '#22c55e',
      downColor: '#ef4444',
      borderVisible: false,
      wickUpColor: '#22c55e',
      wickDownColor: '#ef4444',
    });

    const candles = history.map((bar) => ({
      time: bar.timestamp as unknown as import('lightweight-charts').Time,
      open: bar.open,
      high: bar.high,
      low: bar.low,
      close: bar.close,
    }));
    candleSeries.setData(candles);

    // Volume histogram (on separate pane)
    const volumeSeries = chart.addSeries(HistogramSeries, {
      color: '#3b82f6',
      priceFormat: { type: 'volume' },
      priceScaleId: '',
    });
    volumeSeries.priceScale().applyOptions({
      scaleMargins: { top: 0.85, bottom: 0 },
    });
    volumeSeries.setData(
      history.map((bar) => ({
        time: bar.timestamp as unknown as import('lightweight-charts').Time,
        value: bar.volume,
        color: bar.close >= bar.open ? '#22c55e40' : '#ef444440',
      })),
    );

    // EMA lines (simple horizontal indicators using last known values)
    if (ema20) {
      const ema20Series = chart.addSeries(LineSeries, {
        color: '#f59e0b',
        lineWidth: 1,
        title: 'EMA20',
      });
      ema20Series.setData(candles.map((c) => ({ time: c.time, value: ema20 })));
    }

    if (ema50) {
      const ema50Series = chart.addSeries(LineSeries, {
        color: '#8b5cf6',
        lineWidth: 1,
        title: 'EMA50',
      });
      ema50Series.setData(candles.map((c) => ({ time: c.time, value: ema50 })));
    }

    chart.timeScale().fitContent();

    const handleResize = () => {
      if (containerRef.current) {
        chart.applyOptions({ width: containerRef.current.clientWidth });
      }
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      chart.remove();
    };
  }, [history, ema20, ema50]);

  return <div ref={containerRef} className="w-full rounded-lg overflow-hidden" />;
}
