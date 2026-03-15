import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';

const isPublicRoute = createRouteMatcher([
  '/landing(.*)',
  '/design(.*)',
  '/sign-in(.*)',
  '/sign-up(.*)',
  '/api/waitlist',
  '/api/webhooks(.*)',
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
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js)).*)',
  ],
};
