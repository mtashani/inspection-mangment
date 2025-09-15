from datetime import datetime
from typing import Optional, List
from sqlmodel import SQLModel, Field, Relationship
from sqlalchemy import Column, JSON

class CorrosionType(str):
    """Corrosion types"""
    GENERAL = "general"
    PITTING = "pitting"
    EROSION = "erosion"
    GALVANIC = "galvanic"
    MIC = "mic"  # Microbiologically Influenced Corrosion
    SCC = "scc"  # Stress Corrosion Cracking
    OTHER = "other"

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
    corrosion_type: str
    pitting_density: Optional[float] = None  # pits per unit area
    max_pit_depth: Optional[float] = None    # mm
    visual_inspection: str
    microscopic_analysis: Optional[str] = None
    cleaned_by_id: int = Field(foreign_key="inspectors.id")
    analyzed_by_id: int = Field(foreign_key="inspectors.id")
    approved_by_id: int = Field(foreign_key="inspectors.id")
    images: List[str] = Field(sa_column=Column(JSON))
    recommendations: str
    calculated_severity: int = Field(ge=1, le=5)
    manual_override_severity: Optional[int] = Field(default=None, ge=1, le=5)
    calculation_factors: dict = Field(sa_column=Column(JSON))
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    
    coupon: "CorrosionCoupon" = Relationship(back_populates="analysis_reports")
    cleaned_by: "Inspector" = Relationship(sa_relationship_kwargs={"foreign_keys": "[CorrosionAnalysisReport.cleaned_by_id]"})
    analyzed_by: "Inspector" = Relationship(sa_relationship_kwargs={"foreign_keys": "[CorrosionAnalysisReport.analyzed_by_id]"})
    approved_by: "Inspector" = Relationship(sa_relationship_kwargs={"foreign_keys": "[CorrosionAnalysisReport.approved_by_id]"})

# Import at the end to avoid circular imports
from app.domains.corrosion.models.coupon import CorrosionCoupon
from app.domains.inspector.models.inspector import Inspector