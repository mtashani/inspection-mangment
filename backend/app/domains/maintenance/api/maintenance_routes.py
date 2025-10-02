from fastapi import APIRouter, Depends, HTTPException, Query, Path
from fastapi import APIRouter, Depends, HTTPException, Query, Path
from sqlmodel import Session, select, func
from typing import List, Optional, Dict, Any
from datetime import datetime, date
import logging

from app.database import get_session
from app.domains.maintenance.models.event import MaintenanceEvent, MaintenanceSubEvent
from app.domains.maintenance.models.enums import (
    MaintenanceEventType, 
    MaintenanceEventStatus, 
    OverhaulSubType,
    MaintenanceEventCategory
)
from app.domains.notifications.services.notification_service import NotificationService
from app.core.api_logging import log_api_errors

# Setup logging
logger = logging.getLogger(__name__)

router = APIRouter()

# Pydantic models for request/response
from pydantic import BaseModel

class MaintenanceEventCreateRequest(BaseModel):
    event_number: str
    title: str
    description: Optional[str] = None
    event_type: MaintenanceEventType
    event_category: Optional[MaintenanceEventCategory] = MaintenanceEventCategory.Simple
    planned_start_date: date
    planned_end_date: date
    created_by: Optional[str] = None
    notes: Optional[str] = None

class MaintenanceEventUpdateRequest(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    event_type: Optional[MaintenanceEventType] = None
    event_category: Optional[MaintenanceEventCategory] = None
    status: Optional[MaintenanceEventStatus] = None
    planned_start_date: Optional[date] = None
    planned_end_date: Optional[date] = None
    actual_start_date: Optional[date] = None
    actual_end_date: Optional[date] = None
    approved_by: Optional[str] = None
    notes: Optional[str] = None

class MaintenanceSubEventCreateRequest(BaseModel):
    parent_event_id: int
    sub_event_number: str
    title: str
    description: Optional[str] = None
    sub_type: Optional[OverhaulSubType] = None
    planned_start_date: date
    planned_end_date: date
    notes: Optional[str] = None

class MaintenanceSubEventUpdateRequest(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    sub_type: Optional[OverhaulSubType] = None
    status: Optional[MaintenanceEventStatus] = None
    planned_start_date: Optional[date] = None
    planned_end_date: Optional[date] = None
    actual_start_date: Optional[date] = None
    actual_end_date: Optional[date] = None
    completion_percentage: Optional[float] = None
    notes: Optional[str] = None

class MaintenanceEventResponse(BaseModel):
    id: int
    event_number: str
    title: str
    description: Optional[str]
    event_type: MaintenanceEventType
    event_category: MaintenanceEventCategory
    status: MaintenanceEventStatus
    planned_start_date: date
    planned_end_date: date
    actual_start_date: Optional[date]
    actual_end_date: Optional[date]
    created_by: Optional[str]
    approved_by: Optional[str]
    approval_date: Optional[datetime]
    notes: Optional[str]
    created_at: datetime
    updated_at: datetime

class MaintenanceSubEventResponse(BaseModel):
    id: int
    parent_event_id: int
    sub_event_number: str
    title: str
    description: Optional[str]
    sub_type: Optional[OverhaulSubType]
    status: MaintenanceEventStatus
    planned_start_date: date
    planned_end_date: date
    actual_start_date: Optional[date]
    actual_end_date: Optional[date]
    completion_percentage: float
    notes: Optional[str]
    created_at: datetime
    updated_at: datetime

# Maintenance Events Endpoints

@log_api_errors("maintenance")
@router.get("/events", response_model=List[Dict[str, Any]])
def get_maintenance_events(
    skip: int = Query(0, ge=0, description="Number of records to skip"),
    limit: int = Query(100, ge=1, le=1000, description="Number of records to return"),
    event_type: Optional[MaintenanceEventType] = Query(None, description="Filter by event type"),
    status: Optional[MaintenanceEventStatus] = Query(None, description="Filter by status"),
    from_date: Optional[date] = Query(None, description="Filter events from this date"),
    to_date: Optional[date] = Query(None, description="Filter events to this date"),
    session: Session = Depends(get_session)
):
    """Get list of maintenance events with filtering options"""
    try:
        query = select(MaintenanceEvent)
        
        # Apply filters
        if event_type:
            query = query.where(MaintenanceEvent.event_type == event_type)
        if status:
            query = query.where(MaintenanceEvent.status == status)
        if from_date:
            query = query.where(MaintenanceEvent.planned_start_date >= from_date)
        if to_date:
            query = query.where(MaintenanceEvent.planned_start_date <= to_date)
        
        # Order by creation date (newest first)
        query = query.order_by(MaintenanceEvent.created_at.desc())
        
        # Apply pagination
        events = session.exec(query.offset(skip).limit(limit)).all()
        
        # Prepare response with sub-events count
        response = []
        for event in events:
            # Get sub-events count
            sub_events_count = len(list(session.exec(
                select(MaintenanceSubEvent).where(MaintenanceSubEvent.parent_event_id == event.id)
            ).all()))
            
            # Get inspections count - both direct inspections and sub-event inspections
            from app.domains.inspection.models.inspection import Inspection
            direct_inspections_count = len(list(session.exec(
                select(Inspection).where(Inspection.maintenance_event_id == event.id)
            ).all()))
            
            sub_event_inspections_count = 0
            if sub_events_count > 0:
                # Get all sub-events for this event
                sub_events = session.exec(
                    select(MaintenanceSubEvent).where(MaintenanceSubEvent.parent_event_id == event.id)
                ).all()
                
                for sub_event in sub_events:
                    sub_inspections = len(list(session.exec(
                        select(Inspection).where(Inspection.maintenance_sub_event_id == sub_event.id)
                    ).all()))
                    sub_event_inspections_count += sub_inspections
            
            # Total inspections count
            inspections_count = direct_inspections_count + sub_event_inspections_count
            
            response.append({
                "id": event.id,
                "event_number": event.event_number,
                "title": event.title,
                "description": event.description,
                "event_type": event.event_type,
                "event_category": event.event_category,
                "status": event.status,
                "planned_start_date": event.planned_start_date,
                "planned_end_date": event.planned_end_date,
                "actual_start_date": event.actual_start_date,
                "actual_end_date": event.actual_end_date,
                "created_by": event.created_by,
                "approved_by": event.approved_by,
                "approval_date": event.approval_date,
                "notes": event.notes,
                "sub_events_count": sub_events_count,
                "inspections_count": inspections_count,
                "direct_inspections_count": direct_inspections_count,
                "created_at": event.created_at,
                "updated_at": event.updated_at
            })
        
        return response
        
    except Exception as e:
        logger.error(f"Failed to get maintenance events: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to get maintenance events: {str(e)}")

@log_api_errors("maintenance")
@router.get("/events/{event_id}/inspections")
def get_event_inspections(
    event_id: int = Path(..., description="Maintenance event ID"),
    is_planned: Optional[bool] = Query(None, description="Filter by planned/unplanned inspections"),
    status: Optional[str] = Query(None, description="Filter by inspection status"),
    skip: int = Query(0, ge=0, description="Number of records to skip"),
    limit: int = Query(100, ge=1, le=1000, description="Number of records to return"),
    session: Session = Depends(get_session)
):
    """Get inspections for a specific maintenance event"""
    try:
        # Verify event exists
        event = session.get(MaintenanceEvent, event_id)
        if not event:
            raise HTTPException(
                status_code=404,
                detail=f"Maintenance event with ID {event_id} not found"
            )
        
        # Import inspection models
        from app.domains.inspection.models.inspection import Inspection
        from app.domains.inspection.models.enums import InspectionStatus
        
        # Build query for inspections related to this event
        query = select(Inspection).where(Inspection.maintenance_event_id == event_id)
        
        # Apply filters
        if is_planned is not None:
            query = query.where(Inspection.is_planned == is_planned)
        
        if status:
            try:
                # Convert string to enum
                status_enum = InspectionStatus(status)
                query = query.where(Inspection.status == status_enum)
            except ValueError:
                raise HTTPException(
                    status_code=400,
                    detail=f"Invalid status value: {status}"
                )
        
        # Order by creation date (newest first)
        query = query.order_by(Inspection.created_at.desc())
        
        # Apply pagination
        inspections = session.exec(query.offset(skip).limit(limit)).all()
        
        # Prepare response with equipment details
        from app.domains.equipment.models.equipment import Equipment
        response = []
        for inspection in inspections:
            # Get equipment details
            equipment = session.get(Equipment, inspection.equipment_id)
            
            response.append({
                "id": inspection.id,
                "inspection_number": inspection.inspection_number,
                "title": inspection.title,
                "description": inspection.description,
                "status": inspection.status,
                "equipment_id": inspection.equipment_id,
                "equipment_tag": equipment.tag if equipment else None,
                "equipment_description": equipment.description if equipment else None,
                "requesting_department": inspection.requesting_department,
                "is_planned": inspection.is_planned,
                "unplanned_reason": inspection.unplanned_reason,
                "maintenance_event_id": inspection.maintenance_event_id,
                "maintenance_sub_event_id": inspection.maintenance_sub_event_id,
                # Date fields
                "planned_start_date": inspection.planned_start_date,
                "planned_end_date": inspection.planned_end_date,
                "actual_start_date": inspection.actual_start_date,
                "actual_end_date": inspection.actual_end_date,
                "created_at": inspection.created_at,
                "updated_at": inspection.updated_at
            })
        
        return response
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to get inspections for event {event_id}: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to get event inspections: {str(e)}")

@log_api_errors("maintenance")
@router.get("/statistics/summary")
def get_maintenance_statistics_summary(
    session: Session = Depends(get_session)
):
    """Get general maintenance statistics summary"""
    try:
        # Get total events count
        total_events = session.exec(select(func.count(MaintenanceEvent.id))).first() or 0
        
        # Get events by status
        status_counts = {}
        for status in MaintenanceEventStatus:
            count = session.exec(
                select(func.count(MaintenanceEvent.id))
                .where(MaintenanceEvent.status == status)
            ).first() or 0
            status_counts[status.value] = count
        
        # Get events by type
        type_counts = {}
        for event_type in MaintenanceEventType:
            count = session.exec(
                select(func.count(MaintenanceEvent.id))
                .where(MaintenanceEvent.event_type == event_type)
            ).first() or 0
            type_counts[event_type.value] = count
        
        # Get total inspections count
        from app.domains.inspection.models.inspection import Inspection
        total_inspections = session.exec(select(func.count(Inspection.id))).first() or 0
        
        # Get planned vs unplanned inspections
        planned_inspections = session.exec(
            select(func.count(Inspection.id))
            .where(Inspection.is_planned == True)
        ).first() or 0
        
        unplanned_inspections = session.exec(
            select(func.count(Inspection.id))
            .where(Inspection.is_planned == False)
        ).first() or 0
        
        return {
            "total_events": total_events,
            "status_breakdown": status_counts,
            "type_breakdown": type_counts,
            "total_inspections": total_inspections,
            "planned_inspections": planned_inspections,
            "unplanned_inspections": unplanned_inspections,
            "last_updated": datetime.utcnow()
        }
        
    except Exception as e:
        logger.error(f"Failed to get maintenance statistics: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to get maintenance statistics: {str(e)}")

@log_api_errors("maintenance")
@router.post("/events", response_model=MaintenanceEventResponse)
async def create_maintenance_event(
    event_data: MaintenanceEventCreateRequest,
    session: Session = Depends(get_session)
):
    """Create a new maintenance event"""
    try:
        # Check if event number is unique
        existing = session.exec(
            select(MaintenanceEvent).where(MaintenanceEvent.event_number == event_data.event_number)
        ).first()
        if existing:
            raise HTTPException(
                status_code=400,
                detail=f"Maintenance event number {event_data.event_number} already exists"
            )
        
        # Create maintenance event
        event = MaintenanceEvent(
            event_number=event_data.event_number,
            title=event_data.title,
            description=event_data.description,
            event_type=event_data.event_type,
            event_category=event_data.event_category or MaintenanceEventCategory.Simple,
            planned_start_date=event_data.planned_start_date,
            planned_end_date=event_data.planned_end_date,
            created_by=event_data.created_by,
            notes=event_data.notes,
            status=MaintenanceEventStatus.Planned
        )
        
        session.add(event)
        session.commit()
        session.refresh(event)
        
        logger.info(f"Created maintenance event {event.event_number} (ID: {event.id})")
        
        # Broadcast notification to all users
        try:
            from app.domains.notifications.services.notification_service import NotificationService
            notification_service = NotificationService(session)
            await notification_service.broadcast_event_created(
                event_id=event.id,
                event_number=event.event_number,
                event_title=event.title,
                created_by=event.created_by,
                event_type=event.event_type.value
            )
            logger.info(f"Broadcasted notification for new event {event.event_number}")
        except Exception as notification_error:
            # Don't fail the entire request if notification fails
            logger.error(f"Failed to broadcast notification for event {event.event_number}: {notification_error}")
        
        return MaintenanceEventResponse(
            id=event.id,
            event_number=event.event_number,
            title=event.title,
            description=event.description,
            event_type=event.event_type,
            event_category=event.event_category,
            status=event.status,
            planned_start_date=event.planned_start_date,
            planned_end_date=event.planned_end_date,
            actual_start_date=event.actual_start_date,
            actual_end_date=event.actual_end_date,
            created_by=event.created_by,
            approved_by=event.approved_by,
            approval_date=event.approval_date,
            notes=event.notes,
            created_at=event.created_at,
            updated_at=event.updated_at
        )
        
    except HTTPException:
        raise
    except Exception as e:
        session.rollback()
        logger.error(f"Failed to create maintenance event: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to create maintenance event: {str(e)}")

@log_api_errors("maintenance")
@router.get("/events/{event_id}", response_model=Dict[str, Any])
def get_maintenance_event(
    event_id: int = Path(..., description="Maintenance event ID"),
    session: Session = Depends(get_session)
):
    """Get maintenance event details by ID"""
    try:
        event = session.get(MaintenanceEvent, event_id)
        if not event:
            raise HTTPException(
                status_code=404,
                detail=f"Maintenance event with ID {event_id} not found"
            )
        
        # Get sub-events
        sub_events = session.exec(
            select(MaintenanceSubEvent).where(MaintenanceSubEvent.parent_event_id == event_id)
        ).all()
        
        return {
            "id": event.id,
            "event_number": event.event_number,
            "title": event.title,
            "description": event.description,
            "event_type": event.event_type,
            "event_category": event.event_category,
            "status": event.status,
            "planned_start_date": event.planned_start_date,
            "planned_end_date": event.planned_end_date,
            "actual_start_date": event.actual_start_date,
            "actual_end_date": event.actual_end_date,
            "created_by": event.created_by,
            "approved_by": event.approved_by,
            "approval_date": event.approval_date,
            "notes": event.notes,
            "sub_events": [
                {
                    "id": sub_event.id,
                    "sub_event_number": sub_event.sub_event_number,
                    "title": sub_event.title,
                    "description": sub_event.description,
                    "sub_type": sub_event.sub_type,
                    "status": sub_event.status,
                    "planned_start_date": sub_event.planned_start_date,
                    "planned_end_date": sub_event.planned_end_date,
                    "actual_start_date": sub_event.actual_start_date,
                    "actual_end_date": sub_event.actual_end_date,
                    "completion_percentage": sub_event.completion_percentage,
                    "notes": sub_event.notes
                }
                for sub_event in sub_events
            ],
            "created_at": event.created_at,
            "updated_at": event.updated_at
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to get maintenance event {event_id}: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to get maintenance event: {str(e)}")

@log_api_errors("maintenance")
@router.put("/events/{event_id}", response_model=MaintenanceEventResponse)
async def update_maintenance_event(
    event_id: int = Path(..., description="Maintenance event ID"),
    event_data: MaintenanceEventUpdateRequest = ...,
    session: Session = Depends(get_session)
):
    """Update maintenance event"""
    try:
        event = session.get(MaintenanceEvent, event_id)
        if not event:
            raise HTTPException(
                status_code=404,
                detail=f"Maintenance event with ID {event_id} not found"
            )
        
        # Store old values for notification
        old_status = event.status
        old_values = {
            "title": event.title,
            "description": event.description,
            "event_type": event.event_type,
            "status": event.status,
            "planned_start_date": event.planned_start_date,
            "planned_end_date": event.planned_end_date
        }
        
        # Update fields
        update_data = event_data.dict(exclude_unset=True)
        changes = []
        for key, value in update_data.items():
            if hasattr(event, key) and getattr(event, key) != value:
                changes.append(key.replace('_', ' ').title())
                setattr(event, key, value)
        
        # Handle approval
        if event_data.approved_by and not event.approval_date:
            event.approval_date = datetime.utcnow()
            changes.append("Approved")
        
        event.updated_at = datetime.utcnow()
        
        session.add(event)
        session.commit()
        session.refresh(event)
        
        logger.info(f"Updated maintenance event {event.event_number} (ID: {event.id})")
        
        # Broadcast notifications for changes
        try:
            from app.domains.notifications.services.notification_service import NotificationService
            notification_service = NotificationService(session)
            
            # If status changed, send status change notification
            if old_status != event.status:
                await notification_service.broadcast_event_status_changed(
                    event_id=event.id,
                    event_number=event.event_number,
                    event_title=event.title,
                    old_status=old_status.value,
                    new_status=event.status.value,
                    changed_by=event_data.approved_by or "System"
                )
            
            # If other changes were made, send update notification
            elif changes:
                await notification_service.broadcast_event_updated(
                    event_id=event.id,
                    event_number=event.event_number,
                    event_title=event.title,
                    updated_by=event_data.approved_by or "System",
                    changes=changes
                )
            
            logger.info(f"Broadcasted update notification for event {event.event_number}")
        except Exception as notification_error:
            logger.error(f"Failed to broadcast update notification for event {event.event_number}: {notification_error}")
        
        return MaintenanceEventResponse(
            id=event.id,
            event_number=event.event_number,
            title=event.title,
            description=event.description,
            event_type=event.event_type,
            event_category=event.event_category,
            status=event.status,
            planned_start_date=event.planned_start_date,
            planned_end_date=event.planned_end_date,
            actual_start_date=event.actual_start_date,
            actual_end_date=event.actual_end_date,
            created_by=event.created_by,
            approved_by=event.approved_by,
            approval_date=event.approval_date,
            notes=event.notes,
            created_at=event.created_at,
            updated_at=event.updated_at
        )
        
    except HTTPException:
        raise
    except Exception as e:
        session.rollback()
        logger.error(f"Failed to update maintenance event {event_id}: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to update maintenance event: {str(e)}")

@log_api_errors("maintenance")
@router.delete("/events/{event_id}")
def delete_maintenance_event(
    event_id: int = Path(..., description="Maintenance event ID"),
    session: Session = Depends(get_session)
):
    """Delete maintenance event"""
    try:
        event = session.get(MaintenanceEvent, event_id)
        if not event:
            raise HTTPException(
                status_code=404,
                detail=f"Maintenance event with ID {event_id} not found"
            )
        
        # Check if event can be deleted (only if not in progress or completed)
        if event.status in [MaintenanceEventStatus.InProgress, MaintenanceEventStatus.Completed]:
            raise HTTPException(
                status_code=400,
                detail="Cannot delete maintenance event that is in progress or completed"
            )
        
        # Delete related sub-events first
        sub_events = session.exec(
            select(MaintenanceSubEvent).where(MaintenanceSubEvent.parent_event_id == event_id)
        ).all()
        
        for sub_event in sub_events:
            session.delete(sub_event)
        
        # Delete the event
        session.delete(event)
        session.commit()
        
        logger.info(f"Deleted maintenance event {event.event_number} (ID: {event_id})")
        
        return {"message": f"Maintenance event {event.event_number} deleted successfully"}
        
    except HTTPException:
        raise
    except Exception as e:
        session.rollback()
        logger.error(f"Failed to delete maintenance event {event_id}: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to delete maintenance event: {str(e)}")

# Sub-Events Endpoints

@log_api_errors("maintenance")
@router.get("/sub-events", response_model=List[MaintenanceSubEventResponse])
def get_maintenance_sub_events(
    parent_event_id: Optional[int] = Query(None, description="Filter by parent event ID"),
    skip: int = Query(0, ge=0, description="Number of records to skip"),
    limit: int = Query(100, ge=1, le=1000, description="Number of records to return"),
    session: Session = Depends(get_session)
):
    """Get list of maintenance sub-events"""
    try:
        query = select(MaintenanceSubEvent)
        
        if parent_event_id:
            query = query.where(MaintenanceSubEvent.parent_event_id == parent_event_id)
        
        query = query.order_by(MaintenanceSubEvent.created_at.desc())
        sub_events = session.exec(query.offset(skip).limit(limit)).all()
        
        return [
            MaintenanceSubEventResponse(
                id=sub_event.id,
                parent_event_id=sub_event.parent_event_id,
                sub_event_number=sub_event.sub_event_number,
                title=sub_event.title,
                description=sub_event.description,
                sub_type=sub_event.sub_type,
                status=sub_event.status,
                planned_start_date=sub_event.planned_start_date,
                planned_end_date=sub_event.planned_end_date,
                actual_start_date=sub_event.actual_start_date,
                actual_end_date=sub_event.actual_end_date,
                completion_percentage=sub_event.completion_percentage,
                notes=sub_event.notes,
                created_at=sub_event.created_at,
                updated_at=sub_event.updated_at
            )
            for sub_event in sub_events
        ]
        
    except Exception as e:
        logger.error(f"Failed to get maintenance sub-events: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to get maintenance sub-events: {str(e)}")

@log_api_errors("maintenance")
@router.post("/sub-events", response_model=MaintenanceSubEventResponse)
async def create_maintenance_sub_event(
    sub_event_data: MaintenanceSubEventCreateRequest,
    session: Session = Depends(get_session)
):
    """Create a new maintenance sub-event"""
    try:
        # Verify parent event exists
        parent_event = session.get(MaintenanceEvent, sub_event_data.parent_event_id)
        if not parent_event:
            raise HTTPException(
                status_code=404,
                detail=f"Parent maintenance event with ID {sub_event_data.parent_event_id} not found"
            )
        
        # Check if sub-event number is unique
        existing = session.exec(
            select(MaintenanceSubEvent).where(MaintenanceSubEvent.sub_event_number == sub_event_data.sub_event_number)
        ).first()
        if existing:
            raise HTTPException(
                status_code=400,
                detail=f"Maintenance sub-event number {sub_event_data.sub_event_number} already exists"
            )
        
        # Create sub-event
        sub_event = MaintenanceSubEvent(
            parent_event_id=sub_event_data.parent_event_id,
            sub_event_number=sub_event_data.sub_event_number,
            title=sub_event_data.title,
            description=sub_event_data.description,
            sub_type=sub_event_data.sub_type,
            planned_start_date=sub_event_data.planned_start_date,
            planned_end_date=sub_event_data.planned_end_date,
            notes=sub_event_data.notes,
            status=MaintenanceEventStatus.Planned
        )
        
        session.add(sub_event)
        session.commit()
        session.refresh(sub_event)
        
        logger.info(f"Created maintenance sub-event {sub_event.sub_event_number} (ID: {sub_event.id})")
        
        # Send notification about sub-event creation
        try:
            # Ensure IDs are not None before sending notification
            if sub_event.id is not None and parent_event.id is not None:
                notification_service = NotificationService(session)
                await notification_service.broadcast_sub_event_created(
                    sub_event_id=sub_event.id,
                    sub_event_number=sub_event.sub_event_number,
                    sub_event_title=sub_event.title,
                    parent_event_id=parent_event.id,
                    parent_event_number=parent_event.event_number,
                    parent_event_title=parent_event.title,
                    created_by=None,  # TODO: Get from auth context when implemented
                    sub_type=sub_event.sub_type.value if sub_event.sub_type else None
                )
                logger.info(f"Sent notification for sub-event creation: {sub_event.sub_event_number}")
            else:
                logger.warning(f"Cannot send notification for sub-event {sub_event.sub_event_number}: missing IDs")
        except Exception as notification_error:
            # Don't fail the sub-event creation if notification fails
            logger.error(f"Failed to send notification for sub-event {sub_event.sub_event_number}: {notification_error}")
        
        return MaintenanceSubEventResponse(
            id=sub_event.id,
            parent_event_id=sub_event.parent_event_id,
            sub_event_number=sub_event.sub_event_number,
            title=sub_event.title,
            description=sub_event.description,
            sub_type=sub_event.sub_type,
            status=sub_event.status,
            planned_start_date=sub_event.planned_start_date,
            planned_end_date=sub_event.planned_end_date,
            actual_start_date=sub_event.actual_start_date,
            actual_end_date=sub_event.actual_end_date,
            completion_percentage=sub_event.completion_percentage,
            notes=sub_event.notes,
            created_at=sub_event.created_at,
            updated_at=sub_event.updated_at
        )
        
    except HTTPException:
        raise
    except Exception as e:
        session.rollback()
        logger.error(f"Failed to create maintenance sub-event: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to create maintenance sub-event: {str(e)}")

@log_api_errors("maintenance")
@router.put("/sub-events/{sub_event_id}", response_model=MaintenanceSubEventResponse)
def update_maintenance_sub_event(
    sub_event_id: int = Path(..., description="Maintenance sub-event ID"),
    sub_event_data: MaintenanceSubEventUpdateRequest = ...,
    session: Session = Depends(get_session)
):
    """Update maintenance sub-event"""
    try:
        sub_event = session.get(MaintenanceSubEvent, sub_event_id)
        if not sub_event:
            raise HTTPException(
                status_code=404,
                detail=f"Maintenance sub-event with ID {sub_event_id} not found"
            )
        
        # Update fields
        update_data = sub_event_data.dict(exclude_unset=True)
        for key, value in update_data.items():
            setattr(sub_event, key, value)
        
        sub_event.updated_at = datetime.utcnow()
        
        session.add(sub_event)
        session.commit()
        session.refresh(sub_event)
        
        logger.info(f"Updated maintenance sub-event {sub_event.sub_event_number} (ID: {sub_event.id})")
        
        return MaintenanceSubEventResponse(
            id=sub_event.id,
            parent_event_id=sub_event.parent_event_id,
            sub_event_number=sub_event.sub_event_number,
            title=sub_event.title,
            description=sub_event.description,
            sub_type=sub_event.sub_type,
            status=sub_event.status,
            planned_start_date=sub_event.planned_start_date,
            planned_end_date=sub_event.planned_end_date,
            actual_start_date=sub_event.actual_start_date,
            actual_end_date=sub_event.actual_end_date,
            completion_percentage=sub_event.completion_percentage,
            notes=sub_event.notes,
            created_at=sub_event.created_at,
            updated_at=sub_event.updated_at
        )
        
    except HTTPException:
        raise
    except Exception as e:
        session.rollback()
        logger.error(f"Failed to update maintenance sub-event {sub_event_id}: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to update maintenance sub-event: {str(e)}")

@log_api_errors("maintenance")
@router.delete("/sub-events/{sub_event_id}")
def delete_maintenance_sub_event(
    sub_event_id: int = Path(..., description="Maintenance sub-event ID"),
    session: Session = Depends(get_session)
):
    """Delete maintenance sub-event"""
    try:
        sub_event = session.get(MaintenanceSubEvent, sub_event_id)
        if not sub_event:
            raise HTTPException(
                status_code=404,
                detail=f"Maintenance sub-event with ID {sub_event_id} not found"
            )
        
        # Delete the sub-event
        session.delete(sub_event)
        session.commit()
        
        logger.info(f"Deleted maintenance sub-event {sub_event.sub_event_number} (ID: {sub_event_id})")
        
        return {"message": f"Maintenance sub-event {sub_event.sub_event_number} deleted successfully"}
        
    except HTTPException:
        raise
    except Exception as e:
        session.rollback()
        logger.error(f"Failed to delete maintenance sub-event {sub_event_id}: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to delete maintenance sub-event: {str(e)}")

# Statistics and Reports

@log_api_errors("maintenance")
@router.get("/statistics/summary")
def get_maintenance_statistics(
    from_date: Optional[date] = Query(None, description="Statistics from date"),
    to_date: Optional[date] = Query(None, description="Statistics to date"),
    session: Session = Depends(get_session)
):
    """Get comprehensive maintenance statistics for dashboard"""
    try:
        # Import necessary models
        from app.domains.inspection.models.inspection import Inspection
        from app.domains.daily_report.models.report import DailyReport
        from datetime import datetime
        from calendar import monthrange
        
        # Get maintenance events with date filters
        events_query = select(MaintenanceEvent)
        
        if from_date:
            events_query = events_query.where(MaintenanceEvent.planned_start_date >= from_date)
        if to_date:
            events_query = events_query.where(MaintenanceEvent.planned_start_date <= to_date)
        
        events = session.exec(events_query).all()
        
        # Calculate maintenance events statistics
        total_events = len(events)
        status_counts = {}
        type_counts = {}
        
        for event in events:
            # Count by status
            status = event.status.value if hasattr(event.status, 'value') else str(event.status)
            status_counts[status] = status_counts.get(status, 0) + 1
            
            # Count by type
            event_type = event.event_type.value if hasattr(event.event_type, 'value') else str(event.event_type)
            type_counts[event_type] = type_counts.get(event_type, 0) + 1
        
        # Get inspections statistics
        inspections_query = select(Inspection)
        if from_date:
            inspections_query = inspections_query.where(Inspection.actual_start_date >= from_date)
        if to_date:
            inspections_query = inspections_query.where(Inspection.actual_start_date <= to_date)
        
        inspections = session.exec(inspections_query).all()
        
        # Calculate inspection statistics
        total_inspections = len(inspections)
        active_inspections = len([i for i in inspections if str(i.status) == 'InProgress'])
        completed_inspections = len([i for i in inspections if str(i.status) == 'Completed'])
        
        # Get planned vs unplanned inspections using the is_planned field
        planned_inspections = len([i for i in inspections if i.is_planned])
        unplanned_inspections = total_inspections - planned_inspections
        
        # Get daily reports statistics
        reports_query = select(DailyReport)
        if from_date:
            reports_query = reports_query.where(DailyReport.report_date >= from_date)
        if to_date:
            reports_query = reports_query.where(DailyReport.report_date <= to_date)
        
        reports = session.exec(reports_query).all()
        total_reports = len(reports)
        
        # Get reports for current month
        current_date = datetime.now()
        current_month_start = date(current_date.year, current_date.month, 1)
        _, last_day = monthrange(current_date.year, current_date.month)
        current_month_end = date(current_date.year, current_date.month, last_day)
        
        reports_this_month_query = select(DailyReport).where(
            DailyReport.report_date >= current_month_start,
            DailyReport.report_date <= current_month_end
        )
        reports_this_month = len(session.exec(reports_this_month_query).all())
        
        # Prepare response that matches frontend expectations
        return {
            "total_events": total_events,
            "status_breakdown": status_counts,
            "type_breakdown": type_counts,
            "total_inspections": total_inspections,
            "active_inspections": active_inspections,
            "completed_inspections": completed_inspections,
            "planned_inspections": planned_inspections,
            "unplanned_inspections": unplanned_inspections,
            "total_reports": total_reports,
            "reports_this_month": reports_this_month,
            "date_range": {
                "from": from_date,
                "to": to_date
            }
        }
        
    except Exception as e:
        logger.error(f"Failed to get maintenance statistics: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to get statistics: {str(e)}")

@log_api_errors("maintenance")
@router.post("/events/{event_id}/start")
async def start_maintenance_event(
    event_id: int = Path(..., description="Maintenance event ID"),
    session: Session = Depends(get_session)
):
    """Start a maintenance event"""
    try:
        event = session.get(MaintenanceEvent, event_id)
        if not event:
            raise HTTPException(
                status_code=404,
                detail=f"Maintenance event with ID {event_id} not found"
            )
        
        old_status = event.status
        if event.status != MaintenanceEventStatus.Planned:
            raise HTTPException(
                status_code=400,
                detail=f"Cannot start maintenance event with status {event.status}"
            )
        
        event.status = MaintenanceEventStatus.InProgress
        event.actual_start_date = date.today()
        event.updated_at = datetime.utcnow()
        
        session.add(event)
        session.commit()
        
        # Send notification about status change
        try:
            notification_service = NotificationService(session)
            await notification_service.broadcast_event_status_changed(
                event_id=event.id,
                event_number=event.event_number,
                event_title=event.title,
                old_status=old_status.value,
                new_status=event.status.value,
                changed_by="System"  # TODO: Get from auth context
            )
            logger.info(f"Sent status change notification for event {event.event_number}")
        except Exception as notification_error:
            logger.error(f"Failed to send status change notification: {notification_error}")
        
        logger.info(f"Started maintenance event {event.event_number} (ID: {event_id})")
        
        return {
            "message": f"Maintenance event {event.event_number} started successfully",
            "event_id": event_id,
            "start_date": event.actual_start_date
        }
        
    except HTTPException:
        raise
    except Exception as e:
        session.rollback()
        logger.error(f"Failed to start maintenance event {event_id}: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to start maintenance event: {str(e)}")

@log_api_errors("maintenance")
@router.post("/events/{event_id}/complete")
async def complete_maintenance_event(
    event_id: int = Path(..., description="Maintenance event ID"),
    completion_data: Optional[Dict[str, Any]] = None,
    session: Session = Depends(get_session)
):
    """Complete a maintenance event"""
    try:
        event = session.get(MaintenanceEvent, event_id)
        if not event:
            raise HTTPException(
                status_code=404,
                detail=f"Maintenance event with ID {event_id} not found"
            )
        
        old_status = event.status
        if event.status != MaintenanceEventStatus.InProgress:
            raise HTTPException(
                status_code=400,
                detail=f"Cannot complete maintenance event with status {event.status}"
            )
        
        event.status = MaintenanceEventStatus.Completed
        event.actual_end_date = date.today()
        event.updated_at = datetime.utcnow()
        
        # Add completion notes if provided
        if completion_data and completion_data.get('notes'):
            event.notes = completion_data['notes']
        
        session.add(event)
        session.commit()
        
        # Send notification about status change
        try:
            notification_service = NotificationService(session)
            await notification_service.broadcast_event_status_changed(
                event_id=event.id,
                event_number=event.event_number,
                event_title=event.title,
                old_status=old_status.value,
                new_status=event.status.value,
                changed_by="System"  # TODO: Get from auth context
            )
            logger.info(f"Sent completion notification for event {event.event_number}")
        except Exception as notification_error:
            logger.error(f"Failed to send completion notification: {notification_error}")
        
        logger.info(f"Completed maintenance event {event.event_number} (ID: {event_id})")
        
        return {
            "message": f"Maintenance event {event.event_number} completed successfully",
            "event_id": event_id,
            "completion_date": event.actual_end_date
        }
        
    except HTTPException:
        raise
    except Exception as e:
        session.rollback()
        logger.error(f"Failed to complete maintenance event {event_id}: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to complete maintenance event: {str(e)}")

@log_api_errors("maintenance")
@router.post("/events/{event_id}/reopen")
def reopen_maintenance_event(
    event_id: int = Path(..., description="Maintenance event ID"),
    session: Session = Depends(get_session)
):
    """Reopen a completed maintenance event"""
    try:
        event = session.get(MaintenanceEvent, event_id)
        if not event:
            raise HTTPException(
                status_code=404,
                detail=f"Maintenance event with ID {event_id} not found"
            )
        
        if event.status != MaintenanceEventStatus.Completed:
            raise HTTPException(
                status_code=400,
                detail=f"Cannot reopen maintenance event with status {event.status}. Only completed events can be reopened."
            )
        
        # Revert to InProgress state and clear completion timestamp
        event.status = MaintenanceEventStatus.InProgress
        event.actual_end_date = None  # Clear completion date
        event.updated_at = datetime.utcnow()
        
        session.add(event)
        session.commit()
        
        logger.info(f"Reopened maintenance event {event.event_number} (ID: {event_id})")
        
        return {
            "message": f"Maintenance event {event.event_number} reopened successfully",
            "event_id": event_id,
            "new_status": event.status
        }
        
    except HTTPException:
        raise
    except Exception as e:
        session.rollback()
        logger.error(f"Failed to reopen maintenance event {event_id}: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to reopen maintenance event: {str(e)}")

@log_api_errors("maintenance")
@router.post("/events/{event_id}/approve")
async def approve_maintenance_event(
    event_id: int = Path(..., description="Maintenance event ID"),
    approval_data: Optional[Dict[str, Any]] = None,
    session: Session = Depends(get_session)
):
    """Approve a maintenance event"""
    try:
        event = session.get(MaintenanceEvent, event_id)
        if not event:
            raise HTTPException(
                status_code=404,
                detail=f"Maintenance event with ID {event_id} not found"
            )
        
        if event.approved_by:
            raise HTTPException(
                status_code=400,
                detail=f"Maintenance event {event.event_number} is already approved by {event.approved_by}"
            )
        
        # Set approval information
        approver = approval_data.get('approved_by') if approval_data else "admin"
        event.approved_by = approver
        event.approval_date = datetime.utcnow()
        event.updated_at = datetime.utcnow()
        
        session.add(event)
        session.commit()
        
        # Send notification about approval
        try:
            notification_service = NotificationService(session)
            await notification_service.broadcast_event_approved(
                event_id=event.id,
                event_number=event.event_number,
                event_title=event.title,
                approved_by=approver,
                approval_date=event.approval_date
            )
            logger.info(f"Sent approval notification for event {event.event_number}")
        except Exception as notification_error:
            logger.error(f"Failed to send approval notification: {notification_error}")
        
        logger.info(f"Approved maintenance event {event.event_number} (ID: {event_id}) by {approver}")
        
        return {
            "message": f"Maintenance event {event.event_number} approved successfully",
            "event_id": event_id,
            "approved_by": approver,
            "approval_date": event.approval_date
        }
        
    except HTTPException:
        raise
    except Exception as e:
        session.rollback()
        logger.error(f"Failed to approve maintenance event {event_id}: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to approve maintenance event: {str(e)}")

@log_api_errors("maintenance")
@router.post("/events/{event_id}/revert-approval")
async def revert_event_approval(
    event_id: int = Path(..., description="Maintenance event ID"),
    session: Session = Depends(get_session)
):
    """Revert approval of a maintenance event"""
    try:
        event = session.get(MaintenanceEvent, event_id)
        if not event:
            raise HTTPException(
                status_code=404,
                detail=f"Maintenance event with ID {event_id} not found"
            )
        
        if not event.approved_by:
            raise HTTPException(
                status_code=400,
                detail=f"Maintenance event {event.event_number} is not approved yet"
            )
        
        # Store the previous approver for notification
        previous_approver = event.approved_by
        
        # Clear approval fields
        event.approved_by = None
        event.approval_date = None
        event.updated_at = datetime.utcnow()
        
        session.add(event)
        session.commit()
        
        # Send notification about approval reversal
        notification_service = NotificationService(session)
        await notification_service.broadcast_event_approval_reverted(
            event_id=event.id,
            event_number=event.event_number,
            event_title=event.title,
            reverted_by="admin",  # TODO: Get actual user from context
            previous_approver=previous_approver
        )
        
        logger.info(f"Reverted approval for maintenance event {event.event_number} (ID: {event_id})")
        
        return {
            "message": f"Approval for maintenance event {event.event_number} has been reverted",
            "event_id": event_id,
            "previous_approver": previous_approver,
            "status": event.status
        }
        
    except HTTPException:
        raise
    except Exception as e:
        session.rollback()
        logger.error(f"Failed to revert approval for maintenance event {event_id}: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to revert approval: {str(e)}")

@log_api_errors("maintenance")
@router.post("/events/{event_id}/revert")
def revert_maintenance_event(
    event_id: int = Path(..., description="Maintenance event ID"),
    session: Session = Depends(get_session)
):
    """Revert an in-progress maintenance event back to planned"""
    try:
        event = session.get(MaintenanceEvent, event_id)
        if not event:
            raise HTTPException(
                status_code=404,
                detail=f"Maintenance event with ID {event_id} not found"
            )
        
        if event.status != MaintenanceEventStatus.InProgress:
            raise HTTPException(
                status_code=400,
                detail=f"Cannot revert maintenance event with status {event.status}. Only in-progress events can be reverted."
            )
        
        # Revert to Planned state and clear start timestamp
        # Keep approval status since it was already approved to start
        event.status = MaintenanceEventStatus.Planned
        event.actual_start_date = None  # Clear start date
        event.updated_at = datetime.utcnow()
        
        session.add(event)
        session.commit()
        
        logger.info(f"Reverted maintenance event {event.event_number} (ID: {event_id}) to planning")
        
        return {
            "message": f"Maintenance event {event.event_number} reverted to planning successfully",
            "event_id": event_id,
            "new_status": event.status
        }
        
    except HTTPException:
        raise
    except Exception as e:
        session.rollback()
        logger.error(f"Failed to revert maintenance event {event_id}: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to revert maintenance event: {str(e)}")

@log_api_errors("maintenance")
@router.post("/events/{event_id}/reactivate")
def reactivate_maintenance_event(
    event_id: int = Path(..., description="Maintenance event ID"),
    session: Session = Depends(get_session)
):
    """Reactivate a cancelled maintenance event"""
    try:
        event = session.get(MaintenanceEvent, event_id)
        if not event:
            raise HTTPException(
                status_code=404,
                detail=f"Maintenance event with ID {event_id} not found"
            )
        
        if event.status != MaintenanceEventStatus.Cancelled:
            raise HTTPException(
                status_code=400,
                detail=f"Cannot reactivate maintenance event with status {event.status}. Only cancelled events can be reactivated."
            )
        
        # Reactivate to Planned state and clear all execution-related fields
        # Clear approval to require fresh review after cancellation
        event.status = MaintenanceEventStatus.Planned
        event.actual_start_date = None  # Clear any start date
        event.actual_end_date = None    # Clear any end date
        event.approved_by = None        # Clear approval - requires new approval
        event.approval_date = None      # Clear approval date
        event.updated_at = datetime.utcnow()
        
        session.add(event)
        session.commit()
        
        logger.info(f"Reactivated maintenance event {event.event_number} (ID: {event_id}) - requires new approval")
        
        return {
            "message": f"Maintenance event {event.event_number} reactivated successfully - requires new approval",
            "event_id": event_id,
            "new_status": event.status,
            "requires_approval": True
        }
        
    except HTTPException:
        raise
    except Exception as e:
        session.rollback()
        logger.error(f"Failed to reactivate maintenance event {event_id}: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to reactivate maintenance event: {str(e)}")