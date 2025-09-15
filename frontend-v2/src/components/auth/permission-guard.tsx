'use client';

import { useAuth } from '@/contexts/auth-context';
import { usePermissions } from '@/contexts/permission-context';
import { ProtectedComponentProps } from '@/types/permissions';
import { InlineAccessDenied } from './access-denied';

/**
 * PermissionGuard component for conditional rendering based on permissions
 * More flexible than ProtectedRoute - doesn't handle routing, just rendering
 */
export function PermissionGuard({ 
  children, 
  permission,
  permissions,
  role,
  roles,
  requireAll = false,
  fallback
}: ProtectedComponentProps) {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { 
    hasPermission, 
    hasAnyPermission, 
    hasAllPermissions, 
    hasRole, 
    hasAnyRole, 
    isLoading: permLoading 
  } = usePermissions();

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

  // Show loading while checking permissions
  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-2">
        <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // Don't render if not authenticated or no access
  if (!isAuthenticated || !hasAccess()) {
    return fallback || <InlineAccessDenied />;
  }

  return <>{children}</>;
}

/**
 * Hook for checking permissions in components
 * Returns boolean instead of rendering - useful for conditional logic
 */
export function usePermissionCheck({ 
  permission,
  permissions,
  role,
  roles,
  requireAll = false
}: Omit<ProtectedComponentProps, 'children' | 'fallback'>) {
  const { isAuthenticated } = useAuth();
  const { 
    hasPermission, 
    hasAnyPermission, 
    hasAllPermissions, 
    hasRole, 
    hasAnyRole,
    isLoading
  } = usePermissions();

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

  return {
    hasAccess: hasAccess(),
    isLoading,
    isAuthenticated
  };
}