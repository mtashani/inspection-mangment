"""Tests for AutoFieldService"""

import pytest
from datetime import datetime, date
from unittest.mock import Mock

from app.domains.report.services.auto_field_service import (
    AutoFieldService, 
    AutoFieldContext, 
    AutoFieldError,
    AUTO_SOURCES
)


class TestAutoFieldService:
    """Test cases for AutoFieldService"""
    
    def setup_method(self):
        """Set up test fixtures"""
        self.service = AutoFieldService()
        
        # Create mock objects
        self.mock_inspection = Mock()
        self.mock_inspection.id = 123
        self.mock_inspection.start_date = date(2025, 1, 15)
        self.mock_inspection.end_date = date(2025, 1, 16)
        self.mock_inspection.status = "completed"
        self.mock_inspection.number = "INS-2025-001"
        
        self.mock_equipment = Mock()
        self.mock_equipment.tag = "EQ-001"
        self.mock_equipment.name = "Pressure Vessel A"
        self.mock_equipment.location = "Building 1, Floor 2"
        
        self.mock_user = Mock()
        self.mock_user.full_name = "John Doe"
        self.mock_user.department = "Engineering"
        
        self.mock_daily_report = Mock()
        self.mock_daily_report.inspectors = ["John Doe", "Jane Smith"]
        
        self.context = AutoFieldContext(
            inspection=self.mock_inspection,
            equipment=self.mock_equipment,
            user=self.mock_user,
            daily_report=self.mock_daily_report
        )
    
    def test_get_available_sources(self):
        """Test getting available auto-source keys"""
        sources = self.service.get_available_sources()
        
        assert isinstance(sources, dict)
        assert "inspection.start_date" in sources
        assert "equipment.tag" in sources
        assert "user.full_name" in sources
        assert "current.date" in sources
        
    def test_validate_source_key_valid(self):
        """Test validation of valid source keys"""
        assert self.service.validate_source_key("inspection.start_date") is True
        assert self.service.validate_source_key("equipment.tag") is True
        assert self.service.validate_source_key("user.full_name") is True
        
    def test_validate_source_key_invalid(self):
        """Test validation of invalid source keys"""
        assert self.service.validate_source_key("invalid.key") is False
        assert self.service.validate_source_key("inspection.invalid") is False
        
    def test_populate_inspection_fields(self):
        """Test populating inspection-related fields"""
        # Test start_date
        result = self.service.populate_field("inspection.start_date", self.context)
        assert result == date(2025, 1, 15)
        
        # Test end_date
        result = self.service.populate_field("inspection.end_date", self.context)
        assert result == date(2025, 1, 16)
        
        # Test status
        result = self.service.populate_field("inspection.status", self.context)
        assert result == "completed"
        
        # Test number
        result = self.service.populate_field("inspection.number", self.context)
        assert result == "INS-2025-001"
        
    def test_populate_equipment_fields(self):
        """Test populating equipment-related fields"""
        # Test tag
        result = self.service.populate_field("equipment.tag", self.context)
        assert result == "EQ-001"
        
        # Test name
        result = self.service.populate_field("equipment.name", self.context)
        assert result == "Pressure Vessel A"
        
        # Test location
        result = self.service.populate_field("equipment.location", self.context)
        assert result == "Building 1, Floor 2"
        
    def test_populate_user_fields(self):
        """Test populating user-related fields"""
        # Test full_name
        result = self.service.populate_field("user.full_name", self.context)
        assert result == "John Doe"
        
        # Test department
        result = self.service.populate_field("user.department", self.context)
        assert result == "Engineering"
        
    def test_populate_daily_report_fields(self):
        """Test populating daily report fields"""
        result = self.service.populate_field("daily_report.inspectors", self.context)
        assert result == ["John Doe", "Jane Smith"]
        
    def test_populate_report_fields(self):
        """Test populating report-specific fields"""
        result = self.service.populate_field("report.serial_number", self.context)
        
        # Should be in format RPT-{inspection_id}-{timestamp}
        assert result.startswith("RPT-123-")
        assert len(result) == len("RPT-123-20250129123456")  # Expected format length
        
    def test_populate_current_fields(self):
        """Test populating current date/time fields"""
        # Test current date
        result = self.service.populate_field("current.date", self.context)
        assert isinstance(result, date)
        assert result == date.today()
        
        # Test current time
        result = self.service.populate_field("current.time", self.context)
        assert hasattr(result, 'hour')  # Should be a time object
        
    def test_populate_field_invalid_source_key(self):
        """Test error handling for invalid source keys"""
        with pytest.raises(AutoFieldError) as exc_info:
            self.service.populate_field("invalid.key", self.context)
        
        assert "Unknown source key" in str(exc_info.value)
        assert exc_info.value.source_key == "invalid.key"
        
    def test_populate_field_missing_context_data(self):
        """Test error handling when context data is missing"""
        empty_context = AutoFieldContext()
        
        with pytest.raises(AutoFieldError) as exc_info:
            self.service.populate_field("inspection.start_date", empty_context)
        
        assert "Inspection data not available" in str(exc_info.value)
        
    def test_populate_field_invalid_attribute(self):
        """Test error handling for invalid attributes"""
        with pytest.raises(AutoFieldError) as exc_info:
            self.service.populate_field("inspection.invalid_attr", self.context)
        
        assert "Unknown inspection attribute" in str(exc_info.value)
        
    def test_populate_multiple_fields_success(self):
        """Test populating multiple fields successfully"""
        field_mappings = {
            "start_date": "inspection.start_date",
            "equipment_tag": "equipment.tag",
            "inspector_name": "user.full_name"
        }
        
        results = self.service.populate_multiple_fields(field_mappings, self.context)
        
        assert len(results) == 3
        assert results["start_date"] == date(2025, 1, 15)
        assert results["equipment_tag"] == "EQ-001"
        assert results["inspector_name"] == "John Doe"
        
    def test_populate_multiple_fields_with_errors(self):
        """Test populating multiple fields with some errors"""
        field_mappings = {
            "start_date": "inspection.start_date",
            "invalid_field": "invalid.key",
            "equipment_tag": "equipment.tag"
        }
        
        results = self.service.populate_multiple_fields(field_mappings, self.context)
        
        # Should return successful results even if some fail
        assert len(results) == 2  # Only successful ones
        assert results["start_date"] == date(2025, 1, 15)
        assert results["equipment_tag"] == "EQ-001"
        assert "invalid_field" not in results
        
    def test_auto_field_error_creation(self):
        """Test AutoFieldError exception creation"""
        error = AutoFieldError("test.key", "Test message")
        
        assert error.source_key == "test.key"
        assert error.message == "Test message"
        assert "Auto-field error for 'test.key': Test message" in str(error)


class TestAutoFieldContext:
    """Test cases for AutoFieldContext"""
    
    def test_context_creation_with_defaults(self):
        """Test creating context with default values"""
        context = AutoFieldContext()
        
        assert context.inspection is None
        assert context.equipment is None
        assert context.user is None
        assert context.daily_report is None
        
    def test_context_creation_with_values(self):
        """Test creating context with provided values"""
        mock_inspection = Mock()
        mock_equipment = Mock()
        
        context = AutoFieldContext(
            inspection=mock_inspection,
            equipment=mock_equipment
        )
        
        assert context.inspection is mock_inspection
        assert context.equipment is mock_equipment
        assert context.user is None
        assert context.daily_report is None