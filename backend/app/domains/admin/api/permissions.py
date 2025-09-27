"""Permission Management API Endpoints"""

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlmodel import Session, select, func, or_, and_
from typing import Optional, List
import logging
from datetime import datetime

from app.database import get_session as get_db
from app.domains.auth.dependencies import require_standardized_permission
from app.domains.admin.schemas import (
    PermissionCreate, PermissionUpdate, PermissionResponse, PermissionListResponse,
    PermissionDiscoveryResponse, SuccessResponse, ErrorResponse
)
from app.domains.inspector.models.authorization import Permission, RolePermission, InspectorRole
from app.domains.inspector.models.inspector import Inspector

router = APIRouter()


@router.post("/permissions", response_model=PermissionResponse, status_code=status.HTTP_201_CREATED)
async def create_permission(
    permission_data: PermissionCreate,
    db: Session = Depends(get_db),
    current_inspector: Inspector = Depends(require_standardized_permission("system_superadmin"))
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
        
        return PermissionResponse.model_validate(new_permission)
        
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
    current_inspector: Inspector = Depends(require_standardized_permission("system_superadmin"))
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
            permissions=[PermissionResponse.model_validate(perm) for perm in permissions],
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
    current_inspector: Inspector = Depends(require_standardized_permission("system_superadmin"))
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


# Enhanced RBAC Management Features

@router.get("/permissions/standardized")
async def get_standardized_permissions(
    db: Session = Depends(get_db),
    current_inspector: Inspector = Depends(require_standardized_permission("system_superadmin"))
):
    """
    Get all standardized permissions with their categories and descriptions.
    """
    try:
        from app.core.permissions import get_all_standardized_permissions, PERMISSION_DEFINITIONS
        
        standardized_perms = get_all_standardized_permissions()
        
        permissions = []
        for perm_name in standardized_perms:
            perm_def = PERMISSION_DEFINITIONS[perm_name]
            permissions.append({
                "name": perm_def['name'],
                "display_name": perm_def['display_name'],
                "description": perm_def['description'],
                "category": perm_def['category'],
                "domain": perm_def['domain'],
                "is_standardized": True
            })
        
        return {
            "permissions": permissions,
            "total_count": len(permissions),
            "categories": list(set(p['category'] for p in permissions)),
            "domains": list(set(p['domain'] for p in permissions))
        }
        
    except Exception as e:
        logging.error(f"Error getting standardized permissions: {e}")
        raise HTTPException(status_code=500, detail="Failed to get standardized permissions")


@router.get("/permissions/impact-analysis/{permission_id}")
async def get_permission_impact_analysis(
    permission_id: int,
    db: Session = Depends(get_db),
    current_inspector: Inspector = Depends(require_standardized_permission("system_superadmin"))
):
    """
    Analyze the impact of a permission change or deletion.
    """
    try:
        permission = db.get(Permission, permission_id)
        if not permission:
            raise HTTPException(status_code=404, detail="Permission not found")
        
        # Get roles using this permission
        from app.domains.inspector.models.authorization import Role, InspectorRole
        
        roles_using_permission = db.exec(
            select(Role)
            .join(RolePermission, RolePermission.role_id == Role.id)
            .where(RolePermission.permission_id == permission_id)
        ).all()
        
        # Get affected inspectors count
        affected_inspectors_count = db.exec(
            select(func.count(func.distinct(InspectorRole.inspector_id)))
            .join(Role, Role.id == InspectorRole.role_id)
            .join(RolePermission, RolePermission.role_id == Role.id)
            .where(RolePermission.permission_id == permission_id)
        ).one()
        
        return {
            "permission": {
                "id": permission.id,
                "name": permission.name,
                "resource": permission.resource,
                "action": permission.action,
                "description": permission.description
            },
            "impact_summary": {
                "affected_roles_count": len(roles_using_permission),
                "affected_inspectors_count": affected_inspectors_count,
                "can_safely_delete": affected_inspectors_count == 0
            },
            "affected_roles": [
                {
                    "id": role.id,
                    "name": role.name,
                    "display_label": role.display_label
                }
                for role in roles_using_permission
            ]
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logging.error(f"Error analyzing permission impact: {e}")
        raise HTTPException(status_code=500, detail="Failed to analyze permission impact")


@router.get("/permissions/usage-analytics")
async def get_permission_usage_analytics(
    db: Session = Depends(get_db),
    current_inspector: Inspector = Depends(require_standardized_permission("system_superadmin"))
):
    """
    Get usage analytics for all permissions.
    
    Requires system_superadmin permission.
    """
    try:
        from app.domains.inspector.models.authorization import Role, RolePermission
        
        # Get all permissions
        all_permissions = db.exec(select(Permission)).all()
        total_permissions = len(all_permissions)
        
        # Get permissions that are actually used
        used_permission_ids = db.exec(
            select(func.distinct(RolePermission.permission_id))
        ).all()
        used_permissions = len(used_permission_ids)
        
        # Get unused permissions
        unused_permissions = []
        for perm in all_permissions:
            if perm.id not in used_permission_ids:
                unused_permissions.append(perm.name)
        
        # Get most used permissions (by number of roles)
        most_used_query = db.exec(
            select(
                Permission.name,
                func.count(RolePermission.role_id).label('usage_count')
            )
            .join(RolePermission, RolePermission.permission_id == Permission.id)
            .group_by(Permission.id, Permission.name)
            .order_by(func.count(RolePermission.role_id).desc())
            .limit(10)
        ).all()
        
        most_used_permissions = [perm.name for perm in most_used_query]
        
        # Build role-permission matrix
        role_permission_matrix = {}
        roles = db.exec(select(Role)).all()
        
        for role in roles:
            permissions = db.exec(
                select(Permission.name)
                .join(RolePermission, RolePermission.permission_id == Permission.id)
                .where(RolePermission.role_id == role.id)
            ).all()
            role_permission_matrix[role.name] = list(permissions)
        
        return {
            "totalPermissions": total_permissions,
            "usedPermissions": used_permissions,
            "unusedPermissions": unused_permissions,
            "mostUsedPermissions": most_used_permissions,
            "rolePermissionMatrix": role_permission_matrix
        }
        
    except Exception as e:
        logging.error(f"Error getting permission usage analytics: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to get permission usage analytics"
        )



@router.get("/permissions-usage/bulk-stats")
async def get_all_permissions_usage_stats(
    db: Session = Depends(get_db),
    current_inspector: Inspector = Depends(require_standardized_permission("system_superadmin"))
):
    """
    Get usage statistics for all permissions at once (NEW PATH).
    
    Returns a mapping of permission_id -> usage_stats for efficient bulk loading.
    
    Requires system_superadmin permission.
    """
    try:
        # Get all permissions with their usage statistics in one query
        permission_usage_stats = db.exec(
            select(
                Permission.id,
                Permission.name,
                Permission.display_label,
                func.count(func.distinct(RolePermission.role_id)).label('roles_count'),
                func.count(func.distinct(InspectorRole.inspector_id)).label('inspectors_count')
            )
            .outerjoin(RolePermission, RolePermission.permission_id == Permission.id)
            .outerjoin(InspectorRole, InspectorRole.role_id == RolePermission.role_id)
            .group_by(Permission.id, Permission.name, Permission.display_label)
            .order_by(Permission.id)
        ).all()
        
        # Get total number of inspectors for percentage calculation
        total_inspectors = db.exec(select(func.count(Inspector.id))).one()
        
        # Build the usage statistics mapping
        usage_stats = {}
        for perm_id, perm_name, display_label, roles_count, inspectors_count in permission_usage_stats:
            usage_percentage = (inspectors_count / total_inspectors * 100) if total_inspectors > 0 else 0
            
            usage_stats[perm_id] = {
                "permission_id": perm_id,
                "permission_name": perm_name,
                "display_label": display_label or perm_name,
                "roles_count": roles_count,
                "inspectors_count": inspectors_count,
                "total_inspectors": total_inspectors,
                "usage_percentage": round(usage_percentage, 1)
            }
        
        return {
            "usage_stats": usage_stats,
            "total_permissions": len(usage_stats),
            "total_inspectors": total_inspectors
        }
        
    except Exception as e:
        logging.error(f"Error getting bulk permission usage stats: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to get bulk permission usage statistics"
        )


@router.get("/permissions/{permission_id}/usage")  
async def get_permission_usage_stats(
    permission_id: int,
    db: Session = Depends(get_db),
    current_inspector: Inspector = Depends(require_standardized_permission("system_superadmin"))
):
    """
    Get usage statistics for a specific permission.
    
    Returns:
    - Number of roles using this permission
    - Number of users/inspectors having this permission through roles
    - Usage percentage among total inspectors
    
    Requires system_superadmin permission.
    """
    try:
        # Verify permission exists
        permission = db.get(Permission, permission_id)
        if not permission:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Permission with ID {permission_id} not found"
            )
        
        # Count roles using this permission
        roles_count = db.exec(
            select(func.count(RolePermission.role_id))
            .where(RolePermission.permission_id == permission_id)
        ).one()
        
        # Count unique inspectors who have this permission through their roles
        inspectors_count = db.exec(
            select(func.count(func.distinct(InspectorRole.inspector_id)))
            .join(RolePermission, RolePermission.role_id == InspectorRole.role_id)
            .where(RolePermission.permission_id == permission_id)
        ).one()
        
        # Get total number of inspectors for percentage calculation
        total_inspectors = db.exec(select(func.count(Inspector.id))).one()
        
        usage_percentage = (inspectors_count / total_inspectors * 100) if total_inspectors > 0 else 0
        
        return {
            "permission_id": permission_id,
            "permission_name": permission.name,
            "display_label": permission.display_label or permission.name,
            "roles_count": roles_count,
            "inspectors_count": inspectors_count,
            "total_inspectors": total_inspectors,
            "usage_percentage": round(usage_percentage, 1)
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logging.error(f"Error getting permission usage stats for permission {permission_id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to get permission usage statistics"
        )


# Parameterized routes (must be at the end to avoid conflicts)

@router.get("/permissions/{permission_id}", response_model=PermissionResponse)
async def get_permission(
    permission_id: int,
    db: Session = Depends(get_db),
    current_inspector: Inspector = Depends(require_standardized_permission("system_superadmin"))
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
        
        return PermissionResponse.model_validate(permission)
        
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
    current_inspector: Inspector = Depends(require_standardized_permission("system_superadmin"))
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
        
        return PermissionResponse.model_validate(permission)
        
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
    current_inspector: Inspector = Depends(require_standardized_permission("system_superadmin"))
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