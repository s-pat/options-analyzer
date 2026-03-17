/** Subscription tier utilities shared across client and server code. */

export type Tier = 'free' | 'pro' | 'premium';

/** Extract the tier from Clerk publicMetadata (safe for client + server). */
export function getTier(metadata: Record<string, unknown> | null | undefined): Tier {
  const t = metadata?.tier;
  if (t === 'premium') return 'premium';
  if (t === 'pro') return 'pro';
  return 'free';
}

/** Returns true if `actual` satisfies `required`. */
export function tierAtLeast(actual: Tier, required: Tier): boolean {
  const rank: Record<Tier, number> = { free: 0, pro: 1, premium: 2 };
  return rank[actual] >= rank[required];
}

export const TIER_LIMITS = {
  free:    { screenerRows: 20,       todayPicks: 3,         backtestYears: 0, greeks: false },
  pro:     { screenerRows: Infinity, todayPicks: Infinity,  backtestYears: 1, greeks: true  },
  premium: { screenerRows: Infinity, todayPicks: Infinity,  backtestYears: 5, greeks: true  },
} as const;

export const STRIPE_PRICE_IDS: Record<'pro' | 'premium', { monthly: string; annual: string }> = {
  pro: {
    monthly: process.env.NEXT_PUBLIC_STRIPE_PRO_MONTHLY_PRICE_ID ?? 'price_pro_monthly',
    annual:  process.env.NEXT_PUBLIC_STRIPE_PRO_ANNUAL_PRICE_ID  ?? 'price_pro_annual',
  },
  premium: {
    monthly: process.env.NEXT_PUBLIC_STRIPE_PREMIUM_MONTHLY_PRICE_ID ?? 'price_premium_monthly',
    annual:  process.env.NEXT_PUBLIC_STRIPE_PREMIUM_ANNUAL_PRICE_ID  ?? 'price_premium_annual',
  },
};

export const TIER_DISPLAY: Record<Tier, { label: string; color: string; price: string }> = {
  free:    { label: 'Free',    color: 'text-white/50',   price: '$0/mo'   },
  pro:     { label: 'Pro',     color: 'text-blue-400',   price: '$19/mo'  },
  premium: { label: 'Premium', color: 'text-violet-400', price: '$49/mo'  },
};
