from datetime import datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlmodel import Session, select
from ..database import get_session
from ..psv_models import (
    PSV,
    Calibration,
    RBIConfiguration,
    ServiceRiskCategory,
    PSVStatus,
    TestMedium,
    WorkMaintenance
)

router = APIRouter(prefix="/psv", tags=["PSV Management"])

# PSV Routes
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

@router.get("/{tag_number}", response_model=PSV)
def get_psv(tag_number: str, db: Session = Depends(get_session)):
    """Get PSV by tag number"""
    psv = db.get(PSV, tag_number)
    if not psv:
        raise HTTPException(status_code=404, detail="PSV not found")
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

# Calibration Routes
@router.get("/{tag_number}/calibrations", response_model=List[Calibration])
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

@router.post("/{tag_number}/calibrations", response_model=Calibration)
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
    
    # Update PSV last calibration date
    psv.last_calibration_date = calibration.calibration_date
    
    try:
        db.commit()
        db.refresh(calibration)
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=str(e))
    return calibration

# RBI Configuration Routes
@router.get("/rbi/config", response_model=List[RBIConfiguration])
def get_rbi_configs(
    skip: int = 0,
    limit: int = 100,
    active_only: bool = False,
    db: Session = Depends(get_session)
):
    """Get RBI configurations"""
    query = select(RBIConfiguration)
    if active_only:
        query = query.filter(RBIConfiguration.active == True)
    return db.exec(query.offset(skip).limit(limit)).all()

@router.post("/rbi/config", response_model=RBIConfiguration)
def create_rbi_config(
    config: RBIConfiguration,
    db: Session = Depends(get_session)
):
    """Create new RBI configuration"""
    db.add(config)
    try:
        db.commit()
        db.refresh(config)
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=str(e))
    return config

# Service Risk Category Routes
@router.get("/service-risk", response_model=List[ServiceRiskCategory])
def get_service_risk_categories(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_session)
):
    """Get service risk categories"""
    query = select(ServiceRiskCategory)
    return db.exec(query.offset(skip).limit(limit)).all()

@router.post("/service-risk", response_model=ServiceRiskCategory)
def create_service_risk_category(
    category: ServiceRiskCategory,
    db: Session = Depends(get_session)
):
    """Create new service risk category"""
    db.add(category)
    try:
        db.commit()
        db.refresh(category)
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=str(e))
    return category

# RBI Calculation Endpoint
@router.post("/{tag_number}/calculate-rbi")
def calculate_rbi(
    tag_number: str,
    level: int = Query(..., ge=1, le=4),
    db: Session = Depends(get_session)
):
    """Calculate next calibration date using RBI methodology"""
    psv = db.get(PSV, tag_number)
    if not psv:
        raise HTTPException(status_code=404, detail="PSV not found")
    
    # Get active RBI configuration for the specified level
    config = db.exec(
        select(RBIConfiguration)
        .filter(RBIConfiguration.level == level)
        .filter(RBIConfiguration.active == True)
    ).first()
    
    if not config:
        raise HTTPException(
            status_code=404,
            detail=f"No active RBI configuration found for level {level}"
        )
    
    # TODO: Implement RBI calculation logic based on level
    # For now, return mock response
    return {
        "tag_number": tag_number,
        "rbi_level": level,
        "current_risk_score": 3,
        "recommended_interval": 24,  # months
        "next_calibration_date": datetime.utcnow().isoformat()
    }