"""Example usage of ReportService auto-field integration"""

from datetime import date
from unittest.mock import Mock

# Mock the necessary classes for demonstration
class MockReportService:
    """Mock ReportService for demonstration"""
    
    def __init__(self):
        self.integration_service = Mock()
    
    def get_auto_populated_preview(self, template_id, inspection_data, equipment_data=None, user_data=None):
        """Mock preview method"""
        return {
            'success': True,
            'template': {
                'id': template_id,
                'name': 'Pressure Vessel Inspection Template'
            },
            'auto_fields': {
                1: {
                    'id': 1,
                    'label': 'Inspection Date',
                    'field_type': 'date',
                    'auto_source_key': 'inspection.start_date',
                    'value': date(2025, 1, 15),
                    'populated': True,
                    'section': 'Header',
                    'subsection': 'General Info'
                },
                2: {
                    'id': 2,
                    'label': 'Equipment Tag',
                    'field_type': 'text',
                    'auto_source_key': 'equipment.tag',
                    'value': 'PV-001',
                    'populated': True,
                    'section': 'Header',
                    'subsection': 'Equipment Details'
                },
                3: {
                    'id': 3,
                    'label': 'Inspector Name',
                    'field_type': 'text',
                    'auto_source_key': 'user.full_name',
                    'value': 'John Doe',
                    'populated': True,
                    'section': 'Header',
                    'subsection': 'Personnel'
                }
            },
            'manual_fields': {
                4: {
                    'id': 4,
                    'label': 'Findings Description',
                    'field_type': 'textarea',
                    'is_required': True,
                    'section': 'Body',
                    'subsection': 'Inspection Results'
                },
                5: {
                    'id': 5,
                    'label': 'Severity Level',
                    'field_type': 'select',
                    'is_required': True,
                    'section': 'Body',
                    'subsection': 'Assessment'
                }
            },
            'auto_population_count': 3,
            'warnings': []
        }
    
    def validate_auto_field_availability(self, template_id, inspection_data, equipment_data=None, user_data=None):
        """Mock validation method"""
        return {
            'success': True,
            'template': {
                'id': template_id,
                'name': 'Pressure Vessel Inspection Template'
            },
            'auto_fields': {
                1: {
                    'label': 'Inspection Date',
                    'auto_source_key': 'inspection.start_date',
                    'is_available': True,
                    'is_required': False,
                    'section': 'Header',
                    'subsection': 'General Info'
                },
                2: {
                    'label': 'Equipment Tag',
                    'auto_source_key': 'equipment.tag',
                    'is_available': True,
                    'is_required': False,
                    'section': 'Header',
                    'subsection': 'Equipment Details'
                },
                3: {
                    'label': 'Inspector Name',
                    'auto_source_key': 'user.full_name',
                    'is_available': False,  # User data not available
                    'is_required': False,
                    'section': 'Header',
                    'subsection': 'Personnel'
                }
            },
            'summary': {
                'total_auto_fields': 3,
                'available_fields': 2,
                'unavailable_fields': 1,
                'availability_percentage': 66.67
            },
            'data_sources': {
                'inspection.start_date': True,
                'inspection.end_date': True,
                'equipment.tag': True,
                'equipment.name': True,
                'user.full_name': False,
                'current.date': True
            }
        }
    
    def create_report_with_auto_population(self, template_id, inspection_id, inspection_data, **kwargs):
        """Mock report creation method"""
        return {
            'success': True,
            'report_id': 123,
            'warnings': [
                {
                    'message': 'Auto-populated 3 fields from system data',
                    'error_code': 'AUTO_POPULATION_SUCCESS'
                }
            ],
            'errors': [],
            'field_errors': {}
        }


def example_auto_field_preview():
    """Example of getting auto-field preview"""
    print("=== Auto-Field Preview Example ===")
    
    service = MockReportService()
    
    # Mock inspection and equipment data
    inspection_data = Mock()
    inspection_data.id = 123
    inspection_data.start_date = date(2025, 1, 15)
    inspection_data.number = "INS-2025-001"
    
    equipment_data = Mock()
    equipment_data.tag = "PV-001"
    equipment_data.name = "Main Pressure Vessel"
    
    user_data = Mock()
    user_data.full_name = "John Doe"
    
    # Get preview
    preview = service.get_auto_populated_preview(
        template_id=1,
        inspection_data=inspection_data,
        equipment_data=equipment_data,
        user_data=user_data
    )
    
    print(f"Template: {preview['template']['name']}")
    print(f"Auto-populated fields: {preview['auto_population_count']}")
    print(f"Manual fields required: {len(preview['manual_fields'])}")
    
    print("\nAuto-populated fields:")
    for field_id, field_info in preview['auto_fields'].items():
        status = "✓" if field_info['populated'] else "✗"
        print(f"  {status} {field_info['label']}: {field_info['value']} (from {field_info['auto_source_key']})")
    
    print("\nManual fields to fill:")
    for field_id, field_info in preview['manual_fields'].items():
        required = " (Required)" if field_info['is_required'] else ""
        print(f"  - {field_info['label']}{required}")


def example_auto_field_validation():
    """Example of validating auto-field availability"""
    print("\n=== Auto-Field Availability Validation Example ===")
    
    service = MockReportService()
    
    # Mock inspection data (incomplete)
    inspection_data = Mock()
    inspection_data.start_date = date(2025, 1, 15)
    # Missing other data
    
    equipment_data = Mock()
    equipment_data.tag = "PV-001"
    
    # No user data provided
    
    # Validate availability
    validation = service.validate_auto_field_availability(
        template_id=1,
        inspection_data=inspection_data,
        equipment_data=equipment_data
    )
    
    print(f"Template: {validation['template']['name']}")
    
    summary = validation['summary']
    print(f"\nAvailability Summary:")
    print(f"  - Total auto fields: {summary['total_auto_fields']}")
    print(f"  - Available: {summary['available_fields']}")
    print(f"  - Unavailable: {summary['unavailable_fields']}")
    print(f"  - Availability: {summary['availability_percentage']:.1f}%")
    
    print("\nField-by-field availability:")
    for field_id, field_info in validation['auto_fields'].items():
        status = "✓ Available" if field_info['is_available'] else "✗ Unavailable"
        print(f"  {status}: {field_info['label']} (from {field_info['auto_source_key']})")
    
    print("\nData source availability:")
    for source, available in validation['data_sources'].items():
        status = "✓" if available else "✗"
        print(f"  {status} {source}")


def example_report_creation_workflow():
    """Example of complete report creation workflow with auto-population"""
    print("\n=== Report Creation Workflow Example ===")
    
    service = MockReportService()
    
    # Step 1: Validate auto-field availability
    print("Step 1: Validating auto-field availability...")
    
    inspection_data = Mock()
    inspection_data.id = 123
    inspection_data.start_date = date(2025, 1, 15)
    
    equipment_data = Mock()
    equipment_data.tag = "PV-001"
    
    validation = service.validate_auto_field_availability(
        template_id=1,
        inspection_data=inspection_data,
        equipment_data=equipment_data
    )
    
    print(f"  - {validation['summary']['availability_percentage']:.1f}% of auto fields can be populated")
    
    # Step 2: Get preview of auto-populated values
    print("\nStep 2: Getting preview of auto-populated values...")
    
    preview = service.get_auto_populated_preview(
        template_id=1,
        inspection_data=inspection_data,
        equipment_data=equipment_data
    )
    
    print(f"  - {preview['auto_population_count']} fields will be auto-populated")
    print(f"  - {len(preview['manual_fields'])} fields require manual input")
    
    # Step 3: Create report with auto-population
    print("\nStep 3: Creating report with auto-population...")
    
    manual_field_values = {
        4: "No significant findings observed during inspection.",
        5: "Low"
    }
    
    result = service.create_report_with_auto_population(
        template_id=1,
        inspection_id=123,
        inspection_data=inspection_data,
        equipment_data=equipment_data,
        manual_field_values=manual_field_values
    )
    
    if result['success']:
        print(f"  ✓ Report created successfully (ID: {result['report_id']})")
        for warning in result['warnings']:
            print(f"  ℹ {warning['message']}")
    else:
        print("  ✗ Report creation failed")
        for error in result['errors']:
            print(f"  ✗ {error['message']}")


def example_auto_population_best_practices():
    """Example of auto-population best practices"""
    print("\n=== Auto-Population Best Practices ===")
    
    print("1. Data Validation:")
    print("   - Always validate auto-field availability before creating reports")
    print("   - Check data completeness to avoid missing auto-populated fields")
    print("   - Handle cases where auto-population partially fails")
    
    print("\n2. User Experience:")
    print("   - Show preview of auto-populated values to users")
    print("   - Allow manual override of auto-populated values")
    print("   - Clearly indicate which fields are auto-populated vs manual")
    
    print("\n3. Error Handling:")
    print("   - Gracefully handle auto-population failures")
    print("   - Provide fallback options when auto-data is unavailable")
    print("   - Log auto-population issues for debugging")
    
    print("\n4. Performance:")
    print("   - Cache frequently accessed auto-data")
    print("   - Batch auto-population for multiple reports")
    print("   - Optimize data source queries")
    
    print("\n5. Data Integrity:")
    print("   - Validate auto-populated values against field constraints")
    print("   - Ensure auto-data freshness and accuracy")
    print("   - Maintain audit trail of auto-populated values")


def example_integration_scenarios():
    """Example of different integration scenarios"""
    print("\n=== Integration Scenarios ===")
    
    print("Scenario 1: Complete Auto-Population")
    print("  - All required data sources available")
    print("  - All auto fields can be populated")
    print("  - Minimal manual input required")
    print("  - Best user experience")
    
    print("\nScenario 2: Partial Auto-Population")
    print("  - Some data sources missing or incomplete")
    print("  - Some auto fields cannot be populated")
    print("  - Users need to fill missing auto fields manually")
    print("  - Provide clear guidance on missing data")
    
    print("\nScenario 3: Auto-Population Failure")
    print("  - Auto-population service unavailable")
    print("  - Fall back to manual entry for all fields")
    print("  - Maintain report creation capability")
    print("  - Log issues for system administrators")
    
    print("\nScenario 4: Mixed Data Sources")
    print("  - Data from multiple systems (inspection, equipment, user)")
    print("  - Different data freshness and reliability")
    print("  - Prioritize data sources by reliability")
    print("  - Handle data conflicts gracefully")


if __name__ == "__main__":
    example_auto_field_preview()
    example_auto_field_validation()
    example_report_creation_workflow()
    example_auto_population_best_practices()
    example_integration_scenarios()