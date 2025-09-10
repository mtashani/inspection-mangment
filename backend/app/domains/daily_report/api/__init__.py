from fastapi import APIRouter
from app.domains.daily_report.api.report import router as report_router

# Create aggregated router for the daily report domain
router = APIRouter()

# Include the daily report router
router.include_router(report_router, tags=["Daily Reports"])
