import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { clerkClient } from '@clerk/nextjs/server';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-02-24.acacia',
});

const WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET!;

/** Map Stripe price IDs back to our tier names. */
function tierFromPriceId(priceId: string): 'pro' | 'premium' | null {
  const map: Record<string, 'pro' | 'premium'> = {
    [process.env.STRIPE_PRO_MONTHLY_PRICE_ID!]:     'pro',
    [process.env.STRIPE_PRO_ANNUAL_PRICE_ID!]:      'pro',
    [process.env.STRIPE_PREMIUM_MONTHLY_PRICE_ID!]: 'premium',
    [process.env.STRIPE_PREMIUM_ANNUAL_PRICE_ID!]:  'premium',
  };
  return map[priceId] ?? null;
}

async function setClerkTier(clerkUserId: string, tier: 'free' | 'pro' | 'premium') {
  const clerk = await clerkClient();
  await clerk.users.updateUserMetadata(clerkUserId, {
    publicMetadata: { approved: true, tier },
  });
}

export async function POST(req: NextRequest) {
  const rawBody = await req.text();
  const sig = req.headers.get('stripe-signature');

  if (!sig) {
    return NextResponse.json({ error: 'Missing stripe-signature' }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, sig, WEBHOOK_SECRET);
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Webhook signature verification failed';
    return NextResponse.json({ error: msg }, { status: 400 });
  }

  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session;
      const clerkUserId = session.metadata?.clerkUserId;
      const plan = session.metadata?.plan as 'pro' | 'premium' | undefined;
      if (clerkUserId && plan) {
        await setClerkTier(clerkUserId, plan);
      }
      break;
    }

    case 'customer.subscription.updated': {
      const sub = event.data.object as Stripe.Subscription;
      const clerkUserId = sub.metadata?.clerkUserId;
      if (!clerkUserId) break;

      // Derive tier from the first price item.
      const priceId = sub.items.data[0]?.price.id;
      const tier = priceId ? tierFromPriceId(priceId) : null;

      if (sub.status === 'active' && tier) {
        await setClerkTier(clerkUserId, tier);
      } else if (sub.status === 'canceled' || sub.status === 'unpaid') {
        await setClerkTier(clerkUserId, 'free');
      }
      break;
    }

    case 'customer.subscription.deleted': {
      const sub = event.data.object as Stripe.Subscription;
      const clerkUserId = sub.metadata?.clerkUserId;
      if (clerkUserId) {
        await setClerkTier(clerkUserId, 'free');
      }
      break;
    }

    // Ignore all other events.
    default:
      break;
  }

  return NextResponse.json({ received: true });
}
