import { test, expect } from '@playwright/test';

const API = 'http://localhost:8080';

// Direct API tests — no browser needed, fast
test.describe('Go API', () => {
  test('health check', async ({ request }) => {
    const res = await request.get(`${API}/health`);
    expect(res.ok()).toBe(true);
    const body = await res.json();
    expect(body.status).toBe('ok');
    expect(typeof body.version).toBe('string');
  });

  test('market overview returns indices and sectors', async ({ request }) => {
    const res = await request.get(`${API}/api/v1/market/overview`);
    expect(res.ok()).toBe(true);
    const body = await res.json();
    expect(Array.isArray(body.indices)).toBe(true);
    expect(Array.isArray(body.sectors)).toBe(true);
    expect(body.indices.length).toBeGreaterThan(0);
    expect(body.sectors.length).toBeGreaterThan(0);

    // Validate index shape
    const idx = body.indices[0];
    expect(typeof idx.symbol).toBe('string');
    expect(typeof idx.price).toBe('number');
    expect(['bullish', 'bearish', 'neutral']).toContain(idx.trend);
  });

  test('stocks list returns S&P 500 data', async ({ request }) => {
    test.setTimeout(60_000);
    const res = await request.get(`${API}/api/v1/stocks`);
    expect(res.ok()).toBe(true);
    const body = await res.json();
    expect(Array.isArray(body.stocks)).toBe(true);
    expect(body.stocks.length).toBeGreaterThan(0);
    expect(typeof body.total).toBe('number');
  });

  test('single stock lookup', async ({ request }) => {
    test.setTimeout(30_000);
    const res = await request.get(`${API}/api/v1/stocks/AAPL`);
    expect(res.ok()).toBe(true);
    const body = await res.json();
    expect(body.symbol).toBe('AAPL');
    expect(typeof body.price).toBe('number');
    expect(body.price).toBeGreaterThan(0);
  });

  test("today's opportunities endpoint responds", async ({ request }) => {
    test.setTimeout(60_000);
    const res = await request.get(`${API}/api/v1/options/today`);
    expect(res.ok()).toBe(true);
    const body = await res.json();
    expect(typeof body.generatedAt).toBe('string');
    expect(Array.isArray(body.bands)).toBe(true);
  });

  test('CORS allows frontend origin', async ({ request }) => {
    const res = await request.get(`${API}/health`, {
      headers: { Origin: 'http://localhost:3000' },
    });
    expect(res.ok()).toBe(true);
    const allow = res.headers()['access-control-allow-origin'];
    expect(allow).toBe('http://localhost:3000');
  });

  test('rejects unknown CORS origin', async ({ request }) => {
    const res = await request.fetch(`${API}/api/v1/market/overview`, {
      method: 'OPTIONS',
      headers: {
        Origin: 'https://evil.com',
        'Access-Control-Request-Method': 'GET',
      },
    });
    const allow = res.headers()['access-control-allow-origin'] ?? '';
    expect(allow).not.toContain('evil.com');
  });
});
