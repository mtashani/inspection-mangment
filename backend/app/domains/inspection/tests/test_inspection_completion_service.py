"""Tests for InspectionCompletionService"""

import pytest
from datetime import datetime, date
from unittest.mock import Mock, MagicMock

from app.domains.inspection.services.inspection_completion_service import (
    InspectionCompletionService,
    InspectionCompletionError,
    InspectionCompletionResult
)
from app.domains.inspection.models.inspection import Inspection
from app.domains.inspection.models.enums import InspectionStatus
from app.domains.report.models.template import Template


class TestInspectionCompletionResult:
    """Test cases for InspectionCompletionResult"""
    
    def test_completion_result_creation(self):
        """Test InspectionCompletionResult creation"""
        result = InspectionCompletionResult()
        
        assert result.success is True
        assert result.inspection_id is None
        assert result.available_templates == []
        assert result.errors == []
        assert result.warnings == []
    
    def test_add_error(self):
        """Test adding error"""
        result = InspectionCompletionResult()
        result.add_error("Test error", "ERROR_CODE")
        
        assert result.success is False
        assert len(result.errors) == 1
        assert result.errors[0]['message'] == "Test error"
        assert result.errors[0]['error_code'] == "ERROR_CODE"
    
    def test_add_warning(self):
        """Test adding warning"""
        result = InspectionCompletionResult()
        result.add_warning("Test warning", "WARNING_CODE")
        
        assert result.success is True  # Warnings don't affect success
        assert len(result.warnings) == 1
        assert result.warnings[0]['message'] == "Test warning"
    
    def test_get_summary(self):
        """Test getting completion result summary"""
        result = InspectionCompletionResult()
        result.inspection_id = 123
        result.available_templates = [{'id': 1, 'name': 'Template 1'}]
        result.add_error("Error 1")
        result.add_warning("Warning 1")
        
        summary = result.get_summary()
        
        assert summary['success'] is False
        assert summary['inspection_id'] == 123
        assert summary['available_templates_count'] == 1
        assert summary['error_count'] == 1
        assert summary['warning_count'] == 1


class TestInspectionCompletionService:
    """Test cases for InspectionCompletionService"""
    
    def setup_method(self):
        """Set up test fixtures"""
        self.mock_session = Mock()
        self.service = InspectionCompletionService(self.mock_session)
        
        # Mock dependencies
        self.service.template_service = Mock()
        self.service.report_service = Mock()
        
        # Create mock inspection
        self.mock_inspection = Mock(spec=Inspection)
        self.mock_inspection.id = 123
        self.mock_inspection.inspection_number = "INS-2025-001"
        self.mock_inspection.title = "Pressure Vessel Inspection"
        self.mock_inspection.status = InspectionStatus.InProgress
        self.mock_inspection.start_date = date(2025, 1, 15)
        self.mock_inspection.end_date = None
        self.mock_inspection.equipment_id = 456
        
        # Create mock equipment
        self.mock_equipment = Mock()
        self.mock_equipment.equipment_type = "Pressure Vessel"
        self.mock_inspection.equipment = self.mock_equipment
        
        # Create mock template
        self.mock_template = Mock(spec=Template)
        self.mock_template.id = 1
        self.mock_template.name = "Pressure Vessel Report Template"
        self.mock_template.description = "Standard template for pressure vessel inspections"
        self.mock_template.created_at = datetime(2025, 1, 1)
    
    def test_get_inspection_success(self):
        """Test successful inspection retrieval"""
        mock_result = Mock()
        mock_result.first.return_value = self.mock_inspection
        self.mock_session.exec.return_value = mock_result
        
        result = self.service.get_inspection(123)
        
        assert result is self.mock_inspection
        self.mock_session.exec.assert_called_once()
    
    def test_get_inspection_not_found(self):
        """Test inspection retrieval when not found"""
        mock_result = Mock()
        mock_result.first.return_value = None
        self.mock_session.exec.return_value = mock_result
        
        result = self.service.get_inspection(999)
        
        assert result is None
    
    def test_can_complete_inspection_in_progress(self):
        """Test completion check for in-progress inspection"""
        inspection = Mock(spec=Inspection)
        inspection.status = InspectionStatus.InProgress
        
        result = self.service.can_complete_inspection(inspection)
        
        assert result is True
    
    def test_can_complete_inspection_already_completed(self):
        """Test completion check for already completed inspection"""
        inspection = Mock(spec=Inspection)
        inspection.status = InspectionStatus.Completed
        
        result = self.service.can_complete_inspection(inspection)
        
        assert result is False
    
    def test_can_complete_inspection_planned(self):
        """Test completion check for planned inspection"""
        inspection = Mock(spec=Inspection)
        inspection.status = InspectionStatus.Planned
        
        result = self.service.can_complete_inspection(inspection)
        
        assert result is False
    
    def test_complete_inspection_success(self):
        """Test successful inspection completion"""
        # Mock get_inspection
        self.service.get_inspection = Mock(return_value=self.mock_inspection)
        
        # Mock can_complete_inspection
        self.service.can_complete_inspection = Mock(return_value=True)
        
        # Mock get_available_templates_for_inspection
        mock_templates = [
            {'id': 1, 'name': 'Template 1', 'suitability_score': 0.8}
        ]
        self.service.get_available_templates_for_inspection = Mock(return_value=mock_templates)
        
        # Mock session behavior
        self.mock_session.add = Mock()
        self.mock_session.commit = Mock()
        
        result = self.service.complete_inspection(123)
        
        assert result.success is True
        assert result.inspection_id == 123
        assert len(result.available_templates) == 1
        assert self.mock_inspection.status == InspectionStatus.Completed
        assert self.mock_inspection.end_date is not None
        
        self.mock_session.add.assert_called_once_with(self.mock_inspection)
        self.mock_session.commit.assert_called_once()
    
    def test_complete_inspection_not_found(self):
        """Test completion when inspection not found"""
        self.service.get_inspection = Mock(return_value=None)
        
        result = self.service.complete_inspection(999)
        
        assert result.success is False
        assert any("not found" in error['message'] for error in result.errors)
    
    def test_complete_inspection_cannot_complete(self):
        """Test completion when inspection cannot be completed"""
        self.service.get_inspection = Mock(return_value=self.mock_inspection)
        self.service.can_complete_inspection = Mock(return_value=False)
        
        result = self.service.complete_inspection(123)
        
        assert result.success is False
        assert any("cannot be completed" in error['message'] for error in result.errors)
    
    def test_complete_inspection_no_templates(self):
        """Test completion when no templates are available"""
        self.service.get_inspection = Mock(return_value=self.mock_inspection)
        self.service.can_complete_inspection = Mock(return_value=True)
        self.service.get_available_templates_for_inspection = Mock(return_value=[])
        
        self.mock_session.add = Mock()
        self.mock_session.commit = Mock()
        
        result = self.service.complete_inspection(123)
        
        assert result.success is True  # Still successful, just with warning
        assert len(result.warnings) == 1
        assert "No report templates available" in result.warnings[0]['message']
    
    def test_get_available_templates_for_inspection(self):
        """Test getting available templates for inspection"""
        # Mock template service
        mock_templates = [self.mock_template]
        self.service.template_service.get_all_templates.return_value = mock_templates
        
        result = self.service.get_available_templates_for_inspection(self.mock_inspection)
        
        assert len(result) == 1
        assert result[0]['id'] == 1
        assert result[0]['name'] == "Pressure Vessel Report Template"
        assert 'suitability_score' in result[0]
        
        self.service.template_service.get_all_templates.assert_called_once_with(active_only=True)
    
    def test_calculate_template_suitability_equipment_match(self):
        """Test template suitability calculation with equipment type match"""
        score = self.service._calculate_template_suitability(self.mock_template, self.mock_inspection)
        
        # Should get bonus for equipment type match
        assert score > 0.5  # Base score + equipment type bonus
    
    def test_calculate_template_suitability_no_equipment(self):
        """Test template suitability calculation without equipment"""
        inspection_no_equipment = Mock(spec=Inspection)
        inspection_no_equipment.equipment = None
        
        score = self.service._calculate_template_suitability(self.mock_template, inspection_no_equipment)
        
        # Should get base score
        assert score >= 0.5
    
    def test_get_inspection_completion_status_found(self):
        """Test getting completion status for existing inspection"""
        self.service.get_inspection = Mock(return_value=self.mock_inspection)
        self.service.can_complete_inspection = Mock(return_value=True)
        self.service.report_service.get_reports_by_inspection.return_value = []
        
        result = self.service.get_inspection_completion_status(123)
        
        assert result['found'] is True
        assert result['inspection']['id'] == 123
        assert result['completion']['can_complete'] is True
        assert result['completion']['is_completed'] is False
        assert result['reports']['existing_count'] == 0
    
    def test_get_inspection_completion_status_not_found(self):
        """Test getting completion status for non-existent inspection"""
        self.service.get_inspection = Mock(return_value=None)
        
        result = self.service.get_inspection_completion_status(999)
        
        assert result['found'] is False
        assert 'error' in result
    
    def test_get_inspection_completion_status_with_existing_reports(self):
        """Test getting completion status with existing reports"""
        mock_report = Mock()
        mock_report.id = 1
        mock_report.template_id = 1
        mock_report.status = "submitted"
        mock_report.created_at = datetime(2025, 1, 16)
        
        self.service.get_inspection = Mock(return_value=self.mock_inspection)
        self.service.can_complete_inspection = Mock(return_value=True)
        self.service.report_service.get_reports_by_inspection.return_value = [mock_report]
        
        result = self.service.get_inspection_completion_status(123)
        
        assert result['reports']['existing_count'] == 1
        assert len(result['reports']['existing_reports']) == 1
        assert result['reports']['existing_reports'][0]['id'] == 1
    
    def test_get_completion_blockers_already_completed(self):
        """Test getting completion blockers for completed inspection"""
        completed_inspection = Mock(spec=Inspection)
        completed_inspection.status = InspectionStatus.Completed
        
        blockers = self.service._get_completion_blockers(completed_inspection)
        
        assert len(blockers) == 1
        assert "already completed" in blockers[0]
    
    def test_get_completion_blockers_not_started(self):
        """Test getting completion blockers for planned inspection"""
        planned_inspection = Mock(spec=Inspection)
        planned_inspection.status = InspectionStatus.Planned
        
        blockers = self.service._get_completion_blockers(planned_inspection)
        
        assert len(blockers) == 1
        assert "not started" in blockers[0]
    
    def test_trigger_report_creation_popup_success(self):
        """Test triggering report creation popup for completed inspection"""
        completed_inspection = Mock(spec=Inspection)
        completed_inspection.id = 123
        completed_inspection.inspection_number = "INS-2025-001"
        completed_inspection.title = "Test Inspection"
        completed_inspection.equipment_id = 456
        completed_inspection.status = InspectionStatus.Completed
        
        mock_templates = [
            {'id': 1, 'name': 'Template 1', 'suitability_score': 0.8}
        ]
        
        self.service.get_inspection = Mock(return_value=completed_inspection)
        self.service.get_available_templates_for_inspection = Mock(return_value=mock_templates)
        
        result = self.service.trigger_report_creation_popup(123)
        
        assert result['show_popup'] is True
        assert result['inspection']['id'] == 123
        assert len(result['templates']) == 1
        assert 'message' in result
    
    def test_trigger_report_creation_popup_not_completed(self):
        """Test triggering popup for non-completed inspection"""
        self.service.get_inspection = Mock(return_value=self.mock_inspection)  # InProgress status
        
        result = self.service.trigger_report_creation_popup(123)
        
        assert result['show_popup'] is False
        assert result['reason'] == 'Inspection is not completed'
    
    def test_trigger_report_creation_popup_not_found(self):
        """Test triggering popup for non-existent inspection"""
        self.service.get_inspection = Mock(return_value=None)
        
        result = self.service.trigger_report_creation_popup(999)
        
        assert result['show_popup'] is False
        assert 'error' in result


class TestInspectionCompletionServiceEdgeCases:
    """Test edge cases for InspectionCompletionService"""
    
    def setup_method(self):
        """Set up test fixtures"""
        self.mock_session = Mock()
        self.service = InspectionCompletionService(self.mock_session)
        self.service.template_service = Mock()
        self.service.report_service = Mock()
    
    def test_complete_inspection_session_error(self):
        """Test completion when session commit fails"""
        mock_inspection = Mock(spec=Inspection)
        mock_inspection.status = InspectionStatus.InProgress
        
        self.service.get_inspection = Mock(return_value=mock_inspection)
        self.service.can_complete_inspection = Mock(return_value=True)
        
        # Mock session to raise exception on commit
        self.mock_session.add = Mock()
        self.mock_session.commit = Mock(side_effect=Exception("Database error"))
        self.mock_session.rollback = Mock()
        
        result = self.service.complete_inspection(123)
        
        assert result.success is False
        assert any("Failed to complete inspection" in error['message'] for error in result.errors)
        self.mock_session.rollback.assert_called_once()
    
    def test_get_available_templates_service_error(self):
        """Test getting templates when template service fails"""
        self.service.template_service.get_all_templates.side_effect = Exception("Service error")
        
        with pytest.raises(InspectionCompletionError) as exc_info:
            self.service.get_available_templates_for_inspection(Mock())
        
        assert "Failed to get available templates" in str(exc_info.value)
    
    def test_get_inspection_completion_status_service_error(self):
        """Test getting completion status when service fails"""
        self.service.get_inspection = Mock(side_effect=Exception("Service error"))
        
        result = self.service.get_inspection_completion_status(123)
        
        assert result['found'] is False
        assert "Failed to get completion status" in result['error']