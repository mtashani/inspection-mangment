'use client';

import React from 'react';
import { Badge, BadgeProps } from '@/components/ui/badge';
import { PermissionGuard } from '@/components/auth/permission-guard';
import { ProtectedComponentProps } from '@/types/permissions';
import { Shield, Lock, Eye, EyeOff } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PermissionBadgeProps extends BadgeProps, Omit<ProtectedComponentProps, 'children'> {
  children: React.ReactNode;
  showPermissionIcon?: boolean;
  permissionIconPosition?: 'left' | 'right';
  hideWhenNoAccess?: boolean;
}

/**
 * Badge component that shows/hides based on permissions
 */
export function PermissionBadge({
  children,
  permission,
  permissions,
  role,
  roles,
  requireAll = false,
  showPermissionIcon = false,
  permissionIconPosition = 'left',
  hideWhenNoAccess = true,
  fallback,
  className,
  ...badgeProps
}: PermissionBadgeProps) {
  const badgeContent = (
    <Badge className={cn('flex items-center gap-1', className)} {...badgeProps}>
      {showPermissionIcon && permissionIconPosition === 'left' && (
        <Shield className="w-3 h-3" />
      )}
      {children}
      {showPermissionIcon && permissionIconPosition === 'right' && (
        <Shield className="w-3 h-3" />
      )}
    </Badge>
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
        {badgeContent}
      </PermissionGuard>
    );
  }

  return badgeContent;
}

/**
 * Status badge that changes appearance based on permissions
 */
export function StatusBadge({
  status,
  canEdit = false,
  editPermission,
  className,
  ...props
}: Omit<PermissionBadgeProps, 'children'> & {
  status: string;
  canEdit?: boolean;
  editPermission?: { resource: string; action: string };
}) {
  const getStatusVariant = (status: string): BadgeProps['variant'] => {
    switch (status.toLowerCase()) {
      case 'active':
      case 'approved':
      case 'completed':
        return 'default';
      case 'pending':
      case 'in_progress':
        return 'secondary';
      case 'rejected':
      case 'failed':
      case 'inactive':
        return 'destructive';
      case 'draft':
        return 'outline';
      default:
        return 'secondary';
    }
  };

  return (
    <div className="flex items-center gap-2">
      <Badge variant={getStatusVariant(status)} className={className} {...props}>
        {status}
      </Badge>
      {canEdit && editPermission && (
        <PermissionGuard permission={editPermission}>
          <Badge variant="outline" className="text-xs cursor-pointer hover:bg-muted">
            <Eye className="w-3 h-3 mr-1" />
            Editable
          </Badge>
        </PermissionGuard>
      )}
    </div>
  );
}

/**
 * Permission indicator badge
 */
export function PermissionIndicator({
  hasAccess,
  accessType = 'view',
  showText = true,
  size = 'sm',
}: {
  hasAccess: boolean;
  accessType?: 'view' | 'edit' | 'delete' | 'approve';
  showText?: boolean;
  size?: 'sm' | 'md' | 'lg';
}) {
  const getIcon = () => {
    if (hasAccess) {
      switch (accessType) {
        case 'view':
          return <Eye className="w-3 h-3" />;
        case 'edit':
          return <Shield className="w-3 h-3" />;
        case 'delete':
          return <Lock className="w-3 h-3" />;
        case 'approve':
          return <Shield className="w-3 h-3" />;
        default:
          return <Eye className="w-3 h-3" />;
      }
    } else {
      return <EyeOff className="w-3 h-3" />;
    }
  };

  const getText = () => {
    if (hasAccess) {
      switch (accessType) {
        case 'view':
          return 'Can View';
        case 'edit':
          return 'Can Edit';
        case 'delete':
          return 'Can Delete';
        case 'approve':
          return 'Can Approve';
        default:
          return 'Has Access';
      }
    } else {
      return 'No Access';
    }
  };

  const sizeClasses = {
    sm: 'text-xs px-1.5 py-0.5',
    md: 'text-sm px-2 py-1',
    lg: 'text-base px-3 py-1.5',
  };

  return (
    <Badge
      variant={hasAccess ? 'default' : 'secondary'}
      className={cn(
        'flex items-center gap-1',
        sizeClasses[size],
        !hasAccess && 'opacity-60'
      )}
    >
      {getIcon()}
      {showText && <span>{getText()}</span>}
    </Badge>
  );
}

/**
 * Role badge component
 */
export function RoleBadge({
  role,
  showIcon = true,
  variant = 'secondary',
  className,
  ...props
}: BadgeProps & {
  role: string;
  showIcon?: boolean;
}) {
  const getRoleColor = (role: string): BadgeProps['variant'] => {
    if (role.toLowerCase().includes('admin')) return 'destructive';
    if (role.toLowerCase().includes('manager')) return 'default';
    if (role.toLowerCase().includes('inspector')) return 'secondary';
    if (role.toLowerCase().includes('operator')) return 'outline';
    return variant;
  };

  return (
    <Badge
      variant={getRoleColor(role)}
      className={cn('flex items-center gap-1', className)}
      {...props}
    >
      {showIcon && <Shield className="w-3 h-3" />}
      {role}
    </Badge>
  );
}

/**
 * Permission level indicator
 */
export function PermissionLevel({
  level,
  showLabel = true,
}: {
  level: 'none' | 'view' | 'edit' | 'full';
  showLabel?: boolean;
}) {
  const getLevelConfig = (level: string) => {
    switch (level) {
      case 'none':
        return {
          variant: 'secondary' as const,
          color: 'bg-gray-500',
          label: 'No Access',
          icon: <EyeOff className="w-3 h-3" />,
        };
      case 'view':
        return {
          variant: 'outline' as const,
          color: 'bg-blue-500',
          label: 'View Only',
          icon: <Eye className="w-3 h-3" />,
        };
      case 'edit':
        return {
          variant: 'secondary' as const,
          color: 'bg-yellow-500',
          label: 'Can Edit',
          icon: <Shield className="w-3 h-3" />,
        };
      case 'full':
        return {
          variant: 'default' as const,
          color: 'bg-green-500',
          label: 'Full Access',
          icon: <Shield className="w-3 h-3" />,
        };
      default:
        return {
          variant: 'secondary' as const,
          color: 'bg-gray-500',
          label: 'Unknown',
          icon: <Lock className="w-3 h-3" />,
        };
    }
  };

  const config = getLevelConfig(level);

  return (
    <div className="flex items-center gap-2">
      <div className={cn('w-2 h-2 rounded-full', config.color)} />
      <Badge variant={config.variant} className="flex items-center gap-1">
        {config.icon}
        {showLabel && config.label}
      </Badge>
    </div>
  );
}