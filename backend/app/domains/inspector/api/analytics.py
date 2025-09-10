# Analytics API Routes for Attendance Analysis and Insights
from fastapi import APIRouter, Depends, HTTPException, Query
from typing import Optional, List
from sqlmodel import Session
from app.database import get_session
from app.domains.auth.dependencies import get_current_user, require_admin
from app.domains.inspector.services.analytics_service import AnalyticsService
from app.domains.inspector.schemas.analytics import (
    AttendanceOverviewResponse,
    AttendanceTrendsResponse,
    PerformanceMetricsResponse,
    AutomatedInsightsResponse
)

router = APIRouter()


@router.get("/analytics/attendance/overview", response_model=AttendanceOverviewResponse)
async def get_attendance_overview(
    timeframe: str = Query("current_month", description="Time period: current_month, last_30_days, current_week"),
    db: Session = Depends(get_session),
    current_user = Depends(require_admin)
):
    """
    Get comprehensive attendance overview analytics.
    Provides status distribution, rates, and key metrics.
    """
    try:
        if timeframe not in ["current_month", "last_30_days", "current_week"]:
            raise HTTPException(status_code=400, detail="Invalid timeframe. Use: current_month, last_30_days, current_week")
        
        service = AnalyticsService(db)
        overview_data = service.get_attendance_overview(timeframe)
        return AttendanceOverviewResponse(**overview_data)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to retrieve attendance overview: {str(e)}")


@router.get("/analytics/attendance/trends", response_model=AttendanceTrendsResponse)
async def get_attendance_trends(
    jalali_year: int = Query(..., description="Jalali year for trend analysis"),
    jalali_month: int = Query(..., description="Jalali month (1-12) for trend analysis"),
    db: Session = Depends(get_session),
    current_user = Depends(require_admin)
):
    """
    Calculate attendance trends for a specific Jalali month.
    Compares current month with previous month and provides insights.
    """
    try:
        # Validate month
        if not 1 <= jalali_month <= 12:
            raise HTTPException(status_code=400, detail="Invalid Jalali month. Must be between 1 and 12.")
        
        service = AnalyticsService(db)
        trends_data = service.calculate_attendance_trends(jalali_year, jalali_month)
        return AttendanceTrendsResponse(**trends_data)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to calculate attendance trends: {str(e)}")


@router.get("/analytics/attendance/performance", response_model=PerformanceMetricsResponse)
async def get_performance_metrics(
    inspector_ids: Optional[List[int]] = Query(None, description="Specific inspector IDs to analyze"),
    timeframe: str = Query("current_month", description="Analysis period: current_month, last_30_days"),
    db: Session = Depends(get_session),
    current_user = Depends(require_admin)
):
    """
    Get performance metrics for inspectors.
    Includes attendance rates, punctuality, and consistency scores.
    """
    try:
        if timeframe not in ["current_month", "last_30_days"]:
            raise HTTPException(status_code=400, detail="Invalid timeframe. Use: current_month, last_30_days")
        
        service = AnalyticsService(db)
        performance_data = service.get_inspector_performance_metrics(inspector_ids, timeframe)
        return PerformanceMetricsResponse(**performance_data)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to retrieve performance metrics: {str(e)}")


@router.get("/analytics/attendance/insights", response_model=AutomatedInsightsResponse)
async def get_automated_insights(
    timeframe: str = Query("current_month", description="Analysis period: current_month, last_30_days"),
    db: Session = Depends(get_session),
    current_user = Depends(require_admin)
):
    """
    Generate AI-like insights and recommendations based on attendance patterns.
    Provides actionable recommendations and priority alerts.
    """
    try:
        if timeframe not in ["current_month", "last_30_days"]:
            raise HTTPException(status_code=400, detail="Invalid timeframe. Use: current_month, last_30_days")
        
        service = AnalyticsService(db)
        insights_data = service.generate_automated_insights(timeframe)
        return AutomatedInsightsResponse(**insights_data)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate insights: {str(e)}")


@router.get("/analytics/attendance/comparison")
async def get_period_comparison(
    jalali_year_1: int = Query(..., description="First period Jalali year"),
    jalali_month_1: int = Query(..., description="First period Jalali month"),
    jalali_year_2: int = Query(..., description="Second period Jalali year"),
    jalali_month_2: int = Query(..., description="Second period Jalali month"),
    db: Session = Depends(get_session),
    current_user = Depends(require_admin)
):
    """
    Compare attendance data between two Jalali months.
    Useful for year-over-year or custom period comparisons.
    """
    try:
        # Validate months
        if not (1 <= jalali_month_1 <= 12 and 1 <= jalali_month_2 <= 12):
            raise HTTPException(status_code=400, detail="Invalid Jalali months. Must be between 1 and 12.")
        
        service = AnalyticsService(db)
        
        # Get data for both periods
        period_1_data = service._get_month_attendance_data(jalali_year_1, jalali_month_1)
        period_2_data = service._get_month_attendance_data(jalali_year_2, jalali_month_2)
        
        # Calculate comparison trends
        attendance_trend = service._calculate_trend(
            period_1_data.get('attendance_rate', 0),
            period_2_data.get('attendance_rate', 0)
        )
        
        overtime_trend = service._calculate_trend(
            period_1_data.get('total_overtime_hours', 0),
            period_2_data.get('total_overtime_hours', 0)
        )
        
        return {
            "period_1": {
                "year": jalali_year_1,
                "month": jalali_month_1,
                "data": period_1_data
            },
            "period_2": {
                "year": jalali_year_2,
                "month": jalali_month_2,
                "data": period_2_data
            },
            "comparison": {
                "attendance_rate_trend": attendance_trend,
                "overtime_trend": overtime_trend
            }
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to compare periods: {str(e)}")


@router.get("/analytics/attendance/department-performance")
async def get_department_performance(
    timeframe: str = Query("current_month", description="Analysis period"),
    db: Session = Depends(get_session),
    current_user = Depends(require_admin)
):
    """
    Get performance analytics grouped by department.
    Shows which departments have better attendance patterns.
    """
    try:
        from datetime import date, timedelta
        from sqlmodel import select, text
        from app.domains.inspector.models.inspector import Inspector
        from app.domains.inspector.models.attendance import AttendanceRecord
        from app.domains.inspector.models.enums import AttendanceStatus
        from app.common.utils import jalali_calendar
        
        # Determine date range
        if timeframe == "current_month":
            jalali_today = jalali_calendar.gregorian_to_jalali_str(date.today())
            jalali_year, jalali_month, _ = map(int, jalali_today.split('-'))
            start_date = jalali_calendar.jalali_to_gregorian(jalali_year, jalali_month, 1)
            days_in_month = jalali_calendar.get_jalali_month_days(jalali_year, jalali_month)
            end_date = jalali_calendar.jalali_to_gregorian(jalali_year, jalali_month, days_in_month)
        else:  # last_30_days
            end_date = date.today()
            start_date = end_date - timedelta(days=30)
        
        # Get department performance using SQL
        query = text("""
            SELECT 
                i.department,
                COUNT(DISTINCT i.id) as total_inspectors,
                COUNT(ar.id) as total_records,
                COUNT(CASE WHEN ar.status = 'WORKING' THEN 1 END) as working_records,
                SUM(ar.regular_hours) as total_regular_hours,
                SUM(ar.overtime_hours) as total_overtime_hours,
                AVG(CASE WHEN ar.status = 'WORKING' THEN ar.regular_hours END) as avg_daily_hours
            FROM inspectors i
            LEFT JOIN attendancerecord ar ON i.id = ar.inspector_id 
                AND ar.date >= :start_date AND ar.date <= :end_date
            WHERE i.active = 1 AND i.attendance_tracking_enabled = 1
            GROUP BY i.department
            ORDER BY (COUNT(CASE WHEN ar.status = 'WORKING' THEN 1 END) * 1.0 / COUNT(ar.id)) DESC
        """)
        
        result = db.exec(query, {"start_date": start_date, "end_date": end_date}).all()
        
        department_performance = []
        for row in result:
            dept_name = row.department or "Unassigned"
            attendance_rate = (row.working_records / max(row.total_records, 1)) * 100 if row.total_records > 0 else 0
            
            department_performance.append({
                "department": dept_name,
                "total_inspectors": row.total_inspectors,
                "total_records": row.total_records,
                "working_records": row.working_records,
                "attendance_rate": round(attendance_rate, 1),
                "total_regular_hours": row.total_regular_hours or 0,
                "total_overtime_hours": row.total_overtime_hours or 0,
                "average_daily_hours": round(row.avg_daily_hours or 0, 1)
            })
        
        return {
            "timeframe": timeframe,
            "period": {
                "start_date": start_date.isoformat(),
                "end_date": end_date.isoformat()
            },
            "department_performance": department_performance,
            "total_departments": len(department_performance)
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to retrieve department performance: {str(e)}")


@router.get("/analytics/attendance/weekly-patterns")
async def get_weekly_patterns(
    weeks_back: int = Query(4, ge=1, le=12, description="Number of weeks to analyze"),
    db: Session = Depends(get_session),
    current_user = Depends(require_admin)
):
    """
    Analyze weekly attendance patterns.
    Shows which days of the week have better/worse attendance.
    """
    try:
        from datetime import date, timedelta
        from sqlmodel import text
        
        end_date = date.today()
        start_date = end_date - timedelta(weeks=weeks_back)
        
        # Get weekly patterns
        query = text("""
            SELECT 
                strftime('%w', ar.date) as day_of_week,
                COUNT(ar.id) as total_records,
                COUNT(CASE WHEN ar.status = 'WORKING' THEN 1 END) as working_records,
                AVG(ar.regular_hours) as avg_hours,
                SUM(ar.overtime_hours) as total_overtime
            FROM attendancerecord ar
            WHERE ar.date >= :start_date AND ar.date <= :end_date
            GROUP BY strftime('%w', ar.date)
            ORDER BY day_of_week
        """)
        
        result = db.exec(query, {"start_date": start_date, "end_date": end_date}).all()
        
        # Map day numbers to names (Sunday = 0)
        day_names = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]
        
        weekly_patterns = []
        for row in result:
            day_num = int(row.day_of_week)
            attendance_rate = (row.working_records / max(row.total_records, 1)) * 100 if row.total_records > 0 else 0
            
            weekly_patterns.append({
                "day_of_week": day_num,
                "day_name": day_names[day_num],
                "total_records": row.total_records,
                "working_records": row.working_records,
                "attendance_rate": round(attendance_rate, 1),
                "average_hours": round(row.avg_hours or 0, 1),
                "total_overtime": row.total_overtime or 0
            })
        
        return {
            "analysis_period": {
                "start_date": start_date.isoformat(),
                "end_date": end_date.isoformat(),
                "weeks_analyzed": weeks_back
            },
            "weekly_patterns": weekly_patterns,
            "insights": [
                f"Best attendance day: {max(weekly_patterns, key=lambda x: x['attendance_rate'])['day_name']}" if weekly_patterns else "No data available",
                f"Lowest attendance day: {min(weekly_patterns, key=lambda x: x['attendance_rate'])['day_name']}" if weekly_patterns else "No data available"
            ]
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to analyze weekly patterns: {str(e)}")


@router.get("/analytics/attendance/overtime-analysis")
async def get_overtime_analysis(
    timeframe: str = Query("current_month", description="Analysis period"),
    db: Session = Depends(get_session),
    current_user = Depends(require_admin)
):
    """
    Analyze overtime patterns and trends.
    Identifies inspectors and departments with high overtime.
    """
    try:
        from datetime import date, timedelta
        from sqlmodel import text
        from app.common.utils import jalali_calendar
        
        # Determine date range
        if timeframe == "current_month":
            jalali_today = jalali_calendar.gregorian_to_jalali_str(date.today())
            jalali_year, jalali_month, _ = map(int, jalali_today.split('-'))
            start_date = jalali_calendar.jalali_to_gregorian(jalali_year, jalali_month, 1)
            days_in_month = jalali_calendar.get_jalali_month_days(jalali_year, jalali_month)
            end_date = jalali_calendar.jalali_to_gregorian(jalali_year, jalali_month, days_in_month)
        else:  # last_30_days
            end_date = date.today()
            start_date = end_date - timedelta(days=30)
        
        # Get overtime analysis
        query = text("""
            SELECT 
                i.id as inspector_id,
                i.first_name || ' ' || i.last_name as inspector_name,
                i.employee_id,
                i.department,
                SUM(ar.overtime_hours) as total_overtime,
                COUNT(CASE WHEN ar.overtime_hours > 0 THEN 1 END) as days_with_overtime,
                COUNT(ar.id) as total_working_days,
                AVG(ar.overtime_hours) as avg_overtime_per_day,
                MAX(ar.overtime_hours) as max_single_day_overtime
            FROM inspectors i
            INNER JOIN attendancerecord ar ON i.id = ar.inspector_id
            WHERE ar.date >= :start_date AND ar.date <= :end_date
                AND ar.overtime_hours > 0
            GROUP BY i.id, i.first_name, i.last_name, i.employee_id, i.department
            ORDER BY total_overtime DESC
        """)
        
        result = db.exec(query, {"start_date": start_date, "end_date": end_date}).all()
        
        inspector_overtime = []
        for row in result:
            overtime_percentage = (row.days_with_overtime / max(row.total_working_days, 1)) * 100
            
            inspector_overtime.append({
                "inspector_id": row.inspector_id,
                "inspector_name": row.inspector_name,
                "employee_id": row.employee_id,
                "department": row.department,
                "total_overtime_hours": round(row.total_overtime, 1),
                "days_with_overtime": row.days_with_overtime,
                "total_working_days": row.total_working_days,
                "overtime_percentage": round(overtime_percentage, 1),
                "average_overtime_per_day": round(row.avg_overtime_per_day, 1),
                "max_single_day_overtime": round(row.max_single_day_overtime, 1)
            })
        
        # Department overtime summary
        dept_query = text("""
            SELECT 
                i.department,
                SUM(ar.overtime_hours) as total_overtime,
                COUNT(DISTINCT i.id) as inspectors_with_overtime,
                AVG(ar.overtime_hours) as avg_overtime
            FROM inspectors i
            INNER JOIN attendancerecord ar ON i.id = ar.inspector_id
            WHERE ar.date >= :start_date AND ar.date <= :end_date
                AND ar.overtime_hours > 0
            GROUP BY i.department
            ORDER BY total_overtime DESC
        """)
        
        dept_result = db.exec(dept_query, {"start_date": start_date, "end_date": end_date}).all()
        
        department_overtime = []
        for row in dept_result:
            department_overtime.append({
                "department": row.department or "Unassigned",
                "total_overtime_hours": round(row.total_overtime, 1),
                "inspectors_with_overtime": row.inspectors_with_overtime,
                "average_overtime_hours": round(row.avg_overtime, 1)
            })
        
        return {
            "timeframe": timeframe,
            "period": {
                "start_date": start_date.isoformat(),
                "end_date": end_date.isoformat()
            },
            "inspector_overtime": inspector_overtime,
            "department_overtime": department_overtime,
            "summary": {
                "total_overtime_hours": sum(row["total_overtime_hours"] for row in inspector_overtime),
                "inspectors_with_overtime": len(inspector_overtime),
                "highest_overtime_inspector": inspector_overtime[0] if inspector_overtime else None
            }
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to analyze overtime: {str(e)}")