// Shown immediately while auth-loading page JS downloads.
// Prevents a blank screen during the auth-callback → auth-loading redirect.
export default function AuthLoadingFallback() {
  return (
    <div className="min-h-screen bg-[#060608] flex items-center justify-center">
      <div className="w-8 h-8 rounded-full border-2 border-white/10 border-t-blue-500 animate-spin" />
    </div>
  );
}
