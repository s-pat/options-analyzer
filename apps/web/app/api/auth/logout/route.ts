import { NextResponse } from 'next/server';

const COOKIE_NAME = 'beta_token';

export async function POST() {
  const response = NextResponse.json({ ok: true });
  response.cookies.set(COOKIE_NAME, '', { maxAge: 0, path: '/' });
  return response;
}
