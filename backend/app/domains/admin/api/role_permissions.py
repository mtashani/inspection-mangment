"""Role-Permission Assignment API Endpoints"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session, select, and_
from typing import List
import logging
from datetime import datetime

from app.database import get_session as get_db
from app.domains.auth.dependencies import require_standardized_permission
from app.domains.admin.schemas import (
    RolePermissionAssignment, RolePermissionsResponse, PermissionResponse,
    SuccessResponse, ErrorResponse
)
from app.domains.inspector.models.authorization import Role, Permission, RolePermission
from app.domains.inspector.models.inspector import Inspector
from app.domains.auth.services.permission_service import PermissionService

router = APIRouter()


@router.put("/roles/{role_id}/permissions", response_model=SuccessResponse)
async def assign_permissions_to_role(
    role_id: int,
    assignment_data: RolePermissionAssignment,
    db: Session = Depends(get_db),
    current_inspector: Inspector = Depends(require_standardized_permission("system_superadmin"))
):
    """
    Assign permissions to a role (bulk assignment).
    
    This replaces all existing permissions for the role with the new set.
    Requires system_superadmin permission.
    """
    try:
        # Verify role exists
        role = db.get(Role, role_id)
        if not role:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Role with ID {role_id} not found"
            )
        
        # Verify all permissions exist
        permissions = []
        for permission_id in assignment_data.permission_ids:
            permission = db.get(Permission, permission_id)
            if not permission:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail=f"Permission with ID {permission_id} not found"
                )
            permissions.append(permission)
        
        # Remove existing role-permission assignments
        existing_assignments = db.exec(
            select(RolePermission).where(RolePermission.role_id == role_id)
        ).all()
        
        for assignment in existing_assignments:
            db.delete(assignment)
        
        # Create new assignments
        new_assignments = []
        for permission_id in assignment_data.permission_ids:
            role_permission = RolePermission(
                role_id=role_id,
                permission_id=permission_id,
                created_at=datetime.utcnow()
            )
            db.add(role_permission)
            new_assignments.append(role_permission)
        
        db.commit()
        
        # Invalidate caches
        try:
            from app.domains.auth.services.cache_service import CacheService
            await CacheService.invalidate_role_cache(role_id)
            await CacheService.invalidate_all_caches()
        except Exception as cache_error:
            # Log cache invalidation error but don't fail the operation
            logging.warning(f"Cache invalidation failed for role {role_id}: {cache_error}")
        
        logging.info(
            f"Role {role_id} permissions updated by inspector {current_inspector.id}. "
            f"Assigned {len(assignment_data.permission_ids)} permissions."
        )
        
        return SuccessResponse(
            message=f"Successfully assigned {len(assignment_data.permission_ids)} permissions to role '{role.name}'"
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logging.error(f"Error assigning permissions to role {role_id}: {e}")
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to assign permissions to role"
        )


@router.post("/roles/{role_id}/permissions/{permission_id}", response_model=SuccessResponse)
async def add_permission_to_role(
    role_id: int,
    permission_id: int,
    db: Session = Depends(get_db),
    current_inspector: Inspector = Depends(require_standardized_permission("system_superadmin"))
):
    """
    Add a single permission to a role.
    
    Requires system_superadmin permission.
    """
    try:
        # Verify role exists
        role = db.get(Role, role_id)
        if not role:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Role with ID {role_id} not found"
            )
        
        # Verify permission exists
        permission = db.get(Permission, permission_id)
        if not permission:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Permission with ID {permission_id} not found"
            )
        
        # Check if assignment already exists
        existing_assignment = db.exec(
            select(RolePermission).where(
                and_(
                    RolePermission.role_id == role_id,
                    RolePermission.permission_id == permission_id
                )
            )
        ).first()
        
        if existing_assignment:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=f"Permission '{permission.name}' is already assigned to role '{role.name}'"
            )
        
        # Create new assignment
        role_permission = RolePermission(
            role_id=role_id,
            permission_id=permission_id,
            created_at=datetime.utcnow()
        )
        
        db.add(role_permission)
        db.commit()
        
        # Invalidate caches
        try:
            from app.domains.auth.services.cache_service import CacheService
            await CacheService.invalidate_role_cache(role_id)
            await CacheService.invalidate_all_caches()
        except Exception as cache_error:
            # Log cache invalidation error but don't fail the operation
            logging.warning(f"Cache invalidation failed for role {role_id}: {cache_error}")
        
        logging.info(
            f"Permission {permission_id} added to role {role_id} by inspector {current_inspector.id}"
        )
        
        return SuccessResponse(
            message=f"Successfully added permission '{permission.name}' to role '{role.name}'"
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logging.error(f"Error adding permission {permission_id} to role {role_id}: {e}")
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to add permission to role"
        )


@router.delete("/roles/{role_id}/permissions/{permission_id}", response_model=SuccessResponse)
async def remove_permission_from_role(
    role_id: int,
    permission_id: int,
    db: Session = Depends(get_db),
    current_inspector: Inspector = Depends(require_standardized_permission("system_superadmin"))
):
    """
    Remove a specific permission from a role.
    
    Requires system_superadmin permission.
    """
    try:
        # Verify role exists
        role = db.get(Role, role_id)
        if not role:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Role with ID {role_id} not found"
            )
        
        # Verify permission exists
        permission = db.get(Permission, permission_id)
        if not permission:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Permission with ID {permission_id} not found"
            )
        
        # Find and remove the assignment
        assignment = db.exec(
            select(RolePermission).where(
                and_(
                    RolePermission.role_id == role_id,
                    RolePermission.permission_id == permission_id
                )
            )
        ).first()
        
        if not assignment:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Permission '{permission.name}' is not assigned to role '{role.name}'"
            )
        
        db.delete(assignment)
        db.commit()
        
        # Invalidate caches
        try:
            from app.domains.auth.services.cache_service import CacheService
            await CacheService.invalidate_role_cache(role_id)
            await CacheService.invalidate_all_caches()
        except Exception as cache_error:
            # Log cache invalidation error but don't fail the operation
            logging.warning(f"Cache invalidation failed for role {role_id}: {cache_error}")
        
        logging.info(
            f"Permission {permission_id} removed from role {role_id} by inspector {current_inspector.id}"
        )
        
        return SuccessResponse(
            message=f"Successfully removed permission '{permission.name}' from role '{role.name}'"
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logging.error(f"Error removing permission {permission_id} from role {role_id}: {e}")
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to remove permission from role"
        )


@router.get("/roles/{role_id}/permissions", response_model=RolePermissionsResponse)
async def get_role_permissions(
    role_id: int,
    db: Session = Depends(get_db),
    current_inspector: Inspector = Depends(require_standardized_permission("system_superadmin"))
):
    """
    Get all permissions assigned to a role.
    
    Requires system_superadmin permission.
    """
    try:
        # Verify role exists
        role = db.get(Role, role_id)
        if not role:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Role with ID {role_id} not found"
            )
        
        # Get all permissions for this role
        permissions = db.exec(
            select(Permission)
            .join(RolePermission, RolePermission.permission_id == Permission.id)
            .where(RolePermission.role_id == role_id)
            .order_by(Permission.resource, Permission.action)
        ).all()
        
        return RolePermissionsResponse(
            role_id=role_id,
            role_name=role.name,
            permissions=[PermissionResponse.from_orm(perm) for perm in permissions]
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logging.error(f"Error getting permissions for role {role_id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve role permissions"
        )


@router.post("/roles/{role_id}/permissions/bulk-add", response_model=SuccessResponse)
async def bulk_add_permissions_to_role(
    role_id: int,
    assignment_data: RolePermissionAssignment,
    db: Session = Depends(get_db),
    current_inspector: Inspector = Depends(require_standardized_permission("system_superadmin"))
):
    """
    Add multiple permissions to a role (without removing existing ones).
    
    This is different from the PUT endpoint which replaces all permissions.
    Requires system_superadmin permission.
    """
    try:
        # Verify role exists
        role = db.get(Role, role_id)
        if not role:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Role with ID {role_id} not found"
            )
        
        # Verify all permissions exist
        permissions = []
        for permission_id in assignment_data.permission_ids:
            permission = db.get(Permission, permission_id)
            if not permission:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail=f"Permission with ID {permission_id} not found"
                )
            permissions.append(permission)
        
        # Get existing assignments to avoid duplicates
        existing_assignments = db.exec(
            select(RolePermission.permission_id)
            .where(RolePermission.role_id == role_id)
        ).all()
        existing_permission_ids = set(existing_assignments)
        
        # Create new assignments for permissions not already assigned
        new_assignments_count = 0
        skipped_count = 0
        
        for permission_id in assignment_data.permission_ids:
            if permission_id not in existing_permission_ids:
                role_permission = RolePermission(
                    role_id=role_id,
                    permission_id=permission_id,
                    created_at=datetime.utcnow()
                )
                db.add(role_permission)
                new_assignments_count += 1
            else:
                skipped_count += 1
        
        db.commit()
        
        # Invalidate caches if any new assignments were made
        if new_assignments_count > 0:
            await PermissionService.invalidate_role_cache(role_id)
            await PermissionService.invalidate_all_inspector_caches()
        
        logging.info(
            f"Bulk add permissions to role {role_id} by inspector {current_inspector.id}. "
            f"Added: {new_assignments_count}, Skipped: {skipped_count}"
        )
        
        message = f"Successfully processed {len(assignment_data.permission_ids)} permissions for role '{role.name}'. "
        message += f"Added: {new_assignments_count}, Already assigned: {skipped_count}"
        
        return SuccessResponse(message=message)
        
    except HTTPException:
        raise
    except Exception as e:
        logging.error(f"Error bulk adding permissions to role {role_id}: {e}")
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to bulk add permissions to role"
        )


@router.get("/roles/{role_id}/available-permissions")
async def get_available_permissions_for_role(
    role_id: int,
    db: Session = Depends(get_db),
    current_inspector: Inspector = Depends(require_standardized_permission("system_superadmin"))
):
    """
    Get permissions that are not yet assigned to a role.
    
    Useful for UI dropdowns when adding permissions to roles.
    Requires system_superadmin permission.
    """
    try:
        # Verify role exists
        role = db.get(Role, role_id)
        if not role:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Role with ID {role_id} not found"
            )
        
        # Get permissions already assigned to this role
        assigned_permission_ids = db.exec(
            select(RolePermission.permission_id)
            .where(RolePermission.role_id == role_id)
        ).all()
        assigned_ids_set = set(assigned_permission_ids)
        
        # Get all permissions not assigned to this role
        all_permissions = db.exec(select(Permission)).all()
        available_permissions = [
            perm for perm in all_permissions 
            if perm.id not in assigned_ids_set
        ]
        
        # Sort by resource and action
        available_permissions.sort(key=lambda p: (p.resource, p.action))
        
        return {
            "role_id": role_id,
            "role_name": role.name,
            "available_permissions": [
                PermissionResponse.from_orm(perm) for perm in available_permissions
            ],
            "total_available": len(available_permissions),
            "total_assigned": len(assigned_ids_set)
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logging.error(f"Error getting available permissions for role {role_id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to get available permissions for role"
        )