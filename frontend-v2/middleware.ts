import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { validateAdminAccess } from '@/middleware/admin-access';

export async function middleware(request: NextRequest) {
  const token = request.cookies.get('access_token')?.value;
  const pathname = request.nextUrl.pathname;

  // Define route types
  const isAuthPage = pathname === '/login';
  const isRootPage = pathname === '/';
  const isAdminPage = pathname.startsWith('/admin');
  const isProtectedPage = pathname.startsWith('/dashboard') ||
                          pathname.startsWith('/equipment') ||
                          pathname.startsWith('/inspections') ||
                          pathname.startsWith('/reports') ||
                          pathname.startsWith('/inspectors') ||
                          isAdminPage;

  // Handle admin routes with special validation
  if (isAdminPage) {
    if (!token) {
      // No token - redirect to login with admin redirect
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(loginUrl);
    }

    // Validate admin access
    const adminValidation = await validateAdminAccess(request);
    
    if (!adminValidation.isValid) {
      // Invalid token - redirect to login
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(loginUrl);
    }

    if (!adminValidation.isAdmin) {
      // Valid user but not admin - redirect to unauthorized
      return NextResponse.redirect(new URL('/unauthorized', request.url));
    }

    // Admin access granted - add user info to headers
    const response = NextResponse.next();
    response.headers.set('x-user-id', adminValidation.user?.sub || '');
    response.headers.set('x-user-roles', JSON.stringify(adminValidation.user?.roles || []));
    return response;
  }

  // Handle regular protected routes
  if (token) {
    // User has token - redirect away from auth pages
    if (isAuthPage || isRootPage) {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
  } else {
    // User has no token - redirect to login for protected pages
    if (isProtectedPage || isRootPage) {
      return NextResponse.redirect(new URL('/login', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};