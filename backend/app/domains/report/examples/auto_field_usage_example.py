"""Example usage of AutoFieldService and InspectionIntegrationService"""

from datetime import date
from unittest.mock import Mock

from app.domains.report.services.auto_field_service import AutoFieldService, AutoFieldContext
from app.domains.report.services.inspection_integration_service import InspectionIntegrationService


def example_basic_auto_field_usage():
    """Example of basic AutoFieldService usage"""
    print("=== Basic AutoFieldService Usage ===")
    
    service = AutoFieldService()
    
    # Get available sources
    sources = service.get_available_sources()
    print(f"Available auto-sources: {len(sources)}")
    for key, description in sources.items():
        print(f"  - {key}: {description}")
    
    # Create mock data
    mock_inspection = Mock()
    mock_inspection.id = 123
    mock_inspection.start_date = date(2025, 1, 15)
    mock_inspection.status = "completed"
    
    mock_equipment = Mock()
    mock_equipment.tag = "PV-001"
    mock_equipment.name = "Main Pressure Vessel"
    
    mock_user = Mock()
    mock_user.full_name = "John Doe"
    
    # Create context
    context = AutoFieldContext(
        inspection=mock_inspection,
        equipment=mock_equipment,
        user=mock_user
    )
    
    # Populate individual fields
    start_date = service.populate_field("inspection.start_date", context)
    equipment_tag = service.populate_field("equipment.tag", context)
    inspector_name = service.populate_field("user.full_name", context)
    current_date = service.populate_field("current.date", context)
    
    print(f"\nPopulated fields:")
    print(f"  - Inspection start date: {start_date}")
    print(f"  - Equipment tag: {equipment_tag}")
    print(f"  - Inspector name: {inspector_name}")
    print(f"  - Current date: {current_date}")
    
    # Populate multiple fields at once
    field_mappings = {
        "start_date": "inspection.start_date",
        "equipment_tag": "equipment.tag",
        "inspector": "user.full_name",
        "report_date": "current.date"
    }
    
    results = service.populate_multiple_fields(field_mappings, context)
    print(f"\nMultiple field results: {results}")


def example_inspection_integration_usage():
    """Example of InspectionIntegrationService usage"""
    print("\n=== InspectionIntegrationService Usage ===")
    
    service = InspectionIntegrationService()
    
    # Create realistic mock inspection (simulating SQLModel instance)
    mock_inspection = Mock()
    mock_inspection.id = 123
    mock_inspection.inspection_number = "INS-2025-001"
    mock_inspection.title = "Annual Pressure Vessel Inspection"
    mock_inspection.start_date = date(2025, 1, 15)
    mock_inspection.end_date = date(2025, 1, 16)
    mock_inspection.status = "completed"
    mock_inspection.equipment_id = 456
    
    # Create mock equipment
    mock_equipment = Mock()
    mock_equipment.id = 456
    mock_equipment.tag = "PV-001"
    mock_equipment.description = "Main Pressure Vessel"
    mock_equipment.unit = "Unit A"
    mock_equipment.equipment_type = "Pressure Vessel"
    
    # Link equipment to inspection (simulating relationship)
    mock_inspection.equipment = mock_equipment
    
    # Get inspection summary
    summary = service.get_inspection_summary(mock_inspection)
    print(f"Inspection summary: {summary}")
    
    # Validate what auto-fields are available
    validation = service.validate_inspection_for_auto_fields(mock_inspection)
    print(f"\nAuto-field validation:")
    for source_key, is_available in validation.items():
        status = "✓" if is_available else "✗"
        print(f"  {status} {source_key}")
    
    # Get available sources for this inspection
    available_sources = service.get_available_auto_sources_for_inspection(mock_inspection)
    print(f"\nAvailable sources for this inspection: {len(available_sources)}")
    for key, description in available_sources.items():
        print(f"  - {key}: {description}")


def example_template_field_population():
    """Example of populating template fields with inspection data"""
    print("\n=== Template Field Population Example ===")
    
    service = InspectionIntegrationService()
    
    # Create mock inspection and equipment
    mock_inspection = Mock()
    mock_inspection.id = 123
    mock_inspection.inspection_number = "INS-2025-001"
    mock_inspection.start_date = date(2025, 1, 15)
    mock_inspection.status = "completed"
    
    mock_equipment = Mock()
    mock_equipment.tag = "PV-001"
    mock_equipment.description = "Main Pressure Vessel"
    mock_equipment.unit = "Unit A"
    
    mock_inspection.equipment = mock_equipment
    
    # Create mock template fields (simulating TemplateField instances)
    field1 = Mock()
    field1.id = 1
    field1.label = "Inspection Date"
    field1.value_source = 'auto'
    field1.auto_source_key = 'inspection.start_date'
    
    field2 = Mock()
    field2.id = 2
    field2.label = "Equipment Tag"
    field2.value_source = 'auto'
    field2.auto_source_key = 'equipment.tag'
    
    field3 = Mock()
    field3.id = 3
    field3.label = "Inspector Name"
    field3.value_source = 'manual'  # This will be skipped
    
    field4 = Mock()
    field4.id = 4
    field4.label = "Report Serial Number"
    field4.value_source = 'auto'
    field4.auto_source_key = 'report.serial_number'
    
    template_fields = [field1, field2, field3, field4]
    
    # Populate all auto fields
    results = service.populate_template_fields(template_fields, mock_inspection)
    
    print("Template field population results:")
    for field in template_fields:
        if field.id in results:
            print(f"  - {field.label} (ID: {field.id}): {results[field.id]}")
        else:
            print(f"  - {field.label} (ID: {field.id}): [Manual field or error]")


def example_error_handling():
    """Example of error handling in auto-field population"""
    print("\n=== Error Handling Example ===")
    
    service = InspectionIntegrationService()
    
    # Create incomplete inspection (missing some data)
    incomplete_inspection = Mock()
    incomplete_inspection.id = 123
    incomplete_inspection.start_date = date(2025, 1, 15)
    # Missing: end_date, status, inspection_number, equipment
    
    # Create template field with invalid source
    invalid_field = Mock()
    invalid_field.id = 1
    invalid_field.value_source = 'auto'
    invalid_field.auto_source_key = 'invalid.source'
    
    # Create field that requires missing data
    missing_data_field = Mock()
    missing_data_field.id = 2
    missing_data_field.value_source = 'auto'
    missing_data_field.auto_source_key = 'equipment.tag'  # No equipment available
    
    # Create valid field
    valid_field = Mock()
    valid_field.id = 3
    valid_field.value_source = 'auto'
    valid_field.auto_source_key = 'inspection.start_date'
    
    template_fields = [invalid_field, missing_data_field, valid_field]
    
    # Populate fields - should handle errors gracefully
    results = service.populate_template_fields(template_fields, incomplete_inspection)
    
    print("Error handling results:")
    print(f"  - Total fields: {len(template_fields)}")
    print(f"  - Successfully populated: {len(results)}")
    print(f"  - Results: {results}")
    
    # Show validation for incomplete inspection
    validation = service.validate_inspection_for_auto_fields(incomplete_inspection)
    print("\nValidation for incomplete inspection:")
    for source_key, is_available in validation.items():
        status = "✓" if is_available else "✗"
        print(f"  {status} {source_key}")


if __name__ == "__main__":
    example_basic_auto_field_usage()
    example_inspection_integration_usage()
    example_template_field_population()
    example_error_handling()