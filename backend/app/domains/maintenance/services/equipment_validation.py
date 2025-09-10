"""Equipment validation service for maintenance event management"""

from typing import Optional, List, Dict, Any
from sqlmodel import Session, select
from datetime import datetime

from app.domains.equipment.models.equipment import Equipment
from app.domains.inspection.models.inspection import Inspection
from app.domains.inspection.models.enums import InspectionStatus
from app.domains.maintenance.services.inspection_history import InspectionHistoryService


class EquipmentValidationError(Exception):
    """Exception raised by equipment validation operations"""
    
    def __init__(self, message: str, error_code: str = None, equipment_tag: str = None):
        self.message = message
        self.error_code = error_code
        self.equipment_tag = equipment_tag
        super().__init__(message)


class EquipmentValidationResult:
    """Result of equipment validation check"""
    
    def __init__(self):
        self.is_valid = True
        self.errors = []
        self.warnings = []
        self.equipment_info = None
        self.conflicting_inspections = []
        self.conflicting_plans = []
    
    def add_error(self, message: str, error_code: str = None):
        """Add validation error"""
        self.is_valid = False
        self.errors.append({
            'message': message,
            'error_code': error_code or 'VALIDATION_ERROR'
        })
    
    def add_warning(self, message: str, warning_code: str = None):
        """Add validation warning"""
        self.warnings.append({
            'message': message,
            'warning_code': warning_code or 'VALIDATION_WARNING'
        })
    
    def get_summary(self) -> Dict[str, Any]:
        """Get validation summary"""
        return {
            'is_valid': self.is_valid,
            'errors': self.errors,
            'warnings': self.warnings,
            'equipment_info': self.equipment_info,
            'conflicting_inspections': self.conflicting_inspections,
            'conflicting_plans': self.conflicting_plans
        }


class EquipmentValidationService:
    """Service for validating equipment constraints in maintenance events"""
    
    def __init__(self, session: Session):
        """Initialize the equipment validation service"""
        self.session = session
    
    def validate_equipment_for_inspection_plan(
        self,
        equipment_tag: str,
        maintenance_event_id: Optional[int] = None,
        maintenance_sub_event_id: Optional[int] = None,
        exclude_plan_id: Optional[int] = None
    ) -> EquipmentValidationResult:
        """
        Validate equipment for inspection planning
        
        Args:
            equipment_tag: Equipment tag to validate
            maintenance_event_id: Maintenance event ID (for event-level plans)
            maintenance_sub_event_id: Maintenance sub-event ID (for sub-event plans)
            exclude_plan_id: Plan ID to exclude from duplicate checks (for updates)
            
        Returns:
            EquipmentValidationResult with validation status
        """
        result = EquipmentValidationResult()
        
        try:
            # 1. Check if equipment exists
            equipment = self._get_equipment_by_tag(equipment_tag)
            if not equipment:
                result.add_error(
                    f"Equipment with tag '{equipment_tag}' not found",
                    "EQUIPMENT_NOT_FOUND"
                )
                return result
            
            # Store equipment info
            result.equipment_info = {
                'id': equipment.id,
                'tag': equipment.tag,
                'description': equipment.description,
                'unit': equipment.unit,
                'equipment_type': equipment.equipment_type
            }
            
            # 2. Check for active inspections
            active_inspections = self._get_active_inspections_for_equipment(equipment_tag)
            if active_inspections:
                result.add_error(
                    f"Equipment '{equipment_tag}' has active inspection(s). Cannot create new inspection plan.",
                    "EQUIPMENT_HAS_ACTIVE_INSPECTION"
                )
                result.conflicting_inspections = [
                    {
                        'id': inspection.id,
                        'inspection_number': inspection.inspection_number,
                        'title': inspection.title,
                        'start_date': inspection.actual_start_date,
                        'status': inspection.status.value if hasattr(inspection.status, 'value') else str(inspection.status)
                    }
                    for inspection in active_inspections
                ]
            
            # 3. Check for duplicate planning in same event/sub-event
            duplicate_plans = self._get_duplicate_plans(
                equipment_tag,
                maintenance_event_id,
                maintenance_sub_event_id,
                exclude_plan_id
            )
            
            if duplicate_plans:
                if maintenance_event_id:
                    result.add_error(
                        f"Equipment '{equipment_tag}' is already planned for this maintenance event",
                        "EQUIPMENT_ALREADY_PLANNED_IN_EVENT"
                    )
                elif maintenance_sub_event_id:
                    result.add_error(
                        f"Equipment '{equipment_tag}' is already planned for this maintenance sub-event",
                        "EQUIPMENT_ALREADY_PLANNED_IN_SUB_EVENT"
                    )
                
                result.conflicting_plans = [
                    {
                        'id': plan.id,
                        'requester': plan.requesting_department.value if hasattr(plan.requesting_department, 'value') else str(plan.requesting_department),
                        'status': plan.status.value if hasattr(plan.status, 'value') else str(plan.status),
                        'created_at': plan.created_at
                    }
                    for plan in duplicate_plans
                ]
            
            # 4. Add informational warnings
            self._add_informational_warnings(result, equipment_tag)
            
            return result
            
        except Exception as e:
            result.add_error(f"Validation failed: {str(e)}", "VALIDATION_SYSTEM_ERROR")
            return result
    
    def validate_equipment_for_inspection(
        self,
        equipment_tag: str,
        exclude_inspection_id: Optional[int] = None
    ) -> EquipmentValidationResult:
        """
        Validate equipment for inspection creation
        
        Args:
            equipment_tag: Equipment tag to validate
            exclude_inspection_id: Inspection ID to exclude from active checks (for updates)
            
        Returns:
            EquipmentValidationResult with validation status
        """
        result = EquipmentValidationResult()
        
        try:
            # 1. Check if equipment exists
            equipment = self._get_equipment_by_tag(equipment_tag)
            if not equipment:
                result.add_error(
                    f"Equipment with tag '{equipment_tag}' not found",
                    "EQUIPMENT_NOT_FOUND"
                )
                return result
            
            # Store equipment info
            result.equipment_info = {
                'id': equipment.id,
                'tag': equipment.tag,
                'description': equipment.description,
                'unit': equipment.unit,
                'equipment_type': equipment.equipment_type
            }
            
            # 2. Check for active inspections
            active_inspections = self._get_active_inspections_for_equipment(
                equipment_tag,
                exclude_inspection_id
            )
            
            if active_inspections:
                result.add_error(
                    f"Equipment '{equipment_tag}' already has an active inspection. Cannot start new inspection.",
                    "EQUIPMENT_HAS_ACTIVE_INSPECTION"
                )
                result.conflicting_inspections = [
                    {
                        'id': inspection.id,
                        'inspection_number': inspection.inspection_number,
                        'title': inspection.title,
                        'start_date': inspection.actual_start_date,
                        'status': inspection.status.value if hasattr(inspection.status, 'value') else str(inspection.status)
                    }
                    for inspection in active_inspections
                ]
            
            # 3. Add informational warnings
            self._add_informational_warnings(result, equipment_tag)
            
            return result
            
        except Exception as e:
            result.add_error(f"Validation failed: {str(e)}", "VALIDATION_SYSTEM_ERROR")
            return result
    
    def validate_multiple_equipment_for_planning(
        self,
        equipment_tags: List[str],
        maintenance_event_id: Optional[int] = None,
        maintenance_sub_event_id: Optional[int] = None
    ) -> Dict[str, EquipmentValidationResult]:
        """
        Validate multiple equipment for inspection planning
        
        Args:
            equipment_tags: List of equipment tags to validate
            maintenance_event_id: Maintenance event ID
            maintenance_sub_event_id: Maintenance sub-event ID
            
        Returns:
            Dictionary mapping equipment tags to validation results
        """
        results = {}
        
        for equipment_tag in equipment_tags:
            results[equipment_tag] = self.validate_equipment_for_inspection_plan(
                equipment_tag,
                maintenance_event_id,
                maintenance_sub_event_id
            )
        
        return results
    
    def get_equipment_constraints_summary(self, equipment_tag: str) -> Dict[str, Any]:
        """
        Get comprehensive constraints summary for equipment
        
        Args:
            equipment_tag: Equipment tag to analyze
            
        Returns:
            Dictionary with constraints summary
        """
        try:
            equipment = self._get_equipment_by_tag(equipment_tag)
            if not equipment:
                return {
                    'equipment_exists': False,
                    'error': f"Equipment '{equipment_tag}' not found"
                }
            
            # Get inspection history
            inspection_count = InspectionHistoryService.get_equipment_inspection_count(
                equipment_tag, self.session
            )
            is_first_time = InspectionHistoryService.is_first_time_inspection(
                equipment_tag, self.session
            )
            has_active = InspectionHistoryService.has_active_inspection(
                equipment_tag, self.session
            )
            latest_inspection = InspectionHistoryService.get_latest_inspection(
                equipment_tag, self.session
            )
            
            # Get current plans
            current_plans = self._get_current_plans_for_equipment(equipment_tag)
            
            # Get active inspections
            active_inspections = self._get_active_inspections_for_equipment(equipment_tag)
            
            return {
                'equipment_exists': True,
                'equipment_info': {
                    'id': equipment.id,
                    'tag': equipment.tag,
                    'description': equipment.description,
                    'unit': equipment.unit,
                    'equipment_type': equipment.equipment_type
                },
                'inspection_history': {
                    'total_inspections': inspection_count,
                    'is_first_time': is_first_time,
                    'has_active_inspection': has_active,
                    'latest_inspection_date': latest_inspection.actual_start_date if latest_inspection else None
                },
                'current_constraints': {
                    'can_plan_new_inspection': not has_active and len(current_plans) == 0,
                    'can_start_new_inspection': not has_active,
                    'active_inspections_count': len(active_inspections),
                    'current_plans_count': len(current_plans)
                },
                'active_inspections': [
                    {
                        'id': inspection.id,
                        'inspection_number': inspection.inspection_number,
                        'title': inspection.title,
                        'start_date': inspection.actual_start_date,
                        'status': inspection.status.value if hasattr(inspection.status, 'value') else str(inspection.status)
                    }
                    for inspection in active_inspections
                ],
                'current_plans': [
                    {
                        'id': plan.id,
                        'requester': plan.requester,
                        'priority': plan.priority.value if hasattr(plan.priority, 'value') else str(plan.priority),
                        'status': plan.status.value if hasattr(plan.status, 'value') else str(plan.status),
                        'maintenance_event_id': plan.maintenance_event_id,
                        'maintenance_sub_event_id': plan.maintenance_sub_event_id
                    }
                    for plan in current_plans
                ]
            }
            
        except Exception as e:
            return {
                'equipment_exists': False,
                'error': f"Failed to get constraints summary: {str(e)}"
            }
    
    def _get_equipment_by_tag(self, equipment_tag: str) -> Optional[Equipment]:
        """Get equipment by tag"""
        try:
            statement = select(Equipment).where(Equipment.tag == equipment_tag)
            return self.session.exec(statement).first()
        except Exception:
            return None
    
    def _get_active_inspections_for_equipment(
        self,
        equipment_tag: str,
        exclude_inspection_id: Optional[int] = None
    ) -> List[Inspection]:
        """Get active inspections for equipment"""
        try:
            statement = (
                select(Inspection)
                .join(Equipment)
                .where(
                    Equipment.tag == equipment_tag,
                    Inspection.status == InspectionStatus.InProgress
                )
            )
            
            if exclude_inspection_id:
                statement = statement.where(Inspection.id != exclude_inspection_id)
            
            return list(self.session.exec(statement).all())
        except Exception:
            return []
    
    def _get_duplicate_plans(
        self,
        equipment_tag: str,
        maintenance_event_id: Optional[int] = None,
        maintenance_sub_event_id: Optional[int] = None,
        exclude_plan_id: Optional[int] = None
    ) -> List[Inspection]:
        """Get duplicate inspection plans for equipment in same event/sub-event (using unified model)"""
        try:
            statement = select(Inspection).where(
                Inspection.equipment_id.in_(
                    select(Equipment.id).where(Equipment.tag == equipment_tag)
                ),
                Inspection.is_planned == True
            )
            
            if maintenance_event_id:
                statement = statement.where(Inspection.maintenance_event_id == maintenance_event_id)
            elif maintenance_sub_event_id:
                statement = statement.where(Inspection.maintenance_sub_event_id == maintenance_sub_event_id)
            else:
                return []  # No event specified, no duplicates possible
            
            if exclude_plan_id:
                statement = statement.where(Inspection.id != exclude_plan_id)
            
            return list(self.session.exec(statement).all())
        except Exception:
            return []
    
    def _get_current_plans_for_equipment(self, equipment_tag: str) -> List[Inspection]:
        """Get current inspection plans for equipment (using unified model)"""
        try:
            statement = select(Inspection).where(
                Inspection.equipment_id.in_(
                    select(Equipment.id).where(Equipment.tag == equipment_tag)
                ),
                Inspection.is_planned == True,
                Inspection.status.in_([InspectionStatus.Planned, InspectionStatus.InProgress])
            )
            return list(self.session.exec(statement).all())
        except Exception:
            return []
    
    def _add_informational_warnings(self, result: EquipmentValidationResult, equipment_tag: str):
        """Add informational warnings to validation result"""
        try:
            # Check if this would be a first-time inspection
            is_first_time = InspectionHistoryService.is_first_time_inspection(
                equipment_tag, self.session
            )
            
            if is_first_time:
                result.add_warning(
                    f"This will be the first inspection for equipment '{equipment_tag}'",
                    "FIRST_TIME_INSPECTION"
                )
            
            # Check inspection frequency
            inspection_count = InspectionHistoryService.get_equipment_inspection_count(
                equipment_tag, self.session
            )
            
            if inspection_count > 10:
                result.add_warning(
                    f"Equipment '{equipment_tag}' has been inspected {inspection_count} times. Consider reviewing inspection frequency.",
                    "HIGH_INSPECTION_FREQUENCY"
                )
            
            # Check for recent inspections
            latest_inspection = InspectionHistoryService.get_latest_inspection(
                equipment_tag, self.session
            )
            
            if latest_inspection and latest_inspection.actual_end_date:
                from datetime import date, timedelta
                days_since_last = (date.today() - latest_inspection.actual_end_date).days
                
                if days_since_last < 30:
                    result.add_warning(
                        f"Equipment '{equipment_tag}' was last inspected {days_since_last} days ago. Consider if new inspection is necessary.",
                        "RECENT_INSPECTION"
                    )
            
        except Exception:
            # Don't fail validation due to warning generation issues
            pass