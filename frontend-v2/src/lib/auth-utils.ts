import { User } from './auth';
import { RBACUser } from '@/types/permissions';
import { snakeToCamelObject } from './utils/transform';

/**
 * Transform backend inspector response to frontend User format
 */
export function transformInspectorToUser(inspector: any): User {
  // First transform snake_case to camelCase
  const camelCaseInspector = snakeToCamelObject(inspector);
  
  return {
    id: camelCaseInspector.id,
    username: camelCaseInspector.username,
    email: camelCaseInspector.email,
    name: camelCaseInspector.name || `${camelCaseInspector.firstName || ''} ${camelCaseInspector.lastName || ''}`.trim(),
    roles: camelCaseInspector.roles || [],
    is_active: camelCaseInspector.isActive ?? camelCaseInspector.active ?? true,
    employee_id: camelCaseInspector.employeeId,
    
    // Optional fields
    first_name: camelCaseInspector.firstName,
    last_name: camelCaseInspector.lastName,
    phone: camelCaseInspector.phone,
    profile_image_url: camelCaseInspector.profileImageUrl,
    active: camelCaseInspector.active,
    can_login: camelCaseInspector.canLogin,
    
    // Backward compatibility
    avatar: camelCaseInspector.profileImageUrl || camelCaseInspector.avatar,
  };
}

/**
 * Transform backend inspector response to RBACUser format
 */
export function transformInspectorToRBACUser(inspector: any): RBACUser {
  // First transform snake_case to camelCase
  const camelCaseInspector = snakeToCamelObject(inspector);
  
  return {
    id: camelCaseInspector.id,
    username: camelCaseInspector.username,
    email: camelCaseInspector.email,
    first_name: camelCaseInspector.firstName || '',
    last_name: camelCaseInspector.lastName || '',
    employee_id: camelCaseInspector.employeeId,
    national_id: camelCaseInspector.nationalId || '',
    phone: camelCaseInspector.phone,
    
    // Educational Information
    education_degree: camelCaseInspector.educationDegree,
    education_field: camelCaseInspector.educationField,
    education_institute: camelCaseInspector.educationInstitute,
    graduation_year: camelCaseInspector.graduationYear,
    
    // Experience and qualifications
    years_experience: camelCaseInspector.yearsExperience || 0,
    previous_companies: camelCaseInspector.previousCompanies || [],
    
    // Status and authentication
    active: camelCaseInspector.active ?? true,
    can_login: camelCaseInspector.canLogin ?? false,
    last_login: camelCaseInspector.lastLogin,
    
    // Profile information
    date_of_birth: camelCaseInspector.dateOfBirth,
    birth_place: camelCaseInspector.birthPlace,
    profile_image_url: camelCaseInspector.profileImageUrl,
    marital_status: camelCaseInspector.maritalStatus,
    
    // Payroll information
    base_hourly_rate: camelCaseInspector.baseHourlyRate,
    overtime_multiplier: camelCaseInspector.overtimeMultiplier,
    night_shift_multiplier: camelCaseInspector.nightShiftMultiplier,
    on_call_multiplier: camelCaseInspector.onCallMultiplier,
    
    attendance_tracking_enabled: camelCaseInspector.attendanceTrackingEnabled ?? false,
    
    // Timestamps
    created_at: camelCaseInspector.createdAt,
    updated_at: camelCaseInspector.updatedAt,
    
    // RBAC data
    roles: camelCaseInspector.roles || [],
    permissions: camelCaseInspector.permissions || [],
    inspector_roles: camelCaseInspector.inspectorRoles,
    
    // Computed properties
    name: camelCaseInspector.name || `${camelCaseInspector.firstName || ''} ${camelCaseInspector.lastName || ''}`.trim(),
    is_active: camelCaseInspector.isActive ?? camelCaseInspector.active ?? true,
    avatar: camelCaseInspector.profileImageUrl || camelCaseInspector.avatar,
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