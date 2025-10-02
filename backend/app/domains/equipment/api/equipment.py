from typing import List, Optional, Dict
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlmodel import Session, select
from datetime import datetime
from app.database import get_session
from app.domains.equipment.models.equipment import Equipment
from app.domains.equipment.models.enums import EquipmentCategory, EquipmentStatus, EquipmentCondition
from app.core.api_logging import log_api_errors

router = APIRouter()

@log_api_errors("equipment")
@router.get("/", response_model=List[Equipment])
def get_equipment(
    skip: int = 0,
    limit: int = 100,
    tag: Optional[str] = None,
    equipment_type: Optional[str] = None,
    unit: Optional[str] = None,
    train: Optional[str] = None,
    db: Session = Depends(get_session)
):
    """Get list of equipment with optional filtering"""
    query = select(Equipment)
    
    if tag:
        query = query.filter(Equipment.tag.contains(tag))
    if equipment_type:
        query = query.filter(Equipment.equipment_type.contains(equipment_type))
    if unit:
        query = query.filter(Equipment.unit.contains(unit))
    if train:
        query = query.filter(Equipment.train.contains(train))
        
    return db.exec(query.offset(skip).limit(limit)).all()

@log_api_errors("equipment")
@router.post("/", response_model=Equipment)
def create_equipment(
    equipment: Equipment,
    db: Session = Depends(get_session)
):
    """Create new equipment"""
    db.add(equipment)
    try:
        db.commit()
        db.refresh(equipment)
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=str(e))
    return equipment

@log_api_errors("equipment")
@router.get("/{equipment_id}", response_model=Equipment)
def get_equipment_by_id(
    equipment_id: int,
    db: Session = Depends(get_session)
):
    """Get equipment by ID"""
    equipment = db.get(Equipment, equipment_id)
    if not equipment:
        raise HTTPException(
            status_code=404,
            detail=f"Equipment with ID {equipment_id} not found"
        )
    return equipment

@log_api_errors("equipment")
@router.put("/{equipment_id}", response_model=Equipment)
def update_equipment(
    equipment_id: int,
    equipment_update: Equipment,
    db: Session = Depends(get_session)
):
    """Update equipment"""
    db_equipment = db.get(Equipment, equipment_id)
    if not db_equipment:
        raise HTTPException(status_code=404, detail="Equipment not found")
    
    # Update fields
    equipment_data = equipment_update.dict(exclude_unset=True)
    for key, value in equipment_data.items():
        setattr(db_equipment, key, value)
    
    try:
        db.commit()
        db.refresh(db_equipment)
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=str(e))
    return db_equipment

@log_api_errors("equipment")
@router.delete("/{equipment_id}")
def delete_equipment(
    equipment_id: int,
    db: Session = Depends(get_session)
):
    """Delete equipment"""
    equipment = db.get(Equipment, equipment_id)
    if not equipment:
        raise HTTPException(status_code=404, detail="Equipment not found")
    
    try:
        db.delete(equipment)
        db.commit()
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=str(e))
    return {"message": "Equipment deleted successfully"}

@log_api_errors("equipment")
@router.get("/{equipment_id}/inspections")
def get_equipment_inspections(
    equipment_id: int,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_session)
):
    """Get inspections for equipment"""
    equipment = db.get(Equipment, equipment_id)
    if not equipment:
        raise HTTPException(status_code=404, detail="Equipment not found")
    
    # Return basic info - actual inspection data would come from inspection domain
    return {
        "equipment_id": equipment_id,
        "equipment_tag": equipment.tag,
        "message": "Inspection data available through inspection domain API"
    }