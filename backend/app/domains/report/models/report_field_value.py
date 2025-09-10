"""ReportFieldValue model for storing field values in completed reports"""

from datetime import date
from typing import Optional
from sqlmodel import SQLModel, Field, Relationship


class ReportFieldValue(SQLModel, table=True):
    """Model for storing actual field values in submitted reports"""
    __tablename__ = "report_field_values"
    
    id: Optional[int] = Field(default=None, primary_key=True)
    final_report_id: int = Field(foreign_key="final_reports.id")
    template_field_id: int = Field(foreign_key="report_template_fields.id")
    
    # Value storage using appropriate field based on data type
    text_value: Optional[str] = None
    number_value: Optional[float] = None
    date_value: Optional[date] = None
    boolean_value: Optional[bool] = None
    json_value: Optional[str] = None  # For complex data types and arrays
    
    # Relationships
    final_report: "FinalReport" = Relationship(back_populates="field_values")
    template_field: "TemplateField" = Relationship(back_populates="field_values")