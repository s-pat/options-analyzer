'use client';

import { useRouter } from 'next/navigation';
import { Lock, Zap, ChevronRight } from 'lucide-react';
import { useSubscription } from '@/hooks/useSubscription';
import type { Tier } from '@/lib/tier';
import { cn } from '@/lib/utils';

interface UpgradeGateProps {
  /** Minimum tier required to see the gated content. */
  required: Tier;
  /** Short name of the locked feature — shown in the CTA. */
  feature: string;
  /** Optional detail line shown under the feature name. */
  description?: string;
  /** Content to blur/replace when tier is insufficient. */
  children: React.ReactNode;
  /** Render a full-page overlay instead of the default inline blur gate. */
  fullPage?: boolean;
}

/** Blurred overlay with upgrade CTA shown when the user's tier is below `required`. */
export function UpgradeGate({ required, feature, description, children, fullPage }: UpgradeGateProps) {
  const { canAccess, isLoaded } = useSubscription();
  const router = useRouter();

  // While Clerk loads, render children normally (avoids flash of locked state).
  if (!isLoaded || canAccess(required)) {
    return <>{children}</>;
  }

  const tierLabel = required === 'pro' ? 'Pro' : 'Premium';

  if (fullPage) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-6 py-16">
        <div className="w-14 h-14 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center mb-5">
          <Lock className="w-7 h-7 text-blue-400" />
        </div>
        <h2 className="text-xl font-bold text-white mb-2">{feature}</h2>
        {description && <p className="text-sm text-white/45 max-w-xs mb-6 leading-relaxed">{description}</p>}
        <p className="text-xs text-white/30 mb-6">Requires {tierLabel} plan or above</p>
        <button
          onClick={() => router.push('/pricing')}
          className="flex items-center gap-2 bg-blue-500 hover:bg-blue-400 text-white font-semibold text-sm px-5 py-2.5 rounded-xl transition-colors"
        >
          <Zap className="w-4 h-4" />
          Upgrade to {tierLabel}
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    );
  }

  return (
    <div className="relative">
      {/* Blurred children */}
      <div className="pointer-events-none select-none blur-sm opacity-40 saturate-0">
        {children}
      </div>

      {/* Overlay */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="mx-auto max-w-xs text-center bg-[#060608]/90 border border-white/[0.1] rounded-2xl px-6 py-5 backdrop-blur-sm shadow-xl">
          <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 mx-auto mb-3">
            <Lock className="w-5 h-5 text-blue-400" />
          </div>
          <p className="text-sm font-semibold text-white mb-1">{feature}</p>
          {description && <p className="text-xs text-white/40 mb-3 leading-relaxed">{description}</p>}
          <button
            onClick={() => router.push('/pricing')}
            className={cn(
              'flex items-center gap-1.5 mx-auto text-xs font-semibold px-4 py-2 rounded-lg transition-colors',
              'bg-blue-500 hover:bg-blue-400 text-white',
            )}
          >
            <Zap className="w-3.5 h-3.5" />
            Upgrade to {tierLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

/** Inline "upgrade" nudge strip — less obtrusive than UpgradeGate. */
export function UpgradeBanner({ required, feature }: { required: Tier; feature: string }) {
  const { canAccess, isLoaded } = useSubscription();
  const router = useRouter();

  if (!isLoaded || canAccess(required)) return null;

  const tierLabel = required === 'pro' ? 'Pro' : 'Premium';

  return (
    <div className="flex items-center justify-between gap-3 rounded-xl border border-blue-500/20 bg-blue-500/[0.05] px-4 py-3">
      <div className="flex items-center gap-2.5">
        <Lock className="w-4 h-4 text-blue-400 shrink-0" />
        <p className="text-sm text-white/70">
          <span className="font-medium text-white">{feature}</span> is available on {tierLabel}+
        </p>
      </div>
      <button
        onClick={() => router.push('/pricing')}
        className="flex items-center gap-1 text-xs font-semibold text-blue-400 hover:text-blue-300 transition-colors shrink-0"
      >
        Upgrade <ChevronRight className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}
