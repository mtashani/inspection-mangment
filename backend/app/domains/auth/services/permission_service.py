from typing import List, Optional, Set
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import and_

from app.domains.inspector.models.inspector import Inspector
from app.domains.inspector.models.authorization import (
    Role, 
    Permission, 
    RolePermission,
    InspectorRole
)


class PermissionService:
    """Service for handling permission-related operations"""

    @staticmethod
    async def get_inspector_permissions(db: AsyncSession, inspector_id: int) -> Set[str]:
        """Get all permissions for an inspector"""
        # Query for all roles assigned to the inspector
        result = await db.execute(
            select(Role)
            .join(InspectorRole, InspectorRole.role_id == Role.id)
            .where(InspectorRole.inspector_id == inspector_id)
        )
        roles = result.scalars().all()
        
        # Get all permissions for these roles
        permissions = set()
        for role in roles:
            role_perms = await PermissionService.get_role_permissions(db, role.id)
            permissions.update(role_perms)
            
        return permissions
    
    @staticmethod
    async def get_role_permissions(db: AsyncSession, role_id: int) -> Set[str]:
        """Get all permissions for a role"""
        result = await db.execute(
            select(Permission)
            .join(RolePermission, RolePermission.permission_id == Permission.id)
            .where(RolePermission.role_id == role_id)
        )
        permissions = result.scalars().all()
        
        # Format permissions as "{resource}:{action}" strings
        return {f"{perm.resource}:{perm.action}" for perm in permissions}
    
    @staticmethod
    async def has_permission(db: AsyncSession, inspector: Inspector, resource: str, action: str) -> bool:
        """Check if an inspector has a specific permission"""
        permissions = await PermissionService.get_inspector_permissions(db, inspector.id)
        
        # Check for specific permission or wildcard permissions
        return (
            f"{resource}:{action}" in permissions or  # Specific permission
            f"{resource}:*" in permissions or         # All actions on resource
            f"*:{action}" in permissions or           # All resources for action
            "*:*" in permissions                      # Superuser
        )
    
    @staticmethod
    async def assign_role_to_inspector(db: AsyncSession, inspector_id: int, role_id: int) -> bool:
        """Assign a role to an inspector"""
        # Check if the assignment already exists
        result = await db.execute(
            select(InspectorRole)
            .where(
                and_(
                    InspectorRole.inspector_id == inspector_id,
                    InspectorRole.role_id == role_id
                )
            )
        )
        exists = result.scalar_one_or_none()
        
        if exists:
            return False
            
        # Create new assignment
        inspector_role = InspectorRole(inspector_id=inspector_id, role_id=role_id)
        db.add(inspector_role)
        await db.commit()
        
        return True
    
    @staticmethod
    async def remove_role_from_inspector(db: AsyncSession, inspector_id: int, role_id: int) -> bool:
        """Remove a role from an inspector"""
        result = await db.execute(
            select(InspectorRole)
            .where(
                and_(
                    InspectorRole.inspector_id == inspector_id,
                    InspectorRole.role_id == role_id
                )
            )
        )
        inspector_role = result.scalar_one_or_none()
        
        if not inspector_role:
            return False
            
        await db.delete(inspector_role)
        await db.commit()
        
        return True
    
    @staticmethod
    async def create_role(db: AsyncSession, name: str, description: Optional[str] = None) -> Role:
        """Create a new role"""
        role = Role(name=name, description=description)
        db.add(role)
        await db.commit()
        await db.refresh(role)
        
        return role
    
    @staticmethod
    async def create_permission(
        db: AsyncSession, 
        name: str, 
        resource: str, 
        action: str, 
        description: Optional[str] = None
    ) -> Permission:
        """Create a new permission"""
        permission = Permission(
            name=name,
            resource=resource,
            action=action,
            description=description
        )
        db.add(permission)
        await db.commit()
        await db.refresh(permission)
        
        return permission
    
    @staticmethod
    async def assign_permission_to_role(db: AsyncSession, role_id: int, permission_id: int) -> bool:
        """Assign a permission to a role"""
        # Check if the assignment already exists
        result = await db.execute(
            select(RolePermission)
            .where(
                and_(
                    RolePermission.role_id == role_id,
                    RolePermission.permission_id == permission_id
                )
            )
        )
        exists = result.scalar_one_or_none()
        
        if exists:
            return False
            
        # Create new assignment
        role_permission = RolePermission(role_id=role_id, permission_id=permission_id)
        db.add(role_permission)
        await db.commit()
        
        return True