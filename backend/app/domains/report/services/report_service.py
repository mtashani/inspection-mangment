"""ReportService for managing report submission and processing"""

import json
from datetime import datetime, date
from typing import Optional, List, Dict, Any, Union
from sqlmodel import Session, select
from sqlalchemy.exc import IntegrityError

from app.domains.report.models.final_report import FinalReport
from app.domains.report.models.report_field_value import ReportFieldValue
from app.domains.report.models.template import Template
from app.domains.report.models.template_field import TemplateField
from app.domains.report.models.enums import ReportStatus, FieldType, ValueSource
from app.domains.report.services.template_service import TemplateService
from app.domains.report.services.inspection_integration_service import InspectionIntegrationService


class ReportServiceError(Exception):
    """Exception raised by ReportService operations"""
    
    def __init__(self, message: str, error_code: str = None):
        self.message = message
        self.error_code = error_code
        super().__init__(message)


class FieldValidationError(Exception):
    """Exception raised during field validation"""
    
    def __init__(self, field_id: int, field_label: str, message: str, error_code: str = None):
        self.field_id = field_id
        self.field_label = field_label
        self.message = message
        self.error_code = error_code
        super().__init__(f"Field '{field_label}' (ID: {field_id}): {message}")


class ReportSubmissionResult:
    """Result of report submission"""
    
    def __init__(self):
        self.success = True
        self.report_id = None
        self.errors = []
        self.warnings = []
        self.field_errors = {}
    
    def add_error(self, message: str, error_code: str = None):
        """Add general error"""
        self.success = False
        self.errors.append({
            'message': message,
            'error_code': error_code,
            'type': 'error'
        })
    
    def add_warning(self, message: str, error_code: str = None):
        """Add warning"""
        self.warnings.append({
            'message': message,
            'error_code': error_code,
            'type': 'warning'
        })
    
    def add_field_error(self, field_id: int, field_label: str, message: str, error_code: str = None):
        """Add field-specific error"""
        self.success = False
        if field_id not in self.field_errors:
            self.field_errors[field_id] = []
        
        self.field_errors[field_id].append({
            'field_label': field_label,
            'message': message,
            'error_code': error_code,
            'type': 'field_error'
        })
    
    def get_summary(self) -> Dict[str, Any]:
        """Get submission result summary"""
        return {
            'success': self.success,
            'report_id': self.report_id,
            'error_count': len(self.errors),
            'warning_count': len(self.warnings),
            'field_error_count': sum(len(errors) for errors in self.field_errors.values()),
            'errors': self.errors,
            'warnings': self.warnings,
            'field_errors': self.field_errors
        }


class ReportService:
    """Service for managing report submission and processing"""
    
    def __init__(self, session: Session):
        """Initialize the report service"""
        self.session = session
        self.template_service = TemplateService(session)
        self.integration_service = InspectionIntegrationService()
    
    # Report Creation and Submission
    
    def create_report_from_template(
        self, 
        template_id: int, 
        inspection_id: int,
        created_by: Optional[int] = None,
        field_values: Optional[Dict[int, Any]] = None,
        inspection_data: Optional[Any] = None,
        equipment_data: Optional[Any] = None,
        user_data: Optional[Any] = None,
        auto_populate: bool = True
    ) -> ReportSubmissionResult:
        """
        Create a new report from template
        
        Args:
            template_id: Template ID to use
            inspection_id: Inspection ID this report belongs to
            created_by: User ID who created the report
            field_values: Dictionary mapping field IDs to values
            inspection_data: Inspection data for auto-field population
            equipment_data: Equipment data for auto-field population
            user_data: User data for auto-field population
            auto_populate: Whether to auto-populate fields
            
        Returns:
            ReportSubmissionResult with creation details
        """
        result = ReportSubmissionResult()
        
        try:
            # Get template with structure
            template = self.template_service.get_template_with_structure(template_id)
            if not template:
                result.add_error(f"Template {template_id} not found", "TEMPLATE_NOT_FOUND")
                return result
            
            if not template.is_active:
                result.add_error("Template is not active", "TEMPLATE_INACTIVE")
                return result
            
            # Validate template structure
            validation_result = self.template_service.validate_template_structure(template_id)
            if not validation_result.is_valid:
                result.add_error("Template has validation errors", "TEMPLATE_INVALID")
                for error in validation_result.errors:
                    result.add_error(f"Template validation: {error['message']}", error.get('error_code'))
                return result
            
            # Create final report
            final_report = FinalReport(
                inspection_id=inspection_id,
                template_id=template_id,
                created_by=created_by,
                status=ReportStatus.DRAFT,
                created_at=datetime.utcnow(),
                updated_at=datetime.utcnow()
            )
            
            self.session.add(final_report)
            self.session.flush()  # Get the ID
            
            # Generate serial number
            final_report.report_serial_number = self._generate_serial_number(final_report.id, inspection_id)
            
            # Auto-populate fields if requested
            combined_field_values = {}
            if auto_populate:
                auto_populated_values = self._auto_populate_fields(
                    template, 
                    inspection_data, 
                    equipment_data, 
                    user_data, 
                    result
                )
                combined_field_values.update(auto_populated_values)
            
            # Add manual field values (these override auto-populated values)
            if field_values:
                combined_field_values.update(field_values)
            
            # Process all field values
            if combined_field_values:
                self._process_field_values(final_report, template, combined_field_values, result)
            
            # If there were field errors, don't commit
            if not result.success:
                self.session.rollback()
                return result
            
            self.session.commit()
            result.report_id = final_report.id
            
            return result
            
        except Exception as e:
            self.session.rollback()
            result.add_error(f"Failed to create report: {str(e)}", "CREATION_FAILED")
            return result
    
    def submit_report(
        self, 
        report_id: int, 
        field_values: Dict[int, Any],
        validate_required: bool = True
    ) -> ReportSubmissionResult:
        """
        Submit a report with field values
        
        Args:
            report_id: Report ID to submit
            field_values: Dictionary mapping field IDs to values
            validate_required: Whether to validate required fields
            
        Returns:
            ReportSubmissionResult with submission details
        """
        result = ReportSubmissionResult()
        
        try:
            # Get report
            report = self.get_report(report_id)
            if not report:
                result.add_error(f"Report {report_id} not found", "REPORT_NOT_FOUND")
                return result
            
            if report.status == ReportStatus.SUBMITTED:
                result.add_error("Report already submitted", "ALREADY_SUBMITTED")
                return result
            
            # Get template with structure
            template = self.template_service.get_template_with_structure(report.template_id)
            if not template:
                result.add_error("Template not found", "TEMPLATE_NOT_FOUND")
                return result
            
            # Clear existing field values
            existing_values = self.session.exec(
                select(ReportFieldValue).where(ReportFieldValue.final_report_id == report_id)
            ).all()
            
            for value in existing_values:
                self.session.delete(value)
            
            # Process new field values
            self._process_field_values(report, template, field_values, result, validate_required)
            
            if not result.success:
                self.session.rollback()
                return result
            
            # Update report status
            report.status = ReportStatus.SUBMITTED
            report.updated_at = datetime.utcnow()
            
            self.session.add(report)
            self.session.commit()
            
            result.report_id = report_id
            return result
            
        except Exception as e:
            self.session.rollback()
            result.add_error(f"Failed to submit report: {str(e)}", "SUBMISSION_FAILED")
            return result
    
    def _process_field_values(
        self, 
        report: FinalReport, 
        template: Template, 
        field_values: Dict[int, Any], 
        result: ReportSubmissionResult,
        validate_required: bool = True
    ):
        """Process and validate field values"""
        
        # Get all fields from template
        all_fields = {}
        required_fields = set()
        
        for section in template.sections:
            for subsection in section.subsections:
                for field in subsection.fields:
                    all_fields[field.id] = field
                    if field.is_required and validate_required:
                        required_fields.add(field.id)
        
        # Check required fields
        if validate_required:
            for field_id in required_fields:
                if field_id not in field_values or field_values[field_id] is None:
                    field = all_fields[field_id]
                    result.add_field_error(
                        field_id, 
                        field.label, 
                        "Required field is missing", 
                        "REQUIRED_FIELD_MISSING"
                    )
        
        # Process provided field values
        for field_id, value in field_values.items():
            if field_id not in all_fields:
                result.add_warning(f"Unknown field ID: {field_id}", "UNKNOWN_FIELD")
                continue
            
            field = all_fields[field_id]
            
            try:
                # Validate and convert field value
                converted_value = self._validate_and_convert_field_value(field, value)
                
                # Create field value record
                field_value = ReportFieldValue(
                    final_report_id=report.id,
                    template_field_id=field_id
                )
                
                # Store value in appropriate column
                self._store_field_value(field_value, field.field_type, converted_value)
                
                self.session.add(field_value)
                
            except FieldValidationError as e:
                result.add_field_error(e.field_id, e.field_label, e.message, e.error_code)
            except Exception as e:
                result.add_field_error(field_id, field.label, f"Processing error: {str(e)}", "PROCESSING_ERROR")
    
    def _validate_and_convert_field_value(self, field: TemplateField, value: Any) -> Any:
        """Validate and convert field value based on field type"""
        
        if value is None:
            return None
        
        try:
            if field.field_type == FieldType.TEXT or field.field_type == FieldType.TEXTAREA:
                if not isinstance(value, str):
                    value = str(value)
                return value.strip()
            
            elif field.field_type == FieldType.NUMBER:
                if isinstance(value, str):
                    value = value.strip()
                    if value == "":
                        return None
                return float(value)
            
            elif field.field_type == FieldType.DATE:
                if isinstance(value, str):
                    # Try to parse date string
                    try:
                        return datetime.strptime(value, "%Y-%m-%d").date()
                    except ValueError:
                        try:
                            return datetime.strptime(value, "%d/%m/%Y").date()
                        except ValueError:
                            raise FieldValidationError(
                                field.id, 
                                field.label, 
                                "Invalid date format. Use YYYY-MM-DD or DD/MM/YYYY", 
                                "INVALID_DATE_FORMAT"
                            )
                elif isinstance(value, date):
                    return value
                elif isinstance(value, datetime):
                    return value.date()
                else:
                    raise FieldValidationError(
                        field.id, 
                        field.label, 
                        "Invalid date value", 
                        "INVALID_DATE_VALUE"
                    )
            
            elif field.field_type == FieldType.CHECKBOX:
                if isinstance(value, str):
                    return value.lower() in ('true', '1', 'yes', 'on')
                return bool(value)
            
            elif field.field_type == FieldType.SELECT:
                if not isinstance(value, str):
                    value = str(value)
                
                # Validate against options if available
                if field.options:
                    try:
                        options = json.loads(field.options)
                        if isinstance(options, list) and value not in options:
                            raise FieldValidationError(
                                field.id,
                                field.label,
                                f"Value '{value}' not in allowed options: {options}",
                                "INVALID_SELECT_VALUE"
                            )
                    except json.JSONDecodeError:
                        pass  # Skip validation if options are malformed
                
                return value
            
            elif field.field_type == FieldType.IMAGE or field.field_type == FieldType.FILE:
                # For files, we expect a file path or URL
                if not isinstance(value, str):
                    value = str(value)
                return value.strip()
            
            else:
                # For unknown types, store as string
                return str(value)
                
        except FieldValidationError:
            raise
        except Exception as e:
            raise FieldValidationError(
                field.id,
                field.label,
                f"Value conversion error: {str(e)}",
                "CONVERSION_ERROR"
            )
    
    def _store_field_value(self, field_value: ReportFieldValue, field_type: FieldType, value: Any):
        """Store value in appropriate column based on field type"""
        
        if value is None:
            return
        
        if field_type == FieldType.TEXT or field_type == FieldType.TEXTAREA:
            field_value.text_value = value
        elif field_type == FieldType.NUMBER:
            field_value.number_value = value
        elif field_type == FieldType.DATE:
            field_value.date_value = value
        elif field_type == FieldType.CHECKBOX:
            field_value.boolean_value = value
        elif field_type == FieldType.SELECT:
            field_value.text_value = value
        elif field_type == FieldType.IMAGE or field_type == FieldType.FILE:
            field_value.text_value = value
        else:
            # For complex types or unknown types, use JSON
            field_value.json_value = json.dumps(value) if not isinstance(value, str) else value
    
    def _generate_serial_number(self, report_id: int, inspection_id: int) -> str:
        """Generate unique serial number for report"""
        timestamp = datetime.now().strftime("%Y%m%d%H%M%S")
        return f"RPT-{inspection_id}-{report_id}-{timestamp}"
    
    # Report Retrieval and Management
    
    def get_report(self, report_id: int) -> Optional[FinalReport]:
        """
        Get report by ID
        
        Args:
            report_id: Report ID
            
        Returns:
            FinalReport instance or None if not found
        """
        try:
            statement = select(FinalReport).where(FinalReport.id == report_id)
            return self.session.exec(statement).first()
        except Exception as e:
            raise ReportServiceError(f"Failed to get report: {str(e)}")
    
    def get_report_with_values(self, report_id: int) -> Optional[Dict[str, Any]]:
        """
        Get report with all field values
        
        Args:
            report_id: Report ID
            
        Returns:
            Dictionary with report data and field values or None if not found
        """
        try:
            report = self.get_report(report_id)
            if not report:
                return None
            
            # Get field values
            field_values = self.session.exec(
                select(ReportFieldValue).where(ReportFieldValue.final_report_id == report_id)
            ).all()
            
            # Get template structure
            template = self.template_service.get_template_with_structure(report.template_id)
            
            # Build field values dictionary
            values_dict = {}
            field_info = {}
            
            # Create field info lookup
            if template:
                for section in template.sections:
                    for subsection in section.subsections:
                        for field in subsection.fields:
                            field_info[field.id] = {
                                'label': field.label,
                                'field_type': field.field_type,
                                'section': section.title,
                                'subsection': subsection.title
                            }
            
            # Extract values
            for field_value in field_values:
                field_id = field_value.template_field_id
                
                # Get the actual value based on field type
                value = None
                if field_value.text_value is not None:
                    value = field_value.text_value
                elif field_value.number_value is not None:
                    value = field_value.number_value
                elif field_value.date_value is not None:
                    value = field_value.date_value
                elif field_value.boolean_value is not None:
                    value = field_value.boolean_value
                elif field_value.json_value is not None:
                    try:
                        value = json.loads(field_value.json_value)
                    except json.JSONDecodeError:
                        value = field_value.json_value
                
                values_dict[field_id] = {
                    'value': value,
                    'field_info': field_info.get(field_id, {})
                }
            
            return {
                'report': {
                    'id': report.id,
                    'inspection_id': report.inspection_id,
                    'template_id': report.template_id,
                    'created_by': report.created_by,
                    'serial_number': report.report_serial_number,
                    'status': report.status,
                    'created_at': report.created_at,
                    'updated_at': report.updated_at
                },
                'template': {
                    'id': template.id if template else None,
                    'name': template.name if template else None
                },
                'field_values': values_dict
            }
            
        except Exception as e:
            raise ReportServiceError(f"Failed to get report with values: {str(e)}")
    
    def get_reports_by_inspection(self, inspection_id: int) -> List[FinalReport]:
        """
        Get all reports for an inspection
        
        Args:
            inspection_id: Inspection ID
            
        Returns:
            List of FinalReport instances
        """
        try:
            statement = select(FinalReport).where(FinalReport.inspection_id == inspection_id)
            return list(self.session.exec(statement).all())
        except Exception as e:
            raise ReportServiceError(f"Failed to get reports by inspection: {str(e)}")
    
    def get_reports_by_template(self, template_id: int) -> List[FinalReport]:
        """
        Get all reports using a specific template
        
        Args:
            template_id: Template ID
            
        Returns:
            List of FinalReport instances
        """
        try:
            statement = select(FinalReport).where(FinalReport.template_id == template_id)
            return list(self.session.exec(statement).all())
        except Exception as e:
            raise ReportServiceError(f"Failed to get reports by template: {str(e)}")
    
    def update_report_status(self, report_id: int, status: ReportStatus) -> bool:
        """
        Update report status
        
        Args:
            report_id: Report ID
            status: New status
            
        Returns:
            True if updated, False if not found
        """
        try:
            report = self.get_report(report_id)
            if not report:
                return False
            
            report.status = status
            report.updated_at = datetime.utcnow()
            
            self.session.add(report)
            self.session.commit()
            
            return True
            
        except Exception as e:
            self.session.rollback()
            raise ReportServiceError(f"Failed to update report status: {str(e)}")
    
    def delete_report(self, report_id: int) -> bool:
        """
        Delete report and all its field values
        
        Args:
            report_id: Report ID
            
        Returns:
            True if deleted, False if not found
        """
        try:
            report = self.get_report(report_id)
            if not report:
                return False
            
            # Delete field values first
            field_values = self.session.exec(
                select(ReportFieldValue).where(ReportFieldValue.final_report_id == report_id)
            ).all()
            
            for field_value in field_values:
                self.session.delete(field_value)
            
            # Delete report
            self.session.delete(report)
            self.session.commit()
            
            return True
            
        except Exception as e:
            self.session.rollback()
            raise ReportServiceError(f"Failed to delete report: {str(e)}")
    
    # Report Statistics and Analytics
    
    def get_report_stats(self, report_id: int) -> Optional[Dict[str, Any]]:
        """
        Get report statistics
        
        Args:
            report_id: Report ID
            
        Returns:
            Dictionary with report statistics or None if not found
        """
        try:
            report_data = self.get_report_with_values(report_id)
            if not report_data:
                return None
            
            field_values = report_data['field_values']
            
            stats = {
                'report_id': report_id,
                'total_fields': len(field_values),
                'filled_fields': sum(1 for v in field_values.values() if v['value'] is not None),
                'empty_fields': sum(1 for v in field_values.values() if v['value'] is None),
                'completion_percentage': 0,
                'field_types': {},
                'sections': {}
            }
            
            if stats['total_fields'] > 0:
                stats['completion_percentage'] = (stats['filled_fields'] / stats['total_fields']) * 100
            
            # Analyze field types and sections
            for field_data in field_values.values():
                field_info = field_data['field_info']
                
                # Count field types
                field_type = field_info.get('field_type', 'unknown')
                if hasattr(field_type, 'value'):
                    field_type = field_type.value
                stats['field_types'][field_type] = stats['field_types'].get(field_type, 0) + 1
                
                # Count sections
                section = field_info.get('section', 'unknown')
                if section not in stats['sections']:
                    stats['sections'][section] = {'total': 0, 'filled': 0}
                
                stats['sections'][section]['total'] += 1
                if field_data['value'] is not None:
                    stats['sections'][section]['filled'] += 1
            
            return stats
            
        except Exception as e:
            raise ReportServiceError(f"Failed to get report stats: {str(e)}")
    
    # Auto-Field Population Methods
    
    def _auto_populate_fields(
        self, 
        template: Template, 
        inspection_data: Optional[Any] = None,
        equipment_data: Optional[Any] = None,
        user_data: Optional[Any] = None,
        result: Optional[ReportSubmissionResult] = None
    ) -> Dict[int, Any]:
        """
        Auto-populate fields based on template configuration
        
        Args:
            template: Template with structure
            inspection_data: Inspection data for auto-population
            equipment_data: Equipment data for auto-population
            user_data: User data for auto-population
            result: Result object to add warnings/errors to
            
        Returns:
            Dictionary mapping field IDs to auto-populated values
        """
        auto_values = {}
        
        if not result:
            result = ReportSubmissionResult()
        
        try:
            # Get all auto fields from template
            auto_fields = []
            for section in template.sections:
                for subsection in section.subsections:
                    for field in subsection.fields:
                        if field.value_source == ValueSource.AUTO and field.auto_source_key:
                            auto_fields.append(field)
            
            if not auto_fields:
                return auto_values
            
            # Use integration service to populate fields
            populated_values = self.integration_service.populate_template_fields(
                auto_fields,
                inspection_data,
                equipment_data,
                user_data
            )
            
            # Convert to field ID mapping
            for field_id, value in populated_values.items():
                auto_values[field_id] = value
            
            # Add info about auto-populated fields
            if auto_values:
                result.add_warning(
                    f"Auto-populated {len(auto_values)} fields from system data",
                    "AUTO_POPULATION_SUCCESS"
                )
            
        except Exception as e:
            result.add_warning(
                f"Auto-population failed: {str(e)}",
                "AUTO_POPULATION_FAILED"
            )
        
        return auto_values
    
    def create_report_with_auto_population(
        self,
        template_id: int,
        inspection_id: int,
        inspection_data: Any,
        created_by: Optional[int] = None,
        equipment_data: Optional[Any] = None,
        user_data: Optional[Any] = None,
        manual_field_values: Optional[Dict[int, Any]] = None
    ) -> ReportSubmissionResult:
        """
        Create report with automatic field population from inspection data
        
        Args:
            template_id: Template ID to use
            inspection_id: Inspection ID this report belongs to
            inspection_data: Inspection data for auto-population
            created_by: User ID who created the report
            equipment_data: Equipment data for auto-population
            user_data: User data for auto-population
            manual_field_values: Manual field values to override auto-populated ones
            
        Returns:
            ReportSubmissionResult with creation details
        """
        return self.create_report_from_template(
            template_id=template_id,
            inspection_id=inspection_id,
            created_by=created_by,
            field_values=manual_field_values,
            inspection_data=inspection_data,
            equipment_data=equipment_data,
            user_data=user_data,
            auto_populate=True
        )
    
    def get_auto_populated_preview(
        self,
        template_id: int,
        inspection_data: Any,
        equipment_data: Optional[Any] = None,
        user_data: Optional[Any] = None
    ) -> Dict[str, Any]:
        """
        Get preview of auto-populated field values without creating a report
        
        Args:
            template_id: Template ID to preview
            inspection_data: Inspection data for auto-population
            equipment_data: Equipment data for auto-population
            user_data: User data for auto-population
            
        Returns:
            Dictionary with preview data
        """
        try:
            # Get template with structure
            template = self.template_service.get_template_with_structure(template_id)
            if not template:
                return {
                    'success': False,
                    'error': f'Template {template_id} not found',
                    'auto_fields': {},
                    'manual_fields': {}
                }
            
            # Get auto-populated values
            result = ReportSubmissionResult()
            auto_values = self._auto_populate_fields(
                template,
                inspection_data,
                equipment_data,
                user_data,
                result
            )
            
            # Categorize fields
            auto_fields = {}
            manual_fields = {}
            
            for section in template.sections:
                for subsection in section.subsections:
                    for field in subsection.fields:
                        field_info = {
                            'id': field.id,
                            'label': field.label,
                            'field_type': field.field_type.value if hasattr(field.field_type, 'value') else str(field.field_type),
                            'is_required': field.is_required,
                            'section': section.title,
                            'subsection': subsection.title
                        }
                        
                        if field.value_source == ValueSource.AUTO:
                            field_info['auto_source_key'] = field.auto_source_key
                            field_info['value'] = auto_values.get(field.id)
                            field_info['populated'] = field.id in auto_values
                            auto_fields[field.id] = field_info
                        else:
                            manual_fields[field.id] = field_info
            
            return {
                'success': True,
                'template': {
                    'id': template.id,
                    'name': template.name
                },
                'auto_fields': auto_fields,
                'manual_fields': manual_fields,
                'auto_population_count': len(auto_values),
                'warnings': result.warnings
            }
            
        except Exception as e:
            return {
                'success': False,
                'error': f'Preview failed: {str(e)}',
                'auto_fields': {},
                'manual_fields': {}
            }
    
    def validate_auto_field_availability(
        self,
        template_id: int,
        inspection_data: Any,
        equipment_data: Optional[Any] = None,
        user_data: Optional[Any] = None
    ) -> Dict[str, Any]:
        """
        Validate which auto-fields can be populated with available data
        
        Args:
            template_id: Template ID to validate
            inspection_data: Inspection data for validation
            equipment_data: Equipment data for validation
            user_data: User data for validation
            
        Returns:
            Dictionary with validation results
        """
        try:
            # Get template with structure
            template = self.template_service.get_template_with_structure(template_id)
            if not template:
                return {
                    'success': False,
                    'error': f'Template {template_id} not found'
                }
            
            # Get validation from integration service
            validation_results = self.integration_service.validate_inspection_for_auto_fields(inspection_data)
            
            # Analyze template auto-fields
            template_auto_fields = {}
            available_count = 0
            unavailable_count = 0
            
            for section in template.sections:
                for subsection in section.subsections:
                    for field in subsection.fields:
                        if field.value_source == ValueSource.AUTO and field.auto_source_key:
                            is_available = validation_results.get(field.auto_source_key, False)
                            
                            template_auto_fields[field.id] = {
                                'label': field.label,
                                'auto_source_key': field.auto_source_key,
                                'is_available': is_available,
                                'is_required': field.is_required,
                                'section': section.title,
                                'subsection': subsection.title
                            }
                            
                            if is_available:
                                available_count += 1
                            else:
                                unavailable_count += 1
            
            return {
                'success': True,
                'template': {
                    'id': template.id,
                    'name': template.name
                },
                'auto_fields': template_auto_fields,
                'summary': {
                    'total_auto_fields': len(template_auto_fields),
                    'available_fields': available_count,
                    'unavailable_fields': unavailable_count,
                    'availability_percentage': (available_count / len(template_auto_fields) * 100) if template_auto_fields else 0
                },
                'data_sources': validation_results
            }
            
        except Exception as e:
            return {
                'success': False,
                'error': f'Validation failed: {str(e)}'
            }    

    # Additional API methods
    
    def create_report(self, inspection_id: int, template_id: int, created_by: int) -> FinalReport:
        """
        Create a new report from template for inspection
        
        Args:
            inspection_id: ID of the inspection
            template_id: ID of the template to use
            created_by: ID of the user creating the report
            
        Returns:
            Created FinalReport instance
        """
        try:
            # Use existing method with mock data
            result = self.create_report_from_template(
                template_id=template_id,
                inspection_data={'id': inspection_id},
                user_data={'id': created_by}
            )
            
            if result.success and result.report_id:
                # Get the created report
                report = self.session.get(FinalReport, result.report_id)
                return report
            else:
                raise ReportServiceError(f"Failed to create report: {result.errors}")
                
        except Exception as e:
            raise ReportServiceError(f"Failed to create report: {str(e)}")
    
    def update_field_values(self, report_id: int, field_values: Dict[str, Any]) -> FinalReport:
        """
        Update field values for a report
        
        Args:
            report_id: ID of the report
            field_values: Dictionary mapping field IDs to values
            
        Returns:
            Updated FinalReport instance
        """
        try:
            # Get the report
            report = self.session.get(FinalReport, report_id)
            if not report:
                raise ReportServiceError(f"Report {report_id} not found")
                
                # Update field values
                for field_id, value in field_values.items():
                    # Find existing field value or create new one
                    field_value = self.session.exec(
                        select(ReportFieldValue).where(
                            ReportFieldValue.final_report_id == report_id,
                            ReportFieldValue.template_field_id == int(field_id)
                        )
                    ).first()
                    
                    if not field_value:
                        field_value = ReportFieldValue(
                            final_report_id=report_id,
                            template_field_id=int(field_id)
                        )
                        self.session.add(field_value)
                    
                    # Set the appropriate value based on type
                    if isinstance(value, str):
                        field_value.text_value = value
                    elif isinstance(value, (int, float)):
                        field_value.number_value = float(value)
                    elif isinstance(value, date):
                        field_value.date_value = value
                    elif isinstance(value, bool):
                        field_value.boolean_value = value
                    else:
                        field_value.json_value = json.dumps(value)
                
                # Update report timestamp
                report.updated_at = datetime.now()
                
                self.session.commit()
                self.session.refresh(report)
                return report
                
        except Exception as e:
            raise ReportServiceError(f"Failed to update field values: {str(e)}")
    
    def export_report(self, report_id: int, format: str) -> Dict[str, Any]:
        """
        Export report in specified format
        
        Args:
            report_id: ID of the report
            format: Export format (pdf, excel, json)
            
        Returns:
            Dictionary with export result
        """
        try:
            # Get report with values
            report_data = self.get_report_with_values(report_id)
            
            if format.lower() == "json":
                # Return JSON data directly
                return {
                    "url": None,
                    "data": report_data,
                    "format": "json"
                }
            elif format.lower() == "pdf":
                # TODO: Implement PDF export
                return {
                    "url": f"/exports/report_{report_id}.pdf",
                    "format": "pdf",
                    "message": "PDF export not yet implemented"
                }
            elif format.lower() == "excel":
                # TODO: Implement Excel export
                return {
                    "url": f"/exports/report_{report_id}.xlsx",
                    "format": "excel",
                    "message": "Excel export not yet implemented"
                }
            else:
                raise ReportServiceError(f"Unsupported export format: {format}")
                
        except Exception as e:
            raise ReportServiceError(f"Failed to export report: {str(e)}")
    
    def get_auto_filled_fields(self, report_id: int) -> Dict[str, Any]:
        """
        Get auto-filled field values for a report
        
        Args:
            report_id: ID of the report
            
        Returns:
            Dictionary with auto-filled fields
        """
        try:
            # Get report with template
            report = self.session.get(FinalReport, report_id)
            if not report:
                raise ReportServiceError(f"Report {report_id} not found")
                
                # Get template structure
                template = self.template_service.get_template_with_structure(report.template_id)
                
                # Find auto fields and their values
                auto_fields = {}
                for section in template.sections:
                    for subsection in section.subsections:
                        for field in subsection.fields:
                            if field.value_source == ValueSource.AUTO:
                                # Get field value
                                field_value = self.session.exec(
                                    select(ReportFieldValue).where(
                                        ReportFieldValue.final_report_id == report_id,
                                        ReportFieldValue.template_field_id == field.id
                                    )
                                ).first()
                                
                                value = None
                                if field_value:
                                    if field_value.text_value:
                                        value = field_value.text_value
                                    elif field_value.number_value is not None:
                                        value = field_value.number_value
                                    elif field_value.date_value:
                                        value = field_value.date_value
                                    elif field_value.boolean_value is not None:
                                        value = field_value.boolean_value
                                    elif field_value.json_value:
                                        value = json.loads(field_value.json_value)
                                
                                auto_fields[str(field.id)] = {
                                    'label': field.label,
                                    'auto_source_key': field.auto_source_key,
                                    'value': value,
                                    'section': section.title,
                                    'subsection': subsection.title
                                }
                
                return auto_fields
                
        except Exception as e:
            raise ReportServiceError(f"Failed to get auto-filled fields: {str(e)}")
    
    def refresh_auto_fields(self, report_id: int) -> Dict[str, Any]:
        """
        Refresh auto-filled field values with latest data
        
        Args:
            report_id: ID of the report
            
        Returns:
            Dictionary with refreshed fields
        """
        try:
            # Get report
            report = self.session.get(FinalReport, report_id)
            if not report:
                raise ReportServiceError(f"Report {report_id} not found")
            
            # TODO: Get fresh inspection data
            # For now, return current auto fields
            return self.get_auto_filled_fields(report_id)
                
        except Exception as e:
            raise ReportServiceError(f"Failed to refresh auto-filled fields: {str(e)}")