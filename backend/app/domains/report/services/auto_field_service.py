"""AutoFieldService for automatic field population"""

from datetime import datetime, date
from typing import Any, Dict, Optional, Union
from dataclasses import dataclass


# Auto-source definitions based on design document
AUTO_SOURCES = {
    "inspection.start_date": "Inspection start date",
    "inspection.end_date": "Inspection end date", 
    "inspection.status": "Inspection status",
    "inspection.number": "Inspection number",
    "equipment.tag": "Equipment tag",
    "equipment.name": "Equipment name",
    "equipment.location": "Equipment location",
    "daily_report.inspectors": "List of involved inspectors",
    "report.serial_number": "Report serial number",
    "user.full_name": "Report creator full name",
    "user.department": "User department",
    "current.date": "Current date",
    "current.time": "Current time"
}


@dataclass
class AutoFieldContext:
    """Context data for auto-field population"""
    inspection: Optional[Any] = None
    equipment: Optional[Any] = None
    user: Optional[Any] = None
    daily_report: Optional[Any] = None


class AutoFieldError(Exception):
    """Exception raised when auto-field population fails"""
    
    def __init__(self, source_key: str, message: str):
        self.source_key = source_key
        self.message = message
        super().__init__(f"Auto-field error for '{source_key}': {message}")


class AutoFieldService:
    """Service for automatic field population"""
    
    def __init__(self):
        """Initialize the auto-field service"""
        pass
    
    def get_available_sources(self) -> Dict[str, str]:
        """Get all available auto-source keys and their descriptions"""
        return AUTO_SOURCES.copy()
    
    def validate_source_key(self, source_key: str) -> bool:
        """Validate if a source key is supported"""
        return source_key in AUTO_SOURCES
    
    def populate_field(self, source_key: str, context: AutoFieldContext) -> Any:
        """
        Populate a field value based on the source key and context
        
        Args:
            source_key: The auto-source key (e.g., 'inspection.start_date')
            context: Context data containing inspection, equipment, user, etc.
            
        Returns:
            The populated field value
            
        Raises:
            AutoFieldError: If the source key is invalid or data is missing
        """
        if not self.validate_source_key(source_key):
            raise AutoFieldError(source_key, f"Unknown source key: {source_key}")
        
        try:
            # Split the source key to get object and attribute
            parts = source_key.split('.')
            if len(parts) != 2:
                raise AutoFieldError(source_key, "Invalid source key format")
            
            object_name, attribute_name = parts
            
            # Handle different object types
            if object_name == "inspection":
                return self._get_inspection_value(attribute_name, context.inspection)
            elif object_name == "equipment":
                return self._get_equipment_value(attribute_name, context.equipment)
            elif object_name == "user":
                return self._get_user_value(attribute_name, context.user)
            elif object_name == "daily_report":
                return self._get_daily_report_value(attribute_name, context.daily_report)
            elif object_name == "report":
                return self._get_report_value(attribute_name, context)
            elif object_name == "current":
                return self._get_current_value(attribute_name)
            else:
                raise AutoFieldError(source_key, f"Unknown object type: {object_name}")
                
        except Exception as e:
            if isinstance(e, AutoFieldError):
                raise
            raise AutoFieldError(source_key, f"Error retrieving value: {str(e)}")
    
    def _get_inspection_value(self, attribute: str, inspection: Any) -> Any:
        """Get value from inspection object"""
        if inspection is None:
            raise AutoFieldError(f"inspection.{attribute}", "Inspection data not available")
        
        if attribute == "start_date":
            return getattr(inspection, 'start_date', None)
        elif attribute == "end_date":
            return getattr(inspection, 'end_date', None)
        elif attribute == "status":
            return getattr(inspection, 'status', None)
        elif attribute == "number":
            return getattr(inspection, 'number', None)
        else:
            raise AutoFieldError(f"inspection.{attribute}", f"Unknown inspection attribute: {attribute}")
    
    def _get_equipment_value(self, attribute: str, equipment: Any) -> Any:
        """Get value from equipment object"""
        if equipment is None:
            raise AutoFieldError(f"equipment.{attribute}", "Equipment data not available")
        
        if attribute == "tag":
            return getattr(equipment, 'tag', None)
        elif attribute == "name":
            return getattr(equipment, 'name', None)
        elif attribute == "location":
            return getattr(equipment, 'location', None)
        else:
            raise AutoFieldError(f"equipment.{attribute}", f"Unknown equipment attribute: {attribute}")
    
    def _get_user_value(self, attribute: str, user: Any) -> Any:
        """Get value from user object"""
        if user is None:
            raise AutoFieldError(f"user.{attribute}", "User data not available")
        
        if attribute == "full_name":
            return getattr(user, 'full_name', None)
        elif attribute == "department":
            return getattr(user, 'department', None)
        else:
            raise AutoFieldError(f"user.{attribute}", f"Unknown user attribute: {attribute}")
    
    def _get_daily_report_value(self, attribute: str, daily_report: Any) -> Any:
        """Get value from daily report object"""
        if daily_report is None:
            raise AutoFieldError(f"daily_report.{attribute}", "Daily report data not available")
        
        if attribute == "inspectors":
            return getattr(daily_report, 'inspectors', None)
        else:
            raise AutoFieldError(f"daily_report.{attribute}", f"Unknown daily report attribute: {attribute}")
    
    def _get_report_value(self, attribute: str, context: AutoFieldContext) -> Any:
        """Get report-specific values"""
        if attribute == "serial_number":
            # Generate a serial number based on current timestamp and inspection
            timestamp = datetime.now().strftime("%Y%m%d%H%M%S")
            inspection_id = getattr(context.inspection, 'id', 'UNK') if context.inspection else 'UNK'
            return f"RPT-{inspection_id}-{timestamp}"
        else:
            raise AutoFieldError(f"report.{attribute}", f"Unknown report attribute: {attribute}")
    
    def _get_current_value(self, attribute: str) -> Any:
        """Get current date/time values"""
        if attribute == "date":
            return date.today()
        elif attribute == "time":
            return datetime.now().time()
        else:
            raise AutoFieldError(f"current.{attribute}", f"Unknown current attribute: {attribute}")
    
    def populate_multiple_fields(self, field_mappings: Dict[str, str], context: AutoFieldContext) -> Dict[str, Any]:
        """
        Populate multiple fields at once
        
        Args:
            field_mappings: Dictionary mapping field names to source keys
            context: Context data for population
            
        Returns:
            Dictionary mapping field names to populated values
        """
        results = {}
        errors = {}
        
        for field_name, source_key in field_mappings.items():
            try:
                results[field_name] = self.populate_field(source_key, context)
            except AutoFieldError as e:
                errors[field_name] = str(e)
        
        if errors:
            # Log errors but return successful results
            # In a real implementation, you might want to log these errors
            pass
        
        return results