"""ReportSelectionService for handling report template selection workflow"""

from typing import Optional, List, Dict, Any
from sqlmodel import Session, select

from app.domains.report.models.template import Template
from app.domains.report.models.final_report import FinalReport
from app.domains.report.services.template_service import TemplateService
from app.domains.inspection.models.inspection import Inspection
from app.domains.inspection.models.enums import InspectionStatus


class ReportSelectionError(Exception):
    """Exception raised by ReportSelectionService operations"""
    
    def __init__(self, message: str, error_code: str = None):
        self.message = message
        self.error_code = error_code
        super().__init__(message)


class ReportSelectionResult:
    """Result of report selection process"""
    
    def __init__(self):
        self.success = True
        self.available_templates = []
        self.recommended_templates = []
        self.inspection_context = {}
        self.existing_reports = []
        self.warnings = []
        self.errors = []
    
    def add_warning(self, message: str, error_code: str = None):
        """Add warning"""
        self.warnings.append({
            'message': message,
            'error_code': error_code
        })
    
    def add_error(self, message: str, error_code: str = None):
        """Add error"""
        self.success = False
        self.errors.append({
            'message': message,
            'error_code': error_code
        })
    
    def get_summary(self) -> Dict[str, Any]:
        """Get selection result summary"""
        return {
            'success': self.success,
            'available_templates_count': len(self.available_templates),
            'recommended_templates_count': len(self.recommended_templates),
            'existing_reports_count': len(self.existing_reports),
            'warnings_count': len(self.warnings),
            'errors_count': len(self.errors),
            'inspection_context': self.inspection_context,
            'available_templates': self.available_templates,
            'recommended_templates': self.recommended_templates,
            'existing_reports': self.existing_reports,
            'warnings': self.warnings,
            'errors': self.errors
        }


class ReportSelectionService:
    """Service for managing report template selection workflow"""
    
    def __init__(self, session: Session):
        """Initialize the report selection service"""
        self.session = session
        self.template_service = TemplateService(session)
    
    def get_available_templates_for_inspection(
        self, 
        inspection_id: int,
        include_context: bool = True,
        filter_by_equipment_type: bool = True
    ) -> ReportSelectionResult:
        """
        Get available report templates for an inspection
        
        Args:
            inspection_id: Inspection ID
            include_context: Whether to include inspection context
            filter_by_equipment_type: Whether to filter templates by equipment type
            
        Returns:
            ReportSelectionResult with available templates
        """
        result = ReportSelectionResult()
        
        try:
            # Get inspection
            inspection = self._get_inspection(inspection_id)
            if not inspection:
                result.add_error(f"Inspection {inspection_id} not found", "INSPECTION_NOT_FOUND")
                return result
            
            # Check inspection status
            if inspection.status != InspectionStatus.Completed:
                result.add_warning(
                    "Inspection is not completed. Reports can be created but may be incomplete.",
                    "INSPECTION_NOT_COMPLETED"
                )
            
            # Get inspection context
            if include_context:
                result.inspection_context = self._get_inspection_context(inspection)
            
            # Get existing reports
            result.existing_reports = self._get_existing_reports(inspection_id)
            
            # Get all active templates
            all_templates = self.template_service.get_all_templates(active_only=True)
            
            # Filter templates based on criteria
            filtered_templates = self._filter_templates_for_inspection(
                all_templates, 
                inspection, 
                filter_by_equipment_type
            )
            
            # Convert to template info
            result.available_templates = [
                self._template_to_info(template, inspection) 
                for template in filtered_templates
            ]
            
            # Get recommended templates
            result.recommended_templates = self._get_recommended_templates(
                result.available_templates, 
                inspection,
                result.existing_reports
            )
            
            if not result.available_templates:
                result.add_warning("No templates available for this inspection", "NO_TEMPLATES_AVAILABLE")
            
            return result
            
        except Exception as e:
            result.add_error(f"Failed to get available templates: {str(e)}", "TEMPLATE_RETRIEVAL_FAILED")
            return result
    
    def validate_template_for_inspection(
        self, 
        template_id: int, 
        inspection_id: int
    ) -> Dict[str, Any]:
        """
        Validate if a template is suitable for an inspection
        
        Args:
            template_id: Template ID to validate
            inspection_id: Inspection ID
            
        Returns:
            Dictionary with validation results
        """
        try:
            inspection = self._get_inspection(inspection_id)
            if not inspection:
                return {
                    'valid': False,
                    'error': f'Inspection {inspection_id} not found'
                }
            
            template = self.template_service.get_template_with_structure(template_id)
            if not template:
                return {
                    'valid': False,
                    'error': f'Template {template_id} not found'
                }
            
            if not template.is_active:
                return {
                    'valid': False,
                    'error': 'Template is not active'
                }
            
            # Validate template structure
            validation_result = self.template_service.validate_template_structure(template_id)
            if not validation_result.is_valid:
                return {
                    'valid': False,
                    'error': 'Template has validation errors',
                    'validation_errors': validation_result.errors
                }
            
            # Check if template is suitable for inspection type
            suitability_score = self._calculate_template_suitability(template, inspection)
            
            return {
                'valid': True,
                'template': {
                    'id': template.id,
                    'name': template.name,
                    'description': template.description
                },
                'suitability_score': suitability_score,
                'recommendations': self._get_template_recommendations(template, inspection)
            }
            
        except Exception as e:
            return {
                'valid': False,
                'error': f'Validation failed: {str(e)}'
            }
    
    def get_template_preview_for_inspection(
        self, 
        template_id: int, 
        inspection_id: int
    ) -> Dict[str, Any]:
        """
        Get template preview with auto-populated fields for inspection
        
        Args:
            template_id: Template ID
            inspection_id: Inspection ID
            
        Returns:
            Dictionary with template preview
        """
        try:
            inspection = self._get_inspection(inspection_id)
            if not inspection:
                return {
                    'success': False,
                    'error': f'Inspection {inspection_id} not found'
                }
            
            template = self.template_service.get_template_with_structure(template_id)
            if not template:
                return {
                    'success': False,
                    'error': f'Template {template_id} not found'
                }
            
            # Get equipment data if available
            equipment_data = None
            if hasattr(inspection, 'equipment') and inspection.equipment:
                equipment_data = inspection.equipment
            
            # This would integrate with ReportService to get auto-populated preview
            # For now, we return basic template structure
            preview_data = {
                'success': True,
                'template': {
                    'id': template.id,
                    'name': template.name,
                    'description': template.description
                },
                'inspection': {
                    'id': inspection.id,
                    'number': inspection.inspection_number,
                    'title': inspection.title,
                    'start_date': inspection.start_date,
                    'end_date': inspection.end_date,
                    'status': inspection.status.value if hasattr(inspection.status, 'value') else str(inspection.status)
                },
                'sections': [],
                'auto_fields_count': 0,
                'manual_fields_count': 0
            }
            
            # Analyze template structure
            auto_fields = 0
            manual_fields = 0
            sections_info = []
            
            for section in template.sections:
                section_info = {
                    'title': section.title,
                    'type': section.section_type.value if hasattr(section.section_type, 'value') else str(section.section_type),
                    'subsections': []
                }
                
                for subsection in section.subsections:
                    subsection_info = {
                        'title': subsection.title,
                        'fields': []
                    }
                    
                    for field in subsection.fields:
                        field_info = {
                            'label': field.label,
                            'type': field.field_type.value if hasattr(field.field_type, 'value') else str(field.field_type),
                            'source': field.value_source.value if hasattr(field.value_source, 'value') else str(field.value_source),
                            'required': field.is_required
                        }
                        
                        if field.value_source.value == 'auto':
                            auto_fields += 1
                            field_info['auto_source'] = field.auto_source_key
                        else:
                            manual_fields += 1
                        
                        subsection_info['fields'].append(field_info)
                    
                    section_info['subsections'].append(subsection_info)
                
                sections_info.append(section_info)
            
            preview_data['sections'] = sections_info
            preview_data['auto_fields_count'] = auto_fields
            preview_data['manual_fields_count'] = manual_fields
            
            return preview_data
            
        except Exception as e:
            return {
                'success': False,
                'error': f'Preview failed: {str(e)}'
            }
    
    def _get_inspection(self, inspection_id: int) -> Optional[Inspection]:
        """Get inspection by ID"""
        try:
            statement = select(Inspection).where(Inspection.id == inspection_id)
            return self.session.exec(statement).first()
        except Exception as e:
            raise ReportSelectionError(f"Failed to get inspection: {str(e)}")
    
    def _get_inspection_context(self, inspection: Inspection) -> Dict[str, Any]:
        """Get inspection context information"""
        context = {
            'id': inspection.id,
            'number': inspection.inspection_number,
            'title': inspection.title,
            'description': inspection.description,
            'start_date': inspection.start_date,
            'end_date': inspection.end_date,
            'status': inspection.status.value if hasattr(inspection.status, 'value') else str(inspection.status),
            'equipment_id': inspection.equipment_id,
            'work_order': inspection.work_order,
            'requesting_department': inspection.requesting_department.value if hasattr(inspection.requesting_department, 'value') else str(inspection.requesting_department)
        }
        
        # Add equipment info if available
        if hasattr(inspection, 'equipment') and inspection.equipment:
            equipment = inspection.equipment
            context['equipment'] = {
                'id': equipment.id,
                'tag': equipment.tag,
                'description': equipment.description,
                'unit': equipment.unit,
                'equipment_type': equipment.equipment_type
            }
        
        return context
    
    def _get_existing_reports(self, inspection_id: int) -> List[Dict[str, Any]]:
        """Get existing reports for inspection"""
        try:
            statement = select(FinalReport).where(FinalReport.inspection_id == inspection_id)
            reports = list(self.session.exec(statement).all())
            
            return [
                {
                    'id': report.id,
                    'template_id': report.template_id,
                    'serial_number': report.report_serial_number,
                    'status': report.status.value if hasattr(report.status, 'value') else str(report.status),
                    'created_at': report.created_at,
                    'updated_at': report.updated_at
                }
                for report in reports
            ]
        except Exception:
            return []
    
    def _filter_templates_for_inspection(
        self, 
        templates: List[Template], 
        inspection: Inspection,
        filter_by_equipment_type: bool
    ) -> List[Template]:
        """Filter templates based on inspection criteria"""
        
        if not filter_by_equipment_type:
            return templates
        
        # For now, return all templates
        # In a real implementation, you might filter based on:
        # - Equipment type
        # - Inspection type
        # - Department requirements
        # - Regulatory requirements
        
        return templates
    
    def _template_to_info(self, template: Template, inspection: Inspection) -> Dict[str, Any]:
        """Convert template to info dictionary"""
        
        # Get template stats
        stats = self.template_service.get_template_stats(template.id)
        
        template_info = {
            'id': template.id,
            'name': template.name,
            'description': template.description,
            'created_at': template.created_at,
            'updated_at': template.updated_at,
            'suitability_score': self._calculate_template_suitability(template, inspection),
            'complexity': 'Low'  # Default complexity
        }
        
        if stats:
            template_info.update({
                'sections_count': stats['structure']['total_sections'],
                'fields_count': stats['structure']['total_fields'],
                'auto_fields_count': stats['field_analysis']['auto_fields'],
                'manual_fields_count': stats['field_analysis']['manual_fields'],
                'required_fields_count': stats['field_analysis']['required_fields']
            })
            
            # Determine complexity based on field count
            total_fields = stats['structure']['total_fields']
            if total_fields <= 5:
                template_info['complexity'] = 'Low'
            elif total_fields <= 15:
                template_info['complexity'] = 'Medium'
            else:
                template_info['complexity'] = 'High'
        
        return template_info
    
    def _get_recommended_templates(
        self, 
        available_templates: List[Dict[str, Any]], 
        inspection: Inspection,
        existing_reports: List[Dict[str, Any]]
    ) -> List[Dict[str, Any]]:
        """Get recommended templates based on various criteria"""
        
        # Sort by suitability score
        sorted_templates = sorted(
            available_templates, 
            key=lambda t: t.get('suitability_score', 0), 
            reverse=True
        )
        
        # Get top 3 recommendations
        recommendations = sorted_templates[:3]
        
        # Add recommendation reasons
        for i, template in enumerate(recommendations):
            reasons = []
            
            if i == 0:
                reasons.append("Highest suitability score")
            
            if template.get('complexity') == 'Low':
                reasons.append("Simple and quick to complete")
            
            if template.get('auto_fields_count', 0) > template.get('manual_fields_count', 0):
                reasons.append("Most fields auto-populated")
            
            if not reasons:
                reasons.append("Good match for this inspection")
            
            template['recommendation_reasons'] = reasons
        
        return recommendations
    
    def _calculate_template_suitability(self, template: Template, inspection: Inspection) -> float:
        """Calculate template suitability score for inspection"""
        
        score = 50.0  # Base score
        
        # Increase score based on template characteristics
        if template.is_active:
            score += 10.0
        
        # Increase score if template has auto fields (less manual work)
        stats = self.template_service.get_template_stats(template.id)
        if stats:
            auto_fields = stats['field_analysis']['auto_fields']
            total_fields = stats['structure']['total_fields']
            
            if total_fields > 0:
                auto_percentage = (auto_fields / total_fields) * 100
                score += (auto_percentage / 100) * 20.0  # Up to 20 points for auto fields
        
        # Decrease score for very complex templates
        if stats and stats['structure']['total_fields'] > 20:
            score -= 10.0
        
        # Ensure score is between 0 and 100
        return max(0.0, min(100.0, score))
    
    def _get_template_recommendations(self, template: Template, inspection: Inspection) -> List[str]:
        """Get recommendations for using template with inspection"""
        
        recommendations = []
        
        # Check template complexity
        stats = self.template_service.get_template_stats(template.id)
        if stats:
            total_fields = stats['structure']['total_fields']
            auto_fields = stats['field_analysis']['auto_fields']
            
            if total_fields > 15:
                recommendations.append("This is a comprehensive template - allow extra time for completion")
            
            if auto_fields > 0:
                recommendations.append(f"{auto_fields} fields will be auto-populated from inspection data")
            
            if stats['field_analysis']['required_fields'] > 0:
                recommendations.append(f"{stats['field_analysis']['required_fields']} fields are required")
        
        # Check inspection status
        if inspection.status != InspectionStatus.Completed:
            recommendations.append("Complete the inspection first for best auto-population results")
        
        return recommendations