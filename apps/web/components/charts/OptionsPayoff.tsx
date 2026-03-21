'use client';

import { useMemo } from 'react';
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
import type { OptionContract } from '@/lib/types';

interface OptionsPayoffProps {
  option: OptionContract;
  stockPrice: number;
}

export function OptionsPayoff({ option, stockPrice }: OptionsPayoffProps) {
  const { strike, ask, optionType } = option;
  const premium = ask;

  const { data, breakeven } = useMemo(() => {
    const range = Math.max(strike * 0.3, 30);
    const steps = 50;
    const pts = Array.from({ length: steps + 1 }, (_, i) => {
      const price = strike - range + (i * 2 * range) / steps;
      const intrinsic = optionType === 'call'
        ? Math.max(price - strike, 0)
        : Math.max(strike - price, 0);
      return { price: parseFloat(price.toFixed(2)), pnl: parseFloat((intrinsic - premium).toFixed(4)) };
    });
    return {
      data: pts,
      breakeven: optionType === 'call' ? strike + premium : strike - premium,
    };
  }, [strike, premium, optionType]);

  return (
    <div className="h-48 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 8, right: 16, bottom: 8, left: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
          <XAxis dataKey="price" tick={{ fontSize: 10, fill: '#94a3b8' }} tickCount={7} />
          <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} />
          <Tooltip
            formatter={(v) => [`$${Number(v).toFixed(2)}`, 'P&L']}
            labelFormatter={(l) => `Stock @ $${l}`}
            contentStyle={{ background: '#0f172a', border: '1px solid #334155', borderRadius: 6, fontSize: 12 }}
          />
          <ReferenceLine y={0} stroke="#475569" />
          <ReferenceLine x={stockPrice} stroke="#3b82f6" strokeDasharray="4 2" label={{ value: 'Now', fill: '#3b82f6', fontSize: 10 }} />
          <ReferenceLine x={breakeven} stroke="#f59e0b" strokeDasharray="4 2" label={{ value: 'B/E', fill: '#f59e0b', fontSize: 10 }} />
          <Line
            type="monotone"
            dataKey="pnl"
            stroke="#22c55e"
            dot={false}
            strokeWidth={2}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
