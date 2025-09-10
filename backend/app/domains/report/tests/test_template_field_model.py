"""Tests for TemplateField model"""

import pytest
import sys
import os
import json

# Add the backend directory to Python path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '../../../../'))

from app.domains.report.models.template_field import TemplateField
from app.domains.report.models.enums import FieldType, ValueSource


class TestTemplateFieldModel:
    """Test cases for TemplateField model"""
    
    def test_template_field_creation(self):
        """Test basic template field creation"""
        field = TemplateField(
            subsection_id=1,
            label="Equipment Tag",
            field_type=FieldType.TEXT,
            value_source=ValueSource.AUTO,
            order=1
        )
        
        assert field.subsection_id == 1
        assert field.label == "Equipment Tag"
        assert field.field_type == FieldType.TEXT
        assert field.value_source == ValueSource.AUTO
        assert field.order == 1
        assert field.id is None  # Not set until saved
    
    def test_template_field_positioning(self):
        """Test field canvas positioning"""
        field = TemplateField(
            subsection_id=1,
            label="Test Field",
            field_type=FieldType.TEXT,
            value_source=ValueSource.MANUAL,
            order=1,
            row=2,
            col=3,
            rowspan=2,
            colspan=3
        )
        
        assert field.row == 2
        assert field.col == 3
        assert field.rowspan == 2
        assert field.colspan == 3
    
    def test_template_field_default_positioning(self):
        """Test default positioning values"""
        field = TemplateField(
            subsection_id=1,
            label="Default Position",
            field_type=FieldType.TEXT,
            value_source=ValueSource.MANUAL,
            order=1
        )
        
        assert field.row == 0
        assert field.col == 0
        assert field.rowspan == 1
        assert field.colspan == 1
    
    def test_template_field_types(self):
        """Test all field types"""
        field_types = [
            FieldType.TEXT,
            FieldType.TEXTAREA,
            FieldType.NUMBER,
            FieldType.DATE,
            FieldType.SELECT,
            FieldType.CHECKBOX,
            FieldType.IMAGE,
            FieldType.FILE
        ]
        
        for field_type in field_types:
            field = TemplateField(
                subsection_id=1,
                label=f"{field_type.value} Field",
                field_type=field_type,
                value_source=ValueSource.MANUAL,
                order=1
            )
            assert field.field_type == field_type
    
    def test_template_field_value_sources(self):
        """Test value source types"""
        # Manual field
        manual_field = TemplateField(
            subsection_id=1,
            label="Manual Field",
            field_type=FieldType.TEXT,
            value_source=ValueSource.MANUAL,
            order=1
        )
        assert manual_field.value_source == ValueSource.MANUAL
        
        # Auto field
        auto_field = TemplateField(
            subsection_id=1,
            label="Auto Field",
            field_type=FieldType.TEXT,
            value_source=ValueSource.AUTO,
            order=1,
            auto_source_key="equipment.tag"
        )
        assert auto_field.value_source == ValueSource.AUTO
        assert auto_field.auto_source_key == "equipment.tag"
    
    def test_template_field_configuration(self):
        """Test field configuration options"""
        field = TemplateField(
            subsection_id=1,
            label="Configured Field",
            field_type=FieldType.SELECT,
            value_source=ValueSource.MANUAL,
            order=1,
            options='["Option 1", "Option 2", "Option 3"]',
            is_required=True,
            placeholder="Select an option",
            purpose="rbi.material"
        )
        
        assert field.options == '["Option 1", "Option 2", "Option 3"]'
        assert field.is_required is True
        assert field.placeholder == "Select an option"
        assert field.purpose == "rbi.material"
    
    def test_template_field_default_configuration(self):
        """Test default configuration values"""
        field = TemplateField(
            subsection_id=1,
            label="Default Config",
            field_type=FieldType.TEXT,
            value_source=ValueSource.MANUAL,
            order=1
        )
        
        assert field.options is None
        assert field.is_required is False
        assert field.placeholder is None
        assert field.auto_source_key is None
        assert field.purpose is None
    
    def test_template_field_ordering(self):
        """Test field ordering functionality"""
        fields = []
        
        # Create fields with different orders
        for i in range(3):
            field = TemplateField(
                subsection_id=1,
                label=f"Field {i + 1}",
                field_type=FieldType.TEXT,
                value_source=ValueSource.MANUAL,
                order=i + 1
            )
            fields.append(field)
        
        # Verify ordering
        assert fields[0].order == 1
        assert fields[1].order == 2
        assert fields[2].order == 3
        
        # Sort by order
        sorted_fields = sorted(fields, key=lambda x: x.order)
        assert sorted_fields[0].label == "Field 1"
        assert sorted_fields[1].label == "Field 2"
        assert sorted_fields[2].label == "Field 3"
    
    def test_template_field_foreign_key(self):
        """Test foreign key relationship to subsection"""
        field = TemplateField(
            subsection_id=789,
            label="FK Test Field",
            field_type=FieldType.TEXT,
            value_source=ValueSource.MANUAL,
            order=1
        )
        
        assert field.subsection_id == 789
    
    def test_template_field_options_parsing(self):
        """Test JSON options parsing for select fields"""
        # Test valid JSON options
        options_data = ["Option A", "Option B", "Option C"]
        field = TemplateField(
            subsection_id=1,
            label="Select Field",
            field_type=FieldType.SELECT,
            value_source=ValueSource.MANUAL,
            order=1,
            options=json.dumps(options_data)
        )
        
        # Parse options back
        parsed_options = json.loads(field.options)
        assert parsed_options == options_data
        assert len(parsed_options) == 3
        assert "Option A" in parsed_options
    
    def test_template_field_auto_source_validation(self):
        """Test auto-source key validation"""
        # Valid auto-source keys (based on design document)
        valid_sources = [
            "inspection.start_date",
            "inspection.end_date", 
            "inspection.status",
            "inspection.number",
            "equipment.tag",
            "equipment.name",
            "equipment.location",
            "daily_report.inspectors",
            "report.serial_number",
            "user.full_name",
            "user.department",
            "current.date",
            "current.time"
        ]
        
        for source_key in valid_sources:
            field = TemplateField(
                subsection_id=1,
                label=f"Auto Field for {source_key}",
                field_type=FieldType.TEXT,
                value_source=ValueSource.AUTO,
                order=1,
                auto_source_key=source_key
            )
            assert field.auto_source_key == source_key
            assert field.value_source == ValueSource.AUTO
    
    def test_template_field_purpose_for_rbi(self):
        """Test purpose field for RBI analysis"""
        # Valid RBI purposes (based on design document)
        rbi_purposes = [
            "rbi.thickness",
            "rbi.corrosion_rate",
            "rbi.material",
            "rbi.pressure",
            "rbi.temperature",
            "rbi.inspection_date",
            "rbi.damage_mechanism"
        ]
        
        for purpose in rbi_purposes:
            field = TemplateField(
                subsection_id=1,
                label=f"RBI Field for {purpose}",
                field_type=FieldType.NUMBER,
                value_source=ValueSource.MANUAL,
                order=1,
                purpose=purpose
            )
            assert field.purpose == purpose
    
    def test_template_field_complex_configuration(self):
        """Test complex field configuration with all options"""
        field = TemplateField(
            subsection_id=1,
            label="Complex Field",
            field_type=FieldType.SELECT,
            value_source=ValueSource.AUTO,
            order=1,
            row=1,
            col=2,
            rowspan=1,
            colspan=2,
            options='["Auto Option 1", "Auto Option 2"]',
            is_required=True,
            placeholder="Auto-filled from system",
            auto_source_key="equipment.tag",
            purpose="rbi.material"
        )
        
        # Verify all properties
        assert field.label == "Complex Field"
        assert field.field_type == FieldType.SELECT
        assert field.value_source == ValueSource.AUTO
        assert field.row == 1
        assert field.col == 2
        assert field.rowspan == 1
        assert field.colspan == 2
        assert field.options == '["Auto Option 1", "Auto Option 2"]'
        assert field.is_required is True
        assert field.placeholder == "Auto-filled from system"
        assert field.auto_source_key == "equipment.tag"
        assert field.purpose == "rbi.material"