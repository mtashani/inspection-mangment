import asyncio
import json
import logging
from typing import Dict, Set, Optional, Any, List
from fastapi import WebSocket, WebSocketDisconnect
from datetime import datetime
import uuid

logger = logging.getLogger(__name__)

class ConnectionManager:
    """WebSocket connection manager for real-time notifications"""
    
    def __init__(self):
        # Store active connections by inspector ID
        self.active_connections: Dict[int, Set[WebSocket]] = {}
        # Store connection metadata
        self.connection_metadata: Dict[WebSocket, Dict[str, Any]] = {}
        
    async def connect(self, websocket: WebSocket, inspector_id: int, session_id: Optional[str] = None):
        """Connect a new WebSocket for an inspector"""
        await websocket.accept()
        
        # Add to active connections
        if inspector_id not in self.active_connections:
            self.active_connections[inspector_id] = set()
        self.active_connections[inspector_id].add(websocket)
        
        # Store metadata
        self.connection_metadata[websocket] = {
            "inspector_id": inspector_id,
            "session_id": session_id or str(uuid.uuid4()),
            "connected_at": datetime.utcnow(),
            "last_ping": datetime.utcnow()
        }
        
        logger.info(f"Inspector {inspector_id} connected via WebSocket. Session: {session_id}")
        
        # Send connection confirmation
        await self.send_personal_message({
            "type": "connection_established",
            "message": "Successfully connected to notification service",
            "session_id": session_id,
            "timestamp": datetime.utcnow().isoformat()
        }, websocket)
    
    def disconnect(self, websocket: WebSocket):
        """Disconnect a WebSocket"""
        if websocket in self.connection_metadata:
            metadata = self.connection_metadata[websocket]
            inspector_id = metadata["inspector_id"]
            session_id = metadata["session_id"]
            
            # Remove from active connections
            if inspector_id in self.active_connections:
                self.active_connections[inspector_id].discard(websocket)
                if not self.active_connections[inspector_id]:
                    del self.active_connections[inspector_id]
            
            # Remove metadata
            del self.connection_metadata[websocket]
            
            logger.info(f"Inspector {inspector_id} disconnected from WebSocket. Session: {session_id}")
    
    async def send_personal_message(self, message: Dict[str, Any], websocket: WebSocket):
        """Send a message to a specific WebSocket connection"""
        try:
            await websocket.send_text(json.dumps(message, default=str))
        except Exception as e:
            logger.error(f"Failed to send personal message: {e}")
            self.disconnect(websocket)
    
    async def send_to_inspector(self, message: Dict[str, Any], inspector_id: int):
        """Send a message to all connections of a specific inspector"""
        if inspector_id in self.active_connections:
            disconnected_websockets = []
            for websocket in self.active_connections[inspector_id].copy():
                try:
                    await websocket.send_text(json.dumps(message, default=str))
                except Exception as e:
                    logger.error(f"Failed to send message to inspector {inspector_id}: {e}")
                    disconnected_websockets.append(websocket)
            
            # Clean up disconnected websockets
            for websocket in disconnected_websockets:
                self.disconnect(websocket)
    
    async def broadcast_to_all(self, message: Dict[str, Any]):
        """Broadcast a message to all connected inspectors"""
        disconnected_websockets = []
        for inspector_id, websockets in self.active_connections.copy().items():
            for websocket in websockets.copy():
                try:
                    await websocket.send_text(json.dumps(message, default=str))
                except Exception as e:
                    logger.error(f"Failed to broadcast to inspector {inspector_id}: {e}")
                    disconnected_websockets.append(websocket)
        
        # Clean up disconnected websockets
        for websocket in disconnected_websockets:
            self.disconnect(websocket)
    
    async def broadcast_to_multiple(self, message: Dict[str, Any], inspector_ids: List[int]):
        """Broadcast a message to multiple specific inspectors"""
        for inspector_id in inspector_ids:
            await self.send_to_inspector(message, inspector_id)
    
    def get_connected_inspectors(self) -> List[int]:
        """Get list of currently connected inspector IDs"""
        return list(self.active_connections.keys())
    
    def get_connection_count(self) -> int:
        """Get total number of active connections"""
        return sum(len(websockets) for websockets in self.active_connections.values())
    
    def get_inspector_connection_count(self, inspector_id: int) -> int:
        """Get number of connections for a specific inspector"""
        return len(self.active_connections.get(inspector_id, set()))
    
    async def ping_all_connections(self):
        """Send ping to all connections for health check"""
        ping_message = {
            "type": "ping",
            "timestamp": datetime.utcnow().isoformat()
        }
        await self.broadcast_to_all(ping_message)
    
    async def handle_message(self, websocket: WebSocket, message: str):
        """Handle incoming WebSocket messages"""
        try:
            data = json.loads(message)
            message_type = data.get("type")
            
            if message_type == "pong":
                # Update last ping time
                if websocket in self.connection_metadata:
                    self.connection_metadata[websocket]["last_ping"] = datetime.utcnow()
            
            elif message_type == "subscribe":
                # Handle subscription to specific notification types
                await self.handle_subscription(websocket, data)
            
            elif message_type == "unsubscribe":
                # Handle unsubscription
                await self.handle_unsubscription(websocket, data)
            
            else:
                logger.warning(f"Unknown message type: {message_type}")
                
        except json.JSONDecodeError:
            logger.error(f"Invalid JSON message: {message}")
        except Exception as e:
            logger.error(f"Error handling WebSocket message: {e}")
    
    async def handle_subscription(self, websocket: WebSocket, data: Dict[str, Any]):
        """Handle notification subscription"""
        # Add subscription logic here if needed
        # For now, all inspectors receive all notifications
        await self.send_personal_message({
            "type": "subscription_confirmed",
            "topics": data.get("topics", []),
            "timestamp": datetime.utcnow().isoformat()
        }, websocket)
    
    async def handle_unsubscription(self, websocket: WebSocket, data: Dict[str, Any]):
        """Handle notification unsubscription"""
        # Add unsubscription logic here if needed
        await self.send_personal_message({
            "type": "unsubscription_confirmed",
            "topics": data.get("topics", []),
            "timestamp": datetime.utcnow().isoformat()
        }, websocket)

# Global connection manager instance
connection_manager = ConnectionManager()

# Health monitoring task
async def start_health_monitoring():
    """Start background health monitoring for WebSocket connections"""
    while True:
        try:
            # Ping all connections every 30 seconds
            await connection_manager.ping_all_connections()
            await asyncio.sleep(30)
        except Exception as e:
            logger.error(f"Health monitoring error: {e}")
            await asyncio.sleep(30)