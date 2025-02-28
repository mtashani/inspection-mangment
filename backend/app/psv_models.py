from datetime import datetime
from typing import Optional, List
from sqlmodel import SQLModel, Field, Relationship
from sqlalchemy import Column, JSON
from enum import Enum

class PSVStatus(str, Enum):
    Main = "Main"
    Spare = "Spare"

class TestMedium(str, Enum):
    Nitrogen = "Nitrogen"
    Air = "Air"
    Steam = "Steam"
    Water = "Water"

class WorkMaintenance(str, Enum):
    Adjust = "Adjust"
    Cleaning = "Cleaning"
    Lapping = "Lapping"

class PSV(SQLModel, table=True):
    __tablename__ = "psv"
    
    tag_number: str = Field(primary_key=True)
    unique_no: str = Field(unique=True, index=True)
    status: PSVStatus
    frequency: int  # months
    last_calibration_date: datetime
    expire_date: datetime
    unit: str
    train: str
    type: str
    serial_no: str
    set_pressure: float  # Barg
    cdtp: float  # Barg
    back_pressure: float  # Barg
    nps: str
    inlet_size: str
    inlet_rating: str
    outlet_size: str
    outlet_rating: str
    p_and_id: str
    line_number: str
    service: str
    data_sheet_no: str
    manufacturer: str
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    
    calibrations: List["Calibration"] = Relationship(back_populates="psv")

class Calibration(SQLModel, table=True):
    __tablename__ = "calibration"
    
    id: Optional[int] = Field(default=None, primary_key=True)
    tag_number: str = Field(foreign_key="psv.tag_number")
    calibration_date: datetime
    work_maintenance: WorkMaintenance
    change_parts: Optional[str]
    test_medium: TestMedium
    inspector: str
    test_operator: str
    general_condition: Optional[str]
    approved_by: str
    work_no: str
    
    # Level 2+ RBI fields
    pre_repair_pop_test: Optional[float]
    pre_repair_leak_test: Optional[float]
    post_repair_pop_test: float
    post_repair_leak_test: float
    
    # Level 3 Assessment Fields (1-5 scale)
    body_condition_score: Optional[int] = Field(ge=1, le=5)
    body_condition_notes: Optional[str]
    internal_parts_score: Optional[int] = Field(ge=1, le=5)
    internal_parts_notes: Optional[str]
    seat_plug_condition_score: Optional[int] = Field(ge=1, le=5)
    seat_plug_notes: Optional[str]
    
    created_at: datetime = Field(default_factory=datetime.utcnow)
    psv: PSV = Relationship(back_populates="calibrations")

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
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)