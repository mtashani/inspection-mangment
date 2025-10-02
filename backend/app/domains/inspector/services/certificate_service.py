"""
Inspector Certificate Management Service
Handles certificate file upload, validation, storage, and management for inspectors
"""

import os
import uuid
import mimetypes
import io
from datetime import datetime, date
from pathlib import Path
from typing import Optional, List, Dict, Any, BinaryIO
from fastapi import UploadFile, HTTPException
from fastapi.responses import FileResponse, Response
from sqlmodel import Session, select
from PIL import Image, ImageOps

from app.domains.inspector.models.inspector import Inspector, InspectorCertificationRecord
from app.domains.inspector.models.enums import InspectorCertification, CertificationLevel


class InspectorCertificateService:
    """Service for handling inspector certificate uploads and management"""
    
    # Configuration
    UPLOAD_DIR = Path("uploads")
    CERTIFICATES_DIR = UPLOAD_DIR / "certificates"
    MAX_FILE_SIZE = 10 * 1024 * 1024  # 10MB
    
    # Allowed file types for certificates
    ALLOWED_MIME_TYPES = {
        InspectorCertification: [
            "application/pdf", "image/jpeg", "image/jpg", "image/png", "image/gif", "image/webp"
        ]
    }
    
    def __init__(self, db: Session):
        self.db = db
        # Ensure upload directories exist
        self.CERTIFICATES_DIR.mkdir(parents=True, exist_ok=True)
    
    def validate_certificate_file(self, file: UploadFile, certificate_type: Optional[InspectorCertification] = None) -> None:
        """Validate uploaded certificate file"""
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
        allowed_types = self.ALLOWED_MIME_TYPES.get(InspectorCertification, self.ALLOWED_MIME_TYPES[InspectorCertification])
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
    
    def generate_unique_filename(self, original_filename: str, inspector_id: int, certificate_type: Optional[InspectorCertification] = None) -> str:
        """Generate unique filename for certificate storage"""
        file_extension = Path(original_filename).suffix.lower()
        timestamp = datetime.utcnow().strftime("%Y%m%d_%H%M%S")
        unique_id = str(uuid.uuid4())[:8]
        
        # Handle enum types by getting their value
        type_str = certificate_type.value if certificate_type else "certificate"
        
        # Create a more descriptive filename
        return f"inspector_{inspector_id}_certificate_{type_str}_{timestamp}_{unique_id}{file_extension}"
    
    def get_storage_path(self, filename: str) -> Path:
        """Get full storage path for certificate file"""
        return self.CERTIFICATES_DIR / filename
    
    async def save_file(self, file: UploadFile, storage_path: Path) -> None:
        """Save uploaded certificate file to disk"""
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
                detail=f"Failed to save certificate file: {str(e)}"
            )
    
    async def upload_certificate_file(
        self,
        inspector_id: int,
        file: UploadFile,
        certification_type: Optional[InspectorCertification] = None,
        certification_number: Optional[str] = None,
        issuing_authority: Optional[str] = None,
        issue_date: Optional[date] = None,
        expiry_date: Optional[date] = None,
        level: Optional[CertificationLevel] = None,
        description: Optional[str] = None
    ) -> InspectorCertificationRecord:
        """Upload and store certificate file and create/update certification record"""
        # Validate inspector exists
        inspector = self.db.get(Inspector, inspector_id)
        if not inspector:
            raise HTTPException(
                status_code=404,
                detail=f"Inspector with ID {inspector_id} not found"
            )
        
        # Validate file
        self.validate_certificate_file(file, certification_type)
        
        # Generate unique filename and storage path
        unique_filename = self.generate_unique_filename(file.filename, inspector_id, certification_type)
        storage_path = self.get_storage_path(unique_filename)
        
        # Save file to disk
        await self.save_file(file, storage_path)
        
        # Get file size
        file_size = storage_path.stat().st_size
        
        # Try to find existing certification record by certification number to prevent duplicates
        if certification_number:
            query = select(InspectorCertificationRecord).where(
                InspectorCertificationRecord.inspector_id == inspector_id,
                InspectorCertificationRecord.certification_number == certification_number
            )
            existing_cert = self.db.exec(query).first()
            if existing_cert:
                raise HTTPException(
                    status_code=409,
                    detail=f"Certification with number {certification_number} already exists for this inspector"
                )
        
        # Create new certification record
        certification_record = InspectorCertificationRecord(
            inspector_id=inspector_id,
            certification_type=certification_type or InspectorCertification.OTHER,
            certification_number=certification_number or "",
            level=level or CertificationLevel.Level1,
            issue_date=issue_date,
            expiry_date=expiry_date,
            issuing_authority=issuing_authority or "",
            document_path=str(storage_path.relative_to(self.UPLOAD_DIR)),  # Store relative path from upload dir
            certification_details={"description": description} if description else {}
        )
        self.db.add(certification_record)
        
        try:
            self.db.commit()
            self.db.refresh(certification_record)
            return certification_record
            
        except Exception as e:
            # Clean up file if database operation fails
            if storage_path.exists():
                storage_path.unlink()
            self.db.rollback()
            raise HTTPException(
                status_code=500,
                detail=f"Failed to save certificate record: {str(e)}"
            )
    
    def get_inspector_certificates(
        self,
        inspector_id: int,
        certification_type: Optional[InspectorCertification] = None
    ) -> List[InspectorCertificationRecord]:
        """Get all certificates for an inspector"""
        query = select(InspectorCertificationRecord).where(
            InspectorCertificationRecord.inspector_id == inspector_id
        )
        
        if certification_type:
            query = query.where(InspectorCertificationRecord.certification_type == certification_type)
        
        return self.db.exec(query.order_by(InspectorCertificationRecord.created_at.desc())).all()
    
    def get_certificate(self, certificate_id: int) -> Optional[InspectorCertificationRecord]:
        """Get certificate record by ID"""
        return self.db.get(InspectorCertificationRecord, certificate_id)
    
    def delete_certificate(self, certificate_id: int) -> bool:
        """Delete certificate record and associated file"""
        certification_record = self.db.get(InspectorCertificationRecord, certificate_id)
        if not certification_record:
            return False
        
        # Delete file from disk if it exists
        if certification_record.document_path:
            file_path = self.UPLOAD_DIR / certification_record.document_path
            if file_path.exists():
                try:
                    file_path.unlink()
                except Exception as e:
                    # Log error but continue with database deletion
                    print(f"Warning: Failed to delete file {file_path}: {e}")
                    pass
        
        # Delete from database
        try:
            self.db.delete(certification_record)
            self.db.commit()
            return True
        except Exception:
            self.db.rollback()
            return False
    
    def get_file_path(self, certification_record: InspectorCertificationRecord) -> Path:
        """Get full file path for certificate"""
        if not certification_record.document_path:
            raise HTTPException(status_code=404, detail="Certificate file path not found")
        return self.UPLOAD_DIR / certification_record.document_path
    
    def generate_thumbnail(self, file_path: Path, max_size: tuple = (200, 200)) -> bytes:
        """Generate thumbnail for image certificate files, preserving transparency for PNG/WebP"""
        try:
            with Image.open(file_path) as img:
                # Preserve transparency for formats that support it
                if img.mode in ('RGBA', 'LA', 'P') and file_path.suffix.lower() in ['.png', '.webp']:
                    # For transparent images, keep the original format
                    img = ImageOps.exif_transpose(img)  # Apply EXIF orientation
                    img.thumbnail(max_size, Image.Resampling.LANCZOS)
                    
                    # Save to BytesIO with original format
                    output = io.BytesIO()
                    img.save(output, format=img.format, quality=85)
                    return output.getvalue()
                else:
                    # For non-transparent images, convert to RGB and save as JPEG
                    if img.mode in ('RGBA', 'LA', 'P'):
                        img = img.convert('RGB')
                    
                    img = ImageOps.exif_transpose(img)  # Apply EXIF orientation
                    img.thumbnail(max_size, Image.Resampling.LANCZOS)
                    
                    # Save to BytesIO as JPEG
                    output = io.BytesIO()
                    img.save(output, format='JPEG', quality=85)
                    return output.getvalue()
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Failed to generate thumbnail: {str(e)}")

    def serve_certificate_file(self, certification_record: InspectorCertificationRecord, disposition: str = 'attachment', filename: Optional[str] = None) -> FileResponse | Response:
        """Serve certificate file for download or preview"""
        if not certification_record.document_path:
            raise HTTPException(
                status_code=404,
                detail="Certificate file not found"
            )
            
        file_path = self.get_file_path(certification_record)
        
        if not file_path.exists():
            raise HTTPException(
                status_code=404,
                detail="File not found"
            )
        
        # For preview (inline) of images, serve thumbnail
        if disposition == 'inline' and certification_record.document_path:
            file_ext = Path(certification_record.document_path).suffix.lower()
            if file_ext in ['.jpg', '.jpeg', '.png', '.gif', '.webp']:
                try:
                    thumbnail_bytes = self.generate_thumbnail(file_path)
                    # Return appropriate media type based on original image format
                    if file_ext in ['.png', '.webp']:
                        # Preserve transparency in thumbnail
                        return Response(
                            content=thumbnail_bytes,
                            media_type=f'image/{file_ext[1:]}',  # Remove the dot from extension
                            headers={"Content-Disposition": 'inline'}
                        )
                    else:
                        # Use JPEG for other formats
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
            elif file_ext == '.pdf':
                # For PDFs, serve the full file with inline disposition for preview
                media_type = 'application/pdf'
                headers = {"Content-Disposition": 'inline'}
                return FileResponse(
                    path=file_path,
                    media_type=media_type,
                    headers=headers
                )
        
        # Determine media type based on file extension for full file serving
        media_type = mimetypes.guess_type(str(file_path))[0] or "application/octet-stream"
        
        if disposition == 'inline':
            headers = {"Content-Disposition": 'inline'}
        else:
            headers = {"Content-Disposition": f"{disposition}; filename={filename or Path(certification_record.document_path).name}"}
        
        return FileResponse(
            path=file_path,
            media_type=media_type,
            headers=headers
        )
    
    def get_file_info(self, certification_record: InspectorCertificationRecord) -> Dict[str, Any]:
        """Get file information for API response"""
        file_path = self.get_file_path(certification_record)
        file_exists = file_path.exists()
        file_size = 0
        file_size_mb = 0
        filename = "unknown"
        original_filename = "unknown"
        mime_type = "application/octet-stream"
        upload_date = certification_record.created_at

        if file_exists:
            try:
                file_stat = file_path.stat()
                file_size = file_stat.st_size
                file_size_mb = round(file_size / (1024 * 1024), 2)
                filename = file_path.name
                original_filename = certification_record.document_path.split('/')[-1] if certification_record.document_path else "unknown"
                mime_type = mimetypes.guess_type(str(file_path))[0] or "application/octet-stream"
            except Exception:
                # If we can't get file stats, return basic info
                pass

        return {
            "id": certification_record.id,
            "inspector_id": certification_record.inspector_id,
            "document_type": "certificate_file",
            "filename": filename,
            "original_filename": original_filename,
            "file_size": file_size,
            "file_size_mb": file_size_mb,
            "mime_type": mime_type,
            "upload_date": upload_date,
            "description": certification_record.certification_details.get("description", ""),
            "certification_type": certification_record.certification_type.value,
            "certification_number": certification_record.certification_number,
            "level": certification_record.level.value,
            "issue_date": certification_record.issue_date,
            "expiry_date": certification_record.expiry_date,
            "issuing_authority": certification_record.issuing_authority,
            "download_url": f"/api/v1/inspector/certificates/{certification_record.id}/download",
            "preview_url": f"/api/v1/inspector/certificates/{certification_record.id}/preview",
            "exists": file_exists
        }

    def get_certificate_stats(self, inspector_id: int) -> Dict[str, Any]:
        """Get certificate statistics for an inspector"""
        # Get all certification records for the inspector that have associated files
        query = select(InspectorCertificationRecord).where(
            InspectorCertificationRecord.inspector_id == inspector_id
        )
        certifications = self.db.exec(query).all()
        
        # Calculate stats for certificates that have files associated with them
        certificates_with_files = [cert for cert in certifications if cert.document_path]
        total_certificates = len(certificates_with_files)
        total_size = 0
        document_types = {}
        file_types = {}
        expiring_soon = 0
        expired = 0
        
        from datetime import date
        today = date.today()
        
        for cert in certificates_with_files:
            if cert.document_path:
                # Construct file path from document_path
                file_path = self.get_file_path(cert)
                
                if file_path.exists():
                    # Add to total size
                    try:
                        file_size = file_path.stat().st_size
                        total_size += file_size
                    except Exception:
                        # If file stats can't be read, skip
                        pass
                    
                    # Determine file type
                    mime_type = mimetypes.guess_type(str(file_path))[0] or "unknown"
                    file_types[mime_type] = file_types.get(mime_type, 0) + 1
                    
                    # Count by certification type
                    cert_type = cert.certification_type.value
                    document_types[cert_type] = document_types.get(cert_type, 0) + 1
            
            # Check expiration status
            if cert.expiry_date and cert.expiry_date < today:
                expired += 1
            elif cert.expiry_date and (cert.expiry_date - today).days <= 30:  # Expiring within 30 days
                expiring_soon += 1

        total_size_mb = round(total_size / (1024 * 1024), 2)
        
        return {
            "inspector_id": inspector_id,
            "total_certificates": total_certificates,
            "total_size_bytes": total_size,
            "total_size_mb": total_size_mb,
            "document_types": document_types,
            "file_types": file_types,
            "average_file_size_mb": round(total_size_mb / total_certificates, 2) if total_certificates > 0 else 0,
            "expired": expired,
            "expiring_soon": expiring_soon
        }
