'use client';

import { useEffect, useState } from 'react';

// Upward-trending zigzag — simulates a rising stock
const PTS: [number, number][] = [
  [0, 40], [20, 30], [35, 35], [55, 15], [70, 22], [90, 8], [110, 18], [130, 5],
];
const LINE     = PTS.map(([x, y], i) => `${i === 0 ? 'M' : 'L'} ${x} ${y}`).join(' ');
const AREA     = `${LINE} L 130 50 L 0 50 Z`;
const PATH_LEN = 160;
const DOT      = PTS[PTS.length - 1];

const LOOP      = 'stock-line 3s ease-in-out infinite';
const FILL_LOOP = 'stock-fill 3s ease-in-out infinite';
const DOT_LOOP  = 'stock-dot  3s ease-in-out infinite';

const MESSAGES = [
  'Fetching market data…',
  'Scanning the tape…',
  'Crunching the numbers…',
  'Running the Greeks…',
  'Checking the chain…',
  'Reading the market…',
];

interface StockLoaderProps {
  /** Override the rotating message with a fixed one */
  message?: string;
  /** Optional smaller line below the message (md size only) */
  subtitle?: string;
  /** sm = inline row; md = centered column (default) */
  size?: 'sm' | 'md';
}

export function StockLoader({ message, subtitle, size = 'md' }: StockLoaderProps) {
  const [idx, setIdx] = useState(0);

  useEffect(() => {
    if (message) return;
    const id = setInterval(() => setIdx((i) => (i + 1) % MESSAGES.length), 2500);
    return () => clearInterval(id);
  }, [message]);

  const label = message ?? MESSAGES[idx];

  /* ── Inline (sm) ─────────────────────────────────────────────────────── */
  if (size === 'sm') {
    return (
      <div className="flex items-center gap-2">
        {/* Tiny ambient chart */}
        <svg width="36" height="13" viewBox="0 0 130 50" fill="none" aria-hidden="true">
          <path d={AREA} fill="#3B82F6" fillOpacity="0.07" style={{ animation: FILL_LOOP }} />
          <path d={LINE} stroke="#3B82F6" strokeWidth="3.5"
            strokeLinecap="round" strokeLinejoin="round"
            strokeOpacity="0.45"
            style={{ strokeDasharray: PATH_LEN, animation: LOOP }} />
          <circle cx={DOT[0]} cy={DOT[1]} r="5.5" fill="#3B82F6" fillOpacity="0.75"
            style={{ animation: DOT_LOOP }} />
        </svg>
        <span
          key={label}
          className="text-xs text-white/28 font-medium"
          style={{ animation: 'stock-msg-in 0.35s ease both' }}
        >
          {label}
        </span>
      </div>
    );
  }

  /* ── Centered column (md) ─────────────────────────────────────────────── */
  return (
    <div className="flex flex-col items-center gap-3">
      {/* Ambient stock line — the animation itself is the loading signal */}
      <svg width="92" height="34" viewBox="0 0 130 50" fill="none" aria-hidden="true">
        <path d={AREA} fill="#3B82F6" fillOpacity="0.05" style={{ animation: FILL_LOOP }} />
        <path d={LINE} stroke="#3B82F6" strokeWidth="2.5"
          strokeLinecap="round" strokeLinejoin="round"
          strokeOpacity="0.4"
          style={{ strokeDasharray: PATH_LEN, animation: LOOP }} />
        <circle cx={DOT[0]} cy={DOT[1]} r="4" fill="#3B82F6" fillOpacity="0.75"
          style={{ animation: DOT_LOOP }} />
      </svg>

      {/* Message — ambient, part of the surface */}
      <div className="text-center space-y-0.5">
        <p
          key={label}
          className="text-[11px] text-white/28 font-medium tracking-wide"
          style={{ animation: 'stock-msg-in 0.35s ease both' }}
        >
          {label}
        </p>
        {subtitle && (
          <p className="text-[10px] text-white/18">{subtitle}</p>
        )}
      </div>
    </div>
  );
}
