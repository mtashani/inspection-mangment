from datetime import datetime, timedelta
from typing import Dict, List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlmodel import Session, select
from app.database import get_session
from app.domains.psv.models.psv import PSV
from app.domains.psv.models.calibration import Calibration
from app.domains.psv.models.config import RBIConfiguration, ServiceRiskCategory
from app.domains.psv.services.rbi.basic import (
    calculate_rbi_level_1,
    calculate_rbi_level_2,
    calculate_rbi_level_3
)
from app.domains.psv.services.rbi.advanced import calculate_rbi_level_4

# Default RBI Configuration - used as fallback if no configuration exists
DEFAULT_RBI_CONFIG = {
    "base_interval": 36,  # Base interval in months
    "risk_categories": [
        {"min": 1.0, "max": 1.5, "category": "Low Risk", "interval_factor": 1.0},
        {"min": 1.5, "max": 3.0, "category": "Medium Risk", "interval_factor": 0.67},
        {"min": 3.0, "max": 5.0, "category": "High Risk", "interval_factor": 0.33}
    ]
}

router = APIRouter(prefix="/rbi", tags=["PSV RBI"])

@router.get("/config", response_model=List[RBIConfiguration])
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

@router.post("/config", response_model=RBIConfiguration)
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

@router.put("/config/{config_id}", response_model=RBIConfiguration)
def update_rbi_config(
    config_id: int,
    config_update: RBIConfiguration,
    db: Session = Depends(get_session)
):
    """Update existing RBI configuration"""
    db_config = db.get(RBIConfiguration, config_id)
    if not db_config:
        raise HTTPException(status_code=404, detail="Configuration not found")
    
    # Update configuration fields
    config_data = config_update.dict(exclude_unset=True)
    config_data["updated_at"] = datetime.utcnow()
    
    for key, value in config_data.items():
        setattr(db_config, key, value)
    
    # If this config is active, deactivate other configs at the same level
    if config_data.get("active") is True:
        # Get all other configurations at the same level
        other_configs = db.exec(
            select(RBIConfiguration)
            .filter(
                RBIConfiguration.id != config_id,
                RBIConfiguration.level == db_config.level,
                RBIConfiguration.active == True
            )
        ).all()
        
        # Deactivate them
        for other_config in other_configs:
            other_config.active = False
    
    try:
        db.commit()
        db.refresh(db_config)
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=str(e))
    return db_config

@router.get("/default_config")
def get_default_config():
    """Get default RBI configuration settings"""
    return DEFAULT_RBI_CONFIG

@router.post("/{tag_number}/calculate")
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
    
    # Get calibration history sorted by date (newest first)
    calibrations = db.exec(
        select(Calibration)
        .filter(Calibration.tag_number == tag_number)
        .order_by(Calibration.calibration_date.desc())
    ).all()
    
    # Get service risk category if exists
    service_risk = None
    if psv.service:
        service_risk = db.exec(
            select(ServiceRiskCategory)
            .filter(ServiceRiskCategory.service_type == psv.service)
        ).first()
    
    try:
        # Calculate based on RBI level
        if level == 1:
            interval, next_date = calculate_rbi_level_1(psv, config)
            return {
                "tag_number": tag_number,
                "rbi_level": level,
                "current_risk_score": 1.0,  # Fixed for level 1
                "recommended_interval": interval,
                "next_calibration_date": next_date.isoformat()
            }
        
        elif level == 2:
            risk_score, interval, next_date, reason, details = calculate_rbi_level_2(psv, calibrations, config)
            return {
                "tag_number": tag_number,
                "rbi_level": level,
                "current_risk_score": risk_score,
                "recommended_interval": interval,
                "next_calibration_date": next_date.isoformat(),
                "assessment_reason": reason,
                "details": details
            }
        
        elif level == 3:
            if not calibrations:
                # Fallback to level 2 if no calibration history
                return calculate_rbi(tag_number, 2, db)
            
            risk_score, interval, next_date = calculate_rbi_level_3(
                psv, calibrations, config
            )
            
            return {
                "tag_number": tag_number,
                "rbi_level": level,
                "current_risk_score": risk_score,
                "recommended_interval": interval,
                "next_calibration_date": next_date.isoformat()
            }
        
        elif level == 4:
            if not calibrations or not service_risk:
                # Fallback to level 3 if missing required data
                return calculate_rbi(tag_number, 3, db)
            
            # Using the improved RBI Level 4 calculation
            risk_score, pof_score, cof_score, risk_category, interval, next_date, risk_details = calculate_rbi_level_4(
                psv, calibrations, service_risk, config
            )
            
            return {
                "tag_number": tag_number,
                "rbi_level": level,
                "current_risk_score": risk_score,
                "pof_score": pof_score,
                "cof_score": cof_score,
                "risk_category": risk_category,
                "recommended_interval": interval,
                "next_calibration_date": next_date.isoformat(),
                "details": risk_details
            }
        
        else:
            raise HTTPException(
                status_code=400,
                detail=f"Invalid RBI level: {level}"
            )
            
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error calculating RBI level {level}: {str(e)}"
        )