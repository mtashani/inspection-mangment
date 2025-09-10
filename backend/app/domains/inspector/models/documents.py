from datetime import datetime
from enum import Enum
from typing import Optional
from sqlmodel import SQLModel, Field, Relationship


class DocumentType(str, Enum):
    """Enumeration for document types"""
    ProfileImage = "profile_image"
    Certificate = "certificate"
    IdCard = "id_card"
    Qualification = "qualification"
    TrainingRecord = "training_record"
    Other = "other"


class InspectorDocument(SQLModel, table=True):
    """Model for inspector documents"""
    __tablename__ = "inspector_documents"
    
    id: Optional[int] = Field(default=None, primary_key=True)
    inspector_id: int = Field(foreign_key="inspectors.id")
    
    document_type: str
    file_url: str  # S3 or other storage URL
    upload_date: datetime = Field(default_factory=datetime.utcnow)
    filename: str
    file_size: int  # in bytes
    description: Optional[str] = None
    mime_type: Optional[str] = None
    
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    
    # Relationships
    inspector: "Inspector" = Relationship(back_populates="documents")


# Import at the end to avoid circular imports
from app.domains.inspector.models.inspector import Inspector