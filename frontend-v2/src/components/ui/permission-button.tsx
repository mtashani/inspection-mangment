'use client';

import React from 'react';
import { Button, ButtonProps } from '@/components/ui/button';
import { PermissionGuard } from '@/components/auth/permission-guard';
import { ProtectedComponentProps } from '@/types/permissions';

interface PermissionButtonProps extends ButtonProps, Omit<ProtectedComponentProps, 'children'> {
  children: React.ReactNode;
  hideWhenNoAccess?: boolean;
  disableWhenNoAccess?: boolean;
  fallbackText?: string;
}

/**
 * Button component that shows/hides or enables/disables based on permissions
 */
export function PermissionButton({
  children,
  permission,
  permissions,
  role,
  roles,
  requireAll = false,
  hideWhenNoAccess = false,
  disableWhenNoAccess = true,
  fallbackText,
  fallback,
  ...buttonProps
}: PermissionButtonProps) {
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
        <Button {...buttonProps}>
          {children}
        </Button>
      </PermissionGuard>
    );
  }

  if (disableWhenNoAccess) {
    return (
      <PermissionGuard
        permission={permission}
        permissions={permissions}
        role={role}
        roles={roles}
        requireAll={requireAll}
        fallback={
          <Button {...buttonProps} disabled title="You don't have permission to perform this action">
            {fallbackText || children}
          </Button>
        }
      >
        <Button {...buttonProps}>
          {children}
        </Button>
      </PermissionGuard>
    );
  }

  return (
    <Button {...buttonProps}>
      {children}
    </Button>
  );
}

/**
 * Action button with built-in permission checking
 */
export function ActionButton({
  action,
  resource,
  children,
  ...props
}: Omit<PermissionButtonProps, 'permission'> & {
  action: string;
  resource: string;
}) {
  return (
    <PermissionButton
      permission={{ resource, action }}
      {...props}
    >
      {children}
    </PermissionButton>
  );
}

/**
 * Create button - shorthand for create permission
 */
export function CreateButton({
  resource,
  children = 'Create',
  ...props
}: Omit<PermissionButtonProps, 'permission'> & {
  resource: string;
}) {
  return (
    <ActionButton
      action="create"
      resource={resource}
      {...props}
    >
      {children}
    </ActionButton>
  );
}

/**
 * Edit button - shorthand for edit permission
 */
export function EditButton({
  resource,
  isOwn = false,
  children = 'Edit',
  ...props
}: Omit<PermissionButtonProps, 'permission'> & {
  resource: string;
  isOwn?: boolean;
}) {
  return (
    <ActionButton
      action={isOwn ? 'edit_own' : 'edit_all'}
      resource={resource}
      {...props}
    >
      {children}
    </ActionButton>
  );
}

/**
 * Delete button - shorthand for delete permission
 */
export function DeleteButton({
  resource,
  scope = 'own',
  children = 'Delete',
  variant = 'destructive',
  ...props
}: Omit<PermissionButtonProps, 'permission' | 'variant'> & {
  resource: string;
  scope?: 'own' | 'section' | 'all';
  variant?: ButtonProps['variant'];
}) {
  const actionMap = {
    own: 'delete_own',
    section: 'delete_section',
    all: 'delete_all',
  };

  return (
    <ActionButton
      action={actionMap[scope]}
      resource={resource}
      variant={variant}
      {...props}
    >
      {children}
    </ActionButton>
  );
}

/**
 * Approve button - shorthand for approve permission
 */
export function ApproveButton({
  resource,
  isFinal = false,
  children = 'Approve',
  variant = 'default',
  ...props
}: Omit<PermissionButtonProps, 'permission' | 'variant'> & {
  resource: string;
  isFinal?: boolean;
  variant?: ButtonProps['variant'];
}) {
  return (
    <ActionButton
      action={isFinal ? 'final_approve' : 'approve'}
      resource={resource}
      variant={variant}
      {...props}
    >
      {children}
    </ActionButton>
  );
}