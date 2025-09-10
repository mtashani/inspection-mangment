"""Status History tracking model for audit trail"""

from datetime import datetime
from typing import Optional
from sqlmodel import SQLModel, Field
from enum import Enum

class EntityType(str, Enum):
    """Enumeration for entity types that can have status history"""
    Inspection = "Inspection"
    MaintenanceEvent = "MaintenanceEvent"
    MaintenanceSubEvent = "MaintenanceSubEvent"
    DailyReport = "DailyReport"

class StatusHistory(SQLModel, table=True):
    """Model for tracking status changes across all entities"""
    __tablename__ = "status_history"
    
    id: Optional[int] = Field(default=None, primary_key=True)
    entity_type: EntityType
    entity_id: int
    from_status: Optional[str] = None  # Previous status (null for initial creation)
    to_status: str  # New status
    changed_by: str  # User who made the change
    changed_at: datetime = Field(default_factory=datetime.utcnow)
    note: Optional[str] = None  # Optional note about the change
    
    # Additional context
    ip_address: Optional[str] = None
    user_agent: Optional[str] = None
    
    class Config:
        arbitrary_types_allowed = True

    def __str__(self):
        return f"{self.entity_type}({self.entity_id}): {self.from_status} → {self.to_status}"