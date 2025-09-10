"""Tests for InspectionIntegrationService"""

from datetime import date
from unittest.mock import Mock

from app.domains.report.services.inspection_integration_service import InspectionIntegrationService
from app.domains.report.services.auto_field_service import AutoFieldError


class TestInspectionIntegrationService:
    """Test cases for InspectionIntegrationService"""
    
    def setup_method(self):
        """Set up test fixtures"""
        self.service = InspectionIntegrationService()
        
        # Create mock inspection
        self.mock_inspection = Mock()
        self.mock_inspection.id = 123
        self.mock_inspection.inspection_number = "INS-2025-001"
        self.mock_inspection.title = "Pressure Vessel Inspection"
        self.mock_inspection.start_date = date(2025, 1, 15)
        self.mock_inspection.end_date = date(2025, 1, 16)
        self.mock_inspection.status = "completed"
        self.mock_inspection.equipment_id = 456
        
        # Create mock equipment
        self.mock_equipment = Mock()
        self.mock_equipment.id = 456
        self.mock_equipment.tag = "PV-001"
        self.mock_equipment.description = "Main Pressure Vessel"
        self.mock_equipment.unit = "Unit A"
        self.mock_equipment.equipment_type = "Pressure Vessel"
        
        # Link equipment to inspection
        self.mock_inspection.equipment = self.mock_equipment
        
        # Create mock user
        self.mock_user = Mock()
        self.mock_user.full_name = "John Doe"
        self.mock_user.department = "Engineering"
        
        # Create mock daily report
        self.mock_daily_report = Mock()
        self.mock_daily_report.inspectors = ["John Doe", "Jane Smith"]
    
    def test_create_context_from_inspection(self):
        """Test creating AutoFieldContext from inspection data"""
        context = self.service.create_context_from_inspection(
            self.mock_inspection,
            self.mock_equipment,
            self.mock_user,
            self.mock_daily_report
        )
        
        assert context.inspection is self.mock_inspection
        assert context.equipment is self.mock_equipment
        assert context.user is self.mock_user
        assert context.daily_report is self.mock_daily_report
    
    def test_create_context_with_equipment_from_inspection(self):
        """Test creating context when equipment is fetched from inspection"""
        context = self.service.create_context_from_inspection(
            self.mock_inspection,
            user=self.mock_user
        )
        
        assert context.inspection is self.mock_inspection
        assert context.equipment is self.mock_equipment  # Should be fetched from inspection
        assert context.user is self.mock_user
        assert context.daily_report is None
    
    def test_populate_template_fields(self):
        """Test populating template fields with auto-field values"""
        # Create mock template fields
        field1 = Mock()
        field1.id = 1
        field1.value_source = 'auto'
        field1.auto_source_key = 'inspection.start_date'
        
        field2 = Mock()
        field2.id = 2
        field2.value_source = 'auto'
        field2.auto_source_key = 'equipment.tag'
        
        field3 = Mock()
        field3.id = 3
        field3.value_source = 'manual'  # Should be skipped
        
        template_fields = [field1, field2, field3]
        
        results = self.service.populate_template_fields(
            template_fields,
            self.mock_inspection,
            self.mock_equipment,
            self.mock_user
        )
        
        assert len(results) == 2  # Only auto fields
        assert results[1] == date(2025, 1, 15)  # inspection.start_date
        assert results[2] == "PV-001"  # equipment.tag
        assert 3 not in results  # Manual field should be skipped
    
    def test_populate_template_fields_with_errors(self):
        """Test handling errors during template field population"""
        # Create field with invalid auto_source_key
        field1 = Mock()
        field1.id = 1
        field1.value_source = 'auto'
        field1.auto_source_key = 'invalid.key'
        
        field2 = Mock()
        field2.id = 2
        field2.value_source = 'auto'
        field2.auto_source_key = 'inspection.start_date'
        
        template_fields = [field1, field2]
        
        results = self.service.populate_template_fields(
            template_fields,
            self.mock_inspection,
            self.mock_equipment
        )
        
        # Should return successful results and handle errors gracefully
        assert len(results) == 1  # Only successful field
        assert results[2] == date(2025, 1, 15)
        assert 1 not in results  # Failed field should not be in results
    
    def test_get_inspection_summary(self):
        """Test getting inspection summary"""
        summary = self.service.get_inspection_summary(self.mock_inspection)
        
        assert summary['id'] == 123
        assert summary['number'] == "INS-2025-001"
        assert summary['title'] == "Pressure Vessel Inspection"
        assert summary['start_date'] == date(2025, 1, 15)
        assert summary['end_date'] == date(2025, 1, 16)
        assert summary['status'] == "completed"
        assert summary['equipment_id'] == 456
        
        # Check equipment data
        assert 'equipment' in summary
        equipment_data = summary['equipment']
        assert equipment_data['id'] == 456
        assert equipment_data['tag'] == "PV-001"
        assert equipment_data['description'] == "Main Pressure Vessel"
        assert equipment_data['unit'] == "Unit A"
        assert equipment_data['equipment_type'] == "Pressure Vessel"
    
    def test_get_inspection_summary_without_equipment(self):
        """Test getting inspection summary when equipment is not available"""
        inspection_without_equipment = Mock()
        inspection_without_equipment.id = 123
        inspection_without_equipment.inspection_number = "INS-2025-001"
        inspection_without_equipment.title = "Test Inspection"
        # No equipment attribute
        
        summary = self.service.get_inspection_summary(inspection_without_equipment)
        
        assert summary['id'] == 123
        assert summary['number'] == "INS-2025-001"
        assert 'equipment' not in summary
    
    def test_validate_inspection_for_auto_fields(self):
        """Test validation of inspection data for auto-fields"""
        validation = self.service.validate_inspection_for_auto_fields(self.mock_inspection)
        
        # Inspection fields should be valid
        assert validation['inspection.start_date'] is True
        assert validation['inspection.end_date'] is True
        assert validation['inspection.status'] is True
        assert validation['inspection.number'] is True
        
        # Equipment fields should be valid
        assert validation['equipment.tag'] is True
        assert validation['equipment.name'] is True  # Uses description
        assert validation['equipment.location'] is True  # Uses unit
        
        # Current fields are always valid
        assert validation['current.date'] is True
        assert validation['current.time'] is True
        assert validation['report.serial_number'] is True
    
    def test_validate_inspection_with_missing_data(self):
        """Test validation when inspection has missing data"""
        incomplete_inspection = Mock()
        incomplete_inspection.id = 123
        incomplete_inspection.start_date = date(2025, 1, 15)
        # Missing other fields
        
        validation = self.service.validate_inspection_for_auto_fields(incomplete_inspection)
        
        assert validation['inspection.start_date'] is True
        assert validation['inspection.end_date'] is False
        assert validation['inspection.status'] is False
        assert validation['inspection.number'] is False
        
        # Equipment fields should be false (no equipment)
        assert validation['equipment.tag'] is False
        assert validation['equipment.name'] is False
        assert validation['equipment.location'] is False
    
    def test_get_available_auto_sources_for_inspection(self):
        """Test getting available auto-sources for inspection"""
        available_sources = self.service.get_available_auto_sources_for_inspection(self.mock_inspection)
        
        # Should include sources that have valid data
        assert 'inspection.start_date' in available_sources
        assert 'inspection.end_date' in available_sources
        assert 'equipment.tag' in available_sources
        assert 'current.date' in available_sources
        
        # Should have descriptions
        assert available_sources['inspection.start_date'] == "Inspection start date"
        assert available_sources['equipment.tag'] == "Equipment tag"
    
    def test_get_available_auto_sources_for_incomplete_inspection(self):
        """Test getting available auto-sources for incomplete inspection"""
        incomplete_inspection = Mock()
        incomplete_inspection.id = 123
        incomplete_inspection.start_date = date(2025, 1, 15)
        # Missing other fields and equipment
        
        available_sources = self.service.get_available_auto_sources_for_inspection(incomplete_inspection)
        
        # Should only include sources with valid data
        assert 'inspection.start_date' in available_sources
        assert 'inspection.end_date' not in available_sources
        assert 'equipment.tag' not in available_sources
        
        # Current fields should always be available
        assert 'current.date' in available_sources
        assert 'current.time' in available_sources
    
    def test_populate_field_with_inspection_data(self):
        """Test populating single field with inspection data"""
        result = self.service.populate_field_with_inspection_data(
            'inspection.start_date',
            self.mock_inspection,
            self.mock_equipment,
            self.mock_user
        )
        
        assert result == date(2025, 1, 15)
    
    def test_populate_field_with_inspection_data_error(self):
        """Test error handling when populating field with inspection data"""
        try:
            self.service.populate_field_with_inspection_data(
                'invalid.key',
                self.mock_inspection
            )
            assert False, "Should have raised AutoFieldError"
        except AutoFieldError as e:
            assert "Unknown source key" in str(e)


class TestInspectionIntegrationServiceEdgeCases:
    """Test edge cases for InspectionIntegrationService"""
    
    def setup_method(self):
        """Set up test fixtures"""
        self.service = InspectionIntegrationService()
    
    def test_populate_template_fields_empty_list(self):
        """Test populating empty template fields list"""
        mock_inspection = Mock()
        results = self.service.populate_template_fields([], mock_inspection)
        assert results == {}
    
    def test_populate_template_fields_no_auto_fields(self):
        """Test populating template fields with no auto fields"""
        field1 = Mock()
        field1.id = 1
        field1.value_source = 'manual'
        
        field2 = Mock()
        field2.id = 2
        field2.value_source = 'manual'
        
        template_fields = [field1, field2]
        mock_inspection = Mock()
        
        results = self.service.populate_template_fields(template_fields, mock_inspection)
        assert results == {}
    
    def test_populate_template_fields_missing_auto_source_key(self):
        """Test handling fields with missing auto_source_key"""
        field1 = Mock()
        field1.id = 1
        field1.value_source = 'auto'
        # Missing auto_source_key attribute
        
        field2 = Mock()
        field2.id = 2
        field2.value_source = 'auto'
        field2.auto_source_key = None  # None value
        
        template_fields = [field1, field2]
        mock_inspection = Mock()
        
        results = self.service.populate_template_fields(template_fields, mock_inspection)
        assert results == {}  # Both fields should be skipped