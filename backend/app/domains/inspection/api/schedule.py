from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlmodel import Session, select
from datetime import datetime, date, timedelta
from app.database import get_session
from app.domains.inspection.models.inspection import (
    InspectionSchedule, 
    Inspection,
    InspectionPriority,
    InspectionType
)
from app.domains.inspection.services.scheduling_service import (
    calculate_next_inspection_date, 
    get_upcoming_inspections,
    create_inspection_from_schedule,
    update_schedule_after_inspection
)

router = APIRouter()

@router.get("/", response_model=List[InspectionSchedule])
def get_inspection_schedules(
    skip: int = 0,
    limit: int = 100,
    equipment_type: Optional[str] = None,
    equipment_tag: Optional[str] = None,
    location: Optional[str] = None,
    active_only: bool = True,
    db: Session = Depends(get_session)
):
    """Get list of inspection schedules with optional filtering"""
    query = select(InspectionSchedule)
    
    if equipment_type:
        query = query.filter(InspectionSchedule.equipment_type.contains(equipment_type))
    if equipment_tag:
        query = query.filter(InspectionSchedule.equipment_tag.contains(equipment_tag))
    if location:
        query = query.filter(InspectionSchedule.location.contains(location))
    if active_only:
        query = query.filter(InspectionSchedule.active == True)
        
    query = query.order_by(InspectionSchedule.next_inspection_date)
    return db.exec(query.offset(skip).limit(limit)).all()

@router.post("/", response_model=InspectionSchedule)
def create_inspection_schedule(
    schedule: InspectionSchedule,
    db: Session = Depends(get_session)
):
    """Create new inspection schedule"""
    # If next_inspection_date is not provided, calculate it
    if not schedule.next_inspection_date:
        schedule.next_inspection_date = calculate_next_inspection_date(schedule)
    
    db.add(schedule)
    try:
        db.commit()
        db.refresh(schedule)
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=str(e))
    return schedule

@router.get("/{schedule_id}", response_model=InspectionSchedule)
def get_inspection_schedule(
    schedule_id: int,
    db: Session = Depends(get_session)
):
    """Get inspection schedule by ID"""
    schedule = db.get(InspectionSchedule, schedule_id)
    if not schedule:
        raise HTTPException(
            status_code=404,
            detail=f"Inspection schedule with ID {schedule_id} not found"
        )
    return schedule

@router.put("/{schedule_id}", response_model=InspectionSchedule)
def update_inspection_schedule(
    schedule_id: int,
    schedule_update: InspectionSchedule,
    recalculate_next_date: bool = False,
    db: Session = Depends(get_session)
):
    """Update inspection schedule"""
    db_schedule = db.get(InspectionSchedule, schedule_id)
    if not db_schedule:
        raise HTTPException(status_code=404, detail="Inspection schedule not found")
    
    # Update fields
    schedule_data = schedule_update.dict(exclude_unset=True)
    
    # Check if frequency is being updated
    frequency_updated = "frequency_months" in schedule_data
    
    for key, value in schedule_data.items():
        setattr(db_schedule, key, value)
    
    # Recalculate next date if requested or if frequency was updated
    if recalculate_next_date or frequency_updated:
        db_schedule.next_inspection_date = calculate_next_inspection_date(db_schedule)
    
    try:
        db.commit()
        db.refresh(db_schedule)
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=str(e))
    return db_schedule

@router.delete("/{schedule_id}")
def delete_inspection_schedule(
    schedule_id: int,
    db: Session = Depends(get_session)
):
    """Delete inspection schedule"""
    schedule = db.get(InspectionSchedule, schedule_id)
    if not schedule:
        raise HTTPException(status_code=404, detail="Inspection schedule not found")
    
    try:
        db.delete(schedule)
        db.commit()
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=str(e))
    return {"message": "Inspection schedule deleted successfully"}

@router.get("/upcoming/{days}", response_model=List[dict])
def get_upcoming_scheduled_inspections(
    days: int = 30,
    db: Session = Depends(get_session)
):
    """Get upcoming inspections in the next X days"""
    schedules = db.exec(
        select(InspectionSchedule)
        .filter(InspectionSchedule.active == True)
    ).all()
    
    upcoming = get_upcoming_inspections(schedules, days)
    return upcoming

@router.post("/{schedule_id}/create-inspection", response_model=Inspection)
def create_inspection_from_schedule_endpoint(
    schedule_id: int,
    inspection_number: str,
    planned_date: Optional[date] = None,
    db: Session = Depends(get_session)
):
    """Create a new inspection from a schedule"""
    schedule = db.get(InspectionSchedule, schedule_id)
    if not schedule:
        raise HTTPException(status_code=404, detail="Inspection schedule not found")
    
    # Create inspection
    inspection = create_inspection_from_schedule(
        schedule, 
        inspection_number, 
        planned_date or schedule.next_inspection_date
    )
    
    # Save to database
    db.add(inspection)
    try:
        db.commit()
        db.refresh(inspection)
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=str(e))
    
    return inspection

@router.post("/{schedule_id}/update-after-inspection/{inspection_id}")
def update_schedule_after_inspection_endpoint(
    schedule_id: int,
    inspection_id: int,
    db: Session = Depends(get_session)
):
    """Update schedule after an inspection is completed"""
    schedule = db.get(InspectionSchedule, schedule_id)
    if not schedule:
        raise HTTPException(status_code=404, detail="Inspection schedule not found")
    
    inspection = db.get(Inspection, inspection_id)
    if not inspection:
        raise HTTPException(status_code=404, detail="Inspection not found")
    
    try:
        update_schedule_after_inspection(schedule, inspection)
        db.commit()
        db.refresh(schedule)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=str(e))
    
    return {
        "message": "Schedule updated successfully",
        "last_inspection_date": schedule.last_inspection_date.isoformat(),
        "next_inspection_date": schedule.next_inspection_date.isoformat()
    }

@router.get("/statistics/coverage")
def get_schedule_coverage(
    db: Session = Depends(get_session)
):
    """Get coverage statistics for inspection schedules"""
    schedules = db.exec(select(InspectionSchedule)).all()
    
    # Count by inspection type
    type_counts = {}
    for inspection_type in InspectionType:
        count = sum(1 for s in schedules if s.inspection_type == inspection_type)
        type_counts[inspection_type.value] = count
    
    # Count by priority
    priority_counts = {}
    for priority in InspectionPriority:
        count = sum(1 for s in schedules if s.priority == priority)
        priority_counts[priority.value] = count
    
    # Count by equipment type
    equipment_type_counts = {}
    for schedule in schedules:
        if not schedule.equipment_type:
            continue
        
        if schedule.equipment_type not in equipment_type_counts:
            equipment_type_counts[schedule.equipment_type] = 0
        equipment_type_counts[schedule.equipment_type] += 1
    
    # Count schedules by frequency
    frequency_distribution = {}
    for schedule in schedules:
        freq = schedule.frequency_months
        if freq not in frequency_distribution:
            frequency_distribution[freq] = 0
        frequency_distribution[freq] += 1
    
    # Count upcoming inspections
    today = datetime.utcnow().date()
    upcoming_30_days = sum(1 for s in schedules 
                          if s.active and (s.next_inspection_date - today).days <= 30)
    upcoming_60_days = sum(1 for s in schedules 
                          if s.active and (s.next_inspection_date - today).days <= 60)
    upcoming_90_days = sum(1 for s in schedules 
                          if s.active and (s.next_inspection_date - today).days <= 90)
    overdue = sum(1 for s in schedules 
                 if s.active and s.next_inspection_date < today)
    
    return {
        "total_schedules": len(schedules),
        "active_schedules": sum(1 for s in schedules if s.active),
        "type_distribution": type_counts,
        "priority_distribution": priority_counts,
        "equipment_type_distribution": equipment_type_counts,
        "frequency_distribution": frequency_distribution,
        "upcoming_30_days": upcoming_30_days,
        "upcoming_60_days": upcoming_60_days,
        "upcoming_90_days": upcoming_90_days,
        "overdue": overdue
    }