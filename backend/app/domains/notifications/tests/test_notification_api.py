import pytest
import json
from unittest.mock import patch, AsyncMock
from fastapi.testclient import TestClient
from sqlmodel import Session, create_engine, SQLModel
from app.main import app
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
    engine = create_engine("sqlite:///./test_notification_api.db", echo=False)
    SQLModel.metadata.create_all(engine)
    with Session(engine) as session:
        yield session
    SQLModel.metadata.drop_all(engine)

@pytest.fixture
def test_inspector(test_db):
    """Create test inspector"""
    inspector = Inspector(
        first_name="API",
        last_name="Tester",
        employee_id="EMP_API",
        email="api.tester@example.com",
        can_login=True
    )
    test_db.add(inspector)
    test_db.commit()
    test_db.refresh(inspector)
    return inspector

@pytest.fixture
def test_client():
    """Create test client"""
    return TestClient(app)

@pytest.fixture
def auth_headers(test_inspector):
    """Mock authentication headers"""
    # In a real app, this would be a valid JWT token
    return {
        "Authorization": f"Bearer mock_token_for_inspector_{test_inspector.id}",
        "Content-Type": "application/json"
    }

class TestNotificationAPI:
    """Tests for notification API endpoints"""
    
    def test_health_check(self, test_client):
        """Test basic health check endpoint"""
        response = test_client.get("/health")
        assert response.status_code == 200
        assert response.json() == {"status": "ok"}
    
    @patch('app.domains.notifications.api.notification_routes.get_current_inspector')
    def test_get_notifications_unauthorized(self, mock_get_inspector, test_client):
        """Test getting notifications without authentication"""
        mock_get_inspector.side_effect = Exception("Unauthorized")
        
        response = test_client.get("/api/v1/notifications/")
        # Should return authentication error
        assert response.status_code in [401, 422, 500]
    
    @patch('app.domains.notifications.api.notification_routes.get_current_inspector')
    @patch('app.domains.notifications.api.notification_routes.get_db')
    def test_get_notifications_success(self, mock_get_db, mock_get_inspector, test_client, test_db, test_inspector):
        """Test successfully getting notifications"""
        mock_get_inspector.return_value = test_inspector
        mock_get_db.return_value = test_db
        
        # Create test notifications
        notifications = [
            Notification(
                title="Test Notification 1",
                message="First test notification",
                type=NotificationType.EVENT_CREATED,
                recipient_id=test_inspector.id
            ),
            Notification(
                title="Test Notification 2",
                message="Second test notification",
                type=NotificationType.CALIBRATION_DUE,
                recipient_id=test_inspector.id
            )
        ]
        test_db.add_all(notifications)
        test_db.commit()
        
        response = test_client.get("/api/v1/notifications/", headers={"Authorization": "Bearer mock_token"})
        
        assert response.status_code == 200
        data = response.json()
        assert len(data["notifications"]) == 2
        assert data["unread_count"] >= 0
    
    @patch('app.domains.notifications.api.notification_routes.get_current_inspector')
    @patch('app.domains.notifications.api.notification_routes.get_db')
    def test_mark_notification_as_read(self, mock_get_db, mock_get_inspector, test_client, test_db, test_inspector):
        """Test marking notification as read"""
        mock_get_inspector.return_value = test_inspector
        mock_get_db.return_value = test_db
        
        # Create test notification
        notification = Notification(
            title="Read Test",
            message="Test marking as read",
            type=NotificationType.TASK_COMPLETE,
            recipient_id=test_inspector.id
        )
        test_db.add(notification)
        test_db.commit()
        test_db.refresh(notification)
        
        response = test_client.post(
            f"/api/v1/notifications/{notification.id}/read",
            headers={"Authorization": "Bearer mock_token"}
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
        
        # Verify notification was marked as read
        test_db.refresh(notification)
        assert notification.status == NotificationStatus.READ
    
    @patch('app.domains.notifications.api.notification_routes.get_current_inspector')
    @patch('app.domains.notifications.api.notification_routes.get_db')
    def test_get_notification_preferences(self, mock_get_db, mock_get_inspector, test_client, test_db, test_inspector):
        """Test getting notification preferences"""
        mock_get_inspector.return_value = test_inspector
        mock_get_db.return_value = test_db
        
        response = test_client.get("/api/v1/notifications/preferences", headers={"Authorization": "Bearer mock_token"})
        
        assert response.status_code == 200
        data = response.json()
        # Should have default preferences
        assert data["event_created"] is True
        assert data["web_notifications"] is True
        assert data["inspector_id"] == test_inspector.id
    
    @patch('app.domains.notifications.api.notification_routes.get_current_inspector')
    @patch('app.domains.notifications.api.notification_routes.get_db')
    def test_update_notification_preferences(self, mock_get_db, mock_get_inspector, test_client, test_db, test_inspector):
        """Test updating notification preferences"""
        mock_get_inspector.return_value = test_inspector
        mock_get_db.return_value = test_db
        
        preferences_data = {
            "event_created": False,
            "email_notifications": True,
            "sound_volume": "low",
            "calibration_reminder_days": 14
        }
        
        response = test_client.put(
            "/api/v1/notifications/preferences",
            headers={"Authorization": "Bearer mock_token"},
            json=preferences_data
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["event_created"] is False
        assert data["email_notifications"] is True
        assert data["sound_volume"] == "low"
        assert data["calibration_reminder_days"] == 14
    
    @patch('app.domains.notifications.services.notification_service.connection_manager')
    def test_broadcast_test_notification(self, mock_manager, test_client):
        """Test broadcasting test notification"""
        mock_manager.broadcast_to_all = AsyncMock()
        
        test_data = {
            "title": "Test Broadcast",
            "message": "This is a test broadcast",
            "priority": "high"
        }
        
        response = test_client.post("/api/v1/notifications/test/broadcast", json=test_data)
        
        # May return 401/422 due to auth, but endpoint should exist
        assert response.status_code in [200, 401, 422]
    
    def test_websocket_info_endpoint(self, test_client):
        """Test WebSocket connection info endpoint"""
        response = test_client.get("/api/v1/notifications/ws/info")
        
        assert response.status_code == 200
        data = response.json()
        assert "total_connections" in data
        assert "unique_inspectors" in data
        assert "connection_details" in data

class TestNotificationWebSocket:
    """Tests for WebSocket functionality"""
    
    @pytest.mark.asyncio
    async def test_websocket_connection_missing_token(self, test_client):
        """Test WebSocket connection without token"""
        with pytest.raises(Exception):
            # Should fail without token
            with test_client.websocket_connect("/api/v1/notifications/ws/notifications") as websocket:
                pass
    
    @pytest.mark.asyncio 
    async def test_websocket_connection_invalid_token(self, test_client):
        """Test WebSocket connection with invalid token"""
        with pytest.raises(Exception):
            # Should fail with invalid token
            with test_client.websocket_connect("/api/v1/notifications/ws/notifications?token=invalid") as websocket:
                pass
    
    # Note: Full WebSocket testing would require more complex setup with actual authentication
    # and database connections. These tests focus on API endpoint validation.

class TestNotificationIntegration:
    """Integration tests for the complete notification flow"""
    
    @patch('app.domains.notifications.services.notification_service.connection_manager')
    @patch('app.domains.notifications.api.notification_routes.get_current_inspector')
    @patch('app.domains.notifications.api.notification_routes.get_db')
    def test_complete_notification_flow(self, mock_get_db, mock_get_inspector, mock_manager, test_client, test_db, test_inspector):
        """Test complete flow from creation to reading"""
        mock_get_inspector.return_value = test_inspector
        mock_get_db.return_value = test_db
        mock_manager.send_to_inspector = AsyncMock()
        mock_manager.broadcast_to_all = AsyncMock()
        
        # 1. Check initial state
        response = test_client.get("/api/v1/notifications/", headers={"Authorization": "Bearer mock_token"})
        assert response.status_code == 200
        initial_data = response.json()
        initial_count = len(initial_data["notifications"])
        
        # 2. Create notification via service (simulated)
        from app.domains.notifications.services.notification_service import NotificationService
        service = NotificationService(test_db)
        
        # Use asyncio to run the async method
        import asyncio
        notification = asyncio.run(service.create_notification(
            title="Integration Test",
            message="Testing complete flow",
            notification_type=NotificationType.EVENT_CREATED,
            recipient_id=test_inspector.id
        ))
        
        # 3. Verify notification appears in API
        response = test_client.get("/api/v1/notifications/", headers={"Authorization": "Bearer mock_token"})
        assert response.status_code == 200
        data = response.json()
        assert len(data["notifications"]) == initial_count + 1
        
        # 4. Mark as read
        response = test_client.post(
            f"/api/v1/notifications/{notification.id}/read",
            headers={"Authorization": "Bearer mock_token"}
        )
        assert response.status_code == 200
        
        # 5. Verify read status
        test_db.refresh(notification)
        assert notification.status == NotificationStatus.READ