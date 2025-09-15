# Inspector Payroll API router using domain-driven design principles
from fastapi import APIRouter, Depends, HTTPException, Query, status
from typing import List, Optional
from sqlmodel import Session
import datetime
from app.domains.inspector.models.payroll import PayrollRecord, PayrollItem, PayrollSettings
from app.domains.inspector.schemas.payroll import (
    PayrollRecordCreate, PayrollRecordUpdate, PayrollRecordResponse,
    PayrollItemCreate, PayrollItemUpdate, PayrollItemResponse,
    PayrollSettingsCreate, PayrollSettingsUpdate, PayrollSettingsResponse
)
from app.domains.inspector.services.payroll_service import PayrollService
from app.database import get_session
from app.domains.auth.dependencies import get_current_active_inspector, require_permission

router = APIRouter()

@router.get("", response_model=List[PayrollRecordResponse])
def get_all_payroll_records(
    jalali_year: Optional[int] = Query(None),
    jalali_month: Optional[int] = Query(None),
    db: Session = Depends(get_session),
    current_inspector = Depends(require_permission("admin", "manage"))
):
    """
    Get all payroll records (admin only).
    """
    service = PayrollService(db)
    records = service.get_all_payroll_records(jalali_year, jalali_month)
    return records

@router.post("", response_model=PayrollRecordResponse)
def create_payroll_record(
    payroll_data: PayrollRecordCreate,
    db: Session = Depends(get_session),
    current_inspector = Depends(require_permission("admin", "manage"))
):
    """
    Create a new payroll record (admin only).
    """
    service = PayrollService(db)
    record = service.create_payroll_record(payroll_data)
    return record

@router.get("/{payroll_id}", response_model=PayrollRecordResponse)
def get_payroll_record(
    payroll_id: int,
    db: Session = Depends(get_session),
    current_inspector = Depends(get_current_active_inspector)
):
    """
    Get a specific payroll record.
    """
    service = PayrollService(db)
    record = service.get_payroll_by_id(payroll_id)
    if not record:
        raise HTTPException(status_code=404, detail="Payroll record not found.")
    
    # Check permissions
    from app.domains.auth.services.auth_service import AuthService
    auth_service = AuthService(db)
    
    has_admin_permission = auth_service.has_permission(
        current_inspector.id, "admin", "manage"
    )
    has_payroll_view_all = auth_service.has_permission(
        current_inspector.id, "payroll", "view_all"
    )
    has_payroll_view_own = auth_service.has_permission(
        current_inspector.id, "payroll", "view_own"
    )
    
    if has_admin_permission or has_payroll_view_all:
        pass
    elif current_inspector.id == record.inspector_id and has_payroll_view_own:
        pass
    else:
        raise HTTPException(status_code=403, detail="Not authorized to view this payroll.")
    
    return record

@router.put("/{payroll_id}", response_model=PayrollRecordResponse)
def update_payroll_record(
    payroll_id: int,
    payroll_data: PayrollRecordUpdate,
    db: Session = Depends(get_session),
    current_inspector = Depends(require_permission("admin", "manage"))
):
    """
    Update a payroll record (admin only).
    """
    service = PayrollService(db)
    record = service.update_payroll_record(payroll_id, payroll_data)
    return record

@router.delete("/{payroll_id}")
def delete_payroll_record(
    payroll_id: int,
    db: Session = Depends(get_session),
    current_inspector = Depends(require_permission("admin", "manage"))
):
    """
    Delete a payroll record (admin only).
    """
    service = PayrollService(db)
    service.delete_payroll_record(payroll_id)
    return {"message": "Payroll record deleted successfully"}

@router.get("/{inspector_id}", response_model=List[PayrollRecordResponse])
def get_inspector_payroll_records(
    inspector_id: int,
    jalali_year: Optional[int] = Query(None),
    jalali_month: Optional[int] = Query(None),
    db: Session = Depends(get_session),
    current_inspector = Depends(get_current_active_inspector)
):
    """
    Get payroll records for a specific inspector.
    Inspector can only view their own, admin can view any.
    """
    # Check permissions
    from app.domains.auth.services.auth_service import AuthService
    auth_service = AuthService(db)
    
    has_admin_permission = auth_service.has_permission(
        current_inspector.id, "admin", "manage"
    )
    has_payroll_view_all = auth_service.has_permission(
        current_inspector.id, "payroll", "view_all"
    )
    has_payroll_view_own = auth_service.has_permission(
        current_inspector.id, "payroll", "view_own"
    )
    
    if has_admin_permission or has_payroll_view_all:
        pass
    elif current_inspector.id == inspector_id and has_payroll_view_own:
        pass
    else:
        raise HTTPException(status_code=403, detail="Not authorized to view this payroll.")
    
    service = PayrollService(db)
    records = service.get_payroll_records_by_inspector(inspector_id, jalali_year, jalali_month)
    return records

@router.post("/{payroll_id}/calculate", response_model=PayrollRecordResponse)
def calculate_payroll(
    payroll_id: int,
    db: Session = Depends(get_session),
    current_inspector = Depends(require_permission("admin", "manage"))
):
    """
    Calculate payroll automatically based on attendance (admin only).
    """
    service = PayrollService(db)
    record = service.calculate_payroll(payroll_id)
    return record

@router.post("/{payroll_id}/items", response_model=PayrollItemResponse)
def add_payroll_item(
    payroll_id: int,
    item_data: PayrollItemCreate,
    db: Session = Depends(get_session),
    current_inspector = Depends(require_permission("admin", "manage"))
):
    """
    Add a payroll item (admin only).
    """
    service = PayrollService(db)
    item = service.add_payroll_item(payroll_id, item_data)
    return item

@router.get("/{payroll_id}/items", response_model=List[PayrollItemResponse])
def get_payroll_items(
    payroll_id: int,
    db: Session = Depends(get_session),
    current_inspector = Depends(get_current_active_inspector)
):
    """
    Get all items for a payroll record.
    """
    service = PayrollService(db)
    items = service.get_payroll_items(payroll_id)
    return items

@router.put("/items/{item_id}", response_model=PayrollItemResponse)
def update_payroll_item(
    item_id: int,
    item_data: PayrollItemUpdate,
    db: Session = Depends(get_session),
    current_inspector = Depends(require_permission("admin", "manage"))
):
    """
    Update a payroll item (admin only).
    """
    service = PayrollService(db)
    item = service.update_payroll_item(item_id, item_data)
    return item

@router.delete("/items/{item_id}")
def delete_payroll_item(
    item_id: int,
    db: Session = Depends(get_session),
    current_inspector = Depends(require_permission("admin", "manage"))
):
    """
    Delete a payroll item (admin only).
    """
    service = PayrollService(db)
    service.delete_payroll_item(item_id)
    return {"message": "Payroll item deleted successfully"}

@router.get("/summary", response_model=dict)
def get_payroll_summary(
    jalali_year: int = Query(...),
    jalali_month: int = Query(...),
    db: Session = Depends(get_session),
    current_inspector = Depends(require_permission("admin", "manage"))
):
    """
    Get payroll summary for a specific month (admin only).
    """
    try:
        if not 1 <= jalali_month <= 12:
            raise HTTPException(status_code=400, detail="Invalid Jalali month. Must be between 1 and 12.")
        
        service = PayrollService(db)
        summary = service.get_payroll_summary(jalali_year, jalali_month)
        return summary
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get payroll summary: {str(e)}")