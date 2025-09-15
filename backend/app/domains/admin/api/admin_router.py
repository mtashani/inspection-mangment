"""Main Admin Management API Router"""

from fastapi import APIRouter

from app.domains.admin.api.dashboard import router as dashboard_router
from app.domains.admin.api.roles import router as roles_router
from app.domains.admin.api.permissions import router as permissions_router
from app.domains.admin.api.role_permissions import router as role_permissions_router
from app.domains.admin.api.inspector_roles import router as inspector_roles_router

# Create main admin router
router = APIRouter()

# Include all admin sub-routers
router.include_router(dashboard_router, tags=["Admin - Dashboard"])
router.include_router(roles_router, tags=["Admin - Roles"])
router.include_router(permissions_router, tags=["Admin - Permissions"])
router.include_router(role_permissions_router, tags=["Admin - Role Permissions"])
router.include_router(inspector_roles_router, tags=["Admin - Inspector Roles"])