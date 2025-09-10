from datetime import date, datetime
from typing import Optional, List
from pydantic import BaseModel, Field, field_validator
from app.domains.inspector.models.enums import InspectorType
import re

class InspectorCreateRequest(BaseModel):
    """Schema for creating a new inspector"""
    first_name: str = Field(..., min_length=1, max_length=50)
    last_name: str = Field(..., min_length=1, max_length=50)
    employee_id: str = Field(..., min_length=1, max_length=50)
    national_id: str = Field(..., min_length=10, max_length=10)
    email: str
    inspector_type: InspectorType
    phone: Optional[str] = Field(None, max_length=20)
    department: Optional[str] = Field(None, max_length=100)
    years_experience: int = Field(..., ge=0, le=50)
    date_of_birth: Optional[date] = None
    specialties: Optional[List[str]] = Field(default_factory=list)
    username: Optional[str] = Field(None, min_length=3, max_length=50)
    password: Optional[str] = Field(None, min_length=6)
    can_login: bool = Field(default=False)
    active: bool = Field(default=True)
    attendance_tracking_enabled: bool = Field(default=False)

    @field_validator('email')
    @classmethod
    def validate_email(cls, v):
        if not re.match(r'^[^@]+@[^@]+\.[^@]+$', v):
            raise ValueError('Invalid email format')
        return v

    class Config:
        json_encoders = {
            date: lambda v: v.isoformat() if v else None
        }

class InspectorResponse(BaseModel):
    """Schema for inspector responses"""
    id: int
    first_name: str
    last_name: str
    name: str  # Computed field for backward compatibility
    employee_id: str
    national_id: str
    email: str
    inspector_type: str
    phone: Optional[str] = None
    department: Optional[str] = None
    years_experience: int
    date_of_birth: Optional[date] = None
    specialties: List[str]
    active: bool
    can_login: bool
    username: Optional[str] = None
    profile_image_url: Optional[str] = None
    attendance_tracking_enabled: bool
    base_hourly_rate: Optional[float] = None
    overtime_multiplier: Optional[float] = None
    night_shift_multiplier: Optional[float] = None
    on_call_multiplier: Optional[float] = None
    last_login: Optional[datetime] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    
    @classmethod
    def from_model(cls, inspector):
        """Create response from Inspector model"""
        return cls(
            id=inspector.id,
            first_name=inspector.first_name,
            last_name=inspector.last_name,
            name=f"{inspector.first_name} {inspector.last_name}",
            employee_id=inspector.employee_id,
            national_id=inspector.national_id,
            email=inspector.email,
            inspector_type=inspector.inspector_type.value if hasattr(inspector.inspector_type, 'value') else str(inspector.inspector_type),
            phone=inspector.phone,
            department=inspector.department,
            years_experience=inspector.years_experience,
            date_of_birth=inspector.date_of_birth,
            specialties=inspector.specialties or [],
            active=inspector.active,
            can_login=inspector.can_login,
            username=inspector.username,
            profile_image_url=inspector.profile_image_url,
            attendance_tracking_enabled=inspector.attendance_tracking_enabled,
            base_hourly_rate=getattr(inspector, 'base_hourly_rate', None),
            overtime_multiplier=getattr(inspector, 'overtime_multiplier', None),
            night_shift_multiplier=getattr(inspector, 'night_shift_multiplier', None),
            on_call_multiplier=getattr(inspector, 'on_call_multiplier', None),
            last_login=inspector.last_login,
            created_at=inspector.created_at,
            updated_at=inspector.updated_at
        )

    class Config:
        from_attributes = True
        json_encoders = {
            date: lambda v: v.isoformat() if v else None
        }