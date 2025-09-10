from fastapi import APIRouter
from app.domains.psv.api.psv import router as psv_router
from app.domains.psv.api.rbi import router as rbi_router

# Create aggregated router for the PSV domain
router = APIRouter()

# Include the PSV sub-routers
router.include_router(psv_router)
router.include_router(rbi_router)

# Add more routers as they are implemented:
# router.include_router(calibration_router)
# router.include_router(api527_router)
