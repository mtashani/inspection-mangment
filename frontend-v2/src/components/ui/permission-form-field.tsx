'use client';

import React from 'react';
import { PermissionGuard } from '@/components/auth/permission-guard';
import { ProtectedComponentProps } from '@/types/permissions';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';

interface PermissionFormFieldProps extends Omit<ProtectedComponentProps, 'children'> {
  label?: string;
  description?: string;
  required?: boolean;
  hideWhenNoAccess?: boolean;
  readOnlyWhenNoAccess?: boolean;
  children: React.ReactNode;
}

/**
 * Form field wrapper that handles permission-based visibility and read-only state
 */
export function PermissionFormField({
  label,
  description,
  required,
  permission,
  permissions,
  role,
  roles,
  requireAll = false,
  hideWhenNoAccess = false,
  readOnlyWhenNoAccess = true,
  fallback,
  children,
}: PermissionFormFieldProps) {
  const fieldContent = (
    <div className="space-y-2">
      {label && (
        <Label className="text-sm font-medium">
          {label}
          {required && <span className="text-destructive ml-1">*</span>}
        </Label>
      )}
      {children}
      {description && (
        <p className="text-sm text-muted-foreground">{description}</p>
      )}
    </div>
  );

  if (hideWhenNoAccess) {
    return (
      <PermissionGuard
        permission={permission}
        permissions={permissions}
        role={role}
        roles={roles}
        requireAll={requireAll}
        fallback={fallback}
      >
        {fieldContent}
      </PermissionGuard>
    );
  }

  if (readOnlyWhenNoAccess) {
    return (
      <PermissionGuard
        permission={permission}
        permissions={permissions}
        role={role}
        roles={roles}
        requireAll={requireAll}
        fallback={
          <div className="space-y-2">
            {label && (
              <Label className="text-sm font-medium text-muted-foreground">
                {label}
                {required && <span className="text-destructive ml-1">*</span>}
              </Label>
            )}
            <div className="opacity-50 pointer-events-none">
              {children}
            </div>
            {description && (
              <p className="text-sm text-muted-foreground">
                {description} (Read-only: insufficient permissions)
              </p>
            )}
          </div>
        }
      >
        {fieldContent}
      </PermissionGuard>
    );
  }

  return fieldContent;
}

/**
 * Permission-aware input field
 */
export function PermissionInput({
  permission,
  permissions,
  role,
  roles,
  requireAll,
  hideWhenNoAccess,
  readOnlyWhenNoAccess,
  fallback,
  label,
  description,
  required,
  ...inputProps
}: PermissionFormFieldProps & React.ComponentProps<typeof Input>) {
  return (
    <PermissionFormField
      permission={permission}
      permissions={permissions}
      role={role}
      roles={roles}
      requireAll={requireAll}
      hideWhenNoAccess={hideWhenNoAccess}
      readOnlyWhenNoAccess={readOnlyWhenNoAccess}
      fallback={fallback}
      label={label}
      description={description}
      required={required}
    >
      <Input {...inputProps} />
    </PermissionFormField>
  );
}

/**
 * Permission-aware textarea field
 */
export function PermissionTextarea({
  permission,
  permissions,
  role,
  roles,
  requireAll,
  hideWhenNoAccess,
  readOnlyWhenNoAccess,
  fallback,
  label,
  description,
  required,
  ...textareaProps
}: PermissionFormFieldProps & React.ComponentProps<typeof Textarea>) {
  return (
    <PermissionFormField
      permission={permission}
      permissions={permissions}
      role={role}
      roles={roles}
      requireAll={requireAll}
      hideWhenNoAccess={hideWhenNoAccess}
      readOnlyWhenNoAccess={readOnlyWhenNoAccess}
      fallback={fallback}
      label={label}
      description={description}
      required={required}
    >
      <Textarea {...textareaProps} />
    </PermissionFormField>
  );
}

/**
 * Permission-aware select field
 */
export function PermissionSelect({
  permission,
  permissions,
  role,
  roles,
  requireAll,
  hideWhenNoAccess,
  readOnlyWhenNoAccess,
  fallback,
  label,
  description,
  required,
  children,
  ...selectProps
}: PermissionFormFieldProps & React.ComponentProps<typeof Select>) {
  return (
    <PermissionFormField
      permission={permission}
      permissions={permissions}
      role={role}
      roles={roles}
      requireAll={requireAll}
      hideWhenNoAccess={hideWhenNoAccess}
      readOnlyWhenNoAccess={readOnlyWhenNoAccess}
      fallback={fallback}
      label={label}
      description={description}
      required={required}
    >
      <Select {...selectProps}>
        <SelectTrigger>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {children}
        </SelectContent>
      </Select>
    </PermissionFormField>
  );
}

/**
 * Permission-aware checkbox field
 */
export function PermissionCheckbox({
  permission,
  permissions,
  role,
  roles,
  requireAll,
  hideWhenNoAccess,
  readOnlyWhenNoAccess,
  fallback,
  label,
  description,
  required,
  ...checkboxProps
}: PermissionFormFieldProps & React.ComponentProps<typeof Checkbox>) {
  return (
    <PermissionFormField
      permission={permission}
      permissions={permissions}
      role={role}
      roles={roles}
      requireAll={requireAll}
      hideWhenNoAccess={hideWhenNoAccess}
      readOnlyWhenNoAccess={readOnlyWhenNoAccess}
      fallback={fallback}
      description={description}
      required={required}
    >
      <div className="flex items-center space-x-2">
        <Checkbox {...checkboxProps} />
        {label && (
          <Label htmlFor={checkboxProps.id} className="text-sm font-medium cursor-pointer">
            {label}
            {required && <span className="text-destructive ml-1">*</span>}
          </Label>
        )}
      </div>
    </PermissionFormField>
  );
}