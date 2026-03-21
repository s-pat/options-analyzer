import { ImageResponse } from 'next/og';
import { parseContractSymbol } from '@/lib/shareUtils';
import type { OptionAnalysis, Stock } from '@/lib/types';

export const runtime = 'nodejs';
export const alt = 'Option Analysis';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

const API_BASE = process.env.API_BACKEND_URL
  ? `${process.env.API_BACKEND_URL}/api/v1`
  : 'http://localhost:8080/api/v1';

async function fetchStock(symbol: string): Promise<Stock | null> {
  try {
    const res = await fetch(`${API_BASE}/stocks/${symbol}`, { next: { revalidate: 60 } });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

async function fetchAnalysis(
  symbol: string,
  type: string,
  strike: number,
  expiration: number,
): Promise<OptionAnalysis | null> {
  try {
    const res = await fetch(
      `${API_BASE}/stocks/${symbol}/options/analyze?type=${type}&strike=${strike}&expiration=${expiration}`,
      { next: { revalidate: 120 } },
    );
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

const VERDICT_COLORS = {
  'Strong Buy': { bg: '#16330d', border: '#22c55e', text: '#4ade80' },
  Buy: { bg: '#0d2d1e', border: '#10b981', text: '#34d399' },
  Speculative: { bg: '#2d2200', border: '#eab308', text: '#facc15' },
  Pass: { bg: '#2d0d0d', border: '#ef4444', text: '#f87171' },
} as const;

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const parsed = parseContractSymbol(slug);

  if (!parsed) {
    return new ImageResponse(
      (
        <div
          style={{
            width: '100%',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: '#060608',
            color: '#ffffff',
            fontSize: 32,
          }}
        >
          OptionLabs
        </div>
      ),
      size,
    );
  }

  const { symbol, optionType, strike, expirationDate, expirationTimestamp } = parsed;

  const [stock, analysis] = await Promise.all([
    fetchStock(symbol),
    fetchAnalysis(symbol, optionType, strike, expirationTimestamp),
  ]);

  const expStr = expirationDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  const typeLabel = optionType === 'call' ? 'CALL' : 'PUT';
  const isCall = optionType === 'call';

  const verdictKey = (analysis?.verdict ?? 'Pass') as keyof typeof VERDICT_COLORS;
  const vc = VERDICT_COLORS[verdictKey] ?? VERDICT_COLORS['Pass'];
  const score = analysis?.score?.toFixed(0) ?? '—';

  const stockPrice = stock?.price?.toFixed(2) ?? '—';
  const changePercent = stock?.changePercent;
  const positive = (changePercent ?? 0) >= 0;
  const changeStr = changePercent != null
    ? `${positive ? '+' : ''}${changePercent.toFixed(2)}%`
    : '';

  const thesis = analysis?.thesis?.[0] ?? '';

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          background: '#060608',
          fontFamily: 'sans-serif',
          padding: '48px',
          position: 'relative',
        }}
      >
        {/* Background glow */}
        <div
          style={{
            position: 'absolute',
            top: -100,
            right: -100,
            width: 400,
            height: 400,
            borderRadius: '50%',
            background: isCall
              ? 'radial-gradient(circle, rgba(34,197,94,0.12) 0%, transparent 70%)'
              : 'radial-gradient(circle, rgba(239,68,68,0.12) 0%, transparent 70%)',
          }}
        />

        {/* Top bar — branding */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 40 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: 10,
                background: 'rgba(59,130,246,0.2)',
                border: '1px solid rgba(59,130,246,0.3)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#60a5fa',
                fontSize: 18,
                fontWeight: 700,
              }}
            >
              OL
            </div>
            <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: 16, fontWeight: 600 }}>
              OptionLabs
            </span>
          </div>
          <span style={{ color: 'rgba(255,255,255,0.25)', fontSize: 14 }}>optionslab.io</span>
        </div>

        {/* Main content */}
        <div style={{ display: 'flex', flex: 1, gap: 48 }}>

          {/* Left column */}
          <div style={{ display: 'flex', flexDirection: 'column', flex: 1, gap: 20 }}>

            {/* Stock row */}
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: 16 }}>
              <div>
                <div style={{ fontSize: 52, fontWeight: 800, color: '#ffffff', lineHeight: 1 }}>
                  ${symbol}
                </div>
                {stock?.name && (
                  <div style={{ fontSize: 16, color: 'rgba(255,255,255,0.35)', marginTop: 4 }}>
                    {stock.name}
                  </div>
                )}
              </div>
              {stockPrice !== '—' && (
                <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8, marginBottom: 4 }}>
                  <span style={{ fontSize: 28, fontWeight: 700, color: 'rgba(255,255,255,0.8)', fontFamily: 'monospace' }}>
                    ${stockPrice}
                  </span>
                  {changeStr && (
                    <span style={{ fontSize: 16, fontWeight: 600, color: positive ? '#4ade80' : '#f87171', marginBottom: 2 }}>
                      {changeStr}
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* Option description */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div
                style={{
                  padding: '6px 14px',
                  borderRadius: 8,
                  background: isCall ? 'rgba(34,197,94,0.12)' : 'rgba(239,68,68,0.12)',
                  border: `1px solid ${isCall ? 'rgba(34,197,94,0.3)' : 'rgba(239,68,68,0.3)'}`,
                  color: isCall ? '#4ade80' : '#f87171',
                  fontSize: 15,
                  fontWeight: 800,
                  letterSpacing: '0.08em',
                }}
              >
                {typeLabel}
              </div>
              <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: 15 }}>
                ${strike % 1 === 0 ? strike.toFixed(0) : strike.toFixed(2)} · Expires {expStr}
              </span>
            </div>

            {/* Thesis */}
            {thesis && (
              <div
                style={{
                  padding: '16px 20px',
                  borderRadius: 12,
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid rgba(255,255,255,0.07)',
                  color: 'rgba(255,255,255,0.65)',
                  fontSize: 16,
                  lineHeight: 1.5,
                  maxWidth: 560,
                }}
              >
                &ldquo;{thesis}&rdquo;
              </div>
            )}

          </div>

          {/* Right column — score */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 16,
              minWidth: 200,
            }}
          >
            {/* Verdict badge */}
            <div
              style={{
                padding: '8px 20px',
                borderRadius: 10,
                background: vc.bg,
                border: `1px solid ${vc.border}`,
                color: vc.text,
                fontSize: 16,
                fontWeight: 800,
                letterSpacing: '0.04em',
              }}
            >
              {verdictKey}
            </div>

            {/* Score circle */}
            <div
              style={{
                width: 120,
                height: 120,
                borderRadius: '50%',
                background: vc.bg,
                border: `2px solid ${vc.border}`,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <span style={{ fontSize: 40, fontWeight: 800, color: vc.text, fontFamily: 'monospace', lineHeight: 1 }}>
                {score}
              </span>
              <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)', marginTop: 2 }}>/100</span>
            </div>

            {/* IV Rank */}
            {stock?.ivRank != null && (
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)', marginBottom: 2 }}>IV RANK</div>
                <div style={{ fontSize: 22, fontWeight: 700, color: 'rgba(255,255,255,0.7)', fontFamily: 'monospace' }}>
                  {stock.ivRank.toFixed(0)}
                </div>
              </div>
            )}
          </div>

        </div>

        {/* Bottom bar */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginTop: 32,
            paddingTop: 16,
            borderTop: '1px solid rgba(255,255,255,0.06)',
          }}
        >
          <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.2)' }}>
            Not financial advice · Always do your own research
          </span>
          <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.2)' }}>
            Powered by OptionLabs
          </span>
        </div>
      </div>
    ),
    size,
  );
}
