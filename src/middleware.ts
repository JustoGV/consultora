import { NextRequest, NextResponse } from 'next/server';

/**
 * AUD-33 — Route protection middleware (defense-in-depth).
 *
 * The real access-control barrier is (and remains) the backend: every API
 * call is guarded server-side by JwtAuthGuard/RolesGuard. This middleware is
 * an additional, cheap client-side gate that runs on the edge before a
 * `/dashboard/*` page is even served.
 *
 * IMPORTANT — current auth storage caveat:
 * Today the frontend stores the JWT in `localStorage` and sends it as a
 * `Bearer` header (see `src/services/authService.ts` / `src/lib/axios.ts`).
 * `localStorage` is NOT readable from middleware (it runs on the edge/server,
 * not in the browser), so this middleware cannot see that token directly.
 *
 * The backend now also sets an httpOnly `access_token` cookie on login
 * (AUD-16, backend). This middleware checks for THAT cookie. But since the
 * frontend has not yet migrated its request layer to rely on the cookie
 * (it still reads/sends the Bearer token from localStorage), we can't yet
 * treat "cookie missing" as a hard "not logged in" signal — a user who is
 * genuinely logged in (token in localStorage) may still not have the cookie
 * set in some edge case, and we must not lock them out of the dashboard.
 *
 * Decision: PERMISSIVE for now. If the cookie is present, we do nothing
 * (already fine). If the cookie is missing, we currently let the request
 * through rather than redirecting — the backend still enforces auth on every
 * API call, so no data is exposed, only the shell of a protected page might
 * render before client-side checks (e.g. AuthContext) kick in.
 *
 * TODO(AUD-33 follow-up): once the frontend fully migrates from
 * localStorage+Bearer to the httpOnly cookie for auth, flip this middleware
 * to STRICT mode (redirect to /login when `access_token` cookie is absent).
 */
export function middleware(req: NextRequest) {
  const token = req.cookies.get('access_token');

  if (!token) {
    // Permissive mode: do NOT redirect yet, see TODO above.
    // When ready to enforce strictly, uncomment:
    // const loginUrl = new URL('/login', req.url);
    // return NextResponse.redirect(loginUrl);
    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*'],
};
