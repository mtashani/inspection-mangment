import logging
from fastapi import APIRouter, Depends, HTTPException, Query, Path, Request
from sqlmodel import Session
from typing import List, Optional, Dict, Any
from pydantic import BaseModel

from app.database import get_session
from app.domains.notifications.services.notification_service import NotificationService
from app.domains.notifications.models.notification import (
    Notification, 
    NotificationPreference, 
    NotificationStatus, 
    NotificationType, 
    NotificationPriority
)
from app.domains.auth.services.auth_service import AuthService
from app.domains.inspector.models.inspector import Inspector

logger = logging.getLogger(__name__)

router = APIRouter()

# Pydantic models for request/response
class NotificationResponse(BaseModel):
    id: int
    title: str
    message: str
    type: NotificationType
    priority: NotificationPriority
    status: NotificationStatus
    related_item_id: Optional[str]
    related_item_type: Optional[str]
    action_url: Optional[str]
    extra_data: Dict[str, Any]
    created_at: str
    read_at: Optional[str]
    expires_at: Optional[str]

class NotificationPreferenceResponse(BaseModel):
    id: int
    inspector_id: int
    event_created: bool
    event_updated: bool
    event_deleted: bool
    event_status_changed: bool
    inspection_created: bool
    inspection_completed: bool
    calibration_due: bool
    calibration_overdue: bool
    rbi_change: bool
    psv_update: bool
    system_alert: bool
    task_complete: bool
    web_notifications: bool
    email_notifications: bool
    push_notifications: bool
    calibration_reminder_days: int
    daily_summary: bool
    summary_time: str
    sound_enabled: bool
    sound_volume: str

class NotificationPreferenceUpdate(BaseModel):
    event_created: Optional[bool] = None
    event_updated: Optional[bool] = None
    event_deleted: Optional[bool] = None
    event_status_changed: Optional[bool] = None
    inspection_created: Optional[bool] = None
    inspection_completed: Optional[bool] = None
    calibration_due: Optional[bool] = None
    calibration_overdue: Optional[bool] = None
    rbi_change: Optional[bool] = None
    psv_update: Optional[bool] = None
    system_alert: Optional[bool] = None
    task_complete: Optional[bool] = None
    web_notifications: Optional[bool] = None
    email_notifications: Optional[bool] = None
    push_notifications: Optional[bool] = None
    calibration_reminder_days: Optional[int] = None
    daily_summary: Optional[bool] = None
    summary_time: Optional[str] = None
    sound_enabled: Optional[bool] = None
    sound_volume: Optional[str] = None

def get_token_from_header_or_cookie(request: Request):
    """Extract token from Authorization header or cookie"""
    # Try to get token from Authorization header
    auth_header = request.headers.get("Authorization")
    if auth_header and auth_header.startswith("Bearer "):
        return auth_header.split(" ", 1)[1]
    # Fallback to cookie
    token_cookie = request.cookies.get("access_token")
    if token_cookie:
        return token_cookie
    return None

def get_current_inspector(
    request: Request,
    db: Session = Depends(get_session),
) -> Inspector:
    """Get current authenticated inspector from JWT token"""
    token = get_token_from_header_or_cookie(request)
    if not token:
        raise HTTPException(
            status_code=401,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    inspector = AuthService.get_current_inspector(db, token)
    if not inspector:
        raise HTTPException(
            status_code=401,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return inspector

@router.get("/", response_model=Dict[str, Any])
def get_notifications(
    status: Optional[NotificationStatus] = Query(None, description="Filter by status"),
    limit: int = Query(50, ge=1, le=100, description="Number of notifications to return"),
    offset: int = Query(0, ge=0, description="Number of notifications to skip"),
    current_inspector: Inspector = Depends(get_current_inspector),
    db: Session = Depends(get_session)
):
    """Get notifications for the current inspector"""
    
    try:
        notification_service = NotificationService(db)
        notifications = notification_service.get_notifications_for_inspector(
            inspector_id=current_inspector.id,
            status=status,
            limit=limit,
            offset=offset
        )
        
        unread_count = notification_service.get_unread_count(current_inspector.id)
        
        notifications_data = [
            NotificationResponse(
                id=notification.id,
                title=notification.title,
                message=notification.message,
                type=notification.type,
                priority=notification.priority,
                status=notification.status,
                related_item_id=notification.related_item_id,
                related_item_type=notification.related_item_type,
                action_url=notification.action_url,
                extra_data=notification.extra_data,
                created_at=notification.created_at.isoformat(),
                read_at=notification.read_at.isoformat() if notification.read_at else None,
                expires_at=notification.expires_at.isoformat() if notification.expires_at else None
            )
            for notification in notifications
        ]
        
        return {
            "notifications": notifications_data,
            "unread_count": unread_count,
            "total_count": len(notifications_data),
            "limit": limit,
            "offset": offset
        }
        
    except Exception as e:
        logger.error(f"Error getting notifications for inspector {current_inspector.id}: {e}")
        raise HTTPException(status_code=500, detail="Failed to get notifications")

@router.post("/{notification_id}/read")
def mark_notification_read(
    notification_id: int = Path(..., description="Notification ID"),
    current_inspector: Inspector = Depends(get_current_inspector),
    db: Session = Depends(get_session)
):
    """Mark a notification as read"""
    
    notification_service = NotificationService(db)
    success = notification_service.mark_notification_as_read(notification_id, current_inspector.id)
    
    if not success:
        raise HTTPException(status_code=404, detail="Notification not found")
    
    return {"message": "Notification marked as read", "notification_id": notification_id}

@router.get("/unread-count")
def get_unread_count(
    current_inspector: Inspector = Depends(get_current_inspector),
    db: Session = Depends(get_session)
):
    """Get count of unread notifications"""
    
    notification_service = NotificationService(db)
    count = notification_service.get_unread_count(current_inspector.id)
    
    return {"unread_count": count}

@router.get("/preferences", response_model=NotificationPreferenceResponse)
def get_notification_preferences(
    current_inspector: Inspector = Depends(get_current_inspector),
    db: Session = Depends(get_session)
):
    """Get notification preferences for the current inspector"""
    
    notification_service = NotificationService(db)
    preferences = notification_service.get_or_create_preferences(current_inspector.id)
    
    return NotificationPreferenceResponse(
        id=preferences.id,
        inspector_id=preferences.inspector_id,
        event_created=preferences.event_created,
        event_updated=preferences.event_updated,
        event_deleted=preferences.event_deleted,
        event_status_changed=preferences.event_status_changed,
        inspection_created=preferences.inspection_created,
        inspection_completed=preferences.inspection_completed,
        calibration_due=preferences.calibration_due,
        calibration_overdue=preferences.calibration_overdue,
        rbi_change=preferences.rbi_change,
        psv_update=preferences.psv_update,
        system_alert=preferences.system_alert,
        task_complete=preferences.task_complete,
        web_notifications=preferences.web_notifications,
        email_notifications=preferences.email_notifications,
        push_notifications=preferences.push_notifications,
        calibration_reminder_days=preferences.calibration_reminder_days,
        daily_summary=preferences.daily_summary,
        summary_time=preferences.summary_time,
        sound_enabled=preferences.sound_enabled,
        sound_volume=preferences.sound_volume
    )

@router.put("/preferences", response_model=NotificationPreferenceResponse)
def update_notification_preferences(
    preferences_update: NotificationPreferenceUpdate,
    current_inspector: Inspector = Depends(get_current_inspector),
    db: Session = Depends(get_session)
):
    """Update notification preferences for the current inspector"""
    
    notification_service = NotificationService(db)
    preferences_data = preferences_update.dict(exclude_unset=True)
    
    preferences = notification_service.update_preferences(current_inspector.id, preferences_data)
    
    return NotificationPreferenceResponse(
        id=preferences.id,
        inspector_id=preferences.inspector_id,
        event_created=preferences.event_created,
        event_updated=preferences.event_updated,
        event_deleted=preferences.event_deleted,
        event_status_changed=preferences.event_status_changed,
        inspection_created=preferences.inspection_created,
        inspection_completed=preferences.inspection_completed,
        calibration_due=preferences.calibration_due,
        calibration_overdue=preferences.calibration_overdue,
        rbi_change=preferences.rbi_change,
        psv_update=preferences.psv_update,
        system_alert=preferences.system_alert,
        task_complete=preferences.task_complete,
        web_notifications=preferences.web_notifications,
        email_notifications=preferences.email_notifications,
        push_notifications=preferences.push_notifications,
        calibration_reminder_days=preferences.calibration_reminder_days,
        daily_summary=preferences.daily_summary,
        summary_time=preferences.summary_time,
        sound_enabled=preferences.sound_enabled,
        sound_volume=preferences.sound_volume
    )

# Admin endpoints for testing
@router.post("/test/broadcast")
async def test_broadcast_notification(
    title: str = Query(..., description="Notification title"),
    message: str = Query(..., description="Notification message"),
    priority: NotificationPriority = Query(NotificationPriority.MEDIUM, description="Notification priority"),
    db: Session = Depends(get_session)
):
    """Test endpoint to broadcast a notification to all users"""
    
    notification_service = NotificationService(db)
    
    notification = await notification_service.create_notification(
        title=title,
        message=message,
        notification_type=NotificationType.SYSTEM_ALERT,
        priority=priority,
        recipient_id=None,  # Broadcast to all
        expires_in_days=1
    )
    
    return {
        "message": "Test notification broadcasted",
        "notification_id": notification.id,
        "title": notification.title
    }