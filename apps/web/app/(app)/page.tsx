import { Suspense } from "react";
import dynamic from "next/dynamic";
import { Header } from "@/components/layout/Header";

// Dynamic imports split each dashboard section into its own JS chunk that
// loads in parallel after the shell renders. Combined with <Suspense>,
// React uses Selective Hydration — it can hydrate whichever section the
// user taps first without waiting for the others, keeping FID low.
// ssr: false is not allowed in Server Components — omitting it means Next.js
// SSR's the loading skeleton, then hydrates with live data on the client.
const MarketOverview = dynamic(() =>
  import("@/components/dashboard/MarketOverview").then((m) => ({ default: m.MarketOverview }))
);

const SectorHeatmap = dynamic(() =>
  import("@/components/dashboard/SectorHeatmap").then((m) => ({ default: m.SectorHeatmap }))
);

const TopOptions = dynamic(() =>
  import("@/components/dashboard/TopOptions").then((m) => ({ default: m.TopOptions }))
);

// Skeleton shapes that match each section's rough dimensions.
// Shown immediately while JS chunks download — no layout shift.
function CardSkeleton({ rows = 3, height = "h-28" }: { rows?: number; height?: string }) {
  return (
    <div className="rounded-2xl border border-white/[0.08] bg-white/[0.03] p-5 space-y-3">
      <div className="h-4 w-32 rounded bg-white/[0.06] animate-pulse" />
      <div className={`${height} rounded-xl bg-white/[0.04] animate-pulse`} />
      {rows > 1 && Array.from({ length: rows - 1 }).map((_, i) => (
        <div key={i} className="h-3 rounded bg-white/[0.05] animate-pulse" style={{ width: `${70 - i * 10}%` }} />
      ))}
    </div>
  );
}

export default function DashboardPage() {
  return (
    <>
      <Header title="Dashboard" />
      <div className="flex-1 p-6 space-y-6">
        <Suspense fallback={<CardSkeleton height="h-32" rows={2} />}>
          <MarketOverview />
        </Suspense>

        <Suspense fallback={<CardSkeleton height="h-40" rows={1} />}>
          <SectorHeatmap />
        </Suspense>

        <Suspense fallback={<CardSkeleton height="h-64" rows={1} />}>
          <TopOptions />
        </Suspense>
      </div>
    </>
  );
}
