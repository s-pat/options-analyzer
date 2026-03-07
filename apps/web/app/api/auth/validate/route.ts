import { NextRequest, NextResponse } from 'next/server';
import { SignJWT } from 'jose';
import { timingSafeEqual } from 'crypto';

const COOKIE_NAME = 'beta_token';
const MAX_AGE_SECONDS = 60 * 60 * 24 * 30; // 30 days

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const { password } = body as { password?: string };

  const previewPassword = process.env.PREVIEW_PASSWORD;
  const jwtSecret = process.env.JWT_SECRET;

  if (!previewPassword || !jwtSecret) {
    return NextResponse.json({ error: 'Server misconfigured' }, { status: 500 });
  }

  // Constant-time comparison to prevent timing attacks
  let isValid = false;
  if (typeof password === 'string') {
    try {
      const a = Buffer.from(password.padEnd(previewPassword.length));
      const b = Buffer.from(previewPassword.padEnd(password.length));
      // Only valid if lengths also match (padded buffers same length but original must match)
      isValid =
        password.length === previewPassword.length &&
        timingSafeEqual(a, b);
    } catch {
      isValid = false;
    }
  }

  if (!isValid) {
    return NextResponse.json({ error: 'Invalid password' }, { status: 401 });
  }

  const secret = new TextEncoder().encode(jwtSecret);
  const token = await new SignJWT({ granted: true })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(`${MAX_AGE_SECONDS}s`)
    .sign(secret);

  const response = NextResponse.json({ ok: true });
  response.cookies.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: MAX_AGE_SECONDS,
    path: '/',
  });

  return response;
}
