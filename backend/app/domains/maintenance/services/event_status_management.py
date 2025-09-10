"""Event status management service for maintenance events"""

from typing import Optional, List, Dict, Any, Tuple
from sqlmodel import Session, select
from datetime import datetime, date
import logging

from app.domains.maintenance.models.event import MaintenanceEvent, MaintenanceSubEvent
from app.domains.maintenance.models.enums import MaintenanceEventStatus, MaintenanceEventCategory
from app.domains.inspection.models.inspection import Inspection
from app.domains.inspection.models.enums import InspectionStatus

# Setup logging
logger = logging.getLogger(__name__)


class EventStatusManagementError(Exception):
    """Exception raised by event status management operations"""
    
    def __init__(self, message: str, error_code: str = None, event_id: int = None):
        self.message = message
        self.error_code = error_code
        self.event_id = event_id
        super().__init__(message)


class StatusTransitionResult:
    """Result of status transition attempt"""
    
    def __init__(self):
        self.success = True
        self.old_status = None
        self.new_status = None
        self.transition_date = None
        self.errors = []
        self.warnings = []
        self.blocking_inspections = []
        self.affected_sub_events = []
    
    def add_error(self, message: str, error_code: str = None):
        """Add transition error"""
        self.success = False
        self.errors.append({
            'message': message,
            'error_code': error_code or 'TRANSITION_ERROR'
        })
    
    def add_warning(self, message: str, warning_code: str = None):
        """Add transition warning"""
        self.warnings.append({
            'message': message,
            'warning_code': warning_code or 'TRANSITION_WARNING'
        })
    
    def get_summary(self) -> Dict[str, Any]:
        """Get transition summary"""
        return {
            'success': self.success,
            'old_status': self.old_status,
            'new_status': self.new_status,
            'transition_date': self.transition_date,
            'errors': self.errors,
            'warnings': self.warnings,
            'blocking_inspections': self.blocking_inspections,
            'affected_sub_events': self.affected_sub_events
        }


class EventStatusManagementService:
    """Service for managing maintenance event status transitions and validations"""
    
    # Define valid status transitions
    VALID_TRANSITIONS = {
        MaintenanceEventStatus.Planned: [
            MaintenanceEventStatus.InProgress,
            MaintenanceEventStatus.Cancelled,
            MaintenanceEventStatus.Postponed
        ],
        MaintenanceEventStatus.InProgress: [
            MaintenanceEventStatus.Completed,
            MaintenanceEventStatus.Cancelled,
            MaintenanceEventStatus.Postponed
        ],
        MaintenanceEventStatus.Postponed: [
            MaintenanceEventStatus.Planned,
            MaintenanceEventStatus.InProgress,
            MaintenanceEventStatus.Cancelled
        ],
        MaintenanceEventStatus.Completed: [],  # Terminal state
        MaintenanceEventStatus.Cancelled: []   # Terminal state
    }
    
    def __init__(self, session: Session):
        """Initialize the event status management service"""
        self.session = session
    
    def validate_status_transition(
        self,
        event_id: int,
        new_status: MaintenanceEventStatus,
        is_sub_event: bool = False
    ) -> StatusTransitionResult:
        """
        Validate if status transition is allowed
        
        Args:
            event_id: Event or sub-event ID
            new_status: Desired new status
            is_sub_event: Whether this is a sub-event
            
        Returns:
            StatusTransitionResult with validation details
        """
        result = StatusTransitionResult()
        
        try:
            # Get event
            if is_sub_event:
                event = self.session.get(MaintenanceSubEvent, event_id)
                event_type = "sub-event"
            else:
                event = self.session.get(MaintenanceEvent, event_id)
                event_type = "event"
            
            if not event:
                result.add_error(f"Maintenance {event_type} with ID {event_id} not found", "EVENT_NOT_FOUND")
                return result
            
            result.old_status = event.status
            result.new_status = new_status
            
            # Check if transition is valid
            if not self._is_valid_transition(event.status, new_status):
                result.add_error(
                    f"Invalid status transition from {event.status} to {new_status}",
                    "INVALID_TRANSITION"
                )
                return result
            
            # Check specific transition constraints
            self._validate_transition_constraints(event, new_status, result, is_sub_event)
            
            return result
            
        except Exception as e:
            result.add_error(f"Status validation failed: {str(e)}", "VALIDATION_SYSTEM_ERROR")
            return result
    
    def transition_event_status(
        self,
        event_id: int,
        new_status: MaintenanceEventStatus,
        is_sub_event: bool = False,
        force: bool = False,
        notes: Optional[str] = None
    ) -> StatusTransitionResult:
        """
        Transition event status with validation
        
        Args:
            event_id: Event or sub-event ID
            new_status: Desired new status
            is_sub_event: Whether this is a sub-event
            force: Force transition even with warnings
            notes: Optional transition notes
            
        Returns:
            StatusTransitionResult with transition details
        """
        result = StatusTransitionResult()
        
        try:
            # Validate transition first
            validation_result = self.validate_status_transition(event_id, new_status, is_sub_event)
            
            if not validation_result.success and not force:
                return validation_result
            
            # Get event
            if is_sub_event:
                event = self.session.get(MaintenanceSubEvent, event_id)
                event_type = "sub-event"
            else:
                event = self.session.get(MaintenanceEvent, event_id)
                event_type = "event"
            
            if not event:
                result.add_error(f"Maintenance {event_type} with ID {event_id} not found", "EVENT_NOT_FOUND")
                return result
            
            # Store old status
            old_status = event.status
            result.old_status = old_status
            result.new_status = new_status
            result.transition_date = datetime.utcnow()
            
            # Update status
            event.status = new_status
            event.updated_at = result.transition_date
            
            # Update dates based on status
            if new_status == MaintenanceEventStatus.InProgress and not event.actual_start_date:
                event.actual_start_date = date.today()
            elif new_status == MaintenanceEventStatus.Completed and not event.actual_end_date:
                event.actual_end_date = date.today()
            
            # Add notes if provided
            if notes:
                if event.notes:
                    event.notes += f"\n\nStatus transition ({old_status} -> {new_status}): {notes}"
                else:
                    event.notes = f"Status transition ({old_status} -> {new_status}): {notes}"
            
            # Handle automatic sub-event updates for main events
            if not is_sub_event:
                self._handle_sub_event_status_updates(event, new_status, result)
            
            # Handle automatic inspection plan updates
            self._handle_inspection_plan_updates(event_id, new_status, result, is_sub_event)
            
            # Commit changes
            self.session.add(event)
            self.session.commit()
            
            logger.info(f"Successfully transitioned {event_type} {event_id} from {old_status} to {new_status}")
            
            return result
            
        except Exception as e:
            self.session.rollback()
            result.add_error(f"Status transition failed: {str(e)}", "TRANSITION_SYSTEM_ERROR")
            return result
    
    def validate_sub_event_creation(
        self,
        parent_event_id: int
    ) -> StatusTransitionResult:
        """
        Validate if sub-event creation is allowed for the parent event
        
        Args:
            parent_event_id: Parent event ID
            
        Returns:
            StatusTransitionResult with validation details
        """
        result = StatusTransitionResult()
        
        try:
            # Get parent event
            parent_event = self.session.get(MaintenanceEvent, parent_event_id)
            
            if not parent_event:
                result.add_error(f"Parent event with ID {parent_event_id} not found", "PARENT_EVENT_NOT_FOUND")
                return result
            
            # Check if event category allows sub-events
            if parent_event.event_category == MaintenanceEventCategory.Simple:
                result.add_error(
                    "Simple events cannot have sub-events. Only Complex events support sub-event creation.",
                    "SIMPLE_EVENT_NO_SUBEVENTS"
                )
                return result
            
            # Check if parent event is in appropriate state for sub-event creation
            if parent_event.status not in [MaintenanceEventStatus.Planned, MaintenanceEventStatus.InProgress]:
                result.add_error(
                    f"Cannot create sub-events for {parent_event.status} events",
                    "INVALID_PARENT_STATE"
                )
                return result
            
            result.success = True
            return result
            
        except Exception as e:
            result.add_error(f"Sub-event validation failed: {str(e)}", "VALIDATION_SYSTEM_ERROR")
            return result
    
    def validate_inspection_creation(
        self,
        event_id: int,
        inspection_type: str = "direct",  # "direct", "planned", "unplanned"
        is_sub_event: bool = False
    ) -> StatusTransitionResult:
        """
        Validate if inspection creation is allowed for the event
        
        Args:
            event_id: Event or sub-event ID
            inspection_type: Type of inspection being created
            is_sub_event: Whether this is a sub-event
            
        Returns:
            StatusTransitionResult with validation details
        """
        result = StatusTransitionResult()
        
        try:
            # Get event
            if is_sub_event:
                event = self.session.get(MaintenanceSubEvent, event_id)
                event_type = "sub-event"
            else:
                event = self.session.get(MaintenanceEvent, event_id)
                event_type = "event"
            
            if not event:
                result.add_error(f"Maintenance {event_type} with ID {event_id} not found", "EVENT_NOT_FOUND")
                return result
            
            # For main events, check category-specific rules
            if not is_sub_event:
                parent_event = event
                
                # Simple events workflow
                if parent_event.event_category == MaintenanceEventCategory.Simple:
                    if inspection_type == "planned" and parent_event.status == MaintenanceEventStatus.Planned and not parent_event.approved_by:
                        result.add_warning(
                            "Simple events can use direct inspection creation when approved",
                            "SIMPLE_EVENT_PLANNED_WORKFLOW"
                        )
                    
                    if inspection_type == "direct" and parent_event.status == MaintenanceEventStatus.Planned and not parent_event.approved_by:
                        result.add_error(
                            "Cannot create direct inspections in plan mode. Event must be approved first.",
                            "PLAN_MODE_RESTRICTION"
                        )
                        return result
                
                # Complex events workflow  
                elif parent_event.event_category == MaintenanceEventCategory.Complex:
                    if inspection_type == "direct" and parent_event.status == MaintenanceEventStatus.Planned:
                        result.add_warning(
                            "Complex events should use planned inspection workflow for better organization",
                            "COMPLEX_EVENT_PLANNED_WORKFLOW"
                        )
            
            # General state validation
            if event.status == MaintenanceEventStatus.Cancelled:
                result.add_error(
                    f"Cannot create inspections for cancelled {event_type}",
                    "CANCELLED_EVENT"
                )
                return result
            
            if event.status == MaintenanceEventStatus.Completed and inspection_type != "planned":
                result.add_error(
                    f"Cannot create new inspections for completed {event_type}",
                    "COMPLETED_EVENT"
                )
                return result
            
            # Plan mode restrictions
            if (event.status == MaintenanceEventStatus.Planned and 
                not (hasattr(event, 'approved_by') and event.approved_by) and 
                inspection_type in ["direct", "unplanned"]):
                result.add_error(
                    f"Cannot create {inspection_type} inspections in plan mode. Event must be approved first.",
                    "PLAN_MODE_RESTRICTION"
                )
                return result
            
            result.success = True
            return result
            
        except Exception as e:
            result.add_error(f"Inspection creation validation failed: {str(e)}", "VALIDATION_SYSTEM_ERROR")
            return result

    def auto_update_event_status_based_on_inspections(
        self,
        event_id: int,
        is_sub_event: bool = False
    ) -> StatusTransitionResult:
        """
        Automatically update event status based on inspection progress
        
        Args:
            event_id: Event or sub-event ID
            is_sub_event: Whether this is a sub-event
            
        Returns:
            StatusTransitionResult with update details
        """
        result = StatusTransitionResult()
        
        try:
            # Get event
            if is_sub_event:
                event = self.session.get(MaintenanceSubEvent, event_id)
                event_type = "sub-event"
            else:
                event = self.session.get(MaintenanceEvent, event_id)
                event_type = "event"
            
            if not event:
                result.add_error(f"Maintenance {event_type} with ID {event_id} not found", "EVENT_NOT_FOUND")
                return result
            
            # Get inspection statistics
            inspection_stats = self._get_inspection_statistics(event_id, is_sub_event)
            
            # Determine appropriate status based on inspection progress
            suggested_status = self._determine_status_from_inspections(event.status, inspection_stats)
            
            if suggested_status and suggested_status != event.status:
                # Attempt automatic transition
                transition_result = self.transition_event_status(
                    event_id,
                    suggested_status,
                    is_sub_event,
                    notes="Automatic status update based on inspection progress"
                )
                
                if transition_result.success:
                    result.success = True
                    result.old_status = transition_result.old_status
                    result.new_status = transition_result.new_status
                    result.transition_date = transition_result.transition_date
                    result.add_warning(
                        f"Status automatically updated from {transition_result.old_status} to {transition_result.new_status}",
                        "AUTO_STATUS_UPDATE"
                    )
                else:
                    result.errors.extend(transition_result.errors)
                    result.success = False
            else:
                result.success = True
                result.add_warning("No status update needed based on current inspection progress", "NO_UPDATE_NEEDED")
            
            return result
            
        except Exception as e:
            result.add_error(f"Auto status update failed: {str(e)}", "AUTO_UPDATE_SYSTEM_ERROR")
            return result
    
    def validate_event_deletion(
        self,
        event_id: int,
        is_sub_event: bool = False
    ) -> StatusTransitionResult:
        """
        Validate if event can be deleted
        
        Args:
            event_id: Event or sub-event ID
            is_sub_event: Whether this is a sub-event
            
        Returns:
            StatusTransitionResult with validation details
        """
        result = StatusTransitionResult()
        
        try:
            # Get event
            if is_sub_event:
                event = self.session.get(MaintenanceSubEvent, event_id)
                event_type = "sub-event"
            else:
                event = self.session.get(MaintenanceEvent, event_id)
                event_type = "event"
            
            if not event:
                result.add_error(f"Maintenance {event_type} with ID {event_id} not found", "EVENT_NOT_FOUND")
                return result
            
            # Check if event is in a deletable state
            if event.status in [MaintenanceEventStatus.InProgress, MaintenanceEventStatus.Completed]:
                result.add_error(
                    f"Cannot delete {event_type} with status {event.status}",
                    "INVALID_STATUS_FOR_DELETION"
                )
            
            # Check for incomplete inspections (Planned and InProgress)
            incomplete_inspections = self._get_incomplete_inspections(event_id, is_sub_event)
            if incomplete_inspections:
                # Get equipment details for better error messages
                equipment_details = []
                for inspection in incomplete_inspections:
                    equipment = None
                    if inspection.equipment_id:
                        from app.domains.equipment.models.equipment import Equipment
                        equipment = self.session.get(Equipment, inspection.equipment_id)
                    
                    equipment_tag = equipment.tag if equipment else f"Equipment-{inspection.equipment_id}"
                    status_display = inspection.status.value if hasattr(inspection.status, 'value') else str(inspection.status)
                    
                    equipment_details.append({
                        'id': inspection.id,
                        'inspection_number': inspection.inspection_number,
                        'title': inspection.title,
                        'equipment_tag': equipment_tag,
                        'status': status_display
                    })
                
                result.add_error(
                    f"Cannot delete {event_type} with {len(incomplete_inspections)} incomplete inspection(s)",
                    "HAS_INCOMPLETE_INSPECTIONS"
                )
                result.blocking_inspections = equipment_details
            
            # Check for sub-events (main events only)
            if not is_sub_event:
                sub_events = self.session.exec(
                    select(MaintenanceSubEvent).where(MaintenanceSubEvent.parent_event_id == event_id)
                ).all()
                
                if sub_events:
                    active_sub_events = [se for se in sub_events if se.status == MaintenanceEventStatus.InProgress]
                    if active_sub_events:
                        result.add_error(
                            f"Cannot delete event with {len(active_sub_events)} active sub-event(s)",
                            "HAS_ACTIVE_SUB_EVENTS"
                        )
                        result.affected_sub_events = [
                            {
                                'id': sub_event.id,
                                'sub_event_number': sub_event.sub_event_number,
                                'title': sub_event.title,
                                'status': sub_event.status.value if hasattr(sub_event.status, 'value') else str(sub_event.status)
                            }
                            for sub_event in active_sub_events
                        ]
            
            # Add warnings for completed inspections
            completed_inspections = self._get_completed_inspections(event_id, is_sub_event)
            if completed_inspections:
                result.add_warning(
                    f"Deleting this {event_type} will also delete {len(completed_inspections)} completed inspection(s) and their data",
                    "WILL_DELETE_COMPLETED_INSPECTIONS"
                )
            
            return result
            
        except Exception as e:
            result.add_error(f"Deletion validation failed: {str(e)}", "VALIDATION_SYSTEM_ERROR")
            return result
    
    def get_event_status_summary(
        self,
        event_id: int,
        is_sub_event: bool = False
    ) -> Dict[str, Any]:
        """
        Get comprehensive status summary for event
        
        Args:
            event_id: Event or sub-event ID
            is_sub_event: Whether this is a sub-event
            
        Returns:
            Dictionary with status summary
        """
        try:
            # Get event
            if is_sub_event:
                event = self.session.get(MaintenanceSubEvent, event_id)
                event_type = "sub-event"
            else:
                event = self.session.get(MaintenanceEvent, event_id)
                event_type = "event"
            
            if not event:
                return {
                    'event_exists': False,
                    'error': f"Maintenance {event_type} with ID {event_id} not found"
                }
            
            # Get inspection statistics
            inspection_stats = self._get_inspection_statistics(event_id, is_sub_event)
            
            # Get valid transitions
            valid_transitions = self.VALID_TRANSITIONS.get(event.status, [])
            
            # Get deletion validation
            deletion_validation = self.validate_event_deletion(event_id, is_sub_event)
            
            return {
                'event_exists': True,
                'event_info': {
                    'id': event.id,
                    'number': getattr(event, 'event_number', None) or getattr(event, 'sub_event_number', None),
                    'title': event.title,
                    'current_status': event.status.value if hasattr(event.status, 'value') else str(event.status),
                    'planned_start_date': event.planned_start_date,
                    'planned_end_date': event.planned_end_date,
                    'actual_start_date': event.actual_start_date,
                    'actual_end_date': event.actual_end_date,
                    'created_at': event.created_at,
                    'updated_at': event.updated_at
                },
                'status_info': {
                    'current_status': event.status.value if hasattr(event.status, 'value') else str(event.status),
                    'valid_transitions': [status.value for status in valid_transitions],
                    'is_terminal': len(valid_transitions) == 0,
                    'can_delete': deletion_validation.success
                },
                'inspection_progress': inspection_stats,
                'deletion_constraints': deletion_validation.get_summary(),
                'suggested_actions': self._get_suggested_actions(event, inspection_stats)
            }
            
        except Exception as e:
            return {
                'event_exists': False,
                'error': f"Failed to get status summary: {str(e)}"
            }
    
    def _is_valid_transition(
        self,
        current_status: MaintenanceEventStatus,
        new_status: MaintenanceEventStatus
    ) -> bool:
        """Check if status transition is valid"""
        if current_status == new_status:
            return True  # Same status is always valid
        
        valid_transitions = self.VALID_TRANSITIONS.get(current_status, [])
        return new_status in valid_transitions
    
    def _validate_transition_constraints(
        self,
        event,
        new_status: MaintenanceEventStatus,
        result: StatusTransitionResult,
        is_sub_event: bool
    ):
        """Validate specific constraints for status transitions"""
        
        # Constraint: Cannot start event without planned inspections
        if new_status == MaintenanceEventStatus.InProgress:
            planned_inspections = self._get_planned_inspections(event.id, is_sub_event)
            if not planned_inspections:
                result.add_warning(
                    "Starting event without any planned inspections",
                    "NO_PLANNED_INSPECTIONS"
                )
        
        # Constraint: Cannot complete event with incomplete inspections (Planned or InProgress)
        if new_status == MaintenanceEventStatus.Completed:
            incomplete_inspections = self._get_incomplete_inspections(event.id, is_sub_event)
            if incomplete_inspections:
                # Get equipment details for better error messages
                equipment_details = []
                for inspection in incomplete_inspections:
                    equipment = None
                    if inspection.equipment_id:
                        from app.domains.equipment.models.equipment import Equipment
                        equipment = self.session.get(Equipment, inspection.equipment_id)
                    
                    # Build detailed inspection info
                    equipment_tag = equipment.tag if equipment else f"Equipment-{inspection.equipment_id}"
                    status_display = inspection.status.value if hasattr(inspection.status, 'value') else str(inspection.status)
                    
                    equipment_details.append({
                        'id': inspection.id,
                        'inspection_number': inspection.inspection_number,
                        'title': inspection.title,
                        'equipment_tag': equipment_tag,
                        'status': status_display
                    })
                
                # Create detailed error message
                inspection_list = []
                for detail in equipment_details:
                    inspection_list.append(f"'{detail['inspection_number']}' for equipment '{detail['equipment_tag']}' (status: {detail['status']})")
                
                detailed_message = f"Cannot complete {'sub-event' if is_sub_event else 'event'} with {len(incomplete_inspections)} incomplete inspection(s): {', '.join(inspection_list[:3])}"
                if len(inspection_list) > 3:
                    detailed_message += f" and {len(inspection_list) - 3} more"
                
                result.add_error(
                    detailed_message,
                    "HAS_INCOMPLETE_INSPECTIONS"
                )
                result.blocking_inspections = equipment_details
        
        # Constraint: Check date consistency
        if new_status == MaintenanceEventStatus.InProgress:
            if event.planned_start_date > date.today():
                result.add_warning(
                    "Starting event before planned start date",
                    "EARLY_START"
                )
        
        if new_status == MaintenanceEventStatus.Completed:
            if event.planned_end_date > date.today():
                result.add_warning(
                    "Completing event before planned end date",
                    "EARLY_COMPLETION"
                )
    
    def _handle_sub_event_status_updates(
        self,
        main_event: MaintenanceEvent,
        new_status: MaintenanceEventStatus,
        result: StatusTransitionResult
    ):
        """Handle automatic sub-event status updates when main event status changes"""
        
        # Get sub-events
        sub_events = self.session.exec(
            select(MaintenanceSubEvent).where(MaintenanceSubEvent.parent_event_id == main_event.id)
        ).all()
        
        if not sub_events:
            return
        
        # Update sub-events based on main event status
        for sub_event in sub_events:
            should_update = False
            target_status = None
            
            if new_status == MaintenanceEventStatus.Cancelled:
                # Cancel all sub-events when main event is cancelled
                if sub_event.status not in [MaintenanceEventStatus.Completed, MaintenanceEventStatus.Cancelled]:
                    should_update = True
                    target_status = MaintenanceEventStatus.Cancelled
            
            elif new_status == MaintenanceEventStatus.Postponed:
                # Postpone active sub-events when main event is postponed
                if sub_event.status == MaintenanceEventStatus.InProgress:
                    should_update = True
                    target_status = MaintenanceEventStatus.Postponed
            
            if should_update and target_status:
                sub_event.status = target_status
                sub_event.updated_at = datetime.utcnow()
                self.session.add(sub_event)
                
                result.affected_sub_events.append({
                    'id': sub_event.id,
                    'sub_event_number': sub_event.sub_event_number,
                    'title': sub_event.title,
                    'old_status': sub_event.status,
                    'new_status': target_status
                })
    
    def _handle_inspection_plan_updates(
        self,
        event_id: int,
        new_status: MaintenanceEventStatus,
        result: StatusTransitionResult,
        is_sub_event: bool
    ):
        """Handle automatic inspection plan updates when event status changes"""
        
        # Get inspections instead of inspection plans
        if is_sub_event:
            inspections = self.session.exec(
                select(Inspection).where(Inspection.maintenance_sub_event_id == event_id)
            ).all()
        else:
            inspections = self.session.exec(
                select(Inspection).where(Inspection.maintenance_event_id == event_id)
            ).all()
        
        # Update inspection status based on event status
        for inspection in inspections:
            should_update = False
            target_status = None
            
            if new_status == MaintenanceEventStatus.Cancelled:
                # Cancel planned inspections when event is cancelled
                if inspection.status == InspectionStatus.Planned:
                    should_update = True
                    target_status = InspectionStatus.Cancelled
            
            if should_update and target_status:
                inspection.status = target_status
                inspection.updated_at = datetime.utcnow()
                self.session.add(inspection)
    
    def _get_inspection_statistics(self, event_id: int, is_sub_event: bool) -> Dict[str, Any]:
        """Get inspection statistics for event"""
        
        # Get inspections
        if is_sub_event:
            inspections = self.session.exec(
                select(Inspection).where(Inspection.maintenance_sub_event_id == event_id)
            ).all()
        else:
            inspections = self.session.exec(
                select(Inspection).where(Inspection.maintenance_event_id == event_id)
            ).all()
        
        # Calculate statistics
        total_planned = len([i for i in inspections if i.is_planned])
        total_inspections = len(inspections)
        active_inspections = len([i for i in inspections if i.status == InspectionStatus.InProgress])
        completed_inspections = len([i for i in inspections if i.status == InspectionStatus.Completed])
        
        return {
            'total_planned': total_planned,
            'total_inspections': total_inspections,
            'active_inspections': active_inspections,
            'completed_inspections': completed_inspections,
            'completion_percentage': (completed_inspections / total_planned * 100) if total_planned > 0 else 0
        }
    
    def _determine_status_from_inspections(
        self,
        current_status: MaintenanceEventStatus,
        inspection_stats: Dict[str, Any]
    ) -> Optional[MaintenanceEventStatus]:
        """Determine appropriate status based on inspection progress"""
        
        # Don't auto-update terminal states
        if current_status in [MaintenanceEventStatus.Completed, MaintenanceEventStatus.Cancelled]:
            return None
        
        # Start event when first inspection begins
        if (current_status == MaintenanceEventStatus.Planned and 
            inspection_stats['active_inspections'] > 0):
            return MaintenanceEventStatus.InProgress
        
        # Complete event when all inspections are done
        if (current_status == MaintenanceEventStatus.InProgress and
            inspection_stats['total_planned'] > 0 and
            inspection_stats['active_inspections'] == 0 and
            inspection_stats['completed_inspections'] == inspection_stats['total_planned']):
            return MaintenanceEventStatus.Completed
        
        return None
    
    def _get_active_inspections(self, event_id: int, is_sub_event: bool) -> List[Inspection]:
        """Get active inspections for event (InProgress only)"""
        if is_sub_event:
            return list(self.session.exec(
                select(Inspection).where(
                    Inspection.maintenance_sub_event_id == event_id,
                    Inspection.status == InspectionStatus.InProgress
                )
            ).all())
        else:
            return list(self.session.exec(
                select(Inspection).where(
                    Inspection.maintenance_event_id == event_id,
                    Inspection.status == InspectionStatus.InProgress
                )
            ).all())
    
    def _get_incomplete_inspections(self, event_id: int, is_sub_event: bool) -> List[Inspection]:
        """Get incomplete inspections for event (Planned and InProgress)"""
        if is_sub_event:
            return list(self.session.exec(
                select(Inspection).where(
                    Inspection.maintenance_sub_event_id == event_id,
                    (Inspection.status == InspectionStatus.Planned) | (Inspection.status == InspectionStatus.InProgress)
                )
            ).all())
        else:
            return list(self.session.exec(
                select(Inspection).where(
                    Inspection.maintenance_event_id == event_id,
                    (Inspection.status == InspectionStatus.Planned) | (Inspection.status == InspectionStatus.InProgress)
                )
            ).all())
    
    def _get_completed_inspections(self, event_id: int, is_sub_event: bool) -> List[Inspection]:
        """Get completed inspections for event"""
        if is_sub_event:
            return list(self.session.exec(
                select(Inspection).where(
                    Inspection.maintenance_sub_event_id == event_id,
                    Inspection.status == InspectionStatus.Completed
                )
            ).all())
        else:
            return list(self.session.exec(
                select(Inspection).where(
                    Inspection.maintenance_event_id == event_id,
                    Inspection.status == InspectionStatus.Completed
                )
            ).all())
    
    def _get_planned_inspections(self, event_id: int, is_sub_event: bool) -> List[Inspection]:
        """Get planned inspections for event (using unified model)"""
        if is_sub_event:
            return list(self.session.exec(
                select(Inspection).where(
                    Inspection.maintenance_sub_event_id == event_id,
                    Inspection.is_planned == True
                )
            ).all())
        else:
            return list(self.session.exec(
                select(Inspection).where(
                    Inspection.maintenance_event_id == event_id,
                    Inspection.is_planned == True
                )
            ).all())
    
    def _get_suggested_actions(self, event, inspection_stats: Dict[str, Any]) -> List[Dict[str, str]]:
        """Get suggested actions based on current event state"""
        suggestions = []
        
        if event.status == MaintenanceEventStatus.Planned:
            if inspection_stats['total_planned'] == 0:
                suggestions.append({
                    'action': 'add_inspection_plans',
                    'message': 'Add inspection plans before starting the event',
                    'priority': 'high'
                })
            else:
                suggestions.append({
                    'action': 'start_event',
                    'message': 'Event is ready to start',
                    'priority': 'medium'
                })
        
        elif event.status == MaintenanceEventStatus.InProgress:
            if inspection_stats['active_inspections'] == 0 and inspection_stats['completed_inspections'] == inspection_stats['total_planned']:
                suggestions.append({
                    'action': 'complete_event',
                    'message': 'All inspections completed - event can be completed',
                    'priority': 'high'
                })
            elif inspection_stats['active_inspections'] == 0:
                suggestions.append({
                    'action': 'start_inspections',
                    'message': 'Start planned inspections',
                    'priority': 'medium'
                })
        
        return suggestions