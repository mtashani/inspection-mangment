"""
Example protected endpoints demonstrating the new RBAC authorization middleware

This file shows how to use the various permission dependencies in FastAPI routes.
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session
from typing import List

from app.core.database import get_db
from app.domains.auth.dependencies import (
    require_permission,
    require_any_permission,
    require_all_permissions,
    require_admin_access,
    require_role_management,
    get_current_active_inspector,
    log_request
)
from app.domains.auth.schemas import InspectorResponse
from app.domains.inspector.models.inspector import Inspector

router = APIRouter(prefix="/api/v1/examples", tags=["Authorization Examples"])

# Example 1: Single permission requirement
@router.post("/ndt/reports")
async def create_ndt_report(
    inspector: Inspector = Depends(require_permission("ndt", "create")),
    db: Session = Depends(get_db)
):
    """
    Create NDT report - requires 'ndt:create' permission
    Only inspectors with NDT creation permission can access this endpoint
    """
    return {
        "message": f"NDT report created by inspector {inspector.id}",
        "inspector": inspector.username,
        "permissions_checked": ["ndt:create"]
    }

# Example 2: Multiple permission options (any of)
@router.get("/reports/pending-approval")
async def get_pending_reports(
    inspector: Inspector = Depends(require_any_permission(
        ("ndt", "approve"),
        ("mechanical", "approve"),
        ("psv", "approve"),
        ("report", "approve")
    )),
    db: Session = Depends(get_db)
):
    """
    Get pending reports for approval
    Requires approval permission for any report type
    """
    return {
        "message": "Pending reports retrieved",
        "inspector": inspector.username,
        "permissions_checked": ["any of: ndt:approve, mechanical:approve, psv:approve, report:approve"]
    }

# Example 3: Multiple required permissions (all of)
@router.post("/reports/final-approval")
async def final_approve_report(
    report_id: int,
    inspector: Inspector = Depends(require_all_permissions(
        ("report", "approve"),
        ("quality", "final_approve")
    )),
    db: Session = Depends(get_db)
):
    """
    Final approval of reports
    Requires both report approval and quality final approval permissions
    """
    return {
        "message": f"Report {report_id} given final approval",
        "inspector": inspector.username,
        "permissions_checked": ["report:approve", "quality:final_approve"]
    }

# Example 4: Admin-only endpoint
@router.get("/admin/system-status")
async def get_system_status(
    inspector: Inspector = Depends(require_admin_access),
    db: Session = Depends(get_db)
):
    """
    Get system status - admin only
    Requires 'admin:manage' permission
    """
    return {
        "message": "System status retrieved",
        "inspector": inspector.username,
        "permissions_checked": ["admin:manage"],
        "system_status": "operational"
    }

# Example 5: Role management endpoint
@router.post("/admin/roles")
async def create_role(
    role_data: dict,
    inspector: Inspector = Depends(require_role_management),
    db: Session = Depends(get_db)
):
    """
    Create new role - requires role management permission
    Requires 'admin:manage_roles' permission
    """
    return {
        "message": "Role created",
        "inspector": inspector.username,
        "permissions_checked": ["admin:manage_roles"],
        "role_data": role_data
    }

# Example 6: Resource-specific access with ownership check
@router.get("/inspectors/{inspector_id}/reports")
async def get_inspector_reports(
    inspector_id: int,
    current_inspector: Inspector = Depends(require_any_permission(
        ("report", "view_all"),
        ("report", "view_own")
    )),
    db: Session = Depends(get_db)
):
    """
    Get reports for specific inspector
    Requires either view_all permission or view_own (with ownership check)
    """
    # Additional business logic for ownership check
    if inspector_id != current_inspector.id:
        # If not viewing own reports, need view_all permission
        from app.domains.auth.services.permission_service import PermissionService
        has_view_all = await PermissionService.has_permission(
            db, current_inspector, "report", "view_all"
        )
        if not has_view_all:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Can only view own reports without view_all permission"
            )
    
    return {
        "message": f"Reports for inspector {inspector_id}",
        "requested_inspector": inspector_id,
        "current_inspector": current_inspector.id,
        "permissions_checked": ["report:view_all OR report:view_own"]
    }

# Example 7: Endpoint with audit logging
@router.put("/inspectors/{inspector_id}/status")
async def update_inspector_status(
    inspector_id: int,
    status_data: dict,
    inspector: Inspector = Depends(require_permission("inspector", "update")),
    audit_log: Inspector = Depends(log_request),  # This logs the request
    db: Session = Depends(get_db)
):
    """
    Update inspector status with audit logging
    All requests to this endpoint are logged for audit purposes
    """
    return {
        "message": f"Inspector {inspector_id} status updated",
        "updated_by": inspector.username,
        "permissions_checked": ["inspector:update"],
        "audit_logged": True
    }

# Example 8: Complex permission logic
@router.delete("/reports/{report_id}")
async def delete_report(
    report_id: int,
    current_inspector: Inspector = Depends(get_current_active_inspector),
    db: Session = Depends(get_db)
):
    """
    Delete report with complex permission logic
    Different permissions required based on report ownership and type
    """
    from app.domains.auth.services.permission_service import PermissionService
    
    # Mock report data (in real implementation, fetch from database)
    report = {"id": report_id, "inspector_id": 2, "type": "ndt"}
    
    # Check various permission levels
    can_delete_all = await PermissionService.has_permission(
        db, current_inspector, "report", "delete_all"
    )
    can_delete_own = await PermissionService.has_permission(
        db, current_inspector, "report", "delete_own"
    )
    can_delete_type = await PermissionService.has_permission(
        db, current_inspector, report["type"], "delete"
    )
    
    # Apply business logic
    if can_delete_all:
        permission_used = "report:delete_all"
    elif can_delete_own and report["inspector_id"] == current_inspector.id:
        permission_used = "report:delete_own (ownership verified)"
    elif can_delete_type:
        permission_used = f"{report['type']}:delete"
    else:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Insufficient permissions to delete this report"
        )
    
    return {
        "message": f"Report {report_id} deleted",
        "deleted_by": current_inspector.username,
        "permission_used": permission_used,
        "report_type": report["type"]
    }

# Example 9: Endpoint with multiple authentication options
@router.get("/public-reports")
async def get_public_reports(
    inspector: Inspector = Depends(get_current_active_inspector),
    db: Session = Depends(get_db)
):
    """
    Get public reports - requires authentication but no specific permissions
    Any authenticated inspector can access this
    """
    return {
        "message": "Public reports retrieved",
        "inspector": inspector.username,
        "permissions_checked": ["authentication only"]
    }

# Example 10: Conditional permission endpoint
@router.post("/reports/{report_id}/approve")
async def approve_report(
    report_id: int,
    approval_level: str,  # "initial" or "final"
    current_inspector: Inspector = Depends(get_current_active_inspector),
    db: Session = Depends(get_db)
):
    """
    Approve report with conditional permissions based on approval level
    """
    from app.domains.auth.services.permission_service import PermissionService
    
    if approval_level == "initial":
        required_resource = "report"
        required_action = "approve"
    elif approval_level == "final":
        required_resource = "quality"
        required_action = "final_approve"
    else:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid approval level"
        )
    
    has_permission = await PermissionService.has_permission(
        db, current_inspector, required_resource, required_action
    )
    
    if not has_permission:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Missing required permission: {required_resource}:{required_action}"
        )
    
    return {
        "message": f"Report {report_id} approved at {approval_level} level",
        "approved_by": current_inspector.username,
        "approval_level": approval_level,
        "permission_used": f"{required_resource}:{required_action}"
    }