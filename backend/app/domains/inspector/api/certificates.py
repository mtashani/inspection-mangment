"""
Certificate Management API Routes
Handles certificate-specific operations for inspectors using InspectorCertificationRecord model
"""

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, Query, status
from fastapi.responses import FileResponse
from typing import List, Optional
from sqlmodel import Session, select
from datetime import datetime, date
import logging

from app.database import get_session
from app.domains.auth.dependencies import get_current_active_inspector, require_standardized_permission
from app.domains.inspector.models.inspector import Inspector, InspectorCertificationRecord
from app.domains.inspector.models.enums import InspectorCertification, CertificationLevel
from app.domains.inspector.schemas.certifications import (
    CertificationResponse, CertificationCreateRequest, CertificationUpdateRequest,
    DeleteResponse, CertificationTypeListResponse, CertificationLevelListResponse,
    CertificationStatsResponse
)
from app.domains.inspector.services.file_upload_service import FileUploadService
from app.core.api_logging import log_api_errors

router = APIRouter()


@log_api_errors("inspector")
@router.get("/certificates/{inspector_id}", response_model=List[CertificationResponse])
async def get_inspector_certifications(
    inspector_id: int,
    db: Session = Depends(get_session),
    current_inspector: Inspector = Depends(get_current_active_inspector)
):
    """
    Get all certifications for a specific inspector.
    
    Inspectors can view their own certifications or need system_hr_manage permission.
    """
    try:
        # Permission check: inspector can view own certifications or needs admin permission
        if current_inspector.id != inspector_id:
            from app.domains.auth.services.permission_service import PermissionService
            
            has_admin_access = await PermissionService.check_inspector_permission(
                db, current_inspector.id or 0, "system_hr_manage"
            )
            
            if not has_admin_access:
                raise HTTPException(
                    status_code=403,
                    detail="Insufficient permissions to view other inspectors' certifications"
                )
        
        # Get all certification records for the inspector
        query = select(InspectorCertificationRecord).where(
            InspectorCertificationRecord.inspector_id == inspector_id
        )
        certifications = db.exec(query).all()
        
        logging.info(f"Retrieved {len(certifications)} certifications for inspector {inspector_id}")
        
        return certifications
        
    except HTTPException:
        raise
    except Exception as e:
        logging.error(f"Error getting inspector certifications: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to retrieve certifications: {str(e)}"
        )


@log_api_errors("inspector")
@router.post("/certificates", response_model=CertificationResponse)
async def create_inspector_certification(
    certification_data: CertificationCreateRequest,
    db: Session = Depends(get_session),
    current_inspector: Inspector = Depends(require_standardized_permission("system_hr_manage"))
):
    """
    Create a new certification record for an inspector.
    
    Requires system_hr_manage permission.
    """
    try:
        logging.info(f"Certification creation requested for inspector {certification_data.inspector_id} by {current_inspector.id}")
        
        # Create new certification record
        certification_record = InspectorCertificationRecord(
            inspector_id=certification_data.inspector_id,
            certification_type=certification_data.certification_type,
            certification_number=certification_data.certification_number,
            level=certification_data.level,
            issue_date=certification_data.issue_date,
            expiry_date=certification_data.expiry_date,
            issuing_authority=certification_data.issuing_authority,
            document_path=certification_data.document_path
        )
        
        db.add(certification_record)
        db.commit()
        db.refresh(certification_record)
        
        logging.info(f"Certification created successfully with ID: {certification_record.id}")
        
        return certification_record
        
    except HTTPException:
        raise
    except Exception as e:
        logging.error(f"Error creating certification: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to create certification: {str(e)}"
        )


@log_api_errors("inspector")
@router.put("/certificates/{certification_id}", response_model=CertificationResponse)
async def update_inspector_certification(
    certification_id: int,
    certification_data: CertificationUpdateRequest,
    db: Session = Depends(get_session),
    current_inspector: Inspector = Depends(require_standardized_permission("system_hr_manage"))
):
    """
    Update an existing certification record.
    
    Requires system_hr_manage permission.
    """
    try:
        logging.info(f"Certification update requested for certification {certification_id} by {current_inspector.id}")
        
        # Get the certification record
        certification_record = db.get(InspectorCertificationRecord, certification_id)
        
        if not certification_record:
            raise HTTPException(status_code=404, detail="Certification not found")
        
        # Update fields if provided
        update_data = certification_data.dict(exclude_unset=True)
        for key, value in update_data.items():
            setattr(certification_record, key, value)
            
        certification_record.updated_at = datetime.utcnow()
        
        db.add(certification_record)
        db.commit()
        db.refresh(certification_record)
        
        logging.info(f"Certification {certification_id} updated successfully")
        
        return certification_record
        
    except HTTPException:
        raise
    except Exception as e:
        logging.error(f"Error updating certification {certification_id}: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to update certification: {str(e)}"
        )


@log_api_errors("inspector")
@router.delete("/certificates/{certification_id}", response_model=DeleteResponse)
async def delete_inspector_certification(
    certification_id: int,
    db: Session = Depends(get_session),
    current_inspector: Inspector = Depends(require_standardized_permission("system_hr_manage"))
):
    """
    Delete a certification record.
    
    Requires system_hr_manage permission.
    """
    try:
        logging.info(f"Certification deletion requested for certification {certification_id} by {current_inspector.id}")
        
        # Get the certification record
        certification_record = db.get(InspectorCertificationRecord, certification_id)
        
        if not certification_record:
            raise HTTPException(status_code=404, detail="Certification not found")
        
        db.delete(certification_record)
        db.commit()
        
        logging.info(f"Certification {certification_id} deleted successfully")
        
        return DeleteResponse(
            success=True,
            message="Certification deleted successfully"
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logging.error(f"Error deleting certification {certification_id}: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to delete certification: {str(e)}"
        )


@log_api_errors("inspector")
@router.get("/certificates/{certification_id}", response_model=CertificationResponse)
async def get_certification_info(
    certification_id: int,
    db: Session = Depends(get_session),
    current_inspector: Inspector = Depends(get_current_active_inspector)
):
    """
    Get detailed information about a certification.
    
    Inspectors can view info for their own certifications or need system_hr_manage permission.
    """
    try:
        # Get the certification record
        certification_record = db.get(InspectorCertificationRecord, certification_id)
        
        if not certification_record:
            raise HTTPException(status_code=404, detail="Certification not found")
        
        # Permission check: inspector can view own certification info or needs admin permission
        if current_inspector.id != certification_record.inspector_id:
            from app.domains.auth.services.permission_service import PermissionService
            
            has_admin_access = await PermissionService.check_inspector_permission(
                db, current_inspector.id or 0, "system_hr_manage"
            )
            
            if not has_admin_access:
                raise HTTPException(
                    status_code=403,
                    detail="Insufficient permissions to view this certification info"
                )
        
        return certification_record
        
    except HTTPException:
        raise
    except Exception as e:
        logging.error(f"Error getting certification info: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to get certification info: {str(e)}"
        )


@log_api_errors("inspector")
@router.get("/certifications/types", response_model=CertificationTypeListResponse)
async def get_certification_types(
    current_inspector: Inspector = Depends(get_current_active_inspector)
):
    """
    Get list of available certification types.
    """
    try:
        # Return all available certification types from the enum
        certification_types = [cert_type.value for cert_type in InspectorCertification]
        
        return CertificationTypeListResponse(certification_types=sorted(certification_types))
        
    except Exception as e:
        logging.error(f"Error getting certification types: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to get certification types: {str(e)}"
        )


@log_api_errors("inspector")
@router.get("/certifications/levels", response_model=CertificationLevelListResponse)
async def get_certification_levels(
    current_inspector: Inspector = Depends(get_current_active_inspector)
):
    """
    Get list of available certification levels.
    """
    try:
        # Return all available certification levels from the enum
        certification_levels = [level.value for level in CertificationLevel]
        
        return CertificationLevelListResponse(certification_levels=certification_levels)
        
    except Exception as e:
        logging.error(f"Error getting certification levels: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to get certification levels: {str(e)}"
        )


@log_api_errors("inspector")
@router.get("/certifications/stats/{inspector_id}", response_model=CertificationStatsResponse)
async def get_certification_stats(
    inspector_id: int,
    db: Session = Depends(get_session),
    current_inspector: Inspector = Depends(get_current_active_inspector)
):
    """
    Get certification statistics for an inspector.
    
    Inspectors can view their own stats or need system_hr_manage permission.
    """
    try:
        # Permission check
        if current_inspector.id != inspector_id:
            from app.domains.auth.services.permission_service import PermissionService
            
            has_admin_access = await PermissionService.check_inspector_permission(
                db, current_inspector.id or 0, "system_hr_manage"
            )
            
            if not has_admin_access:
                raise HTTPException(
                    status_code=403,
                    detail="Insufficient permissions to view certification statistics"
                )
        
        # Get all certification records for the inspector
        query = select(InspectorCertificationRecord).where(
            InspectorCertificationRecord.inspector_id == inspector_id
        )
        certifications = db.exec(query).all()
        
        # Calculate stats
        total_certifications = len(certifications)
        
        # Group by certification type
        certification_types = {}
        certification_levels = {}
        expiring_soon = 0
        expired = 0
        
        from datetime import date
        today = date.today()
        
        for cert in certifications:
            # By certification type
            cert_type = cert.certification_type.value
            certification_types[cert_type] = certification_types.get(cert_type, 0) + 1
            
            # By certification level
            cert_level = cert.level.value
            certification_levels[cert_level] = certification_levels.get(cert_level, 0) + 1
            
            # Check expiration status
            if cert.expiry_date < today:
                expired += 1
            elif (cert.expiry_date - today).days <= 30:  # Expiring within 30 days
                expiring_soon += 1
        
        return CertificationStatsResponse(
            inspector_id=inspector_id,
            total_certifications=total_certifications,
            certification_types=certification_types,
            certification_levels=certification_levels,
            expired=expired,
            expiring_soon=expiring_soon
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logging.error(f"Error getting certification stats: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to get certification statistics: {str(e)}"
        )