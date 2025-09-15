"""Inspector-Role Assignment API Endpoints"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session, select, and_
from typing import List
import logging
from datetime import datetime

from app.database import get_session as get_db
from app.domains.auth.dependencies import require_permission
from app.domains.admin.schemas import (
    InspectorRoleAssignment, BulkInspectorRoleAssignment, InspectorRolesResponse,
    RoleResponse, SuccessResponse, ErrorResponse
)
from app.domains.inspector.models.authorization import Role, InspectorRole
from app.domains.inspector.models.inspector import Inspector
from app.domains.auth.services.permission_service import PermissionService

router = APIRouter()


@router.put("/inspectors/{inspector_id}/roles", response_model=SuccessResponse)
async def assign_roles_to_inspector(
    inspector_id: int,
    assignment_data: InspectorRoleAssignment,
    db: Session = Depends(get_db),
    current_inspector: Inspector = Depends(require_permission("admin", "manage_users"))
):
    """
    Assign roles to an inspector (bulk assignment).
    
    This replaces all existing roles for the inspector with the new set.
    Requires admin:manage_users permission.
    """
    try:
        # Verify inspector exists
        inspector = db.get(Inspector, inspector_id)
        if not inspector:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Inspector with ID {inspector_id} not found"
            )
        
        # Verify all roles exist
        roles = []
        for role_id in assignment_data.role_ids:
            role = db.get(Role, role_id)
            if not role:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail=f"Role with ID {role_id} not found"
                )
            roles.append(role)
        
        # Remove existing inspector-role assignments
        existing_assignments = db.exec(
            select(InspectorRole).where(InspectorRole.inspector_id == inspector_id)
        ).all()
        
        for assignment in existing_assignments:
            db.delete(assignment)
        
        # Create new assignments
        new_assignments = []
        for role_id in assignment_data.role_ids:
            inspector_role = InspectorRole(
                inspector_id=inspector_id,
                role_id=role_id,
                created_at=datetime.utcnow()
            )
            db.add(inspector_role)
            new_assignments.append(inspector_role)
        
        db.commit()
        
        # Invalidate inspector's permission cache
        await PermissionService.invalidate_inspector_cache(inspector_id)
        
        logging.info(
            f"Inspector {inspector_id} roles updated by inspector {current_inspector.id}. "
            f"Assigned {len(assignment_data.role_ids)} roles."
        )
        
        return SuccessResponse(
            message=f"Successfully assigned {len(assignment_data.role_ids)} roles to inspector '{inspector.get_full_name()}'"
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logging.error(f"Error assigning roles to inspector {inspector_id}: {e}")
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to assign roles to inspector"
        )


@router.post("/inspectors/{inspector_id}/roles/{role_id}", response_model=SuccessResponse)
async def add_role_to_inspector(
    inspector_id: int,
    role_id: int,
    db: Session = Depends(get_db),
    current_inspector: Inspector = Depends(require_permission("admin", "manage_users"))
):
    """
    Add a single role to an inspector.
    
    Requires admin:manage_users permission.
    """
    try:
        # Verify inspector exists
        inspector = db.get(Inspector, inspector_id)
        if not inspector:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Inspector with ID {inspector_id} not found"
            )
        
        # Verify role exists
        role = db.get(Role, role_id)
        if not role:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Role with ID {role_id} not found"
            )
        
        # Check if assignment already exists
        existing_assignment = db.exec(
            select(InspectorRole).where(
                and_(
                    InspectorRole.inspector_id == inspector_id,
                    InspectorRole.role_id == role_id
                )
            )
        ).first()
        
        if existing_assignment:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=f"Role '{role.name}' is already assigned to inspector '{inspector.get_full_name()}'"
            )
        
        # Create new assignment
        inspector_role = InspectorRole(
            inspector_id=inspector_id,
            role_id=role_id,
            created_at=datetime.utcnow()
        )
        
        db.add(inspector_role)
        db.commit()
        
        # Invalidate inspector's permission cache
        await PermissionService.invalidate_inspector_cache(inspector_id)
        
        logging.info(
            f"Role {role_id} added to inspector {inspector_id} by inspector {current_inspector.id}"
        )
        
        return SuccessResponse(
            message=f"Successfully added role '{role.name}' to inspector '{inspector.get_full_name()}'"
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logging.error(f"Error adding role {role_id} to inspector {inspector_id}: {e}")
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to add role to inspector"
        )


@router.delete("/inspectors/{inspector_id}/roles/{role_id}", response_model=SuccessResponse)
async def remove_role_from_inspector(
    inspector_id: int,
    role_id: int,
    db: Session = Depends(get_db),
    current_inspector: Inspector = Depends(require_permission("admin", "manage_users"))
):
    """
    Remove a specific role from an inspector.
    
    Requires admin:manage_users permission.
    """
    try:
        # Verify inspector exists
        inspector = db.get(Inspector, inspector_id)
        if not inspector:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Inspector with ID {inspector_id} not found"
            )
        
        # Verify role exists
        role = db.get(Role, role_id)
        if not role:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Role with ID {role_id} not found"
            )
        
        # Find and remove the assignment
        assignment = db.exec(
            select(InspectorRole).where(
                and_(
                    InspectorRole.inspector_id == inspector_id,
                    InspectorRole.role_id == role_id
                )
            )
        ).first()
        
        if not assignment:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Role '{role.name}' is not assigned to inspector '{inspector.get_full_name()}'"
            )
        
        db.delete(assignment)
        db.commit()
        
        # Invalidate inspector's permission cache
        await PermissionService.invalidate_inspector_cache(inspector_id)
        
        logging.info(
            f"Role {role_id} removed from inspector {inspector_id} by inspector {current_inspector.id}"
        )
        
        return SuccessResponse(
            message=f"Successfully removed role '{role.name}' from inspector '{inspector.get_full_name()}'"
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logging.error(f"Error removing role {role_id} from inspector {inspector_id}: {e}")
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to remove role from inspector"
        )


@router.get("/inspectors/{inspector_id}/roles", response_model=InspectorRolesResponse)
async def get_inspector_roles(
    inspector_id: int,
    db: Session = Depends(get_db),
    current_inspector: Inspector = Depends(require_permission("admin", "view_users"))
):
    """
    Get all roles assigned to an inspector.
    
    Requires admin:view_users permission.
    """
    try:
        # Verify inspector exists
        inspector = db.get(Inspector, inspector_id)
        if not inspector:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Inspector with ID {inspector_id} not found"
            )
        
        # Get all roles for this inspector
        roles = db.exec(
            select(Role)
            .join(InspectorRole, InspectorRole.role_id == Role.id)
            .where(InspectorRole.inspector_id == inspector_id)
            .order_by(Role.name)
        ).all()
        
        return InspectorRolesResponse(
            inspector_id=inspector_id,
            inspector_name=inspector.get_full_name(),
            roles=[RoleResponse.from_orm(role) for role in roles]
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logging.error(f"Error getting roles for inspector {inspector_id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve inspector roles"
        )


@router.post("/inspectors/bulk-assign-roles", response_model=SuccessResponse)
async def bulk_assign_roles_to_inspectors(
    assignment_data: BulkInspectorRoleAssignment,
    db: Session = Depends(get_db),
    current_inspector: Inspector = Depends(require_permission("admin", "manage_users"))
):
    """
    Assign roles to multiple inspectors (bulk operation).
    
    This adds the specified roles to all specified inspectors without removing existing roles.
    Requires admin:manage_users permission.
    """
    try:
        # Verify all inspectors exist
        inspectors = []
        for inspector_id in assignment_data.inspector_ids:
            inspector = db.get(Inspector, inspector_id)
            if not inspector:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail=f"Inspector with ID {inspector_id} not found"
                )
            inspectors.append(inspector)
        
        # Verify all roles exist
        roles = []
        for role_id in assignment_data.role_ids:
            role = db.get(Role, role_id)
            if not role:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail=f"Role with ID {role_id} not found"
                )
            roles.append(role)
        
        # Get existing assignments to avoid duplicates
        existing_assignments = db.exec(
            select(InspectorRole)
            .where(
                and_(
                    InspectorRole.inspector_id.in_(assignment_data.inspector_ids),
                    InspectorRole.role_id.in_(assignment_data.role_ids)
                )
            )
        ).all()
        
        existing_pairs = {(a.inspector_id, a.role_id) for a in existing_assignments}
        
        # Create new assignments
        new_assignments_count = 0
        skipped_count = 0
        
        for inspector_id in assignment_data.inspector_ids:
            for role_id in assignment_data.role_ids:
                if (inspector_id, role_id) not in existing_pairs:
                    inspector_role = InspectorRole(
                        inspector_id=inspector_id,
                        role_id=role_id,
                        created_at=datetime.utcnow()
                    )
                    db.add(inspector_role)
                    new_assignments_count += 1
                else:
                    skipped_count += 1
        
        db.commit()
        
        # Invalidate caches for all affected inspectors
        for inspector_id in assignment_data.inspector_ids:
            await PermissionService.invalidate_inspector_cache(inspector_id)
        
        logging.info(
            f"Bulk role assignment by inspector {current_inspector.id}. "
            f"Inspectors: {len(assignment_data.inspector_ids)}, Roles: {len(assignment_data.role_ids)}, "
            f"New assignments: {new_assignments_count}, Skipped: {skipped_count}"
        )
        
        message = f"Successfully processed bulk assignment for {len(assignment_data.inspector_ids)} inspectors "
        message += f"and {len(assignment_data.role_ids)} roles. "
        message += f"New assignments: {new_assignments_count}, Already assigned: {skipped_count}"
        
        return SuccessResponse(message=message)
        
    except HTTPException:
        raise
    except Exception as e:
        logging.error(f"Error in bulk role assignment: {e}")
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to perform bulk role assignment"
        )


@router.get("/inspectors/{inspector_id}/available-roles")
async def get_available_roles_for_inspector(
    inspector_id: int,
    db: Session = Depends(get_db),
    current_inspector: Inspector = Depends(require_permission("admin", "view_users"))
):
    """
    Get roles that are not yet assigned to an inspector.
    
    Useful for UI dropdowns when adding roles to inspectors.
    Requires admin:view_users permission.
    """
    try:
        # Verify inspector exists
        inspector = db.get(Inspector, inspector_id)
        if not inspector:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Inspector with ID {inspector_id} not found"
            )
        
        # Get roles already assigned to this inspector
        assigned_role_ids = db.exec(
            select(InspectorRole.role_id)
            .where(InspectorRole.inspector_id == inspector_id)
        ).all()
        assigned_ids_set = set(assigned_role_ids)
        
        # Get all roles not assigned to this inspector
        all_roles = db.exec(select(Role)).all()
        available_roles = [
            role for role in all_roles 
            if role.id not in assigned_ids_set
        ]
        
        # Sort by name
        available_roles.sort(key=lambda r: r.name)
        
        return {
            "inspector_id": inspector_id,
            "inspector_name": inspector.get_full_name(),
            "available_roles": [
                RoleResponse.from_orm(role) for role in available_roles
            ],
            "total_available": len(available_roles),
            "total_assigned": len(assigned_ids_set)
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logging.error(f"Error getting available roles for inspector {inspector_id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to get available roles for inspector"
        )


@router.get("/inspectors/{inspector_id}/effective-permissions")
async def get_inspector_effective_permissions(
    inspector_id: int,
    db: Session = Depends(get_db),
    current_inspector: Inspector = Depends(require_permission("admin", "view_users"))
):
    """
    Get all effective permissions for an inspector (aggregated from all their roles).
    
    Requires admin:view_users permission.
    """
    try:
        # Verify inspector exists
        inspector = db.get(Inspector, inspector_id)
        if not inspector:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Inspector with ID {inspector_id} not found"
            )
        
        # Get all permissions through roles
        from app.domains.inspector.models.authorization import Permission, RolePermission
        
        permissions = db.exec(
            select(Permission)
            .join(RolePermission, RolePermission.permission_id == Permission.id)
            .join(Role, Role.id == RolePermission.role_id)
            .join(InspectorRole, InspectorRole.role_id == Role.id)
            .where(InspectorRole.inspector_id == inspector_id)
            .distinct()
            .order_by(Permission.resource, Permission.action)
        ).all()
        
        # Group permissions by resource
        permissions_by_resource = {}
        for perm in permissions:
            if perm.resource not in permissions_by_resource:
                permissions_by_resource[perm.resource] = []
            permissions_by_resource[perm.resource].append({
                "id": perm.id,
                "name": perm.name,
                "action": perm.action,
                "display_label": perm.display_label,
                "resource_action": f"{perm.resource}:{perm.action}"
            })
        
        return {
            "inspector_id": inspector_id,
            "inspector_name": inspector.get_full_name(),
            "total_permissions": len(permissions),
            "permissions_by_resource": permissions_by_resource,
            "all_permissions": [
                {
                    "id": perm.id,
                    "name": perm.name,
                    "resource": perm.resource,
                    "action": perm.action,
                    "display_label": perm.display_label,
                    "resource_action": f"{perm.resource}:{perm.action}"
                }
                for perm in permissions
            ]
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logging.error(f"Error getting effective permissions for inspector {inspector_id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to get inspector effective permissions"
        )