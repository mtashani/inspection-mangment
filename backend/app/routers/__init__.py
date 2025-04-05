from .equipment import router as equipment_router
from .inspections import router as inspections_router
from .daily_reports import router as daily_reports_router
from .inspectors import router as inspectors_router
from .corrosion import router as corrosion_router

__all__ = [
    "equipment_router",
    "inspections_router",
    "daily_reports_router",
    "inspectors_router",
    "corrosion_router"
]