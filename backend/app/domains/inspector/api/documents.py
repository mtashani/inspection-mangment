"""
Document Management API Routes
Handles all document types for inspectors (excluding certificates which have their own API)
"""

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, Query, status, Request
from fastapi.responses import FileResponse
from typing import List, Optional
from sqlmodel import Session, select
from datetime import datetime
import logging

from app.database import get_session
from app.domains.auth.dependencies import get_current_active_inspector, require_standardized_permission
from app.domains.inspector.models.inspector import Inspector
from app.domains.inspector.models.documents import InspectorDocument, DocumentType
from app.domains.inspector.services.document_service import FileUploadService
from app.domains.inspector.schemas.files import UploadResponse, DocumentInfoResponse, DeleteResponse
from app.core.api_logging import log_api_errors

router = APIRouter()


@log_api_errors("inspector")
@router.get("/documents/{document_id}/download", response_class=FileResponse)
async def download_document(
    request: Request,
    document_id: int,
    db: Session = Depends(get_session),
    current_inspector: Inspector = Depends(get_current_active_inspector)
):
    """
    Download a document file by ID.
    
    Inspectors can download their own documents or need system_hr_manage permission.
    """
    try:
        logging.info(f"Download request for document_id: {document_id}, inspector: {current_inspector.id}, auth header: {request.headers.get('authorization', 'missing')}")
        logging.info(f"Download request for document_id: {document_id}, inspector: {current_inspector.id}, auth header: {request.headers.get('authorization', 'missing')}")
        service = FileUploadService(db)
        document = service.get_document(document_id)
        if not document:
            logging.warning(f"Document not found for ID: {document_id}")
        
        if not document:
            raise HTTPException(status_code=404, detail="Document not found")
        
        # Permission check: inspector can download own documents or needs admin permission
        if current_inspector.id != document.inspector_id:
            from app.domains.auth.services.permission_service import PermissionService
            
            has_admin_access = await PermissionService.check_inspector_permission(
                db, current_inspector.id or 0, "system_hr_manage"
            )
            
            if not has_admin_access:
                raise HTTPException(
                    status_code=403,
                    detail="Insufficient permissions to download this document"
                )
        
        return service.serve_document_file(document, disposition='attachment')
        
    except HTTPException:
        raise
    except Exception as e:
        logging.error(f"Error downloading document {document_id}: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to download document: {str(e)}"
        )


@log_api_errors("inspector")
@router.get("/documents/types", response_model=List[dict])
async def get_document_types(
    current_inspector: Inspector = Depends(get_current_active_inspector)
):
    """
    Get list of available document types.
    """
    try:
        document_types = [
            {
                "value": DocumentType.IdCard.value,
                "label": "ID Card",
                "description": "Government issued identification document"
            },
            {
                "value": DocumentType.BirthCertificate.value,
                "label": "Birth Certificate",
                "description": "Birth certificate document"
            },
            {
                "value": DocumentType.MilitaryService.value,
                "label": "Military Service",
                "description": "Military service certificate"
            },
            {
                "value": DocumentType.Degree.value,
                "label": "Degree",
                "description": "Educational degree certificate"
            },
            {
                "value": DocumentType.Other.value,
                "label": "Other Documents",
                "description": "Miscellaneous documents and files"
            }
        ]
        
        return document_types
        
    except Exception as e:
        logging.error(f"Error getting document types: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to get document types: {str(e)}"
        )
 
 
@log_api_errors("inspector")
@router.get("/documents/{inspector_id}", response_model=List[DocumentInfoResponse])
async def get_inspector_documents(
    inspector_id: int,
    document_type: Optional[DocumentType] = Query(None),
    db: Session = Depends(get_session),
    current_inspector: Inspector = Depends(get_current_active_inspector)
):
    """
    Get all documents for a specific inspector.
    
    Inspectors can view their own documents or need system_hr_manage permission.
    """
    try:
        # Permission check: inspector can view own documents or needs admin permission
        if current_inspector.id != inspector_id:
            from app.domains.auth.services.permission_service import PermissionService
            
            has_admin_access = await PermissionService.check_inspector_permission(
                db, current_inspector.id or 0, "system_hr_manage"
            )
            
            if not has_admin_access:
                raise HTTPException(
                    status_code=403,
                    detail="Insufficient permissions to view other inspectors' documents"
                )
        
        service = FileUploadService(db)
        
        # Build query
        query = select(InspectorDocument).where(
            InspectorDocument.inspector_id == inspector_id
        )
        
        # Filter by document type if specified
        if document_type:
            query = query.where(InspectorDocument.document_type == document_type)
        
        # Order by upload date descending
        query = query.order_by(InspectorDocument.upload_date.desc())  # type: ignore
        
        documents = db.exec(query).all()
        
        logging.info(f"Retrieved {len(documents)} documents for inspector {inspector_id}")
        
        return [service.get_file_info(doc) for doc in documents]
        
    except HTTPException:
        raise
    except Exception as e:
        logging.error(f"Error getting inspector documents: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to retrieve documents: {str(e)}"
        )


@log_api_errors("inspector")
@router.post("/documents/upload", response_model=UploadResponse)
async def upload_document(
    inspector_id: int = Form(...),
    document_type: DocumentType = Form(...),
    file: UploadFile = File(...),
    description: Optional[str] = Form(None),
    db: Session = Depends(get_session),
    current_inspector: Inspector = Depends(require_standardized_permission("system_hr_manage"))
):
    """
    Upload a document for an inspector.
    
    Requires system_hr_manage permission.
    """
    try:
        logging.info(f"Document upload requested for inspector {inspector_id}, type: {document_type} by {current_inspector.id}")
        
        # Validate MIME type
        allowed_mime_types = [
            'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp',
            'application/pdf'
        ]
        if file.content_type not in allowed_mime_types:
            raise HTTPException(
                status_code=400,
                detail=f"Unsupported file type: {file.content_type}. Only images (JPEG, PNG, GIF, WebP) and PDFs are allowed."
            )
        
        service = FileUploadService(db)
        document = await service.upload_document(
            inspector_id=inspector_id,
            file=file,
            document_type=document_type,
            description=description
        )
        
        file_info = service.get_file_info(document)
        
        logging.info(f"Document uploaded successfully: {file_info['filename']}")
        
        return {
            "success": True,
            "message": "Document uploaded successfully",
            "document": file_info
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logging.error(f"Error uploading document: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to upload document: {str(e)}"
        )


@log_api_errors("inspector")
@router.post("/documents/upload-multiple", response_model=dict)
async def upload_multiple_documents(
    inspector_id: int = Form(...),
    document_type: DocumentType = Form(...),
    files: List[UploadFile] = File(...),
    descriptions: Optional[List[str]] = Form(None),
    db: Session = Depends(get_session),
    current_inspector: Inspector = Depends(require_standardized_permission("system_hr_manage"))
):
    """
    Upload multiple documents for an inspector.
    
    Requires system_hr_manage permission.
    """
    try:
        logging.info(f"Multiple document upload requested for inspector {inspector_id}, type: {document_type}, count: {len(files)}")
        
        if len(files) > 10:  # Limit to 10 files per request
            raise HTTPException(
                status_code=400,
                detail="Maximum 10 documents allowed per request"
            )
        
        service = FileUploadService(db)
        
        # Validate MIME types for all files
        allowed_mime_types = [
            'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp',
            'application/pdf'
        ]
        invalid_files = []
        for i, file in enumerate(files):
            if file.content_type not in allowed_mime_types:
                invalid_files.append({
                    'filename': file.filename,
                    'mime_type': file.content_type,
                    'error': f"Unsupported file type: {file.content_type}. Only images (JPEG, PNG, GIF, WebP) and PDFs are allowed."
                })
        
        if invalid_files:
            raise HTTPException(
                status_code=400,
                detail=f"Invalid file types: {', '.join([f'{f['filename']} ({f['mime_type']})' for f in invalid_files])}"
            )
        
        uploaded_documents = []
        failed_uploads = []
        
        for i, file in enumerate(files):
            try:
                description = descriptions[i] if descriptions and i < len(descriptions) else None
                
                document = await service.upload_document(
                    inspector_id=inspector_id,
                    file=file,
                    document_type=document_type,
                    description=description
                )
                
                file_info = service.get_file_info(document)
                uploaded_documents.append(file_info)
                
            except Exception as e:
                failed_uploads.append({
                    "filename": file.filename,
                    "error": str(e)
                })
        
        logging.info(f"Multiple document upload completed: {len(uploaded_documents)} success, {len(failed_uploads)} failed")
        
        return {
            "success": True,
            "message": f"Upload completed: {len(uploaded_documents)} successful, {len(failed_uploads)} failed",
            "uploaded_documents": uploaded_documents,
            "failed_uploads": failed_uploads,
            "total_uploaded": len(uploaded_documents),
            "total_failed": len(failed_uploads)
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logging.error(f"Error in multiple document upload: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to upload documents: {str(e)}"
        )


@log_api_errors("inspector")
@router.delete("/documents/{document_id}", response_model=DeleteResponse)
async def delete_document(
    document_id: int,
    db: Session = Depends(get_session),
    current_inspector: Inspector = Depends(require_standardized_permission("system_hr_manage"))
):
    """
    Delete a document by ID.
    
    Requires system_hr_manage permission.
    """
    try:
        logging.info(f"Document deletion requested for document {document_id} by {current_inspector.id}")
        
        service = FileUploadService(db)
        document = service.get_document(document_id)
        
        if not document:
            raise HTTPException(status_code=404, detail="Document not found")
        
        success = service.delete_document(document_id)
        
        if not success:
            raise HTTPException(status_code=500, detail="Failed to delete document")
        
        logging.info(f"Document {document_id} deleted successfully")
        
        return {
            "success": True,
            "message": "Document deleted successfully"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logging.error(f"Error deleting document {document_id}: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to delete document: {str(e)}"
        )


@log_api_errors("inspector")
@router.get("/documents/{document_id}/preview", response_class=FileResponse)
async def preview_document(
    request: Request,
    document_id: int,
    db: Session = Depends(get_session),
    current_inspector: Inspector = Depends(get_current_active_inspector)
):
    """
    Preview a document file by ID (inline display for embed).
    
    Inspectors can preview their own documents or need system_hr_manage permission.
    """
    try:
        logging.info(f"Preview request for document_id: {document_id}, inspector: {current_inspector.id}, auth header: {request.headers.get('authorization', 'missing')}")
        service = FileUploadService(db)
        document = service.get_document(document_id)
        if not document:
            logging.warning(f"Document not found for ID: {document_id}")
            raise HTTPException(status_code=404, detail="Document not found")
        
        # Permission check
        if current_inspector.id != document.inspector_id:
            from app.domains.auth.services.permission_service import PermissionService
            
            has_admin_access = await PermissionService.check_inspector_permission(
                db, current_inspector.id or 0, "system_hr_manage"
            )
            
            if not has_admin_access:
                raise HTTPException(
                    status_code=403,
                    detail="Insufficient permissions to preview this document"
                )
        
        # Serve with inline disposition for preview
        return service.serve_document_file(document, disposition='inline')
    except HTTPException:
        raise
    except Exception as e:
        logging.error(f"Error previewing document {document_id}: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to preview document: {str(e)}"
        )


@log_api_errors("inspector")
@router.get("/documents/{document_id}/info", response_model=DocumentInfoResponse)
async def get_document_info(
    document_id: int,
    db: Session = Depends(get_session),
    current_inspector: Inspector = Depends(get_current_active_inspector)
):
    """
    Get detailed information about a document.
    
    Inspectors can view info for their own documents or need system_hr_manage permission.
    """
    try:
        service = FileUploadService(db)
        document = service.get_document(document_id)
        
        if not document:
            raise HTTPException(status_code=404, detail="Document not found")
        
        # Permission check: inspector can view own document info or needs admin permission
        if current_inspector.id != document.inspector_id:
            from app.domains.auth.services.permission_service import PermissionService
            
            has_admin_access = await PermissionService.check_inspector_permission(
                db, current_inspector.id or 0, "system_hr_manage"
            )
            
            if not has_admin_access:
                raise HTTPException(
                    status_code=403,
                    detail="Insufficient permissions to view this document info"
                )
        
        return service.get_file_info(document)
        
    except HTTPException:
        raise
    except Exception as e:
        logging.error(f"Error getting document info: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to get document info: {str(e)}"
        )




@log_api_errors("inspector")
@router.get("/documents/stats/{inspector_id}")
async def get_document_stats(
    inspector_id: int,
    db: Session = Depends(get_session),
    current_inspector: Inspector = Depends(get_current_active_inspector)
):
    """
    Get document statistics for an inspector.
    
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
                    detail="Insufficient permissions to view document statistics"
                )
        
        service = FileUploadService(db)
        
        # Get all documents
        query = select(InspectorDocument).where(
            InspectorDocument.inspector_id == inspector_id
        )
        documents = db.exec(query).all()
        
        # Calculate stats
        total_documents = len(documents)
        total_size = sum(doc.file_size for doc in documents)
        total_size_mb = round(total_size / (1024 * 1024), 2)
        
        # Group by document type
        document_types = {}
        file_types = {}
        
        for doc in documents:
            # By document type
            doc_type = doc.document_type
            document_types[doc_type] = document_types.get(doc_type, 0) + 1
            
            # By file type
            mime_type = doc.mime_type or "unknown"
            file_types[mime_type] = file_types.get(mime_type, 0) + 1
        
        return {
            "inspector_id": inspector_id,
            "total_documents": total_documents,
            "total_size_bytes": total_size,
            "total_size_mb": total_size_mb,
            "document_types": document_types,
            "file_types": file_types,
            "average_file_size_mb": round(total_size_mb / total_documents, 2) if total_documents > 0 else 0
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logging.error(f"Error getting document stats: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to get document statistics: {str(e)}"
        )
