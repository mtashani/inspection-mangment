from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlmodel import Session, select
from app.database import get_session
from app.domains.corrosion.models.location import CorrosionLocation
from app.domains.corrosion.models.enums import SystemRiskCategory

router = APIRouter()

@router.get("/", response_model=List[CorrosionLocation])
def get_locations(
    skip: int = 0,
    limit: int = 100,
    system: Optional[str] = None,
    unit: Optional[str] = None,
    risk_category: Optional[SystemRiskCategory] = None,
    db: Session = Depends(get_session)
):
    """Get list of corrosion monitoring locations with optional filtering"""
    query = select(CorrosionLocation)
    
    if system:
        query = query.filter(CorrosionLocation.system.contains(system))
    if unit:
        query = query.filter(CorrosionLocation.unit.contains(unit))
    if risk_category:
        query = query.filter(CorrosionLocation.system_risk_category == risk_category)
        
    return db.exec(query.offset(skip).limit(limit)).all()

@router.post("/", response_model=CorrosionLocation)
def create_location(
    location: CorrosionLocation,
    db: Session = Depends(get_session)
):
    """Create new corrosion monitoring location"""
    db.add(location)
    try:
        db.commit()
        db.refresh(location)
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=str(e))
    return location

@router.get("/{location_id}", response_model=CorrosionLocation)
def get_location(
    location_id: str,
    db: Session = Depends(get_session)
):
    """Get location by ID"""
    location = db.exec(
        select(CorrosionLocation).where(CorrosionLocation.location_id == location_id)
    ).first()
    
    if not location:
        raise HTTPException(
            status_code=404,
            detail=f"Location with ID '{location_id}' not found"
        )
    return location

@router.put("/{location_id}", response_model=CorrosionLocation)
def update_location(
    location_id: str,
    location_update: CorrosionLocation,
    db: Session = Depends(get_session)
):
    """Update location"""
    db_location = db.exec(
        select(CorrosionLocation).where(CorrosionLocation.location_id == location_id)
    ).first()
    
    if not db_location:
        raise HTTPException(status_code=404, detail="Location not found")
    
    # Update fields
    location_data = location_update.dict(exclude_unset=True)
    for key, value in location_data.items():
        setattr(db_location, key, value)
    
    try:
        db.commit()
        db.refresh(db_location)
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=str(e))
    return db_location

@router.delete("/{location_id}")
def delete_location(
    location_id: str,
    db: Session = Depends(get_session)
):
    """Delete location"""
    location = db.exec(
        select(CorrosionLocation).where(CorrosionLocation.location_id == location_id)
    ).first()
    
    if not location:
        raise HTTPException(status_code=404, detail="Location not found")
    
    try:
        db.delete(location)
        db.commit()
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=str(e))
    return {"message": "Location deleted successfully"}