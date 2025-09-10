'use client';

import React from 'react';
import { useAuth } from '@/contexts/auth-context';
import { useAdminPermissions, AdminPermissions } from '@/hooks/admin/use-admin-permissions';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Shield, AlertTriangle, ArrowLeft, Home } from 'lucide-react';
import Link from 'next/link';

interface AdminPermissionGuardProps {
  children: React.ReactNode;
  requiredPermission?: keyof AdminPermissions;
  fallback?: React.ReactNode;
  showLoginPrompt?: boolean;
}

export function AdminPermissionGuard({ 
  children, 
  requiredPermission,
  fallback,
  showLoginPrompt = true
}: AdminPermissionGuardProps) {
  const { user, isLoading } = useAuth();
  const { hasAdminAccess, hasPermission, isLoadingPermissions } = useAdminPermissions();

  // Show loading state
  if (isLoading || isLoadingPermissions) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <Shield className="h-12 w-12 animate-pulse mx-auto text-muted-foreground" />
          <p className="text-muted-foreground">Checking permissions...</p>
        </div>
      </div>
    );
  }

  // Check if user has admin access
  if (!hasAdminAccess) {
    if (fallback) {
      return <>{fallback}</>;
    }

    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/20">
              <AlertTriangle className="h-6 w-6 text-red-600 dark:text-red-400" />
            </div>
            <CardTitle className="text-xl">Access Denied</CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-muted-foreground">
              You don't have permission to access the admin panel. 
              Please contact your administrator if you believe this is an error.
            </p>
            <div className="flex flex-col sm:flex-row gap-2 justify-center">
              <Button asChild variant="outline">
                <Link href="/">
                  <Home className="w-4 h-4 mr-2" />
                  Return Home
                </Link>
              </Button>
              {showLoginPrompt && !user && (
                <Button asChild>
                  <Link href="/login">
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Login
                  </Link>
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Check specific permission if required
  if (requiredPermission && !hasPermission(requiredPermission)) {
    if (fallback) {
      return <>{fallback}</>;
    }

    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-orange-100 dark:bg-orange-900/20">
              <Shield className="h-6 w-6 text-orange-600 dark:text-orange-400" />
            </div>
            <CardTitle className="text-xl">Insufficient Permissions</CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-muted-foreground">
              You don&apos;t have the required permission ({requiredPermission}) to access this feature.
              Please contact your administrator if you need access.
            </p>
            <div className="flex flex-col sm:flex-row gap-2 justify-center">
              <Button asChild variant="outline">
                <Link href="/admin">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Admin
                </Link>
              </Button>
              <Button asChild>
                <Link href="/">
                  <Home className="w-4 h-4 mr-2" />
                  Return Home
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // User has access, render children
  return <>{children}</>;
}

/**
 * Simplified admin-only guard for basic admin access
 */
export function AdminOnly({ 
  children, 
  fallback 
}: { 
  children: React.ReactNode; 
  fallback?: React.ReactNode; 
}) {
  return (
    <AdminPermissionGuard fallback={fallback}>
      {children}
    </AdminPermissionGuard>
  );
}