from fastapi import APIRouter, Depends, HTTPException, Query
from typing import List, Optional
from sqlmodel import Session, select
from datetime import datetime
from ...database import get_session
from ...corrosion_models import (
    CorrosionCoupon, 
    CorrosionLocation, 
    CouponStatus,
    CouponType,
    CouponOrientation,
    MonitoringLevel
)

# Pydantic models for request/response
from pydantic import BaseModel, Field

class CouponRemovalData(BaseModel):
    actual_removal_date: datetime
    notes: Optional[str] = None

class CorrosionCouponCreate(BaseModel):
    coupon_id: str
    location_id: str
    coupon_type: CouponType
    material_type: str
    surface_area: float
    initial_weight: float
    dimensions: str
    installation_date: datetime
    scheduled_removal_date: datetime
    orientation: CouponOrientation
    system_type: str
    fluid_velocity: Optional[float] = None
    temperature: float
    pressure: float
    notes: Optional[str] = None
    monitoring_level: MonitoringLevel

class CorrosionCouponUpdate(BaseModel):
    coupon_type: Optional[CouponType] = None
    material_type: Optional[str] = None
    surface_area: Optional[float] = None
    initial_weight: Optional[float] = None
    dimensions: Optional[str] = None
    scheduled_removal_date: Optional[datetime] = None
    orientation: Optional[CouponOrientation] = None
    system_type: Optional[str] = None
    fluid_velocity: Optional[float] = None
    temperature: Optional[float] = None
    pressure: Optional[float] = None
    notes: Optional[str] = None
    monitoring_level: Optional[MonitoringLevel] = None

class CorrosionCouponResponse(BaseModel):
    coupon_id: str
    location_id: str
    coupon_type: str
    material_type: str
    surface_area: float
    initial_weight: float
    dimensions: str
    installation_date: datetime
    scheduled_removal_date: datetime
    actual_removal_date: Optional[datetime] = None
    orientation: str
    system_type: str
    fluid_velocity: Optional[float] = None
    temperature: float
    pressure: float
    notes: Optional[str] = None
    status: str
    monitoring_level: int
    created_at: datetime
    updated_at: datetime

class CorrosionCouponDetailResponse(CorrosionCouponResponse):
    location: Optional[dict] = None

router = APIRouter()

@router.get("/", response_model=List[CorrosionCouponResponse])
def get_all_coupons(
    session: Session = Depends(get_session),
    status: Optional[CouponStatus] = None,
    coupon_type: Optional[CouponType] = None,
    location_id: Optional[str] = None,
    skip: int = 0,
    limit: int = 100
):
    """
    Get a list of all corrosion coupons with optional filtering
    """
    query = select(CorrosionCoupon)
    
    # Apply filters if provided
    if status:
        query = query.where(CorrosionCoupon.status == status)
    if coupon_type:
        query = query.where(CorrosionCoupon.coupon_type == coupon_type)
    if location_id:
        query = query.where(CorrosionCoupon.location_id == location_id)
        
    # Apply pagination
    query = query.offset(skip).limit(limit)
    
    coupons = session.exec(query).all()
    return coupons

@router.get("/{coupon_id}", response_model=CorrosionCouponDetailResponse)
def get_coupon_by_id(coupon_id: str, session: Session = Depends(get_session)):
    """
    Get details for a specific corrosion coupon
    """
    query = select(CorrosionCoupon).where(CorrosionCoupon.coupon_id == coupon_id)
    coupon = session.exec(query).first()
    
    if not coupon:
        raise HTTPException(status_code=404, detail=f"Coupon with ID {coupon_id} not found")
    
    # Get location details
    location_query = select(CorrosionLocation).where(CorrosionLocation.location_id == coupon.location_id)
    location = session.exec(location_query).first()
    
    # Convert to dict to add the location info
    coupon_dict = dict(coupon)
    coupon_dict["location"] = dict(location) if location else None
    
    return coupon_dict

@router.post("/", response_model=CorrosionCouponResponse)
def create_coupon(coupon_data: CorrosionCouponCreate, session: Session = Depends(get_session)):
    """
    Create a new corrosion coupon
    """
    # Check if coupon ID already exists
    existing = session.exec(
        select(CorrosionCoupon).where(CorrosionCoupon.coupon_id == coupon_data.coupon_id)
    ).first()
    if existing:
        raise HTTPException(
            status_code=400, 
            detail=f"Coupon with ID {coupon_data.coupon_id} already exists"
        )
    
    # Check if location exists
    location = session.exec(
        select(CorrosionLocation).where(CorrosionLocation.location_id == coupon_data.location_id)
    ).first()
    if not location:
        raise HTTPException(
            status_code=400,
            detail=f"Location with ID {coupon_data.location_id} not found"
        )
    
    # Create new coupon
    new_coupon = CorrosionCoupon(
        **coupon_data.dict(),
        status=CouponStatus.Installed,  # New coupons are always in Installed status
        actual_removal_date=None
    )
    
    session.add(new_coupon)
    session.commit()
    session.refresh(new_coupon)
    
    return new_coupon

@router.put("/{coupon_id}", response_model=CorrosionCouponResponse)
def update_coupon(
    coupon_id: str, 
    coupon_data: CorrosionCouponUpdate, 
    session: Session = Depends(get_session)
):
    """
    Update an existing coupon
    """
    coupon = session.exec(
        select(CorrosionCoupon).where(CorrosionCoupon.coupon_id == coupon_id)
    ).first()
    
    if not coupon:
        raise HTTPException(status_code=404, detail=f"Coupon with ID {coupon_id} not found")
    
    # Update fields
    update_data = coupon_data.dict(exclude_unset=True)
    for key, value in update_data.items():
        setattr(coupon, key, value)
    
    # Update the updated_at timestamp
    coupon.updated_at = datetime.utcnow()
    
    session.add(coupon)
    session.commit()
    session.refresh(coupon)
    
    return coupon

@router.delete("/{coupon_id}")
def delete_coupon(coupon_id: str, session: Session = Depends(get_session)):
    """
    Delete a coupon
    """
    coupon = session.exec(
        select(CorrosionCoupon).where(CorrosionCoupon.coupon_id == coupon_id)
    ).first()
    
    if not coupon:
        raise HTTPException(status_code=404, detail=f"Coupon with ID {coupon_id} not found")
    
    session.delete(coupon)
    session.commit()
    
    return {"message": f"Coupon {coupon_id} has been deleted"}

@router.post("/{coupon_id}/remove", response_model=CorrosionCouponResponse)
def record_coupon_removal(
    coupon_id: str, 
    removal_data: CouponRemovalData, 
    session: Session = Depends(get_session)
):
    """
    Record the removal of an installed coupon
    """
    coupon = session.exec(
        select(CorrosionCoupon).where(CorrosionCoupon.coupon_id == coupon_id)
    ).first()
    
    if not coupon:
        raise HTTPException(status_code=404, detail=f"Coupon with ID {coupon_id} not found")
    
    if coupon.status != CouponStatus.Installed:
        raise HTTPException(
            status_code=400,
            detail=f"Cannot remove coupon with status {coupon.status}. Only installed coupons can be removed."
        )
    
    # Update coupon with removal information
    coupon.actual_removal_date = removal_data.actual_removal_date
    coupon.status = CouponStatus.Removed
    if removal_data.notes:
        coupon.notes = coupon.notes + "\n---\nRemoval notes: " + removal_data.notes if coupon.notes else "Removal notes: " + removal_data.notes
    coupon.updated_at = datetime.utcnow()
    
    session.add(coupon)
    session.commit()
    session.refresh(coupon)
    
    return coupon