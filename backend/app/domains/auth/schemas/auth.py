from typing import List, Optional
from pydantic import BaseModel


class Token(BaseModel):
    """Token schema for authentication responses"""
    access_token: str
    token_type: str


class UserInfo(BaseModel):
    """User information schema"""
    id: int
    username: str
    email: str
    name: str
    roles: List[str]
    permissions: Optional[List[str]] = []
    is_active: bool
    employee_id: str


class PermissionInfo(BaseModel):
    """Permission information schema"""
    id: int
    name: str
    resource: str
    action: str
    description: Optional[str] = None


class RoleInfo(BaseModel):
    """Role information schema"""
    id: int
    name: str
    description: Optional[str] = None
    permissions: List[PermissionInfo] = []