from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlmodel import Session, select
from datetime import datetime
from app.database import get_session
from app.domains.crane.models.crane import Crane, CraneInspection, CraneInspectionSettings
from app.domains.crane.models.enums import CraneType, CraneStatus, RiskLevel
from app.domains.crane.services.inspection_service import (
    calculate_next_inspection_date,
    get_inspection_status,
    validate_inspection_certificate
)

router = APIRouter()

@router.get("/", response_model=List[Crane])
def get_cranes(
    skip: int = 0,
    limit: int = 100,
    tag_number: Optional[str] = None,
    crane_type: Optional[CraneType] = None,
    status: Optional[CraneStatus] = None,
    location: Optional[str] = None,
    risk_level: Optional[RiskLevel] = None,
    db: Session = Depends(get_session)
):
    """Get list of cranes with optional filtering"""
    query = select(Crane)
    
    if tag_number:
        query = query.filter(Crane.tag_number.contains(tag_number))
    if crane_type:
        query = query.filter(Crane.crane_type == crane_type)
    if status:
        query = query.filter(Crane.status == status)
    if location:
        query = query.filter(Crane.location.contains(location))
    if risk_level:
        query = query.filter(Crane.risk_level == risk_level)
        
    return db.exec(query.offset(skip).limit(limit)).all()

@router.post("/", response_model=Crane)
def create_crane(
    crane: Crane,
    db: Session = Depends(get_session)
):
    """Create new crane"""
    db.add(crane)
    try:
        db.commit()
        db.refresh(crane)
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=str(e))
    return crane

@router.get("/{crane_id}", response_model=Crane)
def get_crane(
    crane_id: int,
    db: Session = Depends(get_session)
):
    """Get crane by ID"""
    crane = db.get(Crane, crane_id)
    if not crane:
        raise HTTPException(
            status_code=404,
            detail=f"Crane with ID {crane_id} not found"
        )
    return crane

@router.put("/{crane_id}", response_model=Crane)
def update_crane(
    crane_id: int,
    crane_update: Crane,
    db: Session = Depends(get_session)
):
    """Update crane"""
    db_crane = db.get(Crane, crane_id)
    if not db_crane:
        raise HTTPException(status_code=404, detail="Crane not found")
    
    # Update fields
    crane_data = crane_update.dict(exclude_unset=True)
    for key, value in crane_data.items():
        setattr(db_crane, key, value)
    
    try:
        db.commit()
        db.refresh(db_crane)
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=str(e))
    return db_crane

@router.delete("/{crane_id}")
def delete_crane(
    crane_id: int,
    db: Session = Depends(get_session)
):
    """Delete crane"""
    crane = db.get(Crane, crane_id)
    if not crane:
        raise HTTPException(status_code=404, detail="Crane not found")
    
    try:
        db.delete(crane)
        db.commit()
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=str(e))
    return {"message": "Crane deleted successfully"}

@router.get("/{crane_id}/inspections", response_model=List[CraneInspection])
def get_crane_inspections(
    crane_id: int,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_session)
):
    """Get all inspections for a specific crane"""
    crane = db.get(Crane, crane_id)
    if not crane:
        raise HTTPException(status_code=404, detail="Crane not found")
    
    query = select(CraneInspection).where(CraneInspection.crane_id == crane_id)
    query = query.order_by(CraneInspection.inspection_date.desc())
    
    return db.exec(query.offset(skip).limit(limit)).all()

@router.post("/{crane_id}/inspections", response_model=dict)
def create_crane_inspection(
    crane_id: int,
    inspection: CraneInspection,
    db: Session = Depends(get_session)
):
    """Create new inspection for a specific crane"""
    crane = db.get(Crane, crane_id)
    if not crane:
        raise HTTPException(status_code=404, detail="Crane not found")
    
    # Set crane ID
    inspection.crane_id = crane_id
    
    # Validate inspection
    validation = validate_inspection_certificate(inspection, crane)
    if not validation["valid"]:
        raise HTTPException(status_code=400, detail={"issues": validation["issues"]})
    
    # Get inspection settings for this crane type
    settings = db.exec(
        select(CraneInspectionSettings)
        .filter(CraneInspectionSettings.crane_type == crane.crane_type)
    ).first()
    
    # Calculate next inspection date if not provided
    if not inspection.next_inspection_date:
        next_date, interval = calculate_next_inspection_date(
            crane,
            settings,
            inspection.inspection_date
        )
        inspection.next_inspection_date = next_date
    
    # Update crane's inspection data
    crane.last_inspection_date = inspection.inspection_date
    crane.next_inspection_date = inspection.next_inspection_date
    crane.current_allowed_capacity = inspection.allowed_capacity
    
    # Add inspection
    db.add(inspection)
    
    try:
        db.commit()
        db.refresh(inspection)
        db.refresh(crane)
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=str(e))
    
    return {
        "inspection": inspection,
        "crane_updated": True,
        "next_inspection": inspection.next_inspection_date.isoformat(),
        "status": get_inspection_status(crane)
    }

@router.get("/inspections/{inspection_id}", response_model=CraneInspection)
def get_inspection(
    inspection_id: int,
    db: Session = Depends(get_session)
):
    """Get inspection by ID"""
    inspection = db.get(CraneInspection, inspection_id)
    if not inspection:
        raise HTTPException(
            status_code=404,
            detail=f"Inspection with ID {inspection_id} not found"
        )
    return inspection

@router.put("/inspections/{inspection_id}", response_model=CraneInspection)
def update_inspection(
    inspection_id: int,
    inspection_update: CraneInspection,
    update_crane: bool = True,
    db: Session = Depends(get_session)
):
    """Update inspection"""
    db_inspection = db.get(CraneInspection, inspection_id)
    if not db_inspection:
        raise HTTPException(status_code=404, detail="Inspection not found")
    
    # Update fields
    inspection_data = inspection_update.dict(exclude_unset=True)
    for key, value in inspection_data.items():
        setattr(db_inspection, key, value)
    
    # Update associated crane if requested
    if update_crane:
        crane = db.get(Crane, db_inspection.crane_id)
        if crane:
            crane.last_inspection_date = db_inspection.inspection_date
            crane.next_inspection_date = db_inspection.next_inspection_date
            crane.current_allowed_capacity = db_inspection.allowed_capacity
    
    try:
        db.commit()
        db.refresh(db_inspection)
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=str(e))
    return db_inspection

@router.delete("/inspections/{inspection_id}")
def delete_inspection(
    inspection_id: int,
    db: Session = Depends(get_session)
):
    """Delete inspection"""
    inspection = db.get(CraneInspection, inspection_id)
    if not inspection:
        raise HTTPException(status_code=404, detail="Inspection not found")
    
    try:
        db.delete(inspection)
        db.commit()
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=str(e))
    return {"message": "Inspection deleted successfully"}

@router.get("/settings/{crane_type}", response_model=CraneInspectionSettings)
def get_inspection_settings(
    crane_type: CraneType,
    db: Session = Depends(get_session)
):
    """Get inspection settings for a specific crane type"""
    settings = db.exec(
        select(CraneInspectionSettings)
        .filter(CraneInspectionSettings.crane_type == crane_type)
    ).first()
    
    if not settings:
        raise HTTPException(
            status_code=404,
            detail=f"No inspection settings found for crane type: {crane_type}"
        )
    
    return settings

@router.post("/settings", response_model=CraneInspectionSettings)
def create_inspection_settings(
    settings: CraneInspectionSettings,
    db: Session = Depends(get_session)
):
    """Create or update inspection settings"""
    existing = db.exec(
        select(CraneInspectionSettings)
        .filter(CraneInspectionSettings.crane_type == settings.crane_type)
    ).first()
    
    if existing:
        # Update existing
        for key, value in settings.dict(exclude_unset=True).items():
            setattr(existing, key, value)
        db_settings = existing
    else:
        # Create new
        db_settings = settings
        db.add(db_settings)
    
    try:
        db.commit()
        db.refresh(db_settings)
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=str(e))
    
    return db_settings