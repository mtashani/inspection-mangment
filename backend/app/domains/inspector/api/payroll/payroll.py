# Inspector Payroll API router using domain-driven design principles
from fastapi import APIRouter, Depends, HTTPException, Query, Body, status
from typing import List, Optional, Dict, Any
from sqlmodel import Session, select, and_, or_, func, desc
import datetime
import logging
from decimal import Decimal
from app.domains.inspector.models.payroll import PayrollRecord, PayrollItem, PayrollSettings
from app.domains.inspector.schemas.payroll import (
    PayrollRecordCreate, PayrollRecordUpdate, PayrollRecordResponse,
    PayrollItemCreate, PayrollItemUpdate, PayrollItemResponse,
    PayrollSettingsCreate, PayrollSettingsUpdate, PayrollSettingsResponse
)
from app.domains.inspector.services.payroll_service import PayrollService
from app.database import get_session
from app.domains.auth.dependencies import get_current_active_inspector, require_standardized_permission
try:
    from app.domains.auth.dependencies import require_standardized_permission
except ImportError:
    # Fallback if standardized permissions not yet implemented
    require_standardized_permission = require_permission
from app.core.api_logging import log_api_errors

router = APIRouter()

@log_api_errors("inspector")
@router.get("", response_model=List[PayrollRecordResponse])
def get_all_payroll_records(
    jalali_year: Optional[int] = Query(None),
    jalali_month: Optional[int] = Query(None),
    db: Session = Depends(get_session),
    current_inspector = Depends(require_standardized_permission("system_superadmin"))
):
    """
    Get all payroll records (admin only).
    """
    service = PayrollService(db)
    records = service.get_all_payroll_records(jalali_year, jalali_month)
    return records

@log_api_errors("inspector")
@router.post("", response_model=PayrollRecordResponse)
def create_payroll_record(
    payroll_data: PayrollRecordCreate,
    db: Session = Depends(get_session),
    current_inspector = Depends(require_standardized_permission("system_superadmin"))
):
    """
    Create a new payroll record (admin only).
    """
    service = PayrollService(db)
    record = service.create_payroll_record(payroll_data)
    return record

@log_api_errors("inspector")
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

@log_api_errors("inspector")
@router.put("/{payroll_id}", response_model=PayrollRecordResponse)
def update_payroll_record(
    payroll_id: int,
    payroll_data: PayrollRecordUpdate,
    db: Session = Depends(get_session),
    current_inspector = Depends(require_standardized_permission("system_superadmin"))
):
    """
    Update a payroll record (admin only).
    """
    service = PayrollService(db)
    record = service.update_payroll_record(payroll_id, payroll_data)
    return record

@log_api_errors("inspector")
@router.delete("/{payroll_id}")
def delete_payroll_record(
    payroll_id: int,
    db: Session = Depends(get_session),
    current_inspector = Depends(require_standardized_permission("system_superadmin"))
):
    """
    Delete a payroll record (admin only).
    """
    service = PayrollService(db)
    service.delete_payroll_record(payroll_id)
    return {"message": "Payroll record deleted successfully"}

@log_api_errors("inspector")
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

@log_api_errors("inspector")
@router.post("/{payroll_id}/calculate", response_model=PayrollRecordResponse)
def calculate_payroll(
    payroll_id: int,
    db: Session = Depends(get_session),
    current_inspector = Depends(require_standardized_permission("system_superadmin"))
):
    """
    Calculate payroll automatically based on attendance (admin only).
    """
    service = PayrollService(db)
    record = service.calculate_payroll(payroll_id)
    return record

@log_api_errors("inspector")
@router.post("/{payroll_id}/items", response_model=PayrollItemResponse)
def add_payroll_item(
    payroll_id: int,
    item_data: PayrollItemCreate,
    db: Session = Depends(get_session),
    current_inspector = Depends(require_standardized_permission("system_superadmin"))
):
    """
    Add a payroll item (admin only).
    """
    service = PayrollService(db)
    item = service.add_payroll_item(payroll_id, item_data)
    return item

@log_api_errors("inspector")
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

@log_api_errors("inspector")
@router.put("/items/{item_id}", response_model=PayrollItemResponse)
def update_payroll_item(
    item_id: int,
    item_data: PayrollItemUpdate,
    db: Session = Depends(get_session),
    current_inspector = Depends(require_standardized_permission("system_superadmin"))
):
    """
    Update a payroll item (admin only).
    """
    service = PayrollService(db)
    item = service.update_payroll_item(item_id, item_data)
    return item

@log_api_errors("inspector")
@router.delete("/items/{item_id}")
def delete_payroll_item(
    item_id: int,
    db: Session = Depends(get_session),
    current_inspector = Depends(require_standardized_permission("system_superadmin"))
):
    """
    Delete a payroll item (admin only).
    """
    service = PayrollService(db)
    service.delete_payroll_item(item_id)
    return {"message": "Payroll item deleted successfully"}

@log_api_errors("inspector")
@router.get("/summary", response_model=dict)
def get_payroll_summary(
    jalali_year: int = Query(...),
    jalali_month: int = Query(...),
    db: Session = Depends(get_session),
    current_inspector = Depends(require_standardized_permission("system_superadmin"))
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


# Enhanced Admin Functionality for Payroll Management

@log_api_errors("inspector")
@router.post("/admin/calculate-bulk", response_model=Dict[str, Any])
async def calculate_payroll_bulk(
    calculation_request: Dict[str, Any] = Body(...),
    db: Session = Depends(get_session),
    current_inspector = Depends(require_standardized_permission("system_superadmin"))
):
    """
    Calculate payroll for multiple inspectors based on attendance data.
    Supports both individual and bulk calculations.
    """
    try:
        service = PayrollService(db)
        
        inspector_ids = calculation_request.get('inspector_ids', [])
        jalali_year = calculation_request.get('jalali_year')
        jalali_month = calculation_request.get('jalali_month')
        options = calculation_request.get('options', {})
        
        if not inspector_ids or not jalali_year or not jalali_month:
            raise HTTPException(
                status_code=400, 
                detail="Missing required parameters: inspector_ids, jalali_year, jalali_month"
            )
        
        # Validate month
        if not 1 <= jalali_month <= 12:
            raise HTTPException(status_code=400, detail="Invalid Jalali month")
        
        results = []
        errors = []
        
        for inspector_id in inspector_ids:
            try:
                # Calculate payroll for this inspector
                payroll_record = service.auto_calculate_payroll(inspector_id, jalali_year, jalali_month)
                
                results.append({
                    "inspector_id": inspector_id,
                    "payroll_id": payroll_record.id,
                    "total_earnings": float(payroll_record.total_earnings or 0),
                    "total_deductions": float(payroll_record.total_deductions or 0),
                    "net_pay": float(payroll_record.net_pay or 0),
                    "status": "calculated"
                })
                
            except Exception as e:
                errors.append({
                    "inspector_id": inspector_id,
                    "error": str(e)
                })
        
        logging.info(f"Bulk payroll calculation by inspector {current_inspector.id}: {len(results)} successful, {len(errors)} failed")
        
        return {
            "calculated": len(results),
            "failed": len(errors),
            "total_requested": len(inspector_ids),
            "period": f"{jalali_year}/{jalali_month:02d}",
            "results": results,
            "errors": errors
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logging.error(f"Bulk payroll calculation failed: {e}")
        raise HTTPException(status_code=500, detail=f"Calculation failed: {str(e)}")


@log_api_errors("inspector")
@router.get("/admin/records", response_model=Dict[str, Any])
async def list_payroll_records_admin(
    page: int = Query(1, ge=1),
    limit: int = Query(50, ge=1, le=100),
    jalali_year: Optional[int] = Query(None),
    jalali_month: Optional[int] = Query(None),
    inspector_id: Optional[int] = Query(None),
    status: Optional[str] = Query(None),
    min_amount: Optional[float] = Query(None),
    max_amount: Optional[float] = Query(None),
    db: Session = Depends(get_session),
    current_inspector = Depends(require_standardized_permission("system_superadmin"))
):
    """
    List payroll records with comprehensive filtering and pagination for admin panel.
    """
    try:
        from app.domains.inspector.models.inspector import Inspector
        
        # Build query
        query = select(PayrollRecord, Inspector).join(Inspector)
        conditions = []
        
        # Apply filters
        if inspector_id:
            conditions.append(PayrollRecord.inspector_id == inspector_id)
        

        
        if status:
            conditions.append(PayrollRecord.status == status)
        
        if jalali_year:
            conditions.append(PayrollRecord.jalali_year == jalali_year)
            
        if jalali_month:
            if not 1 <= jalali_month <= 12:
                raise HTTPException(status_code=400, detail="Invalid Jalali month")
            conditions.append(PayrollRecord.jalali_month == jalali_month)
        
        if min_amount is not None:
            conditions.append(PayrollRecord.net_pay >= min_amount)
            
        if max_amount is not None:
            conditions.append(PayrollRecord.net_pay <= max_amount)
        
        if conditions:
            query = query.where(and_(*conditions))
        
        # Get total count
        count_query = select(func.count(PayrollRecord.id)).select_from(
            PayrollRecord.__table__.join(Inspector.__table__)
        )
        if conditions:
            count_query = count_query.where(and_(*conditions))
        
        total_records = db.exec(count_query).one()
        
        # Apply pagination and ordering
        offset = (page - 1) * limit
        query = query.order_by(desc(PayrollRecord.jalali_year), desc(PayrollRecord.jalali_month), Inspector.employee_id)
        query = query.offset(offset).limit(limit)
        
        results = db.exec(query).all()
        
        # Format response
        records = []
        for payroll, inspector in results:
            records.append({
                "id": payroll.id,
                "inspector_id": inspector.id,
                "inspector_name": f"{inspector.first_name} {inspector.last_name}",
                "employee_id": inspector.employee_id,
                "period": f"{payroll.jalali_year}/{payroll.jalali_month:02d}",
                "jalali_year": payroll.jalali_year,
                "jalali_month": payroll.jalali_month,
                "base_salary": float(payroll.base_salary or 0),
                "overtime_pay": float(payroll.overtime_pay or 0),
                "night_shift_pay": float(payroll.night_shift_pay or 0),
                "on_call_pay": float(payroll.on_call_pay or 0),
                "total_earnings": float(payroll.total_earnings or 0),
                "total_deductions": float(payroll.total_deductions or 0),
                "net_pay": float(payroll.net_pay or 0),
                "status": payroll.status,
                "created_at": payroll.created_at.isoformat(),
                "updated_at": payroll.updated_at.isoformat()
            })
        
        return {
            "records": records,
            "pagination": {
                "page": page,
                "limit": limit,
                "total_records": total_records,
                "total_pages": (total_records + limit - 1) // limit,
                "has_next": page * limit < total_records,
                "has_prev": page > 1
            },
            "summary": {
                "total_net_pay": sum(float(r["net_pay"]) for r in records),
                "total_earnings": sum(float(r["total_earnings"]) for r in records),
                "total_deductions": sum(float(r["total_deductions"]) for r in records),
                "average_net_pay": sum(float(r["net_pay"]) for r in records) / len(records) if records else 0
            }
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logging.error(f"Failed to list payroll records: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to retrieve payroll records: {str(e)}")


@log_api_errors("inspector")
@router.post("/admin/export", response_model=Dict[str, Any])
async def export_payroll_data(
    export_request: Dict[str, Any] = Body(...),
    db: Session = Depends(get_session),
    current_inspector = Depends(require_standardized_permission("system_superadmin"))
):
    """
    Export payroll data in various formats (Excel, PDF, CSV).
    """
    try:
        format_type = export_request.get("format", "excel").lower()
        
        if format_type not in ["excel", "pdf", "csv"]:
            raise HTTPException(status_code=400, detail="Invalid format. Must be excel, pdf, or csv")
        
        # Get export parameters
        filters = export_request.get("filters", {})
        include_summary = export_request.get("include_summary", True)
        include_charts = export_request.get("include_charts", True)
        group_by = export_request.get("group_by", "inspector")
        
        # Generate export data (placeholder implementation)
        export_data = {
            "format": format_type,
            "generated_at": datetime.datetime.utcnow().isoformat(),
            "generated_by": current_inspector.id,
            "filters_applied": filters,
            "download_url": f"/api/v1/inspector/payroll/download/{format_type}/export_{datetime.datetime.now().strftime('%Y%m%d_%H%M%S')}",
            "expires_at": (datetime.datetime.utcnow().replace(hour=23, minute=59, second=59)).isoformat()
        }
        
        logging.info(f"Payroll export ({format_type}) requested by inspector {current_inspector.id}")
        
        # In a real implementation, this would:
        # 1. Generate the file in the background
        # 2. Store it temporarily
        # 3. Return a download URL
        
        return {
            "message": f"Payroll export ({format_type.upper()}) is being generated",
            "export_id": f"payroll_export_{datetime.datetime.now().strftime('%Y%m%d_%H%M%S')}",
            "estimated_completion": "2-5 minutes",
            "download_url": export_data["download_url"],
            "expires_at": export_data["expires_at"]
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logging.error(f"Payroll export failed: {e}")
        raise HTTPException(status_code=500, detail=f"Export failed: {str(e)}")


@log_api_errors("inspector")
@router.post("/admin/approve-batch", response_model=Dict[str, Any])
async def approve_payroll_batch(
    approval_request: Dict[str, Any] = Body(...),
    db: Session = Depends(get_session),
    current_inspector = Depends(require_standardized_permission("system_superadmin"))
):
    """
    Approve multiple payroll records in batch.
    """
    try:
        payroll_ids = approval_request.get('payroll_ids', [])
        approval_comments = approval_request.get('comments', '')
        
        if not payroll_ids:
            raise HTTPException(status_code=400, detail="No payroll IDs provided")
        
        service = PayrollService(db)
        results = []
        errors = []
        
        for payroll_id in payroll_ids:
            try:
                # Update payroll status to approved
                payroll = service.approve_payroll_record(payroll_id, current_inspector.id, approval_comments)
                results.append({
                    "payroll_id": payroll_id,
                    "status": "approved",
                    "approved_at": datetime.datetime.utcnow().isoformat()
                })
            except Exception as e:
                errors.append({
                    "payroll_id": payroll_id,
                    "error": str(e)
                })
        
        logging.info(f"Batch payroll approval by inspector {current_inspector.id}: {len(results)} approved, {len(errors)} failed")
        
        return {
            "approved": len(results),
            "failed": len(errors),
            "total_requested": len(payroll_ids),
            "approved_by": current_inspector.id,
            "approved_at": datetime.datetime.utcnow().isoformat(),
            "results": results,
            "errors": errors
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logging.error(f"Batch payroll approval failed: {e}")
        raise HTTPException(status_code=500, detail=f"Batch approval failed: {str(e)}")


@log_api_errors("inspector")
@router.get("/admin/summary/{jalali_year}/{jalali_month}", response_model=Dict[str, Any])
async def get_payroll_summary_detailed(
    jalali_year: int,
    jalali_month: int,
    db: Session = Depends(get_session),
    current_inspector = Depends(require_standardized_permission("system_superadmin"))
):
    """
    Get comprehensive payroll summary for a specific period.
    """
    try:
        if not 1 <= jalali_month <= 12:
            raise HTTPException(status_code=400, detail="Invalid Jalali month")
        
        from app.domains.inspector.models.inspector import Inspector
        
        # Build query for the specified period
        query = select(PayrollRecord, Inspector).join(Inspector).where(
            and_(
                PayrollRecord.jalali_year == jalali_year,
                PayrollRecord.jalali_month == jalali_month
            )
        )
        
        payroll_records = db.exec(query).all()
        
        if not payroll_records:
            return {
                "period": f"{jalali_year}/{jalali_month:02d}",
                "total_records": 0,
                "summary": {},
                "by_inspector_status": {},
                "by_status": {}
            }
        
        # Calculate summary statistics
        total_base_salary = sum(float(record[0].base_salary or 0) for record in payroll_records)
        total_overtime_pay = sum(float(record[0].overtime_pay or 0) for record in payroll_records)
        total_night_shift_pay = sum(float(record[0].night_shift_pay or 0) for record in payroll_records)
        total_on_call_pay = sum(float(record[0].on_call_pay or 0) for record in payroll_records)
        total_earnings = sum(float(record[0].total_earnings or 0) for record in payroll_records)
        total_deductions = sum(float(record[0].total_deductions or 0) for record in payroll_records)
        total_net_pay = sum(float(record[0].net_pay or 0) for record in payroll_records)
        
        # Group by inspector status
        by_inspector_status = {}
        for payroll, inspector in payroll_records:
            inspector_status = 'active' if inspector.active else 'inactive'
            if inspector_status not in by_inspector_status:
                by_inspector_status[inspector_status] = {
                    "count": 0,
                    "total_net_pay": 0,
                    "total_earnings": 0,
                    "total_deductions": 0
                }
            by_inspector_status[inspector_status]["count"] += 1
            by_inspector_status[inspector_status]["total_net_pay"] += float(payroll.net_pay or 0)
            by_inspector_status[inspector_status]["total_earnings"] += float(payroll.total_earnings or 0)
            by_inspector_status[inspector_status]["total_deductions"] += float(payroll.total_deductions or 0)
        
        # Group by status
        by_status = {}
        for payroll, inspector in payroll_records:
            status = payroll.status or "draft"
            if status not in by_status:
                by_status[status] = {"count": 0, "total_amount": 0}
            by_status[status]["count"] += 1
            by_status[status]["total_amount"] += float(payroll.net_pay or 0)
        
        return {
            "period": f"{jalali_year}/{jalali_month:02d}",
            "total_records": len(payroll_records),
            "summary": {
                "total_base_salary": total_base_salary,
                "total_overtime_pay": total_overtime_pay,
                "total_night_shift_pay": total_night_shift_pay,
                "total_on_call_pay": total_on_call_pay,
                "total_earnings": total_earnings,
                "total_deductions": total_deductions,
                "total_net_pay": total_net_pay,
                "average_net_pay": total_net_pay / len(payroll_records) if payroll_records else 0
            },
            "by_inspector_status": by_inspector_status,
            "by_status": by_status
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logging.error(f"Failed to get payroll summary: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to get payroll summary: {str(e)}")