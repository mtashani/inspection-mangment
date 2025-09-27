"""Schemas for admin management API endpoints"""

from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, Field, field_validator, ConfigDict


# Role Management Schemas
class RoleBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=100, description="Role name")
    description: Optional[str] = Field(None, max_length=500, description="Role description")
    display_label: str = Field(..., min_length=1, max_length=100, description="Display label for UI")


class RoleCreate(RoleBase):
    pass


class RoleCreateWithPermissions(RoleBase):
    permission_ids: Optional[List[int]] = Field(default=[], description="List of permission IDs to assign to the new role")


class RoleUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=100, description="Role name")
    description: Optional[str] = Field(None, max_length=500, description="Role description")
    display_label: Optional[str] = Field(None, min_length=1, max_length=100, description="Display label for UI")


class RoleResponse(RoleBase):
    model_config = ConfigDict(from_attributes=True)
    
    id: int
    created_at: datetime
    updated_at: datetime
    inspector_count: Optional[int] = 0
    permission_count: Optional[int] = 0
    permissions: Optional[List[str]] = []


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

    @field_validator('resource')
    @classmethod
    def validate_resource(cls, v):
        # Updated to match standardized permissions system
        allowed_resources = [
            'system', 'hr', 'mechanical', 'corrosion', 'ndt', 'electrical', 
            'instrument', 'quality', 'maintenance',
            # Legacy resources for backward compatibility
            'psv', 'crane', 'instrumentation', 'report', 'admin', 'inspector'
        ]
        if v not in allowed_resources:
            raise ValueError(f'Resource must be one of: {", ".join(allowed_resources)}')
        return v

    @field_validator('action')
    @classmethod
    def validate_action(cls, v):
        # Updated to match standardized permissions system
        allowed_actions = [
            'view', 'edit', 'approve', 'superadmin', 'manage',
            # Legacy actions for backward compatibility
            'create', 'edit_own', 'edit_all', 'final_approve',
            'delete_own', 'delete_section', 'delete_all', 'execute_test'
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
    model_config = ConfigDict(from_attributes=True)
    
    id: int
    created_at: datetime
    updated_at: datetime


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