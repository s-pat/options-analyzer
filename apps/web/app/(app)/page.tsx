import dynamic from "next/dynamic";
import { Header } from "@/components/layout/Header";

const skeleton = (h: string) => (
  <div className={`${h} rounded-2xl bg-white/[0.03] border border-white/[0.08] animate-pulse`} />
);

const MarketOverview = dynamic(
  () => import("@/components/dashboard/MarketOverview").then((m) => m.MarketOverview),
  { loading: () => skeleton("h-48") },
);

const SectorHeatmap = dynamic(
  () => import("@/components/dashboard/SectorHeatmap").then((m) => m.SectorHeatmap),
  { loading: () => skeleton("h-64") },
);

const TopOptions = dynamic(
  () => import("@/components/dashboard/TopOptions").then((m) => m.TopOptions),
  { loading: () => skeleton("h-96") },
);

export default function DashboardPage() {
  return (
    <>
      <Header title="Dashboard" />
      <div className="flex-1 p-6 space-y-6">
        <MarketOverview />
        <SectorHeatmap />
        <TopOptions />
      </div>
    </>
  );
}
