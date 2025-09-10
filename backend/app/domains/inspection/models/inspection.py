from datetime import datetime, date
from typing import Optional, List, TYPE_CHECKING
from sqlmodel import SQLModel, Field, Relationship
from sqlalchemy import Column, JSON
from app.domains.inspection.models.enums import (
    InspectionStatus, 
    RefineryDepartment
)

if TYPE_CHECKING:
    from app.domains.equipment.models.equipment import Equipment
    from app.domains.maintenance.models.event import MaintenanceEvent, MaintenanceSubEvent
    from app.domains.daily_report.models.report import DailyReport
    from app.domains.report.models.final_report import FinalReport
    from app.domains.inspection.models.inspection_team import InspectionTeam

class Inspection(SQLModel, table=True):
    """Unified model for inspection information - handles both planned and unplanned inspections"""
    __tablename__ = "inspections"
    
    id: Optional[int] = Field(default=None, primary_key=True)
    inspection_number: str = Field(unique=True, index=True)
    title: str
    description: Optional[str] = None
    
    # Planned dates (for planned inspections only)
    planned_start_date: Optional[date] = None  # When planned inspection should start
    planned_end_date: Optional[date] = None    # When planned inspection should end
    
    # Actual execution dates (filled when inspection actually starts/ends)
    actual_start_date: Optional[date] = None  # When inspection actually started
    actual_end_date: Optional[date] = None    # When inspection actually completed
    
    status: InspectionStatus = Field(default=InspectionStatus.Planned)
    
    # Associations
    equipment_id: int = Field(foreign_key="equipment.id")
    maintenance_event_id: Optional[int] = Field(default=None, foreign_key="maintenance_events.id")
    maintenance_sub_event_id: Optional[int] = Field(default=None, foreign_key="maintenance_sub_events.id")
    requesting_department: RefineryDepartment
    
    # Unified model fields - distinguish between planned and unplanned inspections
    is_planned: bool = Field(default=False)  # True = planned inspection, False = unplanned
    unplanned_reason: Optional[str] = None   # Required for unplanned inspections
    
    # Administrative
    work_order: Optional[str] = None
    permit_number: Optional[str] = None
    final_report: Optional[str] = None
    
    # Timestamps
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    
    # Relationships
    equipment: "Equipment" = Relationship(back_populates="inspections")
    maintenance_event: Optional["MaintenanceEvent"] = Relationship(back_populates="inspections")
    maintenance_sub_event: Optional["MaintenanceSubEvent"] = Relationship(back_populates="inspections")
    daily_reports: List["DailyReport"] = Relationship(back_populates="inspection")
    final_reports: List["FinalReport"] = Relationship(back_populates="inspection")
    team_members: List["InspectionTeam"] = Relationship(back_populates="inspection")

