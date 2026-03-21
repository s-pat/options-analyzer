// Shown immediately while the sign-in page JS downloads on slow connections.
// Without this, mobile users on first visit see a blank screen for several
// seconds before Clerk's <SignIn> component can render.
export default function SignInLoading() {
  return (
    <div className="min-h-screen bg-[#060608] flex items-center justify-center">
      <div className="w-8 h-8 rounded-full border-2 border-white/10 border-t-blue-500 animate-spin" />
    </div>
  );
}
