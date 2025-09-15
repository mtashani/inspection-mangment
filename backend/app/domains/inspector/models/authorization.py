from datetime import datetime
from typing import Optional, List
from sqlmodel import SQLModel, Field, Relationship
from sqlalchemy import Column, JSON

class Role(SQLModel, table=True):
    """Role model for authorization"""
    __tablename__ = "roles"
    
    id: Optional[int] = Field(default=None, primary_key=True)
    name: str = Field(unique=True, index=True)
    description: Optional[str] = None
    display_label: str = Field(description="Display label for UI presentation")
    
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    
    # Relationships
    permissions: List["RolePermission"] = Relationship(back_populates="role")
    inspectors: List["InspectorRole"] = Relationship(back_populates="role")


class Permission(SQLModel, table=True):
    """Permission model for authorization"""
    __tablename__ = "permissions"
    
    id: Optional[int] = Field(default=None, primary_key=True)
    name: str = Field(unique=True, index=True)
    description: Optional[str] = None
    resource: str  # e.g., "inspectors", "psv", "calibration"
    action: str    # e.g., "create", "read", "update", "delete", "approve"
    display_label: str = Field(description="Display label for UI presentation")
    
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    
    # Relationships
    roles: List["RolePermission"] = Relationship(back_populates="permission")


class RolePermission(SQLModel, table=True):
    """Many-to-many relationship between roles and permissions"""
    __tablename__ = "role_permissions"
    
    role_id: int = Field(foreign_key="roles.id", primary_key=True)
    permission_id: int = Field(foreign_key="permissions.id", primary_key=True)
    
    created_at: datetime = Field(default_factory=datetime.utcnow)
    
    # Relationships
    role: Role = Relationship(back_populates="permissions")
    permission: Permission = Relationship(back_populates="roles")


class InspectorRole(SQLModel, table=True):
    """Many-to-many relationship between inspectors and roles"""
    __tablename__ = "inspector_roles"
    
    inspector_id: int = Field(foreign_key="inspectors.id", primary_key=True)
    role_id: int = Field(foreign_key="roles.id", primary_key=True)
    
    created_at: datetime = Field(default_factory=datetime.utcnow)
    
    # Relationships
    inspector: "Inspector" = Relationship(back_populates="roles")
    role: Role = Relationship()


# Import at the end to avoid circular imports
from app.domains.inspector.models.inspector import Inspector