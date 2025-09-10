# NEW/UPDATED: Payroll API router using domain-driven design principles
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
from app.domains.auth.dependencies import get_current_user, require_admin, require_permission, Permission

router = APIRouter()

@router.get("/inspectors/{inspector_id}/payroll", response_model=Optional[PayrollRecordResponse])
def get_inspector_payroll(
    inspector_id: int,
    jalali_year: int = Query(...),
    jalali_month: int = Query(...),
    db: Session = Depends(get_session),
    current_user=Depends(get_current_user)
):
    """
    Get payroll for an inspector for a Jalali month.
    Inspector can only view own payroll (and only in last 5 days of month), admin can view any.
    """
    if current_user.is_admin or Permission.PAYROLL_VIEW_ALL in getattr(current_user, "permissions", []):
        pass
    elif current_user.id == inspector_id and Permission.PAYROLL_VIEW_OWN in getattr(current_user, "permissions", []):
        pass
    else:
        raise HTTPException(status_code=403, detail="Not authorized to view this payroll.")
    service = PayrollService(db)
    record = service.get_payroll(inspector_id, jalali_year, jalali_month)
    if not record:
        raise HTTPException(status_code=404, detail="Payroll not found.")
    return record

@router.post("/inspectors/{inspector_id}/payroll", response_model=PayrollRecordResponse)
def create_or_update_payroll(
    inspector_id: int,
    payroll_data: PayrollRecordCreate,
    db: Session = Depends(get_session),
    current_user=Depends(require_permission(Permission.PAYROLL_EDIT))
):
    """
    Create or update a payroll record for a Jalali month (admin only).
    """
    service = PayrollService(db)
    record = service.create_or_update_payroll(inspector_id, payroll_data)
    return record

@router.post("/payroll/{payroll_id}/items", response_model=PayrollItemResponse)
def add_payroll_item(
    payroll_id: int,
    item_data: PayrollItemCreate,
    db: Session = Depends(get_session),
    current_user=Depends(require_permission(Permission.PAYROLL_EDIT))
):
    """
    Add a payroll item (admin only).
    """
    service = PayrollService(db)
    item = service.add_payroll_item(payroll_id, item_data)
    return item

@router.put("/payroll/items/{item_id}", response_model=PayrollItemResponse)
def edit_payroll_item(
    item_id: int,
    item_data: PayrollItemUpdate,
    db: Session = Depends(get_session),
    current_user=Depends(require_permission(Permission.PAYROLL_EDIT))
):
    """
    Edit a payroll item (admin only).
    """
    service = PayrollService(db)
    item = service.edit_payroll_item(item_id, item_data)
    return item

@router.delete("/payroll/items/{item_id}")
def delete_payroll_item(
    item_id: int,
    db: Session = Depends(get_session),
    current_user=Depends(require_permission(Permission.PAYROLL_EDIT))
):
    """
    Delete a payroll item (admin only).
    """
    service = PayrollService(db)
    result = service.delete_payroll_item(item_id)
    return {"success": result}

@router.post("/inspectors/{inspector_id}/payroll/auto-calculate", response_model=PayrollRecordResponse)
def auto_calculate_payroll(
    inspector_id: int,
    jalali_year: int = Query(...),
    jalali_month: int = Query(...),
    db: Session = Depends(get_session),
    current_user=Depends(require_permission(Permission.PAYROLL_FINALIZE))
):
    """
    Auto-calculate payroll items from attendance (admin only).
    """
    service = PayrollService(db)
    record = service.auto_calculate_payroll(inspector_id, jalali_year, jalali_month)
    return record

@router.get("/inspectors/{inspector_id}/payroll/all", response_model=List[PayrollRecordResponse])
def get_all_payrolls_for_inspector(
    inspector_id: int,
    db: Session = Depends(get_session),
    current_user=Depends(get_current_user)
):
    """
    Inspector can view all their payrolls (Jalali months, all history). Admin can view any inspector's payrolls.
    """
    if current_user.is_admin or Permission.PAYROLL_VIEW_ALL in getattr(current_user, "permissions", []):
        pass
    elif current_user.id == inspector_id and Permission.PAYROLL_VIEW_OWN in getattr(current_user, "permissions", []):
        pass
    else:
        raise HTTPException(status_code=403, detail="Not authorized to view these payrolls.")
    service = PayrollService(db)
    records = service.get_all_payrolls_for_inspector(inspector_id)
    if not records:
        raise HTTPException(status_code=404, detail="Payrolls not found.")
    return records 