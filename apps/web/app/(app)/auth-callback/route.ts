import { NextResponse } from 'next/server';

// Clerk redirects here immediately after a successful sign-in.
//
// Responsibility: set the _al cookie server-side (no JS / hydration needed),
// then forward to the branded /auth-loading page.
//
// Separating these two concerns means:
//   • The cookie is always committed within ~100 ms of Clerk's redirect,
//     regardless of how long the loading page takes to hydrate.
//   • The loading page never needs to touch document.cookie — it can just
//     call router.replace('/') when its timer fires, and the middleware will
//     let the request through because the cookie is already present.
//   • On very slow devices the loading page can include a <meta refresh>
//     fallback and it will also work, because the cookie is pre-set.
export async function GET(request: Request) {
  const origin = new URL(request.url).origin;
  const response = NextResponse.redirect(new URL('/auth-loading', origin));
  response.cookies.set('_al', '1', {
    path: '/',
    maxAge: 86400,
    sameSite: 'lax',
  });
  return response;
}
