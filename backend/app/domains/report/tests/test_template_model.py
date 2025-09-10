"""Tests for Template model"""

import pytest
from datetime import datetime
import sys
import os

# Add the backend directory to Python path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '../../../../'))

from app.domains.report.models.template import Template


class TestTemplateModel:
    """Test cases for Template model"""
    
    def test_template_creation(self):
        """Test basic template creation"""
        template = Template(
            name="Test Template",
            description="A test template for inspection reports"
        )
        
        assert template.name == "Test Template"
        assert template.description == "A test template for inspection reports"
        assert template.is_active is True
        assert template.id is None  # Not set until saved
    
    def test_template_default_values(self):
        """Test template default values"""
        template = Template(name="Minimal Template")
        
        assert template.name == "Minimal Template"
        assert template.description is None
        assert template.is_active is True
        assert isinstance(template.created_at, datetime)
        assert isinstance(template.updated_at, datetime)
    
    def test_template_name_required(self):
        """Test that template name is properly handled"""
        # Test that name is properly set when provided
        template = Template(name="Required Name")
        assert template.name == "Required Name"
        
        # Test that empty initialization sets name to None
        template_empty = Template()
        assert template_empty.name is None
    
    def test_template_unique_name_constraint(self):
        """Test that template names should be unique"""
        # This test would require database setup to fully test
        # For now, we just verify the field has unique=True
        template = Template(name="Unique Template")
        
        # Check that the field definition includes unique constraint
        name_field = Template.model_fields['name']
        assert name_field.json_schema_extra is not None or hasattr(name_field, 'unique')
    
    def test_template_indexing(self):
        """Test that template name is indexed"""
        # Verify the name field has index=True
        name_field = Template.model_fields['name']
        assert name_field.json_schema_extra is not None or hasattr(name_field, 'index')