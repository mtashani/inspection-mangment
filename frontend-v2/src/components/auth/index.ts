// Auth components exports
export { ProtectedRoute } from './protected-route';
export { RoleBasedRoute } from './role-based-route';
export { PermissionGuard, usePermissionCheck } from './permission-guard';
export { AccessDenied, InlineAccessDenied } from './access-denied';

// Re-export existing auth components for convenience
export { AuthGuard } from '../auth-guard';