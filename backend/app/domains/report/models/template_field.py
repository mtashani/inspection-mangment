"""TemplateField model for report template fields"""

from typing import Optional, List
from sqlmodel import SQLModel, Field, Relationship
from .enums import FieldType, ValueSource


class TemplateField(SQLModel, table=True):
    """Model for report template fields"""
    __tablename__ = "report_template_fields"
    
    id: Optional[int] = Field(default=None, primary_key=True)
    subsection_id: int = Field(foreign_key="report_template_subsections.id")
    label: str = Field(max_length=255)
    field_type: FieldType
    value_source: ValueSource
    order: int
    
    # Canvas positioning
    row: int = Field(default=0)
    col: int = Field(default=0)
    rowspan: int = Field(default=1)
    colspan: int = Field(default=1)
    
    # Field configuration
    options: Optional[str] = None  # JSON string for select options
    is_required: bool = Field(default=False)
    placeholder: Optional[str] = None
    auto_source_key: Optional[str] = None  # For auto-filled fields
    purpose: Optional[str] = None  # For RBI analysis
    
    # Relationships
    subsection: "TemplateSubSection" = Relationship(back_populates="fields")
    field_values: List["ReportFieldValue"] = Relationship(back_populates="template_field")