'use client';

import React, { useMemo } from 'react';
import { useAuth } from '@/contexts/auth-context';

export interface AdminPermissions {
  // Core admin permissions
  canManageInspectors: boolean;
  canManageAttendance: boolean;
  canManageTemplates: boolean;
  canViewPayroll: boolean;
  canManagePayroll: boolean;
  canPerformBulkOperations: boolean;
  canManageUsers: boolean;
  canViewAuditLogs: boolean;
  canManageSystemSettings: boolean;
  
  // Granular permissions
  canCreateInspectors: boolean;
  canEditInspectors: boolean;
  canDeleteInspectors: boolean;
  canViewInspectorDetails: boolean;
  
  canCreateTemplates: boolean;
  canEditTemplates: boolean;
  canDeleteTemplates: boolean;
  canActivateTemplates: boolean;
  
  canViewAttendanceReports: boolean;
  canEditAttendance: boolean;
  canOverrideAttendance: boolean;
  
  canExportData: boolean;
  canImportData: boolean;
  canViewSystemStats: boolean;
}

export interface UseAdminPermissionsReturn {
  hasAdminAccess: boolean;
  permissions: AdminPermissions;
  hasPermission: (permission: keyof AdminPermissions) => boolean;
  hasAnyPermission: (permissions: (keyof AdminPermissions)[]) => boolean;
  hasAllPermissions: (permissions: (keyof AdminPermissions)[]) => boolean;
  isLoadingPermissions: boolean;
}

/**
 * Hook for managing admin permissions and access control
 * Provides granular permission checking for admin features
 */
export function useAdminPermissions(): UseAdminPermissionsReturn {
  const { user, isLoading, isAdmin } = useAuth();

  const permissions = useMemo((): AdminPermissions => {
    // If user is not loaded or not admin, deny all permissions
    if (!user || !isAdmin()) {
      return {
        canManageInspectors: false,
        canManageAttendance: false,
        canManageTemplates: false,
        canViewPayroll: false,
        canManagePayroll: false,
        canPerformBulkOperations: false,
        canManageUsers: false,
        canViewAuditLogs: false,
        canManageSystemSettings: false,
        canCreateInspectors: false,
        canEditInspectors: false,
        canDeleteInspectors: false,
        canViewInspectorDetails: false,
        canCreateTemplates: false,
        canEditTemplates: false,
        canDeleteTemplates: false,
        canActivateTemplates: false,
        canViewAttendanceReports: false,
        canEditAttendance: false,
        canOverrideAttendance: false,
        canExportData: false,
        canImportData: false,
        canViewSystemStats: false,
      };
    }

    // For now, all admin users get full permissions
    // In the future, this can be expanded to support role-based permissions
    const hasAdminRole = isAdmin();
    
    return {
      // Core admin permissions
      canManageInspectors: hasAdminRole,
      canManageAttendance: hasAdminRole,
      canManageTemplates: hasAdminRole,
      canViewPayroll: hasAdminRole,
      canManagePayroll: hasAdminRole,
      canPerformBulkOperations: hasAdminRole,
      canManageUsers: hasAdminRole,
      canViewAuditLogs: hasAdminRole,
      canManageSystemSettings: hasAdminRole,
      
      // Granular permissions
      canCreateInspectors: hasAdminRole,
      canEditInspectors: hasAdminRole,
      canDeleteInspectors: hasAdminRole,
      canViewInspectorDetails: hasAdminRole,
      
      canCreateTemplates: hasAdminRole,
      canEditTemplates: hasAdminRole,
      canDeleteTemplates: hasAdminRole,
      canActivateTemplates: hasAdminRole,
      
      canViewAttendanceReports: hasAdminRole,
      canEditAttendance: hasAdminRole,
      canOverrideAttendance: hasAdminRole,
      
      canExportData: hasAdminRole,
      canImportData: hasAdminRole,
      canViewSystemStats: hasAdminRole,
    };
  }, [user, isAdmin]);

  const hasAdminAccess = useMemo(() => {
    return !!user && isAdmin();
  }, [user, isAdmin]);

  const hasPermission = (permission: keyof AdminPermissions): boolean => {
    return permissions[permission];
  };

  const hasAnyPermission = (permissionList: (keyof AdminPermissions)[]): boolean => {
    return permissionList.some(permission => permissions[permission]);
  };

  const hasAllPermissions = (permissionList: (keyof AdminPermissions)[]): boolean => {
    return permissionList.every(permission => permissions[permission]);
  };

  return {
    hasAdminAccess,
    permissions,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    isLoadingPermissions: isLoading,
  };
}

/**
 * Higher-order component for wrapping components with permission checks
 * Note: This should be used in TSX files where JSX is available
 */
export function withAdminPermission<T extends object>(
  Component: React.ComponentType<T>,
  requiredPermission: keyof AdminPermissions,
  fallback?: React.ComponentType
) {
  return function PermissionWrappedComponent(props: T) {
    const { hasPermission } = useAdminPermissions();
    
    if (!hasPermission(requiredPermission)) {
      if (fallback) {
        const FallbackComponent = fallback;
        return React.createElement(FallbackComponent);
      }
      return null;
    }
    
    return React.createElement(Component, props);
  };
}