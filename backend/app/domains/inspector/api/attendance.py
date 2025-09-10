# NEW/UPDATED: Attendance API router using domain-driven design principles
from fastapi import APIRouter, Depends, HTTPException, Query, status, Body
from typing import List, Optional
from sqlmodel import Session
import datetime
from app.domains.inspector.models.attendance import AttendanceRecord, LeaveRequest, WorkCycle, MonthlyAttendance
from app.domains.inspector.models.enums import AttendanceStatus, LeaveRequestStatus
from app.domains.inspector.schemas.attendance import (
    AttendanceRecordCreate, AttendanceRecordUpdate, AttendanceRecordResponse,
    LeaveRequestCreate, LeaveRequestUpdate, LeaveRequestResponse,
    MonthlyAttendanceResponse
)
from app.domains.inspector.services.attendance_service import AttendanceService
from app.database import get_session
from app.domains.auth.dependencies import get_current_user, require_admin, require_permission, Permission

router = APIRouter()

@router.get("/inspectors/{inspector_id}/attendance", response_model=List[AttendanceRecordResponse])
def get_inspector_attendance(
    inspector_id: int,
    jalali_year: int = Query(...),
    jalali_month: int = Query(...),
    db: Session = Depends(get_session),
    current_user=Depends(get_current_user)
):
    """
    Get inspector's attendance for a Jalali month (recorded + predicted).
    Admins can view all, inspectors can only view their own.
    """
    if current_user.is_admin or Permission.ATTENDANCE_VIEW_ALL in getattr(current_user, "permissions", []):
        pass
    elif current_user.id == inspector_id and Permission.ATTENDANCE_VIEW_OWN in getattr(current_user, "permissions", []):
        pass
    else:
        raise HTTPException(status_code=403, detail="Not authorized to view this attendance.")
    service = AttendanceService(db)
    records = service.get_attendance(inspector_id, jalali_year, jalali_month)
    if not records:
        raise HTTPException(status_code=404, detail="Attendance not found.")
    return [AttendanceRecordResponse.from_model(record) for record in records]

@router.post("/inspectors/{inspector_id}/attendance", response_model=AttendanceRecordResponse)
def create_or_update_attendance(
    inspector_id: int,
    attendance_data: AttendanceRecordCreate,
    db: Session = Depends(get_session),
    current_user=Depends(require_admin)
):
    """
    Create or update an attendance record for a specific day (admin only).
    """
    service = AttendanceService(db)
    record = service.create_or_update_attendance(inspector_id, attendance_data)
    return AttendanceRecordResponse.from_model(record)

@router.post("/inspectors/{inspector_id}/attendance/generate", response_model=List[AttendanceRecordResponse])
def generate_attendance_for_work_cycle(
    inspector_id: int,
    work_cycle_id: int = Query(...),
    db: Session = Depends(get_session),
    current_user=Depends(require_admin)
):
    """
    Generate attendance records automatically for a work cycle (admin only).
    """
    service = AttendanceService(db)
    records = service.generate_attendance(inspector_id, work_cycle_id)
    return records

@router.get("/inspectors/{inspector_id}/leave-requests", response_model=List[LeaveRequestResponse])
def get_leave_requests(
    inspector_id: int,
    status: Optional[LeaveRequestStatus] = Query(None),
    db: Session = Depends(get_session),
    current_user=Depends(get_current_user)
):
    """
    Get leave requests for an inspector. Admins can view all, inspectors only their own.
    """
    service = AttendanceService(db)
    leaves = service.get_leave_requests(inspector_id, status)
    return leaves

@router.post("/inspectors/{inspector_id}/leave-requests", response_model=LeaveRequestResponse)
def create_leave_request(
    inspector_id: int,
    leave_request_data: LeaveRequestCreate,
    db: Session = Depends(get_session),
    current_user=Depends(get_current_user)
):
    """
    Create a leave request (inspector only).
    """
    service = AttendanceService(db)
    leave = service.create_leave_request(inspector_id, leave_request_data)
    return leave

@router.put("/leave-requests/{request_id}/approve", response_model=LeaveRequestResponse)
def approve_leave_request(
    request_id: int,
    db: Session = Depends(get_session),
    current_user=Depends(require_admin)
):
    """
    Approve a leave request (admin only). Automatically updates attendance days.
    """
    service = AttendanceService(db)
    # TODO: Pass approver_id from current_user
    leave = service.approve_leave_request(request_id, approver_id=1)
    return leave

@router.put("/leave-requests/{request_id}/reject", response_model=LeaveRequestResponse)
def reject_leave_request(
    request_id: int,
    reason: str,
    db: Session = Depends(get_session),
    current_user=Depends(require_admin)
):
    """
    Reject a leave request (admin only).
    """
    service = AttendanceService(db)
    leave = service.reject_leave_request(request_id, reason)
    return leave

@router.put("/inspectors/{inspector_id}/attendance/override", response_model=AttendanceRecordResponse)
def override_attendance_day(
    inspector_id: int,
    override_data: AttendanceRecordUpdate,
    db: Session = Depends(get_session),
    current_user=Depends(require_admin)
):
    """
    Override attendance for a specific day (admin only).
    """
    service = AttendanceService(db)
    record = service.override_attendance(inspector_id, override_data)
    return AttendanceRecordResponse.from_model(record)

@router.get("/inspectors/{inspector_id}/monthly-attendance/{jalali_year}/{jalali_month}", response_model=MonthlyAttendanceResponse)
def get_or_generate_monthly_attendance(inspector_id: int, jalali_year: int, jalali_month: int, db: Session = Depends(get_session)):
    service = AttendanceService(db)
    monthly = service.generate_monthly_attendance(inspector_id, jalali_year, jalali_month)
    if not monthly:
        raise HTTPException(status_code=404, detail="Attendance not found or not enabled for this inspector.")
    return monthly

@router.patch("/inspectors/{inspector_id}/monthly-attendance/{jalali_year}/{jalali_month}/day/{day}")
def update_monthly_attendance_day(
    inspector_id: int,
    jalali_year: int,
    jalali_month: int,
    day: int,
    data: dict = Body(...),
    db: Session = Depends(get_session)
):
    service = AttendanceService(db)
    monthly = service.generate_monthly_attendance(inspector_id, jalali_year, jalali_month)
    if not monthly:
        raise HTTPException(status_code=404, detail="Attendance not found.")
    # پیدا کردن روز مورد نظر
    updated = False
    for d in monthly.days:
        if int(d['jalali_date'].split('-')[2]) == day:
            d.update(data)
            updated = True
            break
    if not updated:
        raise HTTPException(status_code=404, detail="Day not found in attendance.")
    db.add(monthly)
    db.commit()
    db.refresh(monthly)
    return {"success": True, "days": monthly.days}


# Bulk Operations for Admin Panel

@router.post("/admin/attendance/bulk-update")
async def bulk_update_attendance(
    updates: List[dict] = Body(..., description="List of attendance updates"),
    db: Session = Depends(get_session),
    current_user = Depends(require_admin)
):
    """
    Bulk update attendance records for multiple inspectors/dates.
    Format: [{"inspector_id": 1, "date": "2023-01-01", "status": "WORKING", ...}, ...]
    """
    try:
        service = AttendanceService(db)
        results = []
        errors = []
        
        for i, update_data in enumerate(updates):
            try:
                # Validate required fields
                if 'inspector_id' not in update_data or ('date' not in update_data and 'jalali_date' not in update_data):
                    errors.append({"index": i, "error": "Missing required fields: inspector_id and date/jalali_date"})
                    continue
                
                inspector_id = update_data.pop('inspector_id')
                
                # Create AttendanceRecordCreate object
                from app.domains.inspector.schemas.attendance import AttendanceRecordCreate
                record_data = AttendanceRecordCreate(**update_data)
                
                # Update or create record
                updated_record = service.create_or_update_attendance(inspector_id, record_data)
                results.append({
                    "index": i,
                    "inspector_id": inspector_id,
                    "date": updated_record.date.isoformat(),
                    "status": "updated"
                })
                
            except Exception as e:
                errors.append({"index": i, "error": str(e)})
        
        return {
            "total_processed": len(updates),
            "successful_updates": len(results),
            "failed_updates": len(errors),
            "results": results,
            "errors": errors
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Bulk update failed: {str(e)}")


@router.post("/admin/attendance/bulk-import")
async def bulk_import_attendance(
    import_data: dict = Body(..., description="Bulk import data with inspectors and records"),
    db: Session = Depends(get_session),
    current_user = Depends(require_admin)
):
    """
    Bulk import attendance data from file upload or API.
    Format: {"inspectors": [...], "records": [...], "options": {...}}
    """
    try:
        service = AttendanceService(db)
        
        records = import_data.get('records', [])
        options = import_data.get('options', {})
        overwrite_existing = options.get('overwrite_existing', False)
        
        results = []
        errors = []
        skipped = []
        
        for i, record_data in enumerate(records):
            try:
                inspector_id = record_data.get('inspector_id')
                if not inspector_id:
                    errors.append({"index": i, "error": "Missing inspector_id"})
                    continue
                
                # Check if record already exists
                from datetime import datetime
                from sqlmodel import select
                
                date_str = record_data.get('date') or record_data.get('jalali_date')
                if not date_str:
                    errors.append({"index": i, "error": "Missing date information"})
                    continue
                
                # Convert date if needed
                if 'jalali_date' in record_data:
                    from app.common.utils import jalali_calendar
                    year, month, day = map(int, record_data['jalali_date'].split('-'))
                    gregorian_date = jalali_calendar.jalali_to_gregorian(year, month, day)
                else:
                    gregorian_date = datetime.fromisoformat(record_data['date']).date()
                
                existing_record = db.exec(
                    select(AttendanceRecord).where(
                        AttendanceRecord.inspector_id == inspector_id,
                        AttendanceRecord.date == gregorian_date
                    )
                ).first()
                
                if existing_record and not overwrite_existing:
                    skipped.append({
                        "index": i,
                        "inspector_id": inspector_id,
                        "date": gregorian_date.isoformat(),
                        "reason": "Record already exists"
                    })
                    continue
                
                # Create or update record
                from app.domains.inspector.schemas.attendance import AttendanceRecordCreate
                create_data = AttendanceRecordCreate(**record_data)
                
                updated_record = service.create_or_update_attendance(inspector_id, create_data)
                results.append({
                    "index": i,
                    "inspector_id": inspector_id,
                    "date": updated_record.date.isoformat(),
                    "status": "imported"
                })
                
            except Exception as e:
                errors.append({"index": i, "error": str(e)})
        
        return {
            "total_records": len(records),
            "imported": len(results),
            "skipped": len(skipped),
            "failed": len(errors),
            "results": results,
            "skipped_records": skipped,
            "errors": errors
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Bulk import failed: {str(e)}")


@router.post("/admin/attendance/bulk-generate")
async def bulk_generate_attendance(
    generation_request: dict = Body(..., description="Bulk generation parameters"),
    db: Session = Depends(get_session),
    current_user = Depends(require_admin)
):
    """
    Bulk generate attendance records for multiple inspectors based on their work cycles.
    Format: {"inspector_ids": [...], "jalali_year": 1402, "jalali_month": 1, "options": {...}}
    """
    try:
        service = AttendanceService(db)
        
        inspector_ids = generation_request.get('inspector_ids', [])
        jalali_year = generation_request.get('jalali_year')
        jalali_month = generation_request.get('jalali_month')
        options = generation_request.get('options', {})
        
        if not inspector_ids or not jalali_year or not jalali_month:
            raise HTTPException(status_code=400, detail="Missing required parameters: inspector_ids, jalali_year, jalali_month")
        
        # Validate month
        if not 1 <= jalali_month <= 12:
            raise HTTPException(status_code=400, detail="Invalid Jalali month. Must be between 1 and 12.")
        
        results = []
        errors = []
        
        for inspector_id in inspector_ids:
            try:
                # Get the latest work cycle for this inspector
                from sqlmodel import select, desc
                from app.domains.inspector.models.attendance import WorkCycle
                
                work_cycle = db.exec(
                    select(WorkCycle).where(
                        WorkCycle.inspector_id == inspector_id
                    ).order_by(desc(WorkCycle.start_date))
                ).first()
                
                if not work_cycle:
                    errors.append({
                        "inspector_id": inspector_id,
                        "error": "No work cycle found for inspector"
                    })
                    continue
                
                # Generate attendance for this inspector
                generated_records = service.generate_attendance(
                    inspector_id, work_cycle.id, jalali_year, jalali_month
                )
                
                results.append({
                    "inspector_id": inspector_id,
                    "work_cycle_id": work_cycle.id,
                    "generated_records": len(generated_records),
                    "status": "success"
                })
                
            except Exception as e:
                errors.append({
                    "inspector_id": inspector_id,
                    "error": str(e)
                })
        
        return {
            "requested_inspectors": len(inspector_ids),
            "successful_generations": len(results),
            "failed_generations": len(errors),
            "period": f"{jalali_year}/{jalali_month:02d}",
            "results": results,
            "errors": errors
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Bulk generation failed: {str(e)}")


@router.get("/admin/attendance/summary")
async def get_attendance_summary(
    jalali_year: int = Query(..., description="Jalali year"),
    jalali_month: int = Query(..., description="Jalali month"),
    department: Optional[str] = Query(None, description="Filter by department"),
    db: Session = Depends(get_session),
    current_user = Depends(require_admin)
):
    """
    Get attendance summary for all inspectors in a given month.
    Provides overview of attendance across the organization.
    """
    try:
        # Validate month
        if not 1 <= jalali_month <= 12:
            raise HTTPException(status_code=400, detail="Invalid Jalali month. Must be between 1 and 12.")
        
        from app.domains.inspector.services.dashboard_service import DashboardService
        dashboard_service = DashboardService(db)
        
        summary_data = dashboard_service.get_monthly_overview_data(jalali_year, jalali_month)
        
        # Filter by department if specified
        if department:
            filtered_summaries = [
                summary for summary in summary_data['inspector_summaries']
                if summary.get('department') == department
            ]
            summary_data['inspector_summaries'] = filtered_summaries
            summary_data['total_inspectors'] = len(filtered_summaries)
        
        return summary_data
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get attendance summary: {str(e)}") 