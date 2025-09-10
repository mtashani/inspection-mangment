'use client';

import React from 'react';
import { useAdminPermissions, AdminPermissions } from '@/hooks/admin/use-admin-permissions';

interface PermissionGateProps {
  permission: keyof AdminPermissions;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

/**
 * Component that conditionally renders children based on a single permission
 */
export function PermissionGate({ 
  permission, 
  children, 
  fallback = null 
}: PermissionGateProps) {
  const { hasPermission } = useAdminPermissions();
  
  if (!hasPermission(permission)) {
    return <>{fallback}</>;
  }
  
  return <>{children}</>;
}

interface MultiPermissionGateProps {
  permissions: (keyof AdminPermissions)[];
  requireAll?: boolean; // If true, requires all permissions. If false, requires any permission
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

/**
 * Component that conditionally renders children based on multiple permissions
 */
export function MultiPermissionGate({ 
  permissions, 
  requireAll = false,
  children, 
  fallback = null 
}: MultiPermissionGateProps) {
  const { hasAllPermissions, hasAnyPermission } = useAdminPermissions();
  
  const hasAccess = requireAll 
    ? hasAllPermissions(permissions)
    : hasAnyPermission(permissions);
  
  if (!hasAccess) {
    return <>{fallback}</>;
  }
  
  return <>{children}</>;
}

interface AdminAccessGateProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

/**
 * Component that conditionally renders children based on admin access
 */
export function AdminAccessGate({ 
  children, 
  fallback = null 
}: AdminAccessGateProps) {
  const { hasAdminAccess } = useAdminPermissions();
  
  if (!hasAdminAccess) {
    return <>{fallback}</>;
  }
  
  return <>{children}</>;
}

interface ConditionalRenderProps {
  condition: boolean;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

/**
 * Generic conditional rendering component
 */
export function ConditionalRender({ 
  condition, 
  children, 
  fallback = null 
}: ConditionalRenderProps) {
  return condition ? <>{children}</> : <>{fallback}</>;
}

/**
 * Hook for conditional rendering based on permissions
 */
export function usePermissionBasedRendering() {
  const { hasPermission, hasAnyPermission, hasAllPermissions, hasAdminAccess } = useAdminPermissions();
  
  const renderWithPermission = (
    permission: keyof AdminPermissions,
    component: React.ReactNode,
    fallback?: React.ReactNode
  ) => {
    return hasPermission(permission) ? component : (fallback || null);
  };
  
  const renderWithAnyPermission = (
    permissions: (keyof AdminPermissions)[],
    component: React.ReactNode,
    fallback?: React.ReactNode
  ) => {
    return hasAnyPermission(permissions) ? component : (fallback || null);
  };
  
  const renderWithAllPermissions = (
    permissions: (keyof AdminPermissions)[],
    component: React.ReactNode,
    fallback?: React.ReactNode
  ) => {
    return hasAllPermissions(permissions) ? component : (fallback || null);
  };
  
  const renderWithAdminAccess = (
    component: React.ReactNode,
    fallback?: React.ReactNode
  ) => {
    return hasAdminAccess ? component : (fallback || null);
  };
  
  return {
    renderWithPermission,
    renderWithAnyPermission,
    renderWithAllPermissions,
    renderWithAdminAccess,
  };
}

/**
 * Utility functions for permission-based styling and props
 */
export function usePermissionBasedProps() {
  const { hasPermission, hasAdminAccess } = useAdminPermissions();
  
  const getDisabledProps = (permission: keyof AdminPermissions) => ({
    disabled: !hasPermission(permission),
    'aria-disabled': !hasPermission(permission),
  });
  
  const getHiddenProps = (permission: keyof AdminPermissions) => ({
    style: { display: hasPermission(permission) ? undefined : 'none' },
    'aria-hidden': !hasPermission(permission),
  });
  
  const getAdminOnlyProps = () => ({
    disabled: !hasAdminAccess,
    'aria-disabled': !hasAdminAccess,
  });
  
  return {
    getDisabledProps,
    getHiddenProps,
    getAdminOnlyProps,
  };
}