// Admin permission system exports
export { AdminPermissionGuard, AdminOnly } from './admin-permission-guard';
export { 
  PermissionGate, 
  MultiPermissionGate, 
  AdminAccessGate, 
  ConditionalRender,
  usePermissionBasedRendering 
} from './permission-based-rendering';
export { 
  PermissionButton, 
  PermissionLink, 
  PermissionSection, 
  AdminBadge,
  usePermissionClasses,
  usePermissionFormProps 
} from './admin-permission-utils';

// Re-export the hook for convenience
export { useAdminPermissions } from '@/hooks/admin/use-admin-permissions';
export type { AdminPermissions, UseAdminPermissionsReturn } from '@/hooks/admin/use-admin-permissions';