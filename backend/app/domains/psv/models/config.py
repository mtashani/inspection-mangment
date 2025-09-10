from datetime import datetime
from typing import Optional
from sqlmodel import SQLModel, Field
from sqlalchemy import Column, JSON
from app.domains.psv.models.enums import EnvironmentType

class RBIConfiguration(SQLModel, table=True):
    __tablename__ = "rbi_configuration"
    
    id: Optional[int] = Field(default=None, primary_key=True)
    level: int = Field(ge=1, le=4)
    name: str
    description: Optional[str]
    active: bool = Field(default=True)
    settings: dict = Field(sa_column=Column(JSON))
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

class ServiceRiskCategory(SQLModel, table=True):
    __tablename__ = "service_risk_category"
    
    id: Optional[int] = Field(default=None, primary_key=True)
    service_type: str = Field(unique=True, index=True)
    cof_score: int = Field(ge=1, le=5)  # Consequence of Failure score per API 581
    description: Optional[str]
    notes: Optional[str]
    environment_type: Optional[EnvironmentType] = Field(default=EnvironmentType.Normal)
    fluid_type: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
