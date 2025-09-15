'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useAuth } from './auth-context';
import { 
  PermissionContextType, 
  PermissionCheck, 
  RBACUser 
} from '@/types/permissions';

const PermissionContext = createContext<PermissionContextType | undefined>(undefined);

export function PermissionProvider({ children }: { children: React.ReactNode }) {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const [permissions, setPermissions] = useState<string[]>([]);
  const [roles, setRoles] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Extract permissions and roles from user data
  const updatePermissionsFromUser = useCallback((userData: any) => {
    if (userData) {
      // Handle permissions - they might come from token or user object
      const userPermissions = userData.permissions || [];
      const userRoles = userData.roles || [];
      
      setPermissions(userPermissions);
      setRoles(userRoles);
    } else {
      setPermissions([]);
      setRoles([]);
    }
    setIsLoading(false);
  }, []);

  // Update permissions when user changes
  useEffect(() => {
    if (!authLoading) {
      updatePermissionsFromUser(user);
    }
  }, [user, authLoading, updatePermissionsFromUser]);

  // Refresh permissions from server
  const refreshPermissions = useCallback(async () => {
    if (!isAuthenticated || !user) {
      setPermissions([]);
      setRoles([]);
      return;
    }

    try {
      setIsLoading(true);
      // In a real implementation, you might want to fetch fresh permissions
      // For now, we'll use the permissions from the current user token
      updatePermissionsFromUser(user);
    } catch (error) {
      console.error('Failed to refresh permissions:', error);
      // Keep existing permissions on error
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated, user, updatePermissionsFromUser]);

  // Check if user has a specific permission
  const hasPermission = useCallback((resource: string, action: string): boolean => {
    if (!isAuthenticated || permissions.length === 0) {
      return false;
    }

    const permissionString = `${resource}:${action}`;
    return permissions.includes(permissionString);
  }, [isAuthenticated, permissions]);

  // Check if user has any of the specified permissions
  const hasAnyPermission = useCallback((permissionChecks: PermissionCheck[]): boolean => {
    if (!isAuthenticated || permissions.length === 0) {
      return false;
    }

    return permissionChecks.some(({ resource, action }) => 
      hasPermission(resource, action)
    );
  }, [isAuthenticated, permissions, hasPermission]);

  // Check if user has all of the specified permissions
  const hasAllPermissions = useCallback((permissionChecks: PermissionCheck[]): boolean => {
    if (!isAuthenticated || permissions.length === 0) {
      return false;
    }

    return permissionChecks.every(({ resource, action }) => 
      hasPermission(resource, action)
    );
  }, [isAuthenticated, permissions, hasPermission]);

  // Check if user has a specific role
  const hasRole = useCallback((roleName: string): boolean => {
    if (!isAuthenticated || roles.length === 0) {
      return false;
    }

    return roles.includes(roleName);
  }, [isAuthenticated, roles]);

  // Check if user has any of the specified roles
  const hasAnyRole = useCallback((roleNames: string[]): boolean => {
    if (!isAuthenticated || roles.length === 0) {
      return false;
    }

    return roleNames.some(roleName => roles.includes(roleName));
  }, [isAuthenticated, roles]);

  const value: PermissionContextType = {
    permissions,
    roles,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    hasRole,
    hasAnyRole,
    isLoading: authLoading || isLoading,
    refreshPermissions,
  };

  return (
    <PermissionContext.Provider value={value}>
      {children}
    </PermissionContext.Provider>
  );
}

export function usePermissions(): PermissionContextType {
  const context = useContext(PermissionContext);
  if (context === undefined) {
    throw new Error('usePermissions must be used within a PermissionProvider');
  }
  return context;
}