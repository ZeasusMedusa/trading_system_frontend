import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Public routes that don't require authentication
const PUBLIC_PATHS = new Set<string>(['/login', '/favicon.ico']);

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Allow Next.js internals, API routes, and public assets
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.startsWith('/public') ||
    pathname.startsWith('/assets')
  ) {
    return NextResponse.next();
  }

  // Allow explicit public paths
  if (PUBLIC_PATHS.has(pathname)) {
    return NextResponse.next();
  }

  // Require auth cookie for all other routes (including "/" and "/backtester")
  const token = req.cookies.get('auth_token')?.value;
  if (!token) {
    const loginUrl = req.nextUrl.clone();
    loginUrl.pathname = '/login';
    if (pathname && pathname !== '/login') {
      loginUrl.searchParams.set('redirect', pathname);
    }
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  // Run on all routes except the ones Next handles specially
  matcher: ['/((?!_next|api|static|.*\\.\w+$).*)'],
};


