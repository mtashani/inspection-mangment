from fastapi import APIRouter
from .coupon_routes import router as coupon_router
from .analysis_routes import router as analysis_router
from .location_routes import router as location_router
from .settings_routes import router as settings_router
from .summary_routes import router as summary_router

router = APIRouter(
    prefix="/corrosion",
    tags=["corrosion"],
)

router.include_router(coupon_router, prefix="/coupons")
router.include_router(analysis_router, prefix="/analysis")
router.include_router(location_router, prefix="/locations")
router.include_router(settings_router, prefix="/settings")
router.include_router(summary_router, prefix="/summary")