'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useAdminPermissions, AdminPermissions } from '@/hooks/admin/use-admin-permissions';
import { cn } from '@/lib/utils';

interface PermissionButtonProps extends React.ComponentProps<typeof Button> {
  permission: keyof AdminPermissions;
  tooltip?: string;
  children: React.ReactNode;
}

/**
 * Button component that automatically disables based on permissions
 */
export function PermissionButton({ 
  permission, 
  tooltip, 
  children, 
  className,
  disabled,
  ...props 
}: PermissionButtonProps) {
  const { hasPermission } = useAdminPermissions();
  const hasAccess = hasPermission(permission);
  const isDisabled = disabled || !hasAccess;

  const button = (
    <Button
      {...props}
      disabled={isDisabled}
      className={cn(
        className,
        !hasAccess && 'opacity-50 cursor-not-allowed'
      )}
    >
      {children}
    </Button>
  );

  if (tooltip && !hasAccess) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            {button}
          </TooltipTrigger>
          <TooltipContent>
            <p>{tooltip}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return button;
}

interface PermissionLinkProps {
  permission: keyof AdminPermissions;
  href: string;
  children: React.ReactNode;
  className?: string;
  tooltip?: string;
}

/**
 * Link component that shows/hides based on permissions
 */
export function PermissionLink({ 
  permission, 
  href, 
  children, 
  className,
  tooltip 
}: PermissionLinkProps) {
  const { hasPermission } = useAdminPermissions();
  const hasAccess = hasPermission(permission);

  if (!hasAccess) {
    if (tooltip) {
      return (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <span className={cn('opacity-50 cursor-not-allowed', className)}>
                {children}
              </span>
            </TooltipTrigger>
            <TooltipContent>
              <p>{tooltip}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      );
    }
    return null;
  }

  return (
    <a href={href} className={className}>
      {children}
    </a>
  );
}

interface PermissionSectionProps {
  permission: keyof AdminPermissions;
  children: React.ReactNode;
  fallback?: React.ReactNode;
  className?: string;
}

/**
 * Section component that shows/hides based on permissions
 */
export function PermissionSection({ 
  permission, 
  children, 
  fallback,
  className 
}: PermissionSectionProps) {
  const { hasPermission } = useAdminPermissions();
  const hasAccess = hasPermission(permission);

  if (!hasAccess) {
    return fallback ? <div className={className}>{fallback}</div> : null;
  }

  return <div className={className}>{children}</div>;
}

interface AdminBadgeProps {
  className?: string;
}

/**
 * Badge component that shows admin status
 */
export function AdminBadge({ className }: AdminBadgeProps) {
  const { hasAdminAccess } = useAdminPermissions();

  if (!hasAdminAccess) {
    return null;
  }

  return (
    <span className={cn(
      'inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400',
      className
    )}>
      Admin
    </span>
  );
}

/**
 * Hook for getting permission-aware CSS classes
 */
export function usePermissionClasses() {
  const { hasPermission, hasAdminAccess } = useAdminPermissions();

  const getPermissionClasses = (permission: keyof AdminPermissions) => ({
    enabled: hasPermission(permission) ? 'opacity-100' : 'opacity-50 cursor-not-allowed',
    hidden: hasPermission(permission) ? 'block' : 'hidden',
    disabled: hasPermission(permission) ? '' : 'pointer-events-none',
  });

  const getAdminClasses = () => ({
    enabled: hasAdminAccess ? 'opacity-100' : 'opacity-50 cursor-not-allowed',
    hidden: hasAdminAccess ? 'block' : 'hidden',
    disabled: hasAdminAccess ? '' : 'pointer-events-none',
  });

  return {
    getPermissionClasses,
    getAdminClasses,
  };
}

/**
 * Hook for permission-aware form field props
 */
export function usePermissionFormProps() {
  const { hasPermission, hasAdminAccess } = useAdminPermissions();

  const getFieldProps = (permission: keyof AdminPermissions) => ({
    disabled: !hasPermission(permission),
    readOnly: !hasPermission(permission),
    'aria-disabled': !hasPermission(permission),
  });

  const getAdminFieldProps = () => ({
    disabled: !hasAdminAccess,
    readOnly: !hasAdminAccess,
    'aria-disabled': !hasAdminAccess,
  });

  return {
    getFieldProps,
    getAdminFieldProps,
  };
}