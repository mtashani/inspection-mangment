"""FinalReport model for completed reports"""

from datetime import datetime
from typing import Optional, List
from sqlmodel import SQLModel, Field, Relationship
from .enums import ReportStatus


class FinalReport(SQLModel, table=True):
    """Model for completed reports"""
    __tablename__ = "final_reports"
    
    id: Optional[int] = Field(default=None, primary_key=True)
    inspection_id: int = Field(foreign_key="inspections.id")
    template_id: int = Field(foreign_key="report_templates.id")
    created_by: Optional[int] = Field(default=None)  # User ID - assuming user system exists
    
    # Report metadata
    report_serial_number: Optional[str] = None
    status: ReportStatus = Field(default=ReportStatus.DRAFT)
    
    # Timestamps
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    
    # Relationships
    inspection: "Inspection" = Relationship(back_populates="final_reports")
    template: "Template" = Relationship(back_populates="final_reports")
    field_values: List["ReportFieldValue"] = Relationship(back_populates="final_report")