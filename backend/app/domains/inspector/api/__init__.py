from fastapi import APIRouter
from app.domains.inspector.api.inspector import router as inspector_router
from app.domains.inspector.api.attendance.attendance import router as attendance_router
from app.domains.inspector.api.attendance.analytics import router as attendance_analytics_router
from app.domains.inspector.api.attendance.reports import router as attendance_reports_router
from app.domains.inspector.api.payroll.payroll import router as payroll_router

from app.domains.inspector.api.work_cycle.work_cycle import router as work_cycle_router

# Create aggregated router for the inspector domain (Inspector-Centric Structure)
router = APIRouter()

# Include inspector domain routers with new structure
router.include_router(inspector_router, tags=["Inspectors"])
# Note: attendance, payroll, and work_cycle are now handled by main.py directly
# to implement the inspector-centric API structure
