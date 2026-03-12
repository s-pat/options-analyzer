import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';

const COOKIE_NAME = 'beta_token';

// Routes that are always accessible without the beta token
const ALLOWED_PREFIXES = ['/landing', '/gate', '/design', '/api/auth', '/api/waitlist', '/api/v1'];

function isAllowed(pathname: string): boolean {
  return ALLOWED_PREFIXES.some((prefix) => pathname.startsWith(prefix));
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (isAllowed(pathname)) {
    return NextResponse.next();
  }

  const token = req.cookies.get(COOKIE_NAME)?.value;

  if (token) {
    const secret = process.env.JWT_SECRET;
    if (secret) {
      try {
        await jwtVerify(token, new TextEncoder().encode(secret));
        return NextResponse.next();
      } catch {
        // Invalid or expired token — fall through to redirect
      }
    }
  }

  // Delete stale cookie and redirect to landing
  const response = NextResponse.redirect(new URL('/landing', req.url));
  response.cookies.set(COOKIE_NAME, '', { maxAge: 0, path: '/' });
  return response;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js)).*)',
  ],
};
