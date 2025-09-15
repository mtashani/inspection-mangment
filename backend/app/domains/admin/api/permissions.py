"""Permission Management API Endpoints"""

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlmodel import Session, select, func, or_, and_
from typing import Optional, List
import logging
from datetime import datetime

from app.database import get_session as get_db
from app.domains.auth.dependencies import require_permission
from app.domains.admin.schemas import (
    PermissionCreate, PermissionUpdate, PermissionResponse, PermissionListResponse,
    PermissionDiscoveryResponse, SuccessResponse, ErrorResponse
)
from app.domains.inspector.models.authorization import Permission, RolePermission
from app.domains.inspector.models.inspector import Inspector

router = APIRouter()


@router.post("/permissions", response_model=PermissionResponse, status_code=status.HTTP_201_CREATED)
async def create_permission(
    permission_data: PermissionCreate,
    db: Session = Depends(get_db),
    current_inspector: Inspector = Depends(require_permission("admin", "manage_permissions"))
):
    """
    Create a new permission.
    
    Requires admin:manage_permissions permission.
    """
    try:
        # Check if permission name already exists
        existing_permission = db.exec(
            select(Permission).where(Permission.name == permission_data.name)
        ).first()
        
        if existing_permission:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=f"Permission with name '{permission_data.name}' already exists"
            )
        
        # Check if resource:action combination already exists
        existing_combination = db.exec(
            select(Permission).where(
                and_(
                    Permission.resource == permission_data.resource,
                    Permission.action == permission_data.action
                )
            )
        ).first()
        
        if existing_combination:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=f"Permission for '{permission_data.resource}:{permission_data.action}' already exists"
            )
        
        # Create new permission
        new_permission = Permission(
            name=permission_data.name,
            description=permission_data.description,
            resource=permission_data.resource,
            action=permission_data.action,
            display_label=permission_data.display_label,
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow()
        )
        
        db.add(new_permission)
        db.commit()
        db.refresh(new_permission)
        
        logging.info(f"Permission '{permission_data.name}' created by inspector {current_inspector.id}")
        
        return PermissionResponse.from_orm(new_permission)
        
    except HTTPException:
        raise
    except Exception as e:
        logging.error(f"Error creating permission: {e}")
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create permission"
        )


@router.get("/permissions", response_model=PermissionListResponse)
async def list_permissions(
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(20, ge=1, le=100, description="Items per page"),
    search: Optional[str] = Query(None, description="Search in permission name or description"),
    resource: Optional[str] = Query(None, description="Filter by resource"),
    action: Optional[str] = Query(None, description="Filter by action"),
    db: Session = Depends(get_db),
    current_inspector: Inspector = Depends(require_permission("admin", "view_permissions"))
):
    """
    List permissions with filtering and pagination.
    
    Requires admin:view_permissions permission.
    """
    try:
        # Build query
        query = select(Permission)
        filters = []
        
        # Apply search filter
        if search:
            search_filter = or_(
                Permission.name.ilike(f"%{search}%"),
                Permission.description.ilike(f"%{search}%"),
                Permission.display_label.ilike(f"%{search}%")
            )
            filters.append(search_filter)
        
        # Apply resource filter
        if resource:
            filters.append(Permission.resource == resource)
        
        # Apply action filter
        if action:
            filters.append(Permission.action == action)
        
        # Combine filters
        if filters:
            query = query.where(and_(*filters))
        
        # Get total count
        count_query = select(func.count(Permission.id))
        if filters:
            count_query = count_query.where(and_(*filters))
        total = db.exec(count_query).one()
        
        # Apply pagination
        offset = (page - 1) * page_size
        query = query.offset(offset).limit(page_size)
        
        # Order by resource, then action
        query = query.order_by(Permission.resource, Permission.action)
        
        permissions = db.exec(query).all()
        
        total_pages = (total + page_size - 1) // page_size
        
        return PermissionListResponse(
            permissions=[PermissionResponse.from_orm(perm) for perm in permissions],
            total=total,
            page=page,
            page_size=page_size,
            total_pages=total_pages
        )
        
    except Exception as e:
        logging.error(f"Error listing permissions: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve permissions"
        )


@router.get("/permissions/discovery", response_model=PermissionDiscoveryResponse)
async def discover_permissions(
    db: Session = Depends(get_db),
    current_inspector: Inspector = Depends(require_permission("admin", "view_permissions"))
):
    """
    Discover available resources and actions for permission creation.
    
    Returns all possible resource-action combinations.
    Requires admin:view_permissions permission.
    """
    try:
        # Define available resources and actions based on system design
        resources = [
            'psv', 'ndt', 'mechanical', 'corrosion', 'crane', 'electrical',
            'instrumentation', 'report', 'admin', 'quality', 'inspector'
        ]
        
        actions = [
            'create', 'view', 'edit_own', 'edit_all', 'approve', 'final_approve',
            'delete_own', 'delete_section', 'delete_all', 'manage', 'execute_test'
        ]
        
        # Get existing combinations from database
        existing_permissions = db.exec(select(Permission)).all()
        existing_combinations = {f"{p.resource}:{p.action}" for p in existing_permissions}
        
        # Generate all possible combinations
        all_combinations = []
        for resource in resources:
            for action in actions:
                combination = f"{resource}:{action}"
                all_combinations.append(combination)
        
        return PermissionDiscoveryResponse(
            resources=resources,
            actions=actions,
            available_combinations=all_combinations
        )
        
    except Exception as e:
        logging.error(f"Error discovering permissions: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to discover permissions"
        )


@router.get("/permissions/{permission_id}", response_model=PermissionResponse)
async def get_permission(
    permission_id: int,
    db: Session = Depends(get_db),
    current_inspector: Inspector = Depends(require_permission("admin", "view_permissions"))
):
    """
    Get a specific permission by ID.
    
    Requires admin:view_permissions permission.
    """
    try:
        permission = db.get(Permission, permission_id)
        if not permission:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Permission with ID {permission_id} not found"
            )
        
        return PermissionResponse.from_orm(permission)
        
    except HTTPException:
        raise
    except Exception as e:
        logging.error(f"Error getting permission {permission_id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve permission"
        )


@router.put("/permissions/{permission_id}", response_model=PermissionResponse)
async def update_permission(
    permission_id: int,
    permission_data: PermissionUpdate,
    db: Session = Depends(get_db),
    current_inspector: Inspector = Depends(require_permission("admin", "manage_permissions"))
):
    """
    Update permission details.
    
    Requires admin:manage_permissions permission.
    """
    try:
        permission = db.get(Permission, permission_id)
        if not permission:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Permission with ID {permission_id} not found"
            )
        
        # Check if new name conflicts with existing permission
        if permission_data.name and permission_data.name != permission.name:
            existing_permission = db.exec(
                select(Permission).where(Permission.name == permission_data.name)
            ).first()
            
            if existing_permission:
                raise HTTPException(
                    status_code=status.HTTP_409_CONFLICT,
                    detail=f"Permission with name '{permission_data.name}' already exists"
                )
        
        # Check if new resource:action combination conflicts
        if permission_data.resource or permission_data.action:
            new_resource = permission_data.resource or permission.resource
            new_action = permission_data.action or permission.action
            
            if new_resource != permission.resource or new_action != permission.action:
                existing_combination = db.exec(
                    select(Permission).where(
                        and_(
                            Permission.resource == new_resource,
                            Permission.action == new_action,
                            Permission.id != permission_id
                        )
                    )
                ).first()
                
                if existing_combination:
                    raise HTTPException(
                        status_code=status.HTTP_409_CONFLICT,
                        detail=f"Permission for '{new_resource}:{new_action}' already exists"
                    )
        
        # Update fields
        update_data = permission_data.dict(exclude_unset=True)
        for field, value in update_data.items():
            setattr(permission, field, value)
        
        permission.updated_at = datetime.utcnow()
        
        db.add(permission)
        db.commit()
        db.refresh(permission)
        
        logging.info(f"Permission {permission_id} updated by inspector {current_inspector.id}")
        
        return PermissionResponse.from_orm(permission)
        
    except HTTPException:
        raise
    except Exception as e:
        logging.error(f"Error updating permission {permission_id}: {e}")
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to update permission"
        )


@router.delete("/permissions/{permission_id}", response_model=SuccessResponse)
async def delete_permission(
    permission_id: int,
    db: Session = Depends(get_db),
    current_inspector: Inspector = Depends(require_permission("admin", "manage_permissions"))
):
    """
    Delete a permission with dependency checking.
    
    Requires admin:manage_permissions permission.
    """
    try:
        permission = db.get(Permission, permission_id)
        if not permission:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Permission with ID {permission_id} not found"
            )
        
        # Check for role assignments
        role_assignments = db.exec(
            select(func.count(RolePermission.role_id))
            .where(RolePermission.permission_id == permission_id)
        ).one()
        
        if role_assignments > 0:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=f"Cannot delete permission '{permission.name}'. It is assigned to {role_assignments} role(s). "
                       f"Remove all assignments before deleting."
            )
        
        # Delete the permission
        db.delete(permission)
        db.commit()
        
        logging.info(f"Permission '{permission.name}' (ID: {permission_id}) deleted by inspector {current_inspector.id}")
        
        return SuccessResponse(
            message=f"Permission '{permission.name}' deleted successfully"
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logging.error(f"Error deleting permission {permission_id}: {e}")
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to delete permission"
        )


@router.get("/permissions/{permission_id}/usage")
async def get_permission_usage(
    permission_id: int,
    db: Session = Depends(get_db),
    current_inspector: Inspector = Depends(require_permission("admin", "view_permissions"))
):
    """
    Get usage information for a permission (which roles use it).
    
    Requires admin:view_permissions permission.
    """
    try:
        permission = db.get(Permission, permission_id)
        if not permission:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Permission with ID {permission_id} not found"
            )
        
        # Get roles that use this permission
        from app.domains.inspector.models.authorization import Role
        
        roles_using_permission = db.exec(
            select(Role)
            .join(RolePermission, RolePermission.role_id == Role.id)
            .where(RolePermission.permission_id == permission_id)
        ).all()
        
        return {
            "permission_id": permission_id,
            "permission_name": permission.name,
            "resource_action": f"{permission.resource}:{permission.action}",
            "usage_count": len(roles_using_permission),
            "roles_using": [
                {
                    "id": role.id,
                    "name": role.name,
                    "display_label": role.display_label
                }
                for role in roles_using_permission
            ],
            "can_delete": len(roles_using_permission) == 0
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logging.error(f"Error getting permission usage for permission {permission_id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to get permission usage"
        )