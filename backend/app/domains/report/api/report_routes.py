"""Report submission and management API routes"""

from fastapi import APIRouter, HTTPException, Depends, Query, Path
from fastapi.responses import JSONResponse
from typing import List, Optional, Dict, Any
from datetime import datetime
import logging

from app.domains.report.services.report_service import ReportService
from app.domains.report.services.report_selection_service import ReportSelectionService
from app.domains.report.models.enums import ReportStatus

# Initialize router
router = APIRouter(prefix="/reports", tags=["Reports"])

# Initialize logger
logger = logging.getLogger(__name__)

# Dependency injection
from app.database import get_session
from sqlmodel import Session

async def get_report_service(session: Session = Depends(get_session)) -> ReportService:
    """Get report service instance"""
    return ReportService(session)

async def get_selection_service(session: Session = Depends(get_session)) -> ReportSelectionService:
    """Get report selection service instance"""
    return ReportSelectionService(session)


@router.get(
    "/templates/available",
    response_model=List[Dict[str, Any]],
    summary="Get Available Templates",
    description="Get templates available for a specific inspection"
)
async def get_available_templates(
    inspection_id: int = Query(..., description="Inspection ID"),
    selection_service: ReportSelectionService = Depends(get_selection_service)
) -> List[Dict[str, Any]]:
    """Get available templates for inspection"""
    
    try:
        logger.info(f"Getting available templates for inspection {inspection_id}")
        
        # Get available templates
        templates = await selection_service.get_available_templates(inspection_id)
        
        return [
            {
                "template_id": template.id,
                "name": template.name,
                "description": template.description,
                "sections_count": len(template.sections) if hasattr(template, 'sections') else 0
            }
            for template in templates
        ]
        
    except Exception as e:
        logger.error(f"Failed to get available templates for inspection {inspection_id}: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to get available templates: {str(e)}"
        )


@router.post(
    "/create",
    response_model=Dict[str, Any],
    summary="Create Report",
    description="Create a new report from template for inspection"
)
async def create_report(
    inspection_id: int,
    template_id: int,
    created_by: int,
    report_service: ReportService = Depends(get_report_service)
) -> Dict[str, Any]:
    """Create new report"""
    
    try:
        logger.info(f"Creating report for inspection {inspection_id} using template {template_id}")
        
        # Create report
        report = await report_service.create_report(
            inspection_id=inspection_id,
            template_id=template_id,
            created_by=created_by
        )
        
        return {
            "success": True,
            "report_id": report.id,
            "status": report.status,
            "message": "Report created successfully",
            "created_at": report.created_at
        }
        
    except Exception as e:
        logger.error(f"Failed to create report: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to create report: {str(e)}"
        )


@router.get(
    "/{report_id}",
    response_model=Dict[str, Any],
    summary="Get Report",
    description="Retrieve report with all field values"
)
async def get_report(
    report_id: int = Path(..., description="Report ID"),
    report_service: ReportService = Depends(get_report_service)
) -> Dict[str, Any]:
    """Get report details"""
    
    try:
        logger.info(f"Retrieving report {report_id}")
        
        # Get report with values
        report = await report_service.get_report_with_values(report_id)
        
        if not report:
            raise HTTPException(
                status_code=404,
                detail=f"Report {report_id} not found"
            )
        
        return {
            "success": True,
            "report": report,
            "message": "Report retrieved successfully"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to retrieve report {report_id}: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to retrieve report: {str(e)}"
        )


@router.put(
    "/{report_id}/field-values",
    response_model=Dict[str, Any],
    summary="Update Field Values",
    description="Update field values for a report"
)
async def update_field_values(
    report_id: int = Path(..., description="Report ID"),
    field_values: Dict[str, Any] = ...,
    report_service: ReportService = Depends(get_report_service)
) -> Dict[str, Any]:
    """Update report field values"""
    
    try:
        logger.info(f"Updating field values for report {report_id}")
        
        # Update field values
        updated_report = await report_service.update_field_values(report_id, field_values)
        
        return {
            "success": True,
            "report_id": updated_report.id,
            "message": "Field values updated successfully",
            "updated_at": datetime.now()
        }
        
    except Exception as e:
        logger.error(f"Failed to update field values for report {report_id}: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to update field values: {str(e)}"
        )


@router.post(
    "/{report_id}/submit",
    response_model=Dict[str, Any],
    summary="Submit Report",
    description="Submit report for approval"
)
async def submit_report(
    report_id: int = Path(..., description="Report ID"),
    report_service: ReportService = Depends(get_report_service)
) -> Dict[str, Any]:
    """Submit report"""
    
    try:
        logger.info(f"Submitting report {report_id}")
        
        # Submit report
        submitted_report = await report_service.submit_report(report_id)
        
        return {
            "success": True,
            "report_id": submitted_report.id,
            "status": submitted_report.status,
            "message": "Report submitted successfully",
            "submitted_at": datetime.now()
        }
        
    except Exception as e:
        logger.error(f"Failed to submit report {report_id}: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to submit report: {str(e)}"
        )


@router.get(
    "/inspection/{inspection_id}",
    response_model=List[Dict[str, Any]],
    summary="Get Reports by Inspection",
    description="Get all reports for a specific inspection"
)
async def get_reports_by_inspection(
    inspection_id: int = Path(..., description="Inspection ID"),
    status: Optional[ReportStatus] = Query(None, description="Filter by status"),
    report_service: ReportService = Depends(get_report_service)
) -> List[Dict[str, Any]]:
    """Get reports by inspection"""
    
    try:
        logger.info(f"Getting reports for inspection {inspection_id}")
        
        # Get reports
        reports = await report_service.get_reports_by_inspection(inspection_id, status)
        
        return [
            {
                "report_id": report.id,
                "template_name": report.template.name if hasattr(report, 'template') else "Unknown",
                "status": report.status,
                "created_at": report.created_at,
                "updated_at": report.updated_at
            }
            for report in reports
        ]
        
    except Exception as e:
        logger.error(f"Failed to get reports for inspection {inspection_id}: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to get reports: {str(e)}"
        )


@router.get(
    "/{report_id}/export",
    response_model=Dict[str, Any],
    summary="Export Report",
    description="Export report in various formats (PDF, Excel, etc.)"
)
async def export_report(
    report_id: int = Path(..., description="Report ID"),
    format: str = Query("pdf", description="Export format (pdf, excel, json)"),
    report_service: ReportService = Depends(get_report_service)
) -> Dict[str, Any]:
    """Export report"""
    
    try:
        logger.info(f"Exporting report {report_id} in {format} format")
        
        # Export report
        export_result = await report_service.export_report(report_id, format)
        
        return {
            "success": True,
            "export_url": export_result.get("url"),
            "format": format,
            "message": "Report exported successfully",
            "exported_at": datetime.now()
        }
        
    except Exception as e:
        logger.error(f"Failed to export report {report_id}: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to export report: {str(e)}"
        )


@router.delete(
    "/{report_id}",
    response_model=Dict[str, Any],
    summary="Delete Report",
    description="Delete a report (only if in draft status)"
)
async def delete_report(
    report_id: int = Path(..., description="Report ID"),
    report_service: ReportService = Depends(get_report_service)
) -> Dict[str, Any]:
    """Delete report"""
    
    try:
        logger.info(f"Deleting report {report_id}")
        
        # Delete report
        await report_service.delete_report(report_id)
        
        return {
            "success": True,
            "message": "Report deleted successfully",
            "deleted_at": datetime.now()
        }
        
    except Exception as e:
        logger.error(f"Failed to delete report {report_id}: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to delete report: {str(e)}"
        )


@router.get(
    "/{report_id}/auto-fields",
    response_model=Dict[str, Any],
    summary="Get Auto-filled Fields",
    description="Get auto-filled field values for a report"
)
async def get_auto_fields(
    report_id: int = Path(..., description="Report ID"),
    report_service: ReportService = Depends(get_report_service)
) -> Dict[str, Any]:
    """Get auto-filled fields"""
    
    try:
        logger.info(f"Getting auto-filled fields for report {report_id}")
        
        # Get auto fields
        auto_fields = await report_service.get_auto_filled_fields(report_id)
        
        return {
            "success": True,
            "auto_fields": auto_fields,
            "message": "Auto-filled fields retrieved successfully"
        }
        
    except Exception as e:
        logger.error(f"Failed to get auto-filled fields for report {report_id}: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to get auto-filled fields: {str(e)}"
        )


@router.post(
    "/{report_id}/refresh-auto-fields",
    response_model=Dict[str, Any],
    summary="Refresh Auto Fields",
    description="Refresh auto-filled field values with latest data"
)
async def refresh_auto_fields(
    report_id: int = Path(..., description="Report ID"),
    report_service: ReportService = Depends(get_report_service)
) -> Dict[str, Any]:
    """Refresh auto-filled fields"""
    
    try:
        logger.info(f"Refreshing auto-filled fields for report {report_id}")
        
        # Refresh auto fields
        refreshed_fields = await report_service.refresh_auto_fields(report_id)
        
        return {
            "success": True,
            "refreshed_fields": refreshed_fields,
            "message": "Auto-filled fields refreshed successfully",
            "refreshed_at": datetime.now()
        }
        
    except Exception as e:
        logger.error(f"Failed to refresh auto-filled fields for report {report_id}: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to refresh auto-filled fields: {str(e)}"
        )