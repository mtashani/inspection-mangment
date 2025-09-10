from datetime import datetime
from typing import Any, List, Optional

from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import and_, or_

from app.api.deps import get_db, admin_required, get_current_active_inspector
from app.domains.auth.schemas import (
    InspectorCreate, 
    InspectorUpdate,
    InspectorResponse,
    InspectorWithRoles,
    RoleResponse,
    RoleCreate,
    RoleUpdate,
    RoleAssignment,
    PermissionCreate,
    PermissionResponse
)
from app.domains.inspector.models.inspector import Inspector
from app.domains.inspector.models.authorization import Role, Permission, RolePermission, InspectorRole
from app.domains.inspector.models.documents import InspectorDocument, DocumentType
from app.domains.auth.services.auth_service import AuthService
from app.domains.auth.services.permission_service import PermissionService
from app.domains.storage.services.s3_service import s3_service

router = APIRouter()


# Inspector management endpoints
@router.post("/inspectors", response_model=InspectorResponse, status_code=status.HTTP_201_CREATED)
async def create_inspector(
    inspector_in: InspectorCreate,
    db: AsyncSession = Depends(get_db),
    _: bool = Depends(admin_required),
) -> Any:
    """Create new inspector (admin only)"""
    # Check if inspector with this employee ID already exists
    result = await db.execute(
        select(Inspector).where(
            or_(
                Inspector.employee_id == inspector_in.employee_id,
                Inspector.email == inspector_in.email
            )
        )
    )
    if result.scalars().first():
        raise HTTPException(
            status_code=400,
            detail="Inspector with this employee ID or email already exists"
        )
    
    # Create username from employee ID if not provided
    username = inspector_in.employee_id.lower()
    
    # Hash the password
    hashed_password = AuthService.get_password_hash(inspector_in.password)
    
    # Create the inspector
    inspector = Inspector(
        name=inspector_in.name,
        employee_id=inspector_in.employee_id,
        inspector_type=inspector_in.inspector_type,
        email=inspector_in.email,
        phone=inspector_in.phone,
        department=inspector_in.department,
        years_experience=inspector_in.years_experience,
        specialties=inspector_in.specialties,
        active=inspector_in.active,
        available=inspector_in.available,
        date_of_birth=inspector_in.date_of_birth,
        username=username,
        password_hash=hashed_password,
        can_login=inspector_in.can_login
    )
    
    db.add(inspector)
    await db.commit()
    await db.refresh(inspector)
    
    return inspector


@router.get("/inspectors", response_model=List[InspectorResponse])
async def get_inspectors(
    skip: int = 0,
    limit: int = 100,
    inspector_type: Optional[str] = None,
    active: Optional[bool] = None,
    db: AsyncSession = Depends(get_db),
    _: bool = Depends(admin_required),
) -> Any:
    """Get all inspectors (admin only)"""
    query = select(Inspector)
    
    # Apply filters if provided
    if inspector_type:
        query = query.where(Inspector.inspector_type == inspector_type)
        
    if active is not None:
        query = query.where(Inspector.active == active)
        
    query = query.offset(skip).limit(limit)
    result = await db.execute(query)
    
    return result.scalars().all()


@router.get("/inspectors/{inspector_id}", response_model=InspectorWithRoles)
async def get_inspector(
    inspector_id: int,
    db: AsyncSession = Depends(get_db),
    _: bool = Depends(admin_required),
) -> Any:
    """Get inspector by ID (admin only)"""
    result = await db.execute(select(Inspector).where(Inspector.id == inspector_id))
    inspector = result.scalars().first()
    
    if not inspector:
        raise HTTPException(
            status_code=404,
            detail="Inspector not found"
        )
        
    # Get roles
    roles_result = await db.execute(
        select(Role)
        .join(InspectorRole, InspectorRole.role_id == Role.id)
        .where(InspectorRole.inspector_id == inspector_id)
    )
    roles = roles_result.scalars().all()
    
    # Create response with roles
    response = InspectorWithRoles.from_orm(inspector)
    response.roles = [RoleResponse.from_orm(role) for role in roles]
    
    return response


@router.put("/inspectors/{inspector_id}", response_model=InspectorResponse)
async def update_inspector(
    inspector_id: int,
    inspector_in: InspectorUpdate,
    db: AsyncSession = Depends(get_db),
    _: bool = Depends(admin_required),
) -> Any:
    """Update inspector (admin only)"""
    result = await db.execute(select(Inspector).where(Inspector.id == inspector_id))
    inspector = result.scalars().first()
    
    if not inspector:
        raise HTTPException(
            status_code=404,
            detail="Inspector not found"
        )
        
    # Update inspector fields
    update_data = inspector_in.dict(exclude_unset=True)
    
    # Handle password separately if provided
    if "password" in update_data:
        password = update_data.pop("password")
        inspector.password_hash = AuthService.get_password_hash(password)
        
    # Update other fields
    for field, value in update_data.items():
        setattr(inspector, field, value)
        
    inspector.updated_at = datetime.utcnow()
    
    await db.commit()
    await db.refresh(inspector)
    
    return inspector


@router.delete("/inspectors/{inspector_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_inspector(
    inspector_id: int,
    db: AsyncSession = Depends(get_db),
    _: bool = Depends(admin_required),
) -> Any:
    """Delete inspector (admin only)"""
    result = await db.execute(select(Inspector).where(Inspector.id == inspector_id))
    inspector = result.scalars().first()
    
    if not inspector:
        raise HTTPException(
            status_code=404,
            detail="Inspector not found"
        )
        
    # Instead of deleting, deactivate
    inspector.active = False
    inspector.can_login = False
    inspector.updated_at = datetime.utcnow()
    
    await db.commit()
    
    return None


# Role management endpoints
@router.post("/roles", response_model=RoleResponse, status_code=status.HTTP_201_CREATED)
async def create_role(
    role_in: RoleCreate,
    db: AsyncSession = Depends(get_db),
    _: bool = Depends(admin_required),
) -> Any:
    """Create new role (admin only)"""
    role = await PermissionService.create_role(
        db=db,
        name=role_in.name,
        description=role_in.description
    )
    return role


@router.get("/roles", response_model=List[RoleResponse])
async def get_roles(
    db: AsyncSession = Depends(get_db),
    _: bool = Depends(admin_required),
) -> Any:
    """Get all roles (admin only)"""
    result = await db.execute(select(Role))
    return result.scalars().all()


@router.get("/roles/{role_id}", response_model=RoleResponse)
async def get_role(
    role_id: int,
    db: AsyncSession = Depends(get_db),
    _: bool = Depends(admin_required),
) -> Any:
    """Get role by ID (admin only)"""
    result = await db.execute(select(Role).where(Role.id == role_id))
    role = result.scalars().first()
    
    if not role:
        raise HTTPException(
            status_code=404,
            detail="Role not found"
        )
        
    return role


@router.put("/roles/{role_id}", response_model=RoleResponse)
async def update_role(
    role_id: int,
    role_in: RoleUpdate,
    db: AsyncSession = Depends(get_db),
    _: bool = Depends(admin_required),
) -> Any:
    """Update role (admin only)"""
    result = await db.execute(select(Role).where(Role.id == role_id))
    role = result.scalars().first()
    
    if not role:
        raise HTTPException(
            status_code=404,
            detail="Role not found"
        )
        
    # Update fields
    update_data = role_in.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(role, field, value)
        
    role.updated_at = datetime.utcnow()
    
    await db.commit()
    await db.refresh(role)
    
    return role


@router.delete("/roles/{role_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_role(
    role_id: int,
    db: AsyncSession = Depends(get_db),
    _: bool = Depends(admin_required),
) -> Any:
    """Delete role (admin only)"""
    result = await db.execute(select(Role).where(Role.id == role_id))
    role = result.scalars().first()
    
    if not role:
        raise HTTPException(
            status_code=404,
            detail="Role not found"
        )
        
    await db.delete(role)
    await db.commit()
    
    return None


# Inspector role assignments
@router.post("/inspectors/{inspector_id}/roles", status_code=status.HTTP_201_CREATED)
async def assign_role_to_inspector(
    inspector_id: int,
    role_assignment: RoleAssignment,
    db: AsyncSession = Depends(get_db),
    _: bool = Depends(admin_required),
) -> Any:
    """Assign role to inspector (admin only)"""
    # Verify inspector exists
    inspector_result = await db.execute(select(Inspector).where(Inspector.id == inspector_id))
    inspector = inspector_result.scalars().first()
    
    if not inspector:
        raise HTTPException(
            status_code=404,
            detail="Inspector not found"
        )
        
    # Verify role exists
    role_result = await db.execute(select(Role).where(Role.id == role_assignment.role_id))
    role = role_result.scalars().first()
    
    if not role:
        raise HTTPException(
            status_code=404,
            detail="Role not found"
        )
        
    # Assign role
    success = await PermissionService.assign_role_to_inspector(
        db=db,
        inspector_id=inspector_id,
        role_id=role_assignment.role_id
    )
    
    if not success:
        raise HTTPException(
            status_code=400,
            detail="Role already assigned to inspector"
        )
        
    return {"message": f"Role '{role.name}' assigned to inspector successfully"}


@router.delete("/inspectors/{inspector_id}/roles/{role_id}", status_code=status.HTTP_204_NO_CONTENT)
async def remove_role_from_inspector(
    inspector_id: int,
    role_id: int,
    db: AsyncSession = Depends(get_db),
    _: bool = Depends(admin_required),
) -> Any:
    """Remove role from inspector (admin only)"""
    success = await PermissionService.remove_role_from_inspector(
        db=db,
        inspector_id=inspector_id,
        role_id=role_id
    )
    
    if not success:
        raise HTTPException(
            status_code=404,
            detail="Role assignment not found"
        )
        
    return None


# Permission endpoints
@router.post("/permissions", response_model=PermissionResponse, status_code=status.HTTP_201_CREATED)
async def create_permission(
    permission_in: PermissionCreate,
    db: AsyncSession = Depends(get_db),
    _: bool = Depends(admin_required),
) -> Any:
    """Create new permission (admin only)"""
    permission = await PermissionService.create_permission(
        db=db,
        name=permission_in.name,
        resource=permission_in.resource,
        action=permission_in.action,
        description=permission_in.description
    )
    return permission


@router.post("/roles/{role_id}/permissions/{permission_id}", status_code=status.HTTP_201_CREATED)
async def assign_permission_to_role(
    role_id: int,
    permission_id: int,
    db: AsyncSession = Depends(get_db),
    _: bool = Depends(admin_required),
) -> Any:
    """Assign permission to role (admin only)"""
    # Verify role exists
    role_result = await db.execute(select(Role).where(Role.id == role_id))
    role = role_result.scalars().first()
    
    if not role:
        raise HTTPException(
            status_code=404,
            detail="Role not found"
        )
        
    # Verify permission exists
    permission_result = await db.execute(select(Permission).where(Permission.id == permission_id))
    permission = permission_result.scalars().first()
    
    if not permission:
        raise HTTPException(
            status_code=404,
            detail="Permission not found"
        )
        
    # Assign permission to role
    success = await PermissionService.assign_permission_to_role(
        db=db,
        role_id=role_id,
        permission_id=permission_id
    )
    
    if not success:
        raise HTTPException(
            status_code=400,
            detail="Permission already assigned to role"
        )
        
    return {"message": f"Permission '{permission.name}' assigned to role '{role.name}' successfully"}