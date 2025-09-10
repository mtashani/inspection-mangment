"""TemplateSubSection model for report template subsections"""

from typing import Optional, List
from sqlmodel import SQLModel, Field, Relationship


class TemplateSubSection(SQLModel, table=True):
    """Model for report template subsections"""
    __tablename__ = "report_template_subsections"
    
    id: Optional[int] = Field(default=None, primary_key=True)
    section_id: int = Field(foreign_key="report_template_sections.id")
    title: Optional[str] = None
    order: int
    
    # Relationships
    section: "TemplateSection" = Relationship(back_populates="subsections")
    fields: List["TemplateField"] = Relationship(back_populates="subsection")