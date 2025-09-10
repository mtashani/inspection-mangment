from datetime import datetime
from typing import Optional, List
from sqlmodel import SQLModel, Field, Relationship

class CouponStatus(str):
    """Coupon status types"""
    INSTALLED = "installed"
    ACTIVE = "active"
    REMOVED = "removed"
    ANALYZED = "analyzed"
    ARCHIVED = "archived"

class CouponType(str):
    """Coupon types"""
    STRIP = "strip"
    DISK = "disk"
    WIRE_LOOP = "wire_loop"
    CYLINDRICAL = "cylindrical"
    ELECTRICAL = "electrical"
    OTHER = "other"

class CouponOrientation(str):
    """Coupon orientation types"""
    VERTICAL = "vertical"
    HORIZONTAL = "horizontal"
    ANGLED = "angled"
    FLUSH = "flush"
    OTHER = "other"

class MonitoringLevel(str):
    """Monitoring level types"""
    BASIC = "basic"
    STANDARD = "standard"
    ADVANCED = "advanced"
    CRITICAL = "critical"

class CorrosionCoupon(SQLModel, table=True):
    """Corrosion coupon tracking model"""
    __tablename__ = "corrosion_coupons"
    
    coupon_id: str = Field(primary_key=True)
    location_id: str = Field(foreign_key="corrosion_locations.location_id")
    coupon_type: str
    material_type: str
    surface_area: float  # cm²
    initial_weight: float  # grams
    dimensions: str
    installation_date: datetime
    scheduled_removal_date: datetime
    actual_removal_date: Optional[datetime] = None
    orientation: str
    system_type: str
    fluid_velocity: Optional[float] = None  # m/s if applicable
    temperature: float  # °C
    pressure: float  # Bar
    notes: Optional[str] = None
    status: str
    monitoring_level: str
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    
    location: "CorrosionLocation" = Relationship(back_populates="coupons")
    analysis_reports: List["CorrosionAnalysisReport"] = Relationship(back_populates="coupon")

# Import at the end to avoid circular imports
from app.domains.corrosion.models.location import CorrosionLocation
from app.domains.corrosion.models.analysis import CorrosionAnalysisReport