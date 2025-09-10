"""Enhanced InspectionService with first-time detection integration"""

from datetime import datetime, date
from typing import Optional, List, Dict, Any
from sqlmodel import Session, select

from app.domains.inspection.models.inspection import Inspection
from app.domains.inspection.models.enums import InspectionStatus
from app.domains.equipment.models.equipment import Equipment
from app.domains.maintenance.services.inspection_history import InspectionHistoryService
from app.domains.maintenance.services.equipment_validation import EquipmentValidationService


class InspectionServiceError(Exception):
    """Exception raised by InspectionService operations"""
    
    def __init__(self, message: str, error_code: str = None):
        self.message = message
        self.error_code = error_code
        super().__init__(message)


class InspectionCreationData:
    """Data structure for inspection creation"""
    
    def __init__(self, **kwargs):
        self.inspection_number = kwargs.get('inspection_number')
        self.title = kwargs.get('title')
        self.description = kwargs.get('description')
        self.start_date = kwargs.get('start_date')  # Keep for backward compatibility
        self.actual_start_date = kwargs.get('actual_start_date') or kwargs.get('start_date')  # Accept both for compatibility
        self.equipment_id = kwargs.get('equipment_id')
        self.equipment_tag = kwargs.get('equipment_tag')
        self.maintenance_event_id = kwargs.get('maintenance_event_id')
        self.maintenance_sub_event_id = kwargs.get('maintenance_sub_event_id')
        self.inspection_plan_id = kwargs.get('inspection_plan_id')  # Legacy field - not used in unified model
        self.requesting_department = kwargs.get('requesting_department')
        self.work_order = kwargs.get('work_order')
        self.permit_number = kwargs.get('permit_number')


class InspectionService:
    """Enhanced service for managing inspections with first-time detection"""
    
    def __init__(self, session: Session):
        """Initialize the inspection service"""
        self.session = session
    
    def create_inspection(self, creation_data: InspectionCreationData) -> Inspection:
        """
        Create a new inspection with automatic first-time detection
        
        Args:
            creation_data: InspectionCreationData with inspection details
            
        Returns:
            Created Inspection instance
            
        Raises:
            InspectionServiceError: If creation fails
        """
        try:
            # Get equipment
            equipment = self._get_equipment(creation_data.equipment_id, creation_data.equipment_tag)
            if not equipment:
                raise InspectionServiceError("Equipment not found", "EQUIPMENT_NOT_FOUND")
            
            # Validate equipment using validation service
            validation_service = EquipmentValidationService(self.session)
            validation_result = validation_service.validate_equipment_for_inspection(equipment.tag)
            
            if not validation_result.is_valid:
                error_messages = [error['message'] for error in validation_result.errors]
                raise InspectionServiceError(
                    f"Equipment validation failed: {'; '.join(error_messages)}",
                    "EQUIPMENT_VALIDATION_FAILED"
                )
            
            # Create the inspection
            inspection = Inspection(
                inspection_number=creation_data.inspection_number,
                title=creation_data.title,
                description=creation_data.description,
                actual_start_date=creation_data.actual_start_date or creation_data.start_date or date.today(),
                equipment_id=equipment.id,
                maintenance_event_id=creation_data.maintenance_event_id,
                maintenance_sub_event_id=creation_data.maintenance_sub_event_id,
                # Note: inspection_plan_id not used in unified model
                requesting_department=creation_data.requesting_department,
                work_order=creation_data.work_order,
                permit_number=creation_data.permit_number,
                status=InspectionStatus.InProgress
            )
            
            self.session.add(inspection)
            self.session.commit()
            self.session.refresh(inspection)
            
            return inspection
            
        except InspectionServiceError:
            raise
        except Exception as e:
            self.session.rollback()
            raise InspectionServiceError(f"Failed to create inspection: {str(e)}")
    
    def get_inspection_with_first_time_status(self, inspection_id: int) -> Optional[Dict[str, Any]]:
        """
        Get inspection with first-time status information
        
        Args:
            inspection_id: Inspection ID
            
        Returns:
            Dictionary with inspection data and first-time status
        """
        try:
            inspection = self._get_inspection(inspection_id)
            if not inspection:
                return None
            
            # Get first-time status
            is_first_time = False
            if inspection.equipment:
                is_first_time = InspectionHistoryService.is_first_time_inspection(
                    inspection.equipment.tag, self.session
                )
            
            # Get inspection count for equipment
            inspection_count = 0
            if inspection.equipment:
                inspection_count = InspectionHistoryService.get_equipment_inspection_count(
                    inspection.equipment.tag, self.session
                )
            
            return {
                'inspection': {
                    'id': inspection.id,
                    'inspection_number': inspection.inspection_number,
                    'title': inspection.title,
                    'description': inspection.description,
                    'start_date': inspection.actual_start_date,
                    'end_date': inspection.actual_end_date,
                    'status': inspection.status.value if hasattr(inspection.status, 'value') else str(inspection.status),
                    'equipment_id': inspection.equipment_id,
                    'equipment_tag': inspection.equipment.tag if inspection.equipment else None,
                    'maintenance_event_id': inspection.maintenance_event_id,
                    'maintenance_sub_event_id': inspection.maintenance_sub_event_id,
                    # inspection_plan_id removed from unified model
                    'requesting_department': inspection.requesting_department.value if hasattr(inspection.requesting_department, 'value') else str(inspection.requesting_department),
                    'work_order': inspection.work_order,
                    'permit_number': inspection.permit_number,
                    'created_at': inspection.created_at,
                    'updated_at': inspection.updated_at
                },
                'first_time_status': {
                    'is_first_time': is_first_time,
                    'equipment_inspection_count': inspection_count,
                    'equipment_tag': inspection.equipment.tag if inspection.equipment else None
                }
            }
            
        except Exception as e:
            raise InspectionServiceError(f"Failed to get inspection with first-time status: {str(e)}")
    
    def get_inspections_with_first_time_status(
        self, 
        maintenance_event_id: Optional[int] = None,
        maintenance_sub_event_id: Optional[int] = None,
        status: Optional[InspectionStatus] = None,
        limit: Optional[int] = None
    ) -> List[Dict[str, Any]]:
        """
        Get multiple inspections with first-time status information
        
        Args:
            maintenance_event_id: Filter by maintenance event ID
            maintenance_sub_event_id: Filter by maintenance sub-event ID
            status: Filter by inspection status
            limit: Limit number of results
            
        Returns:
            List of dictionaries with inspection data and first-time status
        """
        try:
            # Build query
            statement = select(Inspection)
            
            if maintenance_event_id:
                statement = statement.where(Inspection.maintenance_event_id == maintenance_event_id)
            
            if maintenance_sub_event_id:
                statement = statement.where(Inspection.maintenance_sub_event_id == maintenance_sub_event_id)
            
            if status:
                statement = statement.where(Inspection.status == status)
            
            if limit:
                statement = statement.limit(limit)
            
            inspections = list(self.session.exec(statement).all())
            
            # Add first-time status to each inspection
            result = []
            for inspection in inspections:
                inspection_data = self.get_inspection_with_first_time_status(inspection.id)
                if inspection_data:
                    result.append(inspection_data)
            
            return result
            
        except Exception as e:
            raise InspectionServiceError(f"Failed to get inspections with first-time status: {str(e)}")
    
    def get_event_inspection_statistics(
        self,
        maintenance_event_id: Optional[int] = None,
        maintenance_sub_event_id: Optional[int] = None
    ) -> Dict[str, Any]:
        """
        Get inspection statistics for an event including first-time count
        
        Args:
            maintenance_event_id: Maintenance event ID
            maintenance_sub_event_id: Maintenance sub-event ID
            
        Returns:
            Dictionary with inspection statistics
        """
        try:
            if not maintenance_event_id and not maintenance_sub_event_id:
                raise InspectionServiceError("Either maintenance_event_id or maintenance_sub_event_id must be provided")
            
            # Get all inspections for the event/sub-event
            inspections = self.get_inspections_with_first_time_status(
                maintenance_event_id=maintenance_event_id,
                maintenance_sub_event_id=maintenance_sub_event_id
            )
            
            # Calculate statistics
            total_inspections = len(inspections)
            planned_count = len([i for i in inspections if i['inspection']['status'] == 'Planned'])
            in_progress_count = len([i for i in inspections if i['inspection']['status'] == 'InProgress'])
            completed_count = len([i for i in inspections if i['inspection']['status'] == 'Completed'])
            first_time_count = len([i for i in inspections if i['first_time_status']['is_first_time']])
            
            # Get first-time count using the service method for accuracy
            service_first_time_count = InspectionHistoryService.get_first_time_inspections_count_for_event(
                maintenance_event_id=maintenance_event_id,
                maintenance_sub_event_id=maintenance_sub_event_id,
                session=self.session
            )
            
            return {
                'total_inspections': total_inspections,
                'status_breakdown': {
                    'planned': planned_count,
                    'in_progress': in_progress_count,
                    'completed': completed_count
                },
                'first_time_inspections': {
                    'count': service_first_time_count,
                    'percentage': (service_first_time_count / total_inspections * 100) if total_inspections > 0 else 0
                },
                'equipment_status': {
                    'under_inspection': in_progress_count,
                    'inspection_completed': completed_count,
                    'planned_for_inspection': planned_count
                }
            }
            
        except InspectionServiceError:
            raise
        except Exception as e:
            raise InspectionServiceError(f"Failed to get event inspection statistics: {str(e)}")
    
    def _get_equipment(self, equipment_id: Optional[int] = None, equipment_tag: Optional[str] = None) -> Optional[Equipment]:
        """Get equipment by ID or tag"""
        try:
            if equipment_id:
                statement = select(Equipment).where(Equipment.id == equipment_id)
            elif equipment_tag:
                statement = select(Equipment).where(Equipment.tag == equipment_tag)
            else:
                return None
            
            return self.session.exec(statement).first()
            
        except Exception as e:
            raise InspectionServiceError(f"Failed to get equipment: {str(e)}")
    
    def _get_inspection(self, inspection_id: int) -> Optional[Inspection]:
        """Get inspection by ID"""
        try:
            statement = select(Inspection).where(Inspection.id == inspection_id)
            return self.session.exec(statement).first()
        except Exception as e:
            raise InspectionServiceError(f"Failed to get inspection: {str(e)}")
    
    def validate_inspection_creation(self, creation_data: InspectionCreationData) -> Dict[str, Any]:
        """
        Validate inspection creation data
        
        Args:
            creation_data: InspectionCreationData to validate
            
        Returns:
            Dictionary with validation results
        """
        try:
            validation_result = {
                'is_valid': True,
                'errors': [],
                'warnings': [],
                'equipment_info': None
            }
            
            # Validate required fields
            if not creation_data.inspection_number:
                validation_result['errors'].append("Inspection number is required")
                validation_result['is_valid'] = False
            
            if not creation_data.title:
                validation_result['errors'].append("Inspection title is required")
                validation_result['is_valid'] = False
            
            if not creation_data.requesting_department:
                validation_result['errors'].append("Requesting department is required")
                validation_result['is_valid'] = False
            
            # Validate equipment
            equipment = self._get_equipment(creation_data.equipment_id, creation_data.equipment_tag)
            if not equipment:
                validation_result['errors'].append("Equipment not found")
                validation_result['is_valid'] = False
            else:
                validation_result['equipment_info'] = {
                    'id': equipment.id,
                    'tag': equipment.tag,
                    'description': equipment.description,
                    'has_active_inspection': InspectionHistoryService.has_active_inspection(equipment.tag, self.session),
                    'is_first_time': InspectionHistoryService.is_first_time_inspection(equipment.tag, self.session),
                    'inspection_count': InspectionHistoryService.get_equipment_inspection_count(equipment.tag, self.session)
                }
                
                # Check for active inspections
                if validation_result['equipment_info']['has_active_inspection']:
                    validation_result['errors'].append(f"Equipment {equipment.tag} already has an active inspection")
                    validation_result['is_valid'] = False
                
                # Add first-time warning
                if validation_result['equipment_info']['is_first_time']:
                    validation_result['warnings'].append(f"This will be the first inspection for equipment {equipment.tag}")
            
            return validation_result
            
        except Exception as e:
            raise InspectionServiceError(f"Failed to validate inspection creation: {str(e)}")