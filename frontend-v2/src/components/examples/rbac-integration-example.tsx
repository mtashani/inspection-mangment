'use client';

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { useAuth } from '@/contexts/auth-context';
import { usePermissions, useRoles } from '@/hooks/use-permissions';
import { PermissionGuard } from '@/components/auth/permission-guard';
import { CreateButton, EditButton, ApproveButton } from '@/components/ui/permission-components';
import { RESOURCES, ACTIONS } from '@/types/permissions';

/**
 * Example component showing complete RBAC integration
 * Demonstrates how to use the permission system with backend data
 */
export function RBACIntegrationExample() {
  const { user } = useAuth();
  const { permissions, roles, hasPermission } = usePermissions();
  const { isAdmin, isManager, isInspector } = useRoles();

  if (!user) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-muted-foreground">Please log in to see RBAC integration example.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold">RBAC Integration Example</h1>
        <p className="text-muted-foreground">
          Complete example showing how the frontend RBAC system integrates with backend permissions.
        </p>
      </div>

      {/* User Information */}
      <Card>
        <CardHeader>
          <CardTitle>Current User Information</CardTitle>
          <CardDescription>Data received from backend authentication</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h4 className="font-medium mb-2">Basic Information:</h4>
              <div className="space-y-1 text-sm">
                <p><strong>ID:</strong> {user.id}</p>
                <p><strong>Name:</strong> {user.name}</p>
                <p><strong>Username:</strong> {user.username || 'N/A'}</p>
                <p><strong>Email:</strong> {user.email}</p>
                <p><strong>Employee ID:</strong> {user.employee_id}</p>
                <p><strong>Active:</strong> {user.is_active ? 'Yes' : 'No'}</p>
              </div>
            </div>
            
            <div>
              <h4 className="font-medium mb-2">Additional Fields:</h4>
              <div className="space-y-1 text-sm">
                <p><strong>First Name:</strong> {user.first_name || 'N/A'}</p>
                <p><strong>Last Name:</strong> {user.last_name || 'N/A'}</p>
                <p><strong>Phone:</strong> {user.phone || 'N/A'}</p>
                <p><strong>Can Login:</strong> {user.can_login ? 'Yes' : 'No'}</p>
                <p><strong>Profile Image:</strong> {user.profile_image_url ? 'Set' : 'Not set'}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Roles and Permissions */}
      <Card>
        <CardHeader>
          <CardTitle>Roles and Permissions</CardTitle>
          <CardDescription>RBAC data extracted from JWT token and user profile</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h4 className="font-medium mb-2">Roles ({roles.length}):</h4>
            <div className="flex flex-wrap gap-2">
              {roles.length > 0 ? (
                roles.map(role => (
                  <Badge key={role} variant="secondary">
                    {role}
                  </Badge>
                ))
              ) : (
                <span className="text-muted-foreground">No roles assigned</span>
              )}
            </div>
          </div>

          <div>
            <h4 className="font-medium mb-2">Permissions ({permissions.length}):</h4>
            <div className="max-h-32 overflow-y-auto">
              <div className="flex flex-wrap gap-1">
                {permissions.length > 0 ? (
                  permissions.map(permission => (
                    <Badge key={permission} variant="outline" className="text-xs">
                      {permission}
                    </Badge>
                  ))
                ) : (
                  <span className="text-muted-foreground">No permissions assigned</span>
                )}
              </div>
            </div>
          </div>

          <div>
            <h4 className="font-medium mb-2">Role Categories:</h4>
            <div className="flex gap-4">
              <Badge variant={isAdmin() ? 'destructive' : 'outline'}>
                Admin: {isAdmin() ? 'Yes' : 'No'}
              </Badge>
              <Badge variant={isManager() ? 'default' : 'outline'}>
                Manager: {isManager() ? 'Yes' : 'No'}
              </Badge>
              <Badge variant={isInspector() ? 'secondary' : 'outline'}>
                Inspector: {isInspector() ? 'Yes' : 'No'}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Permission-Based Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Permission-Based Actions</CardTitle>
          <CardDescription>Buttons that show/hide based on your actual permissions</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <h4 className="font-medium">PSV Operations:</h4>
            <div className="flex flex-wrap gap-2">
              <CreateButton resource={RESOURCES.PSV}>Create PSV Report</CreateButton>
              <EditButton resource={RESOURCES.PSV} isOwn={true}>Edit Own PSV</EditButton>
              <EditButton resource={RESOURCES.PSV} isOwn={false}>Edit Any PSV</EditButton>
              <ApproveButton resource={RESOURCES.PSV}>Approve PSV</ApproveButton>
              
              {hasPermission(RESOURCES.PSV, ACTIONS.EXECUTE_TEST) && (
                <Button variant="outline">Execute PSV Test</Button>
              )}
            </div>
          </div>

          <Separator />

          <div className="space-y-2">
            <h4 className="font-medium">NDT Operations:</h4>
            <div className="flex flex-wrap gap-2">
              <CreateButton resource={RESOURCES.NDT}>Create NDT Report</CreateButton>
              <EditButton resource={RESOURCES.NDT} isOwn={true}>Edit Own NDT</EditButton>
              <ApproveButton resource={RESOURCES.NDT}>Approve NDT</ApproveButton>
            </div>
          </div>

          <Separator />

          <div className="space-y-2">
            <h4 className="font-medium">Mechanical Operations:</h4>
            <div className="flex flex-wrap gap-2">
              <CreateButton resource={RESOURCES.MECHANICAL}>Create Mechanical Report</CreateButton>
              <EditButton resource={RESOURCES.MECHANICAL} isOwn={true}>Edit Own Mechanical</EditButton>
              <ApproveButton resource={RESOURCES.MECHANICAL}>Approve Mechanical</ApproveButton>
            </div>
          </div>

          <Separator />

          <div className="space-y-2">
            <h4 className="font-medium">Admin Operations:</h4>
            <div className="flex flex-wrap gap-2">
              <PermissionGuard permission={{ resource: RESOURCES.ADMIN, action: ACTIONS.MANAGE_INSPECTORS }}>
                <Button>Manage Inspectors</Button>
              </PermissionGuard>
              
              <PermissionGuard permission={{ resource: RESOURCES.ADMIN, action: ACTIONS.MANAGE_ROLES }}>
                <Button>Manage Roles</Button>
              </PermissionGuard>
              
              <PermissionGuard permission={{ resource: RESOURCES.ADMIN, action: ACTIONS.MANAGE_PERMISSIONS }}>
                <Button>Manage Permissions</Button>
              </PermissionGuard>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Conditional Content */}
      <Card>
        <CardHeader>
          <CardTitle>Conditional Content</CardTitle>
          <CardDescription>Content sections that appear based on your permissions</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <PermissionGuard permission={{ resource: RESOURCES.PSV, action: ACTIONS.CREATE }}>
            <div className="p-4 border border-green-200 bg-green-50 rounded-lg">
              <h4 className="font-medium text-green-800">PSV Creation Access</h4>
              <p className="text-green-700 text-sm">
                You have permission to create PSV reports. This section would contain PSV creation tools and forms.
              </p>
            </div>
          </PermissionGuard>

          <PermissionGuard permission={{ resource: RESOURCES.QUALITY, action: ACTIONS.QUALITY_APPROVE }}>
            <div className="p-4 border border-blue-200 bg-blue-50 rounded-lg">
              <h4 className="font-medium text-blue-800">Quality Control Access</h4>
              <p className="text-blue-700 text-sm">
                You have quality approval permissions. This section would contain quality control tools and approval workflows.
              </p>
            </div>
          </PermissionGuard>

          <PermissionGuard role="Global Admin">
            <div className="p-4 border border-red-200 bg-red-50 rounded-lg">
              <h4 className="font-medium text-red-800">Global Admin Access</h4>
              <p className="text-red-700 text-sm">
                You are a Global Administrator. This section would contain system administration tools and settings.
              </p>
            </div>
          </PermissionGuard>

          <PermissionGuard 
            permissions={[
              { resource: RESOURCES.NDT, action: ACTIONS.CREATE },
              { resource: RESOURCES.MECHANICAL, action: ACTIONS.CREATE },
              { resource: RESOURCES.CORROSION, action: ACTIONS.CREATE }
            ]}
            requireAll={false}
          >
            <div className="p-4 border border-purple-200 bg-purple-50 rounded-lg">
              <h4 className="font-medium text-purple-800">Multi-Discipline Inspector</h4>
              <p className="text-purple-700 text-sm">
                You can create reports in multiple inspection disciplines. This section would contain cross-discipline tools.
              </p>
            </div>
          </PermissionGuard>
        </CardContent>
      </Card>

      {/* Permission Testing */}
      <Card>
        <CardHeader>
          <CardTitle>Permission Testing</CardTitle>
          <CardDescription>Test specific permission checks</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              { resource: RESOURCES.PSV, action: ACTIONS.CREATE, label: 'PSV Create' },
              { resource: RESOURCES.PSV, action: ACTIONS.APPROVE, label: 'PSV Approve' },
              { resource: RESOURCES.NDT, action: ACTIONS.CREATE, label: 'NDT Create' },
              { resource: RESOURCES.NDT, action: ACTIONS.APPROVE, label: 'NDT Approve' },
              { resource: RESOURCES.MECHANICAL, action: ACTIONS.CREATE, label: 'Mechanical Create' },
              { resource: RESOURCES.ADMIN, action: ACTIONS.MANAGE, label: 'Admin Manage' },
              { resource: RESOURCES.QUALITY, action: ACTIONS.QUALITY_APPROVE, label: 'Quality Approve' },
              { resource: RESOURCES.ADMIN, action: ACTIONS.MANAGE_ROLES, label: 'Manage Roles' },
              { resource: RESOURCES.ADMIN, action: ACTIONS.MANAGE_PERMISSIONS, label: 'Manage Permissions' },
            ].map(({ resource, action, label }) => (
              <div key={`${resource}:${action}`} className="flex items-center justify-between p-2 border rounded">
                <span className="text-sm">{label}:</span>
                <Badge variant={hasPermission(resource, action) ? 'default' : 'secondary'}>
                  {hasPermission(resource, action) ? 'Allowed' : 'Denied'}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}