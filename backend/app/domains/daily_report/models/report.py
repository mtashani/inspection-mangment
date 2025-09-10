from datetime import datetime, date
from typing import Optional, List
from sqlmodel import SQLModel, Field, Relationship
from sqlalchemy import Column, JSON

class DailyReport(SQLModel, table=True):
    """Model for daily inspection report"""
    __tablename__ = "daily_reports"
    
    id: Optional[int] = Field(default=None, primary_key=True)
    inspection_id: int = Field(foreign_key="inspections.id")
    report_date: date
    description: str
    
    # Inspectors involved - both approaches for flexibility
    inspector_ids: List[int] = Field(default=[], sa_column=Column(JSON))  # For precise queries
    inspector_names: Optional[str] = None  # For display and simple text search
    
    # Professional report sections
    findings: Optional[str] = None  # Detailed findings from the inspection
    recommendations: Optional[str] = None  # Recommendations based on findings
    safety_notes: Optional[str] = None  # Safety observations and notes
    
    # Timestamps
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    
    # Relationships
    inspection: "Inspection" = Relationship(back_populates="daily_reports")

