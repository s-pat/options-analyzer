import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';

const isPublicRoute = createRouteMatcher([
  '/landing(.*)',
  '/design(.*)',
  '/share(.*)',
  '/sign-in(.*)',
  '/sign-up(.*)',
  '/api/waitlist',
  '/api/webhooks(.*)',
  '/api/v1(.*)',
]);

const isWaitlistRoute = createRouteMatcher(['/waitlist(.*)']);

// Cookie that auth-loading sets once it has run for this browser session.
// Middleware checks for it so the loading screen is only shown once per sign-in.
const AUTH_LOADED_COOKIE = '_al';

export default clerkMiddleware(async (auth, req) => {
  const { userId, sessionClaims } = await auth();
  const pathname = req.nextUrl.pathname;

  // Public routes: allow through without auth.
  // If the user isn't signed in but the auth-loaded cookie still exists from a
  // previous session, clear it now so the next sign-in shows the loader again.
  if (isPublicRoute(req)) {
    if (!userId && req.cookies.has(AUTH_LOADED_COOKIE)) {
      const res = NextResponse.next();
      res.cookies.delete(AUTH_LOADED_COOKIE);
      return res;
    }
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

  // Approved user hitting the dashboard without having gone through auth-loading:
  // redirect to /auth-callback which sets the _al cookie server-side and
  // forwards to the branded loading page.  Using /auth-callback (not
  // /auth-loading directly) ensures the cookie is committed before the
  // loading page renders, so its router.replace('/') and the <meta refresh>
  // fallback both clear the middleware gate without needing client-side
  // document.cookie writes.
  if (pathname === '/' && !req.cookies.has(AUTH_LOADED_COOKIE)) {
    return NextResponse.redirect(new URL('/auth-callback', req.url));
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
  // _vercel is excluded so Speed Insights v2 resilient-intake beacon/discovery
  // requests are never intercepted by Clerk (unauthenticated beacons would
  // otherwise get redirected to /landing, silently dropping mobile vitals data).
  matcher: [
    '/((?!landing|design|_next/static|_next/image|favicon\\.ico|_vercel).*)',
    '/share/:path*',
  ],
};
