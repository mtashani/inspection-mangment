from datetime import datetime
from typing import Dict, List, Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select
from sqlalchemy.sql import func, distinct, or_
from app.database import get_session
from app.domains.psv.models.psv import PSV
from app.domains.psv.models.enums import PSVStatus

router = APIRouter()

@router.get("/", response_model=List[PSV])
def get_psvs(
    skip: int = 0,
    limit: int = 100,
    tag_number: Optional[str] = None,
    status: Optional[PSVStatus] = None,
    service: Optional[str] = None,
    unit: Optional[List[str]] = None,
    type: Optional[List[str]] = None,
    train: Optional[List[str]] = None,
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
    
    # Handle multiple unit values with OR condition
    if unit and len(unit) > 0:
        unit_filters = [PSV.unit == u for u in unit]
        query = query.filter(or_(*unit_filters))
    
    # Handle multiple type values with OR condition
    if type and len(type) > 0:
        type_filters = [PSV.type == t for t in type]
        query = query.filter(or_(*type_filters))
    
    # Handle multiple train values with OR condition
    if train and len(train) > 0:
        train_filters = [PSV.train == t for t in train]
        query = query.filter(or_(*train_filters))
    
    return db.exec(query.offset(skip).limit(limit)).all()

@router.get("/{tag_number}", response_model=PSV)
def get_psv(tag_number: str, db: Session = Depends(get_session)):
    """Get PSV by tag number"""
    # Use select instead of db.get for more reliable querying
    query = select(PSV).where(PSV.tag_number == tag_number)
    psv = db.exec(query).first()
    
    if not psv:
        # Add more detail to error message
        raise HTTPException(
            status_code=404,
            detail=f"PSV with tag number '{tag_number}' not found"
        )
    return psv

# Add remaining handlers from psv_routes.py...
