"""Tests for TemplateSection model"""

import pytest
import sys
import os

# Add the backend directory to Python path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '../../../../'))

from app.domains.report.models.template_section import TemplateSection
from app.domains.report.models.enums import SectionType


class TestTemplateSectionModel:
    """Test cases for TemplateSection model"""
    
    def test_template_section_creation(self):
        """Test basic template section creation"""
        section = TemplateSection(
            template_id=1,
            title="Header Section",
            section_type=SectionType.HEADER,
            order=1
        )
        
        assert section.template_id == 1
        assert section.title == "Header Section"
        assert section.section_type == SectionType.HEADER
        assert section.order == 1
        assert section.id is None  # Not set until saved
    
    def test_template_section_enum_validation(self):
        """Test section type enum validation"""
        # Test all valid section types
        valid_types = [
            SectionType.HEADER,
            SectionType.BODY,
            SectionType.FOOTER,
            SectionType.ATTACHMENTS,
            SectionType.CUSTOM
        ]
        
        for section_type in valid_types:
            section = TemplateSection(
                template_id=1,
                title=f"{section_type.value} Section",
                section_type=section_type,
                order=1
            )
            assert section.section_type == section_type
    
    def test_template_section_ordering(self):
        """Test section ordering functionality"""
        sections = []
        
        # Create sections with different orders
        for i, section_type in enumerate([SectionType.HEADER, SectionType.BODY, SectionType.FOOTER]):
            section = TemplateSection(
                template_id=1,
                title=f"{section_type.value} Section",
                section_type=section_type,
                order=i + 1
            )
            sections.append(section)
        
        # Verify ordering
        assert sections[0].order == 1
        assert sections[1].order == 2
        assert sections[2].order == 3
        
        # Sort by order
        sorted_sections = sorted(sections, key=lambda x: x.order)
        assert sorted_sections[0].section_type == SectionType.HEADER
        assert sorted_sections[1].section_type == SectionType.BODY
        assert sorted_sections[2].section_type == SectionType.FOOTER
    
    def test_template_section_foreign_key(self):
        """Test foreign key relationship to template"""
        section = TemplateSection(
            template_id=123,
            title="Test Section",
            section_type=SectionType.BODY,
            order=1
        )
        
        assert section.template_id == 123
    
    def test_template_section_required_fields(self):
        """Test that required fields are properly handled"""
        # Test with all required fields
        section = TemplateSection(
            template_id=1,
            title="Required Fields Test",
            section_type=SectionType.CUSTOM,
            order=5
        )
        
        assert section.template_id == 1
        assert section.title == "Required Fields Test"
        assert section.section_type == SectionType.CUSTOM
        assert section.order == 5