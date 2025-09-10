"""Tests for TemplateSubSection model"""

import pytest
import sys
import os

# Add the backend directory to Python path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '../../../../'))

from app.domains.report.models.template_subsection import TemplateSubSection


class TestTemplateSubSectionModel:
    """Test cases for TemplateSubSection model"""
    
    def test_template_subsection_creation(self):
        """Test basic template subsection creation"""
        subsection = TemplateSubSection(
            section_id=1,
            title="General Information",
            order=1
        )
        
        assert subsection.section_id == 1
        assert subsection.title == "General Information"
        assert subsection.order == 1
        assert subsection.id is None  # Not set until saved
    
    def test_template_subsection_optional_title(self):
        """Test subsection with optional title"""
        subsection = TemplateSubSection(
            section_id=2,
            order=1
        )
        
        assert subsection.section_id == 2
        assert subsection.title is None
        assert subsection.order == 1
    
    def test_template_subsection_ordering(self):
        """Test subsection ordering functionality"""
        subsections = []
        
        # Create subsections with different orders
        for i in range(3):
            subsection = TemplateSubSection(
                section_id=1,
                title=f"Subsection {i + 1}",
                order=i + 1
            )
            subsections.append(subsection)
        
        # Verify ordering
        assert subsections[0].order == 1
        assert subsections[1].order == 2
        assert subsections[2].order == 3
        
        # Sort by order
        sorted_subsections = sorted(subsections, key=lambda x: x.order)
        assert sorted_subsections[0].title == "Subsection 1"
        assert sorted_subsections[1].title == "Subsection 2"
        assert sorted_subsections[2].title == "Subsection 3"
    
    def test_template_subsection_foreign_key(self):
        """Test foreign key relationship to section"""
        subsection = TemplateSubSection(
            section_id=456,
            title="Test Subsection",
            order=1
        )
        
        assert subsection.section_id == 456
    
    def test_template_subsection_hierarchy(self):
        """Test subsection hierarchy within sections"""
        # Create multiple subsections for the same section
        subsections = []
        section_id = 10
        
        subsection_data = [
            ("Equipment Details", 1),
            ("Inspection Results", 2),
            ("Recommendations", 3)
        ]
        
        for title, order in subsection_data:
            subsection = TemplateSubSection(
                section_id=section_id,
                title=title,
                order=order
            )
            subsections.append(subsection)
        
        # Verify all belong to same section
        for subsection in subsections:
            assert subsection.section_id == section_id
        
        # Verify proper ordering
        sorted_subsections = sorted(subsections, key=lambda x: x.order)
        assert sorted_subsections[0].title == "Equipment Details"
        assert sorted_subsections[1].title == "Inspection Results"
        assert sorted_subsections[2].title == "Recommendations"