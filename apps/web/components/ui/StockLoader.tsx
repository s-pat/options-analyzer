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

// Inline spin — avoids depending on a Tailwind `animate-spin` class
const SPIN = 'spin 0.9s linear infinite';

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
      <div className="flex items-center gap-2.5">
        <svg width="48" height="18" viewBox="0 0 130 50" fill="none" aria-hidden="true">
          <path d={AREA}  fill="#3B82F6" fillOpacity="0.12" style={{ animation: FILL_LOOP }} />
          <path d={LINE}  stroke="#3B82F6" strokeWidth="3.5"
            strokeLinecap="round" strokeLinejoin="round"
            style={{ strokeDasharray: PATH_LEN, animation: LOOP }} />
          <circle cx={DOT[0]} cy={DOT[1]} r="5.5" fill="#3B82F6" style={{ animation: DOT_LOOP }} />
        </svg>
        <span
          key={label}
          className="text-sm text-white/50"
          style={{ animation: 'stock-msg-in 0.35s ease both' }}
        >
          {label}
        </span>
      </div>
    );
  }

  /* ── Centered column (md) ─────────────────────────────────────────────── */
  return (
    <div className="flex flex-col items-center gap-4">
      {/* Chart animation */}
      <svg width="120" height="46" viewBox="0 0 130 50" fill="none" aria-hidden="true">
        <path d={AREA}  fill="#3B82F6" fillOpacity="0.12" style={{ animation: FILL_LOOP }} />
        <path d={LINE}  stroke="#3B82F6" strokeWidth="2.5"
          strokeLinecap="round" strokeLinejoin="round"
          style={{ strokeDasharray: PATH_LEN, animation: LOOP }} />
        <circle cx={DOT[0]} cy={DOT[1]} r="4" fill="#3B82F6" style={{ animation: DOT_LOOP }} />
      </svg>

      {/* Spinner ring */}
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true"
        style={{ animation: SPIN }}>
        <circle cx="10" cy="10" r="8" stroke="rgba(255,255,255,0.08)" strokeWidth="2" />
        <path d="M10 2 A8 8 0 0 1 18 10" stroke="#3B82F6" strokeWidth="2"
          strokeLinecap="round" />
      </svg>

      {/* Message */}
      <div className="text-center space-y-1">
        <p
          key={label}
          className="text-sm text-white/50 font-medium"
          style={{ animation: 'stock-msg-in 0.35s ease both' }}
        >
          {label}
        </p>
        {subtitle && (
          <p className="text-xs text-white/30">{subtitle}</p>
        )}
      </div>
    </div>
  );
}

