import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Public routes that don't require auth
const PUBLIC_PATHS = new Set<string>([
  '/login',
  '/favicon.ico',
]);

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Allow public paths
  if (PUBLIC_PATHS.has(pathname) || pathname.startsWith('/_next') || pathname.startsWith('/public')) {
    return NextResponse.next();
  }

  // Read token from local storage is not possible in middleware.
  // Use cookie as a fallback if present (AuthProvider stores token in localStorage).
  // If you want SSR protection, also set a cookie when logging in.
  const token = req.cookies.get('auth_token')?.value;

  if (!token) {
    const loginUrl = req.nextUrl.clone();
    loginUrl.pathname = '/login';
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api).*)'],
};


