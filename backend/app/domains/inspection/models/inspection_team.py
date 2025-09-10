from datetime import datetime
from typing import Optional, TYPE_CHECKING
from sqlmodel import SQLModel, Field, Relationship

if TYPE_CHECKING:
    from app.domains.inspection.models.inspection import Inspection
    from app.domains.inspector.models.inspector import Inspector

class InspectionTeam(SQLModel, table=True):
    """Model for tracking inspection team members and their workload"""
    __tablename__ = "inspection_team"
    
    id: Optional[int] = Field(default=None, primary_key=True)
    inspection_id: int = Field(foreign_key="inspections.id", index=True)
    inspector_id: int = Field(foreign_key="inspectors.id", index=True)
    role: str = Field(default="inspector")  # "lead_inspector", "inspector", "trainee"
    man_hours: float = Field(default=0.0)
    
    # Timestamps
    assigned_at: datetime = Field(default_factory=datetime.utcnow)
    
    # Relationships
    inspection: "Inspection" = Relationship(back_populates="team_members")
    inspector: "Inspector" = Relationship(back_populates="inspection_assignments")
    
    class Config:
        indexes = [
            {"fields": ["inspection_id", "inspector_id"], "unique": True},
            {"fields": ["inspector_id"], "unique": False}
        ]