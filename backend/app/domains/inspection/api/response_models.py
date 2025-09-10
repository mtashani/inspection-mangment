"""Response models for inspection API with first-time detection"""

from datetime import date, datetime
from typing import Optional, List
from pydantic import BaseModel
from app.domains.inspection.models.enums import InspectionStatus, RefineryDepartment


class FirstTimeStatusResponse(BaseModel):
    """Response model for first-time inspection status"""
    is_first_time: bool
    equipment_inspection_count: int
    equipment_tag: Optional[str] = None


class InspectionResponse(BaseModel):
    """Enhanced response model for inspection with first-time status"""
    id: int
    inspection_number: str
    title: str
    description: Optional[str] = None
    # Planned dates (for planned inspections)
    planned_start_date: Optional[date] = None
    planned_end_date: Optional[date] = None
    # Actual execution dates
    actual_start_date: Optional[date] = None
    actual_end_date: Optional[date] = None
    # Frontend v2 compatibility - these will be populated with actual dates
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    status: str
    equipment_id: int
    equipment_tag: Optional[str] = None
    maintenance_event_id: Optional[int] = None
    maintenance_sub_event_id: Optional[int] = None
    inspection_plan_id: Optional[int] = None  # Legacy field - deprecated in unified model
    requesting_department: str
    work_order: Optional[str] = None
    permit_number: Optional[str] = None
    created_at: datetime
    updated_at: datetime


class InspectionWithFirstTimeResponse(BaseModel):
    """Response model combining inspection data with first-time status"""
    inspection: InspectionResponse
    first_time_status: FirstTimeStatusResponse


class EquipmentInfoResponse(BaseModel):
    """Response model for equipment information in validation"""
    id: int
    tag: str
    description: Optional[str] = None
    has_active_inspection: bool
    is_first_time: bool
    inspection_count: int


class InspectionValidationResponse(BaseModel):
    """Response model for inspection creation validation"""
    is_valid: bool
    errors: List[str]
    warnings: List[str]
    equipment_info: Optional[EquipmentInfoResponse] = None


class InspectionStatusBreakdownResponse(BaseModel):
    """Response model for inspection status breakdown"""
    planned: int
    in_progress: int
    completed: int


class FirstTimeInspectionStatsResponse(BaseModel):
    """Response model for first-time inspection statistics"""
    count: int
    percentage: float


class EquipmentStatusResponse(BaseModel):
    """Response model for equipment status in events"""
    under_inspection: int
    inspection_completed: int
    planned_for_inspection: int


class EventInspectionStatisticsResponse(BaseModel):
    """Response model for event inspection statistics"""
    total_inspections: int
    status_breakdown: InspectionStatusBreakdownResponse
    first_time_inspections: FirstTimeInspectionStatsResponse
    equipment_status: EquipmentStatusResponse


class InspectionCreationRequest(BaseModel):
    """Request model for creating inspections"""
    inspection_number: str
    title: str
    description: Optional[str] = None
    start_date: Optional[date] = None
    equipment_id: Optional[int] = None
    equipment_tag: Optional[str] = None
    maintenance_event_id: Optional[int] = None
    maintenance_sub_event_id: Optional[int] = None
    inspection_plan_id: Optional[int] = None  # Legacy field - deprecated in unified model
    requesting_department: RefineryDepartment
    work_order: Optional[str] = None
    permit_number: Optional[str] = None


class InspectionListResponse(BaseModel):
    """Response model for list of inspections with first-time status"""
    inspections: List[InspectionWithFirstTimeResponse]
    total_count: int
    first_time_count: int
    
    
class RequesterBreakdownItem(BaseModel):
    """Response model for requester breakdown item"""
    requester: str
    planned_count: int
    in_progress_count: int
    completed_count: int
    first_time_count: int
    total_count: int


class RequesterBreakdownResponse(BaseModel):
    """Response model for requester breakdown analysis"""
    breakdown: List[RequesterBreakdownItem]
    total_requesters: int