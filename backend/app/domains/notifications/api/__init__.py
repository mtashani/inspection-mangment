# Import API routes to make them accessible from the package
from app.domains.notifications.api.notification_routes import router as notification_router
from app.domains.notifications.api.websocket_routes import router as websocket_router

__all__ = [
    "notification_router",
    "websocket_router"
]