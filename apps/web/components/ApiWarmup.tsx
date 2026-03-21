'use client';

import { useEffect } from 'react';

const API = process.env.NEXT_PUBLIC_API_URL ?? '/api/v1';

/**
 * Invisible component — fires a background fetch to the backend as soon as the
 * sign-in page mounts.  On Railway's free/hobby tier, the Go service may be
 * sleeping after a period of inactivity.  Waking it here (while the user is
 * still reading the sign-in page and doing Google OAuth) means the server is
 * live and its pre-warm goroutines have finished by the time auth-loading fires
 * its SWR preloads (~10–30 s later).  Without this, the first API call from
 * auth-loading hits a cold server and blocks the dashboard for 20+ seconds.
 */
export function ApiWarmup() {
  useEffect(() => {
    fetch(`${API}/market/overview`, { priority: 'low' } as RequestInit).catch(() => {});
  }, []);

  return null;
}
