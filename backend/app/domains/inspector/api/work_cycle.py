# NEW/UPDATED: Work Cycle API router using domain-driven design principles
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

@router.get("/", response_model=List[WorkCycleResponse])
def get_work_cycles(
    inspector_id: int = Query(..., description="Inspector ID"),
    db: Session = Depends(get_session),
    current_user=Depends(get_current_user)
):
    """
    Get work cycles for an inspector. Admins can view all, inspectors only their own.
    """
    service = WorkCycleService(db)
    cycles = service.get_work_cycles(inspector_id)
    return [WorkCycleResponse.from_model(cycle) for cycle in cycles]

@router.post("/", response_model=WorkCycleResponse)
def create_work_cycle(
    work_cycle_data: WorkCycleCreate,
    inspector_id: int = Query(..., description="Inspector ID"),
    db: Session = Depends(get_session),
    current_user=Depends(require_admin)
):
    """
    Create a new work cycle for an inspector (admin only).
    """
    service = WorkCycleService(db)
    cycle = service.create_work_cycle(inspector_id, work_cycle_data)
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