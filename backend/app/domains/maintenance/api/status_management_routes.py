"""API routes for event status management in maintenance events"""

from fastapi import APIRouter, Depends, HTTPException, Query, Path
from sqlmodel import Session
from typing import Optional, Dict, Any
import logging

from app.database import get_session
from app.domains.maintenance.models.enums import MaintenanceEventStatus
from app.domains.maintenance.services.event_status_management import (
    EventStatusManagementService,
    StatusTransitionResult
)

# Setup logging
logger = logging.getLogger(__name__)

router = APIRouter()

# Pydantic models for request/response
from pydantic import BaseModel

class StatusTransitionRequest(BaseModel):
    new_status: MaintenanceEventStatus
    force: bool = False
    notes: Optional[str] = None

class StatusTransitionResponse(BaseModel):
    success: bool
    old_status: Optional[str]
    new_status: Optional[str]
    transition_date: Optional[str]
    errors: list
    warnings: list
    blocking_inspections: list
    affected_sub_events: list

class EventStatusSummaryResponse(BaseModel):
    event_exists: bool
    event_info: Optional[Dict[str, Any]]
    status_info: Optional[Dict[str, Any]]
    inspection_progress: Optional[Dict[str, Any]]
    deletion_constraints: Optional[Dict[str, Any]]
    suggested_actions: Optional[list]
    error: Optional[str] = None

# Event Status Management Endpoints

@router.post("/events/{event_id}/status/transition", response_model=StatusTransitionResponse)
def transition_event_status(
    event_id: int = Path(..., description="Maintenance event ID"),
    transition_request: StatusTransitionRequest = ...,
    session: Session = Depends(get_session)
):
    """Transition maintenance event status"""
    try:
        status_service = EventStatusManagementService(session)
        
        result = status_service.transition_event_status(
            event_id=event_id,
            new_status=transition_request.new_status,
            is_sub_event=False,
            force=transition_request.force,
            notes=transition_request.notes
        )
        
        return StatusTransitionResponse(
            success=result.success,
            old_status=result.old_status.value if result.old_status else None,
            new_status=result.new_status.value if result.new_status else None,
            transition_date=result.transition_date.isoformat() if result.transition_date else None,
            errors=result.errors,
            warnings=result.warnings,
            blocking_inspections=result.blocking_inspections,
            affected_sub_events=result.affected_sub_events
        )
        
    except Exception as e:
        logger.error(f"Failed to transition event status: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to transition status: {str(e)}")

@router.post("/sub-events/{sub_event_id}/status/transition", response_model=StatusTransitionResponse)
def transition_sub_event_status(
    sub_event_id: int = Path(..., description="Maintenance sub-event ID"),
    transition_request: StatusTransitionRequest = ...,
    session: Session = Depends(get_session)
):
    """Transition maintenance sub-event status"""
    try:
        status_service = EventStatusManagementService(session)
        
        result = status_service.transition_event_status(
            event_id=sub_event_id,
            new_status=transition_request.new_status,
            is_sub_event=True,
            force=transition_request.force,
            notes=transition_request.notes
        )
        
        return StatusTransitionResponse(
            success=result.success,
            old_status=result.old_status.value if result.old_status else None,
            new_status=result.new_status.value if result.new_status else None,
            transition_date=result.transition_date.isoformat() if result.transition_date else None,
            errors=result.errors,
            warnings=result.warnings,
            blocking_inspections=result.blocking_inspections,
            affected_sub_events=result.affected_sub_events
        )
        
    except Exception as e:
        logger.error(f"Failed to transition sub-event status: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to transition status: {str(e)}")

@router.post("/events/{event_id}/status/validate-transition")
def validate_event_status_transition(
    event_id: int = Path(..., description="Maintenance event ID"),
    new_status: MaintenanceEventStatus = Query(..., description="New status to validate"),
    session: Session = Depends(get_session)
):
    """Validate maintenance event status transition"""
    try:
        status_service = EventStatusManagementService(session)
        
        result = status_service.validate_status_transition(
            event_id=event_id,
            new_status=new_status,
            is_sub_event=False
        )
        
        return {
            'is_valid': result.success,
            'old_status': result.old_status.value if result.old_status else None,
            'new_status': result.new_status.value if result.new_status else None,
            'errors': result.errors,
            'warnings': result.warnings,
            'blocking_inspections': result.blocking_inspections
        }
        
    except Exception as e:
        logger.error(f"Failed to validate event status transition: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to validate transition: {str(e)}")

@router.post("/sub-events/{sub_event_id}/status/validate-transition")
def validate_sub_event_status_transition(
    sub_event_id: int = Path(..., description="Maintenance sub-event ID"),
    new_status: MaintenanceEventStatus = Query(..., description="New status to validate"),
    session: Session = Depends(get_session)
):
    """Validate maintenance sub-event status transition"""
    try:
        status_service = EventStatusManagementService(session)
        
        result = status_service.validate_status_transition(
            event_id=sub_event_id,
            new_status=new_status,
            is_sub_event=True
        )
        
        return {
            'is_valid': result.success,
            'old_status': result.old_status.value if result.old_status else None,
            'new_status': result.new_status.value if result.new_status else None,
            'errors': result.errors,
            'warnings': result.warnings,
            'blocking_inspections': result.blocking_inspections
        }
        
    except Exception as e:
        logger.error(f"Failed to validate sub-event status transition: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to validate transition: {str(e)}")

@router.post("/events/{event_id}/status/auto-update", response_model=StatusTransitionResponse)
def auto_update_event_status(
    event_id: int = Path(..., description="Maintenance event ID"),
    session: Session = Depends(get_session)
):
    """Automatically update event status based on inspection progress"""
    try:
        status_service = EventStatusManagementService(session)
        
        result = status_service.auto_update_event_status_based_on_inspections(
            event_id=event_id,
            is_sub_event=False
        )
        
        return StatusTransitionResponse(
            success=result.success,
            old_status=result.old_status.value if result.old_status else None,
            new_status=result.new_status.value if result.new_status else None,
            transition_date=result.transition_date.isoformat() if result.transition_date else None,
            errors=result.errors,
            warnings=result.warnings,
            blocking_inspections=result.blocking_inspections,
            affected_sub_events=result.affected_sub_events
        )
        
    except Exception as e:
        logger.error(f"Failed to auto-update event status: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to auto-update status: {str(e)}")

@router.post("/sub-events/{sub_event_id}/status/auto-update", response_model=StatusTransitionResponse)
def auto_update_sub_event_status(
    sub_event_id: int = Path(..., description="Maintenance sub-event ID"),
    session: Session = Depends(get_session)
):
    """Automatically update sub-event status based on inspection progress"""
    try:
        status_service = EventStatusManagementService(session)
        
        result = status_service.auto_update_event_status_based_on_inspections(
            event_id=sub_event_id,
            is_sub_event=True
        )
        
        return StatusTransitionResponse(
            success=result.success,
            old_status=result.old_status.value if result.old_status else None,
            new_status=result.new_status.value if result.new_status else None,
            transition_date=result.transition_date.isoformat() if result.transition_date else None,
            errors=result.errors,
            warnings=result.warnings,
            blocking_inspections=result.blocking_inspections,
            affected_sub_events=result.affected_sub_events
        )
        
    except Exception as e:
        logger.error(f"Failed to auto-update sub-event status: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to auto-update status: {str(e)}")

@router.get("/events/{event_id}/status/summary", response_model=EventStatusSummaryResponse)
def get_event_status_summary(
    event_id: int = Path(..., description="Maintenance event ID"),
    session: Session = Depends(get_session)
):
    """Get comprehensive status summary for maintenance event"""
    try:
        status_service = EventStatusManagementService(session)
        
        summary = status_service.get_event_status_summary(
            event_id=event_id,
            is_sub_event=False
        )
        
        return EventStatusSummaryResponse(**summary)
        
    except Exception as e:
        logger.error(f"Failed to get event status summary: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to get status summary: {str(e)}")

@router.get("/sub-events/{sub_event_id}/status/summary", response_model=EventStatusSummaryResponse)
def get_sub_event_status_summary(
    sub_event_id: int = Path(..., description="Maintenance sub-event ID"),
    session: Session = Depends(get_session)
):
    """Get comprehensive status summary for maintenance sub-event"""
    try:
        status_service = EventStatusManagementService(session)
        
        summary = status_service.get_event_status_summary(
            event_id=sub_event_id,
            is_sub_event=True
        )
        
        return EventStatusSummaryResponse(**summary)
        
    except Exception as e:
        logger.error(f"Failed to get sub-event status summary: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to get status summary: {str(e)}")

@router.post("/events/{event_id}/validate-deletion")
def validate_event_deletion(
    event_id: int = Path(..., description="Maintenance event ID"),
    session: Session = Depends(get_session)
):
    """Validate if maintenance event can be deleted"""
    try:
        status_service = EventStatusManagementService(session)
        
        result = status_service.validate_event_deletion(
            event_id=event_id,
            is_sub_event=False
        )
        
        return {
            'can_delete': result.success,
            'errors': result.errors,
            'warnings': result.warnings,
            'blocking_inspections': result.blocking_inspections,
            'affected_sub_events': result.affected_sub_events
        }
        
    except Exception as e:
        logger.error(f"Failed to validate event deletion: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to validate deletion: {str(e)}")

@router.post("/sub-events/{sub_event_id}/validate-deletion")
def validate_sub_event_deletion(
    sub_event_id: int = Path(..., description="Maintenance sub-event ID"),
    session: Session = Depends(get_session)
):
    """Validate if maintenance sub-event can be deleted"""
    try:
        status_service = EventStatusManagementService(session)
        
        result = status_service.validate_event_deletion(
            event_id=sub_event_id,
            is_sub_event=True
        )
        
        return {
            'can_delete': result.success,
            'errors': result.errors,
            'warnings': result.warnings,
            'blocking_inspections': result.blocking_inspections,
            'affected_sub_events': result.affected_sub_events
        }
        
    except Exception as e:
        logger.error(f"Failed to validate sub-event deletion: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to validate deletion: {str(e)}")

# Utility Endpoints

@router.get("/status/valid-transitions")
def get_valid_status_transitions():
    """Get all valid status transitions"""
    try:
        status_service = EventStatusManagementService(None)  # No session needed for static data
        
        transitions = {}
        for current_status, valid_next in status_service.VALID_TRANSITIONS.items():
            transitions[current_status.value] = [status.value for status in valid_next]
        
        return {
            'valid_transitions': transitions,
            'all_statuses': [status.value for status in MaintenanceEventStatus],
            'terminal_statuses': [
                status.value for status, transitions in status_service.VALID_TRANSITIONS.items()
                if len(transitions) == 0
            ]
        }
        
    except Exception as e:
        logger.error(f"Failed to get valid transitions: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to get transitions: {str(e)}")

@router.post("/events/batch-auto-update")
def batch_auto_update_event_status(
    event_ids: list[int],
    include_sub_events: bool = Query(True, description="Include sub-events in batch update"),
    session: Session = Depends(get_session)
):
    """Batch auto-update status for multiple events"""
    try:
        status_service = EventStatusManagementService(session)
        
        results = {}
        
        for event_id in event_ids:
            try:
                # Update main event
                result = status_service.auto_update_event_status_based_on_inspections(
                    event_id=event_id,
                    is_sub_event=False
                )
                
                results[f"event_{event_id}"] = {
                    'success': result.success,
                    'old_status': result.old_status.value if result.old_status else None,
                    'new_status': result.new_status.value if result.new_status else None,
                    'errors': result.errors,
                    'warnings': result.warnings
                }
                
                # Update sub-events if requested
                if include_sub_events:
                    from app.domains.maintenance.models.event import MaintenanceSubEvent
                    sub_events = session.exec(
                        select(MaintenanceSubEvent).where(MaintenanceSubEvent.parent_event_id == event_id)
                    ).all()
                    
                    for sub_event in sub_events:
                        sub_result = status_service.auto_update_event_status_based_on_inspections(
                            event_id=sub_event.id,
                            is_sub_event=True
                        )
                        
                        results[f"sub_event_{sub_event.id}"] = {
                            'success': sub_result.success,
                            'old_status': sub_result.old_status.value if sub_result.old_status else None,
                            'new_status': sub_result.new_status.value if sub_result.new_status else None,
                            'errors': sub_result.errors,
                            'warnings': sub_result.warnings
                        }
                
            except Exception as e:
                results[f"event_{event_id}"] = {
                    'success': False,
                    'error': str(e)
                }
        
        # Calculate summary
        successful_updates = sum(1 for result in results.values() if result.get('success', False))
        failed_updates = len(results) - successful_updates
        
        return {
            'results': results,
            'summary': {
                'total_processed': len(results),
                'successful_updates': successful_updates,
                'failed_updates': failed_updates
            }
        }
        
    except Exception as e:
        logger.error(f"Failed to batch auto-update event status: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to batch update: {str(e)}")