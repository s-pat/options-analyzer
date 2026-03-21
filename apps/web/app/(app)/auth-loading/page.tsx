'use client';

import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { preload } from 'swr';
import { Activity } from 'lucide-react';
import { StockLoader } from '@/components/ui/StockLoader';
import { getMarketOverview, getRecommendations } from '@/lib/api';

// Hard cap — never block the user for more than 3s regardless of API speed.
// SWR will retry any incomplete fetches on the dashboard itself.
const MAX_WAIT_MS = 3_000;
// Always show the loader for at least this long so the screen is never a flash.
const MIN_DISPLAY_MS = 1_500;

export default function AuthLoadingPage() {
  const router = useRouter();
  const navigated = useRef(false);

  useEffect(() => {
    function goToDashboard() {
      if (navigated.current) return;
      navigated.current = true;
      // Tell middleware this session has been through auth-loading so it won't
      // redirect back here on the next full-page load of the dashboard.
      document.cookie = '_al=1; path=/; max-age=86400; samesite=lax';
      router.replace('/');
    }

    // Hard timeout — never trap the user if APIs are slow
    const timeout = setTimeout(goToDashboard, MAX_WAIT_MS);

    // Minimum display so the loading screen is always visible on fast connections
    const minDelay = new Promise<void>((resolve) => setTimeout(resolve, MIN_DISPLAY_MS));

    // Warm the SWR cache; navigate once both data and min time are satisfied
    Promise.all([
      preload('market/overview', getMarketOverview),
      preload('options/recommendations/20', () => getRecommendations(20)),
      // Kick off dashboard JS chunk downloads while the loader is visible
      import('@/components/dashboard/MarketOverview'),
      import('@/components/dashboard/SectorHeatmap'),
      import('@/components/dashboard/TopOptions'),
      minDelay,
    ])
      .then(goToDashboard)
      .catch(goToDashboard);

    return () => clearTimeout(timeout);
  }, [router]);

  return (
    <div className="min-h-dvh bg-[#060608] flex flex-col items-center justify-center gap-8">
      {/* Ambient glows — hidden on mobile, scaled on tablet */}
      <div className="fixed top-0 left-1/2 -translate-x-1/2 bg-blue-600/7 rounded-full pointer-events-none hidden sm:block sm:w-[400px] sm:h-[250px] sm:blur-[80px] lg:w-[700px] lg:h-[450px] lg:blur-[140px]" />
      <div className="fixed bottom-0 right-1/4 bg-violet-600/5 rounded-full pointer-events-none hidden sm:block sm:w-[200px] sm:h-[150px] sm:blur-[60px] lg:w-[400px] lg:h-[300px] lg:blur-[120px]" />

      {/* Logo */}
      <div className="flex items-center gap-2.5">
        <div className="w-9 h-9 rounded-xl bg-blue-500/20 border border-blue-500/30 flex items-center justify-center">
          <Activity className="h-5 w-5 text-blue-400" />
        </div>
        <span className="font-semibold text-xl tracking-tight text-white">OptionsLab</span>
      </div>

      {/* Animated loader with rotating messages */}
      <StockLoader size="md" subtitle="Preparing your dashboard…" />
    </div>
  );
}
