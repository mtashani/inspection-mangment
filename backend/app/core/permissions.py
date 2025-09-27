"""
Standardized Permission System
This module defines the 23 standardized permissions for the RBAC system
"""

from typing import Dict, List, Tuple

# System-level permissions
SYSTEM_PERMISSIONS = {
    'SYSTEM_SUPERADMIN': 'system_superadmin',     # Full system access
    'SYSTEM_HR_MANAGE': 'system_hr_manage',      # HR management access
}

# Technical domain permissions (view, edit, approve pattern)
TECHNICAL_PERMISSIONS = {
    # Mechanical
    'MECHANICAL_VIEW': 'mechanical_view',
    'MECHANICAL_EDIT': 'mechanical_edit',
    'MECHANICAL_APPROVE': 'mechanical_approve',
    
    # Corrosion
    'CORROSION_VIEW': 'corrosion_view',
    'CORROSION_EDIT': 'corrosion_edit',
    'CORROSION_APPROVE': 'corrosion_approve',
    
    # NDT
    'NDT_VIEW': 'ndt_view',
    'NDT_EDIT': 'ndt_edit',
    'NDT_APPROVE': 'ndt_approve',
    
    # Electrical
    'ELECTRICAL_VIEW': 'electrical_view',
    'ELECTRICAL_EDIT': 'electrical_edit',
    'ELECTRICAL_APPROVE': 'electrical_approve',
    
    # Instrumentation
    'INSTRUMENT_VIEW': 'instrument_view',
    'INSTRUMENT_EDIT': 'instrument_edit',
    'INSTRUMENT_APPROVE': 'instrument_approve',
    
    # Quality Control
    'QUALITY_VIEW': 'quality_view',
    'QUALITY_EDIT': 'quality_edit',
    'QUALITY_APPROVE': 'quality_approve',
    
    # Maintenance
    'MAINTENANCE_VIEW': 'maintenance_view',
    'MAINTENANCE_EDIT': 'maintenance_edit',
    'MAINTENANCE_APPROVE': 'maintenance_approve',
}

# Combined standardized permissions (exactly 23 permissions)
STANDARDIZED_PERMISSIONS = {
    **SYSTEM_PERMISSIONS,
    **TECHNICAL_PERMISSIONS,
}

# Permission definitions with metadata
PERMISSION_DEFINITIONS: Dict[str, Dict[str, str]] = {
    # System permissions
    'system_superadmin': {
        'name': 'system_superadmin',
        'display_name': 'System Super Admin',
        'description': 'Full system administration access including user management, system configuration, and all domain access',
        'category': 'system',
        'domain': 'system'
    },
    'system_hr_manage': {
        'name': 'system_hr_manage',
        'display_name': 'HR Management',
        'description': 'Human resources management including inspector management, attendance, and payroll',
        'category': 'system',
        'domain': 'hr'
    },
    
    # Mechanical domain
    'mechanical_view': {
        'name': 'mechanical_view',
        'display_name': 'Mechanical View',
        'description': 'View mechanical inspection reports and data',
        'category': 'technical',
        'domain': 'mechanical'
    },
    'mechanical_edit': {
        'name': 'mechanical_edit',
        'display_name': 'Mechanical Edit',
        'description': 'Create and edit mechanical inspection reports',
        'category': 'technical',
        'domain': 'mechanical'
    },
    'mechanical_approve': {
        'name': 'mechanical_approve',
        'display_name': 'Mechanical Approve',
        'description': 'Approve and finalize mechanical inspection reports',
        'category': 'technical',
        'domain': 'mechanical'
    },
    
    # Corrosion domain
    'corrosion_view': {
        'name': 'corrosion_view',
        'display_name': 'Corrosion View',
        'description': 'View corrosion inspection reports and monitoring data',
        'category': 'technical',
        'domain': 'corrosion'
    },
    'corrosion_edit': {
        'name': 'corrosion_edit',
        'display_name': 'Corrosion Edit',
        'description': 'Create and edit corrosion inspection reports and monitoring data',
        'category': 'technical',
        'domain': 'corrosion'
    },
    'corrosion_approve': {
        'name': 'corrosion_approve',
        'display_name': 'Corrosion Approve',
        'description': 'Approve and finalize corrosion inspection reports',
        'category': 'technical',
        'domain': 'corrosion'
    },
    
    # NDT domain
    'ndt_view': {
        'name': 'ndt_view',
        'display_name': 'NDT View',
        'description': 'View non-destructive testing reports and results',
        'category': 'technical',
        'domain': 'ndt'
    },
    'ndt_edit': {
        'name': 'ndt_edit',
        'display_name': 'NDT Edit',
        'description': 'Create and edit non-destructive testing reports',
        'category': 'technical',
        'domain': 'ndt'
    },
    'ndt_approve': {
        'name': 'ndt_approve',
        'display_name': 'NDT Approve',
        'description': 'Approve and finalize non-destructive testing reports',
        'category': 'technical',
        'domain': 'ndt'
    },
    
    # Electrical domain
    'electrical_view': {
        'name': 'electrical_view',
        'display_name': 'Electrical View',
        'description': 'View electrical inspection reports and testing data',
        'category': 'technical',
        'domain': 'electrical'
    },
    'electrical_edit': {
        'name': 'electrical_edit',
        'display_name': 'Electrical Edit',
        'description': 'Create and edit electrical inspection reports',
        'category': 'technical',
        'domain': 'electrical'
    },
    'electrical_approve': {
        'name': 'electrical_approve',
        'display_name': 'Electrical Approve',
        'description': 'Approve and finalize electrical inspection reports',
        'category': 'technical',
        'domain': 'electrical'
    },
    
    # Instrumentation domain
    'instrument_view': {
        'name': 'instrument_view',
        'display_name': 'Instrumentation View',
        'description': 'View instrumentation inspection reports and calibration data',
        'category': 'technical',
        'domain': 'instrument'
    },
    'instrument_edit': {
        'name': 'instrument_edit',
        'display_name': 'Instrumentation Edit',
        'description': 'Create and edit instrumentation inspection reports',
        'category': 'technical',
        'domain': 'instrument'
    },
    'instrument_approve': {
        'name': 'instrument_approve',
        'display_name': 'Instrumentation Approve',
        'description': 'Approve and finalize instrumentation inspection reports',
        'category': 'technical',
        'domain': 'instrument'
    },
    
    # Quality domain
    'quality_view': {
        'name': 'quality_view',
        'display_name': 'Quality View',
        'description': 'View quality control reports and inspection data',
        'category': 'technical',
        'domain': 'quality'
    },
    'quality_edit': {
        'name': 'quality_edit',
        'display_name': 'Quality Edit',
        'description': 'Create and edit quality control reports',
        'category': 'technical',
        'domain': 'quality'
    },
    'quality_approve': {
        'name': 'quality_approve',
        'display_name': 'Quality Approve',
        'description': 'Approve and finalize quality control reports',
        'category': 'technical',
        'domain': 'quality'
    },
    
    # Maintenance domain
    'maintenance_view': {
        'name': 'maintenance_view',
        'display_name': 'Maintenance View',
        'description': 'View maintenance events and inspection plans',
        'category': 'technical',
        'domain': 'maintenance'
    },
    'maintenance_edit': {
        'name': 'maintenance_edit',
        'display_name': 'Maintenance Edit',
        'description': 'Create and edit maintenance events and plans',
        'category': 'technical',
        'domain': 'maintenance'
    },
    'maintenance_approve': {
        'name': 'maintenance_approve',
        'display_name': 'Maintenance Approve',
        'description': 'Approve and finalize maintenance events and plans',
        'category': 'technical',
        'domain': 'maintenance'
    },
}

# Migration mapping from old permissions to standardized permissions
PERMISSION_MIGRATION_MAP = {
    # Admin permissions
    'admin_manage': 'system_superadmin',
    'admin_manage_roles': 'system_superadmin',
    'admin_manage_permissions': 'system_superadmin',
    'admin_view_roles': 'system_superadmin',
    'admin_view_permissions': 'system_superadmin',
    'admin_manage_inspectors': 'system_hr_manage',
    
    # Inspector permissions
    'inspector_create': 'system_hr_manage',
    'inspector_view': 'system_hr_manage',
    'inspector_edit_all': 'system_hr_manage',
    'inspector_delete_all': 'system_hr_manage',
    
    # PSV permissions (map to mechanical)
    'psv_create': 'mechanical_edit',
    'psv_view': 'mechanical_view',
    'psv_edit_own': 'mechanical_edit',
    'psv_edit_all': 'mechanical_edit',
    'psv_approve': 'mechanical_approve',
    'psv_delete_own': 'mechanical_edit',
    'psv_delete_all': 'mechanical_edit',
    'psv_execute_test': 'mechanical_edit',
    
    # NDT permissions
    'ndt_create': 'ndt_edit',
    'ndt_view': 'ndt_view',
    'ndt_edit_own': 'ndt_edit',
    'ndt_edit_all': 'ndt_edit',
    'ndt_approve': 'ndt_approve',
    'ndt_delete_own': 'ndt_edit',
    'ndt_delete_all': 'ndt_edit',
    
    # Mechanical permissions
    'mechanical_create': 'mechanical_edit',
    'mechanical_view': 'mechanical_view',
    'mechanical_edit_own': 'mechanical_edit',
    'mechanical_edit_all': 'mechanical_edit',
    'mechanical_approve': 'mechanical_approve',
    'mechanical_delete_own': 'mechanical_edit',
    'mechanical_delete_all': 'mechanical_edit',
    
    # Quality permissions
    'quality_inspect': 'quality_edit',
    'quality_approve': 'quality_approve',
    
    # Report permissions (map to appropriate domains)
    'report_create': 'mechanical_edit',  # Default to mechanical
    'report_view': 'mechanical_view',
    'report_approve': 'mechanical_approve',
    'report_final_approve': 'mechanical_approve',
    
    # Maintenance permissions
    'maintenance_create': 'maintenance_edit',
    'maintenance_view': 'maintenance_view',
    'maintenance_edit_own': 'maintenance_edit',
    'maintenance_edit_all': 'maintenance_edit',
    'maintenance_approve': 'maintenance_approve',
    'maintenance_delete_own': 'maintenance_edit',
    'maintenance_delete_all': 'maintenance_edit',
}

def get_all_standardized_permissions() -> List[str]:
    """Get list of all standardized permission names"""
    return list(STANDARDIZED_PERMISSIONS.values())

def get_permission_definition(permission_name: str) -> Dict[str, str]:
    """Get permission definition by name"""
    return PERMISSION_DEFINITIONS.get(permission_name, {})

def get_permissions_by_category(category: str) -> List[str]:
    """Get permissions by category (system or technical)"""
    return [
        perm_name for perm_name, definition in PERMISSION_DEFINITIONS.items()
        if definition.get('category') == category
    ]

def get_permissions_by_domain(domain: str) -> List[str]:
    """Get permissions by domain"""
    return [
        perm_name for perm_name, definition in PERMISSION_DEFINITIONS.items()
        if definition.get('domain') == domain
    ]

def validate_permission(permission_name: str) -> bool:
    """Validate if a permission name is in the standardized list"""
    return permission_name in STANDARDIZED_PERMISSIONS.values()

def migrate_old_permission(old_permission: str) -> str:
    """Migrate old permission to standardized permission"""
    return PERMISSION_MIGRATION_MAP.get(old_permission, old_permission)