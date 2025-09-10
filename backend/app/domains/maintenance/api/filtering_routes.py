"""API routes for filtering and search functionality in maintenance events"""

from fastapi import APIRouter, Depends, HTTPException, Query, Path
from sqlmodel import Session, select, or_, and_
from typing import List, Optional, Dict, Any
from datetime import datetime, date
import logging

from app.database import get_session
from app.domains.maintenance.models.event import MaintenanceEvent, MaintenanceSubEvent
from app.domains.inspection.models.inspection import Inspection
from app.domains.inspection.models.enums import InspectionStatus, RefineryDepartment
from app.domains.equipment.models.equipment import Equipment
from app.domains.daily_report.models.report import DailyReport
from app.domains.inspection.services.inspection_service import InspectionService

# Setup logging
logger = logging.getLogger(__name__)

router = APIRouter()

# Pydantic models for request/response
from pydantic import BaseModel

class InspectionFilterRequest(BaseModel):
    date_from: Optional[date] = None
    date_to: Optional[date] = None
    status: Optional[List[InspectionStatus]] = None
    inspector_ids: Optional[List[int]] = None
    inspector_names: Optional[List[str]] = None
    equipment_tag: Optional[str] = None
    maintenance_event_id: Optional[int] = None
    maintenance_sub_event_id: Optional[int] = None
    requesting_department: Optional[List[RefineryDepartment]] = None
    work_order: Optional[str] = None

class EquipmentSearchResponse(BaseModel):
    equipment_tag: str
    description: Optional[str]
    unit: str
    equipment_type: str
    has_active_inspection: bool
    inspection_count: int
    last_inspection_date: Optional[date]

class InspectionSearchResponse(BaseModel):
    id: int
    inspection_number: str
    title: str
    equipment_tag: str
    equipment_description: Optional[str]
    start_date: date
    end_date: Optional[date]
    status: str
    requesting_department: str
    maintenance_event_number: Optional[str]
    maintenance_sub_event_number: Optional[str]
    work_order: Optional[str]
    is_first_time: bool

class DailyReportFilterResponse(BaseModel):
    id: int
    inspection_id: int
    inspection_number: str
    equipment_tag: str
    report_date: date
    description: str
    inspector_names: Optional[str]
    maintenance_event_number: Optional[str]

class PaginatedResponse(BaseModel):
    items: List[Any]
    total_count: int
    page: int
    page_size: int
    total_pages: int
    has_next: bool
    has_previous: bool

# Equipment Search and Autocomplete

@router.get("/equipment/search", response_model=List[EquipmentSearchResponse])
def search_equipment(
    q: str = Query(..., min_length=1, description="Search query for equipment tag or description"),
    limit: int = Query(10, ge=1, le=50, description="Maximum number of results"),
    include_inactive: bool = Query(False, description="Include equipment with no recent activity"),
    session: Session = Depends(get_session)
):
    """Search equipment with autocomplete functionality"""
    try:
        # Build search query
        search_term = f"%{q.upper()}%"
        
        query = select(Equipment).where(
            or_(
                Equipment.tag.ilike(search_term),
                Equipment.description.ilike(search_term)
            )
        ).order_by(Equipment.tag).limit(limit)
        
        equipment_list = list(session.exec(query).all())
        
        # Enhance with inspection information
        from app.domains.maintenance.services.inspection_history import InspectionHistoryService
        
        results = []
        for equipment in equipment_list:
            # Get inspection information
            has_active = InspectionHistoryService.has_active_inspection(equipment.tag, session)
            inspection_count = InspectionHistoryService.get_equipment_inspection_count(equipment.tag, session)
            
            # Get last inspection date
            latest_inspection = InspectionHistoryService.get_latest_inspection(equipment.tag, session)
            last_inspection_date = None
            if latest_inspection:
                last_inspection_date = latest_inspection.actual_end_date or latest_inspection.actual_start_date
            
            # Filter inactive equipment if requested
            if not include_inactive and inspection_count == 0 and not has_active:
                continue
            
            results.append(EquipmentSearchResponse(
                equipment_tag=equipment.tag,
                description=equipment.description,
                unit=equipment.unit,
                equipment_type=equipment.equipment_type,
                has_active_inspection=has_active,
                inspection_count=inspection_count,
                last_inspection_date=last_inspection_date
            ))
        
        return results
        
    except Exception as e:
        logger.error(f"Failed to search equipment: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to search equipment: {str(e)}")

@router.get("/equipment/autocomplete")
def equipment_autocomplete(
    q: str = Query(..., min_length=1, description="Search query for equipment tag"),
    limit: int = Query(10, ge=1, le=20, description="Maximum number of suggestions"),
    session: Session = Depends(get_session)
):
    """Get equipment tag autocomplete suggestions"""
    try:
        search_term = f"%{q.upper()}%"
        
        query = select(Equipment.tag, Equipment.description).where(
            Equipment.tag.ilike(search_term)
        ).order_by(Equipment.tag).limit(limit)
        
        results = session.exec(query).all()
        
        return [
            {
                "tag": result[0],
                "description": result[1],
                "display": f"{result[0]} - {result[1]}" if result[1] else result[0]
            }
            for result in results
        ]
        
    except Exception as e:
        logger.error(f"Failed to get equipment autocomplete: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to get equipment autocomplete: {str(e)}")

# Advanced Inspection Filtering

@router.get("/events/{event_id}/inspections/filter", response_model=Dict[str, Any])
def filter_event_inspections(
    event_id: int = Path(..., description="Maintenance event ID"),
    date_from: Optional[date] = Query(None, description="Filter inspections from this date"),
    date_to: Optional[date] = Query(None, description="Filter inspections to this date"),
    status: Optional[List[InspectionStatus]] = Query(None, description="Filter by inspection status"),
    inspector_name: Optional[str] = Query(None, description="Filter by inspector name"),
    equipment_tag: Optional[str] = Query(None, description="Filter by equipment tag"),
    requesting_department: Optional[List[RefineryDepartment]] = Query(None, description="Filter by requesting department"),
    work_order: Optional[str] = Query(None, description="Filter by work order"),
    first_time_only: bool = Query(False, description="Show only first-time inspections"),
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(20, ge=1, le=100, description="Items per page"),
    session: Session = Depends(get_session)
):
    """Filter inspections for a maintenance event with advanced options"""
    try:
        # Verify event exists
        event = session.get(MaintenanceEvent, event_id)
        if not event:
            raise HTTPException(
                status_code=404,
                detail=f"Maintenance event with ID {event_id} not found"
            )
        
        # Build base query
        query = select(Inspection).where(Inspection.maintenance_event_id == event_id)
        
        # Apply filters
        if date_from:
            query = query.where(Inspection.start_date >= date_from)
        if date_to:
            query = query.where(Inspection.start_date <= date_to)
        if status:
            query = query.where(Inspection.status.in_(status))
        if requesting_department:
            query = query.where(Inspection.requesting_department.in_(requesting_department))
        if work_order:
            query = query.where(Inspection.work_order.ilike(f"%{work_order}%"))
        if equipment_tag:
            query = query.join(Equipment).where(Equipment.tag.ilike(f"%{equipment_tag}%"))
        
        # Get total count before pagination
        total_count = len(list(session.exec(query).all()))
        
        # Apply pagination
        offset = (page - 1) * page_size
        query = query.order_by(Inspection.start_date.desc()).offset(offset).limit(page_size)
        
        inspections = list(session.exec(query).all())
        
        # Get inspection service for enhanced data
        inspection_service = InspectionService(session)
        
        # Build response with enhanced data
        inspection_responses = []
        first_time_count = 0
        
        for inspection in inspections:
            # Get enhanced inspection data
            enhanced_data = inspection_service.get_inspection_with_first_time_status(inspection.id)
            if not enhanced_data:
                continue
            
            # Apply first-time filter
            if first_time_only and not enhanced_data['first_time_status']['is_first_time']:
                continue
            
            # Apply inspector filter (check daily reports)
            if inspector_name:
                daily_reports = session.exec(
                    select(DailyReport).where(DailyReport.inspection_id == inspection.id)
                ).all()
                
                inspector_found = False
                for report in daily_reports:
                    if report.inspector_names and inspector_name.lower() in report.inspector_names.lower():
                        inspector_found = True
                        break
                
                if not inspector_found:
                    continue
            
            # Count first-time inspections
            if enhanced_data['first_time_status']['is_first_time']:
                first_time_count += 1
            
            # Get maintenance event info
            maintenance_event_number = None
            maintenance_sub_event_number = None
            
            if inspection.maintenance_event_id:
                event_info = session.get(MaintenanceEvent, inspection.maintenance_event_id)
                if event_info:
                    maintenance_event_number = event_info.event_number
            
            if inspection.maintenance_sub_event_id:
                sub_event_info = session.get(MaintenanceSubEvent, inspection.maintenance_sub_event_id)
                if sub_event_info:
                    maintenance_sub_event_number = sub_event_info.sub_event_number
            
            inspection_response = InspectionSearchResponse(
                id=inspection.id,
                inspection_number=inspection.inspection_number,
                title=inspection.title,
                equipment_tag=inspection.equipment.tag if inspection.equipment else "Unknown",
                equipment_description=inspection.equipment.description if inspection.equipment else None,
                start_date=inspection.actual_start_date,
                end_date=inspection.actual_end_date,
                status=enhanced_data['inspection']['status'],
                requesting_department=enhanced_data['inspection']['requesting_department'],
                maintenance_event_number=maintenance_event_number,
                maintenance_sub_event_number=maintenance_sub_event_number,
                work_order=inspection.work_order,
                is_first_time=enhanced_data['first_time_status']['is_first_time']
            )
            
            inspection_responses.append(inspection_response)
        
        # Calculate pagination info
        total_pages = (total_count + page_size - 1) // page_size
        has_next = page < total_pages
        has_previous = page > 1
        
        return {
            "inspections": inspection_responses,
            "pagination": {
                "total_count": total_count,
                "page": page,
                "page_size": page_size,
                "total_pages": total_pages,
                "has_next": has_next,
                "has_previous": has_previous
            },
            "filters_applied": {
                "date_from": date_from,
                "date_to": date_to,
                "status": status,
                "inspector_name": inspector_name,
                "equipment_tag": equipment_tag,
                "requesting_department": requesting_department,
                "work_order": work_order,
                "first_time_only": first_time_only
            },
            "summary": {
                "total_inspections": len(inspection_responses),
                "first_time_inspections": first_time_count,
                "event_info": {
                    "id": event.id,
                    "event_number": event.event_number,
                    "title": event.title
                }
            }
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to filter event inspections: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to filter inspections: {str(e)}")

# Daily Reports Filtering

@router.get("/events/{event_id}/daily-reports/filter", response_model=Dict[str, Any])
def filter_event_daily_reports(
    event_id: int = Path(..., description="Maintenance event ID"),
    date_from: Optional[date] = Query(None, description="Filter reports from this date"),
    date_to: Optional[date] = Query(None, description="Filter reports to this date"),
    inspector_name: Optional[str] = Query(None, description="Filter by inspector name"),
    equipment_tag: Optional[str] = Query(None, description="Filter by equipment tag"),
    inspection_status: Optional[List[InspectionStatus]] = Query(None, description="Filter by inspection status"),
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(20, ge=1, le=100, description="Items per page"),
    session: Session = Depends(get_session)
):
    """Filter daily reports for a maintenance event"""
    try:
        # Verify event exists
        event = session.get(MaintenanceEvent, event_id)
        if not event:
            raise HTTPException(
                status_code=404,
                detail=f"Maintenance event with ID {event_id} not found"
            )
        
        # Build query for daily reports through inspections
        query = (
            select(DailyReport, Inspection, Equipment)
            .join(Inspection, DailyReport.inspection_id == Inspection.id)
            .join(Equipment, Inspection.equipment_id == Equipment.id)
            .where(Inspection.maintenance_event_id == event_id)
        )
        
        # Apply filters
        if date_from:
            query = query.where(DailyReport.report_date >= date_from)
        if date_to:
            query = query.where(DailyReport.report_date <= date_to)
        if inspector_name:
            query = query.where(DailyReport.inspector_names.ilike(f"%{inspector_name}%"))
        if equipment_tag:
            query = query.where(Equipment.tag.ilike(f"%{equipment_tag}%"))
        if inspection_status:
            query = query.where(Inspection.status.in_(inspection_status))
        
        # Get total count before pagination
        total_count = len(list(session.exec(query).all()))
        
        # Apply pagination
        offset = (page - 1) * page_size
        query = query.order_by(DailyReport.report_date.desc()).offset(offset).limit(page_size)
        
        results = list(session.exec(query).all())
        
        # Build response
        daily_report_responses = []
        inspector_breakdown = {}
        equipment_breakdown = {}
        
        for daily_report, inspection, equipment in results:
            # Get maintenance event number
            maintenance_event_number = None
            if inspection.maintenance_event_id:
                event_info = session.get(MaintenanceEvent, inspection.maintenance_event_id)
                if event_info:
                    maintenance_event_number = event_info.event_number
            
            daily_report_response = DailyReportFilterResponse(
                id=daily_report.id,
                inspection_id=inspection.id,
                inspection_number=inspection.inspection_number,
                equipment_tag=equipment.tag,
                report_date=daily_report.report_date,
                description=daily_report.description,
                inspector_names=daily_report.inspector_names,
                maintenance_event_number=maintenance_event_number
            )
            
            daily_report_responses.append(daily_report_response)
            
            # Update breakdowns
            if daily_report.inspector_names:
                inspector_breakdown[daily_report.inspector_names] = inspector_breakdown.get(daily_report.inspector_names, 0) + 1
            
            equipment_breakdown[equipment.tag] = equipment_breakdown.get(equipment.tag, 0) + 1
        
        # Calculate pagination info
        total_pages = (total_count + page_size - 1) // page_size
        has_next = page < total_pages
        has_previous = page > 1
        
        return {
            "daily_reports": daily_report_responses,
            "pagination": {
                "total_count": total_count,
                "page": page,
                "page_size": page_size,
                "total_pages": total_pages,
                "has_next": has_next,
                "has_previous": has_previous
            },
            "filters_applied": {
                "date_from": date_from,
                "date_to": date_to,
                "inspector_name": inspector_name,
                "equipment_tag": equipment_tag,
                "inspection_status": inspection_status
            },
            "breakdown": {
                "by_inspector": inspector_breakdown,
                "by_equipment": equipment_breakdown
            },
            "summary": {
                "total_reports": len(daily_report_responses),
                "unique_inspectors": len(inspector_breakdown),
                "unique_equipment": len(equipment_breakdown),
                "event_info": {
                    "id": event.id,
                    "event_number": event.event_number,
                    "title": event.title
                }
            }
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to filter daily reports: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to filter daily reports: {str(e)}")

# Global Search Endpoints

@router.get("/search/inspections", response_model=Dict[str, Any])
def global_inspection_search(
    q: Optional[str] = Query(None, description="Search query for inspection number, equipment tag, or title"),
    date_from: Optional[date] = Query(None, description="Filter inspections from this date"),
    date_to: Optional[date] = Query(None, description="Filter inspections to this date"),
    status: Optional[List[InspectionStatus]] = Query(None, description="Filter by inspection status"),
    maintenance_event_id: Optional[int] = Query(None, description="Filter by maintenance event"),
    first_time_only: bool = Query(False, description="Show only first-time inspections"),
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(20, ge=1, le=100, description="Items per page"),
    session: Session = Depends(get_session)
):
    """Global search for inspections across all maintenance events"""
    try:
        # Build base query
        query = select(Inspection).join(Equipment)
        
        # Apply text search
        if q:
            search_term = f"%{q}%"
            query = query.where(
                or_(
                    Inspection.inspection_number.ilike(search_term),
                    Inspection.title.ilike(search_term),
                    Equipment.tag.ilike(search_term),
                    Equipment.description.ilike(search_term)
                )
            )
        
        # Apply filters
        if date_from:
            query = query.where(Inspection.start_date >= date_from)
        if date_to:
            query = query.where(Inspection.start_date <= date_to)
        if status:
            query = query.where(Inspection.status.in_(status))
        if maintenance_event_id:
            query = query.where(Inspection.maintenance_event_id == maintenance_event_id)
        
        # Get total count before pagination
        total_count = len(list(session.exec(query).all()))
        
        # Apply pagination
        offset = (page - 1) * page_size
        query = query.order_by(Inspection.start_date.desc()).offset(offset).limit(page_size)
        
        inspections = list(session.exec(query).all())
        
        # Get inspection service for enhanced data
        inspection_service = InspectionService(session)
        
        # Build response with enhanced data
        inspection_responses = []
        first_time_count = 0
        event_breakdown = {}
        status_breakdown = {}
        
        for inspection in inspections:
            # Get enhanced inspection data
            enhanced_data = inspection_service.get_inspection_with_first_time_status(inspection.id)
            if not enhanced_data:
                continue
            
            # Apply first-time filter
            if first_time_only and not enhanced_data['first_time_status']['is_first_time']:
                continue
            
            # Count first-time inspections
            if enhanced_data['first_time_status']['is_first_time']:
                first_time_count += 1
            
            # Get maintenance event info
            maintenance_event_number = None
            maintenance_sub_event_number = None
            
            if inspection.maintenance_event_id:
                event_info = session.get(MaintenanceEvent, inspection.maintenance_event_id)
                if event_info:
                    maintenance_event_number = event_info.event_number
                    event_breakdown[maintenance_event_number] = event_breakdown.get(maintenance_event_number, 0) + 1
            
            if inspection.maintenance_sub_event_id:
                sub_event_info = session.get(MaintenanceSubEvent, inspection.maintenance_sub_event_id)
                if sub_event_info:
                    maintenance_sub_event_number = sub_event_info.sub_event_number
            
            # Update status breakdown
            status_key = enhanced_data['inspection']['status']
            status_breakdown[status_key] = status_breakdown.get(status_key, 0) + 1
            
            inspection_response = InspectionSearchResponse(
                id=inspection.id,
                inspection_number=inspection.inspection_number,
                title=inspection.title,
                equipment_tag=inspection.equipment.tag if inspection.equipment else "Unknown",
                equipment_description=inspection.equipment.description if inspection.equipment else None,
                start_date=inspection.actual_start_date,
                end_date=inspection.actual_end_date,
                status=enhanced_data['inspection']['status'],
                requesting_department=enhanced_data['inspection']['requesting_department'],
                maintenance_event_number=maintenance_event_number,
                maintenance_sub_event_number=maintenance_sub_event_number,
                work_order=inspection.work_order,
                is_first_time=enhanced_data['first_time_status']['is_first_time']
            )
            
            inspection_responses.append(inspection_response)
        
        # Calculate pagination info
        total_pages = (total_count + page_size - 1) // page_size
        has_next = page < total_pages
        has_previous = page > 1
        
        return {
            "inspections": inspection_responses,
            "pagination": {
                "total_count": total_count,
                "page": page,
                "page_size": page_size,
                "total_pages": total_pages,
                "has_next": has_next,
                "has_previous": has_previous
            },
            "filters_applied": {
                "search_query": q,
                "date_from": date_from,
                "date_to": date_to,
                "status": status,
                "maintenance_event_id": maintenance_event_id,
                "first_time_only": first_time_only
            },
            "breakdown": {
                "by_event": event_breakdown,
                "by_status": status_breakdown
            },
            "summary": {
                "total_inspections": len(inspection_responses),
                "first_time_inspections": first_time_count,
                "unique_events": len(event_breakdown)
            }
        }
        
    except Exception as e:
        logger.error(f"Failed to search inspections globally: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to search inspections: {str(e)}")

# Filter Options Endpoints

@router.get("/filter-options/inspectors")
def get_inspector_filter_options(
    event_id: Optional[int] = Query(None, description="Filter by maintenance event"),
    session: Session = Depends(get_session)
):
    """Get available inspector names for filtering"""
    try:
        # Build query for daily reports
        query = select(DailyReport.inspector_names).distinct()
        
        if event_id:
            query = (
                query.join(Inspection, DailyReport.inspection_id == Inspection.id)
                .where(Inspection.maintenance_event_id == event_id)
            )
        
        results = session.exec(query).all()
        
        # Extract unique inspector names
        inspector_names = set()
        for result in results:
            if result and result.strip():
                # Split multiple inspector names if comma-separated
                names = [name.strip() for name in result.split(',')]
                inspector_names.update(names)
        
        return {
            "inspectors": sorted(list(inspector_names)),
            "total_count": len(inspector_names)
        }
        
    except Exception as e:
        logger.error(f"Failed to get inspector filter options: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to get inspector options: {str(e)}")

@router.get("/filter-options/requesters")
def get_requester_filter_options(
    event_id: Optional[int] = Query(None, description="Filter by maintenance event"),
    session: Session = Depends(get_session)
):
    """Get available requesters for filtering"""
    try:
        # Get requesters from inspections (using requesting_department)
        query = select(Inspection.requesting_department).distinct()
        
        if event_id:
            query = query.where(Inspection.maintenance_event_id == event_id)
        
        results = session.exec(query).all()
        
        # Convert enum values to strings
        requesters = []
        for result in results:
            if result:
                requester_str = result.value if hasattr(result, 'value') else str(result)
                if requester_str and requester_str.strip():
                    requesters.append(requester_str)
        
        return {
            "requesters": sorted(requesters),
            "total_count": len(requesters)
        }
        
    except Exception as e:
        logger.error(f"Failed to get requester filter options: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to get requester options: {str(e)}")