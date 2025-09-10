from datetime import datetime
from typing import Optional, List, TYPE_CHECKING
from sqlmodel import SQLModel, Field, Relationship
from app.domains.psv.models.enums import PSVStatus

if TYPE_CHECKING:
    from app.domains.psv.models.calibration import Calibration

class PSV(SQLModel, table=True):
    """Pressure Safety Valve model"""
    __tablename__ = "psv"
    
    tag_number: str = Field(primary_key=True, index=True)
    description: Optional[str] = None
    location: Optional[str] = None
    service: Optional[str] = None
    manufacturer: Optional[str] = None
    model_number: Optional[str] = None
    serial_number: Optional[str] = None
    
    # Technical specifications
    set_pressure: Optional[float] = None  # psig
    orifice_size: Optional[str] = None
    inlet_size: Optional[str] = None
    outlet_size: Optional[str] = None
    
    # Status
    in_service: bool = Field(default=True)
    status: PSVStatus = Field(default=PSVStatus.Main)
    
    # Calibration tracking
    last_calibration_date: Optional[datetime] = None
    expire_date: Optional[datetime] = None
    
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    
    # Relationships
    calibrations: List["Calibration"] = Relationship(back_populates="psv")
