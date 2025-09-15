import { usePermissions as usePermissionContext } from '@/contexts/permission-context';
import { PermissionCheck, RESOURCES, ACTIONS } from '@/types/permissions';

/**
 * Hook for accessing permission checking functions
 * Provides convenient methods for checking user permissions
 */
export function usePermissions() {
  return usePermissionContext();
}

/**
 * Hook for role-based access control
 * Provides convenient methods for checking user roles
 */
export function useRoles() {
  const { roles, hasRole, hasAnyRole } = usePermissionContext();
  
  return {
    roles,
    hasRole,
    hasAnyRole,
    isAdmin: () => hasRole('Global Admin'),
    isManager: () => hasAnyRole([
      'Mechanical Manager',
      'NDT Manager', 
      'PSV Manager',
      'QC Manager'
    ]),
    isInspector: () => hasAnyRole([
      'NDT Inspector',
      'Mechanical Inspector',
      'PSV Inspector',
      'Corrosion Inspector',
      'Crane Inspector',
      'Electrical Inspector',
      'Instrumentation Inspector',
      'QC Inspector'
    ]),
    isOperator: () => hasRole('PSV Test Operator'),
  };
}

/**
 * Hook for specific resource permissions
 * Provides convenient methods for checking permissions on specific resources
 */
export function useResourcePermissions(resource: string) {
  const { hasPermission } = usePermissionContext();

  return {
    canCreate: () => hasPermission(resource, ACTIONS.CREATE),
    canView: () => hasPermission(resource, ACTIONS.VIEW),
    canEditOwn: () => hasPermission(resource, ACTIONS.EDIT_OWN),
    canEditAll: () => hasPermission(resource, ACTIONS.EDIT_ALL),
    canApprove: () => hasPermission(resource, ACTIONS.APPROVE),
    canFinalApprove: () => hasPermission(resource, ACTIONS.FINAL_APPROVE),
    canDeleteOwn: () => hasPermission(resource, ACTIONS.DELETE_OWN),
    canDeleteSection: () => hasPermission(resource, ACTIONS.DELETE_SECTION),
    canDeleteAll: () => hasPermission(resource, ACTIONS.DELETE_ALL),
    canManage: () => hasPermission(resource, ACTIONS.MANAGE),
  };
}

/**
 * Hook for PSV-specific permissions
 */
export function usePSVPermissions() {
  return useResourcePermissions(RESOURCES.PSV);
}

/**
 * Hook for NDT-specific permissions
 */
export function useNDTPermissions() {
  return useResourcePermissions(RESOURCES.NDT);
}

/**
 * Hook for Mechanical-specific permissions
 */
export function useMechanicalPermissions() {
  return useResourcePermissions(RESOURCES.MECHANICAL);
}

/**
 * Hook for Corrosion-specific permissions
 */
export function useCorrosionPermissions() {
  return useResourcePermissions(RESOURCES.CORROSION);
}

/**
 * Hook for Crane-specific permissions
 */
export function useCranePermissions() {
  return useResourcePermissions(RESOURCES.CRANE);
}

/**
 * Hook for Report-specific permissions
 */
export function useReportPermissions() {
  const { hasPermission } = usePermissionContext();

  return {
    ...useResourcePermissions(RESOURCES.REPORT),
    canQualityInspect: () => hasPermission(RESOURCES.QUALITY, ACTIONS.QUALITY_INSPECT),
    canQualityApprove: () => hasPermission(RESOURCES.QUALITY, ACTIONS.QUALITY_APPROVE),
  };
}

/**
 * Hook for Admin-specific permissions
 */
export function useAdminPermissions() {
  const { hasPermission } = usePermissionContext();

  return {
    ...useResourcePermissions(RESOURCES.ADMIN),
    canManageRoles: () => hasPermission(RESOURCES.ADMIN, ACTIONS.MANAGE_ROLES),
    canManagePermissions: () => hasPermission(RESOURCES.ADMIN, ACTIONS.MANAGE_PERMISSIONS),
    canViewRoles: () => hasPermission(RESOURCES.ADMIN, ACTIONS.VIEW_ROLES),
    canViewPermissions: () => hasPermission(RESOURCES.ADMIN, ACTIONS.VIEW_PERMISSIONS),
    canManageInspectors: () => hasPermission(RESOURCES.ADMIN, ACTIONS.MANAGE_INSPECTORS),
  };
}

/**
 * Hook for checking multiple permissions at once
 */
export function useMultiplePermissions(permissionChecks: PermissionCheck[]) {
  const { hasPermission, hasAnyPermission, hasAllPermissions } = usePermissionContext();

  return {
    hasAny: () => hasAnyPermission(permissionChecks),
    hasAll: () => hasAllPermissions(permissionChecks),
    individual: permissionChecks.map(({ resource, action }) => ({
      resource,
      action,
      hasPermission: hasPermission(resource, action),
    })),
  };
}

/**
 * Hook for conditional rendering based on permissions
 */
export function useConditionalRender() {
  const { hasPermission, hasRole } = usePermissionContext();

  return {
    renderIf: (condition: boolean, component: React.ReactNode) => 
      condition ? component : null,
    renderIfPermission: (resource: string, action: string, component: React.ReactNode) =>
      hasPermission(resource, action) ? component : null,
    renderIfRole: (roleName: string, component: React.ReactNode) =>
      hasRole(roleName) ? component : null,
    renderIfAny: (conditions: boolean[], component: React.ReactNode) =>
      conditions.some(Boolean) ? component : null,
    renderIfAll: (conditions: boolean[], component: React.ReactNode) =>
      conditions.every(Boolean) ? component : null,
  };
}