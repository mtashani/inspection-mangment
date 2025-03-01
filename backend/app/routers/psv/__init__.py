from fastapi import APIRouter
from .psv_routes import router as psv_router
from .calibration_routes import router as calibration_router
from .rbi_routes import router as rbi_router
from .service_risk_routes import router as service_risk_router
from .analytics_routes import router as analytics_router
from .summary_routes import router as summary_router

# Create main PSV router
router = APIRouter(prefix="/psv", tags=["PSV"])

# Include sub-routers with their prefixes
router.include_router(psv_router)
router.include_router(calibration_router)
router.include_router(rbi_router)
router.include_router(service_risk_router)
router.include_router(analytics_router)
router.include_router(summary_router)