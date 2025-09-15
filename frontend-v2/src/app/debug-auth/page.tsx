'use client';

import React from 'react';
import { useAuth } from '@/contexts/auth-context';
import { useAdminPermissions } from '@/hooks/admin/use-admin-permissions';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export default function DebugAuthPage() {
  const { user, isLoading, isAuthenticated, token, isAdmin } = useAuth();
  const { hasAdminAccess, permissions } = useAdminPermissions();

  return (
    <div className="container mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-bold">Auth Debug Page</h1>
      
      <Card>
        <CardHeader>
          <CardTitle>Auth Context State</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div><strong>isLoading:</strong> <Badge variant={isLoading ? 'destructive' : 'default'}>{String(isLoading)}</Badge></div>
            <div><strong>isAuthenticated:</strong> <Badge variant={isAuthenticated ? 'default' : 'destructive'}>{String(isAuthenticated)}</Badge></div>
            <div><strong>hasToken:</strong> <Badge variant={!!token ? 'default' : 'destructive'}>{String(!!token)}</Badge></div>
            <div><strong>isAdmin():</strong> <Badge variant={isAdmin() ? 'default' : 'destructive'}>{String(isAdmin())}</Badge></div>
            <div><strong>hasAdminAccess:</strong> <Badge variant={hasAdminAccess ? 'default' : 'destructive'}>{String(hasAdminAccess)}</Badge></div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>User Object</CardTitle>
        </CardHeader>
        <CardContent>
          {user ? (
            <div className="space-y-2">
              <div><strong>ID:</strong> {user.id}</div>
              <div><strong>Username:</strong> {user.username}</div>
              <div><strong>Email:</strong> {user.email}</div>
              <div><strong>Name:</strong> {user.name}</div>
              <div><strong>Employee ID:</strong> {user.employee_id}</div>
              <div><strong>Is Active:</strong> <Badge variant={user.is_active ? 'default' : 'destructive'}>{String(user.is_active)}</Badge></div>
              <div><strong>Roles:</strong> {user.roles ? user.roles.map(role => (
                <Badge key={role} variant="outline" className="ml-1">{role}</Badge>
              )) : 'No roles'}</div>
            </div>
          ) : (
            <div className="text-muted-foreground">No user data</div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Raw Data</CardTitle>
        </CardHeader>
        <CardContent>
          <pre className="text-xs bg-muted p-4 rounded overflow-auto">
            {JSON.stringify({ 
              user, 
              isLoading, 
              isAuthenticated, 
              hasToken: !!token,
              isAdmin: isAdmin(),
              hasAdminAccess,
              permissions: Object.entries(permissions).filter(([key, value]) => value)
            }, null, 2)}
          </pre>
        </CardContent>
      </Card>
    </div>
  );
}