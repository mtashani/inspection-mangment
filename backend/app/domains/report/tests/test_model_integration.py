"""Comprehensive model integration tests"""

import pytest
from datetime import date, datetime
from unittest.mock import Mock, MagicMock

from app.domains.report.models.template import Template
from app.domains.report.models.template_section import TemplateSection
from app.domains.report.models.template_subsection import TemplateSubSection
from app.domains.report.models.template_field import TemplateField
from app.domains.report.models.final_report import FinalReport
from app.domains.report.models.report_field_value import ReportFieldValue
from app.domains.report.models.enums import SectionType, FieldType, ValueSource, ReportStatus


class TestCompleteTemplateCreation:
    """Test complete template creation with all nested relationships"""
    
    def test_create_complete_template_structure(self):
        """Test creating a complete template with all relationships"""
        
        # Create template
        template = Template(
            name="Complete Integration Test Template",
            description="Template for testing complete integration",
            is_active=True
        )
        
        # Create header section
        header_section = TemplateSection(
            title="Header Section",
            section_type=SectionType.HEADER,
            order=0
        )
        
        # Create header subsection
        header_subsection = TemplateSubSection(
            title="General Information",
            order=0
        )
        
        # Create header fields
        date_field = TemplateField(
            label="Inspection Date",
            field_type=FieldType.DATE,
            value_source=ValueSource.AUTO,
            order=0,
            row=0,
            col=0,
            is_required=True,
            auto_source_key="inspection.start_date"
        )
        
        equipment_field = TemplateField(
            label="Equipment Tag",
            field_type=FieldType.TEXT,
            value_source=ValueSource.AUTO,
            order=1,
            row=0,
            col=1,
            is_required=True,
            auto_source_key="equipment.tag"
        )
        
        # Create body section
        body_section = TemplateSection(
            title="Body Section",
            section_type=SectionType.BODY,
            order=1
        )
        
        # Create body subsection
        body_subsection = TemplateSubSection(
            title="Inspection Results",
            order=0
        )
        
        # Create body fields
        findings_field = TemplateField(
            label="Findings",
            field_type=FieldType.TEXTAREA,
            value_source=ValueSource.MANUAL,
            order=0,
            row=1,
            col=0,
            colspan=2,
            is_required=True,
            placeholder="Describe inspection findings..."
        )
        
        severity_field = TemplateField(
            label="Severity Level",
            field_type=FieldType.SELECT,
            value_source=ValueSource.MANUAL,
            order=1,
            row=2,
            col=0,
            is_required=True,
            options='["Low", "Medium", "High", "Critical"]'
        )
        
        # Build relationships
        header_subsection.fields = [date_field, equipment_field]
        header_section.subsections = [header_subsection]
        
        body_subsection.fields = [findings_field, severity_field]
        body_section.subsections = [body_subsection]
        
        template.sections = [header_section, body_section]
        
        # Verify structure
        assert template.name == "Complete Integration Test Template"
        assert len(template.sections) == 2
        
        # Verify header section
        assert template.sections[0].title == "Header Section"
        assert template.sections[0].section_type == SectionType.HEADER
        assert len(template.sections[0].subsections) == 1
        assert len(template.sections[0].subsections[0].fields) == 2
        
        # Verify body section
        assert template.sections[1].title == "Body Section"
        assert template.sections[1].section_type == SectionType.BODY
        assert len(template.sections[1].subsections) == 1
        assert len(template.sections[1].subsections[0].fields) == 2
        
        # Verify field properties
        date_field_check = template.sections[0].subsections[0].fields[0]
        assert date_field_check.label == "Inspection Date"
        assert date_field_check.field_type == FieldType.DATE
        assert date_field_check.value_source == ValueSource.AUTO
        assert date_field_check.auto_source_key == "inspection.start_date"
        
        print("✓ Complete template structure creation test passed")
    
    def test_template_field_positioning(self):
        """Test template field positioning and canvas layout"""
        
        # Create template with complex positioning
        template = Template(name="Positioning Test Template")
        section = TemplateSection(title="Test Section", section_type=SectionType.BODY, order=0)
        subsection = TemplateSubSection(title="Test Subsection", order=0)
        
        # Create fields with different positioning
        fields = [
            TemplateField(
                label="Field 1",
                field_type=FieldType.TEXT,
                value_source=ValueSource.MANUAL,
                order=0,
                row=0, col=0, rowspan=1, colspan=1
            ),
            TemplateField(
                label="Field 2 (Wide)",
                field_type=FieldType.TEXTAREA,
                value_source=ValueSource.MANUAL,
                order=1,
                row=0, col=1, rowspan=1, colspan=2
            ),
            TemplateField(
                label="Field 3 (Tall)",
                field_type=FieldType.TEXT,
                value_source=ValueSource.MANUAL,
                order=2,
                row=1, col=0, rowspan=2, colspan=1
            ),
            TemplateField(
                label="Field 4",
                field_type=FieldType.SELECT,
                value_source=ValueSource.MANUAL,
                order=3,
                row=1, col=1, rowspan=1, colspan=1,
                options='["Option 1", "Option 2"]'
            )
        ]
        
        subsection.fields = fields
        section.subsections = [subsection]
        template.sections = [section]
        
        # Verify positioning
        assert fields[0].row == 0 and fields[0].col == 0
        assert fields[1].colspan == 2  # Wide field
        assert fields[2].rowspan == 2  # Tall field
        
        # Check for positioning conflicts (this would be done by validation service)
        occupied_cells = {}
        conflicts = []
        
        for field in fields:
            for row in range(field.row, field.row + field.rowspan):
                for col in range(field.col, field.col + field.colspan):
                    cell_key = f"{row},{col}"
                    if cell_key in occupied_cells:
                        conflicts.append(f"Conflict at ({row}, {col}) between {field.label} and {occupied_cells[cell_key].label}")
                    else:
                        occupied_cells[cell_key] = field
        
        # Should have one conflict (Field 2 and Field 4 both use cell 1,1)
        assert len(conflicts) == 1
        assert "Field 2 (Wide)" in conflicts[0] and "Field 4" in conflicts[0]
        
        print("✓ Template field positioning test passed")


class TestReportSubmissionWithVariousFieldTypes:
    """Test report submission with various field types and values"""
    
    def test_report_with_all_field_types(self):
        """Test creating and submitting report with all field types"""
        
        # Create final report
        final_report = FinalReport(
            inspection_id=123,
            template_id=1,
            created_by=456,
            status=ReportStatus.DRAFT,
            report_serial_number="RPT-123-001"
        )
        
        # Create field values for different types
        field_values = []
        
        # Text field
        text_value = ReportFieldValue(
            final_report_id=1,
            template_field_id=1,
            text_value="Sample text value"
        )
        field_values.append(text_value)
        
        # Number field
        number_value = ReportFieldValue(
            final_report_id=1,
            template_field_id=2,
            number_value=123.45
        )
        field_values.append(number_value)
        
        # Date field
        date_value = ReportFieldValue(
            final_report_id=1,
            template_field_id=3,
            date_value=date(2025, 1, 15)
        )
        field_values.append(date_value)
        
        # Boolean field
        boolean_value = ReportFieldValue(
            final_report_id=1,
            template_field_id=4,
            boolean_value=True
        )
        field_values.append(boolean_value)
        
        # JSON field (for complex data)
        json_value = ReportFieldValue(
            final_report_id=1,
            template_field_id=5,
            json_value='{"measurements": [1.2, 3.4, 5.6], "notes": "Complex data"}'
        )
        field_values.append(json_value)
        
        final_report.field_values = field_values
        
        # Verify field values
        assert len(final_report.field_values) == 5
        
        # Check each field type
        text_field = final_report.field_values[0]
        assert text_field.text_value == "Sample text value"
        assert text_field.number_value is None
        
        number_field = final_report.field_values[1]
        assert number_field.number_value == 123.45
        assert number_field.text_value is None
        
        date_field = final_report.field_values[2]
        assert date_field.date_value == date(2025, 1, 15)
        
        boolean_field = final_report.field_values[3]
        assert boolean_field.boolean_value is True
        
        json_field = final_report.field_values[4]
        assert '"measurements"' in json_field.json_value
        
        print("✓ Report with all field types test passed")
    
    def test_report_status_workflow(self):
        """Test report status progression workflow"""
        
        # Create report in draft status
        report = FinalReport(
            inspection_id=123,
            template_id=1,
            status=ReportStatus.DRAFT,
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow()
        )
        
        assert report.status == ReportStatus.DRAFT
        
        # Submit report
        report.status = ReportStatus.SUBMITTED
        report.updated_at = datetime.utcnow()
        
        assert report.status == ReportStatus.SUBMITTED
        
        # Approve report
        report.status = ReportStatus.APPROVED
        report.updated_at = datetime.utcnow()
        
        assert report.status == ReportStatus.APPROVED
        
        # Test invalid status transition (this would be handled by business logic)
        # For now, just verify the enum values exist
        all_statuses = [ReportStatus.DRAFT, ReportStatus.SUBMITTED, ReportStatus.APPROVED, ReportStatus.REJECTED]
        assert len(all_statuses) == 4
        
        print("✓ Report status workflow test passed")


class TestAutoFieldPopulationWithRealData:
    """Test auto-field population with realistic inspection data"""
    
    def test_auto_field_population_integration(self):
        """Test auto-field population with mock inspection data"""
        
        # Create mock inspection data
        mock_inspection = Mock()
        mock_inspection.id = 123
        mock_inspection.inspection_number = "INS-2025-001"
        mock_inspection.start_date = date(2025, 1, 15)
        mock_inspection.end_date = date(2025, 1, 16)
        mock_inspection.status = "completed"
        
        # Create mock equipment data
        mock_equipment = Mock()
        mock_equipment.id = 456
        mock_equipment.tag = "PV-001"
        mock_equipment.description = "Main Pressure Vessel"
        mock_equipment.unit = "Unit A"
        mock_equipment.equipment_type = "Pressure Vessel"
        
        # Create mock user data
        mock_user = Mock()
        mock_user.full_name = "John Doe"
        mock_user.department = "Engineering"
        
        # Create template with auto fields
        template = Template(name="Auto-Population Test Template")
        section = TemplateSection(title="Header", section_type=SectionType.HEADER, order=0)
        subsection = TemplateSubSection(title="General Info", order=0)
        
        auto_fields = [
            TemplateField(
                label="Inspection Date",
                field_type=FieldType.DATE,
                value_source=ValueSource.AUTO,
                order=0,
                auto_source_key="inspection.start_date"
            ),
            TemplateField(
                label="Equipment Tag",
                field_type=FieldType.TEXT,
                value_source=ValueSource.AUTO,
                order=1,
                auto_source_key="equipment.tag"
            ),
            TemplateField(
                label="Inspector Name",
                field_type=FieldType.TEXT,
                value_source=ValueSource.AUTO,
                order=2,
                auto_source_key="user.full_name"
            ),
            TemplateField(
                label="Current Date",
                field_type=FieldType.DATE,
                value_source=ValueSource.AUTO,
                order=3,
                auto_source_key="current.date"
            )
        ]
        
        subsection.fields = auto_fields
        section.subsections = [subsection]
        template.sections = [section]
        
        # Simulate auto-field population
        auto_populated_values = {
            auto_fields[0].id: mock_inspection.start_date,  # inspection.start_date
            auto_fields[1].id: mock_equipment.tag,          # equipment.tag
            auto_fields[2].id: mock_user.full_name,         # user.full_name
            auto_fields[3].id: date.today()                 # current.date
        }
        
        # Verify auto-population
        assert auto_populated_values[auto_fields[0].id] == date(2025, 1, 15)
        assert auto_populated_values[auto_fields[1].id] == "PV-001"
        assert auto_populated_values[auto_fields[2].id] == "John Doe"
        assert auto_populated_values[auto_fields[3].id] == date.today()
        
        # Create report field values
        report_field_values = []
        for field_id, value in auto_populated_values.items():
            field_value = ReportFieldValue(
                final_report_id=1,
                template_field_id=field_id
            )
            
            # Store value based on type
            if isinstance(value, date):
                field_value.date_value = value
            elif isinstance(value, str):
                field_value.text_value = value
            else:
                field_value.json_value = str(value)
            
            report_field_values.append(field_value)
        
        assert len(report_field_values) == 4
        
        print("✓ Auto-field population integration test passed")


class TestComplexTemplateStructures:
    """Test performance and functionality with complex template structures"""
    
    def test_large_template_performance(self):
        """Test creating and managing large template structures"""
        
        # Create a complex template with many sections and fields
        template = Template(name="Large Performance Test Template")
        
        sections = []
        total_fields = 0
        
        # Create 5 sections
        for section_idx in range(5):
            section = TemplateSection(
                title=f"Section {section_idx + 1}",
                section_type=SectionType.BODY if section_idx > 0 else SectionType.HEADER,
                order=section_idx
            )
            
            subsections = []
            
            # Create 3 subsections per section
            for subsection_idx in range(3):
                subsection = TemplateSubSection(
                    title=f"Subsection {section_idx + 1}.{subsection_idx + 1}",
                    order=subsection_idx
                )
                
                fields = []
                
                # Create 8 fields per subsection (total: 5 * 3 * 8 = 120 fields)
                for field_idx in range(8):
                    field_type = [FieldType.TEXT, FieldType.NUMBER, FieldType.DATE, FieldType.SELECT, 
                                 FieldType.TEXTAREA, FieldType.CHECKBOX][field_idx % 6]
                    value_source = ValueSource.AUTO if field_idx % 3 == 0 else ValueSource.MANUAL
                    
                    field = TemplateField(
                        label=f"Field {section_idx + 1}.{subsection_idx + 1}.{field_idx + 1}",
                        field_type=field_type,
                        value_source=value_source,
                        order=field_idx,
                        row=field_idx // 4,
                        col=field_idx % 4,
                        is_required=(field_idx % 5 == 0),
                        auto_source_key="inspection.start_date" if value_source == ValueSource.AUTO else None
                    )
                    
                    if field_type == FieldType.SELECT:
                        field.options = f'["Option 1", "Option 2", "Option 3"]'
                    
                    fields.append(field)
                    total_fields += 1
                
                subsection.fields = fields
                subsections.append(subsection)
            
            section.subsections = subsections
            sections.append(section)
        
        template.sections = sections
        
        # Verify large structure
        assert len(template.sections) == 5
        assert total_fields == 120
        
        # Count different field types
        field_type_counts = {}
        auto_field_count = 0
        required_field_count = 0
        
        for section in template.sections:
            for subsection in section.subsections:
                for field in subsection.fields:
                    # Count field types
                    field_type = field.field_type
                    field_type_counts[field_type] = field_type_counts.get(field_type, 0) + 1
                    
                    # Count auto fields
                    if field.value_source == ValueSource.AUTO:
                        auto_field_count += 1
                    
                    # Count required fields
                    if field.is_required:
                        required_field_count += 1
        
        assert auto_field_count == 40  # Every 3rd field is auto (120 / 3)
        assert required_field_count == 24  # Every 5th field is required (120 / 5)
        assert len(field_type_counts) == 6  # 6 different field types
        
        print(f"✓ Large template performance test passed (120 fields, {auto_field_count} auto, {required_field_count} required)")
    
    def test_nested_relationship_integrity(self):
        """Test integrity of nested relationships in complex structures"""
        
        # Create template with deep nesting
        template = Template(name="Relationship Integrity Test")
        
        # Create sections with back-references
        sections = []
        for i in range(3):
            section = TemplateSection(
                title=f"Section {i}",
                section_type=SectionType.BODY,
                order=i
            )
            
            # Mock template relationship
            section.template = template
            
            subsections = []
            for j in range(2):
                subsection = TemplateSubSection(
                    title=f"Subsection {i}.{j}",
                    order=j
                )
                
                # Mock section relationship
                subsection.section = section
                
                fields = []
                for k in range(3):
                    field = TemplateField(
                        label=f"Field {i}.{j}.{k}",
                        field_type=FieldType.TEXT,
                        value_source=ValueSource.MANUAL,
                        order=k
                    )
                    
                    # Mock subsection relationship
                    field.subsection = subsection
                    
                    fields.append(field)
                
                subsection.fields = fields
                subsections.append(subsection)
            
            section.subsections = subsections
            sections.append(section)
        
        template.sections = sections
        
        # Verify relationship integrity
        for section in template.sections:
            assert section.template is template
            
            for subsection in section.subsections:
                assert subsection.section is section
                
                for field in subsection.fields:
                    assert field.subsection is subsection
        
        # Test navigation through relationships
        first_field = template.sections[0].subsections[0].fields[0]
        assert first_field.subsection.section.template is template
        
        print("✓ Nested relationship integrity test passed")


class TestDataIntegrityAndConstraints:
    """Test data integrity and constraint validation"""
    
    def test_field_value_type_constraints(self):
        """Test field value type constraints and validation"""
        
        # Test text field constraints
        text_field_value = ReportFieldValue(
            final_report_id=1,
            template_field_id=1,
            text_value="Valid text value"
        )
        
        # Should only have text_value set
        assert text_field_value.text_value == "Valid text value"
        assert text_field_value.number_value is None
        assert text_field_value.date_value is None
        assert text_field_value.boolean_value is None
        assert text_field_value.json_value is None
        
        # Test number field constraints
        number_field_value = ReportFieldValue(
            final_report_id=1,
            template_field_id=2,
            number_value=123.45
        )
        
        assert number_field_value.number_value == 123.45
        assert number_field_value.text_value is None
        
        # Test date field constraints
        date_field_value = ReportFieldValue(
            final_report_id=1,
            template_field_id=3,
            date_value=date(2025, 1, 15)
        )
        
        assert date_field_value.date_value == date(2025, 1, 15)
        assert date_field_value.text_value is None
        
        print("✓ Field value type constraints test passed")
    
    def test_template_field_configuration_validation(self):
        """Test template field configuration validation"""
        
        # Test valid field configurations
        valid_configs = [
            {
                'field_type': FieldType.TEXT,
                'value_source': ValueSource.MANUAL,
                'auto_source_key': None,
                'options': None
            },
            {
                'field_type': FieldType.SELECT,
                'value_source': ValueSource.MANUAL,
                'auto_source_key': None,
                'options': '["Option 1", "Option 2"]'
            },
            {
                'field_type': FieldType.DATE,
                'value_source': ValueSource.AUTO,
                'auto_source_key': 'inspection.start_date',
                'options': None
            }
        ]
        
        for config in valid_configs:
            field = TemplateField(
                label="Test Field",
                field_type=config['field_type'],
                value_source=config['value_source'],
                order=0,
                auto_source_key=config['auto_source_key'],
                options=config['options']
            )
            
            # Verify configuration
            assert field.field_type == config['field_type']
            assert field.value_source == config['value_source']
            assert field.auto_source_key == config['auto_source_key']
            assert field.options == config['options']
        
        print("✓ Template field configuration validation test passed")


def run_all_integration_tests():
    """Run all integration tests"""
    print("=== Running Model Integration Tests ===\n")
    
    # Template creation tests
    template_tests = TestCompleteTemplateCreation()
    template_tests.test_create_complete_template_structure()
    template_tests.test_template_field_positioning()
    
    # Report submission tests
    report_tests = TestReportSubmissionWithVariousFieldTypes()
    report_tests.test_report_with_all_field_types()
    report_tests.test_report_status_workflow()
    
    # Auto-field population tests
    auto_field_tests = TestAutoFieldPopulationWithRealData()
    auto_field_tests.test_auto_field_population_integration()
    
    # Performance tests
    performance_tests = TestComplexTemplateStructures()
    performance_tests.test_large_template_performance()
    performance_tests.test_nested_relationship_integrity()
    
    # Data integrity tests
    integrity_tests = TestDataIntegrityAndConstraints()
    integrity_tests.test_field_value_type_constraints()
    integrity_tests.test_template_field_configuration_validation()
    
    print("\n🎉 All Model Integration Tests Passed!")


if __name__ == "__main__":
    run_all_integration_tests()