from .maintenance_routes import router as maintenance_router
from .reporting_routes import router as reporting_router
from .filtering_routes import router as filtering_router
from .validation_routes import router as validation_router
from .status_management_routes import router as status_management_router
from .analytics_routes import router as analytics_router

__all__ = [
    "maintenance_router",
    "reporting_router",
    "filtering_router",
    "validation_router",
    "status_management_router",
    "analytics_router"
]