import { NextResponse } from 'next/server';

// Route Handler — replaces the old client-side auth-loading page.
//
// Problem with the old page (page.tsx):
//   It was a 'use client' component whose redirect timer started inside
//   useEffect — meaning the 3-second countdown didn't begin until AFTER
//   React had fully hydrated the page.  On slow mobile connections, JS
//   bundle download + parse + hydration could take 20–50 s, so users were
//   stuck on the loading screen far longer than the intended 3 s cap.
//
// This Route Handler runs entirely on the server: no JS download, no
// hydration, no timers.  The browser receives a 307 redirect within ~100 ms
// of landing on /auth-loading, and the _al cookie is set in the same
// response so the middleware on / lets the request through without
// bouncing back here.
export async function GET(request: Request) {
  const origin = new URL(request.url).origin;
  const response = NextResponse.redirect(new URL('/', origin));
  response.cookies.set('_al', '1', {
    path: '/',
    maxAge: 86400,
    sameSite: 'lax',
  });
  return response;
}
