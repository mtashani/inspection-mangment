from datetime import datetime
from typing import Optional, List
from sqlmodel import SQLModel, Field, Relationship

class CorrosionLocation(SQLModel, table=True):
    """Model for corrosion monitoring locations"""
    __tablename__ = "corrosion_locations"
    
    location_id: str = Field(primary_key=True)
    name: str
    area: str
    system: str
    equipment: Optional[str] = None
    pipeline_id: Optional[str] = None
    material: str
    fluid_type: str
    installation_date: datetime
    notes: Optional[str] = None
    active: bool = Field(default=True)
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    indoor: bool = Field(default=True)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    
    # Relationships
    coupons: List["CorrosionCoupon"] = Relationship(back_populates="location")

# Import at the end to avoid circular imports
from app.domains.corrosion.models.coupon import CorrosionCoupon