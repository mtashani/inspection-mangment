from datetime import datetime
from typing import Optional, TYPE_CHECKING
from sqlmodel import SQLModel, Field, Relationship

if TYPE_CHECKING:
    from app.domains.psv.models.psv import PSV
    from app.domains.inspector.models.inspector import Inspector

class WorkMaintenance(str):
    """Work maintenance types"""
    CALIBRATION = "calibration"
    REPAIR = "repair"
    REPLACEMENT = "replacement"
    INSPECTION = "inspection"

class TestMedium(str):
    """Test medium types"""
    AIR = "air"
    WATER = "water"
    NITROGEN = "nitrogen"
    STEAM = "steam"
    OTHER = "other"

class Calibration(SQLModel, table=True):
    __tablename__ = "calibration"
    
    id: Optional[int] = Field(default=None, primary_key=True)
    tag_number: str = Field(foreign_key="psv.tag_number")
    calibration_date: datetime
    work_maintenance: str
    change_parts: Optional[str]
    test_medium: str
    inspector_id: int = Field(foreign_key="inspectors.id")
    test_operator_id: Optional[int] = Field(default=None, foreign_key="inspectors.id")
    general_condition: Optional[str]
    approved_by_id: int = Field(foreign_key="inspectors.id")
    work_no: str
    
    # Level 2+ RBI fields - make post-repair fields optional to accommodate vacuum PSVs
    pre_repair_pop_test: Optional[float] = None
    pre_repair_leak_test: Optional[float] = None
    post_repair_pop_test: Optional[float] = None
    post_repair_leak_test: Optional[float] = None
    
    # Add vacuum PSV specific calibration fields
    negative_pressure_test: Optional[float] = None  # For vacuum PSVs
    positive_pressure_test: Optional[float] = None  # For vacuum PSVs
    
    # Level 3 Assessment Fields (1-5 scale)
    body_condition_score: Optional[int] = Field(ge=1, le=5)
    body_condition_notes: Optional[str]
    internal_parts_score: Optional[int] = Field(ge=1, le=5)
    internal_parts_notes: Optional[str]
    seat_plug_condition_score: Optional[int] = Field(ge=1, le=5)
    seat_plug_notes: Optional[str]
    
    # New fields for improved RBI Level 4
    repairs_required: Optional[bool] = False
    repair_time: Optional[float] = None  # Hours
    
    created_at: datetime = Field(default_factory=datetime.utcnow)
    
    # Relationships
    psv: "PSV" = Relationship(back_populates="calibrations")
    inspector: "Inspector" = Relationship(sa_relationship_kwargs={"foreign_keys": "[Calibration.inspector_id]"})
    test_operator: Optional["Inspector"] = Relationship(sa_relationship_kwargs={"foreign_keys": "[Calibration.test_operator_id]"})
    approved_by: "Inspector" = Relationship(sa_relationship_kwargs={"foreign_keys": "[Calibration.approved_by_id]"})
