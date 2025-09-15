"""Schemas for admin management API endpoints"""

from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, Field, validator


# Role Management Schemas
class RoleBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=100, description="Role name")
    description: Optional[str] = Field(None, max_length=500, description="Role description")
    display_label: str = Field(..., min_length=1, max_length=100, description="Display label for UI")


class RoleCreate(RoleBase):
    pass


class RoleUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=100, description="Role name")
    description: Optional[str] = Field(None, max_length=500, description="Role description")
    display_label: Optional[str] = Field(None, min_length=1, max_length=100, description="Display label for UI")


class RoleResponse(RoleBase):
    id: int
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True


class RoleListResponse(BaseModel):
    roles: List[RoleResponse]
    total: int
    page: int
    page_size: int
    total_pages: int


# Permission Management Schemas
class PermissionBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=100, description="Permission name")
    description: Optional[str] = Field(None, max_length=500, description="Permission description")
    resource: str = Field(..., min_length=1, max_length=50, description="Resource name")
    action: str = Field(..., min_length=1, max_length=50, description="Action name")
    display_label: str = Field(..., min_length=1, max_length=100, description="Display label for UI")

    @validator('resource')
    def validate_resource(cls, v):
        allowed_resources = [
            'psv', 'ndt', 'mechanical', 'corrosion', 'crane', 'electrical', 
            'instrumentation', 'report', 'admin', 'quality', 'inspector'
        ]
        if v not in allowed_resources:
            raise ValueError(f'Resource must be one of: {", ".join(allowed_resources)}')
        return v

    @validator('action')
    def validate_action(cls, v):
        allowed_actions = [
            'create', 'view', 'edit_own', 'edit_all', 'approve', 'final_approve',
            'delete_own', 'delete_section', 'delete_all', 'manage', 'execute_test'
        ]
        if v not in allowed_actions:
            raise ValueError(f'Action must be one of: {", ".join(allowed_actions)}')
        return v


class PermissionCreate(PermissionBase):
    pass


class PermissionUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=100, description="Permission name")
    description: Optional[str] = Field(None, max_length=500, description="Permission description")
    resource: Optional[str] = Field(None, min_length=1, max_length=50, description="Resource name")
    action: Optional[str] = Field(None, min_length=1, max_length=50, description="Action name")
    display_label: Optional[str] = Field(None, min_length=1, max_length=100, description="Display label for UI")


class PermissionResponse(PermissionBase):
    id: int
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True


class PermissionListResponse(BaseModel):
    permissions: List[PermissionResponse]
    total: int
    page: int
    page_size: int
    total_pages: int


class PermissionDiscoveryResponse(BaseModel):
    resources: List[str]
    actions: List[str]
    available_combinations: List[str]


# Role-Permission Assignment Schemas
class RolePermissionAssignment(BaseModel):
    permission_ids: List[int] = Field(..., description="List of permission IDs to assign")


class RolePermissionsResponse(BaseModel):
    role_id: int
    role_name: str
    permissions: List[PermissionResponse]


# Inspector-Role Assignment Schemas
class InspectorRoleAssignment(BaseModel):
    role_ids: List[int] = Field(..., description="List of role IDs to assign")


class BulkInspectorRoleAssignment(BaseModel):
    inspector_ids: List[int] = Field(..., description="List of inspector IDs")
    role_ids: List[int] = Field(..., description="List of role IDs to assign")


class InspectorRolesResponse(BaseModel):
    inspector_id: int
    inspector_name: str
    roles: List[RoleResponse]


# Common Response Schemas
class SuccessResponse(BaseModel):
    success: bool = True
    message: str


class ErrorResponse(BaseModel):
    success: bool = False
    error: str
    detail: Optional[str] = None


# Pagination Schema
class PaginationParams(BaseModel):
    page: int = Field(1, ge=1, description="Page number")
    page_size: int = Field(20, ge=1, le=100, description="Items per page")


# Filter Schemas
class RoleFilterParams(BaseModel):
    search: Optional[str] = Field(None, description="Search in role name or description")


class PermissionFilterParams(BaseModel):
    search: Optional[str] = Field(None, description="Search in permission name or description")
    resource: Optional[str] = Field(None, description="Filter by resource")
    action: Optional[str] = Field(None, description="Filter by action")