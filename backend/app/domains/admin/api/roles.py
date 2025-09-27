"""Role Management API Endpoints"""

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlmodel import Session, select, func, or_
from typing import Optional
import logging
from datetime import datetime

from app.database import get_session as get_db
from app.domains.auth.dependencies import require_standardized_permission
from app.domains.admin.schemas import (
    RoleCreate, RoleCreateWithPermissions, RoleUpdate, RoleResponse, RoleListResponse,
    SuccessResponse, ErrorResponse, PaginationParams, RoleFilterParams
)
from app.domains.inspector.models.authorization import Role, InspectorRole, RolePermission, Permission
from app.domains.inspector.models.inspector import Inspector

router = APIRouter()


@router.post("/roles", response_model=RoleResponse, status_code=status.HTTP_201_CREATED)
async def create_role(
    role_data: RoleCreate,
    db: Session = Depends(get_db),
    current_inspector: Inspector = Depends(require_standardized_permission("system_superadmin"))
):
    """
    Create a new role with validation.
    
    Requires admin:manage_roles permission.
    """
    try:
        # Check if role name already exists
        existing_role = db.exec(
            select(Role).where(Role.name == role_data.name)
        ).first()
        
        if existing_role:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=f"Role with name '{role_data.name}' already exists"
            )
        
        # Create new role
        new_role = Role(
            name=role_data.name,
            description=role_data.description,
            display_label=role_data.display_label,
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow()
        )
        
        db.add(new_role)
        db.commit()
        db.refresh(new_role)
        
        logging.info(f"Role '{role_data.name}' created by inspector {current_inspector.id}")
        
        return RoleResponse.model_validate(new_role)
        
    except HTTPException:
        raise
    except Exception as e:
        logging.error(f"Error creating role: {e}")
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create role"
        )


@router.post("/roles/with-permissions", response_model=RoleResponse, status_code=status.HTTP_201_CREATED)
async def create_role_with_permissions(
    role_data: RoleCreateWithPermissions,
    db: Session = Depends(get_db),
    current_inspector: Inspector = Depends(require_standardized_permission("system_superadmin"))
):
    """
    Create a new role with initial permissions in a single atomic operation.
    
    This endpoint ensures consistent role creation with permission assignment.
    Requires system_superadmin permission.
    """
    try:
        # Check if role name already exists
        existing_role = db.exec(
            select(Role).where(Role.name == role_data.name)
        ).first()
        
        if existing_role:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=f"Role with name '{role_data.name}' already exists"
            )
        
        # Verify all permissions exist if provided
        if role_data.permission_ids:
            for permission_id in role_data.permission_ids:
                permission = db.get(Permission, permission_id)
                if not permission:
                    raise HTTPException(
                        status_code=status.HTTP_404_NOT_FOUND,
                        detail=f"Permission with ID {permission_id} not found"
                    )
        
        # Create new role
        new_role = Role(
            name=role_data.name,
            description=role_data.description,
            display_label=role_data.display_label,
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow()
        )
        
        db.add(new_role)
        db.flush()  # Get the role ID without committing
        
        # Assign permissions if provided
        if role_data.permission_ids:
            for permission_id in role_data.permission_ids:
                role_permission = RolePermission(
                    role_id=new_role.id,
                    permission_id=permission_id,
                    created_at=datetime.utcnow()
                )
                db.add(role_permission)
        
        db.commit()
        db.refresh(new_role)
        
        # Invalidate caches if permissions were assigned
        if role_data.permission_ids:
            try:
                from app.domains.auth.services.cache_service import CacheService
                await CacheService.invalidate_role_cache(new_role.id)
                await CacheService.invalidate_all_caches()
            except Exception as cache_error:
                # Log cache invalidation error but don't fail the operation
                logging.warning(f"Cache invalidation failed for role {new_role.id}: {cache_error}")
        
        logging.info(
            f"Role '{role_data.name}' created with {len(role_data.permission_ids or [])} permissions "
            f"by inspector {current_inspector.id}"
        )
        
        return RoleResponse.model_validate(new_role)
        
    except HTTPException:
        raise
    except Exception as e:
        logging.error(f"Error creating role with permissions: {e}")
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create role with permissions"
        )


@router.get("/roles", response_model=RoleListResponse)
async def list_roles(
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(20, ge=1, le=100, description="Items per page"),
    search: Optional[str] = Query(None, description="Search in role name or description"),
    db: Session = Depends(get_db),
    current_inspector: Inspector = Depends(require_standardized_permission("system_superadmin"))
):
    """
    List all roles with pagination and optional search.
    
    Requires admin:view_roles permission.
    """
    try:
        # Build query
        query = select(Role)
        
        # Apply search filter
        if search:
            search_filter = or_(
                Role.name.ilike(f"%{search}%"),
                Role.description.ilike(f"%{search}%"),
                Role.display_label.ilike(f"%{search}%")
            )
            query = query.where(search_filter)
        
        # Get total count
        count_query = select(func.count(Role.id))
        if search:
            count_query = count_query.where(search_filter)
        total = db.exec(count_query).one()
        
        # Apply pagination
        offset = (page - 1) * page_size
        query = query.offset(offset).limit(page_size)
        
        # Order by name
        query = query.order_by(Role.name)
        
        roles = db.exec(query).all()
        
        # Get inspector counts and permissions for each role
        role_responses = []
        for role in roles:
            # Get inspector count for this role
            inspector_count = db.exec(
                select(func.count(InspectorRole.inspector_id))
                .where(InspectorRole.role_id == role.id)
            ).one()
            
            # Get permissions for this role
            from app.domains.inspector.models.authorization import Permission, RolePermission
            permissions = db.exec(
                select(Permission.name)
                .join(RolePermission, RolePermission.permission_id == Permission.id)
                .where(RolePermission.role_id == role.id)
            ).all()
            
            # Create response data by constructing a clean dict
            response_data = {
                'id': role.id,
                'name': role.name,
                'description': role.description,
                'display_label': role.display_label,
                'created_at': role.created_at,
                'updated_at': role.updated_at,
                'inspector_count': inspector_count,
                'permission_count': len(permissions),
                'permissions': list(permissions)  # Convert to list of strings
            }
            
            role_responses.append(response_data)
        
        total_pages = (total + page_size - 1) // page_size
        
        return RoleListResponse(
            roles=role_responses,
            total=total,
            page=page,
            page_size=page_size,
            total_pages=total_pages
        )
        
    except Exception as e:
        logging.error(f"Error listing roles: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve roles"
        )


@router.get("/roles/{role_id}", response_model=RoleResponse)
async def get_role(
    role_id: int,
    db: Session = Depends(get_db),
    current_inspector: Inspector = Depends(require_standardized_permission("system_superadmin"))
):
    """
    Get a specific role by ID.
    
    Requires admin:view_roles permission.
    """
    try:
        role = db.get(Role, role_id)
        if not role:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Role with ID {role_id} not found"
            )
        
        # Get permissions for this role
        from app.domains.inspector.models.authorization import Permission, RolePermission
        permissions = db.exec(
            select(Permission.name)
            .join(RolePermission, RolePermission.permission_id == Permission.id)
            .where(RolePermission.role_id == role.id)
        ).all()
        
        # Get inspector count for this role
        inspector_count = db.exec(
            select(func.count(InspectorRole.inspector_id))
            .where(InspectorRole.role_id == role.id)
        ).one()
        
        # Create response data by constructing a clean dict
        response_data = {
            'id': role.id,
            'name': role.name,
            'description': role.description,
            'display_label': role.display_label,
            'created_at': role.created_at,
            'updated_at': role.updated_at,
            'inspector_count': inspector_count,
            'permission_count': len(permissions),
            'permissions': list(permissions)  # Convert to list of strings
        }
        
        return RoleResponse.model_validate(response_data)
        
    except HTTPException:
        raise
    except Exception as e:
        logging.error(f"Error getting role {role_id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve role"
        )


@router.put("/roles/{role_id}", response_model=RoleResponse)
async def update_role(
    role_id: int,
    role_data: RoleUpdate,
    db: Session = Depends(get_db),
    current_inspector: Inspector = Depends(require_standardized_permission("system_superadmin"))
):
    """
    Update role details.
    
    Requires admin:manage_roles permission.
    """
    try:
        role = db.get(Role, role_id)
        if not role:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Role with ID {role_id} not found"
            )
        
        # Check if new name conflicts with existing role
        if role_data.name and role_data.name != role.name:
            existing_role = db.exec(
                select(Role).where(Role.name == role_data.name)
            ).first()
            
            if existing_role:
                raise HTTPException(
                    status_code=status.HTTP_409_CONFLICT,
                    detail=f"Role with name '{role_data.name}' already exists"
                )
        
        # Update fields
        update_data = role_data.dict(exclude_unset=True)
        for field, value in update_data.items():
            setattr(role, field, value)
        
        role.updated_at = datetime.utcnow()
        
        db.add(role)
        db.commit()
        db.refresh(role)
        
        logging.info(f"Role {role_id} updated by inspector {current_inspector.id}")
        
        # Get permissions for this role to include in response
        from app.domains.inspector.models.authorization import Permission, RolePermission
        permissions = db.exec(
            select(Permission.name)
            .join(RolePermission, RolePermission.permission_id == Permission.id)
            .where(RolePermission.role_id == role.id)
        ).all()
        
        # Get inspector count for this role
        inspector_count = db.exec(
            select(func.count(InspectorRole.inspector_id))
            .where(InspectorRole.role_id == role.id)
        ).one()
        
        # Create response data by constructing a clean dict
        response_data = {
            'id': role.id,
            'name': role.name,
            'description': role.description,
            'display_label': role.display_label,
            'created_at': role.created_at,
            'updated_at': role.updated_at,
            'inspector_count': inspector_count,
            'permission_count': len(permissions),
            'permissions': list(permissions)  # Convert to list of strings
        }
        
        return RoleResponse.model_validate(response_data)
        
    except HTTPException:
        raise
    except Exception as e:
        logging.error(f"Error updating role {role_id}: {e}")
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to update role"
        )


@router.delete("/roles/{role_id}", response_model=SuccessResponse)
async def delete_role(
    role_id: int,
    db: Session = Depends(get_db),
    current_inspector: Inspector = Depends(require_standardized_permission("system_superadmin"))
):
    """
    Delete a role with safety checks for active assignments.
    
    Requires admin:manage_roles permission.
    """
    try:
        role = db.get(Role, role_id)
        if not role:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Role with ID {role_id} not found"
            )
        
        # Check for active inspector assignments
        inspector_assignments = db.exec(
            select(func.count(InspectorRole.inspector_id))
            .where(InspectorRole.role_id == role_id)
        ).one()
        
        if inspector_assignments > 0:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=f"Cannot delete role '{role.name}'. It is assigned to {inspector_assignments} inspector(s). "
                       f"Remove all assignments before deleting."
            )
        
        # Delete the role with proper cleanup
        try:
            # Remove role-permission assignments first
            from app.domains.inspector.models.authorization import RolePermission
            role_permissions = db.exec(
                select(RolePermission).where(RolePermission.role_id == role_id)
            ).all()
            
            for role_permission in role_permissions:
                db.delete(role_permission)
            
            # Now delete the role
            db.delete(role)
            db.commit()
            
            # Invalidate caches after successful deletion
            try:
                from app.domains.auth.services.cache_service import CacheService
                await CacheService.invalidate_role_cache(role_id)
                await CacheService.invalidate_all_caches()
            except Exception as cache_error:
                # Log cache invalidation error but don't fail the operation
                logging.warning(f"Cache invalidation failed for deleted role {role_id}: {cache_error}")
            
            logging.info(f"Role '{role.name}' (ID: {role_id}) deleted by inspector {current_inspector.id}")
            
            return SuccessResponse(
                message=f"Role '{role.name}' deleted successfully"
            )
            
        except Exception as delete_error:
            db.rollback()
            logging.error(f"Error during role deletion: {delete_error}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to delete role: {str(delete_error)}"
            )
        
    except HTTPException:
        raise
    except Exception as e:
        logging.error(f"Error deleting role {role_id}: {e}")
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to delete role"
        )


@router.get("/roles/{role_id}/assignments/count")
async def get_role_assignment_count(
    role_id: int,
    db: Session = Depends(get_db),
    current_inspector: Inspector = Depends(require_standardized_permission("system_superadmin"))
):
    """
    Get the number of inspectors assigned to a role.
    
    Useful for checking before deletion.
    Requires admin:view_roles permission.
    """
    try:
        role = db.get(Role, role_id)
        if not role:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Role with ID {role_id} not found"
            )
        
        assignment_count = db.exec(
            select(func.count(InspectorRole.inspector_id))
            .where(InspectorRole.role_id == role_id)
        ).one()
        
        return {
            "role_id": role_id,
            "role_name": role.name,
            "assignment_count": assignment_count,
            "can_delete": assignment_count == 0
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logging.error(f"Error getting role assignment count for role {role_id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to get role assignment count"
        )


@router.get("/roles/{role_id}/impact-analysis")
async def get_role_impact_analysis(
    role_id: int,
    db: Session = Depends(get_db),
    current_inspector: Inspector = Depends(require_standardized_permission("system_superadmin"))
):
    """
    Get impact analysis for a role (which inspectors would be affected by changes).
    
    Requires system_superadmin permission.
    """
    try:
        role = db.get(Role, role_id)
        if not role:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Role with ID {role_id} not found"
            )
        
        # Get affected inspectors count
        affected_inspectors_count = db.exec(
            select(func.count(InspectorRole.inspector_id))
            .where(InspectorRole.role_id == role_id)
        ).one()
        
        # Get dependent roles (this is a simple example - could be more complex)
        dependent_roles = []
        
        # Get permission changes (list of permissions this role has)
        from app.domains.inspector.models.authorization import Permission, RolePermission
        permissions = db.exec(
            select(Permission.name)
            .join(RolePermission, RolePermission.permission_id == Permission.id)
            .where(RolePermission.role_id == role_id)
        ).all()
        
        security_implications = []
        if 'system_superadmin' in permissions:
            security_implications.append('Role has system administrator privileges')
        if 'system_hr_manage' in permissions:
            security_implications.append('Role can manage inspector data')
        
        return {
            "affectedInspectors": affected_inspectors_count,
            "dependentRoles": dependent_roles,
            "permissionChanges": list(permissions),
            "securityImplications": security_implications
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logging.error(f"Error getting role impact analysis {role_id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to get role impact analysis"
        )