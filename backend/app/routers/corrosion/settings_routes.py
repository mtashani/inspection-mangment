from fastapi import APIRouter, Depends, HTTPException, Query
from typing import List, Optional, Dict, Any
from sqlmodel import Session, select
from datetime import datetime
from ...database import get_session
from ...corrosion_models import CorrosionMonitoringSettings

# Pydantic models for request/response
from pydantic import BaseModel, Field

class InspectionFrequency(BaseModel):
    high_risk: int  # days
    medium_risk: int  # days
    low_risk: int  # days

class SeverityThresholds(BaseModel):
    corrosion_rate: Dict[str, float]  # level1-5 thresholds
    pitting_density: Dict[str, float]  # level1-5 thresholds
    pit_depth: Dict[str, float]  # level1-5 thresholds

class MaterialFactor(BaseModel):
    base_corrosion_rate: float
    severity_multiplier: float

class SettingsCreate(BaseModel):
    rbi_level: int = Field(ge=1, le=4)
    inspection_frequency: InspectionFrequency
    severity_thresholds: SeverityThresholds
    material_factors: Dict[str, MaterialFactor]

class SettingsUpdate(BaseModel):
    rbi_level: Optional[int] = Field(None, ge=1, le=4)
    inspection_frequency: Optional[InspectionFrequency] = None
    severity_thresholds: Optional[SeverityThresholds] = None
    material_factors: Optional[Dict[str, MaterialFactor]] = None

class MaterialUpdate(BaseModel):
    material_name: str
    base_corrosion_rate: float
    severity_multiplier: float

class MaterialListUpdate(BaseModel):
    materials: List[MaterialUpdate]

class ThresholdsUpdate(BaseModel):
    corrosion_rate: Dict[str, float]
    pitting_density: Dict[str, float]
    pit_depth: Dict[str, float]

class SettingsResponse(BaseModel):
    id: int
    rbi_level: int
    inspection_frequency: Dict[str, int]
    severity_thresholds: Dict[str, Dict[str, float]]
    material_factors: Dict[str, Dict[str, float]]
    created_at: datetime
    updated_at: datetime

class MaterialFactorResponse(BaseModel):
    material_name: str
    base_corrosion_rate: float
    severity_multiplier: float

class DefaultSettingsTemplate(BaseModel):
    rbi_level: int = 2
    inspection_frequency: Dict[str, int] = {
        "high_risk": 90,   # 90 days for high risk systems
        "medium_risk": 180, # 180 days for medium risk
        "low_risk": 365   # 365 days for low risk
    }
    severity_thresholds: Dict[str, Dict[str, float]] = {
        "corrosion_rate": {  # mm/year
            "level1": 0.025,
            "level2": 0.125,
            "level3": 0.25,
            "level4": 0.5,
            "level5": 1.0
        },
        "pitting_density": {  # pits per cm²
            "level1": 0.5,
            "level2": 2.0,
            "level3": 5.0,
            "level4": 10.0,
            "level5": 20.0
        },
        "pit_depth": {  # mm
            "level1": 0.1,
            "level2": 0.5,
            "level3": 1.0,
            "level4": 2.0,
            "level5": 3.0
        }
    }
    material_factors: Dict[str, Dict[str, float]] = {
        "Carbon Steel": {
            "base_corrosion_rate": 0.1,
            "severity_multiplier": 1.0
        },
        "Stainless Steel 304": {
            "base_corrosion_rate": 0.02,
            "severity_multiplier": 1.2
        },
        "Stainless Steel 316": {
            "base_corrosion_rate": 0.01,
            "severity_multiplier": 1.3
        },
        "Copper": {
            "base_corrosion_rate": 0.05,
            "severity_multiplier": 1.1
        },
        "Brass": {
            "base_corrosion_rate": 0.07,
            "severity_multiplier": 1.05
        },
        "Titanium": {
            "base_corrosion_rate": 0.001,
            "severity_multiplier": 2.0
        },
        "Aluminum": {
            "base_corrosion_rate": 0.03,
            "severity_multiplier": 1.15
        }
    }

router = APIRouter()

@router.get("/", response_model=SettingsResponse)
def get_settings(session: Session = Depends(get_session)):
    """
    Get current corrosion monitoring settings
    """
    settings = session.exec(select(CorrosionMonitoringSettings)).first()
    
    if not settings:
        # If no settings exist, create default settings
        default_settings = _create_default_settings(session)
        return default_settings
    
    return settings

@router.put("/", response_model=SettingsResponse)
def update_settings(settings_data: SettingsUpdate, session: Session = Depends(get_session)):
    """
    Update corrosion monitoring settings
    """
    settings = session.exec(select(CorrosionMonitoringSettings)).first()
    
    if not settings:
        # If no settings exist, create default settings first
        settings = _create_default_settings(session)
    
    # Update fields
    update_data = settings_data.dict(exclude_unset=True)
    for key, value in update_data.items():
        setattr(settings, key, value)
    
    # Update the updated_at timestamp
    settings.updated_at = datetime.utcnow()
    
    session.add(settings)
    session.commit()
    session.refresh(settings)
    
    return settings

@router.get("/materials", response_model=List[MaterialFactorResponse])
def get_material_factors(session: Session = Depends(get_session)):
    """
    Get material-specific factors
    """
    settings = session.exec(select(CorrosionMonitoringSettings)).first()
    
    if not settings:
        # If no settings exist, create default settings first
        settings = _create_default_settings(session)
    
    material_factors = []
    for material_name, factors in settings.material_factors.items():
        material_factors.append({
            "material_name": material_name,
            "base_corrosion_rate": factors["base_corrosion_rate"],
            "severity_multiplier": factors["severity_multiplier"]
        })
    
    return material_factors

@router.put("/materials", response_model=List[MaterialFactorResponse])
def update_material_factors(material_data: MaterialListUpdate, session: Session = Depends(get_session)):
    """
    Update material factors
    """
    settings = session.exec(select(CorrosionMonitoringSettings)).first()
    
    if not settings:
        # If no settings exist, create default settings first
        settings = _create_default_settings(session)
    
    # Update or add materials
    for material in material_data.materials:
        settings.material_factors[material.material_name] = {
            "base_corrosion_rate": material.base_corrosion_rate,
            "severity_multiplier": material.severity_multiplier
        }
    
    # Update the updated_at timestamp
    settings.updated_at = datetime.utcnow()
    
    session.add(settings)
    session.commit()
    session.refresh(settings)
    
    # Return the updated list
    material_factors = []
    for material_name, factors in settings.material_factors.items():
        material_factors.append({
            "material_name": material_name,
            "base_corrosion_rate": factors["base_corrosion_rate"],
            "severity_multiplier": factors["severity_multiplier"]
        })
    
    return material_factors

@router.delete("/materials/{material_name}")
def delete_material_factor(material_name: str, session: Session = Depends(get_session)):
    """
    Delete a material factor
    """
    settings = session.exec(select(CorrosionMonitoringSettings)).first()
    
    if not settings or material_name not in settings.material_factors:
        raise HTTPException(
            status_code=404, 
            detail=f"Material '{material_name}' not found in settings"
        )
    
    # Remove the material from the settings
    del settings.material_factors[material_name]
    
    # Update the updated_at timestamp
    settings.updated_at = datetime.utcnow()
    
    session.add(settings)
    session.commit()
    
    return {"message": f"Material '{material_name}' has been deleted"}

@router.get("/thresholds", response_model=SeverityThresholds)
def get_severity_thresholds(session: Session = Depends(get_session)):
    """
    Get severity threshold settings
    """
    settings = session.exec(select(CorrosionMonitoringSettings)).first()
    
    if not settings:
        # If no settings exist, create default settings first
        settings = _create_default_settings(session)
    
    return settings.severity_thresholds

@router.put("/thresholds", response_model=SeverityThresholds)
def update_severity_thresholds(threshold_data: ThresholdsUpdate, session: Session = Depends(get_session)):
    """
    Update severity thresholds
    """
    settings = session.exec(select(CorrosionMonitoringSettings)).first()
    
    if not settings:
        # If no settings exist, create default settings first
        settings = _create_default_settings(session)
    
    # Update thresholds
    settings.severity_thresholds = {
        "corrosion_rate": threshold_data.corrosion_rate,
        "pitting_density": threshold_data.pitting_density,
        "pit_depth": threshold_data.pit_depth
    }
    
    # Update the updated_at timestamp
    settings.updated_at = datetime.utcnow()
    
    session.add(settings)
    session.commit()
    session.refresh(settings)
    
    return settings.severity_thresholds

@router.post("/reset", response_model=SettingsResponse)
def reset_to_defaults(session: Session = Depends(get_session)):
    """
    Reset all settings to default values
    """
    settings = session.exec(select(CorrosionMonitoringSettings)).first()
    
    if settings:
        session.delete(settings)
        session.commit()
    
    # Create new default settings
    default_settings = _create_default_settings(session)
    
    return default_settings

def _create_default_settings(session: Session) -> CorrosionMonitoringSettings:
    """
    Create default settings if none exist
    """
    default_template = DefaultSettingsTemplate().dict()
    
    default_settings = CorrosionMonitoringSettings(
        rbi_level=default_template["rbi_level"],
        inspection_frequency=default_template["inspection_frequency"],
        severity_thresholds=default_template["severity_thresholds"],
        material_factors=default_template["material_factors"]
    )
    
    session.add(default_settings)
    session.commit()
    session.refresh(default_settings)
    
    return default_settings