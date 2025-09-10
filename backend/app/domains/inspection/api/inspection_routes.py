from fastapi import APIRouter, Depends, HTTPException, Query, Path
from sqlmodel import Session, select, func
from typing import List, Optional, Dict, Any
from datetime import datetime, date
import logging
from fastapi import APIRouter, Depends, HTTPException, Query, Path

from app.database import get_session
from app.domains.inspection.models.inspection import Inspection
from app.domains.inspection.models.enums import InspectionStatus, RefineryDepartment
from app.domains.equipment.models.equipment import Equipment
from app.domains.daily_report.models.report import DailyReport

# Setup logging
logger = logging.getLogger(__name__)

router = APIRouter()

# Pydantic models for request/response
from pydantic import BaseModel

class InspectionCreateRequest(BaseModel):
    inspection_number: str
    title: str
    description: Optional[str] = None
    actual_start_date: Optional[date] = None  # Optional - for unplanned it's filled, for planned it's None initially
    actual_end_date: Optional[date] = None
    # For planned inspections
    planned_start_date: Optional[date] = None  # Used when is_planned=True
    planned_end_date: Optional[date] = None
    equipment_id: int
    requesting_department: RefineryDepartment
    work_order: Optional[str] = None
    permit_number: Optional[str] = None
    # Unified model fields
    is_planned: bool = False  # True for planned inspections, False for unplanned
    unplanned_reason: Optional[str] = None  # Required for unplanned inspections
    maintenance_event_id: Optional[int] = None
    maintenance_sub_event_id: Optional[int] = None


class InspectionUpdateRequest(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    status: Optional[InspectionStatus] = None
    final_report: Optional[str] = None
    work_order: Optional[str] = None
    permit_number: Optional[str] = None
    # Planned dates (for planned inspections)
    planned_start_date: Optional[date] = None
    planned_end_date: Optional[date] = None
    # Actual execution dates
    actual_start_date: Optional[date] = None
    actual_end_date: Optional[date] = None
    # Unified model fields that can be updated
    unplanned_reason: Optional[str] = None

class InspectionResponse(BaseModel):
    id: int
    inspection_number: str
    title: str
    description: Optional[str]
    status: InspectionStatus
    equipment_id: int
    requesting_department: RefineryDepartment
    final_report: Optional[str]
    work_order: Optional[str]
    permit_number: Optional[str]
    # Unified model fields
    is_planned: bool
    unplanned_reason: Optional[str]
    maintenance_event_id: Optional[int]
    maintenance_sub_event_id: Optional[int]
    # All date fields are optional to support both planned and unplanned inspections
    planned_start_date: Optional[date] = None
    planned_end_date: Optional[date] = None
    actual_start_date: Optional[date] = None
    actual_end_date: Optional[date] = None
    created_at: datetime
    updated_at: datetime

@router.get("/", response_model=Dict[str, Any])
def get_inspections(
    skip: int = Query(0, ge=0, description="Number of records to skip"),
    limit: int = Query(100, ge=1, le=1000, description="Number of records to return"),
    search: Optional[str] = Query(None, description="Search in title, number, and description"),
    status: Optional[InspectionStatus] = Query(None, description="Filter by status"),
    equipment_id: Optional[int] = Query(None, description="Filter by equipment ID"),
    equipment_tag: Optional[str] = Query(None, description="Filter by equipment tag"),
    requesting_department: Optional[RefineryDepartment] = Query(None, description="Filter by department"),
    from_date: Optional[date] = Query(None, description="Filter inspections from this date"),
    to_date: Optional[date] = Query(None, description="Filter inspections to this date"),
    date_field: Optional[str] = Query("actual_start_date", description="Date field to filter on: planned_start_date, planned_end_date, actual_start_date, actual_end_date"),
    maintenance_event_id: Optional[int] = Query(None, description="Filter by maintenance event ID"),
    maintenance_sub_event_id: Optional[int] = Query(None, description="Filter by maintenance sub-event ID"),
    is_planned: Optional[bool] = Query(None, description="Filter by planned/unplanned inspections"),
    session: Session = Depends(get_session)
):
    """Get list of inspections with filtering options and pagination info"""
    try:
        # Build base query
        query = select(Inspection)
        
        # Apply search filter (title, number, description)
        if search:
            search_filter = (
                Inspection.title.ilike(f"%{search}%") |
                Inspection.inspection_number.ilike(f"%{search}%") |
                Inspection.description.ilike(f"%{search}%")
            )
            query = query.where(search_filter)
        
        # Apply other filters
        if status:
            query = query.where(Inspection.status == status)
        if equipment_id:
            query = query.where(Inspection.equipment_id == equipment_id)
        if equipment_tag:
            # Join with Equipment table to filter by tag
            query = query.join(Equipment).where(Equipment.tag.ilike(f"%{equipment_tag}%"))
        if requesting_department:
            query = query.where(Inspection.requesting_department == requesting_department)
        
        # Apply date filter based on selected date field
        if from_date or to_date:
            # Validate date_field parameter
            valid_date_fields = ['planned_start_date', 'planned_end_date', 'actual_start_date', 'actual_end_date']
            if date_field not in valid_date_fields:
                date_field = 'actual_start_date'  # Default fallback
            
            # Debug logging
            logger.info(f"Date filter applied: field={date_field}, from={from_date}, to={to_date}")
            
            # Get the actual column attribute
            date_column = getattr(Inspection, date_field)
            
            if from_date:
                # Only filter records that have a non-null date and it's >= from_date
                query = query.where((date_column.is_not(None)) & (date_column >= from_date))
            if to_date:
                # Only filter records that have a non-null date and it's <= to_date
                query = query.where((date_column.is_not(None)) & (date_column <= to_date))
        
        # Handle maintenance event filtering with proper direct inspections logic
        if maintenance_event_id and maintenance_sub_event_id:
            # Filter for specific sub-event inspections
            query = query.where(
                Inspection.maintenance_event_id == maintenance_event_id,
                Inspection.maintenance_sub_event_id == maintenance_sub_event_id
            )
        elif maintenance_event_id and not maintenance_sub_event_id:
            # Filter for direct inspections (belong to event but NOT to any sub-event)
            query = query.where(
                Inspection.maintenance_event_id == maintenance_event_id,
                Inspection.maintenance_sub_event_id.is_(None)
            )
        elif maintenance_sub_event_id and not maintenance_event_id:
            # Filter for specific sub-event only (shouldn't normally happen)
            query = query.where(Inspection.maintenance_sub_event_id == maintenance_sub_event_id)
        if is_planned is not None:
            query = query.where(Inspection.is_planned == is_planned)
        
        # Get total count for pagination
        count_query = select(func.count(Inspection.id))
        
        # Apply same search filter for count
        if search:
            search_filter = (
                Inspection.title.ilike(f"%{search}%") |
                Inspection.inspection_number.ilike(f"%{search}%") |
                Inspection.description.ilike(f"%{search}%")
            )
            count_query = count_query.where(search_filter)
        
        # Apply same filters for count
        if status:
            count_query = count_query.where(Inspection.status == status)
        if equipment_id:
            count_query = count_query.where(Inspection.equipment_id == equipment_id)
        if equipment_tag:
            count_query = count_query.join(Equipment).where(Equipment.tag.ilike(f"%{equipment_tag}%"))
        if requesting_department:
            count_query = count_query.where(Inspection.requesting_department == requesting_department)
        
        # Apply same date filter for count
        if from_date or to_date:
            # Use same date field validation
            valid_date_fields = ['planned_start_date', 'planned_end_date', 'actual_start_date', 'actual_end_date']
            if date_field not in valid_date_fields:
                date_field = 'actual_start_date'  # Default fallback
            
            # Get the actual column attribute
            date_column = getattr(Inspection, date_field)
            
            if from_date:
                # Only count records that have a non-null date and it's >= from_date
                count_query = count_query.where((date_column.is_not(None)) & (date_column >= from_date))
            if to_date:
                # Only count records that have a non-null date and it's <= to_date
                count_query = count_query.where((date_column.is_not(None)) & (date_column <= to_date))
        
        # Apply same maintenance event filtering logic for count query
        if maintenance_event_id and maintenance_sub_event_id:
            # Count for specific sub-event inspections
            count_query = count_query.where(
                Inspection.maintenance_event_id == maintenance_event_id,
                Inspection.maintenance_sub_event_id == maintenance_sub_event_id
            )
        elif maintenance_event_id and not maintenance_sub_event_id:
            # Count for direct inspections (belong to event but NOT to any sub-event)
            count_query = count_query.where(
                Inspection.maintenance_event_id == maintenance_event_id,
                Inspection.maintenance_sub_event_id.is_(None)
            )
        elif maintenance_sub_event_id and not maintenance_event_id:
            # Count for specific sub-event only (shouldn't normally happen)
            count_query = count_query.where(Inspection.maintenance_sub_event_id == maintenance_sub_event_id)
        if is_planned is not None:
            count_query = count_query.where(Inspection.is_planned == is_planned)
        
        total_count = session.exec(count_query).first()
        
        # Order by creation date (newest first)
        query = query.order_by(Inspection.created_at.desc())
        
        # Apply pagination
        inspections = session.exec(query.offset(skip).limit(limit)).all()
        
        # Prepare response with equipment details
        response = []
        for inspection in inspections:
            # Get equipment details
            equipment = session.get(Equipment, inspection.equipment_id)
            
            # Get daily reports count
            daily_reports_count = session.exec(
                select(DailyReport).where(DailyReport.inspection_id == inspection.id)
            ).count() if hasattr(session, 'count') else len(list(session.exec(
                select(DailyReport).where(DailyReport.inspection_id == inspection.id)
            ).all()))
            
            response.append({
                "id": inspection.id,
                "inspection_number": inspection.inspection_number,
                "title": inspection.title,
                "description": inspection.description,
                # All date fields for comprehensive information
                "planned_start_date": inspection.planned_start_date,
                "planned_end_date": inspection.planned_end_date,
                "actual_start_date": inspection.actual_start_date,
                "actual_end_date": inspection.actual_end_date,
                # Frontend v2 compatibility - smart mapping based on inspection type
                "start_date": (
                    inspection.planned_start_date.isoformat() if inspection.is_planned and inspection.planned_start_date else
                    inspection.actual_start_date.isoformat() if inspection.actual_start_date else None
                ),
                "end_date": (
                    inspection.planned_end_date.isoformat() if inspection.is_planned and inspection.planned_end_date else
                    inspection.actual_end_date.isoformat() if inspection.actual_end_date else None
                ),
                "status": inspection.status,
                "equipment_id": inspection.equipment_id,
                "equipment_tag": equipment.tag if equipment else None,
                "equipment_description": equipment.description if equipment else None,
                "requesting_department": inspection.requesting_department,
                "final_report": inspection.final_report,
                "work_order": inspection.work_order,
                "permit_number": inspection.permit_number,
                "daily_reports_count": daily_reports_count,
                # Unified model fields
                "is_planned": inspection.is_planned,
                "unplanned_reason": inspection.unplanned_reason,
                "maintenance_event_id": inspection.maintenance_event_id,
                "maintenance_sub_event_id": inspection.maintenance_sub_event_id,
                # All date fields for comprehensive information
                "planned_start_date": inspection.planned_start_date,
                "planned_end_date": inspection.planned_end_date,
                "actual_start_date": inspection.actual_start_date,
                "actual_end_date": inspection.actual_end_date,
                # Frontend v2 compatibility - smart mapping based on inspection type
                "start_date": (
                    inspection.planned_start_date.isoformat() if inspection.is_planned and inspection.planned_start_date else
                    inspection.actual_start_date.isoformat() if inspection.actual_start_date else None
                ),
                "end_date": (
                    inspection.planned_end_date.isoformat() if inspection.is_planned and inspection.planned_end_date else
                    inspection.actual_end_date.isoformat() if inspection.actual_end_date else None
                ),
                "created_at": inspection.created_at,
                "updated_at": inspection.updated_at
            })
        
        # Calculate pagination metadata
        total_pages = (total_count + limit - 1) // limit if total_count > 0 else 0
        current_page = (skip // limit) + 1
        
        return {
            "data": response,
            "pagination": {
                "total_count": total_count,
                "total_pages": total_pages,
                "current_page": current_page,
                "page_size": limit,
                "has_next": skip + limit < total_count,
                "has_previous": skip > 0
            }
        }
        
    except Exception as e:
        logger.error(f"Failed to get inspections: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to get inspections: {str(e)}")

@router.post("/", response_model=InspectionResponse)
async def create_inspection(
    inspection_data: InspectionCreateRequest,
    session: Session = Depends(get_session)
):
    """Create a new inspection"""
    try:
        # Verify equipment exists
        equipment = session.get(Equipment, inspection_data.equipment_id)
        if not equipment:
            raise HTTPException(
                status_code=404, 
                detail=f"Equipment with ID {inspection_data.equipment_id} not found"
            )
        
        # Validate unified model requirements
        if not inspection_data.is_planned and not inspection_data.unplanned_reason:
            raise HTTPException(
                status_code=400,
                detail="Unplanned reason is required for unplanned inspections"
            )
        
        if inspection_data.is_planned and not inspection_data.planned_start_date:
            raise HTTPException(
                status_code=400,
                detail="Planned start date is required for planned inspections"
            )
        
        if not inspection_data.is_planned and not inspection_data.actual_start_date:
            raise HTTPException(
                status_code=400,
                detail="Actual start date is required for unplanned inspections"
            )
        
        # Check if inspection number is unique
        existing = session.exec(
            select(Inspection).where(Inspection.inspection_number == inspection_data.inspection_number)
        ).first()
        if existing:
            raise HTTPException(
                status_code=400,
                detail=f"Inspection number {inspection_data.inspection_number} already exists"
            )
        
        # Check if equipment has active inspection (only one active inspection per equipment)
        if inspection_data.equipment_id:
            active_inspection = session.exec(
                select(Inspection).where(
                    Inspection.equipment_id == inspection_data.equipment_id,
                    Inspection.status.in_([InspectionStatus.Planned, InspectionStatus.InProgress])
                )
            ).first()
            
            if active_inspection:
                # Get equipment and event/sub-event details for detailed error message
                equipment = session.get(Equipment, inspection_data.equipment_id)
                equipment_tag = equipment.tag if equipment else f"Equipment-{inspection_data.equipment_id}"
                
                event_info = ""
                if active_inspection.maintenance_event_id:
                    from app.domains.maintenance.models.event import MaintenanceEvent
                    event = session.get(MaintenanceEvent, active_inspection.maintenance_event_id)
                    event_info = f" under event '{event.event_number}'"
                    
                    if active_inspection.maintenance_sub_event_id:
                        from app.domains.maintenance.models.event import MaintenanceSubEvent
                        sub_event = session.get(MaintenanceSubEvent, active_inspection.maintenance_sub_event_id)
                        if sub_event:
                            event_info += f" sub-event '{sub_event.sub_event_number}'"
                
                raise HTTPException(
                    status_code=400,
                    detail=f"Equipment '{equipment_tag}' already has active inspection '{active_inspection.inspection_number}'{event_info}. Complete or cancel existing inspection before creating a new one."
                )
        
        # Create inspection with unified model approach
        inspection = Inspection(
            inspection_number=inspection_data.inspection_number,
            title=inspection_data.title,
            description=inspection_data.description,
            # For planned inspections, set planned dates
            planned_start_date=inspection_data.planned_start_date if inspection_data.is_planned else None,
            planned_end_date=inspection_data.planned_end_date if inspection_data.is_planned else None,
            # For unplanned inspections, set actual dates immediately
            actual_start_date=inspection_data.actual_start_date if not inspection_data.is_planned else None,
            actual_end_date=inspection_data.actual_end_date if not inspection_data.is_planned else None,
            equipment_id=inspection_data.equipment_id,
            requesting_department=inspection_data.requesting_department,
            work_order=inspection_data.work_order,
            permit_number=inspection_data.permit_number,
            # Unified model fields
            is_planned=inspection_data.is_planned,
            unplanned_reason=inspection_data.unplanned_reason,
            maintenance_event_id=inspection_data.maintenance_event_id,
            maintenance_sub_event_id=inspection_data.maintenance_sub_event_id,
            # Set status based on whether it's planned or unplanned
            status=InspectionStatus.Planned if inspection_data.is_planned else InspectionStatus.InProgress
        )
        
        session.add(inspection)
        session.commit()
        session.refresh(inspection)
        
        logger.info(f"Created inspection {inspection.inspection_number} (ID: {inspection.id})")
        
        # Send notification about inspection creation
        try:
            from app.domains.notifications.services.notification_service import NotificationService
            notification_service = NotificationService(session)
            
            # Get equipment details for notification
            equipment = session.get(Equipment, inspection.equipment_id)
            equipment_tag = equipment.tag if equipment else f"Equipment-{inspection.equipment_id}"
            
            await notification_service.broadcast_inspection_created(
                inspection_id=inspection.id,
                inspection_number=inspection.inspection_number,
                equipment_tag=equipment_tag,
                event_id=inspection.maintenance_event_id,
                event_number=None,  # TODO: Get actual event number if needed
                sub_event_id=inspection.maintenance_sub_event_id,
                sub_event_number=None,  # TODO: Get actual sub-event number if needed
                created_by="system",  # TODO: Get actual user
                inspection_type="Unplanned" if not inspection.is_planned else "Planned",
                is_planned=inspection.is_planned
            )
        except Exception as e:
            logger.warning(f"Failed to send notification for inspection creation: {str(e)}")
        
        return InspectionResponse(
            id=inspection.id,
            inspection_number=inspection.inspection_number,
            title=inspection.title,
            description=inspection.description,
            # All date fields
            planned_start_date=inspection.planned_start_date,
            planned_end_date=inspection.planned_end_date,
            actual_start_date=inspection.actual_start_date,
            actual_end_date=inspection.actual_end_date,
            status=inspection.status,
            equipment_id=inspection.equipment_id,
            requesting_department=inspection.requesting_department,
            final_report=inspection.final_report,
            work_order=inspection.work_order,
            permit_number=inspection.permit_number,
            # Unified model fields
            is_planned=inspection.is_planned,
            unplanned_reason=inspection.unplanned_reason,
            maintenance_event_id=inspection.maintenance_event_id,
            maintenance_sub_event_id=inspection.maintenance_sub_event_id,
            created_at=inspection.created_at,
            updated_at=inspection.updated_at
        )
        
    except HTTPException:
        raise
    except Exception as e:
        session.rollback()
        logger.error(f"Failed to create inspection: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to create inspection: {str(e)}")

@router.get("/planned", response_model=List[Dict[str, Any]])
def get_planned_inspections(
    skip: int = Query(0, ge=0, description="Number of records to skip"),
    limit: int = Query(100, ge=1, le=1000, description="Number of records to return"),
    maintenance_event_id: Optional[int] = Query(None, description="Filter by maintenance event ID"),
    maintenance_sub_event_id: Optional[int] = Query(None, description="Filter by maintenance sub-event ID"),
    requesting_department: Optional[RefineryDepartment] = Query(None, description="Filter by department"),
    session: Session = Depends(get_session)
):
    """Get list of planned inspections only"""
    try:
        query = select(Inspection).where(Inspection.is_planned == True, Inspection.status == InspectionStatus.Planned)
        
        # Apply filters
        if maintenance_event_id:
            query = query.where(Inspection.maintenance_event_id == maintenance_event_id)
        if maintenance_sub_event_id:
            query = query.where(Inspection.maintenance_sub_event_id == maintenance_sub_event_id)
        if requesting_department:
            query = query.where(Inspection.requesting_department == requesting_department)
        
        # Order by actual start date
        query = query.order_by(Inspection.actual_start_date.asc())
        
        # Apply pagination
        inspections = session.exec(query.offset(skip).limit(limit)).all()
        
        # Prepare response with equipment details
        response = []
        for inspection in inspections:
            # Get equipment details
            equipment = session.get(Equipment, inspection.equipment_id)
            
            response.append({
                "id": inspection.id,
                "inspection_number": inspection.inspection_number,
                "title": inspection.title,
                "description": inspection.description,
                # All date fields for comprehensive information
                "planned_start_date": inspection.planned_start_date,
                "planned_end_date": inspection.planned_end_date,
                "actual_start_date": inspection.actual_start_date,
                "actual_end_date": inspection.actual_end_date,
                # Frontend v2 compatibility - smart mapping based on inspection type
                "start_date": (
                    inspection.planned_start_date.isoformat() if inspection.is_planned and inspection.planned_start_date else
                    inspection.actual_start_date.isoformat() if inspection.actual_start_date else None
                ),
                "end_date": (
                    inspection.planned_end_date.isoformat() if inspection.is_planned and inspection.planned_end_date else
                    inspection.actual_end_date.isoformat() if inspection.actual_end_date else None
                ),
                "status": inspection.status,
                "equipment_id": inspection.equipment_id,
                "equipment_tag": equipment.tag if equipment else None,
                "equipment_description": equipment.description if equipment else None,
                "requesting_department": inspection.requesting_department,
                "work_order": inspection.work_order,
                "permit_number": inspection.permit_number,
                "is_planned": inspection.is_planned,
                # All date fields for comprehensive information
                "planned_start_date": inspection.planned_start_date,
                "planned_end_date": inspection.planned_end_date,
                "actual_start_date": inspection.actual_start_date,
                "actual_end_date": inspection.actual_end_date,
                # Frontend v2 compatibility - smart mapping based on inspection type
                "start_date": (
                    inspection.planned_start_date.isoformat() if inspection.is_planned and inspection.planned_start_date else
                    inspection.actual_start_date.isoformat() if inspection.actual_start_date else None
                ),
                "end_date": (
                    inspection.planned_end_date.isoformat() if inspection.is_planned and inspection.planned_end_date else
                    inspection.actual_end_date.isoformat() if inspection.actual_end_date else None
                ),
                "maintenance_event_id": inspection.maintenance_event_id,
                "maintenance_sub_event_id": inspection.maintenance_sub_event_id,
                "created_at": inspection.created_at,
                "updated_at": inspection.updated_at
            })
        
        return response
        
    except Exception as e:
        logger.error(f"Failed to get planned inspections: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to get planned inspections: {str(e)}")

@router.get("/unplanned", response_model=List[Dict[str, Any]])
def get_unplanned_inspections(
    skip: int = Query(0, ge=0, description="Number of records to skip"),
    limit: int = Query(100, ge=1, le=1000, description="Number of records to return"),
    requesting_department: Optional[RefineryDepartment] = Query(None, description="Filter by department"),
    session: Session = Depends(get_session)
):
    """Get list of unplanned inspections only"""
    try:
        query = select(Inspection).where(Inspection.is_planned == False)
        
        # Apply filters
        if requesting_department:
            query = query.where(Inspection.requesting_department == requesting_department)
        
        # Order by creation date (newest first)
        query = query.order_by(Inspection.created_at.desc())
        
        # Apply pagination
        inspections = session.exec(query.offset(skip).limit(limit)).all()
        
        # Prepare response with equipment details
        response = []
        for inspection in inspections:
            # Get equipment details
            equipment = session.get(Equipment, inspection.equipment_id)
            
            response.append({
                "id": inspection.id,
                "inspection_number": inspection.inspection_number,
                "title": inspection.title,
                "description": inspection.description,
                # All date fields for comprehensive information
                "planned_start_date": inspection.planned_start_date,
                "planned_end_date": inspection.planned_end_date,
                "actual_start_date": inspection.actual_start_date,
                "actual_end_date": inspection.actual_end_date,
                # Frontend v2 compatibility - smart mapping based on inspection type
                "start_date": (
                    inspection.planned_start_date.isoformat() if inspection.is_planned and inspection.planned_start_date else
                    inspection.actual_start_date.isoformat() if inspection.actual_start_date else None
                ),
                "end_date": (
                    inspection.planned_end_date.isoformat() if inspection.is_planned and inspection.planned_end_date else
                    inspection.actual_end_date.isoformat() if inspection.actual_end_date else None
                ),
                "status": inspection.status,
                "equipment_id": inspection.equipment_id,
                "equipment_tag": equipment.tag if equipment else None,
                "equipment_description": equipment.description if equipment else None,
                "requesting_department": inspection.requesting_department,
                "work_order": inspection.work_order,
                "permit_number": inspection.permit_number,
                "is_planned": inspection.is_planned,
                "unplanned_reason": inspection.unplanned_reason,
                # All date fields for comprehensive information
                "planned_start_date": inspection.planned_start_date,
                "planned_end_date": inspection.planned_end_date,
                "actual_start_date": inspection.actual_start_date,
                "actual_end_date": inspection.actual_end_date,
                # Frontend v2 compatibility - smart mapping based on inspection type
                "start_date": (
                    inspection.planned_start_date.isoformat() if inspection.is_planned and inspection.planned_start_date else
                    inspection.actual_start_date.isoformat() if inspection.actual_start_date else None
                ),
                "end_date": (
                    inspection.planned_end_date.isoformat() if inspection.is_planned and inspection.planned_end_date else
                    inspection.actual_end_date.isoformat() if inspection.actual_end_date else None
                ),
                "created_at": inspection.created_at,
                "updated_at": inspection.updated_at
            })
        
        return response
        
    except Exception as e:
        logger.error(f"Failed to get unplanned inspections: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to get unplanned inspections: {str(e)}")

@router.post("/{inspection_id}/start", response_model=Dict[str, Any])
def start_planned_inspection(
    inspection_id: int = Path(..., description="Inspection ID"),
    session: Session = Depends(get_session)
):
    """Start a planned inspection (transition from Planned to InProgress status)"""
    try:
        inspection = session.get(Inspection, inspection_id)
        if not inspection:
            raise HTTPException(
                status_code=404,
                detail=f"Inspection with ID {inspection_id} not found"
            )
        
        if not inspection.is_planned:
            raise HTTPException(
                status_code=400,
                detail="Cannot start an unplanned inspection - it should already be in progress"
            )
        
        if inspection.status != InspectionStatus.Planned:
            raise HTTPException(
                status_code=400,
                detail=f"Cannot start inspection with status {inspection.status}. Only planned inspections can be started."
            )
        
        # Update inspection to InProgress and set actual start date
        inspection.status = InspectionStatus.InProgress
        inspection.actual_start_date = datetime.utcnow().date()
        inspection.updated_at = datetime.utcnow()
        
        session.commit()
        session.refresh(inspection)
        
        logger.info(f"Started planned inspection {inspection.inspection_number} (ID: {inspection.id})")
        
        return {
            "message": "Inspection started successfully",
            "inspection_id": inspection.id,
            "status": inspection.status,
            "actual_start_date": inspection.actual_start_date
        }
        
    except HTTPException:
        raise
    except Exception as e:
        session.rollback()
        logger.error(f"Failed to start inspection: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to start inspection: {str(e)}")

@router.get("/{inspection_id}", response_model=Dict[str, Any])
def get_inspection(
    inspection_id: int = Path(..., description="Inspection ID"),
    session: Session = Depends(get_session)
):
    """Get inspection details by ID"""
    try:
        inspection = session.get(Inspection, inspection_id)
        if not inspection:
            raise HTTPException(
                status_code=404,
                detail=f"Inspection with ID {inspection_id} not found"
            )
        
        # Get equipment details
        equipment = session.get(Equipment, inspection.equipment_id)
        
        # Get daily reports
        daily_reports = session.exec(
            select(DailyReport).where(DailyReport.inspection_id == inspection_id)
        ).all()
        
        return {
            "id": inspection.id,
            "inspection_number": inspection.inspection_number,
            "title": inspection.title,
            "description": inspection.description,
            "actual_start_date": inspection.actual_start_date,
            "actual_end_date": inspection.actual_end_date,
            "status": inspection.status,
            "equipment_id": inspection.equipment_id,
            "equipment": {
                "id": equipment.id,
                "tag": equipment.tag,
                "description": equipment.description,
                "unit": equipment.unit,
                "equipment_type": equipment.equipment_type
            } if equipment else None,
            "requesting_department": inspection.requesting_department,
            "final_report": inspection.final_report,
            "work_order": inspection.work_order,
            "permit_number": inspection.permit_number,
            "daily_reports": [
                {
                    "id": report.id,
                    "report_date": report.report_date,
                    "description": report.description,
                    "inspector_names": report.inspector_names
                }
                for report in daily_reports
            ],
            "created_at": inspection.created_at,
            "updated_at": inspection.updated_at
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to get inspection {inspection_id}: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to get inspection: {str(e)}")

@router.put("/{inspection_id}", response_model=InspectionResponse)
def update_inspection(
    inspection_id: int = Path(..., description="Inspection ID"),
    *,
    inspection_data: InspectionUpdateRequest,
    session: Session = Depends(get_session)
):
    """Update inspection"""
    try:
        inspection = session.get(Inspection, inspection_id)
        if not inspection:
            raise HTTPException(
                status_code=404,
                detail=f"Inspection with ID {inspection_id} not found"
            )
        
        # Update fields
        update_data = inspection_data.dict(exclude_unset=True)
        for key, value in update_data.items():
            setattr(inspection, key, value)
        
        inspection.updated_at = datetime.utcnow()
        
        session.add(inspection)
        session.commit()
        session.refresh(inspection)
        
        logger.info(f"Updated inspection {inspection.inspection_number} (ID: {inspection.id})")
        
        return InspectionResponse(
            id=inspection.id,
            inspection_number=inspection.inspection_number,
            title=inspection.title,
            description=inspection.description,
            # All date fields
            planned_start_date=inspection.planned_start_date,
            planned_end_date=inspection.planned_end_date,
            actual_start_date=inspection.actual_start_date,
            actual_end_date=inspection.actual_end_date,
            status=inspection.status,
            equipment_id=inspection.equipment_id,
            requesting_department=inspection.requesting_department,
            final_report=inspection.final_report,
            work_order=inspection.work_order,
            permit_number=inspection.permit_number,
            # Unified model fields
            is_planned=inspection.is_planned,
            unplanned_reason=inspection.unplanned_reason,
            maintenance_event_id=inspection.maintenance_event_id,
            maintenance_sub_event_id=inspection.maintenance_sub_event_id,
            created_at=inspection.created_at,
            updated_at=inspection.updated_at
        )
        
    except HTTPException:
        raise
    except Exception as e:
        session.rollback()
        logger.error(f"Failed to update inspection {inspection_id}: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to update inspection: {str(e)}")

@router.delete("/{inspection_id}")
def delete_inspection(
    inspection_id: int = Path(..., description="Inspection ID"),
    session: Session = Depends(get_session)
):
    """Delete inspection"""
    try:
        inspection = session.get(Inspection, inspection_id)
        if not inspection:
            raise HTTPException(
                status_code=404,
                detail=f"Inspection with ID {inspection_id} not found"
            )
        
        # Check if inspection can be deleted (only if in draft or cancelled status)
        if inspection.status not in [InspectionStatus.InProgress]:
            # Allow deletion of in-progress inspections, but warn about completed ones
            if inspection.status == InspectionStatus.Completed:
                # For completed inspections, we might want to prevent deletion
                # or require special permissions
                pass
        
        # Delete related daily reports first
        daily_reports = session.exec(
            select(DailyReport).where(DailyReport.inspection_id == inspection_id)
        ).all()
        
        for report in daily_reports:
            session.delete(report)
        
        # Delete the inspection
        session.delete(inspection)
        session.commit()
        
        logger.info(f"Deleted inspection {inspection.inspection_number} (ID: {inspection_id})")
        
        return {"message": f"Inspection {inspection.inspection_number} deleted successfully"}
        
    except HTTPException:
        raise
    except Exception as e:
        session.rollback()
        logger.error(f"Failed to delete inspection {inspection_id}: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to delete inspection: {str(e)}")

@router.post("/{inspection_id}/complete")
def complete_inspection(
    inspection_id: int = Path(..., description="Inspection ID"),
    completion_data: Optional[Dict[str, Any]] = None,
    session: Session = Depends(get_session)
):
    """Mark inspection as completed"""
    try:
        inspection = session.get(Inspection, inspection_id)
        if not inspection:
            raise HTTPException(
                status_code=404,
                detail=f"Inspection with ID {inspection_id} not found"
            )
        
        if inspection.status == InspectionStatus.Completed:
            raise HTTPException(
                status_code=400,
                detail="Inspection is already completed"
            )
        
        # Update inspection status
        inspection.status = InspectionStatus.Completed
        inspection.actual_end_date = date.today()
        inspection.updated_at = datetime.utcnow()
        
        # Add completion notes if provided
        if completion_data and completion_data.get('final_report'):
            inspection.final_report = completion_data['final_report']
        
        session.add(inspection)
        session.commit()
        
        logger.info(f"Completed inspection {inspection.inspection_number} (ID: {inspection_id})")
        
        return {
            "message": f"Inspection {inspection.inspection_number} marked as completed",
            "inspection_id": inspection_id,
            "completion_date": inspection.actual_end_date
        }
        
    except HTTPException:
        raise
    except Exception as e:
        session.rollback()
        logger.error(f"Failed to complete inspection {inspection_id}: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to complete inspection: {str(e)}")

@router.get("/statistics/summary")
def get_inspection_statistics(
    from_date: Optional[date] = Query(None, description="Statistics from date"),
    to_date: Optional[date] = Query(None, description="Statistics to date"),
    session: Session = Depends(get_session)
):
    """Get inspection statistics"""
    try:
        query = select(Inspection)
        
        if from_date:
            query = query.where(Inspection.actual_start_date >= from_date)
        if to_date:
            query = query.where(Inspection.actual_start_date <= to_date)
        
        inspections = session.exec(query).all()
        
        # Calculate statistics
        total_inspections = len(inspections)
        status_counts = {}
        department_counts = {}
        
        for inspection in inspections:
            # Count by status
            status = inspection.status.value if hasattr(inspection.status, 'value') else str(inspection.status)
            status_counts[status] = status_counts.get(status, 0) + 1
            
            # Count by department
            dept = inspection.requesting_department.value if hasattr(inspection.requesting_department, 'value') else str(inspection.requesting_department)
            department_counts[dept] = department_counts.get(dept, 0) + 1
        
        return {
            "total_inspections": total_inspections,
            "status_breakdown": status_counts,
            "department_breakdown": department_counts,
            "date_range": {
                "from": from_date,
                "to": to_date
            }
        }
        
    except Exception as e:
        logger.error(f"Failed to get inspection statistics: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to get statistics: {str(e)}")

@router.get("/by-equipment/{equipment_id}")
def get_inspections_by_equipment(
    equipment_id: int = Path(..., description="Equipment ID"),
    session: Session = Depends(get_session)
):
    """Get all inspections for a specific equipment"""
    try:
        # Verify equipment exists
        equipment = session.get(Equipment, equipment_id)
        if not equipment:
            raise HTTPException(
                status_code=404,
                detail=f"Equipment with ID {equipment_id} not found"
            )
        
        # Get inspections
        inspections = session.exec(
            select(Inspection)
            .where(Inspection.equipment_id == equipment_id)
            .order_by(Inspection.actual_start_date.desc())
        ).all()
        
        return {
            "equipment": {
                "id": equipment.id,
                "tag": equipment.tag,
                "description": equipment.description,
                "unit": equipment.unit
            },
            "inspections": [
                {
                    "id": inspection.id,
                    "inspection_number": inspection.inspection_number,
                    "title": inspection.title,
                    "actual_start_date": inspection.actual_start_date,
                    "actual_end_date": inspection.actual_end_date,
                    "status": inspection.status,
                    "requesting_department": inspection.requesting_department
                }
                for inspection in inspections
            ],
            "total_count": len(inspections)
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to get inspections for equipment {equipment_id}: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to get inspections: {str(e)}")