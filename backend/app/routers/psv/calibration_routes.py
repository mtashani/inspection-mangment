from datetime import datetime, timedelta
from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select
from ...database import get_session
from ...psv_models import PSV, Calibration

router = APIRouter(prefix="/calibration", tags=["PSV Calibrations"])

@router.get("/{tag_number}", response_model=List[Calibration])
def get_calibrations(
    tag_number: str,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_session)
):
    """Get calibration history for a PSV"""
    psv = db.get(PSV, tag_number)
    if not psv:
        raise HTTPException(status_code=404, detail="PSV not found")
    
    query = select(Calibration).filter(Calibration.tag_number == tag_number)
    return db.exec(query.offset(skip).limit(limit)).all()

@router.post("/{tag_number}", response_model=Calibration)
def create_calibration(
    tag_number: str,
    calibration: Calibration,
    db: Session = Depends(get_session)
):
    """Create new calibration record"""
    psv = db.get(PSV, tag_number)
    if not psv:
        raise HTTPException(status_code=404, detail="PSV not found")
    
    calibration.tag_number = tag_number
    db.add(calibration)
    
    # Update PSV last calibration date and expiry date
    # Convert string dates to datetime objects if needed
    if isinstance(calibration.calibration_date, str):
        calibration_date = datetime.fromisoformat(calibration.calibration_date.replace('Z', '+00:00'))
    else:
        calibration_date = calibration.calibration_date
        
    psv.last_calibration_date = calibration_date
    # Calculate expiry date based on frequency (in months)
    psv.expire_date = calibration_date + timedelta(days=psv.frequency * 30)
    
    try:
        db.commit()
        db.refresh(calibration)
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=str(e))
    return calibration

@router.get("/{tag_number}/latest", response_model=Calibration)
def get_latest_calibration(
    tag_number: str,
    db: Session = Depends(get_session)
):
    """Get the latest calibration record for a PSV"""
    psv = db.get(PSV, tag_number)
    if not psv:
        raise HTTPException(status_code=404, detail="PSV not found")
    
    latest = db.exec(
        select(Calibration)
        .filter(Calibration.tag_number == tag_number)
        .order_by(Calibration.calibration_date.desc())
    ).first()
    
    if not latest:
        raise HTTPException(status_code=404, detail="No calibration records found")
    
    return latest

@router.put("/{id}", response_model=Calibration)
def update_calibration(
    id: int,
    calibration_data: dict,
    db: Session = Depends(get_session)
):
    """Update an existing calibration record"""
    # Find the calibration by ID
    calibration = db.get(Calibration, id)
    if not calibration:
        raise HTTPException(status_code=404, detail="Calibration record not found")
    
    # Update the calibration fields
    for key, value in calibration_data.items():
        if hasattr(calibration, key):
            setattr(calibration, key, value)
    
    try:
        db.commit()
        db.refresh(calibration)
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=str(e))
    
    return calibration

@router.delete("/{id}", status_code=204)
def delete_calibration(
    id: int,
    db: Session = Depends(get_session)
):
    """Delete a calibration record"""
    calibration = db.get(Calibration, id)
    if not calibration:
        raise HTTPException(status_code=404, detail="Calibration record not found")
    
    try:
        db.delete(calibration)
        db.commit()
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=str(e))
    
    return None