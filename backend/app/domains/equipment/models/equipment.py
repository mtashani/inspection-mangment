from datetime import datetime, date
from typing import Optional, List
from sqlmodel import SQLModel, Field, Relationship
from sqlalchemy import Column, JSON

class Equipment(SQLModel, table=True):
    """Model for equipment information"""
    __tablename__ = "equipment"
    
    id: Optional[int] = Field(default=None, primary_key=True)
    tag: str = Field(unique=True, index=True)  # Primary equipment identifier (replaces equipment_code)
    description: Optional[str] = None
    unit: str
    train: Optional[str] = None
    equipment_type: str
    
    # Installation and specifications
    installation_date: Optional[date] = None
    operating_pressure: Optional[float] = None    # Typically in bar
    operating_temperature: Optional[float] = None # Typically in °C
    material: Optional[str] = None
    
    # Maintenance scheduling
    inspection_interval_months: Optional[int] = None
    
    # Documentation and references
    p_and_id: Optional[str] = None  # P&ID reference
    data_sheet_path: Optional[str] = None
    
    # Additional properties for flexibility
    properties: dict = Field(default={}, sa_column=Column(JSON))
    
    # Timestamps
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    
    # Relationships
    inspections: List["Inspection"] = Relationship(back_populates="equipment")

