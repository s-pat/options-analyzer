import { Header } from "@/components/layout/Header";
import { MarketOverview } from "@/components/dashboard/MarketOverview";
import { SectorHeatmap } from "@/components/dashboard/SectorHeatmap";
import { TopOptions } from "@/components/dashboard/TopOptions";

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
