import pytest
import asyncio
import json
from unittest.mock import AsyncMock, MagicMock
from app.domains.notifications.services.websocket_manager import ConnectionManager
from fastapi import WebSocket

class MockWebSocket:
    """Mock WebSocket for testing"""
    
    def __init__(self, inspector_id: int):
        self.inspector_id = inspector_id
        self.messages = []
        self.closed = False
        
    async def send_text(self, data: str):
        """Mock send_text method"""
        if self.closed:
            raise Exception("WebSocket is closed")
        self.messages.append(data)
        
    async def close(self):
        """Mock close method"""
        self.closed = True

class TestConnectionManager:
    """Tests for WebSocket ConnectionManager"""
    
    @pytest.fixture
    def connection_manager(self):
        """Create fresh connection manager for each test"""
        return ConnectionManager()
    
    @pytest.mark.asyncio
    async def test_connect_inspector(self, connection_manager):
        """Test connecting an inspector"""
        mock_websocket = MockWebSocket(inspector_id=1)
        session_id = "test_session_1"
        
        await connection_manager.connect(mock_websocket, inspector_id=1, session_id=session_id)
        
        assert 1 in connection_manager.active_connections
        assert session_id in connection_manager.active_connections[1]
        assert connection_manager.active_connections[1][session_id]["websocket"] == mock_websocket
        assert connection_manager.active_connections[1][session_id]["connected_at"] is not None
    
    @pytest.mark.asyncio
    async def test_disconnect_inspector(self, connection_manager):
        """Test disconnecting an inspector"""
        mock_websocket = MockWebSocket(inspector_id=1)
        session_id = "test_session_1"
        
        # Connect first
        await connection_manager.connect(mock_websocket, inspector_id=1, session_id=session_id)
        assert 1 in connection_manager.active_connections
        
        # Disconnect
        await connection_manager.disconnect(mock_websocket)
        
        # Should be removed from active connections
        assert 1 not in connection_manager.active_connections or len(connection_manager.active_connections[1]) == 0
    
    @pytest.mark.asyncio
    async def test_multiple_sessions_same_inspector(self, connection_manager):
        """Test multiple sessions for the same inspector"""
        mock_websocket1 = MockWebSocket(inspector_id=1)
        mock_websocket2 = MockWebSocket(inspector_id=1)
        session_id1 = "session_1"
        session_id2 = "session_2"
        
        # Connect two sessions for same inspector
        await connection_manager.connect(mock_websocket1, inspector_id=1, session_id=session_id1)
        await connection_manager.connect(mock_websocket2, inspector_id=1, session_id=session_id2)
        
        # Both sessions should be tracked
        assert len(connection_manager.active_connections[1]) == 2
        assert session_id1 in connection_manager.active_connections[1]
        assert session_id2 in connection_manager.active_connections[1]
    
    @pytest.mark.asyncio
    async def test_send_to_inspector(self, connection_manager):
        """Test sending message to specific inspector"""
        mock_websocket = MockWebSocket(inspector_id=1)
        session_id = "test_session"
        
        await connection_manager.connect(mock_websocket, inspector_id=1, session_id=session_id)
        
        test_message = {"type": "test", "data": "hello"}
        await connection_manager.send_to_inspector(test_message, inspector_id=1)
        
        # Check message was sent
        assert len(mock_websocket.messages) == 1
        sent_message = json.loads(mock_websocket.messages[0])
        assert sent_message["type"] == "test"
        assert sent_message["data"] == "hello"
    
    @pytest.mark.asyncio
    async def test_send_to_nonexistent_inspector(self, connection_manager):
        """Test sending message to inspector that's not connected"""
        test_message = {"type": "test", "data": "hello"}
        
        # Should not raise exception, just log and continue
        await connection_manager.send_to_inspector(test_message, inspector_id=999)
    
    @pytest.mark.asyncio
    async def test_broadcast_to_all(self, connection_manager):
        """Test broadcasting message to all connected inspectors"""
        # Connect multiple inspectors
        mock_websocket1 = MockWebSocket(inspector_id=1)
        mock_websocket2 = MockWebSocket(inspector_id=2)
        mock_websocket3 = MockWebSocket(inspector_id=3)
        
        await connection_manager.connect(mock_websocket1, inspector_id=1, session_id="session_1")
        await connection_manager.connect(mock_websocket2, inspector_id=2, session_id="session_2")
        await connection_manager.connect(mock_websocket3, inspector_id=3, session_id="session_3")
        
        test_message = {"type": "broadcast", "message": "Hello everyone"}
        await connection_manager.broadcast_to_all(test_message)
        
        # All should receive the message
        for websocket in [mock_websocket1, mock_websocket2, mock_websocket3]:
            assert len(websocket.messages) == 1
            sent_message = json.loads(websocket.messages[0])
            assert sent_message["type"] == "broadcast"
            assert sent_message["message"] == "Hello everyone"
    
    @pytest.mark.asyncio
    async def test_send_to_inspector_multiple_sessions(self, connection_manager):
        """Test sending to inspector with multiple sessions"""
        mock_websocket1 = MockWebSocket(inspector_id=1)
        mock_websocket2 = MockWebSocket(inspector_id=1)
        
        await connection_manager.connect(mock_websocket1, inspector_id=1, session_id="session_1")
        await connection_manager.connect(mock_websocket2, inspector_id=1, session_id="session_2")
        
        test_message = {"type": "multi_session", "data": "test"}
        await connection_manager.send_to_inspector(test_message, inspector_id=1)
        
        # Both sessions should receive the message
        assert len(mock_websocket1.messages) == 1
        assert len(mock_websocket2.messages) == 1
        
        for websocket in [mock_websocket1, mock_websocket2]:
            sent_message = json.loads(websocket.messages[0])
            assert sent_message["type"] == "multi_session"
    
    @pytest.mark.asyncio
    async def test_handle_closed_websocket(self, connection_manager):
        """Test handling of closed WebSocket connections"""
        mock_websocket = MockWebSocket(inspector_id=1)
        session_id = "test_session"
        
        await connection_manager.connect(mock_websocket, inspector_id=1, session_id=session_id)
        
        # Close the websocket
        mock_websocket.closed = True
        
        # Try to send message - should handle exception gracefully
        test_message = {"type": "test", "data": "should fail"}
        await connection_manager.send_to_inspector(test_message, inspector_id=1)
        
        # Connection should be cleaned up
        assert 1 not in connection_manager.active_connections or len(connection_manager.active_connections[1]) == 0
    
    def test_get_connection_count(self, connection_manager):
        """Test getting connection count"""
        # Initially should be 0
        assert connection_manager.get_connection_count() == 0
        
        # Add some connections manually for testing
        connection_manager.active_connections[1] = {
            "session_1": {"websocket": MockWebSocket(1), "connected_at": "2024-01-01"},
            "session_2": {"websocket": MockWebSocket(1), "connected_at": "2024-01-01"}
        }
        connection_manager.active_connections[2] = {
            "session_1": {"websocket": MockWebSocket(2), "connected_at": "2024-01-01"}
        }
        
        assert connection_manager.get_connection_count() == 3
    
    def test_get_inspector_count(self, connection_manager):
        """Test getting unique inspector count"""
        # Initially should be 0
        assert connection_manager.get_inspector_count() == 0
        
        # Add connections for 2 unique inspectors
        connection_manager.active_connections[1] = {
            "session_1": {"websocket": MockWebSocket(1), "connected_at": "2024-01-01"},
            "session_2": {"websocket": MockWebSocket(1), "connected_at": "2024-01-01"}
        }
        connection_manager.active_connections[2] = {
            "session_1": {"websocket": MockWebSocket(2), "connected_at": "2024-01-01"}
        }
        
        assert connection_manager.get_inspector_count() == 2
    
    @pytest.mark.asyncio
    async def test_send_heartbeat(self, connection_manager):
        """Test sending heartbeat messages"""
        mock_websocket = MockWebSocket(inspector_id=1)
        session_id = "test_session"
        
        await connection_manager.connect(mock_websocket, inspector_id=1, session_id=session_id)
        await connection_manager.send_heartbeat()
        
        # Should receive ping message
        assert len(mock_websocket.messages) == 1
        sent_message = json.loads(mock_websocket.messages[0])
        assert sent_message["type"] == "ping"
        assert "timestamp" in sent_message
    
    def test_connection_metadata(self, connection_manager):
        """Test connection metadata tracking"""
        # Add connection with metadata
        mock_websocket = MockWebSocket(inspector_id=1)
        connection_manager.active_connections[1] = {
            "session_1": {
                "websocket": mock_websocket,
                "connected_at": "2024-01-01T10:00:00",
                "metadata": {
                    "user_agent": "Mozilla/5.0",
                    "ip_address": "192.168.1.1"
                }
            }
        }
        
        connections = connection_manager.get_connection_info()
        assert "inspector_1" in connections
        assert connections["inspector_1"]["sessions"][0]["metadata"]["user_agent"] == "Mozilla/5.0"