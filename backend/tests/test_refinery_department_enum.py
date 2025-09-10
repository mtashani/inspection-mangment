import pytest
from app.domains.inspection.models.enums import RefineryDepartment

class TestRefineryDepartment:
    """Test cases for RefineryDepartment enum"""
    
    def test_refinery_department_values(self):
        """Test RefineryDepartment enum values"""
        assert RefineryDepartment.Operations == "Operations"
        assert RefineryDepartment.Inspection == "Inspection"
        assert RefineryDepartment.Maintenance == "Maintenance"
        assert RefineryDepartment.Engineering == "Engineering"
        assert RefineryDepartment.Safety == "Safety"
        assert RefineryDepartment.QualityControl == "QualityControl"
        assert RefineryDepartment.ProcessEngineering == "ProcessEngineering"
        assert RefineryDepartment.Instrumentation == "Instrumentation"
        assert RefineryDepartment.Electrical == "Electrical"
        assert RefineryDepartment.Mechanical == "Mechanical"
    
    def test_refinery_department_enum_membership(self):
        """Test that all expected departments are in the enum"""
        expected_departments = {
            "Operations", "Inspection", "Maintenance", "Engineering", 
            "Safety", "QualityControl", "ProcessEngineering", 
            "Instrumentation", "Electrical", "Mechanical"
        }
        
        actual_departments = {dept.value for dept in RefineryDepartment}
        assert actual_departments == expected_departments
    
    def test_refinery_department_string_representation(self):
        """Test string representation of enum values"""
        assert str(RefineryDepartment.Operations) == "Operations"
        assert str(RefineryDepartment.Maintenance) == "Maintenance"
        assert str(RefineryDepartment.Safety) == "Safety"
    
    def test_refinery_department_iteration(self):
        """Test that we can iterate over all departments"""
        departments = list(RefineryDepartment)
        assert len(departments) == 10
        assert RefineryDepartment.Operations in departments
        assert RefineryDepartment.Inspection in departments
        assert RefineryDepartment.Maintenance in departments