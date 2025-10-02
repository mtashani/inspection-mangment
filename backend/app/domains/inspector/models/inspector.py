from datetime import datetime, date
from typing import Optional, List
from datetime import datetime, date
from sqlmodel import SQLModel, Field, Relationship
from sqlalchemy import Column, JSON, String, UniqueConstraint
from app.domains.inspector.models.enums import InspectorCertification, CertificationLevel

# Use TYPE_CHECKING to avoid circular imports
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from app.domains.inspector.models.authorization import InspectorRole
    from app.domains.inspector.models.documents import InspectorDocument
    from app.domains.notifications.models.notification import Notification, NotificationPreference
    from app.domains.inspection.models.inspection_team import InspectionTeam


class Inspector(SQLModel, table=True):
    """Model for inspector information"""
    __tablename__ = "inspectors"  # type: ignore
    
    id: Optional[int] = Field(default=None, primary_key=True)
    # Basic Information
    first_name: str = Field(sa_column=Column(String, index=True))
    last_name: str = Field(sa_column=Column(String, index=True))
    employee_id: str = Field(sa_column=Column(String, unique=True, index=True))
    national_id: str = Field(sa_column=Column(String, unique=True))
    
    email: str
    phone: Optional[str] = None
    
    # Educational Information
    education_degree: Optional[str] = None
    education_field: Optional[str] = None
    education_institute: Optional[str] = None
    graduation_year: Optional[int] = None
    
    # Experience and qualifications
    years_experience: Optional[int] = None
    previous_companies: List[str] = Field(default=[], sa_column=Column(JSON))
    
    # Status and authentication
    active: bool = Field(default=True, description="Whether the inspector is currently employed")
    username: Optional[str] = Field(default=None, unique=True, index=True)
    password_hash: Optional[str] = Field(default=None)
    can_login: bool = Field(default=False)
    last_login: Optional[datetime] = None
    
    # Profile information
    date_of_birth: Optional[date] = None
    birth_place: Optional[str] = None
    profile_image_url: Optional[str] = None
    marital_status: Optional[str] = None
    
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    
    # Relationships - using string annotations to avoid circular imports
    certifications: List["InspectorCertificationRecord"] = Relationship(back_populates="inspector")
    roles: List["InspectorRole"] = Relationship(back_populates="inspector")
    documents: List["InspectorDocument"] = Relationship(back_populates="inspector")
    
    # Notification relationships
    notifications: List["Notification"] = Relationship(back_populates="recipient")
    notification_preferences: Optional["NotificationPreference"] = Relationship(back_populates="inspector")
    
    # Inspection team assignments (for workload tracking)
    inspection_assignments: List["InspectionTeam"] = Relationship(back_populates="inspector")
    
    # Payroll information
    base_hourly_rate: Optional[float] = None
    overtime_multiplier: Optional[float] = None
    night_shift_multiplier: Optional[float] = None
    on_call_multiplier: Optional[float] = None

    
    attendance_tracking_enabled: bool = Field(default=False)
    
    def get_full_name(self) -> str:
        """Get inspector's full name"""
        return f"{self.first_name} {self.last_name}"


class InspectorCertificationRecord(SQLModel, table=True):
    """Model for inspector certification records"""
    __tablename__ = "inspector_certifications"  # type: ignore
    __table_args__ = (UniqueConstraint("inspector_id", "certification_number", name="unique_inspector_cert_number"),)
    
    id: Optional[int] = Field(default=None, primary_key=True)
    inspector_id: int = Field(foreign_key="inspectors.id")
    
    certification_type: InspectorCertification
    certification_number: str
    level: CertificationLevel
    issue_date: Optional[date] = None  # Made nullable
    expiry_date: Optional[date] = None  # Made nullable
    issuing_authority: str
    
    # Certificate details
    document_path: Optional[str] = None  # Path to stored certificate document
    certification_details: dict = Field(default={}, sa_column=Column(JSON))
    
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    
    inspector: "Inspector" = Relationship(back_populates="certifications")


# Import at the end to avoid circular imports
# Using TYPE_CHECKING above instead for better type safety
