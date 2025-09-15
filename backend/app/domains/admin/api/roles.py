"""Role Management API Endpoints"""

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlmodel import Session, select, func, or_
from typing import Optional
import logging
from datetime import datetime

from app.database import get_session as get_db
from app.domains.auth.dependencies import require_permission
from app.domains.admin.schemas import (
    RoleCreate, RoleUpdate, RoleResponse, RoleListResponse,
    SuccessResponse, ErrorResponse, PaginationParams, RoleFilterParams
)
from app.domains.inspector.models.authorization import Role, InspectorRole
from app.domains.inspector.models.inspector import Inspector

router = APIRouter()


@router.post("/roles", response_model=RoleResponse, status_code=status.HTTP_201_CREATED)
async def create_role(
    role_data: RoleCreate,
    db: Session = Depends(get_db),
    current_inspector: Inspector = Depends(require_permission("admin", "manage_roles"))
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
        
        return RoleResponse.from_orm(new_role)
        
    except HTTPException:
        raise
    except Exception as e:
        logging.error(f"Error creating role: {e}")
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create role"
        )


@router.get("/roles", response_model=RoleListResponse)
async def list_roles(
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(20, ge=1, le=100, description="Items per page"),
    search: Optional[str] = Query(None, description="Search in role name or description"),
    db: Session = Depends(get_db),
    current_inspector: Inspector = Depends(require_permission("admin", "view_roles"))
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
        
        total_pages = (total + page_size - 1) // page_size
        
        return RoleListResponse(
            roles=[RoleResponse.from_orm(role) for role in roles],
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
    current_inspector: Inspector = Depends(require_permission("admin", "view_roles"))
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
        
        return RoleResponse.from_orm(role)
        
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
    current_inspector: Inspector = Depends(require_permission("admin", "manage_roles"))
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
        
        return RoleResponse.from_orm(role)
        
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
    current_inspector: Inspector = Depends(require_permission("admin", "manage_roles"))
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
        
        # Delete the role (this will cascade to role_permissions due to foreign key constraints)
        db.delete(role)
        db.commit()
        
        logging.info(f"Role '{role.name}' (ID: {role_id}) deleted by inspector {current_inspector.id}")
        
        return SuccessResponse(
            message=f"Role '{role.name}' deleted successfully"
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
    current_inspector: Inspector = Depends(require_permission("admin", "view_roles"))
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