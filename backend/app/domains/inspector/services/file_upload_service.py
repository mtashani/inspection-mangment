"""
File Upload Service for Inspector Documents and Media
Handles file upload, validation, storage, and management
"""

import os
import uuid
import mimetypes
import io
from datetime import datetime
from pathlib import Path
from typing import Optional, List, Dict, Any, BinaryIO
from fastapi import UploadFile, HTTPException
from fastapi.responses import FileResponse, Response
from sqlmodel import Session, select
from PIL import Image

from app.domains.inspector.models.documents import InspectorDocument, DocumentType
from app.domains.inspector.models.inspector import Inspector


class FileUploadService:
    """Service for handling file uploads for inspectors"""
    
    # Configuration
    UPLOAD_DIR = Path("uploads")
    MAX_FILE_SIZE = 10 * 1024 * 1024  # 10MB
    
    # Allowed file types for different document types
    ALLOWED_MIME_TYPES = {
        # Profile images (not in DocumentType enum, but still needed)
        "profile_image": [
            "image/jpeg", "image/jpg", "image/png", "image/webp"
        ],
        DocumentType.IdCard: [
            "application/pdf", "image/jpeg", "image/jpg", "image/png"
        ],
        DocumentType.BirthCertificate: [
            "application/pdf", "image/jpeg", "image/jpg", "image/png"
        ],
        DocumentType.MilitaryService: [
            "application/pdf", "image/jpeg", "image/jpg", "image/png"
        ],
        DocumentType.Degree: [
            "application/pdf", "image/jpeg", "image/jpg", "image/png"
        ],
        DocumentType.Other: [
            "application/pdf", "image/jpeg", "image/jpg", "image/png",
            "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            "text/plain"
        ]
    }
    
    def __init__(self, db: Session):
        self.db = db
        # Ensure upload directory exists
        self.UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
    
    def validate_file(self, file: UploadFile, document_type: DocumentType | str) -> None:
        """Validate uploaded file"""
        
        # Check file size
        if hasattr(file.file, 'seek') and hasattr(file.file, 'tell'):
            # Get file size
            file.file.seek(0, 2)  # Seek to end
            file_size = file.file.tell()
            file.file.seek(0)  # Reset to beginning
            
            if file_size > self.MAX_FILE_SIZE:
                raise HTTPException(
                    status_code=413,
                    detail=f"File too large. Maximum size allowed: {self.MAX_FILE_SIZE / (1024*1024):.1f}MB"
                )
        
        # Check file type
        mime_type = file.content_type or mimetypes.guess_type(file.filename)[0]
        allowed_types = self.ALLOWED_MIME_TYPES.get(document_type, [])
        
        if mime_type not in allowed_types:
            raise HTTPException(
                status_code=415,
                detail=f"Unsupported file type: {mime_type}. Allowed types: {', '.join(allowed_types)}"
            )
        
        # Check filename
        if not file.filename:
            raise HTTPException(
                status_code=400,
                detail="Filename is required"
            )
    
    def generate_unique_filename(self, original_filename: str, inspector_id: int, document_type: DocumentType | str) -> str:
        """Generate unique filename for storage"""
        file_extension = Path(original_filename).suffix.lower()
        timestamp = datetime.utcnow().strftime("%Y%m%d_%H%M%S")
        unique_id = str(uuid.uuid4())[:8]
        
        # Handle string document types (like "profile_image")
        doc_type_value = document_type if isinstance(document_type, str) else document_type.value
        
        return f"inspector_{inspector_id}_{doc_type_value}_{timestamp}_{unique_id}{file_extension}"
    
    def get_storage_path(self, filename: str, document_type: DocumentType | str) -> Path:
        """Get full storage path for file"""
        # Handle string document types (like "profile_image")
        doc_type_value = document_type if isinstance(document_type, str) else document_type.value
        return self.UPLOAD_DIR / doc_type_value / filename
    
    async def save_file(self, file: UploadFile, storage_path: Path) -> None:
        """Save uploaded file to disk"""
        # Ensure directory exists
        storage_path.parent.mkdir(parents=True, exist_ok=True)
        
        try:
            # Read and save file
            content = await file.read()
            with open(storage_path, "wb") as f:
                f.write(content)
            
            # Reset file pointer for potential reuse
            await file.seek(0)
            
        except Exception as e:
            raise HTTPException(
                status_code=500,
                detail=f"Failed to save file: {str(e)}"
            )
    
    async def upload_document(
        self,
        inspector_id: int,
        file: UploadFile,
        document_type: DocumentType,
        description: Optional[str] = None
    ) -> InspectorDocument:
        """Upload and store inspector document"""
        
        # Validate inspector exists
        inspector = self.db.get(Inspector, inspector_id)
        if not inspector:
            raise HTTPException(
                status_code=404,
                detail=f"Inspector with ID {inspector_id} not found"
            )
        
        # Validate file
        self.validate_file(file, document_type)
        
        # Generate unique filename and storage path
        unique_filename = self.generate_unique_filename(file.filename, inspector_id, document_type)
        storage_path = self.get_storage_path(unique_filename, document_type)
        
        # Save file to disk
        await self.save_file(file, storage_path)
        
        # Get file size
        file_size = storage_path.stat().st_size
        
        # Create document record
        document = InspectorDocument(
            inspector_id=inspector_id,
            document_type=document_type,
            file_url=str(storage_path.relative_to(self.UPLOAD_DIR)),  # Relative path from upload dir
            upload_date=datetime.utcnow(),
            filename=unique_filename,
            original_filename=file.filename,  # Store original filename
            file_size=file_size,
            description=description,
            mime_type=file.content_type
        )
        
        try:
            self.db.add(document)
            self.db.commit()
            self.db.refresh(document)
            
            return document
            
        except Exception as e:
            # Clean up file if database operation fails
            if storage_path.exists():
                storage_path.unlink()
            
            self.db.rollback()
            raise HTTPException(
                status_code=500,
                detail=f"Failed to save document record: {str(e)}"
            )
    
    async def upload_profile_image(
        self,
        inspector_id: int,
        file: UploadFile
    ) -> InspectorDocument:
        """Upload profile image and update inspector record"""
        
        # Validate inspector exists
        inspector = self.db.get(Inspector, inspector_id)
        if not inspector:
            raise HTTPException(
                status_code=404,
                detail=f"Inspector with ID {inspector_id} not found"
            )
        
        # Validate file specifically for profile images
        self.validate_file(file, "profile_image")
        
        # Generate unique filename and storage path
        unique_filename = self.generate_unique_filename(file.filename, inspector_id, "profile_image")
        storage_path = self.get_storage_path(unique_filename, "profile_image")
        
        # Save file to disk
        await self.save_file(file, storage_path)
        
        # Get file size
        file_size = storage_path.stat().st_size
        
        # Create document record with a generic document type since ProfileImage is not in the enum
        document = InspectorDocument(
            inspector_id=inspector_id,
            document_type=DocumentType.Other,  # Use Other as a fallback since ProfileImage is not in enum
            file_url=str(storage_path.relative_to(self.UPLOAD_DIR)),  # Relative path from upload dir
            upload_date=datetime.utcnow(),
            filename=unique_filename,
            original_filename=file.filename,  # Store original filename
            file_size=file_size,
            description="Profile image",
            mime_type=file.content_type
        )
        
        try:
            self.db.add(document)
            self.db.commit()
            self.db.refresh(document)
            
            # Update inspector's profile_image_url
            inspector.profile_image_url = f"/api/v1/inspectors/documents/{document.id}/download"
            self.db.commit()
            
            return document
            
        except Exception as e:
            # Clean up file if database operation fails
            if storage_path.exists():
                storage_path.unlink()
            
            self.db.rollback()
            raise HTTPException(
                status_code=500,
                detail=f"Failed to save profile image: {str(e)}"
            )
    
    def get_inspector_documents(
        self,
        inspector_id: int,
        document_type: Optional[DocumentType] = None
    ) -> List[InspectorDocument]:
        """Get all documents for an inspector"""
        
        query = select(InspectorDocument).where(
            InspectorDocument.inspector_id == inspector_id
        )
        
        if document_type:
            query = query.where(InspectorDocument.document_type == document_type)
        
        return self.db.exec(query.order_by(InspectorDocument.upload_date.desc())).all()
    
    def get_document(self, document_id: int) -> Optional[InspectorDocument]:
        """Get document by ID"""
        return self.db.get(InspectorDocument, document_id)
    
    def delete_document(self, document_id: int) -> bool:
        """Delete document and associated file"""
        
        document = self.db.get(InspectorDocument, document_id)
        if not document:
            return False
        
        # Delete file from disk
        file_path = self.UPLOAD_DIR / document.file_url
        if file_path.exists():
            try:
                file_path.unlink()
            except Exception:
                # Log error but continue with database deletion
                pass
        
        # Delete from database
        try:
            self.db.delete(document)
            self.db.commit()
            return True
        except Exception:
            self.db.rollback()
            return False
    
    def get_file_path(self, document: InspectorDocument) -> Path:
        """Get full file path for document"""
        return self.UPLOAD_DIR / document.file_url
    
    def generate_thumbnail(self, file_path: Path, max_size: tuple = (200, 200)) -> bytes:
        """Generate thumbnail for image files"""
        try:
            with Image.open(file_path) as img:
                # Convert to RGB if necessary (for JPEG output)
                if img.mode in ('RGBA', 'LA', 'P'):
                    img = img.convert('RGB')
                
                # Resize maintaining aspect ratio
                img.thumbnail(max_size, Image.Resampling.LANCZOS)
                
                # Save to BytesIO as JPEG
                output = io.BytesIO()
                img.save(output, format='JPEG', quality=85)
                return output.getvalue()
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Failed to generate thumbnail: {str(e)}")

    def serve_document_file(self, document: InspectorDocument, disposition: str = 'attachment', filename: Optional[str] = None) -> FileResponse | Response:
        """Serve document file for download or preview"""
        file_path = self.get_file_path(document)
        
        if not file_path.exists():
            raise HTTPException(
                status_code=404,
                detail="File not found"
            )
        
        # For preview (inline) of images, serve thumbnail
        if disposition == 'inline' and document.mime_type and document.mime_type.startswith('image/'):
            try:
                thumbnail_bytes = self.generate_thumbnail(file_path)
                return Response(
                    content=thumbnail_bytes,
                    media_type='image/jpeg',
                    headers={"Content-Disposition": 'inline'}
                )
            except HTTPException:
                raise
            except Exception:
                # Fallback to full image if thumbnail fails
                pass
        
        # Determine media type
        media_type = document.mime_type or "application/octet-stream"
        
        if disposition == 'inline':
            headers = {"Content-Disposition": 'inline'}
        else:
            headers = {"Content-Disposition": f"{disposition}; filename={filename or document.original_filename}"}
        
        return FileResponse(
            path=file_path,
            media_type=media_type,
            headers=headers
        )
    
    def get_file_info(self, document: InspectorDocument) -> Dict[str, Any]:
        """Get file information for API response"""
        file_path = self.get_file_path(document)
        
        return {
            "id": document.id,
            "inspector_id": document.inspector_id,
            "document_type": document.document_type,
            "filename": document.filename,
            "original_filename": document.original_filename,
            "file_size": document.file_size,
            "file_size_mb": round(document.file_size / (1024 * 1024), 2),
            "mime_type": document.mime_type,
            "upload_date": document.upload_date,
            "description": document.description,
            "download_url": f"/api/v1/inspectors/documents/{document.id}/download",
            "exists": file_path.exists() if file_path else False
        }