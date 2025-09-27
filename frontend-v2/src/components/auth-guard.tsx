'use client';

import { useEffect } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';

interface AuthGuardProps {
  children: React.ReactNode;
}

const publicRoutes = ['/login'];

export function AuthGuard({ children }: AuthGuardProps) {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (!isLoading) {
      const isPublicRoute = publicRoutes.includes(pathname);

      if (!isAuthenticated && !isPublicRoute) {
        // Redirect to login if not authenticated and trying to access protected route
        const loginUrl = new URL('/login', window.location.origin);
        loginUrl.searchParams.set('redirect', pathname);
        router.push(loginUrl.pathname + loginUrl.search);
      } else if (isAuthenticated && pathname === '/login') {
        // Redirect to intended page if authenticated and trying to access login
        const redirectUrl = searchParams.get('redirect') || '/dashboard';
        console.log('🔄 AuthGuard: Authenticated user accessing login, redirecting to:', redirectUrl);
        router.push(redirectUrl);
      }
    }
  }, [isAuthenticated, isLoading, pathname, router, searchParams]);

  // Show loading spinner while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Show login page for public routes
  if (publicRoutes.includes(pathname)) {
    return <>{children}</>;
  }

  // Show protected content only if authenticated
  if (isAuthenticated) {
    return <>{children}</>;
  }

  // Show loading while redirecting
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
    </div>
  );
}
