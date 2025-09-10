from datetime import datetime
from typing import Optional, List
from sqlmodel import SQLModel, Field, Relationship
from sqlalchemy import Column, JSON, Text
from enum import Enum

class NotificationType(str, Enum):
    """Enumeration for notification types"""
    EVENT_CREATED = "event_created"
    EVENT_UPDATED = "event_updated"
    EVENT_DELETED = "event_deleted"
    EVENT_STATUS_CHANGED = "event_status_changed"
    EVENT_APPROVED = "event_approved"
    EVENT_APPROVAL_REVERTED = "event_approval_reverted"
    SUB_EVENT_CREATED = "sub_event_created"
    SUB_EVENT_UPDATED = "sub_event_updated"
    SUB_EVENT_STATUS_CHANGED = "sub_event_status_changed"
    INSPECTION_CREATED = "inspection_created"
    INSPECTION_COMPLETED = "inspection_completed"
    INSPECTION_UPDATED = "inspection_updated"
    BULK_INSPECTIONS_PLANNED = "bulk_inspections_planned"
    CALIBRATION_DUE = "calibration_due"
    CALIBRATION_OVERDUE = "calibration_overdue"
    RBI_CHANGE = "rbi_change"
    PSV_UPDATE = "psv_update"
    SYSTEM_ALERT = "system_alert"
    TASK_COMPLETE = "task_complete"

class NotificationPriority(str, Enum):
    """Enumeration for notification priority levels"""
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"

class NotificationStatus(str, Enum):
    """Enumeration for notification status"""
    UNREAD = "unread"
    READ = "read"
    ARCHIVED = "archived"
    DISMISSED = "dismissed"

class Notification(SQLModel, table=True):
    """Notification model for real-time notifications"""
    __tablename__ = "notifications"
    
    id: Optional[int] = Field(default=None, primary_key=True)
    
    # Content fields
    title: str = Field(max_length=255)
    message: str = Field(sa_column=Column(Text))
    type: NotificationType
    priority: NotificationPriority = Field(default=NotificationPriority.MEDIUM)
    status: NotificationStatus = Field(default=NotificationStatus.UNREAD)
    
    # Recipient information
    recipient_id: Optional[int] = Field(foreign_key="inspectors.id", description="Specific recipient (null for broadcast)")
    recipient_type: Optional[str] = Field(default="inspector", description="Type of recipient")
    
    # Related data
    related_item_id: Optional[str] = Field(description="ID of related item (e.g., event ID, PSV tag)")
    related_item_type: Optional[str] = Field(description="Type of related item (e.g., 'maintenance_event', 'psv')")
    action_url: Optional[str] = Field(description="URL to navigate to when notification is clicked")
    
    # Extra data
    extra_data: Optional[dict] = Field(default={}, sa_column=Column(JSON), description="Additional notification data")
    
    # Timestamps
    created_at: datetime = Field(default_factory=datetime.utcnow)
    read_at: Optional[datetime] = None
    expires_at: Optional[datetime] = None
    
    # Relationships
    recipient: Optional["Inspector"] = Relationship(back_populates="notifications")

class NotificationPreference(SQLModel, table=True):
    """User notification preferences"""
    __tablename__ = "notification_preferences"
    
    id: Optional[int] = Field(default=None, primary_key=True)
    inspector_id: int = Field(foreign_key="inspectors.id")
    
    # Notification type preferences
    event_created: bool = Field(default=True)
    event_updated: bool = Field(default=True)
    event_deleted: bool = Field(default=True)
    event_status_changed: bool = Field(default=True)
    event_approved: bool = Field(default=True)
    event_approval_reverted: bool = Field(default=True)
    sub_event_created: bool = Field(default=True)
    sub_event_updated: bool = Field(default=True)
    sub_event_status_changed: bool = Field(default=True)
    inspection_created: bool = Field(default=True)
    inspection_completed: bool = Field(default=True)
    inspection_updated: bool = Field(default=True)
    bulk_inspections_planned: bool = Field(default=True)
    calibration_due: bool = Field(default=True)
    calibration_overdue: bool = Field(default=True)
    rbi_change: bool = Field(default=True)
    psv_update: bool = Field(default=True)
    system_alert: bool = Field(default=True)
    task_complete: bool = Field(default=True)
    
    # Delivery preferences
    web_notifications: bool = Field(default=True)
    email_notifications: bool = Field(default=False)
    push_notifications: bool = Field(default=False)
    
    # Timing preferences
    calibration_reminder_days: int = Field(default=30, description="Days before calibration due to notify")
    daily_summary: bool = Field(default=True)
    summary_time: str = Field(default="09:00", description="Time for daily summary")
    
    # Sound settings
    sound_enabled: bool = Field(default=True)
    sound_volume: str = Field(default="medium", description="low, medium, high")
    
    # Timestamps
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    
    # Relationships
    inspector: "Inspector" = Relationship(back_populates="notification_preferences")

# Import at the end to avoid circular imports
from app.domains.inspector.models.inspector import Inspector