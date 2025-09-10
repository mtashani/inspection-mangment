from datetime import datetime
from typing import Optional
from sqlmodel import SQLModel, Field
from sqlalchemy import Column, JSON

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