# Analytics Response Schemas
from typing import Dict, List, Optional, Any
from pydantic import BaseModel, Field
from datetime import datetime, date


class AttendanceOverviewResponse(BaseModel):
    """Response schema for attendance overview analytics"""
    period: str = Field(..., description="Time period description")
    start_date: str = Field(..., description="Start date in ISO format")
    end_date: str = Field(..., description="End date in ISO format")
    total_inspectors: int = Field(..., description="Total inspectors with attendance tracking")
    total_records: int = Field(..., description="Total attendance records")
    status_distribution: Dict[str, int] = Field(..., description="Distribution by attendance status")
    attendance_rate: float = Field(..., description="Overall attendance rate percentage")
    total_working_hours: float = Field(..., description="Total working hours")
    total_overtime_hours: float = Field(..., description="Total overtime hours")
    average_daily_attendance: float = Field(..., description="Average daily attendance count")


class TrendData(BaseModel):
    """Trend data for comparisons"""
    direction: str = Field(..., description="Trend direction: increasing, decreasing, stable, no_data")
    percentage_change: float = Field(..., description="Percentage change from previous period")
    absolute_change: float = Field(..., description="Absolute change from previous period")


class AttendanceTrendsResponse(BaseModel):
    """Response schema for attendance trends analysis"""
    current_month: Dict[str, Any] = Field(..., description="Current month data")
    previous_month: Dict[str, Any] = Field(..., description="Previous month data")
    trends: Dict[str, TrendData] = Field(..., description="Trend comparisons")
    daily_trends: List[Dict[str, Any]] = Field(..., description="Daily trends within the month")
    insights: List[str] = Field(..., description="Generated insights from trend analysis")


class InspectorPerformance(BaseModel):
    """Performance metrics for an individual inspector"""
    inspector_id: int
    inspector_name: str
    employee_id: str
    department: Optional[str]
    attendance_rate: float
    working_days: int
    total_days: int
    total_regular_hours: float
    total_overtime_hours: float
    average_daily_hours: float
    leave_days: int
    absent_days: int
    punctuality_score: float
    consistency_score: float


class PerformanceMetricsResponse(BaseModel):
    """Response schema for inspector performance metrics"""
    timeframe: str = Field(..., description="Analysis timeframe")
    total_inspectors: int = Field(..., description="Number of inspectors analyzed")
    performance_metrics: List[InspectorPerformance] = Field(..., description="Performance data for each inspector")
    top_performers: List[InspectorPerformance] = Field(..., description="Top performing inspectors")
    average_attendance_rate: float = Field(..., description="Average attendance rate across all inspectors")
    median_attendance_rate: float = Field(..., description="Median attendance rate")


class AlertItem(BaseModel):
    """Individual alert item"""
    type: str = Field(..., description="Alert type: warning, attention, info")
    message: str = Field(..., description="Alert message")
    priority: str = Field(..., description="Priority level: high, medium, low")


class InsightsSummary(BaseModel):
    """Summary of insights analysis"""
    total_insights: int
    total_recommendations: int
    high_priority_alerts: int
    overall_health_score: int


class AutomatedInsightsResponse(BaseModel):
    """Response schema for automated insights and recommendations"""
    generated_at: str = Field(..., description="Timestamp when insights were generated")
    timeframe: str = Field(..., description="Analysis timeframe")
    insights: List[str] = Field(..., description="Generated insights")
    recommendations: List[str] = Field(..., description="Actionable recommendations")
    alerts: List[AlertItem] = Field(..., description="Priority alerts")
    summary: InsightsSummary = Field(..., description="Summary statistics")


class DailyTrendData(BaseModel):
    """Daily trend data point"""
    day: int
    date: str
    jalali_date: str
    working_count: int
    total_count: int
    attendance_rate: float


class MonthlyData(BaseModel):
    """Monthly attendance data"""
    year: int
    month: int
    month_name: str
    total_records: int
    working_days: int
    attendance_rate: float
    total_overtime_hours: float


class ComparisonData(BaseModel):
    """Data comparison between periods"""
    current_period: Dict[str, Any]
    previous_period: Dict[str, Any]
    trends: Dict[str, TrendData]
    insights: List[str]