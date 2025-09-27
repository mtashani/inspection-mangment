from datetime import datetime
from enum import Enum
from typing import Optional
from sqlmodel import SQLModel, Field, Relationship


class DocumentType(str, Enum):
    """Enumeration for document types"""
    IdCard = "id_card"
    BirthCertificate = "birth_certificate"
    MilitaryService = "military_service"
    Degree = "degree"
    Other = "other"


class InspectorDocument(SQLModel, table=True):
    """Model for inspector documents"""
    __tablename__ = "inspector_documents"  # type: ignore
    
    id: Optional[int] = Field(default=None, primary_key=True)
    inspector_id: int = Field(foreign_key="inspectors.id")
    
    document_type: DocumentType
    file_url: str  # S3 or other storage URL
    upload_date: datetime = Field(default_factory=datetime.utcnow)
    filename: str  # Storage filename (unique)
    original_filename: str  # Original uploaded filename
    file_size: int  # in bytes
    description: Optional[str] = None
    mime_type: Optional[str] = None
    
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    
    # Relationships
    inspector: "Inspector" = Relationship(back_populates="documents")


# Import at the end to avoid circular imports
# Use string annotation to avoid circular import issues
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from app.domains.inspector.models.inspector import Inspector