import logging
import logging
from typing import Optional, List, Dict, Any
from sqlmodel import Session, select
from datetime import datetime, timedelta
from app.domains.notifications.models.notification import (
    Notification, 
    NotificationPreference, 
    NotificationType, 
    NotificationPriority, 
    NotificationStatus
)
from app.domains.notifications.services.websocket_manager import connection_manager
from app.domains.inspector.models.inspector import Inspector

logger = logging.getLogger(__name__)

class NotificationService:
    """Service for managing notifications and broadcasting"""
    
    def __init__(self, db: Session):
        self.db = db
    
    async def create_notification(
        self,
        title: str,
        message: str,
        notification_type: NotificationType,
        priority: NotificationPriority = NotificationPriority.MEDIUM,
        recipient_id: Optional[int] = None,
        related_item_id: Optional[str] = None,
        related_item_type: Optional[str] = None,
        action_url: Optional[str] = None,
        extra_data: Optional[Dict[str, Any]] = None,
        expires_in_days: Optional[int] = None
    ) -> Notification:
        """Create a new notification and broadcast it"""
        
        # Calculate expiration date
        expires_at = None
        if expires_in_days:
            expires_at = datetime.utcnow() + timedelta(days=expires_in_days)
        
        # Create notification record
        notification = Notification(
            title=title,
            message=message,
            type=notification_type,
            priority=priority,
            recipient_id=recipient_id,
            related_item_id=related_item_id,
            related_item_type=related_item_type,
            action_url=action_url,
            extra_data=extra_data or {},
            expires_at=expires_at
        )
        
        self.db.add(notification)
        self.db.commit()
        self.db.refresh(notification)
        
        logger.info(f"Created notification: {notification.id} - {notification.title}")
        
        # Broadcast the notification
        await self._broadcast_notification(notification)
        
        return notification
    
    async def broadcast_event_created(
        self,
        event_id: int,
        event_number: str,
        event_title: str,
        created_by: Optional[str] = None,
        event_type: Optional[str] = None
    ):
        """Broadcast notification when a new maintenance event is created"""
        
        title = "🔧 New Maintenance Event Created"
        message = f"Event {event_number}: {event_title} has been created"
        if created_by:
            message += f" by {created_by}"
        
        action_url = f"/maintenance/events/{event_id}"
        
        extra_data = {
            "event_id": event_id,
            "event_number": event_number,
            "event_title": event_title,
            "created_by": created_by,
            "event_type": event_type
        }
        
        # Create notification for all users (broadcast)
        await self.create_notification(
            title=title,
            message=message,
            notification_type=NotificationType.EVENT_CREATED,
            priority=NotificationPriority.MEDIUM,
            recipient_id=None,  # Broadcast to all
            related_item_id=str(event_id),
            related_item_type="maintenance_event",
            action_url=action_url,
            extra_data=extra_data,
            expires_in_days=30
        )
    
    async def broadcast_event_updated(
        self,
        event_id: int,
        event_number: str,
        event_title: str,
        updated_by: Optional[str] = None,
        changes: Optional[List[str]] = None
    ):
        """Broadcast notification when a maintenance event is updated"""
        
        title = "📝 Maintenance Event Updated"
        message = f"Event {event_number}: {event_title} has been updated"
        if updated_by:
            message += f" by {updated_by}"
        if changes:
            message += f". Changes: {', '.join(changes)}"
        
        action_url = f"/maintenance/events/{event_id}"
        
        extra_data = {
            "event_id": event_id,
            "event_number": event_number,
            "event_title": event_title,
            "updated_by": updated_by,
            "changes": changes or []
        }
        
        await self.create_notification(
            title=title,
            message=message,
            notification_type=NotificationType.EVENT_UPDATED,
            priority=NotificationPriority.LOW,
            recipient_id=None,
            related_item_id=str(event_id),
            related_item_type="maintenance_event",
            action_url=action_url,
            extra_data=extra_data,
            expires_in_days=7
        )
    
    async def broadcast_event_status_changed(
        self,
        event_id: int,
        event_number: str,
        event_title: str,
        old_status: str,
        new_status: str,
        changed_by: Optional[str] = None
    ):
        """Broadcast notification when event status changes"""
        
        title = "🔄 Event Status Changed"
        message = f"Event {event_number}: {event_title} status changed from {old_status} to {new_status}"
        if changed_by:
            message += f" by {changed_by}"
        
        # Determine priority based on status change
        priority = NotificationPriority.MEDIUM
        if new_status.lower() in ["completed", "cancelled"]:
            priority = NotificationPriority.HIGH
        elif new_status.lower() == "inprogress":
            priority = NotificationPriority.MEDIUM
        
        action_url = f"/maintenance/events/{event_id}"
        
        extra_data = {
            "event_id": event_id,
            "event_number": event_number,
            "event_title": event_title,
            "old_status": old_status,
            "new_status": new_status,
            "changed_by": changed_by
        }
        
        await self.create_notification(
            title=title,
            message=message,
            notification_type=NotificationType.EVENT_STATUS_CHANGED,
            priority=priority,
            recipient_id=None,
            related_item_id=str(event_id),
            related_item_type="maintenance_event",
            action_url=action_url,
            extra_data=extra_data,
            expires_in_days=14
        )
    
    async def broadcast_sub_event_created(
        self,
        sub_event_id: int,
        sub_event_number: str,
        sub_event_title: str,
        parent_event_id: int,
        parent_event_number: str,
        parent_event_title: str,
        created_by: Optional[str] = None,
        sub_type: Optional[str] = None
    ):
        """Broadcast notification when a new maintenance sub-event is created"""
        
        title = "🔧 New Sub-Event Created"
        message = f"Sub-event {sub_event_number}: {sub_event_title} has been created for event {parent_event_number}"
        if created_by:
            message += f" by {created_by}"
        
        action_url = f"/maintenance/events/{parent_event_id}"
        
        extra_data = {
            "sub_event_id": sub_event_id,
            "sub_event_number": sub_event_number,
            "sub_event_title": sub_event_title,
            "parent_event_id": parent_event_id,
            "parent_event_number": parent_event_number,
            "parent_event_title": parent_event_title,
            "created_by": created_by,
            "sub_type": sub_type
        }
        
        # Create notification for all users (broadcast)
        await self.create_notification(
            title=title,
            message=message,
            notification_type=NotificationType.SUB_EVENT_CREATED,
            priority=NotificationPriority.MEDIUM,
            recipient_id=None,  # Broadcast to all
            related_item_id=str(parent_event_id),  # Link to parent event for navigation
            related_item_type="maintenance_sub_event",
            action_url=action_url,
            extra_data=extra_data,
            expires_in_days=14
        )
    
    async def broadcast_inspection_created(
        self,
        inspection_id: int,
        inspection_number: str,
        equipment_tag: str,
        event_id: Optional[int] = None,
        event_number: Optional[str] = None,
        sub_event_id: Optional[int] = None,
        sub_event_number: Optional[str] = None,
        created_by: Optional[str] = None,
        inspection_type: Optional[str] = None,
        is_planned: bool = True
    ):
        """Broadcast notification when a new inspection is created"""
        
        if is_planned:
            title = "📋 New Planned Inspection"
            message = f"Planned inspection {inspection_number} for equipment {equipment_tag} has been created"
        else:
            title = "⚡ Unplanned Inspection Added"
            message = f"Unplanned inspection {inspection_number} for equipment {equipment_tag} has been added"
        
        if created_by:
            message += f" by {created_by}"
        
        # Build context information
        if sub_event_id and sub_event_number:
            message += f" for sub-event {sub_event_number}"
            action_url = f"/maintenance/events/{event_id}"  # Navigate to parent event
        elif event_id and event_number:
            message += f" for event {event_number}"
            action_url = f"/maintenance/events/{event_id}"
        else:
            action_url = f"/inspections/{inspection_id}"
        
        extra_data = {
            "inspection_id": inspection_id,
            "inspection_number": inspection_number,
            "equipment_tag": equipment_tag,
            "event_id": event_id,
            "event_number": event_number,
            "sub_event_id": sub_event_id,
            "sub_event_number": sub_event_number,
            "created_by": created_by,
            "inspection_type": inspection_type,
            "is_planned": is_planned
        }
        
        priority = NotificationPriority.HIGH if not is_planned else NotificationPriority.MEDIUM
        
        await self.create_notification(
            title=title,
            message=message,
            notification_type=NotificationType.INSPECTION_CREATED,
            priority=priority,
            recipient_id=None,  # Broadcast to all
            related_item_id=str(inspection_id),
            related_item_type="inspection",
            action_url=action_url,
            extra_data=extra_data,
            expires_in_days=30
        )
    
    async def broadcast_inspection_completed(
        self,
        inspection_id: int,
        inspection_number: str,
        equipment_tag: str,
        event_id: Optional[int] = None,
        event_number: Optional[str] = None,
        completed_by: Optional[str] = None,
        completion_notes: Optional[str] = None
    ):
        """Broadcast notification when an inspection is completed"""
        
        title = "✅ Inspection Completed"
        message = f"Inspection {inspection_number} for equipment {equipment_tag} has been completed"
        
        if completed_by:
            message += f" by {completed_by}"
        
        if event_number:
            message += f" for event {event_number}"
            action_url = f"/maintenance/events/{event_id}"
        else:
            action_url = f"/inspections/{inspection_id}"
        
        extra_data = {
            "inspection_id": inspection_id,
            "inspection_number": inspection_number,
            "equipment_tag": equipment_tag,
            "event_id": event_id,
            "event_number": event_number,
            "completed_by": completed_by,
            "completion_notes": completion_notes
        }
        
        await self.create_notification(
            title=title,
            message=message,
            notification_type=NotificationType.INSPECTION_COMPLETED,
            priority=NotificationPriority.MEDIUM,
            recipient_id=None,  # Broadcast to all
            related_item_id=str(inspection_id),
            related_item_type="inspection",
            action_url=action_url,
            extra_data=extra_data,
            expires_in_days=14
        )
    
    async def broadcast_event_approved(
        self,
        event_id: int,
        event_number: str,
        event_title: str,
        approved_by: str,
        approval_date: Optional[datetime] = None
    ):
        """Broadcast notification when an event is approved"""
        
        title = "✅ Event Approved"
        message = f"Event {event_number}: {event_title} has been approved by {approved_by}"
        
        action_url = f"/maintenance/events/{event_id}"
        
        extra_data = {
            "event_id": event_id,
            "event_number": event_number,
            "event_title": event_title,
            "approved_by": approved_by,
            "approval_date": approval_date.isoformat() if approval_date else None
        }
        
        await self.create_notification(
            title=title,
            message=message,
            notification_type=NotificationType.EVENT_APPROVED,
            priority=NotificationPriority.HIGH,
            recipient_id=None,  # Broadcast to all
            related_item_id=str(event_id),
            related_item_type="maintenance_event",
            action_url=action_url,
            extra_data=extra_data,
            expires_in_days=30
        )
    
    async def broadcast_event_approval_reverted(
        self,
        event_id: int,
        event_number: str,
        event_title: str,
        reverted_by: str,
        previous_approver: Optional[str] = None
    ):
        """Broadcast notification when an event approval is reverted"""
        
        title = "↩️ Event Approval Reverted"
        message = f"Event {event_number}: {event_title} approval has been reverted by {reverted_by}"
        
        if previous_approver:
            message += f" (previously approved by {previous_approver})"
        
        action_url = f"/maintenance/events/{event_id}"
        
        extra_data = {
            "event_id": event_id,
            "event_number": event_number,
            "event_title": event_title,
            "reverted_by": reverted_by,
            "previous_approver": previous_approver
        }
        
        await self.create_notification(
            title=title,
            message=message,
            notification_type=NotificationType.EVENT_APPROVAL_REVERTED,
            priority=NotificationPriority.HIGH,
            recipient_id=None,  # Broadcast to all
            related_item_id=str(event_id),
            related_item_type="maintenance_event",
            action_url=action_url,
            extra_data=extra_data,
            expires_in_days=30
        )
    
    async def broadcast_sub_event_status_changed(
        self,
        sub_event_id: int,
        sub_event_number: str,
        sub_event_title: str,
        parent_event_id: int,
        parent_event_number: str,
        old_status: str,
        new_status: str,
        changed_by: Optional[str] = None
    ):
        """Broadcast notification when sub-event status changes"""
        
        title = "🔄 Sub-Event Status Changed"
        message = f"Sub-event {sub_event_number}: {sub_event_title} status changed from {old_status} to {new_status}"
        if changed_by:
            message += f" by {changed_by}"
        message += f" in event {parent_event_number}"
        
        # Determine priority based on status change
        priority = NotificationPriority.MEDIUM
        if new_status.lower() in ["completed", "cancelled"]:
            priority = NotificationPriority.HIGH
        elif new_status.lower() == "inprogress":
            priority = NotificationPriority.MEDIUM
        
        action_url = f"/maintenance/events/{parent_event_id}"
        
        extra_data = {
            "sub_event_id": sub_event_id,
            "sub_event_number": sub_event_number,
            "sub_event_title": sub_event_title,
            "parent_event_id": parent_event_id,
            "parent_event_number": parent_event_number,
            "old_status": old_status,
            "new_status": new_status,
            "changed_by": changed_by
        }
        
        await self.create_notification(
            title=title,
            message=message,
            notification_type=NotificationType.SUB_EVENT_STATUS_CHANGED,
            priority=priority,
            recipient_id=None,
            related_item_id=str(parent_event_id),  # Link to parent event
            related_item_type="maintenance_sub_event",
            action_url=action_url,
            extra_data=extra_data,
            expires_in_days=14
        )
    
    async def broadcast_bulk_inspections_planned(
        self,
        event_id: int,
        event_number: str,
        event_title: str,
        planned_count: int,
        equipment_tags: List[str],
        planned_by: Optional[str] = None,
        sub_event_id: Optional[int] = None,
        sub_event_number: Optional[str] = None
    ):
        """Broadcast notification when multiple inspections are planned at once"""
        
        title = "📋 Bulk Inspections Planned"
        
        if sub_event_id and sub_event_number:
            message = f"{planned_count} inspections have been planned for sub-event {sub_event_number} in event {event_number}"
        else:
            message = f"{planned_count} inspections have been planned for event {event_number}: {event_title}"
        
        if planned_by:
            message += f" by {planned_by}"
        
        # Add equipment details if reasonable number
        if len(equipment_tags) <= 5:
            message += f" for equipment: {', '.join(equipment_tags)}"
        else:
            message += f" for equipment: {', '.join(equipment_tags[:3])} and {len(equipment_tags) - 3} more"
        
        action_url = f"/maintenance/events/{event_id}"
        
        extra_data = {
            "event_id": event_id,
            "event_number": event_number,
            "event_title": event_title,
            "planned_count": planned_count,
            "equipment_tags": equipment_tags,
            "planned_by": planned_by,
            "sub_event_id": sub_event_id,
            "sub_event_number": sub_event_number
        }
        
        await self.create_notification(
            title=title,
            message=message,
            notification_type=NotificationType.BULK_INSPECTIONS_PLANNED,
            priority=NotificationPriority.HIGH,
            recipient_id=None,  # Broadcast to all
            related_item_id=str(event_id),
            related_item_type="maintenance_event",
            action_url=action_url,
            extra_data=extra_data,
            expires_in_days=30
        )
    
    async def _broadcast_notification(self, notification: Notification):
        """Broadcast notification via WebSocket"""
        
        # Prepare notification data for WebSocket
        notification_data = {
            "type": "notification",
            "data": {
                "id": notification.id,
                "title": notification.title,
                "message": notification.message,
                "notification_type": notification.type,
                "priority": notification.priority,
                "related_item_id": notification.related_item_id,
                "related_item_type": notification.related_item_type,
                "action_url": notification.action_url,
                "extra_data": notification.extra_data,
                "created_at": notification.created_at.isoformat(),
                "expires_at": notification.expires_at.isoformat() if notification.expires_at else None
            },
            "timestamp": datetime.utcnow().isoformat()
        }
        
        try:
            if notification.recipient_id:
                # Send to specific inspector
                await connection_manager.send_to_inspector(notification_data, notification.recipient_id)
                logger.info(f"Sent notification {notification.id} to inspector {notification.recipient_id}")
            else:
                # Broadcast to all connected inspectors
                await connection_manager.broadcast_to_all(notification_data)
                logger.info(f"Broadcasted notification {notification.id} to all connected inspectors")
                
        except Exception as e:
            logger.error(f"Failed to broadcast notification {notification.id}: {e}")
    
    def get_notifications_for_inspector(
        self,
        inspector_id: int,
        status: Optional[NotificationStatus] = None,
        limit: int = 50,
        offset: int = 0
    ) -> List[Notification]:
        """Get notifications for a specific inspector"""
        
        query = select(Notification).where(
            (Notification.recipient_id == inspector_id) | 
            (Notification.recipient_id.is_(None))  # Include broadcast notifications
        )
        
        if status:
            query = query.where(Notification.status == status)
        
        query = query.order_by(Notification.created_at.desc()).offset(offset).limit(limit)
        
        return list(self.db.exec(query).all())
    
    def mark_notification_as_read(self, notification_id: int, inspector_id: int) -> bool:
        """Mark a notification as read for a specific inspector"""
        
        notification = self.db.get(Notification, notification_id)
        if not notification:
            return False
        
        # Check if notification is for this inspector or is a broadcast
        if notification.recipient_id and notification.recipient_id != inspector_id:
            return False
        
        notification.status = NotificationStatus.READ
        notification.read_at = datetime.utcnow()
        
        self.db.add(notification)
        self.db.commit()
        
        return True
    
    def get_unread_count(self, inspector_id: int) -> int:
        """Get count of unread notifications for an inspector"""
        
        query = select(Notification).where(
            (
                (Notification.recipient_id == inspector_id) | 
                (Notification.recipient_id.is_(None))
            ) &
            (Notification.status == NotificationStatus.UNREAD)
        )
        
        return len(list(self.db.exec(query).all()))
    
    def get_or_create_preferences(self, inspector_id: int) -> NotificationPreference:
        """Get or create notification preferences for an inspector"""
        
        preferences = self.db.exec(
            select(NotificationPreference).where(
                NotificationPreference.inspector_id == inspector_id
            )
        ).first()
        
        if not preferences:
            preferences = NotificationPreference(inspector_id=inspector_id)
            self.db.add(preferences)
            self.db.commit()
            self.db.refresh(preferences)
        
        return preferences
    
    def update_preferences(
        self, 
        inspector_id: int, 
        preferences_data: Dict[str, Any]
    ) -> NotificationPreference:
        """Update notification preferences for an inspector"""
        
        preferences = self.get_or_create_preferences(inspector_id)
        
        for key, value in preferences_data.items():
            if hasattr(preferences, key):
                setattr(preferences, key, value)
        
        preferences.updated_at = datetime.utcnow()
        
        self.db.add(preferences)
        self.db.commit()
        self.db.refresh(preferences)
        
        return preferences