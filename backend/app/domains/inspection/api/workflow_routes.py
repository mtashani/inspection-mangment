"""API routes for unified inspection workflow management"""

from fastapi import APIRouter, Depends, HTTPException, Path
from sqlmodel import Session, select
from typing import Dict, Any, Optional
from datetime import datetime, date
import logging
from pydantic import BaseModel

from app.database import get_session
from app.domains.inspection.models.inspection import Inspection
from app.domains.equipment.models.equipment import Equipment
from app.domains.inspection.models.enums import InspectionStatus, RefineryDepartment
from app.domains.common.models.status_history import StatusHistory, EntityType

# Setup logging
logger = logging.getLogger(__name__)

router = APIRouter()

class CreatePlannedInspectionRequest(BaseModel):
    title: str
    description: Optional[str] = None
    equipment_id: int
    maintenance_event_id: Optional[int] = None
    maintenance_sub_event_id: Optional[int] = None
    requesting_department: RefineryDepartment
    planned_start_date: date
    planned_end_date: Optional[date] = None
    work_order: Optional[str] = None
    permit_number: Optional[str] = None

class StartPlannedInspectionRequest(BaseModel):
    inspector_id: Optional[int] = None
    actual_start_date: Optional[date] = None
    notes: Optional[str] = None

@router.post("/planned-inspections")
async def create_planned_inspection(
    request_data: CreatePlannedInspectionRequest,
    session: Session = Depends(get_session)
):
    """Create a planned inspection using unified model"""
    try:
        # Get equipment 
        equipment = session.get(Equipment, request_data.equipment_id)
        if not equipment:
            raise HTTPException(status_code=404, detail=f"Equipment {request_data.equipment_id} not found")
        
        # Generate inspection number
        timestamp = datetime.now().strftime("%Y%m%d%H%M%S")
        inspection_number = f"INS-{equipment.tag}-{timestamp}"
        
        # Create planned inspection
        inspection = Inspection(
            inspection_number=inspection_number,
            title=request_data.title,
            description=request_data.description,
            planned_start_date=request_data.planned_start_date,  # Set planned dates
            planned_end_date=request_data.planned_end_date,
            status=InspectionStatus.Planned,  # Start as Planned
            equipment_id=request_data.equipment_id,
            maintenance_event_id=request_data.maintenance_event_id,
            maintenance_sub_event_id=request_data.maintenance_sub_event_id,
            requesting_department=request_data.requesting_department,
            is_planned=True,  # This is a planned inspection
            work_order=request_data.work_order,
            permit_number=request_data.permit_number
        )
        
        session.add(inspection)
        session.commit()
        session.refresh(inspection)
        
        # Create status history record
        status_history = StatusHistory(
            entity_type=EntityType.Inspection,
            entity_id=inspection.id,
            from_status=None,
            to_status=InspectionStatus.Planned.value,
            changed_by="system",
            note="Planned inspection created"
        )
        session.add(status_history)
        session.commit()
        
        logger.info(f"Created planned inspection {inspection.inspection_number}")
        
        # Send notification about planned inspection creation
        try:
            from app.domains.notifications.services.notification_service import NotificationService
            notification_service = NotificationService(session)
            
            # Get event and sub-event details for better context
            event_number = None
            sub_event_number = None
            
            if inspection.maintenance_event_id:
                from app.domains.maintenance.models.event import MaintenanceEvent
                event = session.get(MaintenanceEvent, inspection.maintenance_event_id)
                event_number = event.event_number if event else None
            
            if inspection.maintenance_sub_event_id:
                from app.domains.maintenance.models.event import MaintenanceSubEvent
                sub_event = session.get(MaintenanceSubEvent, inspection.maintenance_sub_event_id)
                sub_event_number = sub_event.sub_event_number if sub_event else None
            
            await notification_service.broadcast_inspection_created(
                inspection_id=inspection.id,
                inspection_number=inspection.inspection_number,
                equipment_tag=equipment.tag,
                event_id=inspection.maintenance_event_id,
                event_number=event_number,
                sub_event_id=inspection.maintenance_sub_event_id,
                sub_event_number=sub_event_number,
                created_by="system",  # TODO: Get actual user from auth context
                inspection_type="Planned",
                is_planned=True
            )
        except Exception as e:
            logger.warning(f"Failed to send notification for planned inspection creation: {str(e)}")
        
        return {
            "success": True,
            "inspection": {
                "id": inspection.id,
                "inspection_number": inspection.inspection_number,
                "title": inspection.title,
                "equipment_tag": equipment.tag,
                "status": inspection.status.value,
                "is_planned": inspection.is_planned,
                "planned_start_date": inspection.planned_start_date
            }
        }
        
    except HTTPException:
        raise
    except Exception as e:
        session.rollback()
        logger.error(f"Failed to create planned inspection: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to create planned inspection: {str(e)}")

@router.post("/inspections/{inspection_id}/start")
async def start_planned_inspection(
    inspection_id: int = Path(..., description="Inspection ID"),
    *,
    request_data: StartPlannedInspectionRequest,
    session: Session = Depends(get_session)
):
    """Start a planned inspection (transition from Planned to InProgress)"""
    try:
        # Get the inspection
        inspection = session.get(Inspection, inspection_id)
        if not inspection:
            raise HTTPException(status_code=404, detail=f"Inspection {inspection_id} not found")
        
        if not inspection.is_planned:
            raise HTTPException(status_code=400, detail="Cannot start unplanned inspection - it should already be in progress")
            
        if inspection.status != InspectionStatus.Planned:
            raise HTTPException(status_code=400, detail=f"Cannot start inspection with status {inspection.status}")
        
        # Update inspection to InProgress and set actual start date
        old_status = inspection.status
        inspection.status = InspectionStatus.InProgress
        inspection.actual_start_date = request_data.actual_start_date or date.today()
        inspection.updated_at = datetime.utcnow()
        
        session.add(inspection)
        
        # Create status history record
        status_history = StatusHistory(
            entity_type=EntityType.Inspection,
            entity_id=inspection.id,
            from_status=old_status.value,
            to_status=InspectionStatus.InProgress.value,
            changed_by=f"inspector_{request_data.inspector_id}" if request_data.inspector_id else "system",
            note=request_data.notes or "Planned inspection started"
        )
        session.add(status_history)
        
        session.commit()
        
        logger.info(f"Started planned inspection {inspection.inspection_number}")
        
        return {
            "success": True,
            "inspection_id": inspection_id,
            "new_status": InspectionStatus.InProgress.value,
            "actual_start_date": inspection.actual_start_date
        }
        
    except HTTPException:
        raise
    except Exception as e:
        session.rollback()
        logger.error(f"Failed to start inspection {inspection_id}: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to start inspection: {str(e)}")

@router.post("/inspections/{inspection_id}/complete")
async def complete_inspection(
    inspection_id: int = Path(..., description="Inspection ID"),
    session: Session = Depends(get_session)
):
    """Complete an inspection (unified model approach)"""
    try:
        # Get the inspection
        inspection = session.get(Inspection, inspection_id)
        if not inspection:
            raise HTTPException(status_code=404, detail=f"Inspection {inspection_id} not found")
        
        if inspection.status == InspectionStatus.Completed:
            raise HTTPException(status_code=400, detail="Inspection is already completed")
        
        # Update inspection status and end date
        old_status = inspection.status
        inspection.status = InspectionStatus.Completed
        inspection.actual_end_date = date.today()
        # Note: For unified model, we only use actual_start_date and actual_end_date
        
        session.add(inspection)
        
        # Create status history record
        status_history = StatusHistory(
            entity_type=EntityType.Inspection,
            entity_id=inspection.id,
            from_status=old_status.value,
            to_status=InspectionStatus.Completed.value,
            changed_by="system",
            note="Inspection completed"
        )
        session.add(status_history)
        
        session.commit()
        
        logger.info(f"Completed inspection {inspection.inspection_number}")
        
        # Send notification about inspection completion
        try:
            from app.domains.notifications.services.notification_service import NotificationService
            notification_service = NotificationService(session)
            
            # Get equipment and event details
            equipment = session.get(Equipment, inspection.equipment_id)
            equipment_tag = equipment.tag if equipment else f"Equipment-{inspection.equipment_id}"
            
            event_number = None
            if inspection.maintenance_event_id:
                from app.domains.maintenance.models.event import MaintenanceEvent
                event = session.get(MaintenanceEvent, inspection.maintenance_event_id)
                event_number = event.event_number if event else None
            
            await notification_service.broadcast_inspection_completed(
                inspection_id=inspection.id,
                inspection_number=inspection.inspection_number,
                equipment_tag=equipment_tag,
                event_id=inspection.maintenance_event_id,
                event_number=event_number,
                completed_by="system",  # TODO: Get actual user from auth context
                completion_notes="Inspection completed successfully"
            )
        except Exception as e:
            logger.warning(f"Failed to send notification for inspection completion: {str(e)}")
        
        return {
            "success": True,
            "inspection_id": inspection_id,
            "new_status": InspectionStatus.Completed.value,
            "completion_date": inspection.actual_end_date,
            "is_planned": inspection.is_planned
        }
        
    except HTTPException:
        raise
    except Exception as e:
        session.rollback()
        logger.error(f"Failed to complete inspection {inspection_id}: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to complete inspection: {str(e)}")

@router.get("/inspections/{inspection_id}/status")
async def get_inspection_status(
    inspection_id: int = Path(..., description="Inspection ID"),
    session: Session = Depends(get_session)
):
    """Get detailed status of an inspection"""
    try:
        inspection = session.get(Inspection, inspection_id)
        if not inspection:
            raise HTTPException(status_code=404, detail=f"Inspection {inspection_id} not found")
        
        # Get equipment info
        equipment = session.get(Equipment, inspection.equipment_id)
        
        return {
            "inspection_id": inspection_id,
            "inspection_number": inspection.inspection_number,
            "title": inspection.title,
            "status": inspection.status.value,
            "is_planned": inspection.is_planned,

            "equipment_tag": equipment.tag if equipment else None,
            "requesting_department": inspection.requesting_department.value,

            "actual_start_date": inspection.actual_start_date,
            "actual_end_date": inspection.actual_end_date,
            "unplanned_reason": inspection.unplanned_reason if not inspection.is_planned else None
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to get inspection status for {inspection_id}: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to get inspection status: {str(e)}")