# Reports API Routes for Inspector Attendance Data Export and Report Generation
from fastapi import APIRouter, Depends, HTTPException, Query, Body, Response
from fastapi.responses import StreamingResponse
from typing import Optional, List, Dict, Any
from sqlmodel import Session
from io import BytesIO
import json
from app.database import get_session
from app.domains.auth.dependencies import get_current_active_inspector, require_permission
from app.domains.inspector.services.reporting_service import ReportingService
from app.domains.inspector.schemas.reports import (
    AttendanceReportResponse,
    ExportRequest,
    ExportResponse,
    BulkExportRequest,
    AvailableFormatsResponse,
    ReportFilters
)

router = APIRouter()


@router.get("", response_model=List[dict])
async def list_available_reports(
    db: Session = Depends(get_session),
    current_inspector = Depends(require_permission("admin", "manage"))
):
    """
    List all available inspector attendance reports.
    """
    try:
        reports = [
            {
                "report_id": "attendance_summary",
                "report_name": "Inspector Attendance Summary",
                "description": "Summary of inspector attendance for a specific period",
                "type": "summary"
            },
            {
                "report_id": "attendance_details",
                "report_name": "Detailed Inspector Attendance",
                "description": "Day-by-day attendance records with full details",
                "type": "detailed"
            },
            {
                "report_id": "attendance_analytics",
                "report_name": "Inspector Attendance Analytics",
                "description": "Comprehensive analytics with trends and insights",
                "type": "analytics"
            }
        ]
        return reports
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to list reports: {str(e)}")


@router.post("", response_model=AttendanceReportResponse)
async def generate_attendance_report(
    filters: ReportFilters,
    db: Session = Depends(get_session),
    current_inspector = Depends(require_permission("admin", "manage"))
):
    """
    Generate comprehensive inspector attendance report based on filters.
    Supports summary, detailed, and analytics report types.
    """
    try:
        service = ReportingService(db)
        report_data = service.generate_attendance_report(filters.dict())
        return AttendanceReportResponse(**report_data)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate attendance report: {str(e)}")


@router.get("/{report_id}")
async def get_specific_report(
    report_id: str,
    jalali_year: int = Query(...),
    jalali_month: int = Query(...),
    db: Session = Depends(get_session),
    current_inspector = Depends(require_permission("admin", "manage"))
):
    """
    Get a specific inspector attendance report by ID.
    """
    try:
        if not 1 <= jalali_month <= 12:
            raise HTTPException(status_code=400, detail="Invalid Jalali month. Must be between 1 and 12.")
        
        from app.common.utils import jalali_calendar
        start_date = jalali_calendar.jalali_to_gregorian(jalali_year, jalali_month, 1)
        days_in_month = jalali_calendar.get_jalali_month_days(jalali_year, jalali_month)
        end_date = jalali_calendar.jalali_to_gregorian(jalali_year, jalali_month, days_in_month)
        
        filters = {
            "start_date": start_date.isoformat(),
            "end_date": end_date.isoformat(),
            "jalali_start_date": f"{jalali_year}-{jalali_month:02d}-01",
            "jalali_end_date": f"{jalali_year}-{jalali_month:02d}-{days_in_month:02d}"
        }
        
        report_types = {
            "attendance_summary": "summary",
            "attendance_details": "detailed", 
            "attendance_analytics": "analytics"
        }
        
        if report_id not in report_types:
            raise HTTPException(status_code=404, detail="Report not found")
        
        filters["report_type"] = report_types[report_id]
        
        service = ReportingService(db)
        report_data = service.generate_attendance_report(filters)
        return report_data
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get report: {str(e)}")


@router.post("/export")
async def export_attendance_data(
    export_request: ExportRequest,
    db: Session = Depends(get_session),
    current_inspector = Depends(require_permission("admin", "manage"))
):
    """
    Export inspector attendance data in specified format (CSV, Excel, PDF, JSON).
    Returns file as downloadable response.
    """
    try:
        service = ReportingService(db)
        
        # Validate format
        supported_formats = service.get_export_formats()
        if export_request.format.lower() not in [f.lower() for f in supported_formats]:
            raise HTTPException(
                status_code=400, 
                detail=f"Unsupported format. Supported formats: {', '.join(supported_formats)}"
            )
        
        # Generate export data
        export_data = service.bulk_export_data(export_request.format, export_request.filters.dict())
        
        # Determine content type and filename
        format_mapping = {
            'csv': ('text/csv', 'inspector_attendance_report.csv'),
            'excel': ('application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'inspector_attendance_report.xlsx'),
            'pdf': ('application/pdf', 'inspector_attendance_report.pdf'),
            'json': ('application/json', 'inspector_attendance_report.json')
        }
        
        content_type, filename = format_mapping.get(export_request.format.lower(), ('application/octet-stream', 'report'))
        
        # Return file as streaming response
        return StreamingResponse(
            BytesIO(export_data),
            media_type=content_type,
            headers={"Content-Disposition": f"attachment; filename={filename}"}
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to export data: {str(e)}")


@router.post("/bulk-export")
async def bulk_export_attendance_data(
    bulk_request: BulkExportRequest,
    db: Session = Depends(get_session),
    current_inspector = Depends(require_permission("admin", "manage"))
):
    """
    Bulk export multiple inspector attendance report types in specified format.
    Combines summary, detailed, and analytics data as requested.
    """
    try:
        service = ReportingService(db)
        
        # Validate format
        supported_formats = service.get_export_formats()
        if bulk_request.export_format.lower() not in [f.lower() for f in supported_formats]:
            raise HTTPException(
                status_code=400, 
                detail=f"Unsupported format. Supported formats: {', '.join(supported_formats)}"
            )
        
        # Generate multiple reports based on request
        combined_data = {}
        
        if bulk_request.include_summary:
            filters = bulk_request.filters.dict()
            filters['report_type'] = 'summary'
            summary_report = service.generate_attendance_report(filters)
            combined_data['summary'] = summary_report
        
        if bulk_request.include_details:
            filters = bulk_request.filters.dict()
            filters['report_type'] = 'detailed'
            detailed_report = service.generate_attendance_report(filters)
            combined_data['detailed'] = detailed_report
        
        if bulk_request.include_analytics:
            filters = bulk_request.filters.dict()
            filters['report_type'] = 'analytics'
            analytics_report = service.generate_attendance_report(filters)
            combined_data['analytics'] = analytics_report
        
        # Export combined data
        if bulk_request.export_format.lower() == 'json':
            export_data = json.dumps(combined_data, indent=2, ensure_ascii=False, default=str).encode('utf-8')
            content_type = 'application/json'
            filename = 'bulk_inspector_attendance_report.json'
        else:
            # For other formats, export the most comprehensive report type requested
            primary_filters = bulk_request.filters.dict()
            if bulk_request.include_analytics:
                primary_filters['report_type'] = 'analytics'
            elif bulk_request.include_details:
                primary_filters['report_type'] = 'detailed'
            else:
                primary_filters['report_type'] = 'summary'
            
            export_data = service.bulk_export_data(bulk_request.export_format, primary_filters)
            
            format_mapping = {
                'csv': ('text/csv', 'bulk_inspector_attendance_report.csv'),
                'excel': ('application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'bulk_inspector_attendance_report.xlsx'),
                'pdf': ('application/pdf', 'bulk_inspector_attendance_report.pdf')
            }
            content_type, filename = format_mapping.get(bulk_request.export_format.lower(), ('application/octet-stream', 'bulk_report'))
        
        return StreamingResponse(
            BytesIO(export_data),
            media_type=content_type,
            headers={"Content-Disposition": f"attachment; filename={filename}"}
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to bulk export data: {str(e)}")


@router.get("/formats", response_model=AvailableFormatsResponse)
async def get_available_formats(
    db: Session = Depends(get_session),
    current_inspector = Depends(require_permission("admin", "manage"))
):
    """
    Get list of supported export formats and their capabilities.
    """
    try:
        service = ReportingService(db)
        formats = service.get_export_formats()
        
        format_descriptions = {
            'csv': 'Comma-separated values format, suitable for spreadsheet applications',
            'excel': 'Microsoft Excel format with formatting and multiple sheets',
            'pdf': 'Portable Document Format for professional reports',
            'json': 'JavaScript Object Notation for API integration'
        }
        
        format_capabilities = {
            'csv': ['tabular_data', 'lightweight', 'excel_compatible'],
            'excel': ['tabular_data', 'formatting', 'multiple_sheets', 'charts'],
            'pdf': ['formatted_reports', 'professional_layout', 'print_ready'],
            'json': ['structured_data', 'api_friendly', 'programmatic_access']
        }
        
        return AvailableFormatsResponse(
            formats=formats,
            format_descriptions=format_descriptions,
            format_capabilities=format_capabilities
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to retrieve available formats: {str(e)}")


@router.get("/templates")
async def get_report_templates(
    db: Session = Depends(get_session),
    current_inspector = Depends(require_permission("admin", "manage"))
):
    """
    Get predefined report templates for common inspector attendance use cases.
    """
    try:
        templates = [
            {
                "template_id": "monthly_inspector_summary",
                "template_name": "Monthly Inspector Attendance Summary",
                "description": "Summary of inspector attendance for a specific Jalali month",
                "default_filters": {
                    "report_type": "summary",
                    "include_details": True
                },
                "supported_formats": ["csv", "excel", "pdf"]
            },
            {
                "template_id": "detailed_inspector_records",
                "template_name": "Detailed Inspector Attendance Records",
                "description": "Day-by-day inspector attendance records with full details",
                "default_filters": {
                    "report_type": "detailed",
                    "include_details": True
                },
                "supported_formats": ["csv", "excel", "json"]
            },
            {
                "template_id": "inspector_analytics_insights",
                "template_name": "Inspector Analytics and Insights Report",
                "description": "Comprehensive analytics with trends and insights for inspectors",
                "default_filters": {
                    "report_type": "analytics",
                    "include_details": True
                },
                "supported_formats": ["excel", "pdf", "json"]
            },
            {
                "template_id": "inspector_performance_comparison",
                "template_name": "Inspector Performance Comparison",
                "description": "Compare attendance performance across inspectors",
                "default_filters": {
                    "report_type": "analytics",
                    "include_details": False
                },
                "supported_formats": ["excel", "pdf"]
            },
            {
                "template_id": "inspector_overtime_analysis",
                "template_name": "Inspector Overtime Analysis Report",
                "description": "Detailed analysis of inspector overtime patterns and costs",
                "default_filters": {
                    "report_type": "analytics",
                    "include_details": True
                },
                "supported_formats": ["excel", "pdf"]
            }
        ]
        
        return {
            "templates": templates,
            "total_templates": len(templates)
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to retrieve report templates: {str(e)}")


@router.post("/schedule")
async def schedule_recurring_report(
    schedule_data: dict = Body(...),
    db: Session = Depends(get_session),
    current_inspector = Depends(require_permission("admin", "manage"))
):
    """
    Schedule a recurring inspector attendance report.
    """
    try:
        # This would integrate with a job scheduler like Celery
        # For now, return a placeholder response
        return {
            "schedule_id": "schedule_001",
            "status": "scheduled",
            "message": "Recurring report scheduled successfully",
            "next_run": "2025-10-01T00:00:00Z"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to schedule report: {str(e)}")


@router.get("/scheduled")
async def get_scheduled_reports(
    db: Session = Depends(get_session),
    current_inspector = Depends(require_permission("admin", "manage"))
):
    """
    Get list of scheduled recurring inspector attendance reports.
    """
    try:
        # This would query scheduled jobs from the job scheduler
        # For now, return a placeholder response
        return {
            "scheduled_reports": [],
            "total_scheduled": 0
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get scheduled reports: {str(e)}")