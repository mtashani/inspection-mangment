from datetime import datetime, date
from typing import Optional, List
from sqlmodel import SQLModel, Field, Relationship
from enum import Enum

class RiskLevel(str, Enum):
    HIGH = "high"
    MEDIUM = "medium"
    LOW = "low"

class InspectorType(str, Enum):
    MECHANICAL = "mechanical"
    CORROSION = "corrosion"
    NDT = "ndt"

class InspectionStatus(str, Enum):
    IN_PROGRESS = "IN_PROGRESS"
    COMPLETED = "COMPLETED"

class Equipment(SQLModel, table=True):
    __tablename__ = "equipment"
    
    id: Optional[int] = Field(default=None, primary_key=True)
    equipment_code: str = Field(unique=True, index=True)
    location: str = Field(index=True)
    type: str
    installation_date: date
    operating_pressure: float
    operating_temperature: float
    material: str
    degradation_mechanism: str
    initial_thickness: float
    min_thickness: float
    safety_factor: float = Field(default=0.2)
    max_inspection_interval: int  # in years
    risk_level: str  # Using str type for enums
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    
    inspections: List["Inspection"] = Relationship(back_populates="equipment")

class Inspector(SQLModel, table=True):
    __tablename__ = "inspector"
    
    id: Optional[int] = Field(default=None, primary_key=True)
    name: str
    inspector_type: str  # Using str type for enums
    created_at: datetime = Field(default_factory=datetime.utcnow)
    
    daily_reports: List["DailyReportInspector"] = Relationship(back_populates="inspector")

class Inspection(SQLModel, table=True):
    __tablename__ = "inspection"
    
    id: Optional[int] = Field(default=None, primary_key=True)
    equipment_id: int = Field(foreign_key="equipment.id")
    start_date: datetime
    end_date: Optional[datetime] = None
    status: str = Field(default=InspectionStatus.IN_PROGRESS)  # Default to IN_PROGRESS
    final_description: Optional[str] = None
    measured_thickness: Optional[float] = None
    report_file_path: Optional[str] = None
    
    equipment: Equipment = Relationship(back_populates="inspections")
    daily_reports: List["DailyReport"] = Relationship(back_populates="inspection")

class DailyReport(SQLModel, table=True):
    __tablename__ = "dailyreport"
    
    id: Optional[int] = Field(default=None, primary_key=True)
    inspection_id: int = Field(foreign_key="inspection.id")
    report_date: datetime = Field(default_factory=datetime.utcnow)
    description: str
    
    inspection: Inspection = Relationship(back_populates="daily_reports")
    inspectors: List["DailyReportInspector"] = Relationship(back_populates="daily_report")

class DailyReportInspector(SQLModel, table=True):
    __tablename__ = "dailyreportinspector"
    
    daily_report_id: int = Field(foreign_key="dailyreport.id", primary_key=True)
    inspector_id: int = Field(foreign_key="inspector.id", primary_key=True)
    
    daily_report: DailyReport = Relationship(back_populates="inspectors")
    inspector: Inspector = Relationship(back_populates="daily_reports")