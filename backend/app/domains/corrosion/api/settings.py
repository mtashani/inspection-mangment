from typing import List, Optional, Dict
from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select
from app.database import get_session
from app.domains.corrosion.models.settings import CorrosionMonitoringSettings

router = APIRouter()

@router.get("/", response_model=CorrosionMonitoringSettings)
def get_monitoring_settings(
    db: Session = Depends(get_session)
):
    """Get corrosion monitoring settings"""
    settings = db.exec(select(CorrosionMonitoringSettings)).first()
    if not settings:
        raise HTTPException(
            status_code=404,
            detail="No monitoring settings found. Please create settings first."
        )
    return settings

@router.post("/", response_model=CorrosionMonitoringSettings)
def create_monitoring_settings(
    settings: CorrosionMonitoringSettings,
    db: Session = Depends(get_session)
):
    """Create or update corrosion monitoring settings"""
    # Check if settings already exist
    existing_settings = db.exec(select(CorrosionMonitoringSettings)).first()
    
    if existing_settings:
        # Update existing settings
        for key, value in settings.dict(exclude_unset=True).items():
            setattr(existing_settings, key, value)
        db_settings = existing_settings
    else:
        # Create new settings
        db_settings = settings
        db.add(db_settings)
    
    try:
        db.commit()
        db.refresh(db_settings)
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=str(e))
    
    return db_settings

@router.put("/", response_model=CorrosionMonitoringSettings)
def update_monitoring_settings(
    settings_update: CorrosionMonitoringSettings,
    db: Session = Depends(get_session)
):
    """Update corrosion monitoring settings"""
    existing_settings = db.exec(select(CorrosionMonitoringSettings)).first()
    
    if not existing_settings:
        raise HTTPException(
            status_code=404, 
            detail="No monitoring settings found. Use POST to create settings first."
        )
    
    # Update fields
    settings_data = settings_update.dict(exclude_unset=True)
    for key, value in settings_data.items():
        setattr(existing_settings, key, value)
    
    try:
        db.commit()
        db.refresh(existing_settings)
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=str(e))
    
    return existing_settings

@router.get("/defaults")
def get_default_settings():
    """Get default settings values"""
    return {
        "rbi_level": 2,
        "inspection_frequency": {
            1: 365,  # 1 year for very low severity
            2: 240,  # 8 months for low severity
            3: 180,  # 6 months for medium severity
            4: 90,   # 3 months for high severity
            5: 30    # 1 month for very high severity
        },
        "severity_thresholds": {
            "corrosion_rate": {
                "low": 0.1,      # mm/year
                "medium": 0.25,  # mm/year
                "high": 0.5,     # mm/year
                "severe": 1.0    # mm/year
            },
            "pit_depth": {
                "low": 0.5,      # mm
                "medium": 1.0,   # mm
                "high": 2.0,     # mm
                "severe": 3.0    # mm
            }
        },
        "material_factors": {
            "carbon_steel": 1.0,
            "stainless_304": 0.8,
            "stainless_316": 0.6,
            "duplex": 0.5,
            "inconel": 0.4
        }
    }