from datetime import datetime
from typing import Optional, List
from sqlmodel import SQLModel, Field, Relationship
from sqlalchemy import Column, JSON
from enum import Enum


class CouponStatus(str, Enum):
    Installed = "Installed"
    Removed = "Removed"
    Analyzed = "Analyzed"


class CouponType(str, Enum):
    Strip = "Strip"
    Rod = "Rod"
    Disc = "Disc"
    Cylinder = "Cylinder"
    Spiral = "Spiral"
    Electrical = "Electrical"
    Custom = "Custom"


class CouponOrientation(str, Enum):
    Flush = "Flush"
    Parallel = "Parallel"
    Perpendicular = "Perpendicular"


class CorrosionType(str, Enum):
    Uniform = "Uniform"
    Pitting = "Pitting"
    Crevice = "Crevice"
    Galvanic = "Galvanic"
    MIC = "MIC"
    Erosion = "Erosion"
    Other = "Other"


class SystemRiskCategory(str, Enum):
    High = "high_risk"
    Medium = "medium_risk"
    Low = "low_risk"


class MonitoringLevel(int, Enum):
    Basic = 1
    Advanced = 2


class CorrosionLocation(SQLModel, table=True):
    """Locations where corrosion coupons are installed"""
    __tablename__ = "corrosion_locations"
    
    id: Optional[int] = Field(default=None, primary_key=True)
    location_id: str = Field(unique=True, index=True)
    name: str
    description: Optional[str]
    system: str
    unit: str
    line_number: Optional[str]
    p_and_id: Optional[str]
    system_risk_category: SystemRiskCategory
    fluid_type: str
    operating_temperature: float  # °C
    operating_pressure: float     # Bar
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    
    coupons: List["CorrosionCoupon"] = Relationship(back_populates="location")


class CorrosionCoupon(SQLModel, table=True):
    """Corrosion coupon tracking model"""
    __tablename__ = "corrosion_coupons"
    
    coupon_id: str = Field(primary_key=True)
    location_id: str = Field(foreign_key="corrosion_locations.location_id")
    coupon_type: CouponType
    material_type: str
    surface_area: float  # cm²
    initial_weight: float  # grams
    dimensions: str
    installation_date: datetime
    scheduled_removal_date: datetime
    actual_removal_date: Optional[datetime] = None
    orientation: CouponOrientation
    system_type: str
    fluid_velocity: Optional[float] = None  # m/s if applicable
    temperature: float  # °C
    pressure: float  # Bar
    notes: Optional[str] = None
    status: CouponStatus
    monitoring_level: MonitoringLevel
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    
    location: CorrosionLocation = Relationship(back_populates="coupons")
    analysis_reports: List["CorrosionAnalysisReport"] = Relationship(back_populates="coupon")


class CorrosionAnalysisReport(SQLModel, table=True):
    """Analysis results for removed coupons"""
    __tablename__ = "corrosion_analysis_reports"
    
    report_id: Optional[int] = Field(default=None, primary_key=True)
    coupon_id: str = Field(foreign_key="corrosion_coupons.coupon_id")
    analysis_date: datetime
    final_weight: float  # grams
    weight_loss: float   # grams
    exposure_days: int
    corrosion_rate: float  # mm/year
    corrosion_type: CorrosionType
    pitting_density: Optional[float] = None  # pits per unit area
    max_pit_depth: Optional[float] = None    # mm
    visual_inspection: str
    microscopic_analysis: Optional[str] = None
    cleaned_by: str
    analyzed_by: str
    approved_by: str
    images: List[str] = Field(sa_column=Column(JSON))
    recommendations: str
    calculated_severity: int = Field(ge=1, le=5)
    manual_override_severity: Optional[int] = Field(default=None, ge=1, le=5)
    calculation_factors: dict = Field(sa_column=Column(JSON))
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    
    coupon: CorrosionCoupon = Relationship(back_populates="analysis_reports")


class CorrosionMonitoringSettings(SQLModel, table=True):
    """Global settings for corrosion monitoring"""
    __tablename__ = "corrosion_monitoring_settings"
    
    id: Optional[int] = Field(default=None, primary_key=True)
    rbi_level: int = Field(ge=1, le=4)
    inspection_frequency: dict = Field(sa_column=Column(JSON))  # Days between inspections by risk category
    severity_thresholds: dict = Field(sa_column=Column(JSON))   # Thresholds for severity calculation
    material_factors: dict = Field(sa_column=Column(JSON))      # Material-specific correction factors
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)