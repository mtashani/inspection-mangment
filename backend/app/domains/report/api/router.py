"""Main report domain router"""

from fastapi import APIRouter
from app.domains.report.api.template_routes import router as template_router
from app.domains.report.api.report_routes import router as report_router

# Create main report router
router = APIRouter(prefix="/api/v1/reports", tags=["Professional Reports"])

# Include sub-routers
router.include_router(template_router)
router.include_router(report_router)