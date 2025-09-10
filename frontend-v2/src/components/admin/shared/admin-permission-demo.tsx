'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  AdminPermissionGuard,
  PermissionGate,
  MultiPermissionGate,
  PermissionButton,
  AdminBadge,
  useAdminPermissions,
  usePermissionBasedRendering
} from './index';

/**
 * Demo component showing how to use the admin permission system
 * This component demonstrates various permission checking patterns
 */
export function AdminPermissionDemo() {
  const { 
    hasAdminAccess, 
    permissions, 
    hasPermission, 
    hasAnyPermission,
    hasAllPermissions 
  } = useAdminPermissions();

  const { renderWithPermission, renderWithAdminAccess } = usePermissionBasedRendering();

  return (
    <div className="space-y-6 p-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            Admin Permission System Demo
            <AdminBadge />
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Basic admin access check */}
          <div>
            <h3 className="text-lg font-semibold mb-2">Basic Admin Access</h3>
            <p className="text-sm text-muted-foreground mb-2">
              Admin Access: <Badge variant={hasAdminAccess ? 'default' : 'destructive'}>
                {hasAdminAccess ? 'Granted' : 'Denied'}
              </Badge>
            </p>
          </div>

          {/* Permission status display */}
          <div>
            <h3 className="text-lg font-semibold mb-2">Permission Status</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-sm">
              <div>Inspector Management: <Badge variant={permissions.canManageInspectors ? 'default' : 'secondary'}>
                {permissions.canManageInspectors ? 'Yes' : 'No'}
              </Badge></div>
              <div>Attendance Management: <Badge variant={permissions.canManageAttendance ? 'default' : 'secondary'}>
                {permissions.canManageAttendance ? 'Yes' : 'No'}
              </Badge></div>
              <div>Template Management: <Badge variant={permissions.canManageTemplates ? 'default' : 'secondary'}>
                {permissions.canManageTemplates ? 'Yes' : 'No'}
              </Badge></div>
              <div>Payroll Access: <Badge variant={permissions.canViewPayroll ? 'default' : 'secondary'}>
                {permissions.canViewPayroll ? 'Yes' : 'No'}
              </Badge></div>
              <div>Bulk Operations: <Badge variant={permissions.canPerformBulkOperations ? 'default' : 'secondary'}>
                {permissions.canPerformBulkOperations ? 'Yes' : 'No'}
              </Badge></div>
            </div>
          </div>

          {/* Permission-based rendering examples */}
          <div>
            <h3 className="text-lg font-semibold mb-2">Permission-Based Rendering</h3>
            
            {/* Single permission gate */}
            <PermissionGate 
              permission="canManageInspectors"
              fallback={<p className="text-muted-foreground">Inspector management not available</p>}
            >
              <p className="text-green-600">✓ Inspector management is available</p>
            </PermissionGate>

            {/* Multiple permission gate (any) */}
            <MultiPermissionGate 
              permissions={['canManageAttendance', 'canViewPayroll']}
              requireAll={false}
              fallback={<p className="text-muted-foreground">No attendance or payroll access</p>}
            >
              <p className="text-green-600">✓ Has attendance or payroll access</p>
            </MultiPermissionGate>

            {/* Multiple permission gate (all) */}
            <MultiPermissionGate 
              permissions={['canManageInspectors', 'canManageAttendance']}
              requireAll={true}
              fallback={<p className="text-muted-foreground">Missing some management permissions</p>}
            >
              <p className="text-green-600">✓ Has full management access</p>
            </MultiPermissionGate>
          </div>

          {/* Permission buttons */}
          <div>
            <h3 className="text-lg font-semibold mb-2">Permission Buttons</h3>
            <div className="flex flex-wrap gap-2">
              <PermissionButton 
                permission="canManageInspectors"
                tooltip="You need inspector management permission"
              >
                Manage Inspectors
              </PermissionButton>
              
              <PermissionButton 
                permission="canManageAttendance"
                tooltip="You need attendance management permission"
                variant="outline"
              >
                Manage Attendance
              </PermissionButton>
              
              <PermissionButton 
                permission="canPerformBulkOperations"
                tooltip="You need bulk operations permission"
                variant="destructive"
              >
                Bulk Operations
              </PermissionButton>
            </div>
          </div>

          {/* Hook-based rendering */}
          <div>
            <h3 className="text-lg font-semibold mb-2">Hook-Based Rendering</h3>
            {renderWithPermission(
              'canManageTemplates',
              <p className="text-green-600">✓ Template management available via hook</p>,
              <p className="text-muted-foreground">Template management not available</p>
            )}
            
            {renderWithAdminAccess(
              <p className="text-blue-600">✓ Admin access confirmed via hook</p>,
              <p className="text-red-600">✗ Admin access denied</p>
            )}
          </div>

          {/* Function-based checks */}
          <div>
            <h3 className="text-lg font-semibold mb-2">Function-Based Checks</h3>
            <div className="space-y-1 text-sm">
              <p>Single permission check: {hasPermission('canManageInspectors') ? '✓' : '✗'} canManageInspectors</p>
              <p>Any permission check: {hasAnyPermission(['canViewPayroll', 'canManagePayroll']) ? '✓' : '✗'} payroll access</p>
              <p>All permissions check: {hasAllPermissions(['canManageInspectors', 'canManageAttendance', 'canManageTemplates']) ? '✓' : '✗'} full management</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Nested permission guard example */}
      <AdminPermissionGuard 
        requiredPermission="canManageInspectors"
        fallback={
          <Card>
            <CardContent className="p-6">
              <p className="text-muted-foreground">Inspector management section not available</p>
            </CardContent>
          </Card>
        }
      >
        <Card>
          <CardHeader>
            <CardTitle>Inspector Management Section</CardTitle>
          </CardHeader>
          <CardContent>
            <p>This section is only visible to users with inspector management permissions.</p>
            <div className="mt-4 flex gap-2">
              <Button size="sm">Create Inspector</Button>
              <Button size="sm" variant="outline">View All Inspectors</Button>
            </div>
          </CardContent>
        </Card>
      </AdminPermissionGuard>
    </div>
  );
}