// Shown immediately for all (app) routes while page JS loads.
// Prevents blank screen on first visit / slow mobile connections.
export default function AppLoading() {
  return (
    <div className="min-h-screen bg-[#060608] flex items-center justify-center">
      <div className="w-8 h-8 rounded-full border-2 border-white/10 border-t-blue-500 animate-spin" />
    </div>
  );
}
