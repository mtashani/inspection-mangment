# Import models to make them accessible from the package
from app.domains.notifications.models.notification import (
    Notification, 
    NotificationPreference, 
    NotificationType, 
    NotificationPriority, 
    NotificationStatus
)

__all__ = [
    "Notification",
    "NotificationPreference", 
    "NotificationType",
    "NotificationPriority",
    "NotificationStatus"
]