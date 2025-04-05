from fastapi import APIRouter, Depends, HTTPException, Query
from typing import List, Optional
from sqlmodel import Session, select
from datetime import datetime
from ...database import get_session
from ...corrosion_models import (
    CorrosionLocation, 
    CorrosionCoupon,
    SystemRiskCategory
)

# Pydantic models for request/response
from pydantic import BaseModel

class LocationCreate(BaseModel):
    location_id: str
    name: str
    description: Optional[str] = None
    system: str
    unit: str
    line_number: Optional[str] = None
    p_and_id: Optional[str] = None
    system_risk_category: SystemRiskCategory
    fluid_type: str
    operating_temperature: float
    operating_pressure: float

class LocationUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    system: Optional[str] = None
    unit: Optional[str] = None
    line_number: Optional[str] = None
    p_and_id: Optional[str] = None
    system_risk_category: Optional[SystemRiskCategory] = None
    fluid_type: Optional[str] = None
    operating_temperature: Optional[float] = None
    operating_pressure: Optional[float] = None

class LocationResponse(BaseModel):
    id: int
    location_id: str
    name: str
    description: Optional[str]
    system: str
    unit: str
    line_number: Optional[str]
    p_and_id: Optional[str]
    system_risk_category: str
    fluid_type: str
    operating_temperature: float
    operating_pressure: float
    created_at: datetime
    updated_at: datetime

class LocationDetailResponse(LocationResponse):
    coupon_count: int

router = APIRouter()

@router.get("/", response_model=List[LocationResponse])
def get_all_locations(
    system: Optional[str] = None,
    unit: Optional[str] = None,
    risk_category: Optional[SystemRiskCategory] = None,
    session: Session = Depends(get_session),
    skip: int = 0,
    limit: int = 100
):
    """
    Get a list of all corrosion monitoring locations
    """
    query = select(CorrosionLocation)
    
    # Apply filters if provided
    if system:
        query = query.where(CorrosionLocation.system == system)
    if unit:
        query = query.where(CorrosionLocation.unit == unit)
    if risk_category:
        query = query.where(CorrosionLocation.system_risk_category == risk_category)
        
    # Apply pagination
    query = query.offset(skip).limit(limit)
    
    locations = session.exec(query).all()
    return locations

@router.get("/{location_id}", response_model=LocationDetailResponse)
def get_location_by_id(location_id: str, session: Session = Depends(get_session)):
    """
    Get details for a specific monitoring location
    """
    query = select(CorrosionLocation).where(CorrosionLocation.location_id == location_id)
    location = session.exec(query).first()
    
    if not location:
        raise HTTPException(status_code=404, detail=f"Location with ID {location_id} not found")
    
    # Count coupons for this location
    coupon_count = session.exec(
        select(CorrosionCoupon).where(CorrosionCoupon.location_id == location_id)
    ).count()
    
    # Convert to dict to add the coupon count
    location_dict = dict(location)
    location_dict["coupon_count"] = coupon_count
    
    return location_dict

@router.post("/", response_model=LocationResponse)
def create_location(location_data: LocationCreate, session: Session = Depends(get_session)):
    """
    Create a new monitoring location
    """
    # Check if location ID already exists
    existing = session.exec(
        select(CorrosionLocation).where(CorrosionLocation.location_id == location_data.location_id)
    ).first()
    if existing:
        raise HTTPException(
            status_code=400, 
            detail=f"Location with ID {location_data.location_id} already exists"
        )
    
    # Create new location
    new_location = CorrosionLocation(**location_data.dict())
    
    session.add(new_location)
    session.commit()
    session.refresh(new_location)
    
    return new_location

@router.put("/{location_id}", response_model=LocationResponse)
def update_location(
    location_id: str, 
    location_data: LocationUpdate, 
    session: Session = Depends(get_session)
):
    """
    Update an existing monitoring location
    """
    location = session.exec(
        select(CorrosionLocation).where(CorrosionLocation.location_id == location_id)
    ).first()
    
    if not location:
        raise HTTPException(status_code=404, detail=f"Location with ID {location_id} not found")
    
    # Update fields
    update_data = location_data.dict(exclude_unset=True)
    for key, value in update_data.items():
        setattr(location, key, value)
    
    # Update the updated_at timestamp
    location.updated_at = datetime.utcnow()
    
    session.add(location)
    session.commit()
    session.refresh(location)
    
    return location

@router.delete("/{location_id}")
def delete_location(location_id: str, session: Session = Depends(get_session)):
    """
    Delete a monitoring location
    """
    location = session.exec(
        select(CorrosionLocation).where(CorrosionLocation.location_id == location_id)
    ).first()
    
    if not location:
        raise HTTPException(status_code=404, detail=f"Location with ID {location_id} not found")
    
    # Check if there are any coupons associated with this location
    coupon_count = session.exec(
        select(CorrosionCoupon).where(CorrosionCoupon.location_id == location_id)
    ).count()
    
    if coupon_count > 0:
        raise HTTPException(
            status_code=400,
            detail=f"Cannot delete location {location_id} because it has {coupon_count} associated coupons"
        )
    
    session.delete(location)
    session.commit()
    
    return {"message": f"Location {location_id} has been deleted"}

@router.get("/{location_id}/coupons", response_model=List[dict])
def get_location_coupons(location_id: str, session: Session = Depends(get_session)):
    """
    Get all coupons for a specific location
    """
    # Check if location exists
    location = session.exec(
        select(CorrosionLocation).where(CorrosionLocation.location_id == location_id)
    ).first()
    
    if not location:
        raise HTTPException(status_code=404, detail=f"Location with ID {location_id} not found")
    
    # Get coupons for this location
    coupons = session.exec(
        select(CorrosionCoupon).where(CorrosionCoupon.location_id == location_id)
    ).all()
    
    return [dict(coupon) for coupon in coupons]