"""Template model for report templates"""

from datetime import datetime
from typing import Optional, List
from sqlmodel import SQLModel, Field, Relationship


class Template(SQLModel, table=True):
    """Model for report templates"""
    __tablename__ = "report_templates"
    
    id: Optional[int] = Field(default=None, primary_key=True)
    name: str = Field(index=True, unique=True)
    description: Optional[str] = None
    is_active: bool = Field(default=True)
    
    # Timestamps
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    
    # Relationships
    sections: List["TemplateSection"] = Relationship(back_populates="template")
    final_reports: List["FinalReport"] = Relationship(back_populates="template")