from datetime import datetime, date
from typing import Optional, List, TYPE_CHECKING
from sqlmodel import SQLModel, Field, Relationship
from app.domains.maintenance.models.enums import (
    MaintenanceEventType, 
    MaintenanceEventStatus,
    OverhaulSubType,
    MaintenanceEventCategory
)

if TYPE_CHECKING:
    from app.domains.inspection.models.inspection import Inspection

class MaintenanceEvent(SQLModel, table=True):
    """Model for maintenance events"""
    __tablename__ = "maintenance_events"
    
    id: Optional[int] = Field(default=None, primary_key=True)
    event_number: str = Field(unique=True, index=True)
    title: str
    description: Optional[str] = None
    event_type: MaintenanceEventType
    event_category: MaintenanceEventCategory = Field(default=MaintenanceEventCategory.Simple)
    status: MaintenanceEventStatus = Field(default=MaintenanceEventStatus.Planned)
    
    # Timeline
    planned_start_date: date
    planned_end_date: date
    actual_start_date: Optional[date] = None
    actual_end_date: Optional[date] = None
    
    # Administrative
    created_by: Optional[str] = None
    approved_by: Optional[str] = None
    approval_date: Optional[datetime] = None
    
    # Notes and documentation
    notes: Optional[str] = None
    
    # Timestamps
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    
    # Relationships
    sub_events: List["MaintenanceSubEvent"] = Relationship(back_populates="parent_event")
    inspections: List["Inspection"] = Relationship(back_populates="maintenance_event")

class MaintenanceSubEvent(SQLModel, table=True):
    """Model for maintenance sub-events (e.g., overhaul sub-types)"""
    __tablename__ = "maintenance_sub_events"
    
    id: Optional[int] = Field(default=None, primary_key=True)
    parent_event_id: int = Field(foreign_key="maintenance_events.id")
    
    sub_event_number: str = Field(unique=True, index=True)
    title: str
    description: Optional[str] = None
    sub_type: Optional[OverhaulSubType] = None  # Specific to overhaul events
    status: MaintenanceEventStatus = Field(default=MaintenanceEventStatus.Planned)
    
    # Timeline
    planned_start_date: date
    planned_end_date: date
    actual_start_date: Optional[date] = None
    actual_end_date: Optional[date] = None
    
    # Progress tracking
    completion_percentage: float = Field(default=0.0, ge=0.0, le=100.0)
    
    # Notes
    notes: Optional[str] = None
    
    # Timestamps
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    
    # Relationships
    parent_event: MaintenanceEvent = Relationship(back_populates="sub_events")
    inspections: List["Inspection"] = Relationship(back_populates="maintenance_sub_event")