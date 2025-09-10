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

@router.get("", response_model=List[AttendanceRecordResponse])
def get_all_attendance(
    jalali_year: int = Query(...),
    jalali_month: int = Query(...),
    db: Session = Depends(get_session),
    current_user=Depends(require_admin)
):
    """
    Get all attendance records for a Jalali month (admin only).
    """
    service = AttendanceService(db)
    records = service.get_all_attendance(jalali_year, jalali_month)
    return [AttendanceRecordResponse.from_model(record) for record in records]

@router.post("", response_model=AttendanceRecordResponse)
def create_attendance(
    attendance_data: AttendanceRecordCreate,
    db: Session = Depends(get_session),
    current_user=Depends(require_admin)
):
    """
    Create an attendance record (admin only).
    """
    service = AttendanceService(db)
    record = service.create_attendance(attendance_data)
    return AttendanceRecordResponse.from_model(record)

@router.get("/{attendance_id}", response_model=AttendanceRecordResponse)
def get_attendance(
    attendance_id: int,
    db: Session = Depends(get_session),
    current_user=Depends(get_current_user)
):
    """
    Get a specific attendance record.
    """
    service = AttendanceService(db)
    record = service.get_attendance_by_id(attendance_id)
    if not record:
        raise HTTPException(status_code=404, detail="Attendance record not found.")
    return AttendanceRecordResponse.from_model(record)

@router.put("/{attendance_id}", response_model=AttendanceRecordResponse)
def update_attendance(
    attendance_id: int,
    attendance_data: AttendanceRecordUpdate,
    db: Session = Depends(get_session),
    current_user=Depends(require_admin)
):
    """
    Update an attendance record (admin only).
    """
    service = AttendanceService(db)
    record = service.update_attendance(attendance_id, attendance_data)
    return AttendanceRecordResponse.from_model(record)

@router.delete("/{attendance_id}")
def delete_attendance(
    attendance_id: int,
    db: Session = Depends(get_session),
    current_user=Depends(require_admin)
):
    """
    Delete an attendance record (admin only).
    """
    service = AttendanceService(db)
    service.delete_attendance(attendance_id)
    return {"message": "Attendance record deleted successfully"}

@router.get("/{inspector_id}", response_model=List[AttendanceRecordResponse])
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

@router.post("/bulk", response_model=dict)
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

@router.get("/summary", response_model=dict)
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

@router.get("/today", response_model=dict)
async def get_today_attendance(
    db: Session = Depends(get_session),
    current_user = Depends(require_admin)
):
    """
    Get today's attendance overview.
    """
    try:
        from app.domains.inspector.services.dashboard_service import DashboardService
        dashboard_service = DashboardService(db)
        
        today_data = dashboard_service.get_today_overview()
        return today_data
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get today's attendance: {str(e)}")

@router.get("/monthly-overview", response_model=dict)
async def get_monthly_overview(
    jalali_year: int = Query(...),
    jalali_month: int = Query(...),
    db: Session = Depends(get_session),
    current_user = Depends(require_admin)
):
    """
    Get monthly attendance overview.
    """
    try:
        from app.domains.inspector.services.dashboard_service import DashboardService
        dashboard_service = DashboardService(db)
        
        overview_data = dashboard_service.get_monthly_overview_data(jalali_year, jalali_month)
        return overview_data
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get monthly overview: {str(e)}")