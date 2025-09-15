'use client';

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import {
  PermissionButton,
  CreateButton,
  EditButton,
  DeleteButton,
  ApproveButton,
  PermissionInput,
  PermissionSelect as PermissionFormSelect,
  PermissionCheckbox,
  PermissionBadge,
  StatusBadge,
  PermissionIndicator,
  RoleBadge,
  PermissionLevel,
  InspectorSelect,
  RoleSelect,
} from '@/components/ui/permission-components';
import { PermissionGuard } from '@/components/auth/permission-guard';
import { usePermissions, useRoles } from '@/hooks/use-permissions';
import { RESOURCES, ACTIONS } from '@/types/permissions';

/**
 * Showcase component demonstrating all permission-based UI elements
 * This component serves as both documentation and testing interface
 */
export function PermissionUIShowcase() {
  const { permissions, roles } = usePermissions();
  const { isAdmin, isManager, isInspector } = useRoles();

  // Mock data for demonstration
  const mockInspectors = [
    {
      id: 1,
      name: 'John Doe (PSV Inspector)',
      roles: ['PSV Inspector'],
      permissions: ['psv:create', 'psv:view', 'psv:edit_own'],
      active: true,
    },
    {
      id: 2,
      name: 'Jane Smith (NDT Inspector)',
      roles: ['NDT Inspector'],
      permissions: ['ndt:create', 'ndt:view', 'ndt:edit_own'],
      active: true,
    },
    {
      id: 3,
      name: 'Bob Johnson (Manager)',
      roles: ['Mechanical Manager'],
      permissions: ['mechanical:approve', 'mechanical:delete_section'],
      active: true,
    },
  ];

  const mockRoles = [
    { id: 1, name: 'psv_inspector', display_label: 'PSV Inspector', description: 'PSV calibration inspector' },
    { id: 2, name: 'ndt_inspector', display_label: 'NDT Inspector', description: 'Non-destructive testing inspector' },
    { id: 3, name: 'mechanical_manager', display_label: 'Mechanical Manager', description: 'Mechanical department manager' },
  ];

  return (
    <div className="space-y-6 p-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold">Permission-Based UI Components Showcase</h1>
        <p className="text-muted-foreground">
          Demonstration of all permission-aware UI components and their behavior based on user permissions.
        </p>
      </div>

      {/* User Info Section */}
      <Card>
        <CardHeader>
          <CardTitle>Current User Permissions</CardTitle>
          <CardDescription>Your current roles and permissions in the system</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h4 className="font-medium mb-2">Roles:</h4>
            <div className="flex flex-wrap gap-2">
              {roles.length > 0 ? (
                roles.map(role => <RoleBadge key={role} role={role} />)
              ) : (
                <span className="text-muted-foreground">No roles assigned</span>
              )}
            </div>
          </div>
          <div>
            <h4 className="font-medium mb-2">Permissions ({permissions.length}):</h4>
            <div className="flex flex-wrap gap-1 max-h-32 overflow-y-auto">
              {permissions.length > 0 ? (
                permissions.map(permission => (
                  <PermissionBadge key={permission} hideWhenNoAccess={false}>
                    {permission}
                  </PermissionBadge>
                ))
              ) : (
                <span className="text-muted-foreground">No permissions assigned</span>
              )}
            </div>
          </div>
          <div className="flex gap-4">
            <PermissionIndicator hasAccess={isAdmin()} accessType="approve" showText={true} />
            <PermissionIndicator hasAccess={isManager()} accessType="edit" showText={true} />
            <PermissionIndicator hasAccess={isInspector()} accessType="view" showText={true} />
          </div>
        </CardContent>
      </Card>

      {/* Action Buttons Section */}
      <Card>
        <CardHeader>
          <CardTitle>Permission-Based Action Buttons</CardTitle>
          <CardDescription>Buttons that show, hide, or disable based on permissions</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <h4 className="font-medium">PSV Operations:</h4>
            <div className="flex flex-wrap gap-2">
              <CreateButton resource={RESOURCES.PSV}>Create PSV Report</CreateButton>
              <EditButton resource={RESOURCES.PSV} isOwn={true}>Edit Own PSV</EditButton>
              <EditButton resource={RESOURCES.PSV} isOwn={false}>Edit Any PSV</EditButton>
              <ApproveButton resource={RESOURCES.PSV}>Approve PSV</ApproveButton>
              <DeleteButton resource={RESOURCES.PSV} scope="own">Delete Own</DeleteButton>
              <DeleteButton resource={RESOURCES.PSV} scope="section">Delete Section</DeleteButton>
            </div>
          </div>

          <Separator />

          <div className="space-y-2">
            <h4 className="font-medium">NDT Operations:</h4>
            <div className="flex flex-wrap gap-2">
              <CreateButton resource={RESOURCES.NDT}>Create NDT Report</CreateButton>
              <EditButton resource={RESOURCES.NDT} isOwn={true}>Edit Own NDT</EditButton>
              <ApproveButton resource={RESOURCES.NDT}>Approve NDT</ApproveButton>
              <DeleteButton resource={RESOURCES.NDT} scope="own">Delete Own</DeleteButton>
            </div>
          </div>

          <Separator />

          <div className="space-y-2">
            <h4 className="font-medium">Admin Operations:</h4>
            <div className="flex flex-wrap gap-2">
              <PermissionButton permission={{ resource: RESOURCES.ADMIN, action: ACTIONS.MANAGE_ROLES }}>
                Manage Roles
              </PermissionButton>
              <PermissionButton permission={{ resource: RESOURCES.ADMIN, action: ACTIONS.MANAGE_PERMISSIONS }}>
                Manage Permissions
              </PermissionButton>
              <PermissionButton permission={{ resource: RESOURCES.ADMIN, action: ACTIONS.MANAGE_INSPECTORS }}>
                Manage Inspectors
              </PermissionButton>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Form Fields Section */}
      <Card>
        <CardHeader>
          <CardTitle>Permission-Based Form Fields</CardTitle>
          <CardDescription>Form fields that adapt based on user permissions</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <PermissionInput
              permission={{ resource: RESOURCES.PSV, action: ACTIONS.CREATE }}
              label="PSV Serial Number"
              placeholder="Enter PSV serial number"
              description="Required for PSV report creation"
            />
            
            <PermissionInput
              permission={{ resource: RESOURCES.ADMIN, action: ACTIONS.MANAGE }}
              label="Admin Only Field"
              placeholder="Only admins can edit this"
              description="This field is restricted to administrators"
              readOnlyWhenNoAccess={true}
            />

            <PermissionFormSelect
              permission={{ resource: RESOURCES.PSV, action: ACTIONS.CREATE }}
              label="PSV Type"
              description="Select the type of PSV"
            >
              <option value="safety">Safety Valve</option>
              <option value="relief">Relief Valve</option>
              <option value="pilot">Pilot Operated</option>
            </PermissionFormSelect>

            <PermissionCheckbox
              permission={{ resource: RESOURCES.QUALITY, action: ACTIONS.QUALITY_APPROVE }}
              label="Quality Approved"
              description="Only QC personnel can modify this"
            />
          </div>
        </CardContent>
      </Card>

      {/* Filtered Selects Section */}
      <Card>
        <CardHeader>
          <CardTitle>Permission-Filtered Dropdowns</CardTitle>
          <CardDescription>Dropdowns that filter options based on permissions</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Assign Inspector (PSV Create Permission Required):</label>
              <InspectorSelect
                inspectors={mockInspectors}
                requiredPermission={{ resource: RESOURCES.PSV, action: ACTIONS.CREATE }}
                placeholder="Select PSV inspector..."
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Assign Role (Admin Only):</label>
              <RoleSelect
                roles={mockRoles}
                placeholder="Select role..."
                requireManageRoles={true}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Status and Indicators Section */}
      <Card>
        <CardHeader>
          <CardTitle>Status Badges and Indicators</CardTitle>
          <CardDescription>Visual indicators that reflect permission states</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <h4 className="font-medium">Status Badges:</h4>
            <div className="flex flex-wrap gap-2">
              <StatusBadge status="approved" />
              <StatusBadge status="pending" />
              <StatusBadge status="rejected" />
              <StatusBadge status="draft" />
              <StatusBadge 
                status="in_progress" 
                canEdit={true}
                editPermission={{ resource: RESOURCES.PSV, action: ACTIONS.EDIT_OWN }}
              />
            </div>
          </div>

          <Separator />

          <div className="space-y-2">
            <h4 className="font-medium">Permission Levels:</h4>
            <div className="flex flex-wrap gap-4">
              <PermissionLevel level="none" />
              <PermissionLevel level="view" />
              <PermissionLevel level="edit" />
              <PermissionLevel level="full" />
            </div>
          </div>

          <Separator />

          <div className="space-y-2">
            <h4 className="font-medium">Access Indicators:</h4>
            <div className="flex flex-wrap gap-2">
              <PermissionIndicator hasAccess={true} accessType="view" />
              <PermissionIndicator hasAccess={true} accessType="edit" />
              <PermissionIndicator hasAccess={false} accessType="delete" />
              <PermissionIndicator hasAccess={true} accessType="approve" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Conditional Content Section */}
      <Card>
        <CardHeader>
          <CardTitle>Conditional Content Rendering</CardTitle>
          <CardDescription>Content that appears or disappears based on permissions</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <PermissionGuard permission={{ resource: RESOURCES.PSV, action: ACTIONS.CREATE }}>
            <div className="p-4 border border-green-200 bg-green-50 rounded-lg">
              <h4 className="font-medium text-green-800">PSV Creation Section</h4>
              <p className="text-green-700">You can create PSV reports. This section is only visible to users with PSV creation permissions.</p>
            </div>
          </PermissionGuard>

          <PermissionGuard permission={{ resource: RESOURCES.ADMIN, action: ACTIONS.MANAGE }}>
            <div className="p-4 border border-red-200 bg-red-50 rounded-lg">
              <h4 className="font-medium text-red-800">Admin Section</h4>
              <p className="text-red-700">This is an admin-only section. Only users with admin management permissions can see this.</p>
            </div>
          </PermissionGuard>

          <PermissionGuard 
            permissions={[
              { resource: RESOURCES.NDT, action: ACTIONS.CREATE },
              { resource: RESOURCES.MECHANICAL, action: ACTIONS.CREATE }
            ]}
            requireAll={false}
          >
            <div className="p-4 border border-blue-200 bg-blue-50 rounded-lg">
              <h4 className="font-medium text-blue-800">Multi-Discipline Section</h4>
              <p className="text-blue-700">You can create either NDT or Mechanical reports. This section requires at least one of these permissions.</p>
            </div>
          </PermissionGuard>

          <PermissionGuard role="Global Admin">
            <div className="p-4 border border-purple-200 bg-purple-50 rounded-lg">
              <h4 className="font-medium text-purple-800">Global Admin Section</h4>
              <p className="text-purple-700">This section is only visible to Global Administrators.</p>
            </div>
          </PermissionGuard>
        </CardContent>
      </Card>
    </div>
  );
}