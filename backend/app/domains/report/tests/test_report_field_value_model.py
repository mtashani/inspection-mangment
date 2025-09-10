"""Tests for ReportFieldValue model"""

import pytest
import sys
import os
import json
from datetime import date

# Add the backend directory to Python path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '../../../../'))

from app.domains.report.models.report_field_value import ReportFieldValue


class TestReportFieldValueModel:
    """Test cases for ReportFieldValue model"""
    
    def test_report_field_value_creation(self):
        """Test basic report field value creation"""
        field_value = ReportFieldValue(
            final_report_id=1,
            template_field_id=1,
            text_value="Sample text value"
        )
        
        assert field_value.final_report_id == 1
        assert field_value.template_field_id == 1
        assert field_value.text_value == "Sample text value"
        assert field_value.id is None  # Not set until saved
    
    def test_report_field_value_text_storage(self):
        """Test text value storage"""
        field_value = ReportFieldValue(
            final_report_id=1,
            template_field_id=1,
            text_value="This is a text field value"
        )
        
        assert field_value.text_value == "This is a text field value"
        assert field_value.number_value is None
        assert field_value.date_value is None
        assert field_value.boolean_value is None
        assert field_value.json_value is None
    
    def test_report_field_value_number_storage(self):
        """Test number value storage"""
        field_value = ReportFieldValue(
            final_report_id=1,
            template_field_id=2,
            number_value=123.45
        )
        
        assert field_value.number_value == 123.45
        assert field_value.text_value is None
        assert field_value.date_value is None
        assert field_value.boolean_value is None
        assert field_value.json_value is None
    
    def test_report_field_value_date_storage(self):
        """Test date value storage"""
        test_date = date(2025, 1, 15)
        field_value = ReportFieldValue(
            final_report_id=1,
            template_field_id=3,
            date_value=test_date
        )
        
        assert field_value.date_value == test_date
        assert field_value.text_value is None
        assert field_value.number_value is None
        assert field_value.boolean_value is None
        assert field_value.json_value is None
    
    def test_report_field_value_boolean_storage(self):
        """Test boolean value storage"""
        # Test True value
        field_value_true = ReportFieldValue(
            final_report_id=1,
            template_field_id=4,
            boolean_value=True
        )
        
        assert field_value_true.boolean_value is True
        assert field_value_true.text_value is None
        assert field_value_true.number_value is None
        assert field_value_true.date_value is None
        assert field_value_true.json_value is None
        
        # Test False value
        field_value_false = ReportFieldValue(
            final_report_id=1,
            template_field_id=5,
            boolean_value=False
        )
        
        assert field_value_false.boolean_value is False
    
    def test_report_field_value_json_storage(self):
        """Test JSON value storage for complex data"""
        complex_data = {
            "selected_options": ["Option A", "Option B"],
            "metadata": {"source": "auto", "timestamp": "2025-01-15T10:30:00"}
        }
        
        field_value = ReportFieldValue(
            final_report_id=1,
            template_field_id=6,
            json_value=json.dumps(complex_data)
        )
        
        assert field_value.json_value is not None
        parsed_data = json.loads(field_value.json_value)
        assert parsed_data == complex_data
        assert parsed_data["selected_options"] == ["Option A", "Option B"]
        assert parsed_data["metadata"]["source"] == "auto"
    
    def test_report_field_value_foreign_keys(self):
        """Test foreign key relationships"""
        field_value = ReportFieldValue(
            final_report_id=999,
            template_field_id=888,
            text_value="FK Test"
        )
        
        assert field_value.final_report_id == 999
        assert field_value.template_field_id == 888
    
    def test_report_field_value_multiple_values_same_report(self):
        """Test multiple field values for the same report"""
        report_id = 100
        field_values = []
        
        # Create different types of field values for the same report
        field_data = [
            (1, "text_value", "Equipment Tag: EQ-001"),
            (2, "number_value", 25.5),
            (3, "boolean_value", True),
            (4, "date_value", date(2025, 1, 15)),
            (5, "json_value", json.dumps(["Option 1", "Option 2"]))
        ]
        
        for field_id, value_type, value in field_data:
            kwargs = {
                "final_report_id": report_id,
                "template_field_id": field_id,
                value_type: value
            }
            field_value = ReportFieldValue(**kwargs)
            field_values.append(field_value)
        
        # Verify all belong to same report
        for field_value in field_values:
            assert field_value.final_report_id == report_id
        
        # Verify different field types
        assert field_values[0].text_value == "Equipment Tag: EQ-001"
        assert field_values[1].number_value == 25.5
        assert field_values[2].boolean_value is True
        assert field_values[3].date_value == date(2025, 1, 15)
        assert json.loads(field_values[4].json_value) == ["Option 1", "Option 2"]
    
    def test_report_field_value_empty_values(self):
        """Test field value with no actual value set"""
        field_value = ReportFieldValue(
            final_report_id=1,
            template_field_id=1
        )
        
        # All value fields should be None by default
        assert field_value.text_value is None
        assert field_value.number_value is None
        assert field_value.date_value is None
        assert field_value.boolean_value is None
        assert field_value.json_value is None
    
    def test_report_field_value_data_type_flexibility(self):
        """Test that different data types can be stored appropriately"""
        # Integer as number
        int_field = ReportFieldValue(
            final_report_id=1,
            template_field_id=1,
            number_value=42
        )
        assert int_field.number_value == 42
        
        # Float as number
        float_field = ReportFieldValue(
            final_report_id=1,
            template_field_id=2,
            number_value=3.14159
        )
        assert float_field.number_value == 3.14159
        
        # Empty string as text
        empty_text_field = ReportFieldValue(
            final_report_id=1,
            template_field_id=3,
            text_value=""
        )
        assert empty_text_field.text_value == ""
        
        # Long text as text
        long_text = "This is a very long text field that might contain multiple sentences and detailed information about the inspection findings."
        long_text_field = ReportFieldValue(
            final_report_id=1,
            template_field_id=4,
            text_value=long_text
        )
        assert long_text_field.text_value == long_text
    
    def test_report_field_value_json_arrays_and_objects(self):
        """Test JSON storage for arrays and complex objects"""
        # Array of strings
        array_data = ["Item 1", "Item 2", "Item 3"]
        array_field = ReportFieldValue(
            final_report_id=1,
            template_field_id=1,
            json_value=json.dumps(array_data)
        )
        assert json.loads(array_field.json_value) == array_data
        
        # Complex nested object
        complex_object = {
            "inspection_results": {
                "thickness_measurements": [
                    {"location": "Point A", "value": 12.5, "unit": "mm"},
                    {"location": "Point B", "value": 11.8, "unit": "mm"}
                ],
                "overall_condition": "Good",
                "recommendations": ["Continue monitoring", "Schedule next inspection"]
            }
        }
        complex_field = ReportFieldValue(
            final_report_id=1,
            template_field_id=2,
            json_value=json.dumps(complex_object)
        )
        parsed_complex = json.loads(complex_field.json_value)
        assert parsed_complex["inspection_results"]["overall_condition"] == "Good"
        assert len(parsed_complex["inspection_results"]["thickness_measurements"]) == 2