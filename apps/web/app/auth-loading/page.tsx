'use client';

import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { preload } from 'swr';
import { Activity } from 'lucide-react';
import { StockLoader } from '@/components/ui/StockLoader';
import { getMarketOverview, getRecommendations } from '@/lib/api';

const MIN_DISPLAY_MS = 1800;

export default function AuthLoadingPage() {
  const router = useRouter();
  const navigated = useRef(false);

  useEffect(() => {
    const start = Date.now();

    function goToDashboard() {
      if (navigated.current) return;
      navigated.current = true;
      const elapsed = Date.now() - start;
      const remaining = Math.max(0, MIN_DISPLAY_MS - elapsed);
      setTimeout(() => router.replace('/'), remaining);
    }

    Promise.all([
      preload('market/overview', getMarketOverview),
      preload('options/recommendations/20', () => getRecommendations(20)),
    ])
      .then(goToDashboard)
      .catch(goToDashboard); // on error still proceed — SWR will retry on dashboard
  }, [router]);

  return (
    <div className="min-h-screen bg-[#060608] flex flex-col items-center justify-center gap-8">
      {/* Ambient glows */}
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[700px] h-[450px] bg-blue-600/7 rounded-full blur-[140px] pointer-events-none" />
      <div className="fixed bottom-0 right-1/4 w-[400px] h-[300px] bg-violet-600/5 rounded-full blur-[120px] pointer-events-none" />

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
