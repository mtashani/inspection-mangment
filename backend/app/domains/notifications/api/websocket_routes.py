import logging
from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Depends, Query
from sqlmodel import Session
from app.database import get_session
from app.domains.notifications.services.websocket_manager import connection_manager
from app.domains.auth.services.auth_service import AuthService
from typing import Optional

logger = logging.getLogger(__name__)

router = APIRouter()

@router.websocket("/ws/notifications")
async def websocket_notifications_endpoint(
    websocket: WebSocket,
    token: Optional[str] = Query(None),
    session_id: Optional[str] = Query(None),
    db: Session = Depends(get_session)
):
    """WebSocket endpoint for real-time notifications"""
    
    inspector = None
    
    try:
        # Authenticate the WebSocket connection
        if not token:
            logger.warning("No authentication token provided")
            await websocket.close(code=4001, reason="Authentication token required")
            return
        
        # Validate JWT token
        inspector = AuthService.get_current_inspector(db, token)
        if not inspector:
            logger.warning(f"Invalid JWT token provided: {token[:20]}...")
            await websocket.close(code=4001, reason="Invalid authentication token")
            return
        
        logger.info(f"WebSocket connection authenticated for inspector {inspector.id} ({inspector.first_name} {inspector.last_name})")
        
        # Connect the WebSocket
        await connection_manager.connect(websocket, inspector.id, session_id)
        
        # Keep the connection alive and handle messages
        while True:
            try:
                # Wait for messages from the client
                message = await websocket.receive_text()
                await connection_manager.handle_message(websocket, message)
                
            except WebSocketDisconnect:
                logger.info(f"WebSocket disconnected for inspector {inspector.id}")
                break
            except Exception as e:
                logger.error(f"Error in WebSocket communication: {e}")
                await websocket.close(code=1011, reason="Internal server error")
                break
                
    except Exception as e:
        logger.error(f"WebSocket connection error: {e}")
        if websocket.client_state.CONNECTED:
            await websocket.close(code=1011, reason="Connection error")
    finally:
        # Clean up the connection
        connection_manager.disconnect(websocket)

@router.get("/ws/stats")
async def get_websocket_stats():
    """Get WebSocket connection statistics"""
    return {
        "connected_inspectors": connection_manager.get_connected_inspectors(),
        "total_connections": connection_manager.get_connection_count(),
        "inspector_connections": {
            inspector_id: connection_manager.get_inspector_connection_count(inspector_id)
            for inspector_id in connection_manager.get_connected_inspectors()
        }
    }