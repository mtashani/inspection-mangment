"""Tests for ReportService auto-field integration"""

import pytest
from datetime import date
from unittest.mock import Mock, MagicMock

from app.domains.report.services.report_service import ReportService, ReportSubmissionResult
from app.domains.report.models.template import Template
from app.domains.report.models.template_section import TemplateSection
from app.domains.report.models.template_subsection import TemplateSubSection
from app.domains.report.models.template_field import TemplateField
from app.domains.report.models.enums import SectionType, FieldType, ValueSource


class TestReportAutoIntegration:
    """Test cases for ReportService auto-field integration"""
    
    def setup_method(self):
        """Set up test fixtures"""
        self.mock_session = Mock()
        self.service = ReportService(self.mock_session)
        
        # Mock dependencies
        self.service.template_service = Mock()
        self.service.integration_service = Mock()
        
        # Create mock template with auto fields
        self.mock_auto_field = Mock(spec=TemplateField)
        self.mock_auto_field.id = 1
        self.mock_auto_field.label = "Inspection Date"
        self.mock_auto_field.field_type = FieldType.DATE
        self.mock_auto_field.value_source = ValueSource.AUTO
        self.mock_auto_field.auto_source_key = "inspection.start_date"
        self.mock_auto_field.is_required = False
        
        self.mock_manual_field = Mock(spec=TemplateField)
        self.mock_manual_field.id = 2
        self.mock_manual_field.label = "Inspector Notes"
        self.mock_manual_field.field_type = FieldType.TEXTAREA
        self.mock_manual_field.value_source = ValueSource.MANUAL
        self.mock_manual_field.auto_source_key = None
        self.mock_manual_field.is_required = True
        
        self.mock_subsection = Mock(spec=TemplateSubSection)
        self.mock_subsection.id = 1
        self.mock_subsection.title = "General Info"
        self.mock_subsection.fields = [self.mock_auto_field, self.mock_manual_field]
        
        self.mock_section = Mock(spec=TemplateSection)
        self.mock_section.id = 1
        self.mock_section.title = "Header"
        self.mock_section.section_type = SectionType.HEADER
        self.mock_section.subsections = [self.mock_subsection]
        
        self.mock_template = Mock(spec=Template)
        self.mock_template.id = 1
        self.mock_template.name = "Test Template"
        self.mock_template.is_active = True
        self.mock_template.sections = [self.mock_section]
        
        # Mock inspection data
        self.mock_inspection = Mock()
        self.mock_inspection.id = 123
        self.mock_inspection.start_date = date(2025, 1, 15)
        
        # Mock equipment data
        self.mock_equipment = Mock()
        self.mock_equipment.tag = "EQ-001"
    
    def test_auto_populate_fields_success(self):
        """Test successful auto-field population"""
        # Mock integration service response
        self.service.integration_service.populate_template_fields.return_value = {
            1: date(2025, 1, 15)  # auto field populated
        }
        
        result = ReportSubmissionResult()
        auto_values = self.service._auto_populate_fields(
            self.mock_template,
            self.mock_inspection,
            self.mock_equipment,
            None,
            result
        )
        
        assert len(auto_values) == 1
        assert auto_values[1] == date(2025, 1, 15)
        assert len(result.warnings) == 1
        assert "Auto-populated 1 fields" in result.warnings[0]['message']
    
    def test_auto_populate_fields_no_auto_fields(self):
        """Test auto-population when template has no auto fields"""
        # Template with only manual fields
        self.mock_subsection.fields = [self.mock_manual_field]
        
        result = ReportSubmissionResult()
        auto_values = self.service._auto_populate_fields(
            self.mock_template,
            self.mock_inspection,
            result=result
        )
        
        assert len(auto_values) == 0
        assert len(result.warnings) == 0
    
    def test_auto_populate_fields_integration_error(self):
        """Test auto-population when integration service fails"""
        # Mock integration service to raise exception
        self.service.integration_service.populate_template_fields.side_effect = Exception("Integration failed")
        
        result = ReportSubmissionResult()
        auto_values = self.service._auto_populate_fields(
            self.mock_template,
            self.mock_inspection,
            result=result
        )
        
        assert len(auto_values) == 0
        assert len(result.warnings) == 1
        assert "Auto-population failed" in result.warnings[0]['message']
    
    def test_create_report_with_auto_population_success(self):
        """Test creating report with auto-population"""
        # Mock template service
        self.service.template_service.get_template_with_structure.return_value = self.mock_template
        
        # Mock validation result
        mock_validation = Mock()
        mock_validation.is_valid = True
        mock_validation.errors = []
        self.service.template_service.validate_template_structure.return_value = mock_validation
        
        # Mock integration service
        self.service.integration_service.populate_template_fields.return_value = {
            1: date(2025, 1, 15)
        }
        
        # Mock session behavior
        self.mock_session.add = Mock()
        self.mock_session.flush = Mock()
        self.mock_session.commit = Mock()
        
        result = self.service.create_report_with_auto_population(
            template_id=1,
            inspection_id=123,
            inspection_data=self.mock_inspection,
            equipment_data=self.mock_equipment,
            manual_field_values={2: "Manual notes"}
        )
        
        assert result.success is True
        assert len(result.warnings) >= 1  # Should have auto-population warning
        self.mock_session.commit.assert_called_once()
    
    def test_get_auto_populated_preview_success(self):
        """Test getting auto-populated field preview"""
        # Mock template service
        self.service.template_service.get_template_with_structure.return_value = self.mock_template
        
        # Mock integration service
        self.service.integration_service.populate_template_fields.return_value = {
            1: date(2025, 1, 15)
        }
        
        result = self.service.get_auto_populated_preview(
            template_id=1,
            inspection_data=self.mock_inspection,
            equipment_data=self.mock_equipment
        )
        
        assert result['success'] is True
        assert result['template']['id'] == 1
        assert result['template']['name'] == "Test Template"
        assert len(result['auto_fields']) == 1
        assert len(result['manual_fields']) == 1
        assert result['auto_population_count'] == 1
        
        # Check auto field details
        auto_field = result['auto_fields'][1]
        assert auto_field['label'] == "Inspection Date"
        assert auto_field['auto_source_key'] == "inspection.start_date"
        assert auto_field['value'] == date(2025, 1, 15)
        assert auto_field['populated'] is True
        
        # Check manual field details
        manual_field = result['manual_fields'][2]
        assert manual_field['label'] == "Inspector Notes"
        assert manual_field['is_required'] is True
    
    def test_get_auto_populated_preview_template_not_found(self):
        """Test preview when template not found"""
        self.service.template_service.get_template_with_structure.return_value = None
        
        result = self.service.get_auto_populated_preview(
            template_id=999,
            inspection_data=self.mock_inspection
        )
        
        assert result['success'] is False
        assert "not found" in result['error']
        assert len(result['auto_fields']) == 0
        assert len(result['manual_fields']) == 0
    
    def test_validate_auto_field_availability_success(self):
        """Test validating auto-field availability"""
        # Mock template service
        self.service.template_service.get_template_with_structure.return_value = self.mock_template
        
        # Mock integration service validation
        self.service.integration_service.validate_inspection_for_auto_fields.return_value = {
            'inspection.start_date': True,
            'inspection.end_date': False,
            'equipment.tag': True
        }
        
        result = self.service.validate_auto_field_availability(
            template_id=1,
            inspection_data=self.mock_inspection,
            equipment_data=self.mock_equipment
        )
        
        assert result['success'] is True
        assert result['template']['id'] == 1
        assert len(result['auto_fields']) == 1
        
        # Check auto field availability
        auto_field = result['auto_fields'][1]
        assert auto_field['label'] == "Inspection Date"
        assert auto_field['auto_source_key'] == "inspection.start_date"
        assert auto_field['is_available'] is True
        
        # Check summary
        summary = result['summary']
        assert summary['total_auto_fields'] == 1
        assert summary['available_fields'] == 1
        assert summary['unavailable_fields'] == 0
        assert summary['availability_percentage'] == 100.0
    
    def test_validate_auto_field_availability_partial(self):
        """Test validating auto-field availability with partial data"""
        # Add another auto field
        mock_auto_field2 = Mock(spec=TemplateField)
        mock_auto_field2.id = 3
        mock_auto_field2.label = "Equipment Tag"
        mock_auto_field2.field_type = FieldType.TEXT
        mock_auto_field2.value_source = ValueSource.AUTO
        mock_auto_field2.auto_source_key = "equipment.tag"
        mock_auto_field2.is_required = False
        
        self.mock_subsection.fields = [self.mock_auto_field, mock_auto_field2, self.mock_manual_field]
        
        # Mock template service
        self.service.template_service.get_template_with_structure.return_value = self.mock_template
        
        # Mock integration service validation (only one source available)
        self.service.integration_service.validate_inspection_for_auto_fields.return_value = {
            'inspection.start_date': True,
            'equipment.tag': False  # Not available
        }
        
        result = self.service.validate_auto_field_availability(
            template_id=1,
            inspection_data=self.mock_inspection
        )
        
        assert result['success'] is True
        assert len(result['auto_fields']) == 2
        
        # Check availability
        assert result['auto_fields'][1]['is_available'] is True
        assert result['auto_fields'][3]['is_available'] is False
        
        # Check summary
        summary = result['summary']
        assert summary['total_auto_fields'] == 2
        assert summary['available_fields'] == 1
        assert summary['unavailable_fields'] == 1
        assert summary['availability_percentage'] == 50.0
    
    def test_validate_auto_field_availability_template_not_found(self):
        """Test validation when template not found"""
        self.service.template_service.get_template_with_structure.return_value = None
        
        result = self.service.validate_auto_field_availability(
            template_id=999,
            inspection_data=self.mock_inspection
        )
        
        assert result['success'] is False
        assert "not found" in result['error']
    
    def test_create_report_auto_and_manual_values(self):
        """Test creating report with both auto and manual field values"""
        # Mock template service
        self.service.template_service.get_template_with_structure.return_value = self.mock_template
        
        # Mock validation result
        mock_validation = Mock()
        mock_validation.is_valid = True
        mock_validation.errors = []
        self.service.template_service.validate_template_structure.return_value = mock_validation
        
        # Mock integration service
        self.service.integration_service.populate_template_fields.return_value = {
            1: date(2025, 1, 15)  # Auto field
        }
        
        # Mock session behavior
        self.mock_session.add = Mock()
        self.mock_session.flush = Mock()
        self.mock_session.commit = Mock()
        
        # Mock _process_field_values to capture the combined values
        processed_values = {}
        def mock_process_field_values(report, template, field_values, result, validate_required=True):
            processed_values.update(field_values)
        
        self.service._process_field_values = mock_process_field_values
        
        result = self.service.create_report_from_template(
            template_id=1,
            inspection_id=123,
            field_values={2: "Manual notes"},  # Manual field
            inspection_data=self.mock_inspection,
            auto_populate=True
        )
        
        # Should have both auto and manual values
        assert 1 in processed_values  # Auto field
        assert 2 in processed_values  # Manual field
        assert processed_values[1] == date(2025, 1, 15)
        assert processed_values[2] == "Manual notes"
    
    def test_create_report_manual_override_auto(self):
        """Test that manual values override auto-populated values"""
        # Mock template service
        self.service.template_service.get_template_with_structure.return_value = self.mock_template
        
        # Mock validation result
        mock_validation = Mock()
        mock_validation.is_valid = True
        mock_validation.errors = []
        self.service.template_service.validate_template_structure.return_value = mock_validation
        
        # Mock integration service
        self.service.integration_service.populate_template_fields.return_value = {
            1: date(2025, 1, 15)  # Auto field
        }
        
        # Mock session behavior
        self.mock_session.add = Mock()
        self.mock_session.flush = Mock()
        self.mock_session.commit = Mock()
        
        # Mock _process_field_values to capture the combined values
        processed_values = {}
        def mock_process_field_values(report, template, field_values, result, validate_required=True):
            processed_values.update(field_values)
        
        self.service._process_field_values = mock_process_field_values
        
        result = self.service.create_report_from_template(
            template_id=1,
            inspection_id=123,
            field_values={1: date(2025, 2, 1)},  # Manual override for auto field
            inspection_data=self.mock_inspection,
            auto_populate=True
        )
        
        # Manual value should override auto value
        assert processed_values[1] == date(2025, 2, 1)  # Manual override, not auto value


class TestReportAutoIntegrationEdgeCases:
    """Test edge cases for auto-field integration"""
    
    def setup_method(self):
        """Set up test fixtures"""
        self.mock_session = Mock()
        self.service = ReportService(self.mock_session)
        self.service.template_service = Mock()
        self.service.integration_service = Mock()
    
    def test_auto_populate_fields_empty_template(self):
        """Test auto-population with empty template"""
        empty_template = Mock(spec=Template)
        empty_template.sections = []
        
        result = ReportSubmissionResult()
        auto_values = self.service._auto_populate_fields(empty_template, None, result=result)
        
        assert len(auto_values) == 0
        assert len(result.warnings) == 0
    
    def test_get_auto_populated_preview_exception(self):
        """Test preview when exception occurs"""
        self.service.template_service.get_template_with_structure.side_effect = Exception("Service error")
        
        result = self.service.get_auto_populated_preview(1, Mock())
        
        assert result['success'] is False
        assert "Preview failed" in result['error']
    
    def test_validate_auto_field_availability_exception(self):
        """Test validation when exception occurs"""
        self.service.template_service.get_template_with_structure.side_effect = Exception("Service error")
        
        result = self.service.validate_auto_field_availability(1, Mock())
        
        assert result['success'] is False
        assert "Validation failed" in result['error']