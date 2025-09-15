# Reports API Routes for Data Export and Report Generation
from fastapi import APIRouter, Depends, HTTPException, Query, Body, Response
from fastapi.responses import StreamingResponse
from typing import Optional, List, Dict, Any
from sqlmodel import Session
from io import BytesIO
import json
from app.database import get_session
from app.domains.auth.dependencies import get_current_active_inspector, require_admin_access
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


@router.post("/reports/attendance", response_model=AttendanceReportResponse)
async def generate_attendance_report(
    filters: ReportFilters,
    db: Session = Depends(get_session),
    current_inspector = Depends(require_admin_access)
):
    """
    Generate comprehensive attendance report based on filters.
    Supports summary, detailed, and analytics report types.
    """
    try:
        service = ReportingService(db)
        report_data = service.generate_attendance_report(filters.dict())
        return AttendanceReportResponse(**report_data)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate attendance report: {str(e)}")


@router.post("/reports/export")
async def export_data(
    export_request: ExportRequest,
    db: Session = Depends(get_session),
    current_inspector = Depends(require_admin_access)
):
    """
    Export attendance data in specified format (CSV, Excel, PDF, JSON).
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
            'csv': ('text/csv', 'attendance_report.csv'),
            'excel': ('application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'attendance_report.xlsx'),
            'pdf': ('application/pdf', 'attendance_report.pdf'),
            'json': ('application/json', 'attendance_report.json')
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


@router.post("/reports/bulk-export")
async def bulk_export_data(
    bulk_request: BulkExportRequest,
    db: Session = Depends(get_session),
    current_inspector = Depends(require_admin_access)
):
    """
    Bulk export multiple report types in specified format.
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
            filename = 'bulk_attendance_report.json'
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
                'csv': ('text/csv', 'bulk_attendance_report.csv'),
                'excel': ('application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'bulk_attendance_report.xlsx'),
                'pdf': ('application/pdf', 'bulk_attendance_report.pdf')
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


@router.get("/reports/formats", response_model=AvailableFormatsResponse)
async def get_available_formats(
    db: Session = Depends(get_session),
    current_inspector = Depends(require_admin_access)
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


@router.get("/reports/templates")
async def get_report_templates(
    db: Session = Depends(get_session),
    current_inspector = Depends(require_admin_access)
):
    """
    Get predefined report templates for common use cases.
    """
    try:
        templates = [
            {
                "template_id": "monthly_summary",
                "template_name": "Monthly Attendance Summary",
                "description": "Summary of attendance for a specific Jalali month",
                "default_filters": {
                    "report_type": "summary",
                    "include_details": True
                },
                "supported_formats": ["csv", "excel", "pdf"]
            },
            {
                "template_id": "detailed_records",
                "template_name": "Detailed Attendance Records",
                "description": "Day-by-day attendance records with full details",
                "default_filters": {
                    "report_type": "detailed",
                    "include_details": True
                },
                "supported_formats": ["csv", "excel", "json"]
            },
            {
                "template_id": "analytics_insights",
                "template_name": "Analytics and Insights Report",
                "description": "Comprehensive analytics with trends and insights",
                "default_filters": {
                    "report_type": "analytics",
                    "include_details": True
                },
                "supported_formats": ["excel", "pdf", "json"]
            },
            {
                "template_id": "department_comparison",
                "template_name": "Department Performance Comparison",
                "description": "Compare attendance performance across departments",
                "default_filters": {
                    "report_type": "analytics",
                    "include_details": False
                },
                "supported_formats": ["excel", "pdf"]
            },
            {
                "template_id": "overtime_analysis",
                "template_name": "Overtime Analysis Report",
                "description": "Detailed analysis of overtime patterns and costs",
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


@router.post("/reports/quick-export/{template_id}")
async def quick_export_template(
    template_id: str,
    export_format: str = Query(..., description="Export format"),
    jalali_year: Optional[int] = Query(None, description="Jalali year filter"),
    jalali_month: Optional[int] = Query(None, description="Jalali month filter"),
    db: Session = Depends(get_session),
    current_inspector = Depends(require_admin_access)
):
    """
    Quick export using predefined templates with optional date filters.
    """
    try:
        service = ReportingService(db)
        
        # Template configurations
        template_configs = {
            "monthly_summary": {
                "report_type": "summary",
                "include_details": True
            },
            "detailed_records": {
                "report_type": "detailed",
                "include_details": True
            },
            "analytics_insights": {
                "report_type": "analytics",
                "include_details": True
            },
            "department_comparison": {
                "report_type": "analytics",
                "include_details": False
            },
            "overtime_analysis": {
                "report_type": "analytics",
                "include_details": True
            }
        }
        
        if template_id not in template_configs:
            raise HTTPException(status_code=404, detail=f"Template '{template_id}' not found")
        
        # Build filters
        filters = template_configs[template_id].copy()
        
        if jalali_year and jalali_month:
            from app.common.utils import jalali_calendar
            # Validate month
            if not 1 <= jalali_month <= 12:
                raise HTTPException(status_code=400, detail="Invalid Jalali month. Must be between 1 and 12.")
            
            start_date = jalali_calendar.jalali_to_gregorian(jalali_year, jalali_month, 1)
            days_in_month = jalali_calendar.get_jalali_month_days(jalali_year, jalali_month)
            end_date = jalali_calendar.jalali_to_gregorian(jalali_year, jalali_month, days_in_month)
            
            filters.update({
                "start_date": start_date.isoformat(),
                "end_date": end_date.isoformat(),
                "jalali_start_date": f"{jalali_year}-{jalali_month:02d}-01",
                "jalali_end_date": f"{jalali_year}-{jalali_month:02d}-{days_in_month:02d}"
            })
        
        # Generate and export report
        export_data = service.bulk_export_data(export_format, filters)
        
        # Determine content type and filename
        format_mapping = {
            'csv': ('text/csv', f'{template_id}.csv'),
            'excel': ('application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', f'{template_id}.xlsx'),
            'pdf': ('application/pdf', f'{template_id}.pdf'),
            'json': ('application/json', f'{template_id}.json')
        }
        
        content_type, filename = format_mapping.get(export_format.lower(), ('application/octet-stream', f'{template_id}'))
        
        return StreamingResponse(
            BytesIO(export_data),
            media_type=content_type,
            headers={"Content-Disposition": f"attachment; filename={filename}"}
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to export template: {str(e)}")


@router.get("/reports/sample")
async def get_sample_report(
    format: str = Query("json", description="Sample format to return"),
    db: Session = Depends(get_session),
    current_inspector = Depends(require_admin_access)
):
    """
    Get a sample report structure for API documentation and testing.
    """
    try:
        # Create sample filters for current month
        from datetime import date
        from app.common.utils import jalali_calendar
        
        today = date.today()
        jalali_today = jalali_calendar.gregorian_to_jalali_str(today)
        jalali_year, jalali_month, _ = map(int, jalali_today.split('-'))
        
        sample_filters = {
            "report_type": "summary",
            "jalali_start_date": f"{jalali_year}-{jalali_month:02d}-01",
            "jalali_end_date": f"{jalali_year}-{jalali_month:02d}-30",
            "include_details": True
        }
        
        service = ReportingService(db)
        
        if format.lower() == "json":
            # Return sample JSON structure
            sample_report = service.generate_attendance_report(sample_filters)
            return sample_report
        else:
            # Return sample in requested format
            export_data = service.bulk_export_data(format, sample_filters)
            
            format_mapping = {
                'csv': ('text/csv', 'sample_report.csv'),
                'excel': ('application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'sample_report.xlsx'),
                'pdf': ('application/pdf', 'sample_report.pdf')
            }
            
            content_type, filename = format_mapping.get(format.lower(), ('application/octet-stream', 'sample_report'))
            
            return StreamingResponse(
                BytesIO(export_data),
                media_type=content_type,
                headers={"Content-Disposition": f"attachment; filename={filename}"}
            )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate sample report: {str(e)}")


@router.get("/reports/health")
async def reports_health_check(
    db: Session = Depends(get_session),
    current_inspector = Depends(require_admin_access)
):
    """
    Health check for reporting services.
    """
    try:
        service = ReportingService(db)
        formats = service.get_export_formats()
        
        return {
            "status": "healthy",
            "services": {
                "reporting_service": "operational",
                "database": "connected",
                "export_formats": formats
            },
            "capabilities": {
                "report_generation": True,
                "data_export": True,
                "format_conversion": True,
                "template_support": True
            }
        }
    except Exception as e:
        return {
            "status": "unhealthy",
            "error": str(e),
            "services": {
                "reporting_service": "error",
                "database": "unknown"
            }
        }