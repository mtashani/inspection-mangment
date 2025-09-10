"""API routes for enhanced maintenance event reporting and analytics"""

from fastapi import APIRouter, Depends, HTTPException, Query, Path
from sqlmodel import Session, select
from typing import List, Optional, Dict, Any
from datetime import datetime, date
import logging

from app.database import get_session
from app.domains.maintenance.models.event import MaintenanceEvent, MaintenanceSubEvent
from app.domains.inspection.models.inspection import Inspection
from app.domains.inspection.models.enums import InspectionStatus
from app.domains.inspection.services.inspection_service import InspectionService
from app.domains.maintenance.services.inspection_history import InspectionHistoryService

# Setup logging
logger = logging.getLogger(__name__)

router = APIRouter()

# Pydantic models for response
from pydantic import BaseModel

class EventStatisticsResponse(BaseModel):
    event_id: int
    event_number: str
    event_title: str
    total_planned_inspections: int
    active_inspections: int
    completed_inspections: int
    first_time_inspections_count: int
    equipment_status_breakdown: Dict[str, int]
    inspection_status_breakdown: Dict[str, int]
    priority_breakdown: Dict[str, int]
    completion_percentage: float
    event_dates: Dict[str, Any]

class RequesterBreakdownItem(BaseModel):
    requester: str
    planned_inspections: int
    in_progress_inspections: int
    completed_inspections: int
    first_time_inspections: int
    total_inspections: int
    completion_percentage: float

class RequesterBreakdownResponse(BaseModel):
    event_id: int
    event_number: str
    event_title: str
    requester_breakdown: List[RequesterBreakdownItem]
    total_requesters: int
    summary: Dict[str, int]

class EquipmentStatusItem(BaseModel):
    equipment_tag: str
    equipment_description: Optional[str]
    equipment_type: str
    unit: str
    status: str  # "planned", "under_inspection", "completed", "not_planned"
    inspection_count: int
    is_first_time: bool
    current_inspection_id: Optional[int]
    last_inspection_date: Optional[date]
    requester: Optional[str]
    priority: Optional[str]

class EquipmentStatusResponse(BaseModel):
    event_id: int
    event_number: str
    event_title: str
    equipment_status: List[EquipmentStatusItem]
    status_summary: Dict[str, int]
    total_equipment: int

class SubEventStatisticsResponse(BaseModel):
    sub_event_id: int
    sub_event_number: str
    sub_event_title: str
    parent_event_id: int
    statistics: EventStatisticsResponse

# Enhanced Reporting Endpoints

@router.get("/events/{event_id}/statistics", response_model=EventStatisticsResponse)
def get_event_statistics(
    event_id: int = Path(..., description="Maintenance event ID"),
    session: Session = Depends(get_session)
):
    """Get comprehensive statistics for a maintenance event"""
    try:
        # Verify event exists
        event = session.get(MaintenanceEvent, event_id)
        if not event:
            raise HTTPException(
                status_code=404,
                detail=f"Maintenance event with ID {event_id} not found"
            )
        
        # Get inspection service for statistics
        inspection_service = InspectionService(session)
        
        # Get event inspection statistics
        stats = inspection_service.get_event_inspection_statistics(
            maintenance_event_id=event_id
        )
        
        # Get planned inspections (using unified model with is_planned=True)
        planned_inspections = session.exec(
            select(Inspection).where(
                Inspection.maintenance_event_id == event_id,
                Inspection.is_planned == True
            )
        ).all()
        
        # Get all inspections for the event
        all_inspections = session.exec(
            select(Inspection).where(Inspection.maintenance_event_id == event_id)
        ).all()
        
        # Calculate inspection status breakdown
        inspection_status_breakdown = {}
        for inspection in all_inspections:
            status_key = inspection.status.value if hasattr(inspection.status, 'value') else str(inspection.status)
            inspection_status_breakdown[status_key] = inspection_status_breakdown.get(status_key, 0) + 1
        
        # Calculate equipment status breakdown
        equipment_status_breakdown = {
            "planned": len([i for i in planned_inspections if i.status == InspectionStatus.Planned]),
            "under_inspection": len([i for i in all_inspections if i.status == InspectionStatus.InProgress]),
            "completed": len([i for i in all_inspections if i.status == InspectionStatus.Completed])
        }
        
        # Calculate completion percentage
        total_planned = len(planned_inspections)
        completed_inspections = len([i for i in all_inspections if i.status == InspectionStatus.Completed])
        completion_percentage = (completed_inspections / total_planned * 100) if total_planned > 0 else 0
        
        # Get first-time inspections count
        first_time_count = InspectionHistoryService.get_first_time_inspections_count_for_event(
            maintenance_event_id=event_id,
            session=session
        )
        
        return EventStatisticsResponse(
            event_id=event.id,
            event_number=event.event_number,
            event_title=event.title,
            total_planned_inspections=total_planned,
            active_inspections=len([i for i in all_inspections if i.status == InspectionStatus.InProgress]),
            completed_inspections=completed_inspections,
            first_time_inspections_count=first_time_count,
            equipment_status_breakdown=equipment_status_breakdown,
            inspection_status_breakdown=inspection_status_breakdown,
            priority_breakdown={},  # Removed since no priority field in unified model
            completion_percentage=completion_percentage,
            event_dates={
                "planned_start_date": event.planned_start_date,
                "planned_end_date": event.planned_end_date,
                "actual_start_date": event.actual_start_date,
                "actual_end_date": event.actual_end_date
            }
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to get event statistics for event {event_id}: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to get event statistics: {str(e)}")

@router.get("/events/{event_id}/requester-breakdown", response_model=RequesterBreakdownResponse)
def get_event_requester_breakdown(
    event_id: int = Path(..., description="Maintenance event ID"),
    session: Session = Depends(get_session)
):
    """Get requester breakdown analysis for a maintenance event"""
    try:
        # Verify event exists
        event = session.get(MaintenanceEvent, event_id)
        if not event:
            raise HTTPException(
                status_code=404,
                detail=f"Maintenance event with ID {event_id} not found"
            )
        
        # Get planned inspections (using unified model)
        planned_inspections = session.exec(
            select(Inspection).where(
                Inspection.maintenance_event_id == event_id,
                Inspection.is_planned == True
            )
        ).all()
        
        # Get actual inspections
        actual_inspections = session.exec(
            select(Inspection).where(Inspection.maintenance_event_id == event_id)
        ).all()
        
        # Group by requester (using requesting_department from unified model)
        requester_data = {}
        
        # Process all inspections
        for inspection in actual_inspections:
            # Get requester from requesting department
            requester = inspection.requesting_department.value if hasattr(inspection.requesting_department, 'value') else str(inspection.requesting_department)
            
            if requester not in requester_data:
                requester_data[requester] = {
                    "planned": 0,
                    "in_progress": 0,
                    "completed": 0,
                    "first_time": 0,
                    "equipment_tags": set()
                }
            
            # Count by status and planned flag
            if inspection.is_planned:
                requester_data[requester]["planned"] += 1
            
            if inspection.status == InspectionStatus.InProgress:
                requester_data[requester]["in_progress"] += 1
            elif inspection.status == InspectionStatus.Completed:
                requester_data[requester]["completed"] += 1
            
            # Check if first-time inspection
            if inspection.equipment:
                is_first_time = InspectionHistoryService.is_first_time_inspection(
                    inspection.equipment.tag, session
                )
                if is_first_time:
                    requester_data[requester]["first_time"] += 1
                
                requester_data[requester]["equipment_tags"].add(inspection.equipment.tag)
        
        # Build response
        breakdown_items = []
        for requester, data in requester_data.items():
            total_inspections = data["planned"] + data["in_progress"] + data["completed"]
            completion_percentage = (data["completed"] / total_inspections * 100) if total_inspections > 0 else 0
            
            breakdown_items.append(RequesterBreakdownItem(
                requester=requester,
                planned_inspections=data["planned"],
                in_progress_inspections=data["in_progress"],
                completed_inspections=data["completed"],
                first_time_inspections=data["first_time"],
                total_inspections=total_inspections,
                completion_percentage=completion_percentage
            ))
        
        # Sort by total inspections descending
        breakdown_items.sort(key=lambda x: x.total_inspections, reverse=True)
        
        # Calculate summary
        summary = {
            "total_planned": sum(item.planned_inspections for item in breakdown_items),
            "total_in_progress": sum(item.in_progress_inspections for item in breakdown_items),
            "total_completed": sum(item.completed_inspections for item in breakdown_items),
            "total_first_time": sum(item.first_time_inspections for item in breakdown_items)
        }
        
        return RequesterBreakdownResponse(
            event_id=event.id,
            event_number=event.event_number,
            event_title=event.title,
            requester_breakdown=breakdown_items,
            total_requesters=len(breakdown_items),
            summary=summary
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to get requester breakdown for event {event_id}: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to get requester breakdown: {str(e)}")

@router.get("/events/{event_id}/equipment-status", response_model=EquipmentStatusResponse)
def get_event_equipment_status(
    event_id: int = Path(..., description="Maintenance event ID"),
    status_filter: Optional[str] = Query(None, description="Filter by status: planned, under_inspection, completed, not_planned"),
    equipment_type: Optional[str] = Query(None, description="Filter by equipment type"),
    unit: Optional[str] = Query(None, description="Filter by unit"),
    session: Session = Depends(get_session)
):
    """Get equipment status overview for a maintenance event"""
    try:
        # Verify event exists
        event = session.get(MaintenanceEvent, event_id)
        if not event:
            raise HTTPException(
                status_code=404,
                detail=f"Maintenance event with ID {event_id} not found"
            )
        
        # Get all equipment involved in this event (from plans and inspections)
        planned_equipment_tags = set()
        inspection_equipment_tags = set()
        
        # Get equipment from planned inspections (using unified model)
        planned_inspections = session.exec(
            select(Inspection).where(
                Inspection.maintenance_event_id == event_id,
                Inspection.is_planned == True
            )
        ).all()
        
        for inspection in planned_inspections:
            if inspection.equipment:
                planned_equipment_tags.add(inspection.equipment.tag)
        
        # Get equipment from actual inspections
        actual_inspections = session.exec(
            select(Inspection).where(Inspection.maintenance_event_id == event_id)
        ).all()
        
        for inspection in actual_inspections:
            if inspection.equipment:
                inspection_equipment_tags.add(inspection.equipment.tag)
        
        # Combine all equipment tags
        all_equipment_tags = planned_equipment_tags.union(inspection_equipment_tags)
        
        # Get equipment details
        from app.domains.equipment.models.equipment import Equipment
        equipment_list = []
        if all_equipment_tags:
            equipment_query = select(Equipment).where(Equipment.tag.in_(all_equipment_tags))
            
            # Apply filters
            if equipment_type:
                equipment_query = equipment_query.where(Equipment.equipment_type.ilike(f"%{equipment_type}%"))
            if unit:
                equipment_query = equipment_query.where(Equipment.unit.ilike(f"%{unit}%"))
            
            equipment_list = list(session.exec(equipment_query).all())
        
        # Build equipment status items
        equipment_status_items = []
        status_summary = {"planned": 0, "under_inspection": 0, "completed": 0, "not_planned": 0}
        
        for equipment in equipment_list:
            # Determine status
            status = "not_planned"
            current_inspection_id = None
            last_inspection_date = None
            requester = None
            priority = None
            
            # Check if equipment is planned
            equipment_planned_inspection = None
            for inspection in planned_inspections:
                if inspection.equipment and inspection.equipment.tag == equipment.tag:
                    equipment_planned_inspection = inspection
                    status = "planned"
                    requester = inspection.requesting_department.value if hasattr(inspection.requesting_department, 'value') else str(inspection.requesting_department)
                    # No priority field in unified model
                    priority = None
                    break
            
            # Check if equipment has active inspection
            for inspection in actual_inspections:
                if inspection.equipment and inspection.equipment.tag == equipment.tag:
                    if inspection.status == InspectionStatus.InProgress:
                        status = "under_inspection"
                        current_inspection_id = inspection.id
                    elif inspection.status == InspectionStatus.Completed:
                        status = "completed"
                        last_inspection_date = inspection.actual_end_date or inspection.actual_start_date
                    
                    # Get requester from inspection
                    if not requester:
                        requester = inspection.requesting_department.value if hasattr(inspection.requesting_department, 'value') else str(inspection.requesting_department)
            
            # Apply status filter
            if status_filter and status != status_filter:
                continue
            
            # Get inspection count and first-time status
            inspection_count = InspectionHistoryService.get_equipment_inspection_count(equipment.tag, session)
            is_first_time = InspectionHistoryService.is_first_time_inspection(equipment.tag, session)
            
            equipment_status_items.append(EquipmentStatusItem(
                equipment_tag=equipment.tag,
                equipment_description=equipment.description,
                equipment_type=equipment.equipment_type,
                unit=equipment.unit,
                status=status,
                inspection_count=inspection_count,
                is_first_time=is_first_time,
                current_inspection_id=current_inspection_id,
                last_inspection_date=last_inspection_date,
                requester=requester,
                priority=priority
            ))
            
            # Update status summary
            status_summary[status] += 1
        
        # Sort by equipment tag
        equipment_status_items.sort(key=lambda x: x.equipment_tag)
        
        return EquipmentStatusResponse(
            event_id=event.id,
            event_number=event.event_number,
            event_title=event.title,
            equipment_status=equipment_status_items,
            status_summary=status_summary,
            total_equipment=len(equipment_status_items)
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to get equipment status for event {event_id}: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to get equipment status: {str(e)}")

# Sub-Event Reporting Endpoints

@router.get("/sub-events/{sub_event_id}/statistics", response_model=SubEventStatisticsResponse)
def get_sub_event_statistics(
    sub_event_id: int = Path(..., description="Maintenance sub-event ID"),
    session: Session = Depends(get_session)
):
    """Get comprehensive statistics for a maintenance sub-event"""
    try:
        # Verify sub-event exists
        sub_event = session.get(MaintenanceSubEvent, sub_event_id)
        if not sub_event:
            raise HTTPException(
                status_code=404,
                detail=f"Maintenance sub-event with ID {sub_event_id} not found"
            )
        
        # Get inspection service for statistics
        inspection_service = InspectionService(session)
        
        # Get sub-event inspection statistics
        stats = inspection_service.get_event_inspection_statistics(
            maintenance_sub_event_id=sub_event_id
        )
        
        # Get planned inspections (using unified model)
        planned_inspections = session.exec(
            select(Inspection).where(
                Inspection.maintenance_sub_event_id == sub_event_id,
                Inspection.is_planned == True
            )
        ).all()
        
        # Get actual inspections
        actual_inspections = session.exec(
            select(Inspection).where(Inspection.maintenance_sub_event_id == sub_event_id)
        ).all()
        
        # Priority breakdown removed since unified model doesn't have priority field
        priority_breakdown = {}
        
        # Calculate inspection status breakdown
        inspection_status_breakdown = {}
        for inspection in actual_inspections:
            status_key = inspection.status.value if hasattr(inspection.status, 'value') else str(inspection.status)
            inspection_status_breakdown[status_key] = inspection_status_breakdown.get(status_key, 0) + 1
        
        # Calculate equipment status breakdown
        equipment_status_breakdown = {
            "planned": len([i for i in planned_inspections if i.status == InspectionStatus.Planned]),
            "under_inspection": len([i for i in actual_inspections if i.status == InspectionStatus.InProgress]),
            "completed": len([i for i in actual_inspections if i.status == InspectionStatus.Completed])
        }
        
        # Calculate completion percentage
        total_planned = len(planned_inspections)
        completed_inspections = len([i for i in actual_inspections if i.status == InspectionStatus.Completed])
        completion_percentage = (completed_inspections / total_planned * 100) if total_planned > 0 else 0
        
        # Get first-time inspections count
        first_time_count = InspectionHistoryService.get_first_time_inspections_count_for_event(
            maintenance_sub_event_id=sub_event_id,
            session=session
        )
        
        # Create statistics response
        statistics = EventStatisticsResponse(
            event_id=sub_event.id,
            event_number=sub_event.sub_event_number,
            event_title=sub_event.title,
            total_planned_inspections=total_planned,
            active_inspections=len([i for i in actual_inspections if i.status == InspectionStatus.InProgress]),
            completed_inspections=completed_inspections,
            first_time_inspections_count=first_time_count,
            equipment_status_breakdown=equipment_status_breakdown,
            inspection_status_breakdown=inspection_status_breakdown,
            priority_breakdown=priority_breakdown,
            completion_percentage=completion_percentage,
            event_dates={
                "planned_start_date": sub_event.planned_start_date,
                "planned_end_date": sub_event.planned_end_date,
                "actual_start_date": sub_event.actual_start_date,
                "actual_end_date": sub_event.actual_end_date
            }
        )
        
        return SubEventStatisticsResponse(
            sub_event_id=sub_event.id,
            sub_event_number=sub_event.sub_event_number,
            sub_event_title=sub_event.title,
            parent_event_id=sub_event.parent_event_id,
            statistics=statistics
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to get sub-event statistics for sub-event {sub_event_id}: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to get sub-event statistics: {str(e)}")

# Combined Event and Sub-Event Reporting

@router.get("/events/{event_id}/complete-statistics")
def get_complete_event_statistics(
    event_id: int = Path(..., description="Maintenance event ID"),
    include_sub_events: bool = Query(True, description="Include sub-event statistics"),
    session: Session = Depends(get_session)
):
    """Get complete statistics for a maintenance event including all sub-events"""
    try:
        # Verify event exists
        event = session.get(MaintenanceEvent, event_id)
        if not event:
            raise HTTPException(
                status_code=404,
                detail=f"Maintenance event with ID {event_id} not found"
            )
        
        # Get main event statistics
        main_stats_response = get_event_statistics(event_id, session)
        
        result = {
            "event": main_stats_response.dict(),
            "sub_events": []
        }
        
        if include_sub_events:
            # Get sub-events
            sub_events = session.exec(
                select(MaintenanceSubEvent).where(MaintenanceSubEvent.parent_event_id == event_id)
            ).all()
            
            for sub_event in sub_events:
                try:
                    sub_stats = get_sub_event_statistics(sub_event.id, session)
                    result["sub_events"].append(sub_stats.dict())
                except Exception as e:
                    logger.warning(f"Failed to get statistics for sub-event {sub_event.id}: {str(e)}")
                    # Continue with other sub-events
        
        return result
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to get complete event statistics for event {event_id}: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to get complete event statistics: {str(e)}")