from datetime import datetime, date
from typing import List, Optional, Dict, Any

from pydantic import BaseModel, EmailStr, validator

from app.domains.inspector.models.enums import InspectorType


# Token schemas
class Token(BaseModel):
    """Token response schema"""
    access_token: str
    refresh_token: str
    token_type: str


class TokenPayload(BaseModel):
    """Token payload schema"""
    sub: Optional[str] = None
    exp: Optional[int] = None
    iat: Optional[int] = None
    roles: List[str] = []
    permissions: List[str] = []
    type: Optional[str] = None


class RefreshTokenRequest(BaseModel):
    """Refresh token request schema"""
    refresh_token: str


# Inspector response schemas
class InspectorBase(BaseModel):
    """Base inspector schema"""
    name: str
    employee_id: str
    inspector_type: InspectorType
    email: EmailStr
    phone: Optional[str] = None
    department: Optional[str] = None
    years_experience: int
    specialties: List[str] = []
    active: bool = True
    available: bool = True
    date_of_birth: Optional[date] = None


class InspectorCreate(InspectorBase):
    """Schema for creating an inspector"""
    password: str
    can_login: bool = False
    
    @validator("password")
    def password_min_length(cls, v):
        if len(v) < 8:
            raise ValueError("Password must be at least 8 characters")
        return v


class InspectorUpdate(BaseModel):
    """Schema for updating an inspector"""
    name: Optional[str] = None
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    department: Optional[str] = None
    inspector_type: Optional[InspectorType] = None
    years_experience: Optional[int] = None
    specialties: Optional[List[str]] = None
    active: Optional[bool] = None
    available: Optional[bool] = None
    date_of_birth: Optional[date] = None
    username: Optional[str] = None
    password: Optional[str] = None
    can_login: Optional[bool] = None
    
    @validator("password")
    def password_min_length(cls, v):
        if v is not None and len(v) < 8:
            raise ValueError("Password must be at least 8 characters")
        return v


class InspectorResponse(InspectorBase):
    """Schema for inspector response"""
    id: int
    username: Optional[str] = None
    can_login: bool
    profile_image_url: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        orm_mode = True


class InspectorInDB(InspectorResponse):
    """Schema for inspector in database"""
    password_hash: str


# Role and Permission schemas
class PermissionBase(BaseModel):
    """Base permission schema"""
    name: str
    resource: str
    action: str
    description: Optional[str] = None


class PermissionCreate(PermissionBase):
    """Schema for creating a permission"""
    pass


class PermissionResponse(PermissionBase):
    """Schema for permission response"""
    id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        orm_mode = True


class RoleBase(BaseModel):
    """Base role schema"""
    name: str
    description: Optional[str] = None


class RoleCreate(RoleBase):
    """Schema for creating a role"""
    pass


class RoleUpdate(BaseModel):
    """Schema for updating a role"""
    name: Optional[str] = None
    description: Optional[str] = None


class RoleResponse(RoleBase):
    """Schema for role response"""
    id: int
    created_at: datetime
    updated_at: datetime
    permissions: List[PermissionResponse] = []

    class Config:
        orm_mode = True


# Role assignment schemas
class RoleAssignment(BaseModel):
    """Schema for role assignment"""
    role_id: int


class InspectorWithRoles(InspectorResponse):
    """Schema for inspector with roles"""
    roles: List[RoleResponse] = []


# Authentication related schemas
class LoginRequest(BaseModel):
    """Schema for login request"""
    username: str
    password: str


class PasswordChange(BaseModel):
    """Schema for changing password"""
    old_password: str
    new_password: str
    
    @validator("new_password")
    def password_min_length(cls, v):
        if len(v) < 8:
            raise ValueError("Password must be at least 8 characters")
        return v