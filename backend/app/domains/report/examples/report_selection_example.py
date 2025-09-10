"""Example usage of ReportSelectionService"""

from datetime import date
from unittest.mock import Mock

# Mock the necessary classes for demonstration
class MockReportSelectionService:
    """Mock ReportSelectionService for demonstration"""
    
    def get_available_templates_for_inspection(self, inspection_id, include_context=True, filter_by_equipment_type=True):
        """Mock template retrieval"""
        return {
            'success': True,
            'available_templates_count': 3,
            'recommended_templates_count': 2,
            'existing_reports_count': 1,
            'warnings_count': 1,
            'errors_count': 0,
            'inspection_context': {
                'id': inspection_id,
                'number': 'INS-2025-001',
                'title': 'Pressure Vessel Annual Inspection',
                'description': 'Annual inspection of main pressure vessel',
                'start_date': date(2025, 1, 15),
                'end_date': date(2025, 1, 16),
                'status': 'completed',
                'equipment_id': 123,
                'work_order': 'WO-2025-001',
                'requesting_department': 'engineering',
                'equipment': {
                    'id': 123,
                    'tag': 'PV-001',
                    'description': 'Main Pressure Vessel',
                    'unit': 'Unit A',
                    'equipment_type': 'Pressure Vessel'
                }
            },
            'available_templates': [
                {
                    'id': 1,
                    'name': 'Standard Pressure Vessel Report',
                    'description': 'Standard inspection report for pressure vessels',
                    'suitability_score': 85.0,
                    'complexity': 'Medium',
                    'sections_count': 4,
                    'fields_count': 12,
                    'auto_fields_count': 8,
                    'manual_fields_count': 4,
                    'required_fields_count': 3
                },
                {
                    'id': 2,
                    'name': 'Detailed Technical Assessment',
                    'description': 'Comprehensive technical assessment report',
                    'suitability_score': 75.0,
                    'complexity': 'High',
                    'sections_count': 6,
                    'fields_count': 25,
                    'auto_fields_count': 15,
                    'manual_fields_count': 10,
                    'required_fields_count': 8
                },
                {
                    'id': 3,
                    'name': 'Quick Inspection Summary',
                    'description': 'Simple summary report for routine inspections',
                    'suitability_score': 70.0,
                    'complexity': 'Low',
                    'sections_count': 2,
                    'fields_count': 6,
                    'auto_fields_count': 4,
                    'manual_fields_count': 2,
                    'required_fields_count': 1
                }
            ],
            'recommended_templates': [
                {
                    'id': 1,
                    'name': 'Standard Pressure Vessel Report',
                    'suitability_score': 85.0,
                    'complexity': 'Medium',
                    'recommendation_reasons': [
                        'Highest suitability score',
                        'Most fields auto-populated'
                    ]
                },
                {
                    'id': 3,
                    'name': 'Quick Inspection Summary',
                    'suitability_score': 70.0,
                    'complexity': 'Low',
                    'recommendation_reasons': [
                        'Simple and quick to complete',
                        'Most fields auto-populated'
                    ]
                }
            ],
            'existing_reports': [
                {
                    'id': 10,
                    'template_id': 1,
                    'serial_number': 'RPT-123-001',
                    'status': 'draft',
                    'created_at': '2025-01-16T10:00:00',
                    'updated_at': '2025-01-16T10:00:00'
                }
            ],
            'warnings': [
                {
                    'message': 'Inspection is not completed. Reports can be created but may be incomplete.',
                    'error_code': 'INSPECTION_NOT_COMPLETED'
                }
            ],
            'errors': []
        }
    
    def validate_template_for_inspection(self, template_id, inspection_id):
        """Mock template validation"""
        return {
            'valid': True,
            'template': {
                'id': template_id,
                'name': 'Standard Pressure Vessel Report',
                'description': 'Standard inspection report for pressure vessels'
            },
            'suitability_score': 85.0,
            'recommendations': [
                '8 fields will be auto-populated from inspection data',
                '3 fields are required',
                'This is a comprehensive template - allow extra time for completion'
            ]
        }
    
    def get_template_preview_for_inspection(self, template_id, inspection_id):
        """Mock template preview"""
        return {
            'success': True,
            'template': {
                'id': template_id,
                'name': 'Standard Pressure Vessel Report',
                'description': 'Standard inspection report for pressure vessels'
            },
            'inspection': {
                'id': inspection_id,
                'number': 'INS-2025-001',
                'title': 'Pressure Vessel Annual Inspection',
                'start_date': date(2025, 1, 15),
                'end_date': date(2025, 1, 16),
                'status': 'completed'
            },
            'sections': [
                {
                    'title': 'Header',
                    'type': 'header',
                    'subsections': [
                        {
                            'title': 'General Information',
                            'fields': [
                                {
                                    'label': 'Inspection Date',
                                    'type': 'date',
                                    'source': 'auto',
                                    'required': True,
                                    'auto_source': 'inspection.start_date'
                                },
                                {
                                    'label': 'Equipment Tag',
                                    'type': 'text',
                                    'source': 'auto',
                                    'required': True,
                                    'auto_source': 'equipment.tag'
                                }
                            ]
                        }
                    ]
                },
                {
                    'title': 'Body',
                    'type': 'body',
                    'subsections': [
                        {
                            'title': 'Inspection Results',
                            'fields': [
                                {
                                    'label': 'Findings',
                                    'type': 'textarea',
                                    'source': 'manual',
                                    'required': True
                                },
                                {
                                    'label': 'Severity',
                                    'type': 'select',
                                    'source': 'manual',
                                    'required': True
                                }
                            ]
                        }
                    ]
                }
            ],
            'auto_fields_count': 2,
            'manual_fields_count': 2
        }


def example_report_selection_workflow():
    """Example of complete report selection workflow"""
    print("=== Report Selection Workflow Example ===")
    
    service = MockReportSelectionService()
    inspection_id = 123
    
    # Step 1: Get available templates for inspection
    print("Step 1: Getting available templates for inspection...")
    
    selection_result = service.get_available_templates_for_inspection(inspection_id)
    
    print(f"  - Success: {selection_result['success']}")
    print(f"  - Available templates: {selection_result['available_templates_count']}")
    print(f"  - Recommended templates: {selection_result['recommended_templates_count']}")
    print(f"  - Existing reports: {selection_result['existing_reports_count']}")
    
    # Show inspection context
    context = selection_result['inspection_context']
    print(f"\nInspection Context:")
    print(f"  - Number: {context['number']}")
    print(f"  - Title: {context['title']}")
    print(f"  - Status: {context['status']}")
    print(f"  - Equipment: {context['equipment']['tag']} - {context['equipment']['description']}")
    
    # Show warnings
    if selection_result['warnings']:
        print(f"\nWarnings:")
        for warning in selection_result['warnings']:
            print(f"  ⚠ {warning['message']}")
    
    # Show available templates
    print(f"\nAvailable Templates:")
    for template in selection_result['available_templates']:
        print(f"  - {template['name']} (Score: {template['suitability_score']}, Complexity: {template['complexity']})")
        print(f"    Fields: {template['fields_count']} total, {template['auto_fields_count']} auto, {template['manual_fields_count']} manual")
    
    # Show recommendations
    print(f"\nRecommended Templates:")
    for template in selection_result['recommended_templates']:
        print(f"  ⭐ {template['name']} (Score: {template['suitability_score']})")
        for reason in template['recommendation_reasons']:
            print(f"    - {reason}")
    
    # Show existing reports
    if selection_result['existing_reports']:
        print(f"\nExisting Reports:")
        for report in selection_result['existing_reports']:
            print(f"  - Report {report['serial_number']} (Status: {report['status']})")


def example_template_validation():
    """Example of template validation for inspection"""
    print("\n=== Template Validation Example ===")
    
    service = MockReportSelectionService()
    
    # Validate specific template for inspection
    validation_result = service.validate_template_for_inspection(
        template_id=1,
        inspection_id=123
    )
    
    print(f"Template: {validation_result['template']['name']}")
    print(f"Valid: {validation_result['valid']}")
    print(f"Suitability Score: {validation_result['suitability_score']}")
    
    print(f"\nRecommendations:")
    for recommendation in validation_result['recommendations']:
        print(f"  - {recommendation}")


def example_template_preview():
    """Example of template preview"""
    print("\n=== Template Preview Example ===")
    
    service = MockReportSelectionService()
    
    # Get template preview
    preview = service.get_template_preview_for_inspection(
        template_id=1,
        inspection_id=123
    )
    
    print(f"Template: {preview['template']['name']}")
    print(f"Inspection: {preview['inspection']['number']} - {preview['inspection']['title']}")
    print(f"Auto fields: {preview['auto_fields_count']}")
    print(f"Manual fields: {preview['manual_fields_count']}")
    
    print(f"\nTemplate Structure:")
    for section in preview['sections']:
        print(f"  Section: {section['title']} ({section['type']})")
        for subsection in section['subsections']:
            print(f"    Subsection: {subsection['title']}")
            for field in subsection['fields']:
                source_info = f" (from {field['auto_source']})" if field['source'] == 'auto' else ""
                required_info = " *Required*" if field['required'] else ""
                print(f"      - {field['label']} [{field['type']}] - {field['source']}{source_info}{required_info}")


def example_report_selection_ui_flow():
    """Example of UI flow for report selection"""
    print("\n=== Report Selection UI Flow Example ===")
    
    print("UI Flow Steps:")
    print("1. User completes inspection")
    print("2. System shows 'Create Report' popup/notification")
    print("3. User clicks 'Create Report'")
    print("4. System calls get_available_templates_for_inspection()")
    print("5. UI shows template selection dialog with:")
    print("   - Inspection context (number, title, equipment)")
    print("   - Recommended templates (highlighted)")
    print("   - All available templates with complexity indicators")
    print("   - Existing reports (if any)")
    print("6. User selects a template")
    print("7. System calls validate_template_for_inspection()")
    print("8. UI shows template preview with:")
    print("   - Auto-populated fields preview")
    print("   - Manual fields to be filled")
    print("   - Recommendations and warnings")
    print("9. User confirms template selection")
    print("10. System creates report with auto-population")
    print("11. UI redirects to report editing form")


def example_selection_best_practices():
    """Example of best practices for report selection"""
    print("\n=== Report Selection Best Practices ===")
    
    print("1. Template Recommendation:")
    print("   - Prioritize templates with high auto-population")
    print("   - Consider template complexity vs user expertise")
    print("   - Show clear reasons for recommendations")
    
    print("\n2. User Experience:")
    print("   - Show template previews before selection")
    print("   - Indicate auto vs manual fields clearly")
    print("   - Provide complexity indicators (Low/Medium/High)")
    print("   - Show estimated completion time")
    
    print("\n3. Context Awareness:")
    print("   - Filter templates by equipment type")
    print("   - Consider inspection type and department")
    print("   - Show relevant existing reports")
    
    print("\n4. Validation and Safety:")
    print("   - Validate template compatibility")
    print("   - Check for template validation errors")
    print("   - Warn about incomplete inspections")
    print("   - Prevent duplicate report creation")
    
    print("\n5. Performance:")
    print("   - Cache template metadata")
    print("   - Lazy load template structures")
    print("   - Optimize template filtering queries")


def example_error_scenarios():
    """Example of error handling scenarios"""
    print("\n=== Error Handling Scenarios ===")
    
    print("Scenario 1: No Templates Available")
    print("  - Show message: 'No report templates available for this inspection'")
    print("  - Provide option to contact administrator")
    print("  - Allow manual report creation if supported")
    
    print("\nScenario 2: Inspection Not Found")
    print("  - Show error: 'Inspection not found or access denied'")
    print("  - Redirect to inspection list")
    print("  - Log security event if needed")
    
    print("\nScenario 3: Template Validation Errors")
    print("  - Show warning: 'Selected template has configuration issues'")
    print("  - List specific validation errors")
    print("  - Suggest alternative templates")
    
    print("\nScenario 4: Service Unavailable")
    print("  - Show error: 'Report service temporarily unavailable'")
    print("  - Provide retry option")
    print("  - Fall back to basic template list if possible")


if __name__ == "__main__":
    example_report_selection_workflow()
    example_template_validation()
    example_template_preview()
    example_report_selection_ui_flow()
    example_selection_best_practices()
    example_error_scenarios()