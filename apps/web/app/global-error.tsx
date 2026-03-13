'use client';

import { useEffect } from 'react';
import * as Sentry from '@sentry/nextjs';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface GlobalErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

// global-error replaces the root layout entirely — must include <html>/<body>
export default function GlobalError({ error, reset }: GlobalErrorProps) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <html lang="en" className="dark">
      <body
        style={{
          margin: 0,
          minHeight: '100dvh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#060608',
          fontFamily: 'system-ui, sans-serif',
          color: 'rgba(255,255,255,0.8)',
          textAlign: 'center',
          padding: '2rem',
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
          {/* Icon */}
          <div style={{
            width: 48, height: 48, borderRadius: 14,
            background: 'rgba(239,68,68,0.1)',
            border: '1px solid rgba(239,68,68,0.2)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <AlertTriangle style={{ width: 22, height: 22, color: '#f87171' }} />
          </div>

          <p style={{ fontSize: 16, fontWeight: 600, margin: 0 }}>Critical error</p>
          <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.35)', margin: 0, maxWidth: 280, lineHeight: 1.6 }}>
            The app encountered a critical error. Please refresh to continue.
          </p>

          {error.digest && (
            <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.15)', fontFamily: 'monospace', margin: 0 }}>
              ref: {error.digest}
            </p>
          )}

          <button
            onClick={reset}
            style={{
              marginTop: 8,
              display: 'flex', alignItems: 'center', gap: 8,
              padding: '10px 18px',
              borderRadius: 12,
              background: 'rgba(59,130,246,0.12)',
              border: '1px solid rgba(59,130,246,0.2)',
              color: '#60a5fa',
              fontSize: 14, fontWeight: 500,
              cursor: 'pointer',
            }}
          >
            <RefreshCw style={{ width: 14, height: 14 }} />
            Reload
          </button>
        </div>
      </body>
    </html>
  );
}
