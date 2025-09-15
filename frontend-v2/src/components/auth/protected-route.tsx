'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';
import { usePermissions } from '@/contexts/permission-context';
import { ProtectedComponentProps } from '@/types/permissions';
import { AccessDenied } from './access-denied';

interface ProtectedRouteProps extends Omit<ProtectedComponentProps, 'fallback'> {
  redirectTo?: string;
  showAccessDenied?: boolean;
}

/**
 * ProtectedRoute component that checks permissions before rendering children
 * Redirects unauthorized users or shows access denied page
 */
export function ProtectedRoute({ 
  children, 
  permission,
  permissions,
  role,
  roles,
  requireAll = false,
  redirectTo = '/unauthorized',
  showAccessDenied = true
}: ProtectedRouteProps) {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { hasPermission, hasAnyPermission, hasAllPermissions, hasRole, hasAnyRole, isLoading: permLoading } = usePermissions();
  const router = useRouter();

  const isLoading = authLoading || permLoading;

  // Check if user has required permissions/roles
  const hasAccess = () => {
    if (!isAuthenticated) {
      return false;
    }

    // Check single permission
    if (permission) {
      return hasPermission(permission.resource, permission.action);
    }

    // Check multiple permissions
    if (permissions && permissions.length > 0) {
      return requireAll 
        ? hasAllPermissions(permissions)
        : hasAnyPermission(permissions);
    }

    // Check single role
    if (role) {
      return hasRole(role);
    }

    // Check multiple roles
    if (roles && roles.length > 0) {
      return hasAnyRole(roles);
    }

    // If no specific permissions/roles required, just check authentication
    return true;
  };

  useEffect(() => {
    if (!isLoading) {
      if (!isAuthenticated) {
        router.push('/login');
      } else if (!hasAccess()) {
        if (showAccessDenied) {
          // Don't redirect, show access denied component
          return;
        } else {
          router.push(redirectTo);
        }
      }
    }
  }, [isAuthenticated, isLoading, router, redirectTo, showAccessDenied]);

  // Show loading while checking authentication and permissions
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          <span>Checking permissions...</span>
        </div>
      </div>
    );
  }

  // Don't render if not authenticated (will redirect)
  if (!isAuthenticated) {
    return null;
  }

  // Show access denied if no permission and showAccessDenied is true
  if (!hasAccess()) {
    if (showAccessDenied) {
      return <AccessDenied />;
    }
    return null; // Will redirect
  }

  return <>{children}</>;
}