"""API routes for equipment validation in maintenance events"""

from fastapi import APIRouter, Depends, HTTPException, Query, Path
from sqlmodel import Session
from typing import List, Optional, Dict, Any
import logging

from app.database import get_session
from app.domains.maintenance.services.equipment_validation import (
    EquipmentValidationService,
    EquipmentValidationResult
)

# Setup logging
logger = logging.getLogger(__name__)

router = APIRouter()

# Pydantic models for request/response
from pydantic import BaseModel

class EquipmentValidationRequest(BaseModel):
    equipment_tags: List[str]
    maintenance_event_id: Optional[int] = None
    maintenance_sub_event_id: Optional[int] = None

class ValidationErrorResponse(BaseModel):
    message: str
    error_code: str

class ValidationWarningResponse(BaseModel):
    message: str
    warning_code: str

class EquipmentInfoResponse(BaseModel):
    id: int
    tag: str
    description: Optional[str]
    unit: str
    equipment_type: str

class ConflictingInspectionResponse(BaseModel):
    id: int
    inspection_number: str
    title: str
    start_date: str
    status: str

class ConflictingPlanResponse(BaseModel):
    id: int
    requester: str
    priority: str
    status: str
    created_at: str

class EquipmentValidationResponse(BaseModel):
    equipment_tag: str
    is_valid: bool
    errors: List[ValidationErrorResponse]
    warnings: List[ValidationWarningResponse]
    equipment_info: Optional[EquipmentInfoResponse]
    conflicting_inspections: List[ConflictingInspectionResponse]
    conflicting_plans: List[ConflictingPlanResponse]

class BatchValidationResponse(BaseModel):
    results: Dict[str, EquipmentValidationResponse]
    summary: Dict[str, Any]

class EquipmentConstraintsSummaryResponse(BaseModel):
    equipment_exists: bool
    equipment_info: Optional[EquipmentInfoResponse]
    inspection_history: Optional[Dict[str, Any]]
    current_constraints: Optional[Dict[str, Any]]
    active_inspections: List[ConflictingInspectionResponse]
    current_plans: List[ConflictingPlanResponse]
    error: Optional[str] = None

# Equipment Validation Endpoints

@router.post("/equipment/validate-for-planning", response_model=BatchValidationResponse)
def validate_equipment_for_planning(
    validation_request: EquipmentValidationRequest,
    session: Session = Depends(get_session)
):
    """Validate multiple equipment for inspection planning"""
    try:
        validation_service = EquipmentValidationService(session)
        
        # Validate all equipment
        validation_results = validation_service.validate_multiple_equipment_for_planning(
            equipment_tags=validation_request.equipment_tags,
            maintenance_event_id=validation_request.maintenance_event_id,
            maintenance_sub_event_id=validation_request.maintenance_sub_event_id
        )
        
        # Convert results to response format
        response_results = {}
        valid_count = 0
        invalid_count = 0
        total_errors = 0
        total_warnings = 0
        
        for equipment_tag, result in validation_results.items():
            # Convert equipment info
            equipment_info = None
            if result.equipment_info:
                equipment_info = EquipmentInfoResponse(**result.equipment_info)
            
            # Convert errors
            errors = [
                ValidationErrorResponse(message=error['message'], error_code=error['error_code'])
                for error in result.errors
            ]
            
            # Convert warnings
            warnings = [
                ValidationWarningResponse(message=warning['message'], warning_code=warning['warning_code'])
                for warning in result.warnings
            ]
            
            # Convert conflicting inspections
            conflicting_inspections = [
                ConflictingInspectionResponse(**inspection)
                for inspection in result.conflicting_inspections
            ]
            
            # Convert conflicting plans
            conflicting_plans = [
                ConflictingPlanResponse(**plan)
                for plan in result.conflicting_plans
            ]
            
            response_results[equipment_tag] = EquipmentValidationResponse(
                equipment_tag=equipment_tag,
                is_valid=result.is_valid,
                errors=errors,
                warnings=warnings,
                equipment_info=equipment_info,
                conflicting_inspections=conflicting_inspections,
                conflicting_plans=conflicting_plans
            )
            
            # Update counters
            if result.is_valid:
                valid_count += 1
            else:
                invalid_count += 1
            
            total_errors += len(errors)
            total_warnings += len(warnings)
        
        # Create summary
        summary = {
            'total_equipment': len(validation_request.equipment_tags),
            'valid_equipment': valid_count,
            'invalid_equipment': invalid_count,
            'total_errors': total_errors,
            'total_warnings': total_warnings,
            'can_proceed': invalid_count == 0
        }
        
        return BatchValidationResponse(
            results=response_results,
            summary=summary
        )
        
    except Exception as e:
        logger.error(f"Failed to validate equipment for planning: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to validate equipment: {str(e)}")

@router.get("/equipment/{equipment_tag}/validate-for-planning", response_model=EquipmentValidationResponse)
def validate_single_equipment_for_planning(
    equipment_tag: str = Path(..., description="Equipment tag to validate"),
    maintenance_event_id: Optional[int] = Query(None, description="Maintenance event ID"),
    maintenance_sub_event_id: Optional[int] = Query(None, description="Maintenance sub-event ID"),
    exclude_plan_id: Optional[int] = Query(None, description="Plan ID to exclude from duplicate checks"),
    session: Session = Depends(get_session)
):
    """Validate single equipment for inspection planning"""
    try:
        validation_service = EquipmentValidationService(session)
        
        result = validation_service.validate_equipment_for_inspection_plan(
            equipment_tag=equipment_tag,
            maintenance_event_id=maintenance_event_id,
            maintenance_sub_event_id=maintenance_sub_event_id,
            exclude_plan_id=exclude_plan_id
        )
        
        # Convert equipment info
        equipment_info = None
        if result.equipment_info:
            equipment_info = EquipmentInfoResponse(**result.equipment_info)
        
        # Convert errors
        errors = [
            ValidationErrorResponse(message=error['message'], error_code=error['error_code'])
            for error in result.errors
        ]
        
        # Convert warnings
        warnings = [
            ValidationWarningResponse(message=warning['message'], warning_code=warning['warning_code'])
            for warning in result.warnings
        ]
        
        # Convert conflicting inspections
        conflicting_inspections = [
            ConflictingInspectionResponse(**inspection)
            for inspection in result.conflicting_inspections
        ]
        
        # Convert conflicting plans
        conflicting_plans = [
            ConflictingPlanResponse(**plan)
            for plan in result.conflicting_plans
        ]
        
        return EquipmentValidationResponse(
            equipment_tag=equipment_tag,
            is_valid=result.is_valid,
            errors=errors,
            warnings=warnings,
            equipment_info=equipment_info,
            conflicting_inspections=conflicting_inspections,
            conflicting_plans=conflicting_plans
        )
        
    except Exception as e:
        logger.error(f"Failed to validate equipment {equipment_tag}: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to validate equipment: {str(e)}")

@router.get("/equipment/{equipment_tag}/validate-for-inspection", response_model=EquipmentValidationResponse)
def validate_equipment_for_inspection(
    equipment_tag: str = Path(..., description="Equipment tag to validate"),
    exclude_inspection_id: Optional[int] = Query(None, description="Inspection ID to exclude from active checks"),
    session: Session = Depends(get_session)
):
    """Validate equipment for inspection creation"""
    try:
        validation_service = EquipmentValidationService(session)
        
        result = validation_service.validate_equipment_for_inspection(
            equipment_tag=equipment_tag,
            exclude_inspection_id=exclude_inspection_id
        )
        
        # Convert equipment info
        equipment_info = None
        if result.equipment_info:
            equipment_info = EquipmentInfoResponse(**result.equipment_info)
        
        # Convert errors
        errors = [
            ValidationErrorResponse(message=error['message'], error_code=error['error_code'])
            for error in result.errors
        ]
        
        # Convert warnings
        warnings = [
            ValidationWarningResponse(message=warning['message'], warning_code=warning['warning_code'])
            for warning in result.warnings
        ]
        
        # Convert conflicting inspections
        conflicting_inspections = [
            ConflictingInspectionResponse(**inspection)
            for inspection in result.conflicting_inspections
        ]
        
        # Convert conflicting plans
        conflicting_plans = [
            ConflictingPlanResponse(**plan)
            for plan in result.conflicting_plans
        ]
        
        return EquipmentValidationResponse(
            equipment_tag=equipment_tag,
            is_valid=result.is_valid,
            errors=errors,
            warnings=warnings,
            equipment_info=equipment_info,
            conflicting_inspections=conflicting_inspections,
            conflicting_plans=conflicting_plans
        )
        
    except Exception as e:
        logger.error(f"Failed to validate equipment {equipment_tag} for inspection: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to validate equipment: {str(e)}")

@router.get("/equipment/{equipment_tag}/constraints", response_model=EquipmentConstraintsSummaryResponse)
def get_equipment_constraints_summary(
    equipment_tag: str = Path(..., description="Equipment tag to analyze"),
    session: Session = Depends(get_session)
):
    """Get comprehensive constraints summary for equipment"""
    try:
        validation_service = EquipmentValidationService(session)
        
        summary = validation_service.get_equipment_constraints_summary(equipment_tag)
        
        if not summary['equipment_exists']:
            return EquipmentConstraintsSummaryResponse(
                equipment_exists=False,
                equipment_info=None,
                inspection_history=None,
                current_constraints=None,
                active_inspections=[],
                current_plans=[],
                error=summary.get('error')
            )
        
        # Convert equipment info
        equipment_info = EquipmentInfoResponse(**summary['equipment_info'])
        
        # Convert active inspections
        active_inspections = [
            ConflictingInspectionResponse(**inspection)
            for inspection in summary['active_inspections']
        ]
        
        # Convert current plans
        current_plans = [
            ConflictingPlanResponse(**plan)
            for plan in summary['current_plans']
        ]
        
        return EquipmentConstraintsSummaryResponse(
            equipment_exists=True,
            equipment_info=equipment_info,
            inspection_history=summary['inspection_history'],
            current_constraints=summary['current_constraints'],
            active_inspections=active_inspections,
            current_plans=current_plans
        )
        
    except Exception as e:
        logger.error(f"Failed to get constraints summary for equipment {equipment_tag}: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to get constraints summary: {str(e)}")

# Bulk Validation Endpoints

@router.post("/equipment/validate-batch")
def validate_equipment_batch(
    equipment_tags: List[str],
    validation_type: str = Query("planning", description="Validation type: 'planning' or 'inspection'"),
    maintenance_event_id: Optional[int] = Query(None, description="Maintenance event ID (for planning validation)"),
    maintenance_sub_event_id: Optional[int] = Query(None, description="Maintenance sub-event ID (for planning validation)"),
    session: Session = Depends(get_session)
):
    """Validate multiple equipment in batch"""
    try:
        validation_service = EquipmentValidationService(session)
        
        results = {}
        
        if validation_type == "planning":
            validation_results = validation_service.validate_multiple_equipment_for_planning(
                equipment_tags=equipment_tags,
                maintenance_event_id=maintenance_event_id,
                maintenance_sub_event_id=maintenance_sub_event_id
            )
        else:  # inspection
            validation_results = {}
            for equipment_tag in equipment_tags:
                validation_results[equipment_tag] = validation_service.validate_equipment_for_inspection(
                    equipment_tag=equipment_tag
                )
        
        # Convert results
        for equipment_tag, result in validation_results.items():
            results[equipment_tag] = result.get_summary()
        
        # Calculate summary
        valid_count = sum(1 for result in validation_results.values() if result.is_valid)
        invalid_count = len(equipment_tags) - valid_count
        
        return {
            'results': results,
            'summary': {
                'total_equipment': len(equipment_tags),
                'valid_equipment': valid_count,
                'invalid_equipment': invalid_count,
                'validation_type': validation_type,
                'can_proceed': invalid_count == 0
            }
        }
        
    except Exception as e:
        logger.error(f"Failed to validate equipment batch: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to validate equipment batch: {str(e)}")