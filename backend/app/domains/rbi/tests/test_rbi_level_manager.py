"""Tests for RBI Level Manager"""

import pytest
from datetime import datetime, timedelta
from app.domains.rbi.services.rbi_level_manager import RBILevelManager
from app.domains.rbi.models.core import (
    EquipmentData,
    ExtractedRBIData,
    ThicknessMeasurement,
    InspectionFinding,
    EquipmentType,
    ServiceType,
    RBILevel
)


class TestRBILevelManager:
    """Test RBILevelManager"""
    
    def setup_method(self):
        """Setup test fixtures"""
        self.manager = RBILevelManager()
    
    def create_comprehensive_equipment(self) -> EquipmentData:
        """Create comprehensive equipment data"""
        return EquipmentData(
            equipment_id="V-101",
            equipment_type=EquipmentType.PRESSURE_VESSEL,
            service_type=ServiceType.SOUR_GAS,
            installation_date=datetime(2015, 1, 1),
            design_pressure=25.0,
            design_temperature=150.0,
            material="CS",
            criticality_level="High",
            coating_type="Epoxy",
            location="open_area",
            inventory_size=50.0
        )
    
    def create_comprehensive_extracted_data(self) -> ExtractedRBIData:
        """Create comprehensive extracted data for Level 3"""
        thickness_measurements = [
            ThicknessMeasurement(
                location="Shell_Top", thickness=12.5, measurement_date=datetime.now() - timedelta(days=30),
                minimum_required=10.0, measurement_method="UT", inspector="Inspector A"
            ),
            ThicknessMeasurement(
                location="Shell_Middle", thickness=12.2, measurement_date=datetime.now() - timedelta(days=30),
                minimum_required=10.0, measurement_method="UT", inspector="Inspector A"
            ),
            ThicknessMeasurement(
                location="Shell_Bottom", thickness=11.8, measurement_date=datetime.now() - timedelta(days=30),
                minimum_required=10.0, measurement_method="UT", inspector="Inspector A"
            ),
            ThicknessMeasurement(
                location="Head_Top", thickness=13.0, measurement_date=datetime.now() - timedelta(days=30),
                minimum_required=10.0, measurement_method="UT", inspector="Inspector A"
            ),
            ThicknessMeasurement(
                location="Head_Bottom", thickness=12.8, measurement_date=datetime.now() - timedelta(days=30),
                minimum_required=10.0, measurement_method="UT", inspector="Inspector A"
            )
        ]
        
        inspection_findings = [
            InspectionFinding(
                finding_type="General Corrosion", severity="Medium",
                description="Uniform corrosion observed", location="Shell_External",
                recommendation="Monitor", finding_date=datetime.now() - timedelta(days=30)
            )
        ]
        
        return ExtractedRBIData(
            equipment_id="V-101",
            thickness_measurements=thickness_measurements,
            corrosion_rate=0.15,
            coating_condition="moderate",
            damage_mechanisms=["General Corrosion", "Pitting"],
            inspection_findings=inspection_findings,
            last_inspection_date=datetime.now() - timedelta(days=30),
            inspection_quality="good"
        )
    
    def create_minimal_equipment(self) -> EquipmentData:
        """Create minimal equipment data for Level 1"""
        return EquipmentData(
            equipment_id="T-201",
            equipment_type=EquipmentType.TANK,
            service_type=ServiceType.WATER,
            installation_date=datetime(2020, 1, 1),
            design_pressure=5.0,
            design_temperature=50.0,
            material="CS"
        )
    
    def create_minimal_extracted_data(self) -> ExtractedRBIData:
        """Create minimal extracted data"""
        return ExtractedRBIData(
            equipment_id="T-201",
            thickness_measurements=[],
            corrosion_rate=None,
            coating_condition=None,
            damage_mechanisms=[],
            inspection_findings=[],
            last_inspection_date=None,
            inspection_quality="poor"
        )
    
    def test_determine_level3_capable(self):
        """Test determination when Level 3 is capable"""
        equipment = self.create_comprehensive_equipment()
        extracted_data = self.create_comprehensive_extracted_data()
        
        level, fallback, reasons = self.manager.determine_calculation_level(
            equipment, extracted_data, RBILevel.LEVEL_3
        )
        
        assert level == RBILevel.LEVEL_3
        assert fallback is False
        assert len(reasons) == 0
    
    def test_determine_level3_fallback_to_level2(self):
        """Test fallback from Level 3 to Level 2"""
        equipment = self.create_comprehensive_equipment()
        extracted_data = self.create_comprehensive_extracted_data()
        
        # Remove corrosion rate to make Level 3 impossible
        from dataclasses import replace
        insufficient_data = replace(extracted_data, corrosion_rate=None)
        
        level, fallback, reasons = self.manager.determine_calculation_level(
            equipment, insufficient_data, RBILevel.LEVEL_3
        )
        
        assert level == RBILevel.LEVEL_2
        assert fallback is True
        assert "corrosion_rate" in reasons
    
    def test_determine_level2_capable(self):
        """Test determination when Level 2 is capable"""
        equipment = self.create_comprehensive_equipment()
        extracted_data = self.create_comprehensive_extracted_data()
        
        # Remove some Level 3 requirements but keep Level 2 capable
        from dataclasses import replace
        level2_data = replace(extracted_data, 
                             thickness_measurements=extracted_data.thickness_measurements[:2])  # Only 2 measurements
        
        level, fallback, reasons = self.manager.determine_calculation_level(
            equipment, level2_data, RBILevel.LEVEL_2
        )
        
        assert level == RBILevel.LEVEL_2
        assert fallback is False
        assert len(reasons) == 0
    
    def test_determine_level1_fallback(self):
        """Test fallback to Level 1"""
        equipment = self.create_minimal_equipment()
        extracted_data = self.create_minimal_extracted_data()
        
        level, fallback, reasons = self.manager.determine_calculation_level(
            equipment, extracted_data, RBILevel.LEVEL_3
        )
        
        assert level == RBILevel.LEVEL_1
        assert fallback is True
        assert len(reasons) > 0
    
    def test_optimal_level_determination(self):
        """Test optimal level determination without specific request"""
        equipment = self.create_comprehensive_equipment()
        extracted_data = self.create_comprehensive_extracted_data()
        
        level, fallback, reasons = self.manager.determine_calculation_level(
            equipment, extracted_data, None
        )
        
        assert level == RBILevel.LEVEL_3  # Should choose highest possible
        assert fallback is False
    
    def test_assess_level3_capability(self):
        """Test Level 3 capability assessment"""
        equipment = self.create_comprehensive_equipment()
        extracted_data = self.create_comprehensive_extracted_data()
        
        assessment = self.manager._assess_level3_capability(equipment, extracted_data)
        
        assert assessment["capable"] is True
        assert len(assessment["missing_requirements"]) == 0
        assert assessment["data_quality_score"] > 0.7
        assert len(assessment["confidence_factors"]) > 0
    
    def test_assess_level3_insufficient_data(self):
        """Test Level 3 assessment with insufficient data"""
        equipment = self.create_minimal_equipment()
        extracted_data = self.create_minimal_extracted_data()
        
        assessment = self.manager._assess_level3_capability(equipment, extracted_data)
        
        assert assessment["capable"] is False
        assert len(assessment["missing_requirements"]) > 0
        assert "corrosion_rate" in assessment["missing_requirements"]
        assert "thickness_measurements" in assessment["missing_requirements"]
    
    def test_assess_level2_capability(self):
        """Test Level 2 capability assessment"""
        equipment = self.create_comprehensive_equipment()
        extracted_data = self.create_comprehensive_extracted_data()
        
        assessment = self.manager._assess_level2_capability(equipment, extracted_data)
        
        assert assessment["capable"] is True
        assert len(assessment["missing_requirements"]) == 0
        assert assessment["data_quality_score"] > 0.5
    
    def test_assess_level1_capability(self):
        """Test Level 1 capability assessment"""
        equipment = self.create_minimal_equipment()
        extracted_data = self.create_minimal_extracted_data()
        
        assessment = self.manager._assess_level1_capability(equipment, extracted_data)
        
        assert assessment["capable"] is True  # Level 1 should almost always be capable
        assert len(assessment["missing_requirements"]) == 0
    
    def test_data_too_old_check(self):
        """Test data age checking"""
        # Recent data
        recent_date = datetime.now() - timedelta(days=100)
        assert self.manager._is_data_too_old(recent_date, 1.0) is False
        
        # Old data
        old_date = datetime.now() - timedelta(days=400)
        assert self.manager._is_data_too_old(old_date, 1.0) is True
    
    def test_level3_data_quality_calculation(self):
        """Test Level 3 data quality calculation"""
        extracted_data = self.create_comprehensive_extracted_data()
        
        quality = self.manager._calculate_level3_data_quality(extracted_data)
        
        assert 0.0 <= quality <= 1.0
        assert quality > 0.7  # Should be high for comprehensive data
    
    def test_level2_data_quality_calculation(self):
        """Test Level 2 data quality calculation"""
        extracted_data = self.create_comprehensive_extracted_data()
        
        quality = self.manager._calculate_level2_data_quality(extracted_data)
        
        assert 0.0 <= quality <= 1.0
        assert quality > 0.5  # Should be reasonable for available data
    
    def test_level1_data_quality_calculation(self):
        """Test Level 1 data quality calculation"""
        equipment = self.create_comprehensive_equipment()
        extracted_data = self.create_minimal_extracted_data()
        
        quality = self.manager._calculate_level1_data_quality(equipment, extracted_data)
        
        assert 0.0 <= quality <= 1.0
    
    def test_get_level_requirements(self):
        """Test getting level requirements"""
        # Level 3 requirements
        level3_req = self.manager.get_level_requirements(RBILevel.LEVEL_3)
        assert "required_equipment_data" in level3_req
        assert "required_inspection_data" in level3_req
        assert "recommended_data" in level3_req
        assert "corrosion_rate" in level3_req["required_inspection_data"]
        
        # Level 2 requirements
        level2_req = self.manager.get_level_requirements(RBILevel.LEVEL_2)
        assert len(level2_req["required_equipment_data"]) < len(level3_req["required_equipment_data"])
        
        # Level 1 requirements
        level1_req = self.manager.get_level_requirements(RBILevel.LEVEL_1)
        assert len(level1_req["required_equipment_data"]) < len(level2_req["required_equipment_data"])
        assert len(level1_req["required_inspection_data"]) == 0
    
    def test_get_level_capabilities(self):
        """Test getting level capabilities"""
        capabilities = self.manager.get_level_capabilities()
        
        assert RBILevel.LEVEL_1 in capabilities
        assert RBILevel.LEVEL_2 in capabilities
        assert RBILevel.LEVEL_3 in capabilities
        
        # Check Level 3 has highest confidence
        level3_conf = capabilities[RBILevel.LEVEL_3]["confidence_range"]
        level1_conf = capabilities[RBILevel.LEVEL_1]["confidence_range"]
        
        assert "0.8-0.95" in level3_conf
        assert "0.4-0.6" in level1_conf
    
    def test_validate_level_transition_possible(self):
        """Test level transition validation when possible"""
        equipment = self.create_comprehensive_equipment()
        extracted_data = self.create_comprehensive_extracted_data()
        
        validation = self.manager.validate_level_transition(
            RBILevel.LEVEL_1, RBILevel.LEVEL_3, equipment, extracted_data
        )
        
        assert validation["transition_possible"] is True
        assert len(validation["missing_requirements"]) == 0
        assert validation["data_quality_score"] > 0.7
        assert "transition" in validation["recommendations"][0].lower()
    
    def test_validate_level_transition_impossible(self):
        """Test level transition validation when not possible"""
        equipment = self.create_minimal_equipment()
        extracted_data = self.create_minimal_extracted_data()
        
        validation = self.manager.validate_level_transition(
            RBILevel.LEVEL_1, RBILevel.LEVEL_3, equipment, extracted_data
        )
        
        assert validation["transition_possible"] is False
        assert len(validation["missing_requirements"]) > 0
        assert "cannot transition" in validation["recommendations"][0].lower()
    
    def test_confidence_factors_level3(self):
        """Test confidence factors for Level 3"""
        equipment = self.create_comprehensive_equipment()
        extracted_data = self.create_comprehensive_extracted_data()
        
        factors = self.manager._get_level3_confidence_factors(equipment, extracted_data)
        
        assert len(factors) > 0
        assert any("corrosion rate" in factor.lower() for factor in factors)
        assert any("thickness" in factor.lower() for factor in factors)
    
    def test_confidence_factors_level2(self):
        """Test confidence factors for Level 2"""
        equipment = self.create_comprehensive_equipment()
        extracted_data = self.create_comprehensive_extracted_data()
        
        factors = self.manager._get_level2_confidence_factors(equipment, extracted_data)
        
        assert len(factors) > 0
        assert any("corrosion rate" in factor.lower() for factor in factors)
    
    def test_confidence_factors_level1(self):
        """Test confidence factors for Level 1"""
        equipment = self.create_comprehensive_equipment()
        extracted_data = self.create_minimal_extracted_data()
        
        factors = self.manager._get_level1_confidence_factors(equipment, extracted_data)
        
        assert len(factors) > 0
        assert any("master data" in factor.lower() for factor in factors)