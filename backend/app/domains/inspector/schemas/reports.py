# Reports Response Schemas
from typing import Dict, List, Optional, Any, Union
from pydantic import BaseModel, Field
from datetime import datetime, date


class ReportFilters(BaseModel):
    """Filters for report generation"""
    start_date: Optional[str] = Field(None, description="Start date in ISO format")
    end_date: Optional[str] = Field(None, description="End date in ISO format")
    jalali_start_date: Optional[str] = Field(None, description="Start date in Jalali format")
    jalali_end_date: Optional[str] = Field(None, description="End date in Jalali format")
    inspector_ids: Optional[List[int]] = Field(None, description="List of inspector IDs to include")
    departments: Optional[List[str]] = Field(None, description="List of departments to include")
    include_details: bool = Field(True, description="Whether to include detailed information")
    report_type: str = Field("summary", description="Type of report: summary, detailed, analytics")


class PeriodInfo(BaseModel):
    """Period information for reports"""
    start_date: str = Field(..., description="Start date in ISO format")
    end_date: str = Field(..., description="End date in ISO format")
    jalali_start_date: str = Field(..., description="Start date in Jalali format")
    jalali_end_date: str = Field(..., description="End date in Jalali format")
    total_days: int = Field(..., description="Total days in the period")


class InspectorSummaryReport(BaseModel):
    """Summary report data for an inspector"""
    inspector_id: int
    inspector_name: str
    employee_id: str
    department: Optional[str]
    working_days: int
    resting_days: int
    leave_days: int
    absent_days: int
    total_days: int
    total_regular_hours: float
    total_overtime_hours: float
    attendance_rate: float


class TotalStats(BaseModel):
    """Total statistics across all inspectors"""
    total_working_days: int
    total_resting_days: int
    total_leave_days: int
    total_absent_days: int
    total_regular_hours: float
    total_overtime_hours: float


class SummaryReportData(BaseModel):
    """Summary report data structure"""
    inspector_summaries: List[InspectorSummaryReport]
    total_stats: TotalStats
    period_info: PeriodInfo


class DetailedAttendanceRecord(BaseModel):
    """Detailed attendance record for reports"""
    date: str
    jalali_date: str
    inspector_id: int
    inspector_name: str
    employee_id: str
    department: Optional[str]
    status: str
    regular_hours: float
    overtime_hours: float
    night_shift_hours: float
    on_call_hours: float
    is_override: bool
    override_reason: Optional[str]
    notes: Optional[str]
    created_at: str
    updated_at: str


class DetailedReportData(BaseModel):
    """Detailed report data structure"""
    detailed_records: List[DetailedAttendanceRecord]
    total_records: int
    period_info: PeriodInfo


class DepartmentAnalysis(BaseModel):
    """Department-wise analysis data"""
    working_days: int
    total_days: int
    total_overtime: float
    inspectors: int
    attendance_rate: float


class AnalyticsReportData(BaseModel):
    """Analytics report data structure"""
    overview: Dict[str, Any]
    department_analysis: Dict[str, DepartmentAnalysis]
    period_info: PeriodInfo


class AttendanceReportResponse(BaseModel):
    """Response schema for attendance reports"""
    report_id: str = Field(..., description="Unique report identifier")
    generated_at: str = Field(..., description="Report generation timestamp")
    filters: ReportFilters = Field(..., description="Applied filters")
    period: PeriodInfo = Field(..., description="Report period information")
    report_type: str = Field(..., description="Type of report generated")
    data: Union[SummaryReportData, DetailedReportData, AnalyticsReportData] = Field(..., description="Report data")


class ExportRequest(BaseModel):
    """Request schema for data export"""
    format: str = Field(..., description="Export format: csv, excel, pdf, json")
    filters: ReportFilters = Field(..., description="Filters to apply")


class ExportResponse(BaseModel):
    """Response schema for export operations"""
    export_id: str = Field(..., description="Unique export identifier")
    format: str = Field(..., description="Export format")
    generated_at: str = Field(..., description="Export generation timestamp")
    file_size: int = Field(..., description="File size in bytes")
    download_url: Optional[str] = Field(None, description="Download URL if applicable")
    expires_at: Optional[str] = Field(None, description="URL expiration time")


class BulkExportRequest(BaseModel):
    """Request schema for bulk data export"""
    export_format: str = Field(..., description="Export format: csv, excel, pdf, json")
    filters: ReportFilters = Field(..., description="Filters to apply")
    include_summary: bool = Field(True, description="Include summary data")
    include_details: bool = Field(False, description="Include detailed records")
    include_analytics: bool = Field(False, description="Include analytics data")


class ReportTemplateResponse(BaseModel):
    """Response schema for report templates"""
    template_id: str
    template_name: str
    description: str
    default_filters: ReportFilters
    supported_formats: List[str]
    created_at: str
    updated_at: str


class ReportHistoryResponse(BaseModel):
    """Response schema for report generation history"""
    reports: List[Dict[str, Any]]
    total_reports: int
    page: int
    per_page: int
    total_pages: int


class ExportStatusResponse(BaseModel):
    """Response schema for export status"""
    export_id: str
    status: str  # pending, processing, completed, failed
    progress_percentage: Optional[int] = None
    estimated_completion: Optional[str] = None
    error_message: Optional[str] = None
    download_url: Optional[str] = None
    file_size: Optional[int] = None


class AvailableFormatsResponse(BaseModel):
    """Response schema for available export formats"""
    formats: List[str] = Field(..., description="List of supported export formats")
    format_descriptions: Dict[str, str] = Field(..., description="Description of each format")
    format_capabilities: Dict[str, List[str]] = Field(..., description="Capabilities of each format")


class ReportMetricsResponse(BaseModel):
    """Response schema for report generation metrics"""
    total_reports_generated: int
    reports_by_format: Dict[str, int]
    reports_by_type: Dict[str, int]
    average_generation_time: float
    most_popular_filters: Dict[str, Any]
    last_30_days_activity: List[Dict[str, Any]]