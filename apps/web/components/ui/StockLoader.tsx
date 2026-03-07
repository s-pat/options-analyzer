'use client';

import { useEffect, useState } from 'react';

// Upward-trending zigzag — looks like a stock going up
const PTS: [number, number][] = [
  [0, 40], [20, 30], [35, 35], [55, 15], [70, 22], [90, 8], [110, 18], [130, 5],
];
const LINE = PTS.map(([x, y], i) => `${i === 0 ? 'M' : 'L'} ${x} ${y}`).join(' ');
const AREA = `${LINE} L 130 50 L 0 50 Z`;
const PATH_LEN = 160; // approximate stroke-dasharray length
const DOT = PTS[PTS.length - 1];

const LOOP = 'stock-line 3s ease-in-out infinite';
const FILL_LOOP = 'stock-fill 3s ease-in-out infinite';
const DOT_LOOP = 'stock-dot 3s ease-in-out infinite';

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
  /** sm = inline horizontal row; md = centered column (default) */
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

  if (size === 'sm') {
    return (
      <div className="flex items-center gap-2.5 text-muted-foreground">
        {/* Scaled-down SVG — keeps same viewBox so animation is identical */}
        <svg
          width="52"
          height="20"
          viewBox="0 0 130 50"
          fill="none"
          aria-hidden="true"
        >
          <path d={AREA} fill="#22c55e" fillOpacity="0.12"
            style={{ animation: FILL_LOOP }} />
          <path d={LINE} stroke="#22c55e" strokeWidth="3.5"
            strokeLinecap="round" strokeLinejoin="round"
            style={{ strokeDasharray: PATH_LEN, animation: LOOP }} />
          <circle cx={DOT[0]} cy={DOT[1]} r="5.5" fill="#22c55e"
            style={{ animation: DOT_LOOP }} />
        </svg>
        <span
          key={label}
          className="text-sm"
          style={{ animation: 'stock-msg-in 0.35s ease both' }}
        >
          {label}
        </span>
      </div>
    );
  }

  // md — centered column
  return (
    <div className="flex flex-col items-center gap-3 text-muted-foreground">
      <svg
        width="130"
        height="50"
        viewBox="0 0 130 50"
        fill="none"
        aria-hidden="true"
      >
        <path d={AREA} fill="#22c55e" fillOpacity="0.12"
          style={{ animation: FILL_LOOP }} />
        <path d={LINE} stroke="#22c55e" strokeWidth="2.5"
          strokeLinecap="round" strokeLinejoin="round"
          style={{ strokeDasharray: PATH_LEN, animation: LOOP }} />
        <circle cx={DOT[0]} cy={DOT[1]} r="4" fill="#22c55e"
          style={{ animation: DOT_LOOP }} />
      </svg>
      <p
        key={label}
        className="text-sm"
        style={{ animation: 'stock-msg-in 0.35s ease both' }}
      >
        {label}
      </p>
      {subtitle && (
        <p className="text-xs -mt-1">{subtitle}</p>
      )}
    </div>
  );
}
