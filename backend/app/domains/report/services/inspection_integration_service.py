"""Integration service for connecting AutoFieldService with inspection data"""

from typing import Optional, Any, Dict
from datetime import datetime, date

from app.domains.report.services.auto_field_service import AutoFieldService, AutoFieldContext, AutoFieldError


class InspectionIntegrationService:
    """Service for integrating AutoFieldService with real inspection data"""
    
    def __init__(self):
        """Initialize the integration service"""
        self.auto_field_service = AutoFieldService()
    
    def create_context_from_inspection(
        self, 
        inspection: Any, 
        equipment: Optional[Any] = None,
        user: Optional[Any] = None,
        daily_report: Optional[Any] = None
    ) -> AutoFieldContext:
        """
        Create AutoFieldContext from real inspection data
        
        Args:
            inspection: Inspection model instance
            equipment: Equipment model instance (optional, will be fetched from inspection if not provided)
            user: User model instance (optional)
            daily_report: DailyReport model instance (optional)
            
        Returns:
            AutoFieldContext populated with real data
        """
        # If equipment not provided, try to get it from inspection
        if equipment is None and hasattr(inspection, 'equipment'):
            equipment = inspection.equipment
        
        return AutoFieldContext(
            inspection=inspection,
            equipment=equipment,
            user=user,
            daily_report=daily_report
        )
    
    def populate_template_fields(
        self, 
        template_fields: list, 
        inspection: Any,
        equipment: Optional[Any] = None,
        user: Optional[Any] = None,
        daily_report: Optional[Any] = None
    ) -> Dict[str, Any]:
        """
        Populate template fields with auto-field values from inspection data
        
        Args:
            template_fields: List of template field objects with auto_source_key
            inspection: Inspection model instance
            equipment: Equipment model instance (optional)
            user: User model instance (optional)
            daily_report: DailyReport model instance (optional)
            
        Returns:
            Dictionary mapping field IDs to populated values
        """
        context = self.create_context_from_inspection(inspection, equipment, user, daily_report)
        results = {}
        errors = {}
        
        for field in template_fields:
            # Only process auto fields
            if not hasattr(field, 'value_source') or field.value_source != 'auto':
                continue
            
            if not hasattr(field, 'auto_source_key') or not field.auto_source_key:
                continue
            
            try:
                value = self.auto_field_service.populate_field(field.auto_source_key, context)
                results[field.id] = value
            except AutoFieldError as e:
                errors[field.id] = str(e)
        
        # Log errors if any (in a real implementation, use proper logging)
        if errors:
            print(f"Auto-field population errors: {errors}")
        
        return results
    
    def get_inspection_summary(self, inspection: Any) -> Dict[str, Any]:
        """
        Get a summary of inspection data for auto-field population
        
        Args:
            inspection: Inspection model instance
            
        Returns:
            Dictionary with inspection summary data
        """
        summary = {
            'id': getattr(inspection, 'id', None),
            'number': getattr(inspection, 'inspection_number', None),
            'title': getattr(inspection, 'title', None),
            'start_date': getattr(inspection, 'actual_start_date', None),
            'end_date': getattr(inspection, 'end_date', None),
            'status': getattr(inspection, 'status', None),
            'equipment_id': getattr(inspection, 'equipment_id', None),
        }
        
        # Add equipment data if available
        if hasattr(inspection, 'equipment') and inspection.equipment:
            equipment = inspection.equipment
            summary['equipment'] = {
                'id': getattr(equipment, 'id', None),
                'tag': getattr(equipment, 'tag', None),
                'description': getattr(equipment, 'description', None),
                'unit': getattr(equipment, 'unit', None),
                'equipment_type': getattr(equipment, 'equipment_type', None),
            }
        
        return summary
    
    def validate_inspection_for_auto_fields(self, inspection: Any) -> Dict[str, bool]:
        """
        Validate if inspection has required data for auto-field population
        
        Args:
            inspection: Inspection model instance
            
        Returns:
            Dictionary mapping auto-source keys to availability status
        """
        validation_results = {}
        
        # Check inspection fields
        validation_results['inspection.start_date'] = hasattr(inspection, 'start_date') and inspection.start_date is not None
        validation_results['inspection.end_date'] = hasattr(inspection, 'end_date') and inspection.end_date is not None
        validation_results['inspection.status'] = hasattr(inspection, 'status') and inspection.status is not None
        validation_results['inspection.number'] = hasattr(inspection, 'inspection_number') and inspection.inspection_number is not None
        
        # Check equipment fields
        equipment = getattr(inspection, 'equipment', None)
        validation_results['equipment.tag'] = equipment is not None and hasattr(equipment, 'tag') and equipment.tag is not None
        validation_results['equipment.name'] = equipment is not None and hasattr(equipment, 'description') and equipment.description is not None
        validation_results['equipment.location'] = equipment is not None and hasattr(equipment, 'unit') and equipment.unit is not None
        
        # Current date/time are always available
        validation_results['current.date'] = True
        validation_results['current.time'] = True
        
        # Report serial number can always be generated
        validation_results['report.serial_number'] = True
        
        return validation_results
    
    def get_available_auto_sources_for_inspection(self, inspection: Any) -> Dict[str, str]:
        """
        Get available auto-source keys for a specific inspection
        
        Args:
            inspection: Inspection model instance
            
        Returns:
            Dictionary of available auto-source keys and their descriptions
        """
        all_sources = self.auto_field_service.get_available_sources()
        validation_results = self.validate_inspection_for_auto_fields(inspection)
        
        # Filter sources based on data availability
        available_sources = {}
        for source_key, description in all_sources.items():
            if validation_results.get(source_key, False):
                available_sources[source_key] = description
        
        return available_sources
    
    def populate_field_with_inspection_data(
        self, 
        source_key: str, 
        inspection: Any,
        equipment: Optional[Any] = None,
        user: Optional[Any] = None,
        daily_report: Optional[Any] = None
    ) -> Any:
        """
        Populate a single field with inspection data
        
        Args:
            source_key: Auto-source key (e.g., 'inspection.start_date')
            inspection: Inspection model instance
            equipment: Equipment model instance (optional)
            user: User model instance (optional)
            daily_report: DailyReport model instance (optional)
            
        Returns:
            Populated field value
            
        Raises:
            AutoFieldError: If population fails
        """
        context = self.create_context_from_inspection(inspection, equipment, user, daily_report)
        return self.auto_field_service.populate_field(source_key, context)