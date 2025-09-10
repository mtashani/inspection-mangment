from fastapi import APIRouter
from app.domains.corrosion.api.location import router as location_router
from app.domains.corrosion.api.coupon import router as coupon_router
from app.domains.corrosion.api.analysis import router as analysis_router
from app.domains.corrosion.api.settings import router as settings_router

# Create aggregated router for the corrosion domain
router = APIRouter()

# Include the corrosion sub-routers with appropriate prefixes
router.include_router(location_router, prefix="/locations", tags=["Corrosion Locations"])
router.include_router(coupon_router, prefix="/coupons", tags=["Corrosion Coupons"])
router.include_router(analysis_router, prefix="/analysis", tags=["Corrosion Analysis"])
router.include_router(settings_router, prefix="/settings", tags=["Corrosion Settings"])
