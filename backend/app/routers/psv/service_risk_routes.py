from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select
from ...database import get_session
from ...psv_models import ServiceRiskCategory

router = APIRouter(prefix="/service-risk", tags=["PSV Service Risk"])

@router.get("/", response_model=List[ServiceRiskCategory])
def get_service_risk_categories(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_session)
):
    """Get service risk categories"""
    query = select(ServiceRiskCategory)
    return db.exec(query.offset(skip).limit(limit)).all()

@router.get("/{service_type}", response_model=ServiceRiskCategory)
def get_service_risk_category(
    service_type: str,
    db: Session = Depends(get_session)
):
    """Get service risk category by service type"""
    category = db.exec(
        select(ServiceRiskCategory)
        .filter(ServiceRiskCategory.service_type == service_type)
    ).first()
    
    if not category:
        raise HTTPException(
            status_code=404,
            detail=f"No risk category found for service type: {service_type}"
        )
    
    return category

@router.post("/", response_model=ServiceRiskCategory)
def create_service_risk_category(
    category: ServiceRiskCategory,
    db: Session = Depends(get_session)
):
    """Create new service risk category"""
    # Check if service type already exists
    existing = db.exec(
        select(ServiceRiskCategory)
        .filter(ServiceRiskCategory.service_type == category.service_type)
    ).first()
    
    if existing:
        raise HTTPException(
            status_code=400,
            detail=f"Risk category already exists for service type: {category.service_type}"
        )
    
    db.add(category)
    try:
        db.commit()
        db.refresh(category)
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=str(e))
    return category

@router.put("/{service_type}", response_model=ServiceRiskCategory)
def update_service_risk_category(
    service_type: str,
    category_update: ServiceRiskCategory,
    db: Session = Depends(get_session)
):
    """Update existing service risk category"""
    category = db.exec(
        select(ServiceRiskCategory)
        .filter(ServiceRiskCategory.service_type == service_type)
    ).first()
    
    if not category:
        raise HTTPException(
            status_code=404,
            detail=f"No risk category found for service type: {service_type}"
        )
    
    # Update fields
    category_data = category_update.dict(exclude_unset=True)
    for key, value in category_data.items():
        setattr(category, key, value)
    
    try:
        db.commit()
        db.refresh(category)
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=str(e))
    return category

@router.delete("/{service_type}")
def delete_service_risk_category(
    service_type: str,
    db: Session = Depends(get_session)
):
    """Delete service risk category"""
    category = db.exec(
        select(ServiceRiskCategory)
        .filter(ServiceRiskCategory.service_type == service_type)
    ).first()
    
    if not category:
        raise HTTPException(
            status_code=404,
            detail=f"No risk category found for service type: {service_type}"
        )
    
    try:
        db.delete(category)
        db.commit()
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=str(e))
    
    return {"message": f"Service risk category '{service_type}' deleted successfully"}