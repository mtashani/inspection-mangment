"""Tests for ReportSelectionService"""

import pytest
from datetime import date
from unittest.mock import Mock, MagicMock

from app.domains.report.services.report_selection_service import (
    ReportSelectionService,
    ReportSelectionError,
    ReportSelectionResult
)
from app.domains.report.models.template import Template
from app.domains.report.models.final_report import FinalReport
from app.domains.inspection.models.inspection import Inspection
from app.domains.inspection.models.enums import InspectionStatus


class TestReportSelectionResult:
    """Test cases for ReportSelectionResult"""
    
    def test_selection_result_creation(self):
        """Test ReportSelectionResult creation"""
        result = ReportSelectionResult()
        
        assert result.success is True
        assert result.available_templates == []
        assert result.recommended_templates == []
        assert result.inspection_context == {}
        assert result.existing_reports == []
        assert result.warnings == []
        assert result.errors == []
    
    def test_add_warning(self):
        """Test adding warning"""
        result = ReportSelectionResult()
        result.add_warning("Test warning", "WARNING_CODE")
        
        assert result.success is True  # Warnings don't affect success
        assert len(result.warnings) == 1
        assert result.warnings[0]['message'] == "Test warning"
        assert result.warnings[0]['error_code'] == "WARNING_CODE"
    
    def test_add_error(self):
        """Test adding error"""
        result = ReportSelectionResult()
        result.add_error("Test error", "ERROR_CODE")
        
        assert result.success is False
        assert len(result.errors) == 1
        assert result.errors[0]['message'] == "Test error"
        assert result.errors[0]['error_code'] == "ERROR_CODE"
    
    def test_get_summary(self):
        """Test getting selection result summary"""
        result = ReportSelectionResult()
        result.available_templates = [{'id': 1}, {'id': 2}]
        result.recommended_templates = [{'id': 1}]
        result.existing_reports = [{'id': 10}]
        result.add_warning("Warning 1")
        result.add_error("Error 1")
        
        summary = result.get_summary()
        
        assert summary['success'] is False
        assert summary['available_templates_count'] == 2
        assert summary['recommended_templates_count'] == 1
        assert summary['existing_reports_count'] == 1
        assert summary['warnings_count'] == 1
        assert summary['errors_count'] == 1


class TestReportSelectionService:
    """Test cases for ReportSelectionService"""
    
    def setup_method(self):
        """Set up test fixtures"""
        self.mock_session = Mock()
        self.service = ReportSelectionService(self.mock_session)
        
        # Mock template service
        self.service.template_service = Mock()
        
        # Create mock inspection
        self.mock_inspection = Mock(spec=Inspection)
        self.mock_inspection.id = 123
        self.mock_inspection.inspection_number = "INS-2025-001"
        self.mock_inspection.title = "Test Inspection"
        self.mock_inspection.description = "Test Description"
        self.mock_inspection.start_date = date(2025, 1, 15)
        self.mock_inspection.end_date = date(2025, 1, 16)
        self.mock_inspection.status = InspectionStatus.Completed
        self.mock_inspection.equipment_id = 456
        self.mock_inspection.work_order = "WO-2025-001"
        self.mock_inspection.requesting_department = "Engineering"
        
        # Create mock template
        self.mock_template = Mock(spec=Template)
        self.mock_template.id = 1
        self.mock_template.name = "Test Template"
        self.mock_template.description = "Test Description"
        self.mock_template.is_active = True
        self.mock_template.created_at = "2025-01-01T00:00:00"
        self.mock_template.updated_at = "2025-01-01T00:00:00"
    
    def test_get_available_templates_success(self):
        """Test successful template retrieval"""
        # Mock inspection retrieval
        self.service._get_inspection = Mock(return_value=self.mock_inspection)
        
        # Mock existing reports
        self.service._get_existing_reports = Mock(return_value=[])
        
        # Mock template service
        self.service.template_service.get_all_templates.return_value = [self.mock_template]
        self.service.template_service.get_template_stats.return_value = {
            'structure': {
                'total_sections': 2,
                'total_fields': 5
            },
            'field_analysis': {
                'auto_fields': 3,
                'manual_fields': 2,
                'required_fields': 1
            }
        }
        
        result = self.service.get_available_templates_for_inspection(123)
        
        assert result.success is True
        assert len(result.available_templates) == 1
        assert len(result.recommended_templates) <= 3
        assert result.inspection_context['id'] == 123
    
    def test_get_available_templates_inspection_not_found(self):
        """Test template retrieval when inspection not found"""
        self.service._get_inspection = Mock(return_value=None)
        
        result = self.service.get_available_templates_for_inspection(999)
        
        assert result.success is False
        assert any("not found" in error['message'] for error in result.errors)
    
    def test_get_available_templates_inspection_not_completed(self):
        """Test template retrieval for incomplete inspection"""
        # Set inspection as in progress
        self.mock_inspection.status = InspectionStatus.InProgress
        
        self.service._get_inspection = Mock(return_value=self.mock_inspection)
        self.service._get_existing_reports = Mock(return_value=[])
        self.service.template_service.get_all_templates.return_value = [self.mock_template]
        self.service.template_service.get_template_stats.return_value = {
            'structure': {'total_sections': 1, 'total_fields': 3},
            'field_analysis': {'auto_fields': 1, 'manual_fields': 2, 'required_fields': 1}
        }
        
        result = self.service.get_available_templates_for_inspection(123)
        
        assert result.success is True
        assert any("not completed" in warning['message'] for warning in result.warnings)
    
    def test_get_available_templates_no_templates(self):
        """Test template retrieval when no templates available"""
        self.service._get_inspection = Mock(return_value=self.mock_inspection)
        self.service._get_existing_reports = Mock(return_value=[])
        self.service.template_service.get_all_templates.return_value = []
        
        result = self.service.get_available_templates_for_inspection(123)
        
        assert result.success is True
        assert len(result.available_templates) == 0
        assert any("No templates available" in warning['message'] for warning in result.warnings)
    
    def test_validate_template_for_inspection_success(self):
        """Test successful template validation"""
        self.service._get_inspection = Mock(return_value=self.mock_inspection)
        self.service.template_service.get_template_with_structure.return_value = self.mock_template
        
        # Mock validation result
        mock_validation = Mock()
        mock_validation.is_valid = True
        mock_validation.errors = []
        self.service.template_service.validate_template_structure.return_value = mock_validation
        
        result = self.service.validate_template_for_inspection(1, 123)
        
        assert result['valid'] is True
        assert result['template']['id'] == 1
        assert 'suitability_score' in result
        assert 'recommendations' in result
    
    def test_validate_template_for_inspection_template_not_found(self):
        """Test template validation when template not found"""
        self.service._get_inspection = Mock(return_value=self.mock_inspection)
        self.service.template_service.get_template_with_structure.return_value = None
        
        result = self.service.validate_template_for_inspection(999, 123)
        
        assert result['valid'] is False
        assert "not found" in result['error']
    
    def test_validate_template_for_inspection_template_inactive(self):
        """Test template validation for inactive template"""
        inactive_template = Mock(spec=Template)
        inactive_template.is_active = False
        
        self.service._get_inspection = Mock(return_value=self.mock_inspection)
        self.service.template_service.get_template_with_structure.return_value = inactive_template
        
        result = self.service.validate_template_for_inspection(1, 123)
        
        assert result['valid'] is False
        assert "not active" in result['error']
    
    def test_validate_template_for_inspection_validation_errors(self):
        """Test template validation with template validation errors"""
        self.service._get_inspection = Mock(return_value=self.mock_inspection)
        self.service.template_service.get_template_with_structure.return_value = self.mock_template
        
        # Mock validation result with errors
        mock_validation = Mock()
        mock_validation.is_valid = False
        mock_validation.errors = [{'message': 'Template error'}]
        self.service.template_service.validate_template_structure.return_value = mock_validation
        
        result = self.service.validate_template_for_inspection(1, 123)
        
        assert result['valid'] is False
        assert "validation errors" in result['error']
        assert 'validation_errors' in result
    
    def test_get_template_preview_success(self):
        """Test successful template preview"""
        # Mock template with structure
        mock_section = Mock()
        mock_section.title = "Header"
        mock_section.section_type = Mock()
        mock_section.section_type.value = "header"
        mock_section.subsections = []
        
        mock_subsection = Mock()
        mock_subsection.title = "General Info"
        mock_subsection.fields = []
        
        mock_field = Mock()
        mock_field.label = "Test Field"
        mock_field.field_type = Mock()
        mock_field.field_type.value = "text"
        mock_field.value_source = Mock()
        mock_field.value_source.value = "manual"
        mock_field.is_required = True
        
        mock_subsection.fields = [mock_field]
        mock_section.subsections = [mock_subsection]
        self.mock_template.sections = [mock_section]
        
        self.service._get_inspection = Mock(return_value=self.mock_inspection)
        self.service.template_service.get_template_with_structure.return_value = self.mock_template
        
        result = self.service.get_template_preview_for_inspection(1, 123)
        
        assert result['success'] is True
        assert result['template']['id'] == 1
        assert result['inspection']['id'] == 123
        assert len(result['sections']) == 1
        assert result['manual_fields_count'] == 1
        assert result['auto_fields_count'] == 0
    
    def test_get_template_preview_inspection_not_found(self):
        """Test template preview when inspection not found"""
        self.service._get_inspection = Mock(return_value=None)
        
        result = self.service.get_template_preview_for_inspection(1, 999)
        
        assert result['success'] is False
        assert "not found" in result['error']
    
    def test_get_template_preview_template_not_found(self):
        """Test template preview when template not found"""
        self.service._get_inspection = Mock(return_value=self.mock_inspection)
        self.service.template_service.get_template_with_structure.return_value = None
        
        result = self.service.get_template_preview_for_inspection(999, 123)
        
        assert result['success'] is False
        assert "not found" in result['error']
    
    def test_calculate_template_suitability(self):
        """Test template suitability calculation"""
        # Mock template stats
        self.service.template_service.get_template_stats.return_value = {
            'structure': {'total_fields': 10},
            'field_analysis': {'auto_fields': 7}
        }
        
        score = self.service._calculate_template_suitability(self.mock_template, self.mock_inspection)
        
        assert isinstance(score, float)
        assert 0.0 <= score <= 100.0
    
    def test_calculate_template_suitability_complex_template(self):
        """Test suitability calculation for complex template"""
        # Mock complex template stats
        self.service.template_service.get_template_stats.return_value = {
            'structure': {'total_fields': 25},  # Very complex
            'field_analysis': {'auto_fields': 5}
        }
        
        score = self.service._calculate_template_suitability(self.mock_template, self.mock_inspection)
        
        # Should have lower score due to complexity
        assert isinstance(score, float)
        assert score < 70.0  # Should be penalized for complexity
    
    def test_get_recommended_templates(self):
        """Test getting recommended templates"""
        available_templates = [
            {'id': 1, 'suitability_score': 85.0, 'complexity': 'Low', 'auto_fields_count': 5, 'manual_fields_count': 2},
            {'id': 2, 'suitability_score': 70.0, 'complexity': 'Medium', 'auto_fields_count': 3, 'manual_fields_count': 7},
            {'id': 3, 'suitability_score': 90.0, 'complexity': 'High', 'auto_fields_count': 10, 'manual_fields_count': 15}
        ]
        
        recommendations = self.service._get_recommended_templates(
            available_templates, 
            self.mock_inspection, 
            []
        )
        
        assert len(recommendations) <= 3
        assert recommendations[0]['id'] == 3  # Highest score should be first
        assert all('recommendation_reasons' in rec for rec in recommendations)
    
    def test_get_inspection_context(self):
        """Test getting inspection context"""
        context = self.service._get_inspection_context(self.mock_inspection)
        
        assert context['id'] == 123
        assert context['number'] == "INS-2025-001"
        assert context['title'] == "Test Inspection"
        assert context['equipment_id'] == 456
        assert context['work_order'] == "WO-2025-001"
    
    def test_get_existing_reports(self):
        """Test getting existing reports"""
        # Mock existing report
        mock_report = Mock(spec=FinalReport)
        mock_report.id = 10
        mock_report.template_id = 1
        mock_report.report_serial_number = "RPT-123-001"
        mock_report.status = Mock()
        mock_report.status.value = "submitted"
        mock_report.created_at = "2025-01-15T10:00:00"
        mock_report.updated_at = "2025-01-15T10:00:00"
        
        mock_result = Mock()
        mock_result.all.return_value = [mock_report]
        self.mock_session.exec.return_value = mock_result
        
        reports = self.service._get_existing_reports(123)
        
        assert len(reports) == 1
        assert reports[0]['id'] == 10
        assert reports[0]['template_id'] == 1
        assert reports[0]['serial_number'] == "RPT-123-001"
    
    def test_get_existing_reports_exception(self):
        """Test getting existing reports when exception occurs"""
        self.mock_session.exec.side_effect = Exception("Database error")
        
        reports = self.service._get_existing_reports(123)
        
        assert reports == []  # Should return empty list on exception


class TestReportSelectionServiceEdgeCases:
    """Test edge cases for ReportSelectionService"""
    
    def setup_method(self):
        """Set up test fixtures"""
        self.mock_session = Mock()
        self.service = ReportSelectionService(self.mock_session)
        self.service.template_service = Mock()
    
    def test_get_available_templates_exception(self):
        """Test template retrieval when exception occurs"""
        self.service._get_inspection = Mock(side_effect=Exception("Service error"))
        
        result = self.service.get_available_templates_for_inspection(123)
        
        assert result.success is False
        assert any("Failed to get available templates" in error['message'] for error in result.errors)
    
    def test_validate_template_exception(self):
        """Test template validation when exception occurs"""
        self.service._get_inspection = Mock(side_effect=Exception("Service error"))
        
        result = self.service.validate_template_for_inspection(1, 123)
        
        assert result['valid'] is False
        assert "Validation failed" in result['error']
    
    def test_get_template_preview_exception(self):
        """Test template preview when exception occurs"""
        self.service._get_inspection = Mock(side_effect=Exception("Service error"))
        
        result = self.service.get_template_preview_for_inspection(1, 123)
        
        assert result['success'] is False
        assert "Preview failed" in result['error']