"""
Inspector Specialty Models
سیستم تخصص‌های بازرسین - مدل‌های دیتابیس
"""

from datetime import datetime
from typing import Optional
from sqlmodel import SQLModel, Field, Relationship

class InspectorSpecialty(SQLModel, table=True):
    """Model for inspector specialties"""
    __tablename__ = "inspector_specialties"
    
    id: Optional[int] = Field(default=None, primary_key=True)
    inspector_id: int = Field(foreign_key="inspectors.id")
    specialty_code: str = Field(max_length=20)  # PSV, CRANE, CORROSION
    granted: bool = Field(default=False)
    granted_by: Optional[int] = Field(default=None, foreign_key="inspectors.id")
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    
    # Relationships
    inspector: "Inspector" = Relationship(
        back_populates="specialty_records",
        sa_relationship_kwargs={"foreign_keys": "[InspectorSpecialty.inspector_id]"}
    )

class SpecialtyCodes:
    """Constants for specialty codes"""
    PSV = "PSV"
    CRANE = "CRANE" 
    CORROSION = "CORROSION"
    
    ALL_SPECIALTIES = [
        (PSV, "دسترسی PSV", "شامل کالیبراسیون و Excel PSV"),
        (CRANE, "دسترسی جرثقیل", "شامل بازرسی و Excel جرثقیل"),
        (CORROSION, "دسترسی خوردگی", "شامل تحلیل و Excel خوردگی")
    ]
    
    @classmethod
    def get_specialty_display_name(cls, code: str) -> str:
        """Get Persian display name for specialty code"""
        mapping = {
            cls.PSV: "PSV",
            cls.CRANE: "جرثقیل", 
            cls.CORROSION: "خوردگی"
        }
        return mapping.get(code, code)
    
    @classmethod
    def is_valid_code(cls, code: str) -> bool:
        """Check if specialty code is valid"""
        return code in [cls.PSV, cls.CRANE, cls.CORROSION]