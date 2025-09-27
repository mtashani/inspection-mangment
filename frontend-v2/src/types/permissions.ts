/**
 * Standardized Permission System Types
 * This module defines TypeScript types for the 23 standardized permissions
 */

// System-level permissions
export const SYSTEM_PERMISSIONS = {
  SYSTEM_SUPERADMIN: 'system_superadmin',
  SYSTEM_HR_MANAGE: 'system_hr_manage',
} as const;

// Technical domain permissions (view, edit, approve pattern)
export const TECHNICAL_PERMISSIONS = {
  // Mechanical
  MECHANICAL_VIEW: 'mechanical_view',
  MECHANICAL_EDIT: 'mechanical_edit',
  MECHANICAL_APPROVE: 'mechanical_approve',
  
  // Corrosion
  CORROSION_VIEW: 'corrosion_view',
  CORROSION_EDIT: 'corrosion_edit',
  CORROSION_APPROVE: 'corrosion_approve',
  
  // NDT
  NDT_VIEW: 'ndt_view',
  NDT_EDIT: 'ndt_edit',
  NDT_APPROVE: 'ndt_approve',
  
  // Electrical
  ELECTRICAL_VIEW: 'electrical_view',
  ELECTRICAL_EDIT: 'electrical_edit',
  ELECTRICAL_APPROVE: 'electrical_approve',
  
  // Instrumentation
  INSTRUMENT_VIEW: 'instrument_view',
  INSTRUMENT_EDIT: 'instrument_edit',
  INSTRUMENT_APPROVE: 'instrument_approve',
  
  // Quality Control
  QUALITY_VIEW: 'quality_view',
  QUALITY_EDIT: 'quality_edit',
  QUALITY_APPROVE: 'quality_approve',
  
  // Maintenance
  MAINTENANCE_VIEW: 'maintenance_view',
  MAINTENANCE_EDIT: 'maintenance_edit',
  MAINTENANCE_APPROVE: 'maintenance_approve',
} as const;

// Combined standardized permissions (exactly 23 permissions)
export const STANDARDIZED_PERMISSIONS = {
  ...SYSTEM_PERMISSIONS,
  ...TECHNICAL_PERMISSIONS,
} as const;

// Type definitions
export type SystemPermission = typeof SYSTEM_PERMISSIONS[keyof typeof SYSTEM_PERMISSIONS];
export type TechnicalPermission = typeof TECHNICAL_PERMISSIONS[keyof typeof TECHNICAL_PERMISSIONS];
export type StandardizedPermission = typeof STANDARDIZED_PERMISSIONS[keyof typeof STANDARDIZED_PERMISSIONS];

// Permission categories
export type PermissionCategory = 'system' | 'technical';

// Domain types
export type Domain = 
  | 'system'
  | 'hr'
  | 'mechanical'
  | 'corrosion'
  | 'ndt'
  | 'electrical'
  | 'instrument'
  | 'quality'
  | 'maintenance';

// Action types
export type Action = 'view' | 'edit' | 'approve' | 'superadmin' | 'manage';

// Permission definition interface
export interface PermissionDefinition {
  name: StandardizedPermission;
  display_name: string;
  description: string;
  category: PermissionCategory;
  domain: Domain;
}

// Role interface
export interface Role {
  id: number;
  name: string;
  description: string;
  display_label: string;
  permissions: StandardizedPermission[];
  created_at: string;
  updated_at: string;
}

// Inspector role assignment interface
export interface InspectorRole {
  inspector_id: number;
  role_id: number;
  role: Role;
  created_at: string;
}

// Permission check result interface
export interface PermissionCheckResult {
  hasPermission: boolean;
  permission: StandardizedPermission;
  inspector_id: number;
  message?: string;
}

// Permission definitions with metadata
export const PERMISSION_DEFINITIONS: Record<StandardizedPermission, PermissionDefinition> = {
  // System permissions
  system_superadmin: {
    name: 'system_superadmin',
    display_name: 'System Super Admin',
    description: 'Full system administration access including user management, system configuration, and all domain access',
    category: 'system',
    domain: 'system'
  },
  system_hr_manage: {
    name: 'system_hr_manage',
    display_name: 'HR Management',
    description: 'Human resources management including inspector management, attendance, and payroll',
    category: 'system',
    domain: 'hr'
  },
  
  // Mechanical domain
  mechanical_view: {
    name: 'mechanical_view',
    display_name: 'Mechanical View',
    description: 'View mechanical inspection reports and data',
    category: 'technical',
    domain: 'mechanical'
  },
  mechanical_edit: {
    name: 'mechanical_edit',
    display_name: 'Mechanical Edit',
    description: 'Create and edit mechanical inspection reports',
    category: 'technical',
    domain: 'mechanical'
  },
  mechanical_approve: {
    name: 'mechanical_approve',
    display_name: 'Mechanical Approve',
    description: 'Approve and finalize mechanical inspection reports',
    category: 'technical',
    domain: 'mechanical'
  },
  
  // Corrosion domain
  corrosion_view: {
    name: 'corrosion_view',
    display_name: 'Corrosion View',
    description: 'View corrosion inspection reports and monitoring data',
    category: 'technical',
    domain: 'corrosion'
  },
  corrosion_edit: {
    name: 'corrosion_edit',
    display_name: 'Corrosion Edit',
    description: 'Create and edit corrosion inspection reports and monitoring data',
    category: 'technical',
    domain: 'corrosion'
  },
  corrosion_approve: {
    name: 'corrosion_approve',
    display_name: 'Corrosion Approve',
    description: 'Approve and finalize corrosion inspection reports',
    category: 'technical',
    domain: 'corrosion'
  },
  
  // NDT domain
  ndt_view: {
    name: 'ndt_view',
    display_name: 'NDT View',
    description: 'View non-destructive testing reports and results',
    category: 'technical',
    domain: 'ndt'
  },
  ndt_edit: {
    name: 'ndt_edit',
    display_name: 'NDT Edit',
    description: 'Create and edit non-destructive testing reports',
    category: 'technical',
    domain: 'ndt'
  },
  ndt_approve: {
    name: 'ndt_approve',
    display_name: 'NDT Approve',
    description: 'Approve and finalize non-destructive testing reports',
    category: 'technical',
    domain: 'ndt'
  },
  
  // Electrical domain
  electrical_view: {
    name: 'electrical_view',
    display_name: 'Electrical View',
    description: 'View electrical inspection reports and testing data',
    category: 'technical',
    domain: 'electrical'
  },
  electrical_edit: {
    name: 'electrical_edit',
    display_name: 'Electrical Edit',
    description: 'Create and edit electrical inspection reports',
    category: 'technical',
    domain: 'electrical'
  },
  electrical_approve: {
    name: 'electrical_approve',
    display_name: 'Electrical Approve',
    description: 'Approve and finalize electrical inspection reports',
    category: 'technical',
    domain: 'electrical'
  },
  
  // Instrumentation domain
  instrument_view: {
    name: 'instrument_view',
    display_name: 'Instrumentation View',
    description: 'View instrumentation inspection reports and calibration data',
    category: 'technical',
    domain: 'instrument'
  },
  instrument_edit: {
    name: 'instrument_edit',
    display_name: 'Instrumentation Edit',
    description: 'Create and edit instrumentation inspection reports',
    category: 'technical',
    domain: 'instrument'
  },
  instrument_approve: {
    name: 'instrument_approve',
    display_name: 'Instrumentation Approve',
    description: 'Approve and finalize instrumentation inspection reports',
    category: 'technical',
    domain: 'instrument'
  },
  
  // Quality domain
  quality_view: {
    name: 'quality_view',
    display_name: 'Quality View',
    description: 'View quality control reports and inspection data',
    category: 'technical',
    domain: 'quality'
  },
  quality_edit: {
    name: 'quality_edit',
    display_name: 'Quality Edit',
    description: 'Create and edit quality control reports',
    category: 'technical',
    domain: 'quality'
  },
  quality_approve: {
    name: 'quality_approve',
    display_name: 'Quality Approve',
    description: 'Approve and finalize quality control reports',
    category: 'technical',
    domain: 'quality'
  },
  
  // Maintenance domain
  maintenance_view: {
    name: 'maintenance_view',
    display_name: 'Maintenance View',
    description: 'View maintenance events and inspection plans',
    category: 'technical',
    domain: 'maintenance'
  },
  maintenance_edit: {
    name: 'maintenance_edit',
    display_name: 'Maintenance Edit',
    description: 'Create and edit maintenance events and plans',
    category: 'technical',
    domain: 'maintenance'
  },
  maintenance_approve: {
    name: 'maintenance_approve',
    display_name: 'Maintenance Approve',
    description: 'Approve and finalize maintenance events and plans',
    category: 'technical',
    domain: 'maintenance'
  },
};

// Utility functions
export function getAllStandardizedPermissions(): StandardizedPermission[] {
  return Object.values(STANDARDIZED_PERMISSIONS);
}

export function getPermissionDefinition(permission: StandardizedPermission): PermissionDefinition | undefined {
  return PERMISSION_DEFINITIONS[permission];
}

export function getPermissionsByCategory(category: PermissionCategory): StandardizedPermission[] {
  return getAllStandardizedPermissions().filter(
    permission => PERMISSION_DEFINITIONS[permission].category === category
  );
}

export function getPermissionsByDomain(domain: Domain): StandardizedPermission[] {
  return getAllStandardizedPermissions().filter(
    permission => PERMISSION_DEFINITIONS[permission].domain === domain
  );
}

export function validatePermission(permission: string): permission is StandardizedPermission {
  return getAllStandardizedPermissions().includes(permission as StandardizedPermission);
}

export function isSystemPermission(permission: StandardizedPermission): permission is SystemPermission {
  return Object.values(SYSTEM_PERMISSIONS).includes(permission as SystemPermission);
}

export function isTechnicalPermission(permission: StandardizedPermission): permission is TechnicalPermission {
  return Object.values(TECHNICAL_PERMISSIONS).includes(permission as TechnicalPermission);
}

// Domain-specific permission helpers
export function getMechanicalPermissions(): StandardizedPermission[] {
  return getPermissionsByDomain('mechanical');
}

export function getCorrosionPermissions(): StandardizedPermission[] {
  return getPermissionsByDomain('corrosion');
}

export function getNDTPermissions(): StandardizedPermission[] {
  return getPermissionsByDomain('ndt');
}

export function getElectricalPermissions(): StandardizedPermission[] {
  return getPermissionsByDomain('electrical');
}

export function getInstrumentPermissions(): StandardizedPermission[] {
  return getPermissionsByDomain('instrument');
}

export function getQualityPermissions(): StandardizedPermission[] {
  return getPermissionsByDomain('quality');
}

export function getMaintenancePermissions(): StandardizedPermission[] {
  return getPermissionsByDomain('maintenance');
}

// Permission checking helpers
export function hasViewPermission(permissions: StandardizedPermission[], domain: Domain): boolean {
  const viewPermission = `${domain}_view` as StandardizedPermission;
  return permissions.includes(viewPermission);
}

export function hasEditPermission(permissions: StandardizedPermission[], domain: Domain): boolean {
  const editPermission = `${domain}_edit` as StandardizedPermission;
  return permissions.includes(editPermission);
}

export function hasApprovePermission(permissions: StandardizedPermission[], domain: Domain): boolean {
  const approvePermission = `${domain}_approve` as StandardizedPermission;
  return permissions.includes(approvePermission);
}

export function hasSuperAdminPermission(permissions: StandardizedPermission[]): boolean {
  return permissions.includes('system_superadmin');
}

export function hasHRManagePermission(permissions: StandardizedPermission[]): boolean {
  return permissions.includes('system_hr_manage');
}

// Migration mapping from old permissions to standardized permissions
export const PERMISSION_MIGRATION_MAP: Record<string, StandardizedPermission> = {
  // Admin permissions
  'admin_manage': 'system_superadmin',
  'admin_manage_roles': 'system_superadmin',
  'admin_manage_permissions': 'system_superadmin',
  'admin_view_roles': 'system_superadmin',
  'admin_view_permissions': 'system_superadmin',
  'admin_manage_inspectors': 'system_hr_manage',
  
  // Inspector permissions
  'inspector_create': 'system_hr_manage',
  'inspector_view': 'system_hr_manage',
  'inspector_edit_all': 'system_hr_manage',
  'inspector_delete_all': 'system_hr_manage',
  
  // PSV permissions (map to mechanical)
  'psv_create': 'mechanical_edit',
  'psv_view': 'mechanical_view',
  'psv_edit_own': 'mechanical_edit',
  'psv_edit_all': 'mechanical_edit',
  'psv_approve': 'mechanical_approve',
  'psv_delete_own': 'mechanical_edit',
  'psv_delete_all': 'mechanical_edit',
  'psv_execute_test': 'mechanical_edit',
  
  // NDT permissions
  'ndt_create': 'ndt_edit',
  'ndt_view': 'ndt_view',
  'ndt_edit_own': 'ndt_edit',
  'ndt_edit_all': 'ndt_edit',
  'ndt_approve': 'ndt_approve',
  'ndt_delete_own': 'ndt_edit',
  'ndt_delete_all': 'ndt_edit',
  
  // Mechanical permissions
  'mechanical_create': 'mechanical_edit',
  'mechanical_view': 'mechanical_view',
  'mechanical_edit_own': 'mechanical_edit',
  'mechanical_edit_all': 'mechanical_edit',
  'mechanical_approve': 'mechanical_approve',
  'mechanical_delete_own': 'mechanical_edit',
  'mechanical_delete_all': 'mechanical_edit',
  
  // Quality permissions
  'quality_inspect': 'quality_edit',
  'quality_approve': 'quality_approve',
  
  // Report permissions (map to appropriate domains)
  'report_create': 'mechanical_edit',
  'report_view': 'mechanical_view',
  'report_approve': 'mechanical_approve',
  'report_final_approve': 'mechanical_approve',
  
  // Maintenance permissions
  'maintenance_create': 'maintenance_edit',
  'maintenance_view': 'maintenance_view',
  'maintenance_edit_own': 'maintenance_edit',
  'maintenance_edit_all': 'maintenance_edit',
  'maintenance_approve': 'maintenance_approve',
  'maintenance_delete_own': 'maintenance_edit',
  'maintenance_delete_all': 'maintenance_edit',
};

export function migrateOldPermission(oldPermission: string): StandardizedPermission | null {
  return PERMISSION_MIGRATION_MAP[oldPermission] || null;
}