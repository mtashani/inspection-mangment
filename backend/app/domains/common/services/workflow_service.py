"""Workflow service for enforcing business rules and state transitions"""

from typing import Optional, List, Dict, Any
from sqlmodel import Session, select
from app.domains.maintenance.models.event import MaintenanceEvent, MaintenanceSubEvent
from app.domains.maintenance.models.enums import MaintenanceEventStatus, MaintenanceEventCategory
from app.domains.inspection.models.inspection import Inspection
from app.domains.inspection.models.enums import InspectionStatus
from app.domains.daily_report.models.report import DailyReport
from app.domains.common.models.status_history import StatusHistory, EntityType
import logging

logger = logging.getLogger(__name__)

class WorkflowValidationError(Exception):
    """Exception raised when workflow validation fails"""
    pass

class WorkflowService:
    """Service for managing workflow rules and state transitions"""
    
    def __init__(self, session: Session):
        self.session = session
    
    # ========== Event Category Workflow Rules ==========
    
    def can_create_sub_event(self, event_id: int) -> tuple[bool, str]:
        """Check if sub-events can be created for this event"""
        event = self.session.get(MaintenanceEvent, event_id)
        if not event:
            return False, "Event not found"
        
        # Rule: Only Complex events can have sub-events
        if event.event_category != MaintenanceEventCategory.Complex:
            return False, "Sub-events can only be created for Complex events"
        
        # Rule: Event must be in Planning state
        if event.status != MaintenanceEventStatus.Planned:
            return False, "Sub-events can only be created when event is in Planned state"
        
        return True, "Can create sub-event"
    
    def can_create_planned_inspection(self, event_id: int, sub_event_id: Optional[int] = None) -> tuple[bool, str]:
        """Check if planned inspections can be created (unified model approach)"""
        event = self.session.get(MaintenanceEvent, event_id)
        if not event:
            return False, "Event not found"
        
        # For sub-events
        if sub_event_id:
            sub_event = self.session.get(MaintenanceSubEvent, sub_event_id)
            if not sub_event:
                return False, "Sub-event not found"
            
            # Rule: Sub-event must be in Planned state
            if sub_event.status != MaintenanceEventStatus.Planned:
                return False, "Planned inspections can only be created when sub-event is in Planned state"
        else:
            # For direct event inspections
            # Rule: Event must be in Planned or InProgress state
            if event.status not in [MaintenanceEventStatus.Planned, MaintenanceEventStatus.InProgress]:
                return False, "Planned inspections can only be created when event is in Planned or InProgress state"
        
        return True, "Can create planned inspection"
    
    def can_start_event(self, event_id: int) -> tuple[bool, str]:
        """Check if event can be started"""
        event = self.session.get(MaintenanceEvent, event_id)
        if not event:
            return False, "Event not found"
        
        # Rule: Event must be in Planned state to start
        if event.status != MaintenanceEventStatus.Planned:
            return False, "Event can only be started from Planned state"
        
        return True, "Can start event"
    
    def can_start_sub_event(self, sub_event_id: int) -> tuple[bool, str]:
        """Check if sub-event can be started"""
        sub_event = self.session.get(MaintenanceSubEvent, sub_event_id)
        if not sub_event:
            return False, "Sub-event not found"
        
        # Rule: Parent event must be InProgress
        parent_event = self.session.get(MaintenanceEvent, sub_event.parent_event_id)
        if not parent_event or parent_event.status != MaintenanceEventStatus.InProgress:
            return False, "Sub-event can only be started when parent event is InProgress"
        
        # Rule: Sub-event must be in Planned state
        if sub_event.status != MaintenanceEventStatus.Planned:
            return False, "Sub-event can only be started from Planned state"
        
        return True, "Can start sub-event"
    
    def can_add_unplanned_inspection(self, event_id: int, sub_event_id: Optional[int] = None) -> tuple[bool, str]:
        """Check if unplanned inspections can be added"""
        event = self.session.get(MaintenanceEvent, event_id)
        if not event:
            return False, "Event not found"
        
        if sub_event_id:
            sub_event = self.session.get(MaintenanceSubEvent, sub_event_id)
            if not sub_event:
                return False, "Sub-event not found"
            
            # Rule: Sub-event must be InProgress
            if sub_event.status != MaintenanceEventStatus.InProgress:
                return False, "Unplanned inspections can only be added to InProgress sub-events"
        else:
            # Rule: Event must be InProgress
            if event.status != MaintenanceEventStatus.InProgress:
                return False, "Unplanned inspections can only be added to InProgress events"
        
        return True, "Can add unplanned inspection"
    
    def can_add_daily_report(self, inspection_id: int) -> tuple[bool, str]:
        """Check if daily reports can be added to inspection"""
        inspection = self.session.get(Inspection, inspection_id)
        if not inspection:
            return False, "Inspection not found"
        
        # Rule: Inspection must be InProgress
        if inspection.status != InspectionStatus.InProgress:
            return False, "Daily reports can only be added to InProgress inspections"
        
        # Check parent entity state (inherit workflow from parent)
        if inspection.maintenance_sub_event_id:
            # Check sub-event state
            sub_event = self.session.get(MaintenanceSubEvent, inspection.maintenance_sub_event_id)
            if not sub_event or sub_event.status not in [MaintenanceEventStatus.InProgress]:
                return False, "Cannot add daily reports when parent sub-event is not InProgress"
        elif inspection.maintenance_event_id:
            # Check event state
            event = self.session.get(MaintenanceEvent, inspection.maintenance_event_id)
            if not event or event.status not in [MaintenanceEventStatus.InProgress]:
                return False, "Cannot add daily reports when parent event is not InProgress"
        
        return True, "Can add daily report"
    
    # ========== State Transition Methods ==========
    
    def transition_event_status(self, event_id: int, new_status: MaintenanceEventStatus, 
                              changed_by: str, note: Optional[str] = None) -> bool:
        """Transition event status with validation and audit trail"""
        event = self.session.get(MaintenanceEvent, event_id)
        if not event:
            raise WorkflowValidationError("Event not found")
        
        old_status = event.status
        
        # Validate transition
        if not self._is_valid_event_transition(old_status, new_status):
            raise WorkflowValidationError(f"Invalid transition from {old_status} to {new_status}")
        
        # Update status
        event.status = new_status
        self.session.add(event)
        
        # Record status history
        self._record_status_change(
            entity_type=EntityType.MaintenanceEvent,
            entity_id=event_id,
            from_status=old_status.value,
            to_status=new_status.value,
            changed_by=changed_by,
            note=note
        )
        
        self.session.commit()
        
        logger.info(f"Event {event_id} status changed from {old_status} to {new_status} by {changed_by}")
        return True
    
    def transition_sub_event_status(self, sub_event_id: int, new_status: MaintenanceEventStatus,
                                  changed_by: str, note: Optional[str] = None) -> bool:
        """Transition sub-event status with validation and audit trail"""
        sub_event = self.session.get(MaintenanceSubEvent, sub_event_id)
        if not sub_event:
            raise WorkflowValidationError("Sub-event not found")
        
        old_status = sub_event.status
        
        # Validate transition
        if not self._is_valid_event_transition(old_status, new_status):
            raise WorkflowValidationError(f"Invalid transition from {old_status} to {new_status}")
        
        # Additional validation for sub-events
        if new_status == MaintenanceEventStatus.InProgress:
            can_start, reason = self.can_start_sub_event(sub_event_id)
            if not can_start:
                raise WorkflowValidationError(reason)
        
        # Update status
        sub_event.status = new_status
        self.session.add(sub_event)
        
        # Record status history
        self._record_status_change(
            entity_type=EntityType.MaintenanceSubEvent,
            entity_id=sub_event_id,
            from_status=old_status.value,
            to_status=new_status.value,
            changed_by=changed_by,
            note=note
        )
        
        self.session.commit()
        
        logger.info(f"Sub-event {sub_event_id} status changed from {old_status} to {new_status} by {changed_by}")
        return True
    
    def transition_inspection_status(self, inspection_id: int, new_status: InspectionStatus,
                                   changed_by: str, note: Optional[str] = None) -> bool:
        """Transition inspection status with validation and audit trail"""
        inspection = self.session.get(Inspection, inspection_id)
        if not inspection:
            raise WorkflowValidationError("Inspection not found")
        
        old_status = inspection.status
        
        # Validate transition
        if not self._is_valid_inspection_transition(old_status, new_status):
            raise WorkflowValidationError(f"Invalid inspection transition from {old_status} to {new_status}")
        
        # Update status
        inspection.status = new_status
        self.session.add(inspection)
        
        # Record status history
        self._record_status_change(
            entity_type=EntityType.Inspection,
            entity_id=inspection_id,
            from_status=old_status.value,
            to_status=new_status.value,
            changed_by=changed_by,
            note=note
        )
        
        self.session.commit()
        
        logger.info(f"Inspection {inspection_id} status changed from {old_status} to {new_status} by {changed_by}")
        return True
    
    # ========== Private Helper Methods ==========
    
    def _is_valid_event_transition(self, from_status: MaintenanceEventStatus, 
                                 to_status: MaintenanceEventStatus) -> bool:
        """Validate event status transitions"""
        valid_transitions = {
            MaintenanceEventStatus.Planned: [
                MaintenanceEventStatus.InProgress,
                MaintenanceEventStatus.Cancelled,
                MaintenanceEventStatus.Postponed
            ],
            MaintenanceEventStatus.InProgress: [
                MaintenanceEventStatus.Completed,
                MaintenanceEventStatus.Cancelled,
                MaintenanceEventStatus.Postponed,
                MaintenanceEventStatus.Planned  # Can revert to planning
            ],
            MaintenanceEventStatus.Completed: [
                MaintenanceEventStatus.InProgress,  # Can reopen
                MaintenanceEventStatus.Cancelled
            ],
            MaintenanceEventStatus.Cancelled: [
                MaintenanceEventStatus.Planned  # Can reactivate
            ],
            MaintenanceEventStatus.Postponed: [
                MaintenanceEventStatus.Planned,
                MaintenanceEventStatus.Cancelled
            ]
        }
        
        return to_status in valid_transitions.get(from_status, [])
    
    def _is_valid_inspection_transition(self, from_status: InspectionStatus, 
                                      to_status: InspectionStatus) -> bool:
        """Validate inspection status transitions"""
        # This should be implemented based on InspectionStatus enum
        # For now, allow most transitions
        return True
    
    def _record_status_change(self, entity_type: EntityType, entity_id: int,
                            from_status: str, to_status: str, changed_by: str,
                            note: Optional[str] = None):
        """Record status change in audit trail"""
        history = StatusHistory(
            entity_type=entity_type,
            entity_id=entity_id,
            from_status=from_status,
            to_status=to_status,
            changed_by=changed_by,
            note=note
        )
        self.session.add(history)
    
    # ========== Analytics Helper Methods ==========
    
    def get_event_workflow_permissions(self, event_id: int) -> Dict[str, bool]:
        """Get all workflow permissions for an event"""
        event = self.session.get(MaintenanceEvent, event_id)
        if not event:
            return {}
        
        can_create_sub, _ = self.can_create_sub_event(event_id)
        can_create_planned, _ = self.can_create_planned_inspection(event_id)
        can_start, _ = self.can_start_event(event_id)
        can_add_unplanned, _ = self.can_add_unplanned_inspection(event_id)
        
        return {
            "can_create_sub_event": can_create_sub,
            "can_create_planned_inspection": can_create_planned,
            "can_start_event": can_start,
            "can_add_unplanned_inspection": can_add_unplanned,
            "is_simple_event": event.event_category == MaintenanceEventCategory.Simple,
            "is_complex_event": event.event_category == MaintenanceEventCategory.Complex,
            "current_status": event.status.value
        }