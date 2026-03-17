import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';

const isPublicRoute = createRouteMatcher([
  '/landing(.*)',
  '/pricing(.*)',
  '/design(.*)',
  '/sign-in(.*)',
  '/sign-up(.*)',
  '/api/waitlist',
  '/api/webhooks(.*)',
  '/api/stripe/webhook',
  '/api/v1(.*)',
]);

const isWaitlistRoute = createRouteMatcher(['/waitlist(.*)']);

export default clerkMiddleware(async (auth, req) => {
  const { userId, sessionClaims } = await auth();

  // Public routes: allow through without auth
  if (isPublicRoute(req)) {
    return NextResponse.next();
  }

  // Not signed in: redirect to landing
  if (!userId) {
    return NextResponse.redirect(new URL('/landing', req.url));
  }

  // Signed in, on waitlist page: allow (pending approval state)
  if (isWaitlistRoute(req)) {
    return NextResponse.next();
  }

  // Signed in: check if approved via publicMetadata
  const metadata = sessionClaims?.metadata as { approved?: boolean } | undefined;
  const approved = metadata?.approved === true;

  if (!approved) {
    return NextResponse.redirect(new URL('/waitlist', req.url));
  }

  // Approved: allow through
  return NextResponse.next();
});

export const config = {
  // Run middleware on all routes except truly static/public ones.
  // /sign-in and /sign-up MUST be included — Clerk needs the middleware to
  // run on /sign-in/sso-callback and /sign-up/sso-callback to complete the
  // OAuth session handshake. Excluding them breaks SSO sign-in.
  // Only /landing and /design are skipped (no Clerk involvement at all).
  matcher: [
    '/((?!landing|pricing|design|_next/static|_next/image|favicon\\.ico).*)',
  ],
};
