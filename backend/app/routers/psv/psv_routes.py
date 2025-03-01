from datetime import datetime, timedelta
from typing import Dict, List, Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select
from sqlalchemy.sql import func
from ...database import get_session
from ...psv_models import PSV, PSVStatus

router = APIRouter(tags=["PSV Management"])

@router.get("/", response_model=List[PSV])
def get_psvs(
    skip: int = 0,
    limit: int = 100,
    tag_number: Optional[str] = None,
    status: Optional[PSVStatus] = None,
    service: Optional[str] = None,
    unit: Optional[str] = None,
    db: Session = Depends(get_session)
):
    """Get list of PSVs with optional filtering"""
    query = select(PSV)
    if tag_number:
        query = query.filter(PSV.tag_number.contains(tag_number))
    if status:
        query = query.filter(PSV.status == status)
    if service:
        query = query.filter(PSV.service.contains(service))
    if unit:
        query = query.filter(PSV.unit.contains(unit))
    
    return db.exec(query.offset(skip).limit(limit)).all()

@router.get("/summary", response_model=Dict)
def get_psv_summary(db: Session = Depends(get_session)):
    """Get PSV summary statistics including calibration status and RBI levels"""
    # Get current timestamp for calculations
    now = datetime.utcnow()
    one_month_from_now = now + timedelta(days=30)

    # Base queries
    main_count = select(PSV).filter(PSV.status == PSVStatus.Main)
    spare_count = select(PSV).filter(PSV.status == PSVStatus.Spare)

    # Out of calibration queries
    main_out_of_cal = main_count.filter(PSV.expire_date < now)
    spare_out_of_cal = spare_count.filter(PSV.expire_date < now)

    # Due next month queries
    main_due_next = main_count.filter(
        PSV.expire_date > now,
        PSV.expire_date <= one_month_from_now
    )
    spare_due_next = spare_count.filter(
        PSV.expire_date > now,
        PSV.expire_date <= one_month_from_now
    )

    # Never calibrated queries
    main_never_cal = main_count.filter(PSV.last_calibration_date.is_(None))
    spare_never_cal = spare_count.filter(PSV.last_calibration_date.is_(None))

    # Execute all queries
    summary = {
        "total": {
            "main": db.exec(main_count.with_only_columns(func.count())).first(),
            "spare": db.exec(spare_count.with_only_columns(func.count())).first()
        },
        "underCalibration": {
            "main": 0,  # TODO: Add when under_calibration status is implemented
            "spare": 0
        },
        "outOfCalibration": {
            "main": db.exec(main_out_of_cal.with_only_columns(func.count())).first(),
            "spare": db.exec(spare_out_of_cal.with_only_columns(func.count())).first()
        },
        "dueNextMonth": {
            "main": db.exec(main_due_next.with_only_columns(func.count())).first(),
            "spare": db.exec(spare_due_next.with_only_columns(func.count())).first()
        },
        "neverCalibrated": {
            "main": db.exec(main_never_cal.with_only_columns(func.count())).first(),
            "spare": db.exec(spare_never_cal.with_only_columns(func.count())).first()
        },
        "rbiLevel": {
            "level1": 0,  # TODO: Implement when RBI calculation is complete
            "level2": 0,
            "level3": 0,
            "level4": 0
        }
    }

    return summary

@router.get("/{tag_number}", response_model=PSV)
def get_psv(tag_number: str, db: Session = Depends(get_session)):
    """Get PSV by tag number"""
    # Use select instead of db.get for more reliable querying
    query = select(PSV).where(PSV.tag_number == tag_number)
    psv = db.exec(query).first()
    
    if not psv:
        # Add more detail to error message
        raise HTTPException(
            status_code=404,
            detail=f"PSV with tag number '{tag_number}' not found"
        )
    return psv

@router.post("/", response_model=PSV)
def create_psv(psv: PSV, db: Session = Depends(get_session)):
    """Create new PSV"""
    db.add(psv)
    try:
        db.commit()
        db.refresh(psv)
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=str(e))
    return psv

@router.put("/{tag_number}", response_model=PSV)
def update_psv(tag_number: str, psv_update: PSV, db: Session = Depends(get_session)):
    """Update PSV"""
    psv = db.get(PSV, tag_number)
    if not psv:
        raise HTTPException(status_code=404, detail="PSV not found")
    
    psv_data = psv_update.dict(exclude_unset=True)
    psv_data["updated_at"] = datetime.utcnow()
    
    for key, value in psv_data.items():
        setattr(psv, key, value)
    
    try:
        db.commit()
        db.refresh(psv)
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=str(e))
    return psv

@router.delete("/{tag_number}")
def delete_psv(tag_number: str, db: Session = Depends(get_session)):
    """Delete PSV"""
    psv = db.get(PSV, tag_number)
    if not psv:
        raise HTTPException(status_code=404, detail="PSV not found")
    
    try:
        db.delete(psv)
        db.commit()
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=str(e))
    return {"message": "PSV deleted successfully"}