"""
Schemas for Certification API Requests and Responses
"""

from datetime import datetime, date
from typing import Optional, List
from pydantic import BaseModel, Field
from app.domains.inspector.models.enums import InspectorCertification, CertificationLevel


class CertificationCreateRequest(BaseModel):
    """Request model for creating a certification"""
    inspector_id: int = Field(..., description="ID of the inspector")
    certification_type: InspectorCertification = Field(..., description="Type of certification")
    certification_number: str = Field(..., description="Certification number")
    level: CertificationLevel = Field(..., description="Certification level")
    issue_date: Optional[date] = Field(None, description="Date the certification was issued")
    expiry_date: Optional[date] = Field(None, description="Date the certification expires")
    issuing_authority: str = Field(..., description="Organization that issued the certification")
    document_path: Optional[str] = Field(None, description="Path to the certificate document file")


class CertificationUpdateRequest(BaseModel):
    """Request model for updating a certification"""
    certification_type: Optional[InspectorCertification] = Field(None, description="Type of certification")
    certification_number: Optional[str] = Field(None, description="Certification number")
    level: Optional[CertificationLevel] = Field(None, description="Certification level")
    issue_date: Optional[date] = Field(None, description="Date the certification was issued")
    expiry_date: Optional[date] = Field(None, description="Date the certification expires")
    issuing_authority: Optional[str] = Field(None, description="Organization that issued the certification")
    document_path: Optional[str] = Field(None, description="Path to the certificate document file")


class CertificationResponse(BaseModel):
    """Response model for certification information"""
    id: int
    inspector_id: int
    certification_type: str
    certification_number: str
    level: str
    issue_date: Optional[date]
    expiry_date: Optional[date]
    issuing_authority: str
    document_path: Optional[str]
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class CertificationListResponse(BaseModel):
    """Response model for listing certifications"""
    certifications: List[CertificationResponse]


class CertificationStatsResponse(BaseModel):
    """Response model for certification statistics"""
    inspector_id: int
    total_certifications: int
    certification_types: dict
    certification_levels: dict
    expired: int
    expiring_soon: int


class DeleteResponse(BaseModel):
    """Response model for certification deletion"""
    success: bool
    message: str


class CertificationTypeListResponse(BaseModel):
    """Response model for certification types list"""
    certification_types: List[str]


class CertificationLevelListResponse(BaseModel):
    """Response model for certification levels list"""
    certification_levels: List[str]
