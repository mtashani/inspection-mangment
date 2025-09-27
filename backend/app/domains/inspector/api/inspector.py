from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status, UploadFile, File, Form
from fastapi.responses import FileResponse
from sqlmodel import Session, select, or_, func
from sqlalchemy.orm import selectinload
from datetime import datetime, date
import logging
from app.database import get_session
from app.domains.inspector.models.inspector import Inspector, InspectorCertificationRecord
from app.domains.inspector.models.enums import InspectorType, InspectorCertification, CertificationLevel
from app.domains.inspector.schemas.inspector import InspectorCreateRequest, InspectorUpdateRequest, InspectorResponse
from app.domains.inspector.schemas.files import UploadResponse
from app.domains.auth.dependencies import (
    get_current_active_inspector, 
    require_standardized_permission
)
from app.core.api_logging import log_api_errors, log_domain_error, log_domain_validation_error
from app.domains.inspector.services.file_upload_service import FileUploadService

router = APIRouter()

@router.get("/test-error")
def test_error_logging():
    """Test endpoint to deliberately cause an error for logging testing"""
    try:
        # Create a deliberate error
        raise Exception("This is a test exception to verify logging functionality")
    except Exception as e:
        # Manually test the logging
        from app.core.logging_config import DomainLogger
        DomainLogger.log_api_error(
            domain_name="inspector",
            endpoint="/api/v1/inspectors/test-error",
            method="GET",
            error=e,
            request_data=None,
            user_id=None,
            status_code=500
        )
        # Re-raise as HTTP exception
        raise HTTPException(status_code=500, detail=str(e))

@log_api_errors("inspector")
@router.get("/test-http-error")
def test_http_error_logging():
    """Test endpoint for HTTP error logging"""
    raise HTTPException(status_code=400, detail="This is a test HTTP error for logging verification")

@log_api_errors("inspector")
@router.post("/test-validation-error")
def test_validation_error(test_data: dict):
    """Test endpoint to cause validation error"""
    from pydantic import ValidationError
    
    # This will cause a validation error
    try:
        validated_data = InspectorCreateRequest(**test_data)
        return {"status": "success", "data": validated_data.dict()}
    except ValidationError as e:
        # Let the decorator handle this
        raise e

@log_api_errors("inspector")
@router.get("/test")
def test_inspector_api():
    """Test endpoint to verify inspector API is working"""
    return {"message": "Inspector API is working!", "status": "ok"}

@log_api_errors("inspector")
@router.get("/test-auth")
async def test_auth(
    db: Session = Depends(get_session),
    current_inspector: Inspector = Depends(get_current_active_inspector)
):
    """Test endpoint to verify authentication is working"""
    logging.info(f"Test auth endpoint called by inspector: {current_inspector.id}")
    return {
        "message": "Authentication working!", 
        "inspector_id": current_inspector.id,
        "inspector_username": current_inspector.username,
        "inspector_active": current_inspector.active,
        "inspector_can_login": current_inspector.can_login
    }

@log_api_errors("inspector")
@router.get("/test-permission")
async def test_permission(
    db: Session = Depends(get_session),
    current_inspector: Inspector = Depends(require_standardized_permission("system_hr_manage"))
):
    """Test endpoint to verify system_hr_manage permission is working"""
    logging.info(f"Test permission endpoint called by inspector: {current_inspector.id}")
    return {
        "message": "Permission system_hr_manage working!", 
        "inspector_id": current_inspector.id,
        "inspector_username": current_inspector.username
    }

@log_api_errors("inspector")
@router.get("/", response_model=List[InspectorResponse])
def get_inspectors(
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(20, ge=1, le=100, description="Items per page"),
    search: Optional[str] = Query(None, description="Search in name, employee_id, email"),
    active_only: bool = Query(True, description="Show only active inspectors"),
    can_login_only: Optional[bool] = Query(None, description="Filter by login capability"),
    attendance_tracking: Optional[bool] = Query(None, description="Filter by attendance tracking"),
    sort_by: str = Query("last_name", description="Sort field"),
    sort_order: str = Query("asc", description="Sort order (asc/desc)"),
    db: Session = Depends(get_session),
    current_inspector: Inspector = Depends(require_standardized_permission("system_hr_manage"))
):
    """
    Get paginated list of inspectors with advanced filtering and search.
    
    Requires system_hr_manage permission.
    """
    try:
        # Build base query - get inspectors with roles loaded
        # Note: We'll load roles separately to avoid complex eager loading issues
        query = select(Inspector)
        
        # Apply filters
        if search:
            search_filter = or_(
                Inspector.first_name.contains(search),
                Inspector.last_name.contains(search),
                Inspector.employee_id.contains(search),
                Inspector.email.contains(search),
                Inspector.national_id.contains(search)
            )
            query = query.where(search_filter)
        
        if active_only:
            query = query.where(Inspector.active == True)
        
        if can_login_only is not None:
            query = query.where(Inspector.can_login == can_login_only)
        
        if attendance_tracking is not None:
            query = query.where(Inspector.attendance_tracking_enabled == attendance_tracking)
        
        # Apply sorting
        sort_field = getattr(Inspector, sort_by, Inspector.last_name)
        if sort_order.lower() == "desc":
            query = query.order_by(sort_field.desc())
        else:
            query = query.order_by(sort_field.asc())
        
        # Apply pagination
        offset = (page - 1) * page_size
        query = query.offset(offset).limit(page_size)
        
        # Execute query
        inspectors = db.exec(query).all()
        
        # Load roles for each inspector separately to avoid SQLAlchemy relationship issues
        inspector_responses = []
        for inspector in inspectors:
            # Get roles for this inspector
            from app.domains.inspector.models.authorization import InspectorRole, Role
            roles_query = select(InspectorRole, Role).where(
                InspectorRole.inspector_id == inspector.id
            ).join(Role, InspectorRole.role_id == Role.id)
            
            role_results = db.exec(roles_query).all()
            role_names = [role.name for _, role in role_results]
            
            # Create response with roles
            response_data = InspectorResponse.from_model(inspector)
            response_data.roles = role_names
            inspector_responses.append(response_data)
        
        logging.info(
            f"Inspector list requested by {current_inspector.id}: "
            f"page={page}, size={page_size}, search={search}"
        )
        
        return inspector_responses
        
    except Exception as e:
        logging.error(f"Error listing inspectors: {e}")
        raise HTTPException(
            status_code=500,
            detail="Failed to retrieve inspectors"
        )

@log_api_errors("inspector")
@router.post("/", response_model=InspectorResponse)
def create_inspector(
    inspector_data: InspectorCreateRequest,
    db: Session = Depends(get_session),
    current_inspector: Inspector = Depends(require_standardized_permission("system_hr_manage"))
):
    """Create new inspector"""
    import logging
    from sqlalchemy.exc import IntegrityError
    from sqlmodel import select
    from pydantic import ValidationError
    
    # Log the incoming raw data for debugging
    try:
        logging.info(f"📥 Creating inspector with data: {inspector_data.dict()}")
    except Exception as e:
        logging.error(f"❌ Error serializing request data: {e}")
    
    try:
        # Check for existing employee_id and national_id
        existing_employee = db.exec(
            select(Inspector).where(Inspector.employee_id == inspector_data.employee_id)
        ).first()
        if existing_employee:
            raise HTTPException(
                status_code=400, 
                detail=f"Employee ID '{inspector_data.employee_id}' already exists"
            )
        
        existing_national_id = db.exec(
            select(Inspector).where(Inspector.national_id == inspector_data.national_id)
        ).first()
        if existing_national_id:
            raise HTTPException(
                status_code=400, 
                detail=f"National ID '{inspector_data.national_id}' already exists"
            )
        
        # Check for existing email
        existing_email = db.exec(
            select(Inspector).where(Inspector.email == inspector_data.email)
        ).first()
        if existing_email:
            raise HTTPException(
                status_code=400, 
                detail=f"Email '{inspector_data.email}' already exists"
            )
        
        # Check for existing username if provided
        if inspector_data.username:
            existing_username = db.exec(
                select(Inspector).where(Inspector.username == inspector_data.username)
            ).first()
            if existing_username:
                raise HTTPException(
                    status_code=400, 
                    detail=f"Username '{inspector_data.username}' already exists"
                )
        
        # Convert the request schema to the Inspector model
        inspector_dict = inspector_data.dict(exclude_unset=True)
        
        # Handle password hashing if provided
        if inspector_data.password and inspector_data.can_login:
            from app.domains.auth.services.auth_service import AuthService
            inspector_dict['password_hash'] = AuthService.get_password_hash(inspector_data.password)
            del inspector_dict['password']
        
        # Log the processed data
        logging.info(f"🔄 Processed inspector data: {inspector_dict}")
        
        # Create the inspector model
        inspector = Inspector(**inspector_dict)
        
        db.add(inspector)
        db.commit()
        db.refresh(inspector)
        
        logging.info(f"✅ Successfully created inspector with ID: {inspector.id}")
        
    except HTTPException as e:
        # Log HTTPException to domain log
        from app.core.logging_config import DomainLogger
        DomainLogger.log_api_error(
            domain_name="inspector",
            endpoint="/api/v1/inspectors/",
            method="POST",
            error=e,
            request_data=inspector_data.dict() if 'inspector_data' in locals() else None,
            user_id=current_inspector.id if 'current_inspector' in locals() else None,
            status_code=e.status_code
        )
        # Re-raise HTTPException as-is
        raise
    except ValidationError as e:
        logging.error(f"❌ Pydantic validation error: {e.errors()}")
        # Format validation errors for better user experience
        error_details = []
        for error in e.errors():
            field = '.'.join(str(loc) for loc in error['loc'])
            message = error['msg']
            error_details.append(f"{field}: {message}")
        
        raise HTTPException(
            status_code=422,
            detail={
                "message": "Validation failed",
                "errors": error_details,
                "type": "validation_error"
            }
        )
    except IntegrityError as e:
        db.rollback()
        error_msg = str(e.orig)
        if "employee_id" in error_msg:
            detail = f"Employee ID '{inspector_data.employee_id}' already exists"
        elif "national_id" in error_msg:
            detail = f"National ID '{inspector_data.national_id}' already exists"
        elif "email" in error_msg:
            detail = f"Email '{inspector_data.email}' already exists"
        elif "username" in error_msg:
            detail = f"Username '{inspector_data.username}' already exists"
        else:
            detail = "Duplicate data found. Please check employee ID, national ID, email, and username."
        
        logging.error(f"❌ Integrity constraint violation: {detail}")
        
        # Log to domain log
        from app.core.logging_config import DomainLogger
        http_exception = HTTPException(status_code=400, detail=detail)
        DomainLogger.log_api_error(
            domain_name="inspector",
            endpoint="/api/v1/inspectors/",
            method="POST",
            error=http_exception,
            request_data=inspector_data.dict(),
            user_id=current_inspector.id,
            status_code=400
        )
        
        raise http_exception
    except Exception as e:
        db.rollback()
        logging.error(f"❌ Error creating inspector: {str(e)}")
        logging.error(f"❌ Exception type: {type(e)}")
        import traceback
        logging.error(f"❌ Full traceback: {traceback.format_exc()}")
        
        # Log to domain log
        from app.core.logging_config import DomainLogger
        http_exception = HTTPException(
            status_code=400, 
            detail={
                "message": f"Failed to create inspector: {str(e)}",
                "type": "creation_error"
            }
        )
        DomainLogger.log_api_error(
            domain_name="inspector",
            endpoint="/api/v1/inspectors/",
            method="POST",
            error=http_exception,
            request_data=inspector_data.dict(),
            user_id=current_inspector.id,
            status_code=400
        )
        
        raise http_exception
    
    return InspectorResponse.from_model(inspector)

@log_api_errors("inspector")
@router.post("/test-validation")
def test_validation(
    test_data: dict,
    db: Session = Depends(get_session),
    current_inspector: Inspector = Depends(get_current_active_inspector)
):
    """Test endpoint to debug validation issues"""
    import logging
    from pydantic import ValidationError
    
    logging.info(f"🧪 Testing validation with data: {test_data}")
    
    try:
        # Try to validate the data with our schema
        validated_data = InspectorCreateRequest(**test_data)
        logging.info(f"✅ Validation successful: {validated_data.dict()}")
        return {
            "status": "success",
            "message": "Validation passed",
            "validated_data": validated_data.dict()
        }
    except ValidationError as e:
        logging.error(f"❌ Validation failed: {e.errors()}")
        return {
            "status": "error",
            "message": "Validation failed",
            "errors": e.errors(),
            "input_data": test_data
        }
    except Exception as e:
        logging.error(f"❌ Unexpected error: {e}")
        return {
            "status": "error", 
            "message": f"Unexpected error: {str(e)}",
            "input_data": test_data
        }
@log_api_errors("inspector")
@router.get("/search")
async def search_inspectors(
    q: str = Query(..., min_length=2, description="Search query"),
    limit: int = Query(10, ge=1, le=50, description="Maximum results"),
    active_only: bool = Query(True, description="Search only active inspectors"),
    db: Session = Depends(get_session),
    current_inspector: Inspector = Depends(require_standardized_permission("system_superadmin"))
):
    """
    Quick search for inspectors (for autocomplete/dropdowns).
    
    Requires system_superadmin permission.
    """
    try:
        query = select(Inspector).where(
            or_(
                Inspector.first_name.contains(q),
                Inspector.last_name.contains(q),
                Inspector.employee_id.contains(q),
                Inspector.email.contains(q)
            )
        )
        
        if active_only:
            query = query.where(Inspector.active == True)
        
        query = query.order_by(Inspector.last_name, Inspector.first_name).limit(limit)
        
        inspectors = db.exec(query).all()
        
        return {
            "query": q,
            "results": [
                {
                    "id": i.id,
                    "name": i.get_full_name(),
                    "employee_id": i.employee_id,
                    "email": i.email,
                    "active": i.active
                }
                for i in inspectors
            ],
            "total": len(inspectors)
        }
        
    except Exception as e:
        logging.error(f"Error searching inspectors: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Search failed"
        )

@log_api_errors("inspector")
@router.get("/statistics")
async def get_inspector_statistics(
    db: Session = Depends(get_session),
    current_inspector: Inspector = Depends(require_standardized_permission("system_hr_manage"))
):
    """
    Get inspector statistics for dashboard.
    
    Requires system_hr_manage permission.
    """
    try:
        logging.info(f"Statistics endpoint called by inspector: {current_inspector.id}")
        
        # Basic counts
        total_inspectors = db.exec(select(func.count(Inspector.id))).one()
        logging.info(f"Total inspectors: {total_inspectors}")
        
        active_inspectors = db.exec(
            select(func.count(Inspector.id)).where(Inspector.active == True)
        ).one()
        logging.info(f"Active inspectors: {active_inspectors}")
        
        login_enabled = db.exec(
            select(func.count(Inspector.id)).where(Inspector.can_login == True)
        ).one()
        logging.info(f"Login enabled: {login_enabled}")
        
        attendance_tracking = db.exec(
            select(func.count(Inspector.id)).where(Inspector.attendance_tracking_enabled == True)
        ).one()
        logging.info(f"Attendance tracking: {attendance_tracking}")
        
        # Role assignment statistics
        from app.domains.inspector.models.authorization import InspectorRole
        inspectors_with_roles = db.exec(
            select(func.count(func.distinct(InspectorRole.inspector_id)))
        ).one()
        logging.info(f"Inspectors with roles: {inspectors_with_roles}")
        
        # Calculate additional stats
        inspectors_without_roles = total_inspectors - inspectors_with_roles
        activity_rate = round((active_inspectors / total_inspectors * 100) if total_inspectors > 0 else 0, 1)
        
        result = {
            "total_inspectors": total_inspectors,
            "active_inspectors": active_inspectors,
            "inactive_inspectors": total_inspectors - active_inspectors,
            "login_enabled": login_enabled,
            "attendance_tracking_enabled": attendance_tracking,
            "inspectors_with_roles": inspectors_with_roles,
            "inspectors_without_roles": inspectors_without_roles,
            "activity_rate": activity_rate
        }
        
        logging.info(f"Statistics result: {result}")
        return result
        
    except Exception as e:
        logging.error(f"Error getting inspector statistics: {e}")
        logging.error(f"Exception type: {type(e)}")
        logging.error(f"Exception args: {e.args}")
        import traceback
        logging.error(f"Full traceback: {traceback.format_exc()}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve statistics"
        )

@log_api_errors("inspector")
@router.get("/{inspector_id}", response_model=InspectorResponse)
async def get_inspector(
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
        
        has_view_all = await PermissionService.check_inspector_permission(
            db, current_inspector.id, "system_hr_manage"
        )
        
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

@log_api_errors("inspector")
@router.put("/{inspector_id}", response_model=InspectorResponse)
def update_inspector(
    inspector_id: int,
    inspector_update: InspectorUpdateRequest,  # Use the proper update schema
    db: Session = Depends(get_session),
    current_inspector: Inspector = Depends(require_standardized_permission("system_hr_manage"))
):
    """Update inspector"""
    db_inspector = db.get(Inspector, inspector_id)
    if not db_inspector:
        raise HTTPException(status_code=404, detail="Inspector not found")
    
    try:
        # Convert the request schema to the proper format, only include non-None values
        inspector_data = inspector_update.dict(exclude_unset=True, exclude_none=True)
        
        logging.info(f"🔄 Updating inspector {inspector_id} with data: {inspector_data}")
        
        # Handle password hashing if provided
        if inspector_update.password:
            from app.domains.auth.services.auth_service import AuthService
            inspector_data['password_hash'] = AuthService.get_password_hash(inspector_update.password)
            # Remove the password field since we store password_hash
            if 'password' in inspector_data:
                del inspector_data['password']
        elif 'password' in inspector_data:
            # Remove password field if it's empty
            del inspector_data['password']
        
        # Update fields only if they exist in the model
        for key, value in inspector_data.items():
            if hasattr(db_inspector, key):
                setattr(db_inspector, key, value)
                logging.info(f"✅ Set {key} = {value}")
            else:
                logging.warning(f"⚠️ Field {key} not found in Inspector model")
        
        db.commit()
        db.refresh(db_inspector)
        
        logging.info(f"✅ Successfully updated inspector {inspector_id}")
        return InspectorResponse.from_model(db_inspector)
        
    except Exception as e:
        db.rollback()
        logging.error(f"❌ Error updating inspector {inspector_id}: {e}")
        logging.error(f"❌ Inspector data: {inspector_data}")
        raise HTTPException(status_code=400, detail=f"Failed to update inspector: {str(e)}")

@log_api_errors("inspector")
@router.get("/{inspector_id}/related-records")
def get_inspector_related_records(
    inspector_id: int,
    db: Session = Depends(get_session),
    current_inspector: Inspector = Depends(require_standardized_permission("system_hr_manage"))
):
    """Get all related records for an inspector before deletion"""
    inspector = db.get(Inspector, inspector_id)
    if not inspector:
        raise HTTPException(status_code=404, detail="Inspector not found")
    
    from app.domains.inspector.models.authorization import InspectorRole, Role
    from app.domains.inspector.models.documents import InspectorDocument
    from app.domains.notifications.models.notification import Notification, NotificationPreference
    
    # Get role assignments with role names
    roles_query = select(InspectorRole, Role).join(Role).where(InspectorRole.inspector_id == inspector_id)
    role_assignments = db.exec(roles_query).all()
    roles_data = [{
        "role_id": role.id,
        "role_name": role.name,
        "assigned_at": inspector_role.created_at.isoformat()
    } for inspector_role, role in role_assignments]
    
    # Get documents
    documents = db.exec(select(InspectorDocument).where(InspectorDocument.inspector_id == inspector_id)).all()
    documents_data = [{
        "document_id": doc.id,
        "document_type": doc.document_type,
        "filename": doc.filename,
        "upload_date": doc.upload_date.isoformat()
    } for doc in documents]
    
    # Get notifications
    notifications = db.exec(select(Notification).where(Notification.recipient_id == inspector_id)).all()
    notifications_data = [{
        "notification_id": notif.id,
        "title": notif.title,
        "type": notif.type,
        "status": notif.status,
        "created_at": notif.created_at.isoformat()
    } for notif in notifications]
    
    # Get notification preferences
    prefs = db.exec(select(NotificationPreference).where(NotificationPreference.inspector_id == inspector_id)).all()
    prefs_data = [{
        "pref_id": pref.id,
        "event_created": pref.event_created,
        "event_updated": pref.event_updated
    } for pref in prefs]
    
    return {
        "inspector_id": inspector_id,
        "inspector_name": f"{inspector.first_name} {inspector.last_name}",
        "employee_id": inspector.employee_id,
        "related_records": {
            "roles": {
                "count": len(roles_data),
                "data": roles_data
            },
            "documents": {
                "count": len(documents_data),
                "data": documents_data
            },
            "notifications": {
                "count": len(notifications_data),
                "data": notifications_data
            },
            "notification_preferences": {
                "count": len(prefs_data),
                "data": prefs_data
            }
        },
        "total_related_records": len(roles_data) + len(documents_data) + len(notifications_data) + len(prefs_data),
        "can_delete_safely": len(roles_data) + len(documents_data) + len(notifications_data) + len(prefs_data) == 0
    }

@log_api_errors("inspector")
@router.delete("/{inspector_id}")
def delete_inspector(
    inspector_id: int,
    force: bool = Query(False, description="Force delete with related records"),
    db: Session = Depends(get_session),
    current_inspector: Inspector = Depends(require_standardized_permission("system_superadmin"))
):
    """Delete inspector with option to force delete related records"""
    inspector = db.get(Inspector, inspector_id)
    if not inspector:
        raise HTTPException(status_code=404, detail="Inspector not found")
    
    try:
        # Check for related records that would prevent deletion
        from app.domains.inspector.models.authorization import InspectorRole
        from app.domains.inspector.models.documents import InspectorDocument
        from app.domains.notifications.models.notification import Notification, NotificationPreference
        
        # Count related records
        roles_count = db.exec(select(func.count(InspectorRole.inspector_id)).where(InspectorRole.inspector_id == inspector_id)).first()
        docs_count = db.exec(select(func.count(InspectorDocument.inspector_id)).where(InspectorDocument.inspector_id == inspector_id)).first()
        notifications_count = db.exec(select(func.count(Notification.recipient_id)).where(Notification.recipient_id == inspector_id)).first()
        
        related_records = []
        if roles_count > 0:
            related_records.append(f"{roles_count} role assignments")
        if docs_count > 0:
            related_records.append(f"{docs_count} documents")
        if notifications_count > 0:
            related_records.append(f"{notifications_count} notifications")
        
        if related_records and not force:
            detail = f"Cannot delete inspector. Found related records: {', '.join(related_records)}. Use ?force=true to delete all related records, or remove them manually first."
            raise HTTPException(status_code=400, detail=detail)
        
        # If force=true, delete related records first
        if force and related_records:
            logging.info(f"Force deleting inspector {inspector_id} with related records: {related_records}")
            
            # Delete role assignments
            if roles_count > 0:
                roles_to_delete = db.exec(select(InspectorRole).where(InspectorRole.inspector_id == inspector_id)).all()
                for role in roles_to_delete:
                    db.delete(role)
                logging.info(f"Deleted {len(roles_to_delete)} role assignments")
            
            # Delete documents
            if docs_count > 0:
                docs_to_delete = db.exec(select(InspectorDocument).where(InspectorDocument.inspector_id == inspector_id)).all()
                for doc in docs_to_delete:
                    db.delete(doc)
                logging.info(f"Deleted {len(docs_to_delete)} documents")
            
            # Delete notifications
            if notifications_count > 0:
                notifications_to_delete = db.exec(select(Notification).where(Notification.recipient_id == inspector_id)).all()
                for notification in notifications_to_delete:
                    db.delete(notification)
                logging.info(f"Deleted {len(notifications_to_delete)} notifications")
            
            # Delete notification preferences
            notification_prefs = db.exec(select(NotificationPreference).where(NotificationPreference.inspector_id == inspector_id)).all()
            for pref in notification_prefs:
                db.delete(pref)
        
        # Now delete the inspector
        db.delete(inspector)
        db.commit()
        
        message = f"Inspector {inspector_id} deleted successfully"
        if force and related_records:
            message += f" along with related records: {', '.join(related_records)}"
        
        logging.info(f"Inspector {inspector_id} deleted by {current_inspector.id}. Force: {force}")
        return {"message": message}
        
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        logging.error(f"Error deleting inspector {inspector_id}: {e}")
        raise HTTPException(status_code=400, detail=f"Failed to delete inspector: {str(e)}")

@log_api_errors("inspector")
@router.get("/{inspector_id}/certifications", response_model=List[InspectorCertificationRecord])
async def get_inspector_certifications(
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
        
        has_view_all = await PermissionService.check_inspector_permission(
            db, current_inspector.id, "system_hr_manage"
        )
        
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

@log_api_errors("inspector")
@router.post("/{inspector_id}/certifications", response_model=InspectorCertificationRecord)
def add_inspector_certification(
    inspector_id: int,
    certification: InspectorCertificationRecord,
    db: Session = Depends(get_session),
    current_inspector: Inspector = Depends(require_standardized_permission("system_hr_manage"))
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

@log_api_errors("inspector")
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


@log_api_errors("inspector")
@router.get("/{inspector_id}/profile-image", response_class=FileResponse)
async def get_inspector_profile_image(
    inspector_id: int,
    db: Session = Depends(get_session),
    current_inspector: Inspector = Depends(get_current_active_inspector)
):
    """
    Get inspector's profile image.
    
    Inspectors can view their own profile image or need system_hr_manage permission.
    """
    try:
        # Get inspector
        inspector = db.get(Inspector, inspector_id)
        if not inspector:
            raise HTTPException(status_code=404, detail="Inspector not found")
        
        # Permission check: inspector can view own profile image or needs admin permission
        if current_inspector.id != inspector_id:
            from app.domains.auth.services.permission_service import PermissionService
            
            has_admin_access = await PermissionService.check_inspector_permission(
                db, current_inspector.id, "system_hr_manage"
            )
            
            if not has_admin_access:
                raise HTTPException(
                    status_code=403,
                    detail="Insufficient permissions to view this profile image"
                )
        
        # If no profile image URL, return 404
        if not inspector.profile_image_url:
            raise HTTPException(status_code=404, detail="No profile image found for this inspector")
        
        # Extract document ID from the profile_image_url
        # The URL format is "/api/v1/inspectors/documents/{document_id}/download"
        import re
        match = re.search(r'/documents/(\d+)/download$', inspector.profile_image_url)
        if not match:
            raise HTTPException(status_code=404, detail="Invalid profile image URL")
        
        document_id = int(match.group(1))
        
        # Get the document
        service = FileUploadService(db)
        document = service.get_document(document_id)
        
        if not document:
            raise HTTPException(status_code=404, detail="Profile image document not found")
        
        return service.serve_document_file(document)
        
    except HTTPException:
        raise
    except Exception as e:
        logging.error(f"Error getting profile image for inspector {inspector_id}: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to get profile image: {str(e)}"
        )

@log_api_errors("inspector")
@router.post("/upload/profile-image", response_model=UploadResponse)
async def upload_inspector_profile_image(
    inspector_id: int = Form(...),
    file: UploadFile = File(...),
    db: Session = Depends(get_session),
    current_inspector: Inspector = Depends(require_standardized_permission("system_hr_manage"))
):
    """
    Upload profile image for an inspector.
    
    Requires system_hr_manage permission.
    """
    try:
        logging.info(f"Profile image upload requested for inspector {inspector_id} by {current_inspector.id}")
        
        # Validate inspector exists
        inspector = db.get(Inspector, inspector_id)
        if not inspector:
            raise HTTPException(status_code=404, detail=f"Inspector with ID {inspector_id} not found")
        
        service = FileUploadService(db)
        document = await service.upload_profile_image(
            inspector_id=inspector_id,
            file=file
        )
        
        file_info = service.get_file_info(document)
        
        logging.info(f"Profile image uploaded successfully for inspector {inspector_id}: {file_info['filename']}")
        
        return {
            "success": True,
            "message": "Profile image uploaded successfully",
            "document": file_info
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logging.error(f"Error uploading profile image for inspector {inspector_id}: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to upload profile image: {str(e)}"
        )
