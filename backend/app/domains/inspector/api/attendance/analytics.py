# Analytics API Routes for Inspector Attendance Analysis and Insights
from fastapi import APIRouter, Depends, HTTPException, Query
from typing import Optional, List
from sqlmodel import Session
from app.database import get_session
from app.domains.auth.dependencies import get_current_active_inspector, require_permission
from app.domains.inspector.services.analytics_service import AnalyticsService
from app.domains.inspector.schemas.analytics import (
    AttendanceOverviewResponse,
    AttendanceTrendsResponse,
    PerformanceMetricsResponse,
    AutomatedInsightsResponse
)

router = APIRouter()


@router.get("/overview", response_model=AttendanceOverviewResponse)
async def get_attendance_overview(
    timeframe: str = Query("current_month", description="Time period: current_month, last_30_days, current_week"),
    db: Session = Depends(get_session),
    current_inspector = Depends(require_permission("admin", "manage"))
):
    """
    Get comprehensive inspector attendance overview analytics.
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


@router.get("/trends", response_model=AttendanceTrendsResponse)
async def get_attendance_trends(
    jalali_year: int = Query(..., description="Jalali year for trend analysis"),
    jalali_month: int = Query(..., description="Jalali month (1-12) for trend analysis"),
    db: Session = Depends(get_session),
    current_inspector = Depends(require_permission("admin", "manage"))
):
    """
    Calculate inspector attendance trends for a specific Jalali month.
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


@router.get("/performance", response_model=PerformanceMetricsResponse)
async def get_performance_metrics(
    inspector_ids: Optional[List[int]] = Query(None, description="Specific inspector IDs to analyze"),
    timeframe: str = Query("current_month", description="Analysis period: current_month, last_30_days"),
    db: Session = Depends(get_session),
    current_inspector = Depends(require_permission("admin", "manage"))
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


@router.get("/insights", response_model=AutomatedInsightsResponse)
async def get_automated_insights(
    timeframe: str = Query("current_month", description="Analysis period: current_month, last_30_days"),
    db: Session = Depends(get_session),
    current_inspector = Depends(require_permission("admin", "manage"))
):
    """
    Generate AI-like insights and recommendations based on inspector attendance patterns.
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


@router.get("/comparison")
async def get_period_comparison(
    jalali_year_1: int = Query(..., description="First period Jalali year"),
    jalali_month_1: int = Query(..., description="First period Jalali month"),
    jalali_year_2: int = Query(..., description="Second period Jalali year"),
    jalali_month_2: int = Query(..., description="Second period Jalali month"),
    db: Session = Depends(get_session),
    current_inspector = Depends(require_permission("admin", "manage"))
):
    """
    Compare inspector attendance data between two Jalali months.
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


@router.get("/charts")
async def get_chart_data(
    chart_type: str = Query(..., description="Type of chart: weekly_trends, monthly_distribution, department_comparison"),
    timeframe: str = Query("current_month", description="Analysis period"),
    db: Session = Depends(get_session),
    current_inspector = Depends(require_permission("admin", "manage"))
):
    """
    Get chart data for inspector attendance analytics visualization.
    """
    try:
        service = AnalyticsService(db)
        
        if chart_type == "weekly_trends":
            return await _get_weekly_trends_chart(service, timeframe)
        elif chart_type == "monthly_distribution":
            return await _get_monthly_distribution_chart(service, timeframe)
        elif chart_type == "department_comparison":
            return await _get_department_comparison_chart(service, timeframe, db)
        else:
            raise HTTPException(status_code=400, detail="Invalid chart type")
            
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get chart data: {str(e)}")


@router.get("/kpis")
async def get_key_performance_indicators(
    timeframe: str = Query("current_month", description="Analysis period"),
    db: Session = Depends(get_session),
    current_inspector = Depends(require_permission("admin", "manage"))
):
    """
    Get key performance indicators for inspector attendance.
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
        
        # Calculate KPIs
        query = text("""
            SELECT 
                COUNT(DISTINCT i.id) as total_active_inspectors,
                COUNT(ar.id) as total_attendance_records,
                COUNT(CASE WHEN ar.status = 'WORKING' THEN 1 END) as working_records,
                AVG(ar.regular_hours) as avg_daily_hours,
                SUM(ar.overtime_hours) as total_overtime_hours,
                COUNT(CASE WHEN ar.overtime_hours > 0 THEN 1 END) as overtime_instances
            FROM inspectors i
            LEFT JOIN attendancerecord ar ON i.id = ar.inspector_id 
                AND ar.date >= :start_date AND ar.date <= :end_date
            WHERE i.active = 1 AND i.attendance_tracking_enabled = 1
        """)
        
        result = db.exec(query, {"start_date": start_date, "end_date": end_date}).first()
        
        if result:
            attendance_rate = (result.working_records / max(result.total_attendance_records, 1)) * 100
            overtime_rate = (result.overtime_instances / max(result.working_records, 1)) * 100
            
            return {
                "period": {
                    "start_date": start_date.isoformat(),
                    "end_date": end_date.isoformat(),
                    "timeframe": timeframe
                },
                "kpis": {
                    "total_active_inspectors": result.total_active_inspectors,
                    "overall_attendance_rate": round(attendance_rate, 1),
                    "average_daily_hours": round(result.avg_daily_hours or 0, 1),
                    "total_overtime_hours": round(result.total_overtime_hours or 0, 1),
                    "overtime_rate": round(overtime_rate, 1),
                    "total_working_days": result.working_records
                }
            }
        else:
            return {
                "period": {
                    "start_date": start_date.isoformat(),
                    "end_date": end_date.isoformat(),
                    "timeframe": timeframe
                },
                "kpis": {
                    "total_active_inspectors": 0,
                    "overall_attendance_rate": 0,
                    "average_daily_hours": 0,
                    "total_overtime_hours": 0,
                    "overtime_rate": 0,
                    "total_working_days": 0
                }
            }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get KPIs: {str(e)}")


# Helper functions for chart data
async def _get_weekly_trends_chart(service, timeframe):
    """Get data for weekly trends chart"""
    from datetime import date, timedelta
    from sqlmodel import text
    
    end_date = date.today()
    start_date = end_date - timedelta(weeks=4)
    
    # Implementation for weekly trends
    return {
        "chart_type": "weekly_trends",
        "data": [],
        "labels": ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
    }


async def _get_monthly_distribution_chart(service, timeframe):
    """Get data for monthly distribution chart"""
    return {
        "chart_type": "monthly_distribution",
        "data": [],
        "labels": []
    }


async def _get_department_comparison_chart(service, timeframe, db):
    """Get data for department comparison chart"""
    from datetime import date, timedelta
    from sqlmodel import text
    
    end_date = date.today()
    start_date = end_date - timedelta(days=30)
    
    query = text("""
        SELECT 
            i.department,
            COUNT(CASE WHEN ar.status = 'WORKING' THEN 1 END) as working_records,
            COUNT(ar.id) as total_records
        FROM inspectors i
        LEFT JOIN attendancerecord ar ON i.id = ar.inspector_id 
            AND ar.date >= :start_date AND ar.date <= :end_date
        WHERE i.active = 1 AND i.attendance_tracking_enabled = 1
        GROUP BY i.department
    """)
    
    result = db.exec(query, {"start_date": start_date, "end_date": end_date}).all()
    
    labels = []
    data = []
    
    for row in result:
        dept_name = row.department or "Unassigned"
        attendance_rate = (row.working_records / max(row.total_records, 1)) * 100
        labels.append(dept_name)
        data.append(round(attendance_rate, 1))
    
    return {
        "chart_type": "department_comparison",
        "data": data,
        "labels": labels
    }