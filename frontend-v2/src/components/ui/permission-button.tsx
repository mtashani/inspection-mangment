'use client';

import React from 'react';
import { Button, ButtonProps } from '@/components/ui/button';

// Simplified permission button (middleware handles all permissions)
interface PermissionButtonProps extends ButtonProps {
  children: React.ReactNode;
}

/**
 * Simple button component (permission logic moved to middleware)
 */
export function PermissionButton({
  children,
  ...buttonProps
}: PermissionButtonProps) {
  return (
    <Button {...buttonProps}>
      {children}
    </Button>
  );
}

/**
 * Action button 
 */
export function ActionButton({
  children,
  ...props
}: PermissionButtonProps) {
  return (
    <PermissionButton {...props}>
      {children}
    </PermissionButton>
  );
}

/**
 * Create button
 */
export function CreateButton({
  children = 'Create',
  ...props
}: PermissionButtonProps) {
  return (
    <ActionButton {...props}>
      {children}
    </ActionButton>
  );
}

/**
 * Edit button
 */
export function EditButton({
  children = 'Edit',
  ...props
}: PermissionButtonProps) {
  return (
    <ActionButton {...props}>
      {children}
    </ActionButton>
  );
}

/**
 * Delete button
 */
export function DeleteButton({
  children = 'Delete',
  variant = 'destructive',
  ...props
}: PermissionButtonProps) {
  return (
    <ActionButton variant={variant} {...props}>
      {children}
    </ActionButton>
  );
}

/**
 * Approve button
 */
export function ApproveButton({
  children = 'Approve',
  variant = 'default',
  ...props
}: PermissionButtonProps) {
  return (
    <ActionButton variant={variant} {...props}>
      {children}
    </ActionButton>
  );
}