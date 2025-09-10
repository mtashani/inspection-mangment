from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlmodel import Session, select
from datetime import datetime
from app.database import get_session
from app.domains.corrosion.models.coupon import CorrosionCoupon
from app.domains.corrosion.models.location import CorrosionLocation
from app.domains.corrosion.models.enums import CouponStatus, CouponType

router = APIRouter()

@router.get("/", response_model=List[CorrosionCoupon])
def get_coupons(
    skip: int = 0,
    limit: int = 100,
    location_id: Optional[str] = None,
    status: Optional[CouponStatus] = None,
    coupon_type: Optional[CouponType] = None,
    db: Session = Depends(get_session)
):
    """Get list of corrosion coupons with optional filtering"""
    query = select(CorrosionCoupon)
    
    if location_id:
        query = query.filter(CorrosionCoupon.location_id == location_id)
    if status:
        query = query.filter(CorrosionCoupon.status == status)
    if coupon_type:
        query = query.filter(CorrosionCoupon.coupon_type == coupon_type)
        
    return db.exec(query.offset(skip).limit(limit)).all()

@router.post("/", response_model=CorrosionCoupon)
def create_coupon(
    coupon: CorrosionCoupon,
    db: Session = Depends(get_session)
):
    """Create new corrosion coupon"""
    # Verify that location exists
    location = db.exec(
        select(CorrosionLocation).where(CorrosionLocation.location_id == coupon.location_id)
    ).first()
    
    if not location:
        raise HTTPException(
            status_code=404,
            detail=f"Location with ID '{coupon.location_id}' not found"
        )
    
    db.add(coupon)
    try:
        db.commit()
        db.refresh(coupon)
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=str(e))
    return coupon

@router.get("/{coupon_id}", response_model=CorrosionCoupon)
def get_coupon(
    coupon_id: str,
    db: Session = Depends(get_session)
):
    """Get coupon by ID"""
    coupon = db.get(CorrosionCoupon, coupon_id)
    if not coupon:
        raise HTTPException(
            status_code=404,
            detail=f"Coupon with ID '{coupon_id}' not found"
        )
    return coupon

@router.put("/{coupon_id}", response_model=CorrosionCoupon)
def update_coupon(
    coupon_id: str,
    coupon_update: CorrosionCoupon,
    db: Session = Depends(get_session)
):
    """Update coupon"""
    db_coupon = db.get(CorrosionCoupon, coupon_id)
    if not db_coupon:
        raise HTTPException(status_code=404, detail="Coupon not found")
    
    # Update fields
    coupon_data = coupon_update.dict(exclude_unset=True)
    
    # If location_id is being updated, verify it exists
    if "location_id" in coupon_data:
        location = db.exec(
            select(CorrosionLocation).where(CorrosionLocation.location_id == coupon_data["location_id"])
        ).first()
        
        if not location:
            raise HTTPException(
                status_code=404,
                detail=f"Location with ID '{coupon_data['location_id']}' not found"
            )
    
    for key, value in coupon_data.items():
        setattr(db_coupon, key, value)
    
    try:
        db.commit()
        db.refresh(db_coupon)
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=str(e))
    return db_coupon

@router.delete("/{coupon_id}")
def delete_coupon(
    coupon_id: str,
    db: Session = Depends(get_session)
):
    """Delete coupon"""
    coupon = db.get(CorrosionCoupon, coupon_id)
    if not coupon:
        raise HTTPException(status_code=404, detail="Coupon not found")
    
    try:
        db.delete(coupon)
        db.commit()
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=str(e))
    return {"message": "Coupon deleted successfully"}

@router.post("/{coupon_id}/remove")
def remove_coupon(
    coupon_id: str,
    removal_date: datetime = None,
    db: Session = Depends(get_session)
):
    """Mark coupon as removed"""
    coupon = db.get(CorrosionCoupon, coupon_id)
    if not coupon:
        raise HTTPException(status_code=404, detail="Coupon not found")
    
    if coupon.status != CouponStatus.Installed:
        raise HTTPException(status_code=400, detail="Only installed coupons can be removed")
    
    coupon.status = CouponStatus.Removed
    coupon.actual_removal_date = removal_date or datetime.utcnow()
    
    try:
        db.commit()
        db.refresh(coupon)
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=str(e))
    
    return {
        "message": "Coupon successfully marked as removed",
        "coupon_id": coupon_id,
        "removal_date": coupon.actual_removal_date
    }