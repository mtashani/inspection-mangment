# Inspector Work Cycle API router using domain-driven design principles
from fastapi import APIRouter, Depends, HTTPException, Query, status
from typing import List, Optional
from sqlmodel import Session
import datetime
from app.domains.inspector.models.attendance import WorkCycle
from app.domains.inspector.schemas.work_cycle import (
    WorkCycleCreate, WorkCycleUpdate, WorkCycleResponse
)
from app.domains.inspector.services.work_cycle_service import WorkCycleService
from app.database import get_session
from app.domains.auth.dependencies import get_current_user, require_admin

router = APIRouter()

@router.get("", response_model=List[WorkCycleResponse])
def get_all_work_cycles(
    db: Session = Depends(get_session),
    current_user=Depends(require_admin)
):
    """
    Get all work cycles (admin only).
    """
    service = WorkCycleService(db)
    cycles = service.get_all_work_cycles()
    return [WorkCycleResponse.from_model(cycle) for cycle in cycles]

@router.post("", response_model=WorkCycleResponse)
def create_work_cycle(
    work_cycle_data: WorkCycleCreate,
    db: Session = Depends(get_session),
    current_user=Depends(require_admin)
):
    """
    Create a new work cycle (admin only).
    """
    service = WorkCycleService(db)
    cycle = service.create_work_cycle(work_cycle_data)
    return WorkCycleResponse.from_model(cycle)

@router.get("/{cycle_id}", response_model=WorkCycleResponse)
def get_work_cycle(
    cycle_id: int,
    db: Session = Depends(get_session),
    current_user=Depends(get_current_user)
):
    """
    Get a specific work cycle.
    """
    service = WorkCycleService(db)
    cycle = service.get_work_cycle_by_id(cycle_id)
    if not cycle:
        raise HTTPException(status_code=404, detail="Work cycle not found.")
    return WorkCycleResponse.from_model(cycle)

@router.put("/{cycle_id}", response_model=WorkCycleResponse)
def update_work_cycle(
    cycle_id: int,
    work_cycle_data: WorkCycleUpdate,
    db: Session = Depends(get_session),
    current_user=Depends(require_admin)
):
    """
    Update a work cycle (admin only).
    """
    service = WorkCycleService(db)
    try:
        cycle = service.update_work_cycle(cycle_id, work_cycle_data)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    return WorkCycleResponse.from_model(cycle)

@router.delete("/{cycle_id}")
def delete_work_cycle(
    cycle_id: int,
    db: Session = Depends(get_session),
    current_user=Depends(require_admin)
):
    """
    Delete a work cycle (admin only).
    """
    service = WorkCycleService(db)
    service.delete_work_cycle(cycle_id)
    return {"message": "Work cycle deleted successfully"}

@router.get("/{inspector_id}", response_model=List[WorkCycleResponse])
def get_inspector_work_cycles(
    inspector_id: int,
    db: Session = Depends(get_session),
    current_user=Depends(get_current_user)
):
    """
    Get work cycles for a specific inspector.
    Admins can view all, inspectors only their own.
    """
    if current_user.is_admin:
        pass
    elif current_user.id == inspector_id:
        pass
    else:
        raise HTTPException(status_code=403, detail="Not authorized to view these work cycles.")
    
    service = WorkCycleService(db)
    cycles = service.get_work_cycles_by_inspector(inspector_id)
    return [WorkCycleResponse.from_model(cycle) for cycle in cycles]

@router.post("/{cycle_id}/generate-attendance", response_model=dict)
def generate_attendance_from_cycle(
    cycle_id: int,
    jalali_year: int = Query(...),
    jalali_month: int = Query(...),
    db: Session = Depends(get_session),
    current_user=Depends(require_admin)
):
    """
    Generate attendance records from a work cycle for a specific month (admin only).
    """
    try:
        if not 1 <= jalali_month <= 12:
            raise HTTPException(status_code=400, detail="Invalid Jalali month. Must be between 1 and 12.")
        
        service = WorkCycleService(db)
        generated_records = service.generate_attendance_from_cycle(cycle_id, jalali_year, jalali_month)
        
        return {
            "cycle_id": cycle_id,
            "period": f"{jalali_year}/{jalali_month:02d}",
            "generated_records": len(generated_records),
            "status": "success"
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate attendance: {str(e)}")