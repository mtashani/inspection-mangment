from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlmodel import Session, select
from datetime import datetime, date
from app.database import get_session
from app.domains.inspector.models.inspector import Inspector, InspectorCertificationRecord
from app.domains.inspector.models.enums import InspectorType, InspectorCertification, CertificationLevel
from app.domains.inspector.schemas.inspector import InspectorCreateRequest, InspectorResponse
from app.domains.auth.dependencies import (
    get_current_active_inspector, 
    require_permission,
    require_admin_access
)

router = APIRouter()

@router.get("/test")
def test_inspector_api():
    """Test endpoint to verify inspector API is working"""
    return {"message": "Inspector API is working!", "status": "ok"}

@router.get("/", response_model=List[InspectorResponse])
def get_inspectors(
    skip: int = 0,
    limit: int = 100,
    first_name: Optional[str] = None,
    last_name: Optional[str] = None,
    employee_id: Optional[str] = None,
    active: Optional[bool] = None,
    attendance_tracking_enabled: Optional[bool] = None,
    db: Session = Depends(get_session),
    current_inspector: Inspector = Depends(require_permission("inspector", "view"))
):
    """Get list of inspectors with optional filtering"""
    query = select(Inspector)
    
    if first_name:
        query = query.where(Inspector.first_name.contains(first_name))
    if last_name:
        query = query.where(Inspector.last_name.contains(last_name))
    if employee_id:
        query = query.where(Inspector.employee_id.contains(employee_id))
    if active is not None:
        query = query.where(Inspector.active == active)

    if attendance_tracking_enabled is not None:
        query = query.where(Inspector.attendance_tracking_enabled == attendance_tracking_enabled)
    
    inspectors = db.exec(query.offset(skip).limit(limit)).all()
    return [InspectorResponse.from_model(i) for i in inspectors]

@router.post("/", response_model=InspectorResponse)
def create_inspector(
    inspector_data: InspectorCreateRequest,
    db: Session = Depends(get_session),
    current_inspector: Inspector = Depends(require_permission("inspector", "create"))
):
    """Create new inspector"""
    # Convert the request schema to the Inspector model
    inspector_dict = inspector_data.dict(exclude_unset=True)
    
    # Handle password hashing if provided
    if inspector_data.password and inspector_data.can_login:
        from app.domains.auth.services.auth_service import AuthService
        inspector_dict['password_hash'] = AuthService.get_password_hash(inspector_data.password)
        del inspector_dict['password']
    
    # Create the inspector model
    inspector = Inspector(**inspector_dict)
    
    db.add(inspector)
    try:
        db.commit()
        db.refresh(inspector)
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=str(e))
    
    return InspectorResponse.from_model(inspector)

@router.get("/{inspector_id}", response_model=InspectorResponse)
def get_inspector(
    inspector_id: int,
    db: Session = Depends(get_session),
    current_inspector: Inspector = Depends(get_current_active_inspector)
):
    """Get inspector by ID"""
    # Check permissions: inspector can view own profile or needs view_all permission
    if current_inspector.id != inspector_id:
        # Verify current inspector has permission to view other inspectors
        from app.domains.auth.services.permission_service import PermissionService
        import asyncio
        
        has_view_all = asyncio.run(PermissionService.has_permission(
            db, current_inspector, "inspector", "view"
        ))
        
        if not has_view_all:
            raise HTTPException(
                status_code=403,
                detail="Insufficient permissions to view other inspectors"
            )
    
    inspector = db.get(Inspector, inspector_id)
    if not inspector:
        raise HTTPException(
            status_code=404,
            detail=f"Inspector with ID {inspector_id} not found"
        )
    return InspectorResponse.from_model(inspector)

@router.put("/{inspector_id}", response_model=Inspector)
def update_inspector(
    inspector_id: int,
    inspector_update: Inspector,
    db: Session = Depends(get_session),
    current_inspector: Inspector = Depends(require_permission("inspector", "edit_all"))
):
    """Update inspector"""
    db_inspector = db.get(Inspector, inspector_id)
    if not db_inspector:
        raise HTTPException(status_code=404, detail="Inspector not found")
    
    # Update fields
    inspector_data = inspector_update.dict(exclude_unset=True)
    for key, value in inspector_data.items():
        setattr(db_inspector, key, value)
    
    try:
        db.commit()
        db.refresh(db_inspector)
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=str(e))
    return db_inspector

@router.delete("/{inspector_id}")
def delete_inspector(
    inspector_id: int,
    db: Session = Depends(get_session),
    current_inspector: Inspector = Depends(require_admin_access)
):
    """Delete inspector"""
    inspector = db.get(Inspector, inspector_id)
    if not inspector:
        raise HTTPException(status_code=404, detail="Inspector not found")
    
    try:
        db.delete(inspector)
        db.commit()
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=str(e))
    return {"message": "Inspector deleted successfully"}

@router.get("/{inspector_id}/certifications", response_model=List[InspectorCertificationRecord])
def get_inspector_certifications(
    inspector_id: int,
    db: Session = Depends(get_session),
    current_inspector: Inspector = Depends(get_current_active_inspector)
):
    """Get certifications for an inspector"""
    # Check permissions: inspector can view own certifications or needs view_all permission
    if current_inspector.id != inspector_id:
        # Verify current inspector has permission to view other inspectors' certifications
        from app.domains.auth.services.permission_service import PermissionService
        import asyncio
        
        has_view_all = asyncio.run(PermissionService.has_permission(
            db, current_inspector, "inspector", "view"
        ))
        
        if not has_view_all:
            raise HTTPException(
                status_code=403,
                detail="Insufficient permissions to view other inspectors' certifications"
            )
    
    inspector = db.get(Inspector, inspector_id)
    if not inspector:
        raise HTTPException(status_code=404, detail="Inspector not found")
        
    certifications = db.exec(
        select(InspectorCertificationRecord)
        .filter(InspectorCertificationRecord.inspector_id == inspector_id)
    ).all()
    
    return certifications

@router.post("/{inspector_id}/certifications", response_model=InspectorCertificationRecord)
def add_inspector_certification(
    inspector_id: int,
    certification: InspectorCertificationRecord,
    db: Session = Depends(get_session),
    current_inspector: Inspector = Depends(require_permission("inspector", "edit_all"))
):
    """Add certification to an inspector"""
    inspector = db.get(Inspector, inspector_id)
    if not inspector:
        raise HTTPException(status_code=404, detail="Inspector not found")
    
    # Set inspector ID
    certification.inspector_id = inspector_id
    
    db.add(certification)
    try:
        db.commit()
        db.refresh(certification)
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=str(e))
    return certification

@router.get("/certifications/{certification_id}", response_model=InspectorCertificationRecord)
def get_certification(
    certification_id: int,
    db: Session = Depends(get_session),
    current_inspector: Inspector = Depends(get_current_active_inspector)
):
    """Get certification by ID"""
    certification = db.get(InspectorCertificationRecord, certification_id)
    if not certification:
        raise HTTPException(status_code=404, detail=f"Certification not found")
    return certification