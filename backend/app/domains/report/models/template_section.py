"""TemplateSection model for report template sections"""

from typing import Optional, List
from sqlmodel import SQLModel, Field, Relationship
from .enums import SectionType


class TemplateSection(SQLModel, table=True):
    """Model for report template sections"""
    __tablename__ = "report_template_sections"
    
    id: Optional[int] = Field(default=None, primary_key=True)
    template_id: int = Field(foreign_key="report_templates.id")
    title: str = Field(max_length=255)
    section_type: SectionType
    order: int
    
    # Relationships
    template: "Template" = Relationship(back_populates="sections")
    subsections: List["TemplateSubSection"] = Relationship(back_populates="section")