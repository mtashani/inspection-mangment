"""Example usage of TemplateService validation functionality"""

from unittest.mock import Mock
from app.domains.report.services.template_service import (
    TemplateService, 
    ValidationResult, 
    ValidationError
)


def example_validation_result_usage():
    """Example of using ValidationResult"""
    print("=== ValidationResult Usage Example ===")
    
    # Create validation result
    result = ValidationResult()
    print(f"Initial state - Valid: {result.is_valid}")
    
    # Add some errors
    result.add_error("Template name is required", "name", "MISSING_NAME")
    result.add_error("Field label is missing", "sections[0].fields[1].label", "MISSING_LABEL")
    
    # Add some warnings
    result.add_warning("Template missing header section", "sections", "MISSING_HEADER")
    result.add_warning("No required fields found", "fields", "NO_REQUIRED_FIELDS")
    
    print(f"After adding errors/warnings - Valid: {result.is_valid}")
    print(f"Errors: {len(result.errors)}, Warnings: {len(result.warnings)}")
    
    # Get summary
    summary = result.get_summary()
    print(f"\nValidation Summary:")
    print(f"  - Valid: {summary['is_valid']}")
    print(f"  - Errors: {summary['error_count']}")
    print(f"  - Warnings: {summary['warning_count']}")
    
    print("\nError Details:")
    for error in summary['errors']:
        print(f"  - {error['message']} (Path: {error['field_path']}, Code: {error['error_code']})")
    
    print("\nWarning Details:")
    for warning in summary['warnings']:
        print(f"  - {warning['message']} (Path: {warning['field_path']}, Code: {warning['error_code']})")


def example_field_configuration_validation():
    """Example of field configuration validation"""
    print("\n=== Field Configuration Validation Example ===")
    
    mock_session = Mock()
    service = TemplateService(mock_session)
    
    # Example 1: Valid manual field
    print("\n1. Valid Manual Field:")
    valid_field = {
        'label': 'Inspector Name',
        'field_type': 'text',
        'value_source': 'manual',
        'is_required': True,
        'placeholder': 'Enter inspector name',
        'row': 0,
        'col': 0,
        'rowspan': 1,
        'colspan': 2
    }
    
    result = service.validate_field_configuration(valid_field)
    print(f"  Valid: {result.is_valid}")
    if result.errors:
        for error in result.errors:
            print(f"  Error: {error['message']}")
    
    # Example 2: Valid auto field
    print("\n2. Valid Auto Field:")
    valid_auto_field = {
        'label': 'Inspection Date',
        'field_type': 'date',
        'value_source': 'auto',
        'auto_source_key': 'inspection.start_date',
        'row': 1,
        'col': 0
    }
    
    result = service.validate_field_configuration(valid_auto_field)
    print(f"  Valid: {result.is_valid}")
    if result.errors:
        for error in result.errors:
            print(f"  Error: {error['message']}")
    
    # Example 3: Invalid field - missing required properties
    print("\n3. Invalid Field - Missing Required Properties:")
    invalid_field = {
        'field_type': 'text'
        # Missing label and value_source
    }
    
    result = service.validate_field_configuration(invalid_field)
    print(f"  Valid: {result.is_valid}")
    for error in result.errors:
        print(f"  Error: {error['message']} (Field: {error['field_path']})")
    
    # Example 4: Invalid auto field - bad source key
    print("\n4. Invalid Auto Field - Bad Source Key:")
    invalid_auto_field = {
        'label': 'Bad Auto Field',
        'field_type': 'text',
        'value_source': 'auto',
        'auto_source_key': 'invalid.source.key'
    }
    
    result = service.validate_field_configuration(invalid_auto_field)
    print(f"  Valid: {result.is_valid}")
    for error in result.errors:
        print(f"  Error: {error['message']}")
    
    # Example 5: Select field with options
    print("\n5. Select Field with Options:")
    select_field = {
        'label': 'Priority Level',
        'field_type': 'select',
        'value_source': 'manual',
        'options': '["Low", "Medium", "High", "Critical"]',
        'is_required': True
    }
    
    result = service.validate_field_configuration(select_field)
    print(f"  Valid: {result.is_valid}")
    if result.errors:
        for error in result.errors:
            print(f"  Error: {error['message']}")


def example_validation_error_codes():
    """Example of validation error codes and their meanings"""
    print("\n=== Validation Error Codes Example ===")
    
    error_codes = {
        'MISSING_NAME': 'Template name is required',
        'DUPLICATE_NAME': 'Template name already exists',
        'NO_SECTIONS': 'Template must have at least one section',
        'MISSING_SECTION_TITLE': 'Section title is required',
        'DUPLICATE_SECTION_ORDER': 'Duplicate section orders found',
        'MISSING_FIELD_LABEL': 'Field label is required',
        'MISSING_AUTO_SOURCE_KEY': 'Auto-source key is required for auto fields',
        'INVALID_AUTO_SOURCE_KEY': 'Invalid auto-source key',
        'MISSING_SELECT_OPTIONS': 'Select field must have options',
        'POSITION_CONFLICT': 'Field positioning conflict detected',
        'NEGATIVE_POSITION': 'Field position cannot be negative',
        'INVALID_SPAN': 'Field span must be at least 1'
    }
    
    print("Common validation error codes:")
    for code, description in error_codes.items():
        print(f"  - {code}: {description}")


def example_template_structure_validation_workflow():
    """Example workflow for template structure validation"""
    print("\n=== Template Structure Validation Workflow ===")
    
    print("Typical validation workflow:")
    print("1. Validate basic template properties (name, description)")
    print("2. Validate sections exist and have proper structure")
    print("3. Validate section ordering and uniqueness")
    print("4. Validate subsections within each section")
    print("5. Validate fields within each subsection")
    print("6. Validate field configurations (types, sources, options)")
    print("7. Validate canvas positioning for conflicts")
    print("8. Check template completeness for report generation")
    
    print("\nValidation levels:")
    print("- ERRORS: Issues that prevent template from working")
    print("- WARNINGS: Issues that might affect usability but don't break functionality")
    
    print("\nExample validation results interpretation:")
    print("- is_valid=True, 0 errors, 0 warnings: Template is perfect")
    print("- is_valid=True, 0 errors, 2 warnings: Template works but has minor issues")
    print("- is_valid=False, 3 errors, 1 warning: Template has critical issues that must be fixed")


def example_validation_best_practices():
    """Example of validation best practices"""
    print("\n=== Validation Best Practices ===")
    
    print("1. Field Configuration:")
    print("   - Always provide meaningful labels")
    print("   - Use appropriate field types for data")
    print("   - Set required fields for critical data")
    print("   - Provide placeholders for user guidance")
    
    print("\n2. Auto Fields:")
    print("   - Use valid auto-source keys from AUTO_SOURCES")
    print("   - Don't make auto fields required if source data might be missing")
    print("   - Consider fallback options for missing auto data")
    
    print("\n3. Canvas Positioning:")
    print("   - Plan your layout to avoid overlaps")
    print("   - Use consistent spacing and alignment")
    print("   - Consider responsive design principles")
    
    print("\n4. Template Structure:")
    print("   - Include header section for report metadata")
    print("   - Include body section for main content")
    print("   - Use logical section ordering")
    print("   - Group related fields in subsections")
    
    print("\n5. Validation Workflow:")
    print("   - Validate during template creation")
    print("   - Re-validate after modifications")
    print("   - Check completeness before publishing")
    print("   - Monitor validation results in production")


if __name__ == "__main__":
    example_validation_result_usage()
    example_field_configuration_validation()
    example_validation_error_codes()
    example_template_structure_validation_workflow()
    example_validation_best_practices()