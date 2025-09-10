# Dashboard Response Schemas
from typing import Dict, List, Optional, Any
from pydantic import BaseModel, Field
from datetime import datetime, date


class DashboardStatsResponse(BaseModel):
    """Response schema for dashboard statistics"""
    total_inspectors: int = Field(..., description="Total number of inspectors")
    active_inspectors: int = Field(..., description="Number of active inspectors")
    attendance_enabled_inspectors: int = Field(..., description="Inspectors with attendance tracking enabled")
    present_today: int = Field(..., description="Number of inspectors present today")
    attendance_rate_today: float = Field(..., description="Today's attendance rate percentage")
    monthly_stats: Dict[str, Any] = Field(..., description="Current month statistics")
    last_updated: str = Field(..., description="Last update timestamp")


class TodayAttendanceResponse(BaseModel):
    """Response schema for today's attendance summary"""
    date: str = Field(..., description="Date in ISO format")
    jalali_date: str = Field(..., description="Date in Jalali format")
    status_summary: Dict[str, int] = Field(..., description="Count by attendance status")
    total_recorded: int = Field(..., description="Total attendance records for today")
    total_expected: int = Field(..., description="Total inspectors expected to have records")
    missing_records: List[Dict[str, Any]] = Field(..., description="Inspectors without attendance records")
    inspector_details: List[Dict[str, Any]] = Field(..., description="Detailed attendance information")


class MonthlyOverviewResponse(BaseModel):
    """Response schema for monthly attendance overview"""
    year: int = Field(..., description="Jalali year")
    month: int = Field(..., description="Jalali month")
    month_name: str = Field(..., description="Jalali month name")
    days_in_month: int = Field(..., description="Number of days in the month")
    total_inspectors: int = Field(..., description="Total inspectors with attendance tracking")
    inspector_summaries: List[Dict[str, Any]] = Field(..., description="Summary for each inspector")
    overall_stats: Dict[str, Any] = Field(..., description="Overall monthly statistics")


class RecentActivityResponse(BaseModel):
    """Response schema for recent activities"""
    activities: List[Dict[str, Any]] = Field(..., description="List of recent attendance activities")
    total_activities: int = Field(..., description="Total number of activities")
    last_updated: str = Field(..., description="Last update timestamp")


class InspectorSummary(BaseModel):
    """Summary information for an inspector"""
    inspector_id: int
    inspector_name: str
    employee_id: str
    department: Optional[str]
    working_days: int
    resting_days: int
    leave_days: int
    absent_days: int
    total_days_recorded: int
    total_regular_hours: float
    total_overtime_hours: float
    attendance_rate: float


class StatusCount(BaseModel):
    """Attendance status count"""
    WORKING: int = 0
    RESTING: int = 0
    LEAVE: int = 0
    ABSENT: int = 0


class MonthlyStats(BaseModel):
    """Monthly statistics summary"""
    status_counts: StatusCount
    total_records: int
    working_percentage: float
    total_overtime_hours: float
    average_overtime_hours: float
    days_with_overtime: int