import pytest
from datetime import datetime, timedelta
from sqlmodel import Session, create_engine, SQLModel
from app.domains.notifications.models.notification import (
    Notification,
    NotificationPreference,
    NotificationType,
    NotificationPriority,
    NotificationStatus
)
from app.domains.inspector.models.inspector import Inspector

# Test database setup
@pytest.fixture
def test_db():
    """Create test database"""
    engine = create_engine("sqlite:///./test_notifications.db", echo=False)
    SQLModel.metadata.create_all(engine)
    with Session(engine) as session:
        yield session
    # Clean up
    SQLModel.metadata.drop_all(engine)

@pytest.fixture
def test_inspector(test_db):
    """Create test inspector"""
    inspector = Inspector(
        first_name="John",
        last_name="Doe",
        employee_id="EMP001",
        email="john.doe@example.com",
        can_login=True
    )
    test_db.add(inspector)
    test_db.commit()
    test_db.refresh(inspector)
    return inspector

class TestNotificationModel:
    """Tests for Notification model"""
    
    def test_create_notification(self, test_db, test_inspector):
        """Test creating a basic notification"""
        notification = Notification(
            title="Test Notification",
            message="This is a test notification",
            type=NotificationType.EVENT_CREATED,
            priority=NotificationPriority.MEDIUM,
            recipient_id=test_inspector.id,
            related_item_id="123",
            related_item_type="maintenance_event",
            action_url="/events/123",
            extra_data={"event_id": 123, "event_type": "maintenance"}
        )
        
        test_db.add(notification)
        test_db.commit()
        test_db.refresh(notification)
        
        assert notification.id is not None
        assert notification.title == "Test Notification"
        assert notification.type == NotificationType.EVENT_CREATED
        assert notification.priority == NotificationPriority.MEDIUM
        assert notification.status == NotificationStatus.UNREAD
        assert notification.recipient_id == test_inspector.id
        assert notification.extra_data["event_id"] == 123
        assert notification.created_at is not None
        
    def test_broadcast_notification(self, test_db):
        """Test creating a broadcast notification (no specific recipient)"""
        notification = Notification(
            title="System Maintenance",
            message="Scheduled system maintenance at 2 AM",
            type=NotificationType.SYSTEM_ALERT,
            priority=NotificationPriority.HIGH,
            recipient_id=None  # Broadcast
        )
        
        test_db.add(notification)
        test_db.commit()
        test_db.refresh(notification)
        
        assert notification.recipient_id is None
        assert notification.priority == NotificationPriority.HIGH
        
    def test_notification_expiration(self, test_db):
        """Test notification with expiration"""
        future_date = datetime.utcnow() + timedelta(days=7)
        
        notification = Notification(
            title="Expiring Notification",
            message="This notification will expire",
            type=NotificationType.CALIBRATION_DUE,
            expires_at=future_date
        )
        
        test_db.add(notification)
        test_db.commit()
        test_db.refresh(notification)
        
        assert notification.expires_at == future_date
        
    def test_mark_as_read(self, test_db, test_inspector):
        """Test marking notification as read"""
        notification = Notification(
            title="Test Read",
            message="Test marking as read",
            type=NotificationType.TASK_COMPLETE,
            recipient_id=test_inspector.id
        )
        
        test_db.add(notification)
        test_db.commit()
        test_db.refresh(notification)
        
        # Initially unread
        assert notification.status == NotificationStatus.UNREAD
        assert notification.read_at is None
        
        # Mark as read
        read_time = datetime.utcnow()
        notification.status = NotificationStatus.READ
        notification.read_at = read_time
        
        test_db.add(notification)
        test_db.commit()
        test_db.refresh(notification)
        
        assert notification.status == NotificationStatus.READ
        assert notification.read_at == read_time

class TestNotificationPreference:
    """Tests for NotificationPreference model"""
    
    def test_create_default_preferences(self, test_db, test_inspector):
        """Test creating default notification preferences"""
        preferences = NotificationPreference(
            inspector_id=test_inspector.id
        )
        
        test_db.add(preferences)
        test_db.commit()
        test_db.refresh(preferences)
        
        # Check default values
        assert preferences.inspector_id == test_inspector.id
        assert preferences.event_created is True
        assert preferences.web_notifications is True
        assert preferences.email_notifications is False
        assert preferences.calibration_reminder_days == 30
        assert preferences.sound_enabled is True
        assert preferences.sound_volume == "medium"
        
    def test_update_preferences(self, test_db, test_inspector):
        """Test updating notification preferences"""
        preferences = NotificationPreference(
            inspector_id=test_inspector.id,
            event_created=False,
            email_notifications=True,
            calibration_reminder_days=14,
            sound_volume="high"
        )
        
        test_db.add(preferences)
        test_db.commit()
        test_db.refresh(preferences)
        
        assert preferences.event_created is False
        assert preferences.email_notifications is True
        assert preferences.calibration_reminder_days == 14
        assert preferences.sound_volume == "high"

class TestNotificationEnums:
    """Tests for notification enums"""
    
    def test_notification_types(self):
        """Test notification type enum values"""
        assert NotificationType.EVENT_CREATED == "event_created"
        assert NotificationType.CALIBRATION_DUE == "calibration_due"
        assert NotificationType.SYSTEM_ALERT == "system_alert"
        
    def test_notification_priorities(self):
        """Test notification priority enum values"""
        assert NotificationPriority.LOW == "low"
        assert NotificationPriority.MEDIUM == "medium"
        assert NotificationPriority.HIGH == "high"
        assert NotificationPriority.CRITICAL == "critical"
        
    def test_notification_status(self):
        """Test notification status enum values"""
        assert NotificationStatus.UNREAD == "unread"
        assert NotificationStatus.READ == "read"
        assert NotificationStatus.ARCHIVED == "archived"
        assert NotificationStatus.DISMISSED == "dismissed"