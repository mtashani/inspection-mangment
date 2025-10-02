"""
Inspector Certificate Management API Routes
Handles certificate-specific operations for inspectors using InspectorCertificationRecord model
"""

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, Query, Request, status
from fastapi.responses import FileResponse
from typing import List, Optional
from sqlmodel import Session, select
from datetime import datetime, date
import logging

from app.database import get_session
from app.domains.auth.dependencies import get_current_active_inspector, require_standardized_permission
from app.domains.inspector.models.inspector import Inspector, InspectorCertificationRecord
from app.domains.inspector.models.documents import InspectorDocument, DocumentType
from app.domains.inspector.services.certificate_service import InspectorCertificateService
from app.domains.inspector.models.enums import InspectorCertification, CertificationLevel
from app.domains.inspector.schemas.certifications import (
    CertificationResponse, CertificationCreateRequest, CertificationUpdateRequest,
    DeleteResponse, CertificationTypeListResponse, CertificationLevelListResponse,
    CertificationStatsResponse
)
from app.domains.inspector.schemas.files import UploadResponse, DocumentInfoResponse, DeleteResponse as FileDeleteResponse
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
async def delete_inspector_certification_and_file(
    certification_id: int,
    db: Session = Depends(get_session),
    current_inspector: Inspector = Depends(require_standardized_permission("system_hr_manage"))
):
    """
    Delete a certification record and its associated file.
    
    Requires system_hr_manage permission.
    """
    try:
        logging.info(f"Certification deletion requested for certification {certification_id} by {current_inspector.id}")
        
        service = InspectorCertificateService(db)
        success = service.delete_certificate(certification_id)
        if not success:
            raise HTTPException(status_code=404, detail="Certification not found")
        
        logging.info(f"Certification {certification_id} and its file deleted successfully")
        
        return DeleteResponse(
            success=True,
            message="Certification and its file deleted successfully"
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
            if cert.expiry_date and cert.expiry_date < today:
                expired += 1
            elif cert.expiry_date and (cert.expiry_date - today).days <= 30:  # Expiring within 30 days
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


@log_api_errors("inspector")
@router.get("/certificates/{certification_id}/download", response_class=FileResponse)
async def download_certificate(
    request: Request,
    certification_id: int,
    db: Session = Depends(get_session),
    current_inspector: Inspector = Depends(get_current_active_inspector)
):
    """
    Download a certificate file by certification ID.
    
    Inspectors can download their own certificates or need system_hr_manage permission.
    """
    try:
        logging.info(f"Certificate download request for certification_id: {certification_id}, inspector: {current_inspector.id}, auth header: {request.headers.get('authorization', 'missing')}")
        logging.info(f"Certificate download request for certification_id: {certification_id}, inspector: {current_inspector.id}, auth header: {request.headers.get('authorization', 'missing')}")
        
        service = InspectorCertificateService(db)
        certification_record = service.get_certificate(certification_id)
        if not certification_record:
            logging.warning(f"Certificate record not found for ID: {certification_id}")
            raise HTTPException(status_code=404, detail="Certificate not found")
        
        # Permission check: inspector can download own certificates or needs admin permission
        if current_inspector.id != certification_record.inspector_id:
            from app.domains.auth.services.permission_service import PermissionService
            
            has_admin_access = await PermissionService.check_inspector_permission(
                db, current_inspector.id or 0, "system_hr_manage"
            )
            
            if not has_admin_access:
                raise HTTPException(
                    status_code=403,
                    detail="Insufficient permissions to download this certificate"
                )
        
        return service.serve_certificate_file(certification_record, disposition='attachment')
        
    except HTTPException:
        raise
    except Exception as e:
        logging.error(f"Error downloading certificate {certification_id}: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to download certificate: {str(e)}"
        )


@log_api_errors("inspector")
@router.get("/certificates/{certification_id}/preview", response_class=FileResponse)
async def preview_certificate(
    request: Request,
    certification_id: int,
    db: Session = Depends(get_session),
    current_inspector: Inspector = Depends(get_current_active_inspector)
):
    """
    Preview a certificate file by certification ID (inline display for embed).
    
    Inspectors can preview their own certificates or need system_hr_manage permission.
    """
    try:
        logging.info(f"Certificate preview request for certification_id: {certification_id}, inspector: {current_inspector.id}, auth header: {request.headers.get('authorization', 'missing')}")
        service = InspectorCertificateService(db)
        certification_record = service.get_certificate(certification_id)
        if not certification_record:
            logging.warning(f"Certificate record not found for ID: {certification_id}")
            raise HTTPException(status_code=404, detail="Certificate not found")
        
        # Permission check
        if current_inspector.id != certification_record.inspector_id:
            from app.domains.auth.services.permission_service import PermissionService
            
            has_admin_access = await PermissionService.check_inspector_permission(
                db, current_inspector.id or 0, "system_hr_manage"
            )
            
            if not has_admin_access:
                raise HTTPException(
                    status_code=403,
                    detail="Insufficient permissions to preview this certificate"
                )
        
        # Serve with inline disposition for preview
        return service.serve_certificate_file(certification_record, disposition='inline')
    except HTTPException:
        raise
    except Exception as e:
        logging.error(f"Error previewing certificate {certification_id}: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to preview certificate: {str(e)}"
        )


@log_api_errors("inspector")
@router.post("/certificates/upload", response_model=UploadResponse)
async def upload_certificate_file(
    inspector_id: int = Form(...),
    file: UploadFile = File(...),
    description: Optional[str] = Form(None),
    certification_type: Optional[str] = Form(None),
    certification_number: Optional[str] = Form(None),
    issuing_organization: Optional[str] = Form(None),
    issue_date: Optional[str] = Form(None),
    expiry_date: Optional[str] = Form(None),
    db: Session = Depends(get_session),
    current_inspector: Inspector = Depends(get_current_active_inspector)
):
    """
    Upload a certificate file for an inspector and optionally create/update certification record.
    
    Inspectors can upload for themselves or need system_hr_manage permission for others.
    """
    try:
        logging.info(f"Certificate file upload requested for inspector {inspector_id} by {current_inspector.id}")
        service = InspectorCertificateService(db)
        
        # Permission check: inspector can upload for themselves or needs admin permission for others
        if current_inspector.id != inspector_id:
            from app.domains.auth.services.permission_service import PermissionService
            
            has_admin_access = await PermissionService.check_inspector_permission(
                db, current_inspector.id or 0, "system_hr_manage"
            )
            
            if not has_admin_access:
                raise HTTPException(
                    status_code=403,
                    detail="Insufficient permissions to upload certificate for another inspector"
                )
        
        # Convert certification type from string to enum if provided
        cert_type_enum = None
        if certification_type:
            try:
                # Extract the enum value from the string (e.g., "InspectorCertification.API_510" -> "API_510")
                type_value = certification_type.split('.')[-1] if '.' in certification_type else certification_type
                cert_type_enum = InspectorCertification(type_value)
            except ValueError:
                # If the value is not valid, use OTHER as fallback
                cert_type_enum = InspectorCertification.OTHER
        
        # Convert certification level from string to enum if provided (using Level1 as default)
        level_enum = CertificationLevel.Level1
        if certification_number and not cert_type_enum:  # If we have a certification number but no type, try to infer from it
            cert_type_enum = InspectorCertification.OTHER

        # Parse dates if provided
        issue_date_obj = None
        expiry_date_obj = None
        if issue_date:
            try:
                issue_date_obj = datetime.strptime(issue_date, "%Y-%m-%d").date()
            except ValueError:
                raise HTTPException(status_code=400, detail="Invalid issue date format. Use YYYY-MM-DD")
        if expiry_date:
            try:
                expiry_date_obj = datetime.strptime(expiry_date, "%Y-%m-%d").date()
            except ValueError:
                raise HTTPException(status_code=400, detail="Invalid expiry date format. Use YYYY-MM-DD")
        
        # Upload certificate file using service
        certification_record = await service.upload_certificate_file(
            inspector_id=inspector_id,
            file=file,
            certification_type=cert_type_enum,
            certification_number=certification_number,
            issuing_authority=issuing_organization,
            issue_date=issue_date_obj,
            expiry_date=expiry_date_obj,
            level=level_enum,
            description=description
        )
        
        # Get file info using service method
        file_info = service.get_file_info(certification_record)
        
        logging.info(f"Certificate file uploaded successfully: {file_info['filename']}")
        
        return {
            "success": True,
            "message": "Certificate file uploaded successfully",
            "document": file_info
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logging.error(f"Error uploading certificate file: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to upload certificate file: {str(e)}"
        )


@log_api_errors("inspector")
@router.get("/certificates/{certification_id}/info", response_model=DocumentInfoResponse)
async def get_certificate_info(
    certification_id: int,
    db: Session = Depends(get_session),
    current_inspector: Inspector = Depends(get_current_active_inspector)
):
    """
    Get detailed information about a certificate file.
    
    Inspectors can view info for their own certificates or need system_hr_manage permission.
    """
    try:
        service = InspectorCertificateService(db)
        certification_record = service.get_certificate(certification_id)
        if not certification_record:
            logging.warning(f"Certificate record not found for ID: {certification_id}")
            raise HTTPException(status_code=404, detail="Certificate not found")
        
        # Permission check: inspector can view own certificate info or needs admin permission
        if current_inspector.id != certification_record.inspector_id:
            from app.domains.auth.services.permission_service import PermissionService
            
            has_admin_access = await PermissionService.check_inspector_permission(
                db, current_inspector.id or 0, "system_hr_manage"
            )
            
            if not has_admin_access:
                raise HTTPException(
                    status_code=403,
                    detail="Insufficient permissions to view this certificate info"
                )
        
        return service.get_file_info(certification_record)
        
    except HTTPException:
        raise
    except Exception as e:
        logging.error(f"Error getting certificate info: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to get certificate info: {str(e)}"
        )


@log_api_errors("inspector")
@router.get("/certificates/stats/{inspector_id}")
async def get_certificate_stats(
    inspector_id: int,
    db: Session = Depends(get_session),
    current_inspector: Inspector = Depends(get_current_active_inspector)
):
    """
    Get certificate file statistics for an inspector.
    
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
                    detail="Insufficient permissions to view certificate statistics"
                )
        
        service = InspectorCertificateService(db)
        stats = service.get_certificate_stats(inspector_id)
        return stats
        
    except HTTPException:
        raise
    except Exception as e:
        logging.error(f"Error getting certificate stats: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to get certificate statistics: {str(e)}"
        )
