from datetime import datetime, date
from typing import Optional, List
from sqlmodel import SQLModel, Field, Relationship
from app.domains.crane.models.enums import CraneType, CraneStatus, RiskLevel

class Crane(SQLModel, table=True):
    """Model for crane equipment information"""
    __tablename__ = "cranes"
    
    id: Optional[int] = Field(default=None, primary_key=True)
    tag_number: str = Field(unique=True, index=True)
    crane_type: CraneType
    manufacturer: str
    model: str
    serial_number: str = Field(unique=True)
    location: str = Field(index=True)
    installation_date: date
    nominal_capacity: float  # Maximum designed lifting capacity
    current_allowed_capacity: float  # Currently allowed capacity after inspection
    status: CraneStatus = Field(default=CraneStatus.Active)
    last_inspection_date: Optional[datetime] = None
    next_inspection_date: Optional[datetime] = None
    risk_level: RiskLevel = Field(default=RiskLevel.Medium)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    
    inspections: List["CraneInspection"] = Relationship(back_populates="crane")

class CraneInspection(SQLModel, table=True):
    """Model for crane inspection records"""
    __tablename__ = "crane_inspections"
    
    id: Optional[int] = Field(default=None, primary_key=True)
    crane_id: int = Field(foreign_key="cranes.id")
    inspection_date: datetime
    next_inspection_date: datetime
    performed_by: str
    status: str  # Pass/Fail/Conditional
    findings: str
    recommendations: str
    certificate_image_path: Optional[str] = None  # Path to the stored certificate image
    allowed_capacity: float  # Capacity allowed after inspection
    report_file_path: Optional[str] = None  # Path to the detailed report file
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    
    crane: Crane = Relationship(back_populates="inspections")

class CraneInspectionSettings(SQLModel, table=True):
    """Configuration for inspection intervals by crane type"""
    __tablename__ = "crane_inspection_settings"
    
    id: Optional[int] = Field(default=None, primary_key=True)
    crane_type: CraneType = Field(unique=True, index=True)
    inspection_interval_months: int  # Number of months between inspections
    active: bool = Field(default=True)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)