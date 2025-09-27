"""
Permission Service for Standardized RBAC System
Provides utilities for permission validation and checking
"""

from typing import List, Optional, Dict, Any
from sqlmodel import Session, select
from app.domains.inspector.models.authorization import Permission, Role, RolePermission, InspectorRole
from app.domains.inspector.models.inspector import Inspector
from app.core.permissions import (
    STANDARDIZED_PERMISSIONS,
    PERMISSION_DEFINITIONS,
    validate_permission,
    get_all_standardized_permissions
)


class PermissionService:
    """Service for managing and validating permissions"""
    
    @staticmethod
    def validate_standardized_permission(permission_name: str) -> bool:
        """Validate if a permission is in the standardized list"""
        return validate_permission(permission_name)
    
    @staticmethod
    def get_standardized_permissions() -> List[str]:
        """Get all standardized permission names"""
        return get_all_standardized_permissions()
    
    @staticmethod
    def get_permission_definition(permission_name: str) -> Dict[str, Any]:
        """Get permission definition"""
        return PERMISSION_DEFINITIONS.get(permission_name, {})
    
    @staticmethod
    async def check_inspector_permission(
        session: Session, 
        inspector_id: int, 
        permission_name: str
    ) -> bool:
        """Check if an inspector has a specific standardized permission"""
        
        # Validate permission is standardized
        if not PermissionService.validate_standardized_permission(permission_name):
            return False
        
        # Get inspector with roles
        inspector = session.exec(
            select(Inspector).where(Inspector.id == inspector_id)
        ).first()
        
        if not inspector or not inspector.active:
            return False
        
        # Get inspector roles
        inspector_roles = session.exec(
            select(InspectorRole).where(InspectorRole.inspector_id == inspector_id)
        ).all()
        
        if not inspector_roles:
            return False
        
        # Check if any role has the required permission
        for inspector_role in inspector_roles:
            role_permissions = session.exec(
                select(RolePermission)
                .join(Permission)
                .where(
                    RolePermission.role_id == inspector_role.role_id,
                    Permission.name == permission_name,
                    Permission.is_active == True
                )
            ).all()
            
            if role_permissions:
                return True
        
        return False
    
    @staticmethod
    async def get_inspector_permissions(
        session: Session, 
        inspector_id: int
    ) -> List[str]:
        """Get all permissions for an inspector"""
        
        # Get inspector roles
        inspector_roles = session.exec(
            select(InspectorRole).where(InspectorRole.inspector_id == inspector_id)
        ).all()
        
        if not inspector_roles:
            return []
        
        permissions = set()
        
        # Collect permissions from all roles
        for inspector_role in inspector_roles:
            role_permissions = session.exec(
                select(Permission)
                .join(RolePermission)
                .where(
                    RolePermission.role_id == inspector_role.role_id,
                    Permission.is_active == True
                )
            ).all()
            
            for permission in role_permissions:
                permissions.add(permission.name)
        
        return list(permissions)
    
    @staticmethod
    async def get_inspector_roles(
        session: Session, 
        inspector_id: int
    ) -> List[Dict[str, Any]]:
        """Get all roles for an inspector with their permissions"""
        
        inspector_roles = session.exec(
            select(InspectorRole)
            .join(Role)
            .where(InspectorRole.inspector_id == inspector_id)
        ).all()
        
        roles_data = []
        
        for inspector_role in inspector_roles:
            role = session.exec(
                select(Role).where(Role.id == inspector_role.role_id)
            ).first()
            
            if role:
                # Get role permissions
                role_permissions = session.exec(
                    select(Permission)
                    .join(RolePermission)
                    .where(
                        RolePermission.role_id == role.id,
                        Permission.is_active == True
                    )
                ).all()
                
                roles_data.append({
                    "id": role.id,
                    "name": role.name,
                    "description": role.description,
                    "display_label": role.display_label,
                    "permissions": [perm.name for perm in role_permissions]
                })
        
        return roles_data
    
    @staticmethod
    async def has_system_superadmin(session: Session, inspector_id: int) -> bool:
        """Check if inspector has system superadmin permission"""
        return await PermissionService.check_inspector_permission(
            session, inspector_id, "system_superadmin"
        )
    
    @staticmethod
    async def has_hr_manage(session: Session, inspector_id: int) -> bool:
        """Check if inspector has HR management permission"""
        return await PermissionService.check_inspector_permission(
            session, inspector_id, "system_hr_manage"
        )
    
    @staticmethod
    async def can_access_domain(
        session: Session, 
        inspector_id: int, 
        domain: str, 
        action: str = "view"
    ) -> bool:
        """Check if inspector can access a specific domain with given action"""
        permission_name = f"{domain}_{action}"
        return await PermissionService.check_inspector_permission(
            session, inspector_id, permission_name
        )
    
    @staticmethod
    def get_permissions_by_category(category: str) -> List[Dict[str, Any]]:
        """Get permissions grouped by category"""
        permissions = []
        
        for perm_name, definition in PERMISSION_DEFINITIONS.items():
            if definition.get('category') == category:
                permissions.append({
                    'name': perm_name,
                    'display_name': definition['display_name'],
                    'description': definition['description'],
                    'domain': definition['domain']
                })
        
        return permissions
    
    @staticmethod
    def get_permissions_by_domain(domain: str) -> List[Dict[str, Any]]:
        """Get permissions grouped by domain"""
        permissions = []
        
        for perm_name, definition in PERMISSION_DEFINITIONS.items():
            if definition.get('domain') == domain:
                permissions.append({
                    'name': perm_name,
                    'display_name': definition['display_name'],
                    'description': definition['description'],
                    'category': definition['category']
                })
        
        return permissions