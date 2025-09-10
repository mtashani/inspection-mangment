"""InspectionCompletionService for handling inspection completion workflow"""

from datetime import datetime, date
from typing import Optional, List, Dict, Any
from sqlmodel import Session, select

from app.domains.inspection.models.inspection import Inspection
from app.domains.inspection.models.enums import InspectionStatus


class InspectionCompletionError(Exception):
    """Exception raised by InspectionCompletionService operations"""
    
    def __init__(self, message: str, error_code: str = None):
        self.message = message
        self.error_code = error_code
        super().__init__(message)


class InspectionCompletionResult:
    """Result of inspection completion check"""
    
    def __init__(self):
        self.can_complete = True
        self.is_completed = False
        self.completion_percentage = 0.0
        self.missing_requirements = []
        self.warnings = []
        self.completion_date = None
    
    def add_missing_requirement(self, requirement: str, description: str = None):
        """Add missing requirement"""
        self.can_complete = False
        self.missing_requirements.append({
            'requirement': requirement,
            'description': description or requirement
        })
    
    def add_warning(self, message: str):
        """Add warning"""
        self.warnings.append(message)
    
    def get_summary(self) -> Dict[str, Any]:
        """Get completion summary"""
        return {
            'can_complete': self.can_complete,
            'is_completed': self.is_completed,
            'completion_percentage': self.completion_percentage,
            'missing_requirements': self.missing_requirements,
            'warnings': self.warnings,
            'completion_date': self.completion_date
        }


class InspectionCompletionService:
    """Service for managing inspection completion workflow"""
    
    def __init__(self, session: Session):
        """Initialize the inspection completion service"""
        self.session = session
    
    def check_completion_status(self, inspection_id: int) -> InspectionCompletionResult:
        """
        Check if inspection can be completed
        
        Args:
            inspection_id: Inspection ID to check
            
        Returns:
            InspectionCompletionResult with completion status
            
        Raises:
            InspectionCompletionError: If check fails
        """
        try:
            inspection = self.get_inspection(inspection_id)
            if not inspection:
                raise InspectionCompletionError(f"Inspection {inspection_id} not found", "INSPECTION_NOT_FOUND")
            
            result = InspectionCompletionResult()
            
            # Check if already completed
            if inspection.status == InspectionStatus.Completed:
                result.is_completed = True
                result.completion_percentage = 100.0
                result.completion_date = inspection.actual_end_date
                return result
            
            # Check basic requirements
            self._check_basic_requirements(inspection, result)
            
            # Check timeline requirements
            self._check_timeline_requirements(inspection, result)
            
            # Check documentation requirements
            self._check_documentation_requirements(inspection, result)
            
            # Calculate completion percentage
            result.completion_percentage = self._calculate_completion_percentage(inspection, result)
            
            return result
            
        except InspectionCompletionError:
            raise
        except Exception as e:
            raise InspectionCompletionError(f"Failed to check completion status: {str(e)}")
    
    def complete_inspection(self, inspection_id: int, completion_notes: Optional[str] = None) -> bool:
        """
        Complete an inspection
        
        Args:
            inspection_id: Inspection ID to complete
            completion_notes: Optional completion notes
            
        Returns:
            True if completed successfully, False otherwise
            
        Raises:
            InspectionCompletionError: If completion fails
        """
        try:
            inspection = self.get_inspection(inspection_id)
            if not inspection:
                raise InspectionCompletionError(f"Inspection {inspection_id} not found", "INSPECTION_NOT_FOUND")
            
            # Check if can be completed
            completion_status = self.check_completion_status(inspection_id)
            if not completion_status.can_complete:
                raise InspectionCompletionError(
                    f"Inspection cannot be completed. Missing requirements: {len(completion_status.missing_requirements)}",
                    "COMPLETION_REQUIREMENTS_NOT_MET"
                )
            
            # Update inspection status
            inspection.status = InspectionStatus.Completed
            inspection.actual_end_date = date.today()
            inspection.updated_at = datetime.utcnow()
            
            if completion_notes:
                # Add completion notes to final_report field if available
                if inspection.final_report:
                    inspection.final_report += f"\n\nCompletion Notes: {completion_notes}"
                else:
                    inspection.final_report = f"Completion Notes: {completion_notes}"
            
            self.session.add(inspection)
            self.session.commit()
            
            return True
            
        except InspectionCompletionError:
            raise
        except Exception as e:
            self.session.rollback()
            raise InspectionCompletionError(f"Failed to complete inspection: {str(e)}")
    
    def get_inspection(self, inspection_id: int) -> Optional[Inspection]:
        """
        Get inspection by ID
        
        Args:
            inspection_id: Inspection ID
            
        Returns:
            Inspection instance or None if not found
        """
        try:
            statement = select(Inspection).where(Inspection.id == inspection_id)
            return self.session.exec(statement).first()
        except Exception as e:
            raise InspectionCompletionError(f"Failed to get inspection: {str(e)}")
    
    def get_completed_inspections(self, limit: Optional[int] = None) -> List[Inspection]:
        """
        Get completed inspections
        
        Args:
            limit: Optional limit on number of results
            
        Returns:
            List of completed Inspection instances
        """
        try:
            statement = select(Inspection).where(Inspection.status == InspectionStatus.Completed)
            if limit:
                statement = statement.limit(limit)
            
            return list(self.session.exec(statement).all())
        except Exception as e:
            raise InspectionCompletionError(f"Failed to get completed inspections: {str(e)}")
    
    def get_pending_completion_inspections(self) -> List[Inspection]:
        """
        Get inspections that are pending completion
        
        Returns:
            List of Inspection instances that can be completed
        """
        try:
            # Get inspections that are in progress
            statement = select(Inspection).where(Inspection.status == InspectionStatus.InProgress)
            inspections = list(self.session.exec(statement).all())
            
            # Filter to those that can be completed
            pending_completion = []
            for inspection in inspections:
                try:
                    completion_status = self.check_completion_status(inspection.id)
                    if completion_status.can_complete:
                        pending_completion.append(inspection)
                except Exception:
                    # Skip inspections that can't be checked
                    continue
            
            return pending_completion
            
        except Exception as e:
            raise InspectionCompletionError(f"Failed to get pending completion inspections: {str(e)}")
    
    def _check_basic_requirements(self, inspection: Inspection, result: InspectionCompletionResult):
        """Check basic inspection requirements"""
        
        # Check if inspection has started
        if not inspection.actual_start_date:
            result.add_missing_requirement("actual_start_date", "Inspection actual start date is required")
        
        # Check if inspection is in progress
        if inspection.status not in [InspectionStatus.InProgress, InspectionStatus.Completed]:
            result.add_missing_requirement("status", "Inspection must be in progress to be completed")
        
        # Check if equipment is assigned
        if not inspection.equipment_id:
            result.add_missing_requirement("equipment", "Equipment assignment is required")
    
    def _check_timeline_requirements(self, inspection: Inspection, result: InspectionCompletionResult):
        """Check timeline-related requirements"""
        
        # Check if start date is not in the future
        if inspection.actual_start_date and inspection.actual_start_date > date.today():
            result.add_missing_requirement("actual_start_date_future", "Inspection actual start date cannot be in the future")
        
        # Check if inspection has been running for a reasonable time
        if inspection.actual_start_date:
            days_running = (date.today() - inspection.actual_start_date).days
            if days_running < 0:
                result.add_missing_requirement("negative_duration", "Invalid inspection duration")
            elif days_running == 0:
                result.add_warning("Inspection started today - consider if sufficient time has passed")
    
    def _check_documentation_requirements(self, inspection: Inspection, result: InspectionCompletionResult):
        """Check documentation requirements"""
        
        # Check if inspection has a title
        if not inspection.title or inspection.title.strip() == "":
            result.add_missing_requirement("title", "Inspection title is required")
        
        # Check if inspection has description (optional but recommended)
        if not inspection.description or inspection.description.strip() == "":
            result.add_warning("Inspection description is recommended for better documentation")
        
        # Check if work order is provided (if required by organization)
        if not inspection.work_order:
            result.add_warning("Work order number is recommended for tracking")
    
    def _calculate_completion_percentage(self, inspection: Inspection, result: InspectionCompletionResult) -> float:
        """Calculate completion percentage based on requirements"""
        
        total_requirements = 5  # Basic requirements count
        met_requirements = 0
        
        # Count met requirements
        if inspection.actual_start_date:
            met_requirements += 1
        
        if inspection.status == InspectionStatus.InProgress:
            met_requirements += 1
        
        if inspection.equipment_id:
            met_requirements += 1
        
        if inspection.title and inspection.title.strip():
            met_requirements += 1
        
        if inspection.actual_start_date and inspection.actual_start_date <= date.today():
            met_requirements += 1
        
        return (met_requirements / total_requirements) * 100.0
    
    def get_inspection_summary(self, inspection_id: int) -> Optional[Dict[str, Any]]:
        """
        Get inspection summary for completion workflow
        
        Args:
            inspection_id: Inspection ID
            
        Returns:
            Dictionary with inspection summary or None if not found
        """
        try:
            inspection = self.get_inspection(inspection_id)
            if not inspection:
                return None
            
            completion_status = self.check_completion_status(inspection_id)
            
            return {
                'inspection': {
                    'id': inspection.id,
                    'number': inspection.inspection_number,
                    'title': inspection.title,
                    'description': inspection.description,
                    'start_date': inspection.actual_start_date,
                    'end_date': inspection.actual_end_date,
                    'status': inspection.status.value if hasattr(inspection.status, 'value') else str(inspection.status),
                    'equipment_id': inspection.equipment_id,
                    'work_order': inspection.work_order,
                    'created_at': inspection.created_at,
                    'updated_at': inspection.updated_at
                },
                'completion_status': completion_status.get_summary(),
                'final_reports_count': len(inspection.final_reports) if hasattr(inspection, 'final_reports') else 0
            }
            
        except Exception as e:
            raise InspectionCompletionError(f"Failed to get inspection summary: {str(e)}")
    
    def trigger_report_creation_workflow(self, inspection_id: int) -> Dict[str, Any]:
        """
        Trigger report creation workflow after inspection completion
        
        Args:
            inspection_id: Inspection ID
            
        Returns:
            Dictionary with workflow trigger result
        """
        try:
            inspection = self.get_inspection(inspection_id)
            if not inspection:
                return {
                    'success': False,
                    'error': f'Inspection {inspection_id} not found'
                }
            
            # Check if inspection is completed
            if inspection.status != InspectionStatus.Completed:
                return {
                    'success': False,
                    'error': 'Inspection must be completed before creating reports'
                }
            
            # This would typically trigger the report selection popup
            # For now, we return the data needed for report creation
            return {
                'success': True,
                'inspection_id': inspection_id,
                'inspection_data': {
                    'id': inspection.id,
                    'number': inspection.inspection_number,
                    'title': inspection.title,
                    'start_date': inspection.actual_start_date,
                    'end_date': inspection.actual_end_date,
                    'equipment_id': inspection.equipment_id
                },
                'message': 'Ready for report creation',
                'next_step': 'show_template_selection'
            }
            
        except Exception as e:
            return {
                'success': False,
                'error': f'Failed to trigger report workflow: {str(e)}'
            }