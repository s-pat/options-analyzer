import Link from 'next/link';
import { SignIn } from '@clerk/nextjs';
import { Activity, ArrowLeft } from 'lucide-react';

const GRID_BG = {
  backgroundImage:
    'linear-gradient(to right, rgba(255,255,255,0.025) 1px, transparent 1px),' +
    'linear-gradient(to bottom, rgba(255,255,255,0.025) 1px, transparent 1px)',
  backgroundSize: '80px 80px',
} as const;

export default function SignInPage() {
  return (
    <div className="min-h-screen bg-[#060608] text-white flex items-center justify-center p-5">
      {/* Grid background */}
      <div className="fixed inset-0 pointer-events-none" style={GRID_BG} />

      {/* Ambient glows */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[450px] bg-blue-600/7 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-[400px] h-[300px] bg-violet-600/5 rounded-full blur-[120px] pointer-events-none" />

      <div
        className="relative w-full max-w-md"
        style={{ animation: 'fade-in-up 0.5s ease both' }}
      >
        {/* Back link */}
        <Link
          href="/landing"
          className="inline-flex items-center gap-1.5 text-xs text-white/35 hover:text-white/70 transition-colors mb-8 group"
        >
          <ArrowLeft className="h-3 w-3 group-hover:-translate-x-0.5 transition-transform" />
          Back to home
        </Link>

        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="flex items-center gap-2.5 mb-3">
            <div className="w-8 h-8 rounded-lg bg-blue-500/20 border border-blue-500/30 flex items-center justify-center">
              <Activity className="h-5 w-5 text-blue-400" />
            </div>
            <span className="font-semibold text-xl tracking-tight">OptionsLab</span>
          </div>
          <span className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
            Private Beta
          </span>
        </div>

        {/* Clerk Sign-In */}
        <div className="flex justify-center">
          <SignIn
            appearance={{
              elements: {
                rootBox: 'w-full',
                cardBox: 'w-full',
              },
            }}
          />
        </div>

        {/* Footer */}
        <p className="text-xs text-white/20 text-center mt-6">
          &copy; {new Date().getFullYear()} OptionsLab &middot; For informational purposes only
        </p>
      </div>
    </div>
  );
}
