"""Tests for equipment data service"""

import pytest
from datetime import datetime
from app.domains.rbi.services.equipment_data_service import (
    EquipmentDataService,
    OperatingConditions,
    DesignParameters
)
from app.domains.rbi.models.core import (
    EquipmentData,
    EquipmentType,
    ServiceType
)


class TestOperatingConditions:
    """Test OperatingConditions class"""
    
    def test_operating_conditions_creation(self):
        """Test creating operating conditions"""
        conditions = OperatingConditions(
            operating_pressure=20.0,
            operating_temperature=100.0,
            flow_rate=500.0,
            ph_level=7.0
        )
        
        assert conditions.operating_pressure == 20.0
        assert conditions.operating_temperature == 100.0
        assert conditions.flow_rate == 500.0
        assert conditions.ph_level == 7.0
    
    def test_operating_conditions_to_dict(self):
        """Test converting operating conditions to dictionary"""
        conditions = OperatingConditions(
            operating_pressure=15.0,
            operating_temperature=80.0,
            h2s_content=1000.0
        )
        
        result = conditions.to_dict()
        
        assert result["operating_pressure"] == 15.0
        assert result["operating_temperature"] == 80.0
        assert result["h2s_content"] == 1000.0
        assert result["flow_rate"] is None


class TestDesignParameters:
    """Test DesignParameters class"""
    
    def test_design_parameters_creation(self):
        """Test creating design parameters"""
        parameters = DesignParameters(
            design_pressure=25.0,
            design_temperature=150.0,
            material="CS",
            wall_thickness=10.0,
            diameter=2.0,
            design_code="ASME VIII"
        )
        
        assert parameters.design_pressure == 25.0
        assert parameters.material == "CS"
        assert parameters.wall_thickness == 10.0
        assert parameters.design_code == "ASME VIII"
    
    def test_design_parameters_to_dict(self):
        """Test converting design parameters to dictionary"""
        parameters = DesignParameters(
            design_pressure=20.0,
            design_temperature=120.0,
            material="SS316",
            wall_thickness=8.0
        )
        
        result = parameters.to_dict()
        
        assert result["design_pressure"] == 20.0
        assert result["material"] == "SS316"
        assert result["wall_thickness"] == 8.0
        assert result["diameter"] is None


class TestEquipmentDataService:
    """Test EquipmentDataService"""
    
    def setup_method(self):
        """Setup test fixtures"""
        self.service = EquipmentDataService()
    
    def test_get_equipment_master_data(self):
        """Test getting equipment master data"""
        # Should have sample data
        equipment = self.service.get_equipment_master_data("V-101")
        
        assert equipment is not None
        assert equipment.equipment_id == "V-101"
        assert equipment.equipment_type == EquipmentType.PRESSURE_VESSEL
        assert equipment.service_type == ServiceType.SOUR_GAS
    
    def test_get_nonexistent_equipment(self):
        """Test getting non-existent equipment"""
        equipment = self.service.get_equipment_master_data("NON-EXISTENT")
        assert equipment is None
    
    def test_get_operating_conditions(self):
        """Test getting operating conditions"""
        conditions = self.service.get_operating_conditions("V-101")
        
        assert conditions is not None
        assert conditions.operating_pressure == 22.0
        assert conditions.operating_temperature == 140.0
        assert conditions.h2s_content == 5000.0
    
    def test_get_design_parameters(self):
        """Test getting design parameters"""
        parameters = self.service.get_design_parameters("V-101")
        
        assert parameters is not None
        assert parameters.design_pressure == 25.0
        assert parameters.material == "CS"
        assert parameters.wall_thickness == 12.0
    
    def test_add_equipment(self):
        """Test adding new equipment"""
        new_equipment = EquipmentData(
            equipment_id="T-401",
            equipment_type=EquipmentType.TANK,
            service_type=ServiceType.WATER,
            installation_date=datetime(2020, 1, 1),
            design_pressure=5.0,
            design_temperature=50.0,
            material="CS",
            criticality_level="Low"
        )
        
        self.service.add_equipment(new_equipment)
        
        # Verify it was added
        retrieved = self.service.get_equipment_master_data("T-401")
        assert retrieved is not None
        assert retrieved.equipment_id == "T-401"
        assert retrieved.equipment_type == EquipmentType.TANK
    
    def test_add_operating_conditions(self):
        """Test adding operating conditions"""
        conditions = OperatingConditions(
            operating_pressure=10.0,
            operating_temperature=60.0
        )
        
        self.service.add_operating_conditions("TEST-001", conditions)
        
        # Verify it was added
        retrieved = self.service.get_operating_conditions("TEST-001")
        assert retrieved is not None
        assert retrieved.operating_pressure == 10.0
    
    def test_add_design_parameters(self):
        """Test adding design parameters"""
        parameters = DesignParameters(
            design_pressure=15.0,
            design_temperature=100.0,
            material="SS304",
            wall_thickness=6.0
        )
        
        self.service.add_design_parameters("TEST-002", parameters)
        
        # Verify it was added
        retrieved = self.service.get_design_parameters("TEST-002")
        assert retrieved is not None
        assert retrieved.material == "SS304"
    
    def test_get_equipment_list(self):
        """Test getting equipment list"""
        # Get all equipment
        all_equipment = self.service.get_equipment_list()
        assert len(all_equipment) >= 3  # Should have sample data
        assert "V-101" in all_equipment
        assert "E-201" in all_equipment
        assert "P-301" in all_equipment
        
        # Get by equipment type
        vessels = self.service.get_equipment_list(EquipmentType.PRESSURE_VESSEL)
        assert "V-101" in vessels
        assert "E-201" not in vessels  # Heat exchanger
    
    def test_get_equipment_by_service(self):
        """Test getting equipment by service type"""
        sour_gas_equipment = self.service.get_equipment_by_service(ServiceType.SOUR_GAS)
        assert "V-101" in sour_gas_equipment
        
        sweet_gas_equipment = self.service.get_equipment_by_service(ServiceType.SWEET_GAS)
        assert "E-201" in sweet_gas_equipment
    
    def test_get_equipment_summary(self):
        """Test getting comprehensive equipment summary"""
        summary = self.service.get_equipment_summary("V-101")
        
        assert summary is not None
        assert summary["equipment_id"] == "V-101"
        assert summary["equipment_type"] == "pressure_vessel"
        assert summary["service_type"] == "sour_gas"
        assert summary["criticality_level"] == "High"
        assert "operating_conditions" in summary
        assert "design_parameters" in summary
        assert summary["operating_conditions"] is not None
        assert summary["design_parameters"] is not None
    
    def test_get_summary_nonexistent_equipment(self):
        """Test getting summary for non-existent equipment"""
        summary = self.service.get_equipment_summary("NON-EXISTENT")
        assert summary is None
    
    def test_validate_equipment_data(self):
        """Test equipment data validation"""
        # Valid equipment should pass validation
        validation = self.service.validate_equipment_data("V-101")
        
        assert "missing_master_data" in validation
        assert "missing_operating_conditions" in validation
        assert "missing_design_parameters" in validation
        assert "data_quality_issues" in validation
        
        # Should have no missing data for V-101
        assert len(validation["missing_master_data"]) == 0
        assert len(validation["missing_operating_conditions"]) == 0
        assert len(validation["missing_design_parameters"]) == 0
    
    def test_validate_nonexistent_equipment(self):
        """Test validation of non-existent equipment"""
        validation = self.service.validate_equipment_data("NON-EXISTENT")
        
        assert len(validation["missing_master_data"]) > 0
        assert "Equipment master data not found" in validation["missing_master_data"]
    
    def test_validate_equipment_with_missing_data(self):
        """Test validation of equipment with missing data"""
        # Add equipment without operating conditions
        new_equipment = EquipmentData(
            equipment_id="INCOMPLETE-001",
            equipment_type=EquipmentType.PUMP,
            service_type=ServiceType.WATER,
            installation_date=datetime(2020, 1, 1),
            design_pressure=5.0,
            design_temperature=50.0,
            material="CS"
        )
        
        self.service.add_equipment(new_equipment)
        
        validation = self.service.validate_equipment_data("INCOMPLETE-001")
        
        assert len(validation["missing_operating_conditions"]) > 0
        assert len(validation["missing_design_parameters"]) > 0
    
    def test_get_equipment_statistics(self):
        """Test getting equipment statistics"""
        stats = self.service.get_equipment_statistics()
        
        assert "total_equipment" in stats
        assert "equipment_by_type" in stats
        assert "equipment_by_service" in stats
        assert "equipment_by_criticality" in stats
        assert "age_distribution" in stats
        assert "data_completeness" in stats
        
        # Should have at least 3 equipment from sample data
        assert stats["total_equipment"] >= 3
        
        # Check structure
        assert "pressure_vessel" in stats["equipment_by_type"]
        assert "sour_gas" in stats["equipment_by_service"]
        assert "High" in stats["equipment_by_criticality"]
    
    def test_search_equipment(self):
        """Test equipment search functionality"""
        # Search by equipment type
        vessels = self.service.search_equipment({
            "equipment_type": EquipmentType.PRESSURE_VESSEL
        })
        assert "V-101" in vessels
        
        # Search by service type
        sour_gas = self.service.search_equipment({
            "service_type": ServiceType.SOUR_GAS
        })
        assert "V-101" in sour_gas
        
        # Search by criticality
        high_criticality = self.service.search_equipment({
            "criticality_level": "High"
        })
        assert "V-101" in high_criticality
        
        # Search by age range
        old_equipment = self.service.search_equipment({
            "min_age": 10
        })
        assert "V-101" in old_equipment  # Should be > 10 years old
        
        # Search by location
        open_area = self.service.search_equipment({
            "location": "open_area"
        })
        assert "V-101" in open_area
        assert "P-301" in open_area
        
        # Complex search
        complex_search = self.service.search_equipment({
            "equipment_type": EquipmentType.PRESSURE_VESSEL,
            "service_type": ServiceType.SOUR_GAS,
            "criticality_level": "High"
        })
        assert "V-101" in complex_search
        assert len(complex_search) == 1  # Should be specific
    
    def test_search_no_results(self):
        """Test search with no matching results"""
        results = self.service.search_equipment({
            "equipment_type": EquipmentType.COMPRESSOR  # Not in sample data
        })
        assert len(results) == 0
    
    def test_data_consistency_validation(self):
        """Test data consistency validation"""
        # Add equipment with inconsistent data
        inconsistent_equipment = EquipmentData(
            equipment_id="INCONSISTENT-001",
            equipment_type=EquipmentType.TANK,
            service_type=ServiceType.WATER,
            installation_date=datetime(2020, 1, 1),
            design_pressure=10.0,
            design_temperature=100.0,
            material="CS"
        )
        
        # Operating pressure exceeds design pressure
        bad_conditions = OperatingConditions(
            operating_pressure=15.0,  # Higher than design (10.0)
            operating_temperature=200.0  # Much higher than design (100.0)
        )
        
        bad_parameters = DesignParameters(
            design_pressure=10.0,
            design_temperature=100.0,
            material="CS",
            wall_thickness=5.0
        )
        
        self.service.add_equipment(inconsistent_equipment)
        self.service.add_operating_conditions("INCONSISTENT-001", bad_conditions)
        self.service.add_design_parameters("INCONSISTENT-001", bad_parameters)
        
        validation = self.service.validate_equipment_data("INCONSISTENT-001")
        
        # Should detect consistency issues
        assert len(validation["data_quality_issues"]) > 0
        issues = validation["data_quality_issues"]
        assert any("exceeds design pressure" in issue for issue in issues)
        assert any("exceeds design temperature" in issue for issue in issues)