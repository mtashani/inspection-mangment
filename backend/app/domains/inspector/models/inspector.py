from datetime import datetime, date
from typing import Optional, List
from sqlmodel import SQLModel, Field, Relationship
from sqlalchemy import Column, JSON, String
from app.domains.inspector.models.enums import InspectorType, InspectorCertification, CertificationLevel

class Inspector(SQLModel, table=True):
    """Model for inspector information"""
    __tablename__ = "inspectors"  # type: ignore
    
    id: Optional[int] = Field(default=None, primary_key=True)
    # Basic Information
    first_name: str = Field(sa_column=Column(String, index=True))
    last_name: str = Field(sa_column=Column(String, index=True))
    employee_id: str = Field(sa_column=Column(String, unique=True, index=True))
    national_id: str = Field(sa_column=Column(String, unique=True))
    inspector_type: InspectorType
    email: str
    phone: Optional[str] = None
    department: Optional[str] = None
    
    # Educational Information
    education_degree: Optional[str] = None
    education_field: Optional[str] = None
    education_institute: Optional[str] = None
    graduation_year: Optional[int] = None
    
    # Experience and qualifications
    years_experience: int
    specialties: List[str] = Field(default=[], sa_column=Column(JSON))
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
    
    # Relationships
    certifications: List["InspectorCertificationRecord"] = Relationship(back_populates="inspector")
    roles: List["InspectorRole"] = Relationship(back_populates="inspector")
    documents: List["InspectorDocument"] = Relationship(back_populates="inspector")
    
    # PSV Calibration relationships
    psv_calibrations: List["Calibration"] = Relationship(back_populates="inspector", sa_relationship_kwargs={"primaryjoin": "Inspector.id == Calibration.inspector_id"})
    operated_calibrations: List["Calibration"] = Relationship(back_populates="test_operator", sa_relationship_kwargs={"primaryjoin": "Inspector.id == Calibration.test_operator_id"})
    approved_calibrations: List["Calibration"] = Relationship(back_populates="approved_by", sa_relationship_kwargs={"primaryjoin": "Inspector.id == Calibration.approved_by_id"})
    
    # Corrosion Analysis relationships
    cleaned_coupon_analyses: List["CorrosionAnalysisReport"] = Relationship(back_populates="cleaned_by", sa_relationship_kwargs={"primaryjoin": "Inspector.id == CorrosionAnalysisReport.cleaned_by_id"})
    analyzed_coupon_analyses: List["CorrosionAnalysisReport"] = Relationship(back_populates="analyzed_by", sa_relationship_kwargs={"primaryjoin": "Inspector.id == CorrosionAnalysisReport.analyzed_by_id"})
    approved_coupon_analyses: List["CorrosionAnalysisReport"] = Relationship(back_populates="approved_by", sa_relationship_kwargs={"primaryjoin": "Inspector.id == CorrosionAnalysisReport.approved_by_id"})
    
    # Specialty relationships
    specialty_records: List["InspectorSpecialty"] = Relationship(
        back_populates="inspector",
        sa_relationship_kwargs={"foreign_keys": "[InspectorSpecialty.inspector_id]"}
    )
    
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
    
    # Helper methods
    def has_specialty(self, specialty_code: str) -> bool:
        """Check if inspector has a specific specialty"""
        return any(
            spec.specialty_code == specialty_code and spec.granted
            for spec in self.specialty_records
        )
    
    def get_specialties(self) -> List[str]:
        """Get list of granted specialty codes"""
        return [
            spec.specialty_code
            for spec in self.specialty_records
            if spec.granted
        ]

    def get_full_name(self) -> str:
        """Get inspector's full name"""
        return f"{self.first_name} {self.last_name}"


class InspectorCertificationRecord(SQLModel, table=True):
    """Model for inspector certification records"""
    __tablename__ = "inspector_certifications"  # type: ignore
    
    id: Optional[int] = Field(default=None, primary_key=True)
    inspector_id: int = Field(foreign_key="inspectors.id")
    
    certification_type: InspectorCertification
    certification_number: str
    level: CertificationLevel
    issue_date: date
    expiry_date: date
    issuing_authority: str
    
    # Certificate details
    document_path: Optional[str] = None  # Path to stored certificate document
    certification_details: dict = Field(default={}, sa_column=Column(JSON))
    
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    
    inspector: "Inspector" = Relationship(back_populates="certifications")


# Import at the end to avoid circular imports
from app.domains.inspector.models.authorization import InspectorRole
from app.domains.inspector.models.documents import InspectorDocument
from app.domains.psv.models.calibration import Calibration
from app.domains.corrosion.models.analysis import CorrosionAnalysisReport
from app.domains.inspector.models.specialty import InspectorSpecialty
from app.domains.notifications.models.notification import Notification, NotificationPreference
from app.domains.inspection.models.inspection_team import InspectionTeam