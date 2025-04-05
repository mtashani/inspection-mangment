from fastapi import APIRouter, HTTPException, Depends, Query, UploadFile, File, Form, Body
from fastapi.responses import JSONResponse
from sqlmodel import Session, select
from sqlalchemy.sql import func
from typing import List, Optional
from datetime import datetime, timedelta
import os
import uuid
from ..database import get_session
from ..crane_models import Crane, CraneInspection, CraneInspectionSettings, CraneType, CraneStatus

router = APIRouter()

# Helpers
def calculate_next_inspection_date(session: Session, crane_type: CraneType, inspection_date: datetime) -> datetime:
    """Calculate the next inspection date based on crane type and settings"""
    setting = session.exec(
        select(CraneInspectionSettings).where(CraneInspectionSettings.crane_type == crane_type)
    ).first()
    
    if not setting:
        # Default: 6 months for mobile cranes, 12 months for others
        months = 6 if crane_type == CraneType.Mobile else 12
    else:
        months = setting.inspection_interval_months
        
    return inspection_date + timedelta(days=30 * months)

async def save_uploaded_file(file: UploadFile, directory: str) -> str:
    """Save an uploaded file and return its path"""
    # Create directory if it doesn't exist
    os.makedirs(directory, exist_ok=True)
    
    # Generate unique filename
    filename = f"{uuid.uuid4().hex}_{file.filename}"
    file_path = os.path.join(directory, filename)
    
    # Save the file
    with open(file_path, "wb") as buffer:
        buffer.write(await file.read())
    
    return file_path

# Crane CRUD Endpoints
@router.get("/", response_model=List[Crane])
def get_cranes(
    skip: int = 0, 
    limit: int = 100,
    crane_type: Optional[CraneType] = None,
    status: Optional[CraneStatus] = None,
    location: Optional[str] = None,
    session: Session = Depends(get_session)
):
    """Get all cranes with optional filtering"""
    query = select(Crane)
    
    if crane_type:
        query = query.where(Crane.crane_type == crane_type)
    
    if status:
        query = query.where(Crane.status == status)
    
    if location:
        query = query.where(Crane.location.contains(location))
    
    cranes = session.exec(query.offset(skip).limit(limit)).all()
    return cranes

@router.post("/", response_model=Crane)
def create_crane(crane: Crane, session: Session = Depends(get_session)):
    """Create a new crane"""
    # Check for duplicate tag number
    existing = session.exec(select(Crane).where(Crane.tag_number == crane.tag_number)).first()
    if existing:
        raise HTTPException(status_code=400, detail=f"Crane with tag number {crane.tag_number} already exists")
    
    # Set initial capacities to be the same if not specified
    if not crane.current_allowed_capacity:
        crane.current_allowed_capacity = crane.nominal_capacity
    
    session.add(crane)
    session.commit()
    session.refresh(crane)
    return crane

@router.get("/{crane_id}", response_model=Crane)
def get_crane(crane_id: int, session: Session = Depends(get_session)):
    """Get a specific crane by ID"""
    crane = session.get(Crane, crane_id)
    if not crane:
        raise HTTPException(status_code=404, detail="Crane not found")
    return crane

@router.put("/{crane_id}", response_model=Crane)
def update_crane(crane_id: int, updated_crane: Crane, session: Session = Depends(get_session)):
    """Update a specific crane"""
    crane = session.get(Crane, crane_id)
    if not crane:
        raise HTTPException(status_code=404, detail="Crane not found")
    
    # Update crane attributes
    crane_data = updated_crane.dict(exclude_unset=True)
    for key, value in crane_data.items():
        if key != "id" and hasattr(crane, key):
            setattr(crane, key, value)
    
    crane.updated_at = datetime.utcnow()
    session.add(crane)
    session.commit()
    session.refresh(crane)
    return crane

@router.delete("/{crane_id}")
def delete_crane(crane_id: int, session: Session = Depends(get_session)):
    """Delete a crane"""
    crane = session.get(Crane, crane_id)
    if not crane:
        raise HTTPException(status_code=404, detail="Crane not found")
    
    session.delete(crane)
    session.commit()
    return {"message": "Crane deleted successfully"}

@router.put("/{crane_id}/status", response_model=Crane)
def update_crane_status(
    crane_id: int, 
    status: CraneStatus = Body(..., embed=True), 
    session: Session = Depends(get_session)
):
    """Update the status of a crane"""
    crane = session.get(Crane, crane_id)
    if not crane:
        raise HTTPException(status_code=404, detail="Crane not found")
    
    crane.status = status
    crane.updated_at = datetime.utcnow()
    session.add(crane)
    session.commit()
    session.refresh(crane)
    return crane

# Crane Inspection Endpoints
@router.get("/inspections/", response_model=List[CraneInspection])
def get_crane_inspections(
    skip: int = 0,
    limit: int = 100,
    crane_id: Optional[int] = None,
    session: Session = Depends(get_session)
):
    """Get inspection records with optional filtering by crane"""
    query = select(CraneInspection)
    
    if crane_id:
        query = query.where(CraneInspection.crane_id == crane_id)
    
    inspections = session.exec(query.offset(skip).limit(limit)).all()
    return inspections

@router.post("/inspections/", response_model=CraneInspection)
async def create_inspection(
    crane_id: int = Form(...),
    inspection_date: datetime = Form(...),
    performed_by: str = Form(...),
    status: str = Form(...),
    findings: str = Form(...),
    recommendations: str = Form(...),
    allowed_capacity: float = Form(...),
    certificate_image: Optional[UploadFile] = File(None),
    report_file: Optional[UploadFile] = File(None),
    session: Session = Depends(get_session)
):
    """Create a new crane inspection record"""
    # Check if crane exists
    crane = session.get(Crane, crane_id)
    if not crane:
        raise HTTPException(status_code=404, detail="Crane not found")
    
    # Save certificate image if provided
    certificate_path = None
    if certificate_image:
        certificate_path = await save_uploaded_file(
            certificate_image, 
            os.path.join("uploads", "crane_certificates")
        )
    
    # Save report file if provided
    report_path = None
    if report_file:
        report_path = await save_uploaded_file(
            report_file, 
            os.path.join("uploads", "crane_reports")
        )
    
    # Calculate next inspection date
    next_inspection_date = calculate_next_inspection_date(
        session, 
        crane.crane_type, 
        inspection_date
    )
    
    # Create inspection record
    inspection = CraneInspection(
        crane_id=crane_id,
        inspection_date=inspection_date,
        next_inspection_date=next_inspection_date,
        performed_by=performed_by,
        status=status,
        findings=findings,
        recommendations=recommendations,
        certificate_image_path=certificate_path,
        allowed_capacity=allowed_capacity,
        report_file_path=report_path
    )
    
    # Update crane with new inspection details
    crane.last_inspection_date = inspection_date
    crane.next_inspection_date = next_inspection_date
    crane.current_allowed_capacity = allowed_capacity
    crane.updated_at = datetime.utcnow()
    
    session.add(inspection)
    session.add(crane)
    session.commit()
    session.refresh(inspection)
    return inspection

@router.get("/inspections/{inspection_id}", response_model=CraneInspection)
def get_inspection(inspection_id: int, session: Session = Depends(get_session)):
    """Get a specific inspection record"""
    inspection = session.get(CraneInspection, inspection_id)
    if not inspection:
        raise HTTPException(status_code=404, detail="Inspection record not found")
    return inspection

@router.delete("/inspections/{inspection_id}")
def delete_inspection(inspection_id: int, session: Session = Depends(get_session)):
    """Delete an inspection record"""
    inspection = session.get(CraneInspection, inspection_id)
    if not inspection:
        raise HTTPException(status_code=404, detail="Inspection record not found")
    
    session.delete(inspection)
    session.commit()
    return {"message": "Inspection record deleted successfully"}

# Crane Inspection Settings Endpoints
@router.get("/settings/", response_model=List[CraneInspectionSettings])
def get_settings(session: Session = Depends(get_session)):
    """Get all crane inspection interval settings"""
    settings = session.exec(select(CraneInspectionSettings)).all()
    return settings

@router.post("/settings/", response_model=CraneInspectionSettings)
def create_setting(setting: CraneInspectionSettings, session: Session = Depends(get_session)):
    """Create or update inspection interval setting for a crane type"""
    # Check if setting for this crane type already exists
    existing = session.exec(
        select(CraneInspectionSettings)
        .where(CraneInspectionSettings.crane_type == setting.crane_type)
    ).first()
    
    if existing:
        # Update existing
        existing.inspection_interval_months = setting.inspection_interval_months
        existing.active = setting.active
        existing.updated_at = datetime.utcnow()
        session.add(existing)
        session.commit()
        session.refresh(existing)
        return existing
    
    # Create new
    session.add(setting)
    session.commit()
    session.refresh(setting)
    return setting

@router.get("/settings/{crane_type}", response_model=CraneInspectionSettings)
def get_setting_by_type(crane_type: CraneType, session: Session = Depends(get_session)):
    """Get inspection interval setting for a specific crane type"""
    setting = session.exec(
        select(CraneInspectionSettings)
        .where(CraneInspectionSettings.crane_type == crane_type)
    ).first()
    
    if not setting:
        raise HTTPException(status_code=404, detail=f"No settings found for {crane_type} cranes")
    
    return setting

@router.delete("/settings/{setting_id}")
def delete_setting(setting_id: int, session: Session = Depends(get_session)):
    """Delete an inspection interval setting"""
    setting = session.get(CraneInspectionSettings, setting_id)
    if not setting:
        raise HTTPException(status_code=404, detail="Setting not found")
    
    session.delete(setting)
    session.commit()
    return {"message": "Setting deleted successfully"}

# Dashboard and Analytics
@router.get("/dashboard")
def get_dashboard_data(session: Session = Depends(get_session)):
    """Get summary data for the crane dashboard"""
    # Total cranes by type
    cranes_by_type_query = select(Crane.crane_type, func.count(Crane.id)).group_by(Crane.crane_type)
    cranes_by_type = session.exec(cranes_by_type_query).all()
    
    # Total cranes by status
    cranes_by_status_query = select(Crane.status, func.count(Crane.id)).group_by(Crane.status)
    cranes_by_status = session.exec(cranes_by_status_query).all()
    
    # Upcoming inspections
    today = datetime.utcnow()
    upcoming_inspections_query = select(Crane).where(
        Crane.next_inspection_date >= today,
        Crane.next_inspection_date <= today + timedelta(days=30)
    ).order_by(Crane.next_inspection_date)
    upcoming_inspections = session.exec(upcoming_inspections_query).all()
    
    # Overdue inspections
    overdue_inspections_query = select(Crane).where(Crane.next_inspection_date < today)
    overdue_inspections = session.exec(overdue_inspections_query).all()
    
    # Cranes with reduced capacity
    reduced_capacity_query = select(Crane).where(Crane.current_allowed_capacity < Crane.nominal_capacity)
    reduced_capacity = session.exec(reduced_capacity_query).all()
    
    return {
        "cranes_by_type": [{"type": t, "count": c} for t, c in cranes_by_type],
        "cranes_by_status": [{"status": s, "count": c} for s, c in cranes_by_status],
        "upcoming_inspections": [
            {
                "id": crane.id,
                "tag_number": crane.tag_number,
                "type": crane.crane_type,
                "next_inspection_date": crane.next_inspection_date
            }
            for crane in upcoming_inspections
        ],
        "overdue_inspections_count": len(overdue_inspections),
        "reduced_capacity_count": len(reduced_capacity)
    }