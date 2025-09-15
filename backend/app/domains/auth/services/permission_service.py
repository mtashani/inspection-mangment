from typing import List, Optional, Set
import logging
from sqlalchemy.future import select
from sqlalchemy import and_
from sqlmodel import Session
from datetime import datetime

from app.domains.inspector.models.inspector import Inspector
from app.domains.inspector.models.authorization import (
    Role, 
    Permission, 
    RolePermission,
    InspectorRole
)


class PermissionService:
    """Service for handling permission-related operations using database only"""

    @staticmethod
    async def get_inspector_permissions(db: Session, inspector_id: int) -> Set[str]:
        """Get all permissions for an inspector (database only)"""
        # Query database - using synchronous session with proper SQLModel handling
        statement = (
            select(Role)
            .join(InspectorRole, InspectorRole.role_id == Role.id)
            .where(InspectorRole.inspector_id == inspector_id)
        )
        roles = db.exec(statement).all()
        
        # Get all permissions for these roles
        permissions = set()
        logging.debug(f"Found {len(roles)} roles for inspector {inspector_id}")
        
        for role in roles:
            try:
                # Handle SQLAlchemy Row objects - extract the actual Role model
                if hasattr(role, '_mapping') or hasattr(role, '__getitem__'):
                    # This is a SQLAlchemy Row, extract the first item (the Role)
                    actual_role = role[0] if hasattr(role, '__getitem__') else role.Role
                    logging.debug(f"Extracted role from Row: {actual_role}, type: {type(actual_role)}")
                else:
                    # This is already a Role object
                    actual_role = role
                    
                # Ensure we have a proper Role object with id attribute
                if hasattr(actual_role, 'id') and actual_role.id:
                    role_id = actual_role.id
                    logging.debug(f"Getting permissions for role ID: {role_id} (name: {getattr(actual_role, 'name', 'unknown')})")
                    role_perms = await PermissionService.get_role_permissions(db, role_id)
                    permissions.update(role_perms)
                else:
                    logging.error(f"Invalid role object - missing id: {role}, type: {type(role)}")
                    continue
            except Exception as e:
                logging.error(f"Error processing role {role}: {e}")
                continue
            
        return permissions
    
    @staticmethod
    async def get_role_permissions(db: Session, role_id: int) -> Set[str]:
        """Get all permissions for a role (database only)"""
        # Query database - using synchronous session with proper SQLModel handling
        statement = (
            select(Permission)
            .join(RolePermission, RolePermission.permission_id == Permission.id)
            .where(RolePermission.role_id == role_id)
        )
        permissions = db.exec(statement).all()
        
        # Format permissions as "{resource}:{action}" strings
        permission_set = set()
        logging.debug(f"Found {len(permissions)} permissions for role {role_id}")
        
        for perm in permissions:
            try:
                # Handle SQLAlchemy Row objects if needed
                if hasattr(perm, '_mapping') or hasattr(perm, '__getitem__'):
                    # This is a SQLAlchemy Row, extract the first item (the Permission)
                    actual_perm = perm[0] if hasattr(perm, '__getitem__') else perm.Permission
                    logging.debug(f"Extracted permission from Row: {actual_perm}")
                else:
                    # This is already a Permission object
                    actual_perm = perm
                    
                if hasattr(actual_perm, 'resource') and hasattr(actual_perm, 'action'):
                    perm_string = f"{actual_perm.resource}:{actual_perm.action}"
                    permission_set.add(perm_string)
                    logging.debug(f"Added permission: {perm_string}")
                else:
                    logging.error(f"Invalid permission object - missing resource/action: {perm}")
                    
            except Exception as e:
                logging.error(f"Error processing permission {perm}: {e}")
                continue
        
        logging.debug(f"Final permission set for role {role_id}: {permission_set}")
        
        return permission_set
    
    @staticmethod
    async def has_permission(db: Session, inspector: Inspector, resource: str, action: str) -> bool:
        """Check if an inspector has a specific permission (database only)"""
        if not inspector or not inspector.active or not inspector.can_login:
            return False
            
        permissions = await PermissionService.get_inspector_permissions(db, inspector.id)
        
        # Check for specific permission or wildcard permissions
        has_perm = (
            f"{resource}:{action}" in permissions or  # Specific permission
            f"{resource}:*" in permissions or         # All actions on resource
            f"*:{action}" in permissions or           # All resources for action
            "*:*" in permissions                      # Superuser
        )
        
        # Log permission check for audit
        logging.info(f"Permission check: inspector={inspector.id}, resource={resource}, action={action}, result={has_perm}")
        
        return has_perm

    # No cache invalidation needed for database-only mode
    
    @staticmethod
    async def assign_role_to_inspector(db: Session, inspector_id: int, role_id: int) -> bool:
        """Assign a role to an inspector (database only)"""
        # Check if the assignment already exists
        statement = (
            select(InspectorRole)
            .where(
                and_(
                    InspectorRole.inspector_id == inspector_id,
                    InspectorRole.role_id == role_id
                )
            )
        )
        exists = db.exec(statement).first()
        
        if exists:
            return False
            
        # Create new assignment
        inspector_role = InspectorRole(
            inspector_id=inspector_id, 
            role_id=role_id,
            created_at=datetime.utcnow()
        )
        db.add(inspector_role)
        db.commit()
        
        logging.info(f"Assigned role {role_id} to inspector {inspector_id}")
        return True
    
    @staticmethod
    async def remove_role_from_inspector(db: Session, inspector_id: int, role_id: int) -> bool:
        """Remove a role from an inspector (database only)"""
        statement = (
            select(InspectorRole)
            .where(
                and_(
                    InspectorRole.inspector_id == inspector_id,
                    InspectorRole.role_id == role_id
                )
            )
        )
        inspector_role = db.exec(statement).first()
        
        if not inspector_role:
            return False
            
        db.delete(inspector_role)
        db.commit()
        
        logging.info(f"Removed role {role_id} from inspector {inspector_id}")
        return True
    
    @staticmethod
    async def create_role(db: Session, name: str, description: Optional[str] = None, display_label: Optional[str] = None) -> Role:
        """Create a new role (database only)"""
        role = Role(
            name=name, 
            description=description,
            display_label=display_label or name,
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow()
        )
        db.add(role)
        db.commit()
        db.refresh(role)
        
        logging.info(f"Created new role: {name}")
        return role
    
    @staticmethod
    async def create_permission(
        db: Session, 
        name: str, 
        resource: str, 
        action: str, 
        description: Optional[str] = None,
        display_label: Optional[str] = None
    ) -> Permission:
        """Create a new permission (database only)"""
        permission = Permission(
            name=name,
            resource=resource,
            action=action,
            description=description,
            display_label=display_label or f"{resource}:{action}",
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow()
        )
        db.add(permission)
        db.commit()
        db.refresh(permission)
        
        logging.info(f"Created new permission: {name} ({resource}:{action})")
        return permission
    
    @staticmethod
    async def assign_permission_to_role(db: Session, role_id: int, permission_id: int) -> bool:
        """Assign a permission to a role (database only)"""
        # Check if the assignment already exists
        statement = (
            select(RolePermission)
            .where(
                and_(
                    RolePermission.role_id == role_id,
                    RolePermission.permission_id == permission_id
                )
            )
        )
        exists = db.exec(statement).first()
        
        if exists:
            return False
            
        # Create new assignment
        role_permission = RolePermission(
            role_id=role_id, 
            permission_id=permission_id,
            created_at=datetime.utcnow()
        )
        db.add(role_permission)
        db.commit()
        
        logging.info(f"Assigned permission {permission_id} to role {role_id}")
        return True