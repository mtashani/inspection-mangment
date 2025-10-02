"""
Schemas for File Upload API Requests and Responses
"""

from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, Field
from app.domains.inspector.models.documents import DocumentType
from app.domains.inspector.models.enums import InspectorCertification, CertificationLevel


class DocumentInfoResponse(BaseModel):
    """Response model for document information"""
    id: int
    inspector_id: int
    document_type: str
    filename: str
    original_filename: str
    file_size: int
    file_size_mb: float
    mime_type: Optional[str]
    upload_date: datetime
    description: Optional[str]
    download_url: str
    preview_url: str
    exists: bool
    # Additional fields for certificate-specific information
    certification_type: Optional[str]
    certification_number: Optional[str]
    level: Optional[str]
    issue_date: Optional[date]
    expiry_date: Optional[date]
    issuing_authority: Optional[str]

    class Config:
        from_attributes = True


class UploadResponse(BaseModel):
    """Response model for single file upload"""
    success: bool
    message: str
    document: DocumentInfoResponse


class UploadConfigResponse(BaseModel):
    """Response model for upload configuration"""
    max_file_size: int
    max_file_size_mb: float
    allowed_mime_types: dict
    document_types: List[str]
    max_files_per_batch: int


class DeleteResponse(BaseModel):
    """Response model for file deletion"""
    success: bool
    message: str


# Request models for API documentation
class UploadDocumentRequest(BaseModel):
    """Request model for document upload (for documentation)"""
    inspector_id: int = Field(..., description="ID of the inspector")
    document_type: DocumentType = Field(..., description="Type of document being uploaded")
    description: Optional[str] = Field(None, description="Optional description of the document")
    
    class Config:
        json_schema_extra = {
            "example": {
                "inspector_id": 1,
                "document_type": "certificate",
                "description": "API 510 Certification"
            }
        }


class UploadProfileImageRequest(BaseModel):
    """Request model for profile image upload (for documentation)"""
    inspector_id: int = Field(..., description="ID of the inspector")
    
    class Config:
        json_schema_extra = {
            "example": {
                "inspector_id": 1
            }
        }
