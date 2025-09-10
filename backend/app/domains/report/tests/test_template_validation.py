"""Tests for TemplateService validation functionality"""

import pytest
import json
from unittest.mock import Mock
from app.domains.report.services.template_service import (
    TemplateService, 
    ValidationResult, 
    ValidationError,
    TemplateServiceError
)
from app.domains.report.models.template import Template
from app.domains.report.models.template_section import TemplateSection
from app.domains.report.models.template_subsection import TemplateSubSection
from app.domains.report.models.template_field import TemplateField
from app.domains.report.models.enums import SectionType, FieldType, ValueSource


class TestValidationResult:
    """Test cases for ValidationResult"""
    
    def test_validation_result_creation(self):
        """Test ValidationResult creation"""
        result = ValidationResult()
        
        assert result.is_valid is True
        assert result.errors == []
        assert result.warnings == []
    
    def test_add_error(self):
        """Test adding validation error"""
        result = ValidationResult()
        result.add_error("Test error", "field.path", "ERROR_CODE")
        
        assert result.is_valid is False
        assert len(result.errors) == 1
        assert result.errors[0]['message'] == "Test error"
        assert result.errors[0]['field_path'] == "field.path"
        assert result.errors[0]['error_code'] == "ERROR_CODE"
        assert result.errors[0]['type'] == "error"
    
    def test_add_warning(self):
        """Test adding validation warning"""
        result = ValidationResult()
        result.add_warning("Test warning", "field.path", "WARNING_CODE")
        
        assert result.is_valid is True  # Warnings don't affect validity
        assert len(result.warnings) == 1
        assert result.warnings[0]['message'] == "Test warning"
        assert result.warnings[0]['field_path'] == "field.path"
        assert result.warnings[0]['error_code'] == "WARNING_CODE"
        assert result.warnings[0]['type'] == "warning"
    
    def test_get_summary(self):
        """Test getting validation summary"""
        result = ValidationResult()
        result.add_error("Error 1")
        result.add_error("Error 2")
        result.add_warning("Warning 1")
        
        summary = result.get_summary()
        
        assert summary['is_valid'] is False
        assert summary['error_count'] == 2
        assert summary['warning_count'] == 1
        assert len(summary['errors']) == 2
        assert len(summary['warnings']) == 1


class TestTemplateValidation:
    """Test cases for template validation"""
    
    def setup_method(self):
        """Set up test fixtures"""
        self.mock_session = Mock()
        self.service = TemplateService(self.mock_session)
    
    def create_mock_template(self, name="Test Template", sections=None):
        """Create mock template with structure"""
        template = Mock(spec=Template)
        template.id = 1
        template.name = name
        template.description = "Test Description"
        template.is_active = True
        template.sections = sections or []
        return template
    
    def create_mock_section(self, title="Test Section", section_type=SectionType.BODY, order=0, subsections=None):
        """Create mock section"""
        section = Mock(spec=TemplateSection)
        section.id = 1
        section.title = title
        section.section_type = section_type
        section.order = order
        section.subsections = subsections or []
        return section
    
    def create_mock_subsection(self, title="Test Subsection", order=0, fields=None):
        """Create mock subsection"""
        subsection = Mock(spec=TemplateSubSection)
        subsection.id = 1
        subsection.title = title
        subsection.order = order
        subsection.fields = fields or []
        return subsection
    
    def create_mock_field(self, label="Test Field", field_type=FieldType.TEXT, 
                         value_source=ValueSource.MANUAL, order=0, **kwargs):
        """Create mock field"""
        field = Mock(spec=TemplateField)
        field.id = 1
        field.label = label
        field.field_type = field_type
        field.value_source = value_source
        field.order = order
        field.row = kwargs.get('row', 0)
        field.col = kwargs.get('col', 0)
        field.rowspan = kwargs.get('rowspan', 1)
        field.colspan = kwargs.get('colspan', 1)
        field.options = kwargs.get('options', None)
        field.is_required = kwargs.get('is_required', False)
        field.placeholder = kwargs.get('placeholder', None)
        field.auto_source_key = kwargs.get('auto_source_key', None)
        field.purpose = kwargs.get('purpose', None)
        return field
    
    def test_validate_template_structure_success(self):
        """Test successful template structure validation"""
        # Create valid template structure
        field = self.create_mock_field()
        subsection = self.create_mock_subsection(fields=[field])
        section = self.create_mock_section(subsections=[subsection])
        template = self.create_mock_template(sections=[section])
        
        self.service.get_template_with_structure = Mock(return_value=template)
        
        result = self.service.validate_template_structure(1)
        
        assert result.is_valid is True
        assert len(result.errors) == 0
    
    def test_validate_template_structure_not_found(self):
        """Test validation when template not found"""
        self.service.get_template_with_structure = Mock(return_value=None)
        
        with pytest.raises(TemplateServiceError) as exc_info:
            self.service.validate_template_structure(999)
        
        assert "not found" in str(exc_info.value)
    
    def test_validate_template_basic_missing_name(self):
        """Test validation with missing template name"""
        template = self.create_mock_template(name="", sections=[])
        self.service.get_template_with_structure = Mock(return_value=template)
        
        result = self.service.validate_template_structure(1)
        
        assert result.is_valid is False
        assert any("name is required" in error['message'] for error in result.errors)
    
    def test_validate_template_basic_no_sections(self):
        """Test validation with no sections"""
        template = self.create_mock_template(sections=[])
        self.service.get_template_with_structure = Mock(return_value=template)
        
        result = self.service.validate_template_structure(1)
        
        assert result.is_valid is False
        assert any("at least one section" in error['message'] for error in result.errors)
    
    def test_validate_sections_missing_title(self):
        """Test validation with missing section title"""
        section = self.create_mock_section(title="")
        template = self.create_mock_template(sections=[section])
        self.service.get_template_with_structure = Mock(return_value=template)
        
        result = self.service.validate_template_structure(1)
        
        assert result.is_valid is False
        assert any("title is required" in error['message'] for error in result.errors)
    
    def test_validate_sections_duplicate_types(self):
        """Test validation with duplicate section types"""
        section1 = self.create_mock_section(section_type=SectionType.BODY, order=0)
        section2 = self.create_mock_section(section_type=SectionType.BODY, order=1)
        template = self.create_mock_template(sections=[section1, section2])
        self.service.get_template_with_structure = Mock(return_value=template)
        
        result = self.service.validate_template_structure(1)
        
        assert any("Duplicate section type" in warning['message'] for warning in result.warnings)
    
    def test_validate_section_ordering_duplicates(self):
        """Test validation with duplicate section orders"""
        section1 = self.create_mock_section(order=0)
        section2 = self.create_mock_section(order=0)  # Duplicate order
        template = self.create_mock_template(sections=[section1, section2])
        self.service.get_template_with_structure = Mock(return_value=template)
        
        result = self.service.validate_template_structure(1)
        
        assert result.is_valid is False
        assert any("Duplicate section orders" in error['message'] for error in result.errors)
    
    def test_validate_fields_missing_label(self):
        """Test validation with missing field label"""
        field = self.create_mock_field(label="")
        subsection = self.create_mock_subsection(fields=[field])
        section = self.create_mock_section(subsections=[subsection])
        template = self.create_mock_template(sections=[section])
        self.service.get_template_with_structure = Mock(return_value=template)
        
        result = self.service.validate_template_structure(1)
        
        assert result.is_valid is False
        assert any("label is required" in error['message'] for error in result.errors)
    
    def test_validate_fields_auto_missing_source_key(self):
        """Test validation of auto field without source key"""
        field = self.create_mock_field(
            value_source=ValueSource.AUTO,
            auto_source_key=None
        )
        subsection = self.create_mock_subsection(fields=[field])
        section = self.create_mock_section(subsections=[subsection])
        template = self.create_mock_template(sections=[section])
        self.service.get_template_with_structure = Mock(return_value=template)
        
        result = self.service.validate_template_structure(1)
        
        assert result.is_valid is False
        assert any("Auto-source key is required" in error['message'] for error in result.errors)
    
    def test_validate_fields_auto_invalid_source_key(self):
        """Test validation of auto field with invalid source key"""
        field = self.create_mock_field(
            value_source=ValueSource.AUTO,
            auto_source_key="invalid.key"
        )
        subsection = self.create_mock_subsection(fields=[field])
        section = self.create_mock_section(subsections=[subsection])
        template = self.create_mock_template(sections=[section])
        self.service.get_template_with_structure = Mock(return_value=template)
        
        result = self.service.validate_template_structure(1)
        
        assert result.is_valid is False
        assert any("Invalid auto-source key" in error['message'] for error in result.errors)
    
    def test_validate_fields_select_missing_options(self):
        """Test validation of select field without options"""
        field = self.create_mock_field(
            field_type=FieldType.SELECT,
            options=None
        )
        subsection = self.create_mock_subsection(fields=[field])
        section = self.create_mock_section(subsections=[subsection])
        template = self.create_mock_template(sections=[section])
        self.service.get_template_with_structure = Mock(return_value=template)
        
        result = self.service.validate_template_structure(1)
        
        assert result.is_valid is False
        assert any("must have options" in error['message'] for error in result.errors)
    
    def test_validate_fields_select_invalid_options_json(self):
        """Test validation of select field with invalid JSON options"""
        field = self.create_mock_field(
            field_type=FieldType.SELECT,
            options="invalid json"
        )
        subsection = self.create_mock_subsection(fields=[field])
        section = self.create_mock_section(subsections=[subsection])
        template = self.create_mock_template(sections=[section])
        self.service.get_template_with_structure = Mock(return_value=template)
        
        result = self.service.validate_template_structure(1)
        
        assert result.is_valid is False
        assert any("valid JSON" in error['message'] for error in result.errors)
    
    def test_validate_fields_select_valid_options(self):
        """Test validation of select field with valid options"""
        field = self.create_mock_field(
            field_type=FieldType.SELECT,
            options=json.dumps(["Option 1", "Option 2"])
        )
        subsection = self.create_mock_subsection(fields=[field])
        section = self.create_mock_section(subsections=[subsection])
        template = self.create_mock_template(sections=[section])
        self.service.get_template_with_structure = Mock(return_value=template)
        
        result = self.service.validate_template_structure(1)
        
        # Should not have select-related errors
        select_errors = [error for error in result.errors if "options" in error['message']]
        assert len(select_errors) == 0
    
    def test_validate_fields_negative_position(self):
        """Test validation of field with negative position"""
        field = self.create_mock_field(row=-1, col=-1)
        subsection = self.create_mock_subsection(fields=[field])
        section = self.create_mock_section(subsections=[subsection])
        template = self.create_mock_template(sections=[section])
        self.service.get_template_with_structure = Mock(return_value=template)
        
        result = self.service.validate_template_structure(1)
        
        assert result.is_valid is False
        assert any("cannot be negative" in error['message'] for error in result.errors)
    
    def test_validate_fields_invalid_span(self):
        """Test validation of field with invalid span"""
        field = self.create_mock_field(rowspan=0, colspan=0)
        subsection = self.create_mock_subsection(fields=[field])
        section = self.create_mock_section(subsections=[subsection])
        template = self.create_mock_template(sections=[section])
        self.service.get_template_with_structure = Mock(return_value=template)
        
        result = self.service.validate_template_structure(1)
        
        assert result.is_valid is False
        assert any("must be at least 1" in error['message'] for error in result.errors)
    
    def test_validate_canvas_positioning_conflict(self):
        """Test validation of canvas positioning conflicts"""
        # Two fields occupying the same position
        field1 = self.create_mock_field(label="Field 1", row=0, col=0, order=0)
        field2 = self.create_mock_field(label="Field 2", row=0, col=0, order=1)
        
        subsection = self.create_mock_subsection(fields=[field1, field2])
        section = self.create_mock_section(subsections=[subsection])
        template = self.create_mock_template(sections=[section])
        self.service.get_template_with_structure = Mock(return_value=template)
        
        result = self.service.validate_template_structure(1)
        
        assert result.is_valid is False
        assert any("positioning conflict" in error['message'] for error in result.errors)
    
    def test_validate_template_completeness_success(self):
        """Test successful template completeness validation"""
        # Create template with header and body sections
        header_field = self.create_mock_field(label="Title")
        header_subsection = self.create_mock_subsection(fields=[header_field])
        header_section = self.create_mock_section(
            title="Header", 
            section_type=SectionType.HEADER,
            subsections=[header_subsection]
        )
        
        body_field = self.create_mock_field(label="Content", is_required=True)
        body_subsection = self.create_mock_subsection(fields=[body_field])
        body_section = self.create_mock_section(
            title="Body",
            section_type=SectionType.BODY,
            subsections=[body_subsection]
        )
        
        template = self.create_mock_template(sections=[header_section, body_section])
        self.service.get_template_with_structure = Mock(return_value=template)
        
        result = self.service.validate_template_completeness(1)
        
        assert result.is_valid is True
    
    def test_validate_template_completeness_missing_sections(self):
        """Test completeness validation with missing sections"""
        # Only body section, missing header
        field = self.create_mock_field()
        subsection = self.create_mock_subsection(fields=[field])
        section = self.create_mock_section(
            section_type=SectionType.BODY,
            subsections=[subsection]
        )
        template = self.create_mock_template(sections=[section])
        self.service.get_template_with_structure = Mock(return_value=template)
        
        result = self.service.validate_template_completeness(1)
        
        assert any("missing header section" in warning['message'] for warning in result.warnings)
    
    def test_validate_template_completeness_no_fields(self):
        """Test completeness validation with no fields"""
        subsection = self.create_mock_subsection(fields=[])
        section = self.create_mock_section(subsections=[subsection])
        template = self.create_mock_template(sections=[section])
        self.service.get_template_with_structure = Mock(return_value=template)
        
        result = self.service.validate_template_completeness(1)
        
        assert result.is_valid is False
        assert any("has no fields" in error['message'] for error in result.errors)
    
    def test_validate_field_configuration_success(self):
        """Test successful field configuration validation"""
        field_data = {
            'label': 'Test Field',
            'field_type': 'text',
            'value_source': 'manual',
            'row': 0,
            'col': 0,
            'rowspan': 1,
            'colspan': 1
        }
        
        result = self.service.validate_field_configuration(field_data)
        
        assert result.is_valid is True
        assert len(result.errors) == 0
    
    def test_validate_field_configuration_missing_required(self):
        """Test field configuration validation with missing required fields"""
        field_data = {
            'field_type': 'text'
            # Missing label and value_source
        }
        
        result = self.service.validate_field_configuration(field_data)
        
        assert result.is_valid is False
        assert any("label is required" in error['message'] for error in result.errors)
        assert any("value_source is required" in error['message'] for error in result.errors)
    
    def test_validate_field_configuration_invalid_types(self):
        """Test field configuration validation with invalid types"""
        field_data = {
            'label': 'Test Field',
            'field_type': 'invalid_type',
            'value_source': 'invalid_source'
        }
        
        result = self.service.validate_field_configuration(field_data)
        
        assert result.is_valid is False
        assert any("Invalid field type" in error['message'] for error in result.errors)
        assert any("Invalid value source" in error['message'] for error in result.errors)
    
    def test_validate_field_configuration_auto_field(self):
        """Test field configuration validation for auto field"""
        field_data = {
            'label': 'Test Field',
            'field_type': 'text',
            'value_source': 'auto',
            'auto_source_key': 'inspection.start_date'
        }
        
        result = self.service.validate_field_configuration(field_data)
        
        assert result.is_valid is True
        assert len(result.errors) == 0
    
    def test_validate_field_configuration_auto_field_invalid_key(self):
        """Test field configuration validation for auto field with invalid key"""
        field_data = {
            'label': 'Test Field',
            'field_type': 'text',
            'value_source': 'auto',
            'auto_source_key': 'invalid.key'
        }
        
        result = self.service.validate_field_configuration(field_data)
        
        assert result.is_valid is False
        assert any("Invalid auto-source key" in error['message'] for error in result.errors)