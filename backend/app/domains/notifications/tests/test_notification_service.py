import pytest
import asyncio
from unittest.mock import AsyncMock, MagicMock, patch
from datetime import datetime
from sqlmodel import Session, create_engine, SQLModel
from app.domains.notifications.services.notification_service import NotificationService
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
    engine = create_engine("sqlite:///./test_notification_service.db", echo=False)
    SQLModel.metadata.create_all(engine)
    with Session(engine) as session:
        yield session
    # Clean up
    SQLModel.metadata.drop_all(engine)

@pytest.fixture
def test_inspector(test_db):
    """Create test inspector"""
    inspector = Inspector(
        first_name="Alice",
        last_name="Smith",
        employee_id="EMP002",
        email="alice.smith@example.com",
        can_login=True
    )
    test_db.add(inspector)
    test_db.commit()
    test_db.refresh(inspector)
    return inspector

@pytest.fixture
def notification_service(test_db):
    """Create notification service instance"""
    return NotificationService(test_db)

class TestNotificationService:
    """Tests for NotificationService"""
    
    @pytest.mark.asyncio
    async def test_create_notification(self, notification_service, test_inspector):
        """Test creating a notification through the service"""
        with patch('app.domains.notifications.services.notification_service.connection_manager') as mock_manager:
            mock_manager.send_to_inspector = AsyncMock()
            
            notification = await notification_service.create_notification(
                title="Service Test",
                message="Testing notification service",
                notification_type=NotificationType.EVENT_CREATED,
                priority=NotificationPriority.HIGH,
                recipient_id=test_inspector.id,
                related_item_id="456",
                related_item_type="test_event",
                action_url="/test/456",
                extra_data={"test": True},
                expires_in_days=5
            )
            
            assert notification.id is not None
            assert notification.title == "Service Test"
            assert notification.priority == NotificationPriority.HIGH
            assert notification.recipient_id == test_inspector.id
            assert notification.extra_data["test"] is True
            assert notification.expires_at is not None
            
            # Verify WebSocket broadcast was called
            mock_manager.send_to_inspector.assert_called_once()
    
    @pytest.mark.asyncio
    async def test_broadcast_event_created(self, notification_service):
        """Test broadcasting event created notification"""
        with patch('app.domains.notifications.services.notification_service.connection_manager') as mock_manager:
            mock_manager.broadcast_to_all = AsyncMock()
            
            await notification_service.broadcast_event_created(
                event_id=123,
                event_number="ME-2024-001",
                event_title="Pump Maintenance",
                created_by="John Doe",
                event_type="scheduled"
            )
            
            # Verify notification was created
            notifications = notification_service.db.query(Notification).all()
            assert len(notifications) == 1
            
            notification = notifications[0]
            assert notification.type == NotificationType.EVENT_CREATED
            assert notification.title == "🔧 New Maintenance Event Created"
            assert "ME-2024-001" in notification.message
            assert "Pump Maintenance" in notification.message
            assert notification.action_url == "/maintenance/events/123"
            
            # Verify WebSocket broadcast was called
            mock_manager.broadcast_to_all.assert_called_once()
    
    @pytest.mark.asyncio
    async def test_broadcast_event_updated(self, notification_service):
        """Test broadcasting event updated notification"""
        with patch('app.domains.notifications.services.notification_service.connection_manager') as mock_manager:
            mock_manager.broadcast_to_all = AsyncMock()
            
            await notification_service.broadcast_event_updated(
                event_id=456,
                event_number="ME-2024-002",
                event_title="Tank Inspection",
                updated_by="Jane Smith",
                changes=["status", "priority"]
            )
            
            notifications = notification_service.db.query(Notification).all()
            assert len(notifications) == 1
            
            notification = notifications[0]
            assert notification.type == NotificationType.EVENT_UPDATED
            assert notification.title == "📝 Maintenance Event Updated"
            assert "status, priority" in notification.message
            
            mock_manager.broadcast_to_all.assert_called_once()
    
    @pytest.mark.asyncio
    async def test_broadcast_event_status_changed(self, notification_service):
        """Test broadcasting status change notification"""
        with patch('app.domains.notifications.services.notification_service.connection_manager') as mock_manager:
            mock_manager.broadcast_to_all = AsyncMock()
            
            await notification_service.broadcast_event_status_changed(
                event_id=789,
                event_number="ME-2024-003",
                event_title="Valve Repair",
                old_status="planned",
                new_status="completed",
                changed_by="Bob Wilson"
            )
            
            notifications = notification_service.db.query(Notification).all()
            assert len(notifications) == 1
            
            notification = notifications[0]
            assert notification.type == NotificationType.EVENT_STATUS_CHANGED
            assert notification.priority == NotificationPriority.HIGH  # Completed status
            assert "planned" in notification.message
            assert "completed" in notification.message
            
            mock_manager.broadcast_to_all.assert_called_once()
    
    def test_get_notifications_for_inspector(self, notification_service, test_inspector):
        """Test getting notifications for specific inspector"""
        # Create targeted notification
        targeted_notification = Notification(
            title="Personal Notification",
            message="This is for you",
            type=NotificationType.TASK_COMPLETE,
            recipient_id=test_inspector.id
        )
        
        # Create broadcast notification
        broadcast_notification = Notification(
            title="Broadcast Notification",
            message="This is for everyone",
            type=NotificationType.SYSTEM_ALERT,
            recipient_id=None
        )
        
        # Create notification for another inspector
        other_notification = Notification(
            title="Other Notification",
            message="This is for someone else",
            type=NotificationType.EVENT_CREATED,
            recipient_id=999  # Different inspector
        )
        
        notification_service.db.add_all([targeted_notification, broadcast_notification, other_notification])
        notification_service.db.commit()
        
        # Get notifications for test inspector
        notifications = notification_service.get_notifications_for_inspector(test_inspector.id)
        
        # Should get targeted + broadcast, but not other
        assert len(notifications) == 2
        titles = [n.title for n in notifications]
        assert "Personal Notification" in titles
        assert "Broadcast Notification" in titles
        assert "Other Notification" not in titles
    
    def test_mark_notification_as_read(self, notification_service, test_inspector):
        """Test marking notification as read"""
        notification = Notification(
            title="Read Test",
            message="Test reading",
            type=NotificationType.CALIBRATION_DUE,
            recipient_id=test_inspector.id
        )
        
        notification_service.db.add(notification)
        notification_service.db.commit()
        notification_service.db.refresh(notification)
        
        # Mark as read
        success = notification_service.mark_notification_as_read(notification.id, test_inspector.id)
        assert success is True
        
        # Verify status changed
        notification_service.db.refresh(notification)
        assert notification.status == NotificationStatus.READ
        assert notification.read_at is not None
    
    def test_mark_notification_as_read_wrong_inspector(self, notification_service, test_inspector):
        """Test marking notification as read with wrong inspector"""
        notification = Notification(
            title="Wrong Inspector Test",
            message="Test wrong inspector",
            type=NotificationType.EVENT_CREATED,
            recipient_id=999  # Different inspector
        )
        
        notification_service.db.add(notification)
        notification_service.db.commit()
        notification_service.db.refresh(notification)
        
        # Try to mark as read with wrong inspector
        success = notification_service.mark_notification_as_read(notification.id, test_inspector.id)
        assert success is False
        
        # Verify status unchanged
        notification_service.db.refresh(notification)
        assert notification.status == NotificationStatus.UNREAD
    
    def test_get_unread_count(self, notification_service, test_inspector):
        """Test getting unread notification count"""
        # Create mix of read and unread notifications
        notifications = [
            Notification(
                title="Unread 1",
                message="Unread notification 1",
                type=NotificationType.EVENT_CREATED,
                recipient_id=test_inspector.id,
                status=NotificationStatus.UNREAD
            ),
            Notification(
                title="Unread 2",
                message="Unread notification 2",
                type=NotificationType.CALIBRATION_DUE,
                recipient_id=test_inspector.id,
                status=NotificationStatus.UNREAD
            ),
            Notification(
                title="Read 1",
                message="Read notification 1",
                type=NotificationType.TASK_COMPLETE,
                recipient_id=test_inspector.id,
                status=NotificationStatus.READ
            ),
            Notification(
                title="Broadcast Unread",
                message="Broadcast unread",
                type=NotificationType.SYSTEM_ALERT,
                recipient_id=None,
                status=NotificationStatus.UNREAD
            )
        ]
        
        notification_service.db.add_all(notifications)
        notification_service.db.commit()
        
        unread_count = notification_service.get_unread_count(test_inspector.id)
        assert unread_count == 3  # 2 targeted + 1 broadcast
    
    def test_get_or_create_preferences(self, notification_service, test_inspector):
        """Test getting or creating notification preferences"""
        # First call should create preferences
        preferences = notification_service.get_or_create_preferences(test_inspector.id)
        assert preferences.inspector_id == test_inspector.id
        assert preferences.event_created is True  # Default value
        
        # Second call should return existing preferences
        preferences2 = notification_service.get_or_create_preferences(test_inspector.id)
        assert preferences.id == preferences2.id
    
    def test_update_preferences(self, notification_service, test_inspector):
        """Test updating notification preferences"""
        # Create initial preferences
        preferences = notification_service.get_or_create_preferences(test_inspector.id)
        original_updated_at = preferences.updated_at
        
        # Update preferences
        updates = {
            "event_created": False,
            "email_notifications": True,
            "sound_volume": "low",
            "calibration_reminder_days": 7
        }
        
        updated_preferences = notification_service.update_preferences(test_inspector.id, updates)
        
        assert updated_preferences.event_created is False
        assert updated_preferences.email_notifications is True
        assert updated_preferences.sound_volume == "low"
        assert updated_preferences.calibration_reminder_days == 7
        assert updated_preferences.updated_at > original_updated_at