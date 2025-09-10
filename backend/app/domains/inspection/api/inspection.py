from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlmodel import Session, select
from datetime import datetime, date
from app.database import get_session
from app.domains.inspection.models.inspection import (
    Inspection, 
    InspectionTask, 
    InspectionFinding,
    InspectionStatus,
    InspectionType,
    InspectionPriority
)

router = APIRouter()

@router.get("/", response_model=List[Inspection])
def get_inspections(
    skip: int = 0,
    limit: int = 100,
    status: Optional[InspectionStatus] = None,
    inspection_type: Optional[InspectionType] = None,
    priority: Optional[InspectionPriority] = None,
    location: Optional[str] = None,
    from_date: Optional[date] = None,
    to_date: Optional[date] = None,
    db: Session = Depends(get_session)
):
    """Get list of inspections with optional filtering"""
    query = select(Inspection)
    
    if status:
        query = query.filter(Inspection.status == status)
    if inspection_type:
        query = query.filter(Inspection.inspection_type == inspection_type)
    if priority:
        query = query.filter(Inspection.priority == priority)
    if location:
        query = query.filter(Inspection.location.contains(location))
    if from_date:
        query = query.filter(Inspection.planned_date >= from_date)
    if to_date:
        query = query.filter(Inspection.planned_date <= to_date)
        
    query = query.order_by(Inspection.planned_date)
    return db.exec(query.offset(skip).limit(limit)).all()

@router.post("/", response_model=Inspection)
def create_inspection(
    inspection: Inspection,
    db: Session = Depends(get_session)
):
    """Create new inspection"""
    db.add(inspection)
    try:
        db.commit()
        db.refresh(inspection)
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=str(e))
    return inspection

@router.get("/{inspection_id}", response_model=Inspection)
def get_inspection(
    inspection_id: int,
    db: Session = Depends(get_session)
):
    """Get inspection by ID"""
    inspection = db.get(Inspection, inspection_id)
    if not inspection:
        raise HTTPException(
            status_code=404,
            detail=f"Inspection with ID {inspection_id} not found"
        )
    return inspection

@router.put("/{inspection_id}", response_model=Inspection)
def update_inspection(
    inspection_id: int,
    inspection_update: Inspection,
    db: Session = Depends(get_session)
):
    """Update inspection"""
    db_inspection = db.get(Inspection, inspection_id)
    if not db_inspection:
        raise HTTPException(status_code=404, detail="Inspection not found")
    
    # Update fields
    inspection_data = inspection_update.dict(exclude_unset=True)
    
    # Status transition handling
    if (inspection_data.get("status") == InspectionStatus.Completed and 
        db_inspection.status != InspectionStatus.Completed):
        # Set completion date if not provided when moving to Completed
        if not inspection_data.get("actual_end_date"):
            inspection_data["actual_end_date"] = datetime.utcnow().date()
    
    for key, value in inspection_data.items():
        setattr(db_inspection, key, value)
    
    try:
        db.commit()
        db.refresh(db_inspection)
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=str(e))
    return db_inspection

@router.delete("/{inspection_id}")
def delete_inspection(
    inspection_id: int,
    db: Session = Depends(get_session)
):
    """Delete inspection"""
    inspection = db.get(Inspection, inspection_id)
    if not inspection:
        raise HTTPException(status_code=404, detail="Inspection not found")
    
    try:
        db.delete(inspection)
        db.commit()
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=str(e))
    return {"message": "Inspection deleted successfully"}

@router.post("/{inspection_id}/tasks", response_model=InspectionTask)
def add_task(
    inspection_id: int,
    task: InspectionTask,
    db: Session = Depends(get_session)
):
    """Add task to inspection"""
    inspection = db.get(Inspection, inspection_id)
    if not inspection:
        raise HTTPException(status_code=404, detail="Inspection not found")
    
    task.inspection_id = inspection_id
    db.add(task)
    
    try:
        db.commit()
        db.refresh(task)
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=str(e))
    
    return task

@router.get("/{inspection_id}/tasks", response_model=List[InspectionTask])
def get_tasks(
    inspection_id: int,
    db: Session = Depends(get_session)
):
    """Get tasks for an inspection"""
    inspection = db.get(Inspection, inspection_id)
    if not inspection:
        raise HTTPException(status_code=404, detail="Inspection not found")
    
    tasks = db.exec(
        select(InspectionTask)
        .filter(InspectionTask.inspection_id == inspection_id)
    ).all()
    
    return tasks

@router.post("/{inspection_id}/findings", response_model=InspectionFinding)
def add_finding(
    inspection_id: int,
    finding: InspectionFinding,
    db: Session = Depends(get_session)
):
    """Add finding to inspection"""
    inspection = db.get(Inspection, inspection_id)
    if not inspection:
        raise HTTPException(status_code=404, detail="Inspection not found")
    
    finding.inspection_id = inspection_id
    
    # Set identified date if not provided
    if not finding.identified_date:
        finding.identified_date = datetime.utcnow()
    
    db.add(finding)
    
    try:
        db.commit()
        db.refresh(finding)
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=str(e))
    
    return finding

@router.get("/{inspection_id}/findings", response_model=List[InspectionFinding])
def get_findings(
    inspection_id: int,
    db: Session = Depends(get_session)
):
    """Get findings for an inspection"""
    inspection = db.get(Inspection, inspection_id)
    if not inspection:
        raise HTTPException(status_code=404, detail="Inspection not found")
    
    findings = db.exec(
        select(InspectionFinding)
        .filter(InspectionFinding.inspection_id == inspection_id)
    ).all()
    
    return findings

@router.put("/tasks/{task_id}", response_model=InspectionTask)
def update_task(
    task_id: int,
    task_update: InspectionTask,
    db: Session = Depends(get_session)
):
    """Update inspection task"""
    db_task = db.get(InspectionTask, task_id)
    if not db_task:
        raise HTTPException(status_code=404, detail="Task not found")
    
    # Update fields
    task_data = task_update.dict(exclude_unset=True)
    
    # Status transition handling
    if task_data.get("status") == "Completed" and db_task.status != "Completed":
        # Set completion date if not provided
        if not task_data.get("completed_date"):
            task_data["completed_date"] = datetime.utcnow()
    
    for key, value in task_data.items():
        setattr(db_task, key, value)
    
    try:
        db.commit()
        db.refresh(db_task)
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=str(e))
    return db_task

@router.put("/findings/{finding_id}", response_model=InspectionFinding)
def update_finding(
    finding_id: int,
    finding_update: InspectionFinding,
    db: Session = Depends(get_session)
):
    """Update inspection finding"""
    db_finding = db.get(InspectionFinding, finding_id)
    if not db_finding:
        raise HTTPException(status_code=404, detail="Finding not found")
    
    # Update fields
    finding_data = finding_update.dict(exclude_unset=True)
    
    # Status transition handling
    if finding_data.get("status") == "Closed" and db_finding.status != "Closed":
        # Set close date if not provided
        if not finding_data.get("close_date"):
            finding_data["close_date"] = datetime.utcnow()
    
    for key, value in finding_data.items():
        setattr(db_finding, key, value)
    
    try:
        db.commit()
        db.refresh(db_finding)
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=str(e))
    return db_finding

@router.get("/statistics/summary")
def get_inspection_statistics(
    from_date: Optional[date] = None,
    to_date: Optional[date] = None,
    db: Session = Depends(get_session)
):
    """Get inspection statistics summary"""
    query = select(Inspection)
    
    if from_date:
        query = query.filter(Inspection.planned_date >= from_date)
    if to_date:
        query = query.filter(Inspection.planned_date <= to_date)
    
    inspections = db.exec(query).all()
    
    # Count by status
    status_counts = {}
    for status in InspectionStatus:
        count = sum(1 for i in inspections if i.status == status)
        status_counts[status.value] = count
    
    # Count by type
    type_counts = {}
    for inspection_type in InspectionType:
        count = sum(1 for i in inspections if i.inspection_type == inspection_type)
        type_counts[inspection_type.value] = count
    
    # Count by priority
    priority_counts = {}
    for priority in InspectionPriority:
        count = sum(1 for i in inspections if i.priority == priority)
        priority_counts[priority.value] = count
    
    # Tasks completion rate
    all_tasks = []
    for inspection in inspections:
        tasks = db.exec(
            select(InspectionTask)
            .filter(InspectionTask.inspection_id == inspection.id)
        ).all()
        all_tasks.extend(tasks)
    
    completed_tasks = sum(1 for t in all_tasks if t.status == "Completed")
    task_completion_rate = completed_tasks / len(all_tasks) if all_tasks else 0
    
    # Findings severity distribution
    all_findings = []
    for inspection in inspections:
        findings = db.exec(
            select(InspectionFinding)
            .filter(InspectionFinding.inspection_id == inspection.id)
        ).all()
        all_findings.extend(findings)
    
    severity_counts = {}
    for severity in ["None", "Minor", "Major", "Critical"]:
        count = sum(1 for f in all_findings if f.severity == severity)
        severity_counts[severity] = count
    
    return {
        "total_inspections": len(inspections),
        "status_counts": status_counts,
        "type_counts": type_counts,
        "priority_counts": priority_counts,
        "task_completion_rate": task_completion_rate,
        "total_findings": len(all_findings),
        "severity_counts": severity_counts,
        "open_findings": sum(1 for f in all_findings if f.status == "Open")
    }