'use client';

import React, { useMemo } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { usePermissions } from '@/contexts/permission-context';
import { FilteredOption, PermissionCheck } from '@/types/permissions';

interface PermissionSelectProps extends React.ComponentProps<typeof Select> {
  options: FilteredOption[];
  placeholder?: string;
  emptyMessage?: string;
  filterByPermission?: boolean;
}

/**
 * Select component that filters options based on user permissions
 */
export function PermissionSelect({
  options,
  placeholder = 'Select an option...',
  emptyMessage = 'No options available',
  filterByPermission = true,
  children,
  ...selectProps
}: PermissionSelectProps) {
  const { hasPermission } = usePermissions();

  // Filter options based on permissions
  const filteredOptions = useMemo(() => {
    if (!filterByPermission) {
      return options;
    }

    return options.filter(option => {
      // If option has no permission requirement, include it
      if (!option.permission) {
        return true;
      }

      // Check if user has the required permission
      return hasPermission(option.permission.resource, option.permission.action);
    });
  }, [options, filterByPermission, hasPermission]);

  return (
    <Select {...selectProps}>
      <SelectTrigger>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {filteredOptions.length === 0 ? (
          <SelectItem value="" disabled>
            {emptyMessage}
          </SelectItem>
        ) : (
          filteredOptions.map(option => (
            <SelectItem
              key={option.value}
              value={option.value.toString()}
              disabled={option.disabled}
            >
              {option.label}
            </SelectItem>
          ))
        )}
        {children}
      </SelectContent>
    </Select>
  );
}

/**
 * Inspector select component that filters inspectors based on permissions
 */
export function InspectorSelect({
  inspectors,
  requiredPermission,
  placeholder = 'Select inspector...',
  emptyMessage = 'No eligible inspectors available',
  ...selectProps
}: Omit<PermissionSelectProps, 'options'> & {
  inspectors: Array<{
    id: number;
    name: string;
    roles: string[];
    permissions: string[];
    active?: boolean;
  }>;
  requiredPermission?: PermissionCheck;
}) {
  const { hasPermission } = usePermissions();

  // Convert inspectors to filtered options
  const inspectorOptions = useMemo(() => {
    return inspectors
      .filter(inspector => inspector.active !== false) // Only active inspectors
      .map(inspector => ({
        value: inspector.id,
        label: inspector.name,
        disabled: false,
        permission: requiredPermission,
      }))
      .filter(option => {
        // If no permission requirement, include all inspectors
        if (!requiredPermission) {
          return true;
        }

        // Find the inspector and check if they have the required permission
        const inspector = inspectors.find(i => i.id === option.value);
        if (!inspector) {
          return false;
        }

        // Check if inspector has the required permission
        const permissionString = `${requiredPermission.resource}:${requiredPermission.action}`;
        return inspector.permissions.includes(permissionString);
      });
  }, [inspectors, requiredPermission]);

  return (
    <PermissionSelect
      options={inspectorOptions}
      placeholder={placeholder}
      emptyMessage={emptyMessage}
      filterByPermission={false} // We already filtered above
      {...selectProps}
    />
  );
}

/**
 * Role select component for admin interfaces
 */
export function RoleSelect({
  roles,
  placeholder = 'Select role...',
  emptyMessage = 'No roles available',
  requireManageRoles = true,
  ...selectProps
}: Omit<PermissionSelectProps, 'options'> & {
  roles: Array<{
    id: number;
    name: string;
    display_label: string;
    description?: string;
  }>;
  requireManageRoles?: boolean;
}) {
  const { hasPermission } = usePermissions();

  // Check if user can manage roles
  const canManageRoles = hasPermission('admin', 'manage_roles');

  // Convert roles to options
  const roleOptions = useMemo(() => {
    return roles.map(role => ({
      value: role.id,
      label: role.display_label || role.name,
      disabled: requireManageRoles && !canManageRoles,
    }));
  }, [roles, requireManageRoles, canManageRoles]);

  return (
    <PermissionSelect
      options={roleOptions}
      placeholder={placeholder}
      emptyMessage={emptyMessage}
      filterByPermission={false}
      {...selectProps}
    />
  );
}

/**
 * Permission select component for admin interfaces
 */
export function PermissionSelectComponent({
  permissions,
  placeholder = 'Select permission...',
  emptyMessage = 'No permissions available',
  groupByResource = true,
  requireManagePermissions = true,
  ...selectProps
}: Omit<PermissionSelectProps, 'options'> & {
  permissions: Array<{
    id: number;
    name: string;
    resource: string;
    action: string;
    display_label: string;
    description?: string;
  }>;
  groupByResource?: boolean;
  requireManagePermissions?: boolean;
}) {
  const { hasPermission } = usePermissions();

  // Check if user can manage permissions
  const canManagePermissions = hasPermission('admin', 'manage_permissions');

  // Convert permissions to options
  const permissionOptions = useMemo(() => {
    return permissions.map(permission => ({
      value: permission.id,
      label: permission.display_label || `${permission.resource}:${permission.action}`,
      disabled: requireManagePermissions && !canManagePermissions,
    }));
  }, [permissions, requireManagePermissions, canManagePermissions]);

  return (
    <PermissionSelect
      options={permissionOptions}
      placeholder={placeholder}
      emptyMessage={emptyMessage}
      filterByPermission={false}
      {...selectProps}
    />
  );
}

/**
 * Equipment type select with permission filtering
 */
export function EquipmentTypeSelect({
  equipmentTypes,
  requiredAction = 'view',
  placeholder = 'Select equipment type...',
  emptyMessage = 'No equipment types available',
  ...selectProps
}: Omit<PermissionSelectProps, 'options'> & {
  equipmentTypes: Array<{
    id: string;
    name: string;
    resource: string;
  }>;
  requiredAction?: string;
}) {
  // Convert equipment types to filtered options
  const equipmentOptions = useMemo(() => {
    return equipmentTypes.map(type => ({
      value: type.id,
      label: type.name,
      permission: { resource: type.resource, action: requiredAction },
    }));
  }, [equipmentTypes, requiredAction]);

  return (
    <PermissionSelect
      options={equipmentOptions}
      placeholder={placeholder}
      emptyMessage={emptyMessage}
      {...selectProps}
    />
  );
}