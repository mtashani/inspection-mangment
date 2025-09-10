# Dashboard API Routes for Admin Panel
from fastapi import APIRouter, Depends, HTTPException, Query
from typing import Optional
from sqlmodel import Session
from app.database import get_session
from app.domains.auth.dependencies import get_current_user, require_admin
from app.domains.inspector.services.dashboard_service import DashboardService
from app.domains.inspector.schemas.dashboard import (
    DashboardStatsResponse,
    TodayAttendanceResponse,
    MonthlyOverviewResponse,
    RecentActivityResponse
)

router = APIRouter()


@router.get("/admin/dashboard/stats", response_model=DashboardStatsResponse)
async def get_dashboard_stats(
    db: Session = Depends(get_session),
    current_user = Depends(require_admin)
):
    """
    Get real-time dashboard statistics for admin panel.
    Requires admin privileges.
    """
    try:
        service = DashboardService(db)
        stats = service.get_real_time_stats()
        return DashboardStatsResponse(**stats)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to retrieve dashboard stats: {str(e)}")


@router.get("/admin/attendance/today", response_model=TodayAttendanceResponse)
async def get_today_attendance(
    db: Session = Depends(get_session),
    current_user = Depends(require_admin)
):
    """
    Get today's attendance summary across all inspectors.
    Includes present/absent counts and detailed breakdown.
    """
    try:
        service = DashboardService(db)
        attendance_data = service.get_today_attendance_summary()
        return TodayAttendanceResponse(**attendance_data)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to retrieve today's attendance: {str(e)}")


@router.get("/admin/attendance/monthly-overview", response_model=MonthlyOverviewResponse)
async def get_monthly_overview(
    jalali_year: int = Query(..., description="Jalali year"),
    jalali_month: int = Query(..., description="Jalali month (1-12)"),
    db: Session = Depends(get_session),
    current_user = Depends(require_admin)
):
    """
    Get monthly attendance overview for all inspectors.
    Uses Jalali calendar parameters as per system requirements.
    """
    try:
        # Validate month
        if not 1 <= jalali_month <= 12:
            raise HTTPException(status_code=400, detail="Invalid Jalali month. Must be between 1 and 12.")
        
        service = DashboardService(db)
        overview_data = service.get_monthly_overview_data(jalali_year, jalali_month)
        return MonthlyOverviewResponse(**overview_data)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to retrieve monthly overview: {str(e)}")


@router.get("/admin/dashboard/recent-activities", response_model=RecentActivityResponse)
async def get_recent_activities(
    limit: int = Query(10, ge=1, le=50, description="Number of recent activities to retrieve"),
    db: Session = Depends(get_session),
    current_user = Depends(require_admin)
):
    """
    Get recent attendance activities and changes.
    Shows recent overrides, new records, and modifications.
    """
    try:
        service = DashboardService(db)
        activities = service.get_recent_activities(limit)
        
        return RecentActivityResponse(
            activities=activities,
            total_activities=len(activities),
            last_updated=service.get_real_time_stats()["last_updated"]
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to retrieve recent activities: {str(e)}")


@router.get("/admin/dashboard/health-check")
async def dashboard_health_check(
    db: Session = Depends(get_session),
    current_user = Depends(require_admin)
):
    """
    Health check endpoint for dashboard services.
    Returns system status and basic connectivity information.
    """
    try:
        service = DashboardService(db)
        
        # Perform basic service checks
        stats = service.get_real_time_stats()
        
        return {
            "status": "healthy",
            "timestamp": stats["last_updated"],
            "services": {
                "dashboard_service": "operational",
                "database": "connected",
                "attendance_tracking": f"{stats['attendance_enabled_inspectors']} inspectors enabled"
            },
            "version": "1.0.0"
        }
    except Exception as e:
        return {
            "status": "unhealthy",
            "error": str(e),
            "timestamp": "unavailable",
            "services": {
                "dashboard_service": "error",
                "database": "unknown",
                "attendance_tracking": "unknown"
            }
        }


@router.get("/admin/dashboard/quick-stats")
async def get_quick_stats(
    db: Session = Depends(get_session),
    current_user = Depends(require_admin)
):
    """
    Get quick statistics for dashboard widgets.
    Lightweight endpoint for frequent polling.
    """
    try:
        service = DashboardService(db)
        stats = service.get_real_time_stats()
        
        # Return only essential quick stats
        return {
            "present_today": stats["present_today"],
            "attendance_rate_today": stats["attendance_rate_today"],
            "active_inspectors": stats["active_inspectors"],
            "last_updated": stats["last_updated"]
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to retrieve quick stats: {str(e)}")


# Additional utility endpoints for the dashboard

@router.get("/admin/dashboard/inspector-status/{inspector_id}")
async def get_inspector_current_status(
    inspector_id: int,
    db: Session = Depends(get_session),
    current_user = Depends(require_admin)
):
    """
    Get current status of a specific inspector for dashboard display.
    """
    try:
        from datetime import date
        from sqlmodel import select
        from app.domains.inspector.models.attendance import AttendanceRecord
        from app.domains.inspector.models.inspector import Inspector
        
        # Get inspector
        inspector = db.get(Inspector, inspector_id)
        if not inspector:
            raise HTTPException(status_code=404, detail="Inspector not found")
        
        # Get today's attendance
        today = date.today()
        today_record = db.exec(
            select(AttendanceRecord).where(
                AttendanceRecord.inspector_id == inspector_id,
                AttendanceRecord.date == today
            )
        ).first()
        
        return {
            "inspector_id": inspector_id,
            "inspector_name": f"{inspector.first_name} {inspector.last_name}",
            "employee_id": inspector.employee_id,
            "department": inspector.department,
            "attendance_enabled": inspector.attendance_tracking_enabled,
            "today_status": today_record.status.value if today_record else "NOT_RECORDED",
            "today_hours": today_record.regular_hours if today_record else 0,
            "today_overtime": today_record.overtime_hours if today_record else 0,
            "is_override": today_record.is_override if today_record else False
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to retrieve inspector status: {str(e)}")


@router.get("/admin/dashboard/department-summary")
async def get_department_summary(
    db: Session = Depends(get_session),
    current_user = Depends(require_admin)
):
    """
    Get attendance summary grouped by department for dashboard overview.
    """
    try:
        from datetime import date
        from sqlmodel import select, text
        from app.domains.inspector.models.inspector import Inspector
        from app.domains.inspector.models.attendance import AttendanceRecord
        
        today = date.today()
        
        # Get department summary using raw SQL for efficiency
        query = text("""
            SELECT 
                i.department,
                COUNT(i.id) as total_inspectors,
                COUNT(CASE WHEN i.attendance_tracking_enabled = 1 THEN 1 END) as tracking_enabled,
                COUNT(CASE WHEN ar.status = 'WORKING' THEN 1 END) as present_today,
                COUNT(CASE WHEN ar.id IS NOT NULL THEN 1 END) as recorded_today
            FROM inspectors i
            LEFT JOIN attendancerecord ar ON i.id = ar.inspector_id AND ar.date = :today
            WHERE i.active = 1
            GROUP BY i.department
            ORDER BY i.department
        """)
        
        result = db.exec(query, {"today": today}).all()
        
        department_summaries = []
        for row in result:
            dept_name = row.department or "Unassigned"
            attendance_rate = (row.present_today / max(row.tracking_enabled, 1)) * 100 if row.tracking_enabled > 0 else 0
            
            department_summaries.append({
                "department": dept_name,
                "total_inspectors": row.total_inspectors,
                "tracking_enabled": row.tracking_enabled,
                "present_today": row.present_today,
                "recorded_today": row.recorded_today,
                "attendance_rate": round(attendance_rate, 1)
            })
        
        return {
            "date": today.isoformat(),
            "department_summaries": department_summaries,
            "total_departments": len(department_summaries)
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to retrieve department summary: {str(e)}")