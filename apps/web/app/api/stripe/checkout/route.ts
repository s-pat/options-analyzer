import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { auth, clerkClient } from '@clerk/nextjs/server';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-02-24.acacia',
});

const PRICE_IDS: Record<string, string> = {
  pro_monthly:     process.env.STRIPE_PRO_MONTHLY_PRICE_ID!,
  pro_annual:      process.env.STRIPE_PRO_ANNUAL_PRICE_ID!,
  premium_monthly: process.env.STRIPE_PREMIUM_MONTHLY_PRICE_ID!,
  premium_annual:  process.env.STRIPE_PREMIUM_ANNUAL_PRICE_ID!,
};

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json() as { plan: string; billing?: string };
  const { plan, billing = 'monthly' } = body;

  const priceKey = `${plan}_${billing}`;
  const priceId = PRICE_IDS[priceKey];
  if (!priceId) {
    return NextResponse.json({ error: `Unknown plan: ${priceKey}` }, { status: 400 });
  }

  // Retrieve (or create) the Stripe customer ID stored in Clerk metadata.
  const clerk = await clerkClient();
  const user = await clerk.users.getUser(userId);
  const meta = user.privateMetadata as Record<string, string | undefined>;
  let customerId = meta.stripeCustomerId;

  if (!customerId) {
    const customer = await stripe.customers.create({
      email: user.emailAddresses[0]?.emailAddress,
      name: `${user.firstName ?? ''} ${user.lastName ?? ''}`.trim() || undefined,
      metadata: { clerkUserId: userId },
    });
    customerId = customer.id;
    await clerk.users.updateUserMetadata(userId, {
      privateMetadata: { stripeCustomerId: customerId },
    });
  }

  const origin = req.headers.get('origin') ?? process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';

  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: 'subscription',
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${origin}/account?success=true`,
    cancel_url:  `${origin}/pricing`,
    metadata: { clerkUserId: userId, plan },
    subscription_data: {
      metadata: { clerkUserId: userId, plan },
    },
    allow_promotion_codes: true,
  });

  return NextResponse.json({ url: session.url });
}
