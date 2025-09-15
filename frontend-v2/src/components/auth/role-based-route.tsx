'use client';

import { useAuth } from '@/contexts/auth-context';
import { usePermissions } from '@/contexts/permission-context';
import { AccessDenied } from './access-denied';

interface RoleBasedRouteProps {
  allowedRoles: string[];
  requireAll?: boolean;
  fallback?: React.ReactNode;
  children: React.ReactNode;
}

/**
 * RoleBasedRoute component for role-specific access control
 * Shows content only if user has required roles
 */
export function RoleBasedRoute({ 
  children, 
  allowedRoles,
  requireAll = false,
  fallback
}: RoleBasedRouteProps) {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { hasRole, hasAnyRole, isLoading: permLoading } = usePermissions();

  const isLoading = authLoading || permLoading;

  // Check if user has required roles
  const hasAccess = () => {
    if (!isAuthenticated) {
      return false;
    }

    if (allowedRoles.length === 0) {
      return true; // No specific roles required
    }

    if (requireAll) {
      // User must have ALL specified roles
      return allowedRoles.every(role => hasRole(role));
    } else {
      // User must have ANY of the specified roles
      return hasAnyRole(allowedRoles);
    }
  };

  // Show loading while checking authentication and permissions
  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-4">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          <span className="text-sm text-muted-foreground">Checking access...</span>
        </div>
      </div>
    );
  }

  // Don't render if not authenticated or no access
  if (!isAuthenticated || !hasAccess()) {
    return fallback || <AccessDenied />;
  }

  return <>{children}</>;
}