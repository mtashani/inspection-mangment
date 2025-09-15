/**
 * Permission System Types
 * Type definitions for the dynamic RBAC permission system
 */

// Core permission types
export interface Permission {
  id: number;
  name: string;
  resource: string;
  action: string;
  description: string | null;
  display_label: string;
  created_at: string;
  updated_at: string;
}

export interface Role {
  id: number;
  name: string;
  description: string | null;
  display_label: string;
  created_at: string;
  updated_at: string;
  permissions?: Permission[];
}

export interface InspectorRole {
  inspector_id: number;
  role_id: number;
  created_at: string;
  // Relationship data
  role: Role;
}

// Enhanced User interface with RBAC support - matches backend Inspector model
export interface RBACUser {
  id: number;
  username: string | null;
  email: string;
  first_name: string;
  last_name: string;
  employee_id: string;
  national_id: string;
  phone: string | null;
  
  // Educational Information
  education_degree: string | null;
  education_field: string | null;
  education_institute: string | null;
  graduation_year: number | null;
  
  // Experience and qualifications
  years_experience: number;
  previous_companies: string[];
  
  // Status and authentication
  active: boolean;
  can_login: boolean;
  last_login: string | null;
  
  // Profile information
  date_of_birth: string | null;
  birth_place: string | null;
  profile_image_url: string | null;
  marital_status: string | null;
  
  // Payroll information
  base_hourly_rate: number | null;
  overtime_multiplier: number | null;
  night_shift_multiplier: number | null;
  on_call_multiplier: number | null;
  
  attendance_tracking_enabled: boolean;
  
  // Timestamps
  created_at: string;
  updated_at: string;
  
  // RBAC data
  roles: string[];
  permissions: string[];
  inspector_roles?: InspectorRole[];
  
  // Computed properties for compatibility
  name: string; // computed from first_name + last_name
  is_active: boolean; // alias for active
  avatar?: string; // alias for profile_image_url
}

// Permission checking types
export type PermissionString = `${string}:${string}`;

export interface PermissionCheck {
  resource: string;
  action: string;
}

// Context types
export interface PermissionContextType {
  permissions: string[];
  roles: string[];
  hasPermission: (resource: string, action: string) => boolean;
  hasAnyPermission: (permissions: PermissionCheck[]) => boolean;
  hasAllPermissions: (permissions: PermissionCheck[]) => boolean;
  hasRole: (roleName: string) => boolean;
  hasAnyRole: (roleNames: string[]) => boolean;
  isLoading: boolean;
  refreshPermissions: () => Promise<void>;
}

// Resource and action constants for type safety
export const RESOURCES = {
  PSV: 'psv',
  NDT: 'ndt',
  MECHANICAL: 'mechanical',
  CORROSION: 'corrosion',
  CRANE: 'crane',
  ELECTRICAL: 'electrical',
  INSTRUMENTATION: 'instrumentation',
  REPORT: 'report',
  ADMIN: 'admin',
  QUALITY: 'quality',
  USER: 'user',
  INSPECTOR: 'inspector',
} as const;

export const ACTIONS = {
  CREATE: 'create',
  VIEW: 'view',
  EDIT_OWN: 'edit_own',
  EDIT_ALL: 'edit_all',
  APPROVE: 'approve',
  FINAL_APPROVE: 'final_approve',
  DELETE_OWN: 'delete_own',
  DELETE_SECTION: 'delete_section',
  DELETE_ALL: 'delete_all',
  MANAGE: 'manage',
  EXECUTE_TEST: 'execute_test',
  MANAGE_INSPECTORS: 'manage_inspectors',
  MANAGE_ROLES: 'manage_roles',
  MANAGE_PERMISSIONS: 'manage_permissions',
  VIEW_ROLES: 'view_roles',
  VIEW_PERMISSIONS: 'view_permissions',
  QUALITY_INSPECT: 'quality_inspect',
  QUALITY_APPROVE: 'quality_approve',
} as const;

// Standard role names
export const STANDARD_ROLES = {
  GLOBAL_ADMIN: 'Global Admin',
  MECHANICAL_MANAGER: 'Mechanical Manager',
  NDT_MANAGER: 'NDT Manager',
  PSV_MANAGER: 'PSV Manager',
  QC_MANAGER: 'QC Manager',
  QC_INSPECTOR: 'QC Inspector',
  NDT_INSPECTOR: 'NDT Inspector',
  MECHANICAL_INSPECTOR: 'Mechanical Inspector',
  PSV_INSPECTOR: 'PSV Inspector',
  CORROSION_INSPECTOR: 'Corrosion Inspector',
  CRANE_INSPECTOR: 'Crane Inspector',
  ELECTRICAL_INSPECTOR: 'Electrical Inspector',
  INSTRUMENTATION_INSPECTOR: 'Instrumentation Inspector',
  PSV_TEST_OPERATOR: 'PSV Test Operator',
} as const;

// Permission utility types
export type ResourceType = typeof RESOURCES[keyof typeof RESOURCES];
export type ActionType = typeof ACTIONS[keyof typeof ACTIONS];
export type StandardRole = typeof STANDARD_ROLES[keyof typeof STANDARD_ROLES];

// UI-related permission types
export interface ProtectedComponentProps {
  permission?: PermissionCheck;
  permissions?: PermissionCheck[];
  role?: string;
  roles?: string[];
  requireAll?: boolean;
  fallback?: React.ReactNode;
  children: React.ReactNode;
}

export interface NavigationItem {
  title: string;
  href: string;
  icon?: string;
  permission?: PermissionCheck;
  role?: string;
  children?: NavigationItem[];
}

// Form and dropdown filtering types
export interface FilteredOption {
  value: string | number;
  label: string;
  disabled?: boolean;
  permission?: PermissionCheck;
}

// Audit and logging types
export interface PermissionAuditLog {
  id: string;
  user_id: number;
  username: string;
  action: 'PERMISSION_CHECK' | 'ACCESS_GRANTED' | 'ACCESS_DENIED';
  resource: string;
  action_type: string;
  success: boolean;
  ip_address?: string;
  user_agent?: string;
  created_at: string;
}