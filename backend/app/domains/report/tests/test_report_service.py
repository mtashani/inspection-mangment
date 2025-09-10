"""Tests for ReportService"""

import pytest
import json
from datetime import datetime, date
from unittest.mock import Mock, MagicMock
from sqlmodel import Session

from app.domains.report.services.report_service import (
    ReportService, 
    ReportServiceError, 
    FieldValidationError,
    ReportSubmissionResult
)
from app.domains.report.models.final_report import FinalReport
from app.domains.report.models.report_field_value import ReportFieldValue
from app.domains.report.models.template import Template
from app.domains.report.models.template_field import TemplateField
from app.domains.report.models.enums import ReportStatus, FieldType, ValueSource


class TestReportSubmissionResult:
    """Test cases for ReportSubmissionResult"""
    
    def test_submission_result_creation(self):
        """Test ReportSubmissionResult creation"""
        result = ReportSubmissionResult()
        
        assert result.success is True
        assert result.report_id is None
        assert result.errors == []
        assert result.warnings == []
        assert result.field_errors == {}
    
    def test_add_error(self):
        """Test adding general error"""
        result = ReportSubmissionResult()
        result.add_error("Test error", "ERROR_CODE")
        
        assert result.success is False
        assert len(result.errors) == 1
        assert result.errors[0]['message'] == "Test error"
        assert result.errors[0]['error_code'] == "ERROR_CODE"
    
    def test_add_warning(self):
        """Test adding warning"""
        result = ReportSubmissionResult()
        result.add_warning("Test warning", "WARNING_CODE")
        
        assert result.success is True  # Warnings don't affect success
        assert len(result.warnings) == 1
        assert result.warnings[0]['message'] == "Test warning"
    
    def test_add_field_error(self):
        """Test adding field-specific error"""
        result = ReportSubmissionResult()
        result.add_field_error(1, "Test Field", "Field error", "FIELD_ERROR")
        
        assert result.success is False
        assert 1 in result.field_errors
        assert len(result.field_errors[1]) == 1
        assert result.field_errors[1][0]['field_label'] == "Test Field"
        assert result.field_errors[1][0]['message'] == "Field error"
    
    def test_get_summary(self):
        """Test getting submission result summary"""
        result = ReportSubmissionResult()
        result.report_id = 123
        result.add_error("Error 1")
        result.add_warning("Warning 1")
        result.add_field_error(1, "Field 1", "Field error 1")
        result.add_field_error(1, "Field 1", "Field error 2")
        
        summary = result.get_summary()
        
        assert summary['success'] is False
        assert summary['report_id'] == 123
        assert summary['error_count'] == 1
        assert summary['warning_count'] == 1
        assert summary['field_error_count'] == 2


class TestReportService:
    """Test cases for ReportService"""
    
    def setup_method(self):
        """Set up test fixtures"""
        self.mock_session = Mock(spec=Session)
        self.service = ReportService(self.mock_session)
        
        # Mock dependencies
        self.service.template_service = Mock()
        self.service.integration_service = Mock()
        
        # Create mock template
        self.mock_template = Mock(spec=Template)
        self.mock_template.id = 1
        self.mock_template.name = "Test Template"
        self.mock_template.is_active = True
        self.mock_template.sections = []
        
        # Create mock field
        self.mock_field = Mock(spec=TemplateField)
        self.mock_field.id = 1
        self.mock_field.label = "Test Field"
        self.mock_field.field_type = FieldType.TEXT
        self.mock_field.value_source = ValueSource.MANUAL
        self.mock_field.is_required = False
        self.mock_field.options = None
    
    def test_create_report_from_template_success(self):
        """Test successful report creation from template"""
        # Mock template service
        self.service.template_service.get_template_with_structure.return_value = self.mock_template
        
        # Mock validation result
        mock_validation = Mock()
        mock_validation.is_valid = True
        mock_validation.errors = []
        self.service.template_service.validate_template_structure.return_value = mock_validation
        
        # Mock session behavior
        self.mock_session.add = Mock()
        self.mock_session.flush = Mock()
        self.mock_session.commit = Mock()
        
        result = self.service.create_report_from_template(
            template_id=1,
            inspection_id=123,
            created_by=456
        )
        
        assert result.success is True
        assert result.report_id is not None
        self.mock_session.add.assert_called()
        self.mock_session.commit.assert_called_once()
    
    def test_create_report_template_not_found(self):
        """Test report creation when template not found"""
        self.service.template_service.get_template_with_structure.return_value = None
        
        result = self.service.create_report_from_template(
            template_id=999,
            inspection_id=123
        )
        
        assert result.success is False
        assert any("not found" in error['message'] for error in result.errors)
    
    def test_create_report_template_inactive(self):
        """Test report creation with inactive template"""
        inactive_template = Mock(spec=Template)
        inactive_template.is_active = False
        self.service.template_service.get_template_with_structure.return_value = inactive_template
        
        result = self.service.create_report_from_template(
            template_id=1,
            inspection_id=123
        )
        
        assert result.success is False
        assert any("not active" in error['message'] for error in result.errors)
    
    def test_create_report_template_invalid(self):
        """Test report creation with invalid template"""
        self.service.template_service.get_template_with_structure.return_value = self.mock_template
        
        # Mock invalid validation result
        mock_validation = Mock()
        mock_validation.is_valid = False
        mock_validation.errors = [{'message': 'Template error', 'error_code': 'TEMPLATE_ERROR'}]
        self.service.template_service.validate_template_structure.return_value = mock_validation
        
        result = self.service.create_report_from_template(
            template_id=1,
            inspection_id=123
        )
        
        assert result.success is False
        assert any("validation errors" in error['message'] for error in result.errors)
    
    def test_get_report_success(self):
        """Test successful report retrieval"""
        mock_report = Mock(spec=FinalReport)
        mock_result = Mock()
        mock_result.first.return_value = mock_report
        self.mock_session.exec.return_value = mock_result
        
        result = self.service.get_report(1)
        
        assert result is mock_report
        self.mock_session.exec.assert_called_once()
    
    def test_get_report_not_found(self):
        """Test report retrieval when not found"""
        mock_result = Mock()
        mock_result.first.return_value = None
        self.mock_session.exec.return_value = mock_result
        
        result = self.service.get_report(999)
        
        assert result is None
    
    def test_validate_and_convert_field_value_text(self):
        """Test field value validation for text field"""
        field = Mock(spec=TemplateField)
        field.id = 1
        field.label = "Text Field"
        field.field_type = FieldType.TEXT
        
        result = self.service._validate_and_convert_field_value(field, "  test value  ")
        
        assert result == "test value"  # Should be stripped
    
    def test_validate_and_convert_field_value_number(self):
        """Test field value validation for number field"""
        field = Mock(spec=TemplateField)
        field.id = 1
        field.label = "Number Field"
        field.field_type = FieldType.NUMBER
        
        # Test string number
        result = self.service._validate_and_convert_field_value(field, "123.45")
        assert result == 123.45
        
        # Test empty string
        result = self.service._validate_and_convert_field_value(field, "")
        assert result is None
        
        # Test actual number
        result = self.service._validate_and_convert_field_value(field, 67.89)
        assert result == 67.89
    
    def test_validate_and_convert_field_value_date(self):
        """Test field value validation for date field"""
        field = Mock(spec=TemplateField)
        field.id = 1
        field.label = "Date Field"
        field.field_type = FieldType.DATE
        
        # Test ISO format
        result = self.service._validate_and_convert_field_value(field, "2025-01-15")
        assert result == date(2025, 1, 15)
        
        # Test DD/MM/YYYY format
        result = self.service._validate_and_convert_field_value(field, "15/01/2025")
        assert result == date(2025, 1, 15)
        
        # Test date object
        test_date = date(2025, 1, 15)
        result = self.service._validate_and_convert_field_value(field, test_date)
        assert result == test_date
    
    def test_validate_and_convert_field_value_date_invalid(self):
        """Test field value validation for invalid date"""
        field = Mock(spec=TemplateField)
        field.id = 1
        field.label = "Date Field"
        field.field_type = FieldType.DATE
        
        with pytest.raises(FieldValidationError) as exc_info:
            self.service._validate_and_convert_field_value(field, "invalid-date")
        
        assert "Invalid date format" in str(exc_info.value)
        assert exc_info.value.field_id == 1
    
    def test_validate_and_convert_field_value_checkbox(self):
        """Test field value validation for checkbox field"""
        field = Mock(spec=TemplateField)
        field.id = 1
        field.label = "Checkbox Field"
        field.field_type = FieldType.CHECKBOX
        
        # Test string values
        assert self.service._validate_and_convert_field_value(field, "true") is True
        assert self.service._validate_and_convert_field_value(field, "false") is False
        assert self.service._validate_and_convert_field_value(field, "1") is True
        assert self.service._validate_and_convert_field_value(field, "0") is False
        
        # Test boolean values
        assert self.service._validate_and_convert_field_value(field, True) is True
        assert self.service._validate_and_convert_field_value(field, False) is False
    
    def test_validate_and_convert_field_value_select(self):
        """Test field value validation for select field"""
        field = Mock(spec=TemplateField)
        field.id = 1
        field.label = "Select Field"
        field.field_type = FieldType.SELECT
        field.options = json.dumps(["Option 1", "Option 2", "Option 3"])
        
        # Test valid option
        result = self.service._validate_and_convert_field_value(field, "Option 1")
        assert result == "Option 1"
        
        # Test invalid option
        with pytest.raises(FieldValidationError) as exc_info:
            self.service._validate_and_convert_field_value(field, "Invalid Option")
        
        assert "not in allowed options" in str(exc_info.value)
    
    def test_validate_and_convert_field_value_select_no_options(self):
        """Test field value validation for select field without options"""
        field = Mock(spec=TemplateField)
        field.id = 1
        field.label = "Select Field"
        field.field_type = FieldType.SELECT
        field.options = None
        
        # Should accept any value when no options defined
        result = self.service._validate_and_convert_field_value(field, "Any Value")
        assert result == "Any Value"
    
    def test_store_field_value_text(self):
        """Test storing text field value"""
        field_value = Mock(spec=ReportFieldValue)
        
        self.service._store_field_value(field_value, FieldType.TEXT, "test value")
        
        assert field_value.text_value == "test value"
    
    def test_store_field_value_number(self):
        """Test storing number field value"""
        field_value = Mock(spec=ReportFieldValue)
        
        self.service._store_field_value(field_value, FieldType.NUMBER, 123.45)
        
        assert field_value.number_value == 123.45
    
    def test_store_field_value_date(self):
        """Test storing date field value"""
        field_value = Mock(spec=ReportFieldValue)
        test_date = date(2025, 1, 15)
        
        self.service._store_field_value(field_value, FieldType.DATE, test_date)
        
        assert field_value.date_value == test_date
    
    def test_store_field_value_checkbox(self):
        """Test storing checkbox field value"""
        field_value = Mock(spec=ReportFieldValue)
        
        self.service._store_field_value(field_value, FieldType.CHECKBOX, True)
        
        assert field_value.boolean_value is True
    
    def test_store_field_value_none(self):
        """Test storing None value"""
        field_value = Mock(spec=ReportFieldValue)
        
        self.service._store_field_value(field_value, FieldType.TEXT, None)
        
        # Should not set any value when None is passed
        assert not hasattr(field_value, 'text_value') or field_value.text_value != None
    
    def test_generate_serial_number(self):
        """Test serial number generation"""
        serial = self.service._generate_serial_number(123, 456)
        
        assert serial.startswith("RPT-456-123-")
        assert len(serial) > 15  # Should include timestamp
    
    def test_get_reports_by_inspection(self):
        """Test getting reports by inspection ID"""
        mock_reports = [Mock(spec=FinalReport), Mock(spec=FinalReport)]
        mock_result = Mock()
        mock_result.all.return_value = mock_reports
        self.mock_session.exec.return_value = mock_result
        
        result = self.service.get_reports_by_inspection(123)
        
        assert result == mock_reports
        self.mock_session.exec.assert_called_once()
    
    def test_get_reports_by_template(self):
        """Test getting reports by template ID"""
        mock_reports = [Mock(spec=FinalReport)]
        mock_result = Mock()
        mock_result.all.return_value = mock_reports
        self.mock_session.exec.return_value = mock_result
        
        result = self.service.get_reports_by_template(1)
        
        assert result == mock_reports
        self.mock_session.exec.assert_called_once()
    
    def test_update_report_status_success(self):
        """Test successful report status update"""
        mock_report = Mock(spec=FinalReport)
        self.service.get_report = Mock(return_value=mock_report)
        self.mock_session.add = Mock()
        self.mock_session.commit = Mock()
        
        result = self.service.update_report_status(1, ReportStatus.APPROVED)
        
        assert result is True
        assert mock_report.status == ReportStatus.APPROVED
        self.mock_session.add.assert_called_once_with(mock_report)
        self.mock_session.commit.assert_called_once()
    
    def test_update_report_status_not_found(self):
        """Test report status update when report not found"""
        self.service.get_report = Mock(return_value=None)
        
        result = self.service.update_report_status(999, ReportStatus.APPROVED)
        
        assert result is False
    
    def test_delete_report_success(self):
        """Test successful report deletion"""
        mock_report = Mock(spec=FinalReport)
        mock_field_values = [Mock(spec=ReportFieldValue), Mock(spec=ReportFieldValue)]
        
        self.service.get_report = Mock(return_value=mock_report)
        
        mock_result = Mock()
        mock_result.all.return_value = mock_field_values
        self.mock_session.exec.return_value = mock_result
        
        self.mock_session.delete = Mock()
        self.mock_session.commit = Mock()
        
        result = self.service.delete_report(1)
        
        assert result is True
        
        # Should delete field values and report
        assert self.mock_session.delete.call_count == 3  # 2 field values + 1 report
        self.mock_session.commit.assert_called_once()
    
    def test_delete_report_not_found(self):
        """Test report deletion when report not found"""
        self.service.get_report = Mock(return_value=None)
        
        result = self.service.delete_report(999)
        
        assert result is False


class TestFieldValidationError:
    """Test cases for FieldValidationError"""
    
    def test_field_validation_error_creation(self):
        """Test FieldValidationError creation"""
        error = FieldValidationError(1, "Test Field", "Test message", "TEST_CODE")
        
        assert error.field_id == 1
        assert error.field_label == "Test Field"
        assert error.message == "Test message"
        assert error.error_code == "TEST_CODE"
        assert "Field 'Test Field' (ID: 1): Test message" in str(error)


class TestReportServiceEdgeCases:
    """Test edge cases for ReportService"""
    
    def setup_method(self):
        """Set up test fixtures"""
        self.mock_session = Mock(spec=Session)
        self.service = ReportService(self.mock_session)
    
    def test_validate_and_convert_field_value_none(self):
        """Test field value validation with None value"""
        field = Mock(spec=TemplateField)
        field.field_type = FieldType.TEXT
        
        result = self.service._validate_and_convert_field_value(field, None)
        
        assert result is None
    
    def test_validate_and_convert_field_value_empty_string(self):
        """Test field value validation with empty string for number"""
        field = Mock(spec=TemplateField)
        field.field_type = FieldType.NUMBER
        
        result = self.service._validate_and_convert_field_value(field, "")
        
        assert result is None
    
    def test_validate_and_convert_field_value_unknown_type(self):
        """Test field value validation with unknown field type"""
        field = Mock(spec=TemplateField)
        field.field_type = "unknown_type"  # Not a real FieldType
        
        result = self.service._validate_and_convert_field_value(field, "test value")
        
        assert result == "test value"  # Should convert to string