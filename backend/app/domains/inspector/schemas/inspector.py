from datetime import date, datetime
from typing import Optional, List, Union
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
    phone: Optional[str] = Field(None, max_length=20)
    years_experience: Optional[int] = Field(None, ge=0, le=50)
    date_of_birth: Optional[date] = None
    username: Optional[str] = Field(None, min_length=3, max_length=50)
    password: Optional[str] = Field(None, min_length=6)
    can_login: bool = Field(default=False)
    active: bool = Field(default=True)
    attendance_tracking_enabled: bool = Field(default=False)
    
    # Educational Information
    education_degree: Optional[str] = None
    education_field: Optional[str] = None
    education_institute: Optional[str] = None
    graduation_year: Optional[int] = None
    
    # Profile information
    birth_place: Optional[str] = None
    profile_image_url: Optional[str] = None
    marital_status: Optional[str] = None
    
    # Payroll information
    base_hourly_rate: Optional[float] = None
    overtime_multiplier: Optional[float] = None
    night_shift_multiplier: Optional[float] = None
    on_call_multiplier: Optional[float] = None

    @field_validator('email')
    @classmethod
    def validate_email(cls, v):
        if not re.match(r'^[^@]+@[^@]+\.[^@]+$', v):
            raise ValueError('Invalid email format')
        return v
    
    @field_validator('date_of_birth')
    @classmethod
    def validate_date_of_birth(cls, v):
        if v is None:
            return v
        
        # If it's already a date object, return it
        if isinstance(v, date):
            return v
        
        # If it's a string, try to parse it
        if isinstance(v, str):
            # Handle empty string
            if not v.strip():
                return None
            
            # Try different date formats
            date_formats = [
                '%Y-%m-%d',      # ISO format: 2023-12-31
                '%d/%m/%Y',      # Persian format: 31/12/2023
                '%m/%d/%Y',      # US format: 12/31/2023
                '%Y/%m/%d',      # Alternative format: 2023/12/31
                '%d-%m-%Y',      # European format: 31-12-2023
            ]
            
            for date_format in date_formats:
                try:
                    parsed_date = datetime.strptime(v, date_format).date()
                    # Validate age range (e.g., 16-80 years old)
                    today = date.today()
                    age = today.year - parsed_date.year - ((today.month, today.day) < (parsed_date.month, parsed_date.day))
                    if age < 16 or age > 80:
                        raise ValueError(f'Invalid age: {age}. Age must be between 16 and 80.')
                    return parsed_date
                except ValueError:
                    continue
            
            raise ValueError(f'Invalid date format: {v}. Expected formats: YYYY-MM-DD, DD/MM/YYYY, MM/DD/YYYY, etc.')
        
        raise ValueError(f'Invalid date type: {type(v)}. Expected string or date object.')

    class Config:
        json_encoders = {
            date: lambda v: v.isoformat() if v else None
        }

class InspectorUpdateRequest(BaseModel):
    """Schema for updating an existing inspector"""
    first_name: Optional[str] = Field(None, min_length=1, max_length=50)
    last_name: Optional[str] = Field(None, min_length=1, max_length=50)
    employee_id: Optional[str] = Field(None, min_length=1, max_length=50)
    national_id: Optional[str] = Field(None, min_length=10, max_length=10)
    email: Optional[str] = None
    phone: Optional[str] = Field(None, max_length=20)
    years_experience: Optional[int] = Field(None, ge=0, le=50)
    date_of_birth: Optional[date] = None
    username: Optional[str] = Field(None, min_length=3, max_length=50)
    password: Optional[str] = Field(None, min_length=6)
    can_login: Optional[bool] = None
    active: Optional[bool] = None
    attendance_tracking_enabled: Optional[bool] = None
    
    # Educational Information
    education_degree: Optional[str] = None
    education_field: Optional[str] = None
    education_institute: Optional[str] = None
    graduation_year: Optional[int] = None
    
    # Profile information
    birth_place: Optional[str] = None
    profile_image_url: Optional[str] = None
    marital_status: Optional[str] = None
    
    # Payroll information
    base_hourly_rate: Optional[float] = None
    overtime_multiplier: Optional[float] = None
    night_shift_multiplier: Optional[float] = None
    on_call_multiplier: Optional[float] = None

    @field_validator('email')
    @classmethod
    def validate_email(cls, v):
        if v is not None and not re.match(r'^[^@]+@[^@]+\.[^@]+$', v):
            raise ValueError('Invalid email format')
        return v
    
    @field_validator('date_of_birth')
    @classmethod
    def validate_date_of_birth(cls, v):
        if v is None:
            return v
        
        # If it's already a date object, return it
        if isinstance(v, date):
            return v
        
        # If it's a string, try to parse it
        if isinstance(v, str):
            # Handle empty string
            if not v.strip():
                return None
            
            # Try different date formats
            date_formats = [
                '%Y-%m-%d',      # ISO format: 2023-12-31
                '%d/%m/%Y',      # Persian format: 31/12/2023
                '%m/%d/%Y',      # US format: 12/31/2023
                '%Y/%m/%d',      # Alternative format: 2023/12/31
                '%d-%m-%Y',      # European format: 31-12-2023
            ]
            
            for date_format in date_formats:
                try:
                    parsed_date = datetime.strptime(v, date_format).date()
                    # Validate age range (e.g., 16-80 years old)
                    today = date.today()
                    age = today.year - parsed_date.year - ((today.month, today.day) < (parsed_date.month, parsed_date.day))
                    if age < 16 or age > 80:
                        raise ValueError(f'Invalid age: {age}. Age must be between 16 and 80.')
                    return parsed_date
                except ValueError:
                    continue
            
            raise ValueError(f'Invalid date format: {v}. Expected formats: YYYY-MM-DD, DD/MM/YYYY, MM/DD/YYYY, etc.')
        
        raise ValueError(f'Invalid date type: {type(v)}. Expected string or date object.')

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
    phone: Optional[str] = None
    years_experience: Optional[int] = None
    date_of_birth: Optional[date] = None
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
    
    # Educational Information
    education_degree: Optional[str] = None
    education_field: Optional[str] = None
    education_institute: Optional[str] = None
    graduation_year: Optional[int] = None
    
    # Profile information
    birth_place: Optional[str] = None
    marital_status: Optional[str] = None
    
    # Work experience
    previous_companies: List[str] = Field(default_factory=list)
    
    # Role information for RBAC
    roles: List[str] = Field(default_factory=list, description="List of role names assigned to inspector")
    
    @classmethod
    def from_model(cls, inspector):
        """Create response from Inspector model"""
        # Get role names from inspector relationships
        role_names = []
        if hasattr(inspector, 'roles') and inspector.roles:
            for inspector_role in inspector.roles:
                if hasattr(inspector_role, 'role') and inspector_role.role:
                    role_names.append(inspector_role.role.name)
        
        return cls(
            id=inspector.id,
            first_name=inspector.first_name,
            last_name=inspector.last_name,
            name=f"{inspector.first_name} {inspector.last_name}",
            employee_id=inspector.employee_id,
            national_id=inspector.national_id,
            email=inspector.email,
            phone=inspector.phone,
            years_experience=inspector.years_experience,
            date_of_birth=inspector.date_of_birth,
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
            updated_at=inspector.updated_at,
            education_degree=getattr(inspector, 'education_degree', None),
            education_field=getattr(inspector, 'education_field', None),
            education_institute=getattr(inspector, 'education_institute', None),
            graduation_year=getattr(inspector, 'graduation_year', None),
            birth_place=getattr(inspector, 'birth_place', None),
            marital_status=getattr(inspector, 'marital_status', None),
            previous_companies=getattr(inspector, 'previous_companies', []),
            roles=role_names
        )

    class Config:
        from_attributes = True
        json_encoders = {
            date: lambda v: v.isoformat() if v else None
        }