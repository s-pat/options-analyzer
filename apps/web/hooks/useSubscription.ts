'use client';

import { useUser } from '@clerk/nextjs';
import { getTier, tierAtLeast, TIER_LIMITS, TIER_DISPLAY, type Tier } from '@/lib/tier';

export function useSubscription() {
  const { user, isLoaded } = useUser();
  const tier = getTier(user?.publicMetadata as Record<string, unknown> | undefined);

  return {
    tier,
    isLoaded,
    limits: TIER_LIMITS[tier],
    display: TIER_DISPLAY[tier],
    isPro:     tier === 'pro' || tier === 'premium',
    isPremium: tier === 'premium',
    canAccess: (required: Tier) => tierAtLeast(tier, required),
  };
}
