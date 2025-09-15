import { User } from './auth';
import { RBACUser } from '@/types/permissions';

/**
 * Transform backend inspector response to frontend User format
 */
export function transformInspectorToUser(inspector: any): User {
  return {
    id: inspector.id,
    username: inspector.username,
    email: inspector.email,
    name: inspector.name || `${inspector.first_name || ''} ${inspector.last_name || ''}`.trim(),
    roles: inspector.roles || [],
    is_active: inspector.is_active ?? inspector.active ?? true,
    employee_id: inspector.employee_id,
    
    // Optional fields
    first_name: inspector.first_name,
    last_name: inspector.last_name,
    phone: inspector.phone,
    profile_image_url: inspector.profile_image_url,
    active: inspector.active,
    can_login: inspector.can_login,
    
    // Backward compatibility
    avatar: inspector.profile_image_url || inspector.avatar,
  };
}

/**
 * Transform backend inspector response to RBACUser format
 */
export function transformInspectorToRBACUser(inspector: any): RBACUser {
  return {
    id: inspector.id,
    username: inspector.username,
    email: inspector.email,
    first_name: inspector.first_name || '',
    last_name: inspector.last_name || '',
    employee_id: inspector.employee_id,
    national_id: inspector.national_id || '',
    phone: inspector.phone,
    
    // Educational Information
    education_degree: inspector.education_degree,
    education_field: inspector.education_field,
    education_institute: inspector.education_institute,
    graduation_year: inspector.graduation_year,
    
    // Experience and qualifications
    years_experience: inspector.years_experience || 0,
    previous_companies: inspector.previous_companies || [],
    
    // Status and authentication
    active: inspector.active ?? true,
    can_login: inspector.can_login ?? false,
    last_login: inspector.last_login,
    
    // Profile information
    date_of_birth: inspector.date_of_birth,
    birth_place: inspector.birth_place,
    profile_image_url: inspector.profile_image_url,
    marital_status: inspector.marital_status,
    
    // Payroll information
    base_hourly_rate: inspector.base_hourly_rate,
    overtime_multiplier: inspector.overtime_multiplier,
    night_shift_multiplier: inspector.night_shift_multiplier,
    on_call_multiplier: inspector.on_call_multiplier,
    
    attendance_tracking_enabled: inspector.attendance_tracking_enabled ?? false,
    
    // Timestamps
    created_at: inspector.created_at,
    updated_at: inspector.updated_at,
    
    // RBAC data
    roles: inspector.roles || [],
    permissions: inspector.permissions || [],
    inspector_roles: inspector.inspector_roles,
    
    // Computed properties
    name: inspector.name || `${inspector.first_name || ''} ${inspector.last_name || ''}`.trim(),
    is_active: inspector.is_active ?? inspector.active ?? true,
    avatar: inspector.profile_image_url || inspector.avatar,
  };
}

/**
 * Extract permissions from JWT token payload
 */
export function extractPermissionsFromToken(token: string): { roles: string[]; permissions: string[] } {
  try {
    // Decode JWT token (without verification - this is just for extracting data)
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    
    const payload = JSON.parse(jsonPayload);
    
    return {
      roles: payload.roles || [],
      permissions: payload.permissions || [],
    };
  } catch (error) {
    console.warn('Failed to extract permissions from token:', error);
    return { roles: [], permissions: [] };
  }
}

/**
 * Check if user has a specific permission
 */
export function hasPermission(
  permissions: string[],
  resource: string,
  action: string
): boolean {
  const permissionString = `${resource}:${action}`;
  return permissions.includes(permissionString);
}

/**
 * Check if user has a specific role
 */
export function hasRole(roles: string[], roleName: string): boolean {
  return roles.includes(roleName);
}

/**
 * Get user's full name from first and last name
 */
export function getFullName(firstName?: string, lastName?: string): string {
  return `${firstName || ''} ${lastName || ''}`.trim() || 'Unknown User';
}

/**
 * Check if user is admin
 */
export function isAdmin(roles: string[]): boolean {
  return roles.some(role => role.toLowerCase().includes('admin'));
}

/**
 * Check if user is manager
 */
export function isManager(roles: string[]): boolean {
  return roles.some(role => role.toLowerCase().includes('manager'));
}

/**
 * Check if user is inspector
 */
export function isInspector(roles: string[]): boolean {
  return roles.some(role => role.toLowerCase().includes('inspector'));
}