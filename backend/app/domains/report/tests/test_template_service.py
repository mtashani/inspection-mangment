"""Tests for TemplateService"""

import pytest
from datetime import datetime
from unittest.mock import Mock, MagicMock
from sqlmodel import Session

from app.domains.report.services.template_service import TemplateService, TemplateServiceError
from app.domains.report.models.template import Template
from app.domains.report.models.template_section import TemplateSection
from app.domains.report.models.template_subsection import TemplateSubSection
from app.domains.report.models.template_field import TemplateField
from app.domains.report.models.enums import SectionType, FieldType, ValueSource


class TestTemplateService:
    """Test cases for TemplateService"""
    
    def setup_method(self):
        """Set up test fixtures"""
        self.mock_session = Mock(spec=Session)
        self.service = TemplateService(self.mock_session)
        
        # Create mock template
        self.mock_template = Mock(spec=Template)
        self.mock_template.id = 1
        self.mock_template.name = "Test Template"
        self.mock_template.description = "Test Description"
        self.mock_template.is_active = True
        self.mock_template.created_at = datetime(2025, 1, 15)
        self.mock_template.updated_at = datetime(2025, 1, 15)
    
    def test_create_template_success(self):
        """Test successful template creation"""
        # Mock session behavior
        self.mock_session.add = Mock()
        self.mock_session.commit = Mock()
        self.mock_session.refresh = Mock()
        
        result = self.service.create_template("New Template", "Description")
        
        # Verify session calls
        self.mock_session.add.assert_called_once()
        self.mock_session.commit.assert_called_once()
        self.mock_session.refresh.assert_called_once()
        
        # Verify template properties
        assert result.name == "New Template"
        assert result.description == "Description"
        assert result.is_active is True
    
    def test_create_template_duplicate_name(self):
        """Test template creation with duplicate name"""
        from sqlalchemy.exc import IntegrityError
        
        # Mock IntegrityError for duplicate name
        self.mock_session.add = Mock()
        self.mock_session.commit = Mock(side_effect=IntegrityError("", "", "UNIQUE constraint failed"))
        self.mock_session.rollback = Mock()
        
        with pytest.raises(TemplateServiceError) as exc_info:
            self.service.create_template("Duplicate Name")
        
        assert "already exists" in str(exc_info.value)
        assert exc_info.value.error_code == "DUPLICATE_NAME"
        self.mock_session.rollback.assert_called_once()
    
    def test_get_template_success(self):
        """Test successful template retrieval"""
        # Mock session exec behavior
        mock_result = Mock()
        mock_result.first.return_value = self.mock_template
        self.mock_session.exec.return_value = mock_result
        
        result = self.service.get_template(1)
        
        assert result is self.mock_template
        self.mock_session.exec.assert_called_once()
    
    def test_get_template_not_found(self):
        """Test template retrieval when not found"""
        mock_result = Mock()
        mock_result.first.return_value = None
        self.mock_session.exec.return_value = mock_result
        
        result = self.service.get_template(999)
        
        assert result is None
    
    def test_get_template_by_name_success(self):
        """Test successful template retrieval by name"""
        mock_result = Mock()
        mock_result.first.return_value = self.mock_template
        self.mock_session.exec.return_value = mock_result
        
        result = self.service.get_template_by_name("Test Template")
        
        assert result is self.mock_template
        self.mock_session.exec.assert_called_once()
    
    def test_get_all_templates_active_only(self):
        """Test getting all active templates"""
        mock_templates = [self.mock_template]
        mock_result = Mock()
        mock_result.all.return_value = mock_templates
        self.mock_session.exec.return_value = mock_result
        
        result = self.service.get_all_templates(active_only=True)
        
        assert result == mock_templates
        self.mock_session.exec.assert_called_once()
    
    def test_get_all_templates_include_inactive(self):
        """Test getting all templates including inactive"""
        mock_templates = [self.mock_template]
        mock_result = Mock()
        mock_result.all.return_value = mock_templates
        self.mock_session.exec.return_value = mock_result
        
        result = self.service.get_all_templates(active_only=False)
        
        assert result == mock_templates
        self.mock_session.exec.assert_called_once()
    
    def test_update_template_success(self):
        """Test successful template update"""
        # Mock get_template to return existing template
        self.service.get_template = Mock(return_value=self.mock_template)
        
        # Mock session behavior
        self.mock_session.add = Mock()
        self.mock_session.commit = Mock()
        self.mock_session.refresh = Mock()
        
        result = self.service.update_template(
            1, 
            name="Updated Name",
            description="Updated Description",
            is_active=False
        )
        
        assert result is self.mock_template
        assert self.mock_template.name == "Updated Name"
        assert self.mock_template.description == "Updated Description"
        assert self.mock_template.is_active is False
        
        self.mock_session.add.assert_called_once_with(self.mock_template)
        self.mock_session.commit.assert_called_once()
        self.mock_session.refresh.assert_called_once_with(self.mock_template)
    
    def test_update_template_not_found(self):
        """Test template update when template not found"""
        self.service.get_template = Mock(return_value=None)
        
        result = self.service.update_template(999, name="New Name")
        
        assert result is None
    
    def test_update_template_duplicate_name(self):
        """Test template update with duplicate name"""
        from sqlalchemy.exc import IntegrityError
        
        self.service.get_template = Mock(return_value=self.mock_template)
        self.mock_session.add = Mock()
        self.mock_session.commit = Mock(side_effect=IntegrityError("", "", "UNIQUE constraint failed"))
        self.mock_session.rollback = Mock()
        
        with pytest.raises(TemplateServiceError) as exc_info:
            self.service.update_template(1, name="Duplicate Name")
        
        assert "already exists" in str(exc_info.value)
        assert exc_info.value.error_code == "DUPLICATE_NAME"
        self.mock_session.rollback.assert_called_once()
    
    def test_delete_template_success(self):
        """Test successful template soft delete"""
        self.service.get_template = Mock(return_value=self.mock_template)
        self.mock_session.add = Mock()
        self.mock_session.commit = Mock()
        
        result = self.service.delete_template(1)
        
        assert result is True
        assert self.mock_template.is_active is False
        self.mock_session.add.assert_called_once_with(self.mock_template)
        self.mock_session.commit.assert_called_once()
    
    def test_delete_template_not_found(self):
        """Test template delete when not found"""
        self.service.get_template = Mock(return_value=None)
        
        result = self.service.delete_template(999)
        
        assert result is False
    
    def test_hard_delete_template_success(self):
        """Test successful template hard delete"""
        # Mock template with structure
        mock_field = Mock(spec=TemplateField)
        mock_subsection = Mock(spec=TemplateSubSection)
        mock_subsection.id = 1
        mock_section = Mock(spec=TemplateSection)
        mock_section.id = 1
        
        self.service.get_template = Mock(return_value=self.mock_template)
        
        # Mock session exec calls for getting related data
        mock_sections_result = Mock()
        mock_sections_result.all.return_value = [mock_section]
        
        mock_subsections_result = Mock()
        mock_subsections_result.all.return_value = [mock_subsection]
        
        mock_fields_result = Mock()
        mock_fields_result.all.return_value = [mock_field]
        
        self.mock_session.exec.side_effect = [
            mock_sections_result,      # sections query
            mock_subsections_result,   # subsections query
            mock_fields_result         # fields query
        ]
        
        self.mock_session.delete = Mock()
        self.mock_session.commit = Mock()
        
        result = self.service.hard_delete_template(1)
        
        assert result is True
        
        # Verify deletion calls (field, subsection, section, template)
        assert self.mock_session.delete.call_count == 4
        self.mock_session.commit.assert_called_once()
    
    def test_hard_delete_template_not_found(self):
        """Test hard delete when template not found"""
        self.service.get_template = Mock(return_value=None)
        
        result = self.service.hard_delete_template(999)
        
        assert result is False
    
    def test_get_template_with_structure_success(self):
        """Test getting template with full structure"""
        # Mock template
        mock_template = Mock(spec=Template)
        mock_template.id = 1
        
        # Mock section
        mock_section = Mock(spec=TemplateSection)
        mock_section.id = 1
        
        # Mock subsection
        mock_subsection = Mock(spec=TemplateSubSection)
        mock_subsection.id = 1
        
        # Mock field
        mock_field = Mock(spec=TemplateField)
        
        # Mock session exec calls
        template_result = Mock()
        template_result.first.return_value = mock_template
        
        sections_result = Mock()
        sections_result.all.return_value = [mock_section]
        
        subsections_result = Mock()
        subsections_result.all.return_value = [mock_subsection]
        
        fields_result = Mock()
        fields_result.all.return_value = [mock_field]
        
        self.mock_session.exec.side_effect = [
            template_result,     # template query
            sections_result,     # sections query
            subsections_result,  # subsections query
            fields_result        # fields query
        ]
        
        result = self.service.get_template_with_structure(1)
        
        assert result is mock_template
        assert result.sections == [mock_section]
        assert mock_section.subsections == [mock_subsection]
        assert mock_subsection.fields == [mock_field]
    
    def test_get_template_with_structure_not_found(self):
        """Test getting template structure when template not found"""
        template_result = Mock()
        template_result.first.return_value = None
        self.mock_session.exec.return_value = template_result
        
        result = self.service.get_template_with_structure(999)
        
        assert result is None
    
    def test_clone_template_success(self):
        """Test successful template cloning"""
        # Mock source template with structure
        source_template = Mock(spec=Template)
        source_template.id = 1
        source_template.name = "Source Template"
        source_template.sections = []
        
        # Mock create_template and get_template_with_structure
        new_template = Mock(spec=Template)
        new_template.id = 2
        
        self.service.get_template_with_structure = Mock(side_effect=[source_template, new_template])
        self.service.create_template = Mock(return_value=new_template)
        
        self.mock_session.add = Mock()
        self.mock_session.flush = Mock()
        self.mock_session.commit = Mock()
        
        result = self.service.clone_template(1, "Cloned Template")
        
        assert result is new_template
        self.service.create_template.assert_called_once_with(
            name="Cloned Template",
            description="Cloned from: Source Template"
        )
        self.mock_session.commit.assert_called_once()
    
    def test_clone_template_source_not_found(self):
        """Test cloning when source template not found"""
        self.service.get_template_with_structure = Mock(return_value=None)
        
        result = self.service.clone_template(999, "Cloned Template")
        
        assert result is None
    
    def test_get_template_stats_success(self):
        """Test getting template statistics"""
        # Mock template with structure
        mock_field1 = Mock(spec=TemplateField)
        mock_field1.field_type = FieldType.TEXT
        mock_field1.value_source = ValueSource.AUTO
        mock_field1.is_required = True
        
        mock_field2 = Mock(spec=TemplateField)
        mock_field2.field_type = FieldType.TEXT
        mock_field2.value_source = ValueSource.MANUAL
        mock_field2.is_required = False
        
        mock_subsection = Mock(spec=TemplateSubSection)
        mock_subsection.fields = [mock_field1, mock_field2]
        
        mock_section = Mock(spec=TemplateSection)
        mock_section.subsections = [mock_subsection]
        
        mock_template = Mock(spec=Template)
        mock_template.id = 1
        mock_template.name = "Test Template"
        mock_template.is_active = True
        mock_template.created_at = datetime(2025, 1, 15)
        mock_template.updated_at = datetime(2025, 1, 15)
        mock_template.sections = [mock_section]
        
        self.service.get_template_with_structure = Mock(return_value=mock_template)
        
        result = self.service.get_template_stats(1)
        
        assert result['template_id'] == 1
        assert result['name'] == "Test Template"
        assert result['structure']['total_sections'] == 1
        assert result['structure']['total_subsections'] == 1
        assert result['structure']['total_fields'] == 2
        assert result['field_analysis']['auto_fields'] == 1
        assert result['field_analysis']['manual_fields'] == 1
        assert result['field_analysis']['required_fields'] == 1
        assert result['field_analysis']['field_types']['text'] == 2
    
    def test_get_template_stats_not_found(self):
        """Test getting stats when template not found"""
        self.service.get_template_with_structure = Mock(return_value=None)
        
        result = self.service.get_template_stats(999)
        
        assert result is None
    
    def test_search_templates_success(self):
        """Test successful template search"""
        mock_templates = [self.mock_template]
        mock_result = Mock()
        mock_result.all.return_value = mock_templates
        self.mock_session.exec.return_value = mock_result
        
        result = self.service.search_templates("Test", active_only=True)
        
        assert result == mock_templates
        self.mock_session.exec.assert_called_once()
    
    def test_search_templates_include_inactive(self):
        """Test template search including inactive templates"""
        mock_templates = [self.mock_template]
        mock_result = Mock()
        mock_result.all.return_value = mock_templates
        self.mock_session.exec.return_value = mock_result
        
        result = self.service.search_templates("Test", active_only=False)
        
        assert result == mock_templates
        self.mock_session.exec.assert_called_once()


class TestTemplateServiceError:
    """Test cases for TemplateServiceError"""
    
    def test_template_service_error_creation(self):
        """Test TemplateServiceError creation"""
        error = TemplateServiceError("Test message", "TEST_CODE")
        
        assert error.message == "Test message"
        assert error.error_code == "TEST_CODE"
        assert str(error) == "Test message"
    
    def test_template_service_error_without_code(self):
        """Test TemplateServiceError creation without error code"""
        error = TemplateServiceError("Test message")
        
        assert error.message == "Test message"
        assert error.error_code is None
        assert str(error) == "Test message"


class TestTemplateServiceEdgeCases:
    """Test edge cases for TemplateService"""
    
    def setup_method(self):
        """Set up test fixtures"""
        self.mock_session = Mock(spec=Session)
        self.service = TemplateService(self.mock_session)
    
    def test_create_template_with_empty_name(self):
        """Test creating template with empty name"""
        self.mock_session.add = Mock()
        self.mock_session.commit = Mock()
        self.mock_session.refresh = Mock()
        
        result = self.service.create_template("")
        
        assert result.name == ""
        self.mock_session.add.assert_called_once()
    
    def test_update_template_no_changes(self):
        """Test updating template with no changes"""
        mock_template = Mock(spec=Template)
        mock_template.updated_at = datetime(2025, 1, 15)
        
        self.service.get_template = Mock(return_value=mock_template)
        self.mock_session.add = Mock()
        self.mock_session.commit = Mock()
        self.mock_session.refresh = Mock()
        
        result = self.service.update_template(1)
        
        assert result is mock_template
        # updated_at should still be updated even with no other changes
        assert mock_template.updated_at > datetime(2025, 1, 15)
    
    def test_search_templates_empty_query(self):
        """Test searching templates with empty query"""
        mock_templates = []
        mock_result = Mock()
        mock_result.all.return_value = mock_templates
        self.mock_session.exec.return_value = mock_result
        
        result = self.service.search_templates("")
        
        assert result == mock_templates
        self.mock_session.exec.assert_called_once()