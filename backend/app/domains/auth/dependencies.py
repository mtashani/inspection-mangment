# NEW: Authentication dependencies for FastAPI
from fastapi import Depends, HTTPException, status
from typing import Optional
from enum import Enum

# Placeholder User model (replace with real model)
class User:
    def __init__(self, id: int, username: str, is_admin: bool = False):
        self.id = id
        self.username = username
        self.is_admin = is_admin

# TODO: Replace with real JWT/session authentication

def get_current_user() -> User:
    # In real implementation, extract user from JWT/session
    # For now, return a dummy user (admin)
    user = User(id=1, username="admin", is_admin=True)
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Not authenticated")
    return user

def require_admin(current_user: User = Depends(get_current_user)) -> User:
    if not current_user.is_admin:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Admin access required")
    return current_user

class Permission(str, Enum):
    # Inspector management
    INSPECTOR_VIEW = "inspector:view"
    INSPECTOR_CREATE = "inspector:create"
    INSPECTOR_UPDATE = "inspector:update"
    INSPECTOR_DELETE = "inspector:delete"
    # Attendance management
    ATTENDANCE_VIEW_OWN = "attendance:view_own"
    ATTENDANCE_VIEW_ALL = "attendance:view_all"
    ATTENDANCE_EDIT_OWN = "attendance:edit_own"
    ATTENDANCE_EDIT_ALL = "attendance:edit_all"
    # Leave requests
    LEAVE_REQUEST_CREATE = "leave_request:create"
    LEAVE_REQUEST_APPROVE = "leave_request:approve"
    LEAVE_REQUEST_VIEW_ALL = "leave_request:view_all"
    # Payroll
    PAYROLL_VIEW_OWN = "payroll:view_own"
    PAYROLL_VIEW_ALL = "payroll:view_all"
    PAYROLL_EDIT = "payroll:edit"
    PAYROLL_FINALIZE = "payroll:finalize"

def require_permission(permission: Permission):
    def dependency(current_user=Depends(get_current_user)):
        if not hasattr(current_user, "permissions") or permission not in getattr(current_user, "permissions", []):
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Permission denied")
        return current_user
    return dependency 