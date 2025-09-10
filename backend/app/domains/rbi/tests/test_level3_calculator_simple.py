"""Simple tests for Level 3 RBI calculator"""

import pytest
from datetime import datetime, timedelta
from app.domains.rbi.services.level3_calculator import Level3Calculator
from app.domains.rbi.models.core import (
    EquipmentData,
    ExtractedRBIData,
    ThicknessMeasurement,
    InspectionFinding,
    EquipmentType,
    ServiceType,
    RiskLevel,
    RBILevel
)


class TestLevel3CalculatorSimple:
    """Simple test Level3Calculator"""
    
    def setup_method(self):
        """Setup test fixtures"""
        self.calculator = Level3Calculator()
    
    def create_sample_equipment(self) -> EquipmentData:
        """Create sample equipment data"""
        return EquipmentData(
            equipment_id="V-301",
            equipment_type=EquipmentType.PRESSURE_VESSEL,
            service_type=ServiceType.SOUR_GAS,
            installation_date=datetime(2010, 1, 1),
            design_pressure=50.0,
            design_temperature=200.0,
            material="CS",
            criticality_level="Critical",
            coating_type="Epoxy",
            location="open_area",
            inventory_size=100.0
        )
    
    def create_sample_extracted_data(self) -> ExtractedRBIData:
        """Create sample extracted RBI data"""
        thickness_measurements = [
            ThicknessMeasurement(
                location="Shell_Top", thickness=13.2, measurement_date=datetime.now() - timedelta(days=30),
                minimum_required=10.0, measurement_method="UT", inspector="Inspector A"
            ),
            ThicknessMeasurement(
                location="Shell_Middle", thickness=12.8, measurement_date=datetime.now() - timedelta(days=30),
                minimum_required=10.0, measurement_method="UT", inspector="Inspector A"
            ),
            ThicknessMeasurement(
                location="Shell_Bottom", thickness=12.1, measurement_date=datetime.now() - timedelta(days=30),
                minimum_required=10.0, measurement_method="UT", inspector="Inspector A"
            )
        ]
        
        inspection_findings = [
            InspectionFinding(
                finding_type="General Corrosion", severity="Medium",
                description="Uniform corrosion observed", location="Shell_External",
                recommendation="Monitor trend", finding_date=datetime.now() - timedelta(days=30)
            )
        ]
        
        return ExtractedRBIData(
            equipment_id="V-301",
            thickness_measurements=thickness_measurements,
            corrosion_rate=0.2,
            coating_condition="excellent",
            damage_mechanisms=["General Corrosion", "Pitting"],
            inspection_findings=inspection_findings,
            last_inspection_date=datetime.now() - timedelta(days=30),
            inspection_quality="good"
        )
    
    def test_calculate_basic(self):
        """Test basic Level 3 calculation"""
        equipment = self.create_sample_equipment()
        extracted_data = self.create_sample_extracted_data()
        
        result = self.calculator.calculate(equipment, extracted_data)
        
        assert result.equipment_id == "V-301"
        assert result.calculation_level == RBILevel.LEVEL_3
        assert result.requested_level == RBILevel.LEVEL_3
        assert result.fallback_occurred is False
        assert result.risk_level in [RiskLevel.LOW, RiskLevel.MEDIUM, RiskLevel.HIGH, RiskLevel.VERY_HIGH]
        assert 0.0 <= result.pof_score <= 5.0
        assert "safety" in result.cof_scores
        assert "environmental" in result.cof_scores
        assert "economic" in result.cof_scores
        assert "business" in result.cof_scores
        assert result.confidence_score > 0.8  # Should be highest for Level 3
        assert result.inspection_interval_months > 0
        assert "remaining_life_years" in result.input_parameters
    
    def test_advanced_pof_calculation(self):
        """Test advanced PoF calculation"""
        equipment = self.create_sample_equipment()
        extracted_data = self.create_sample_extracted_data()
        
        pof_probability = self.calculator._calculate_advanced_pof(equipment, extracted_data)
        
        assert 0.0 <= pof_probability <= 1.0
        assert isinstance(pof_probability, float)
    
    def test_detailed_cof_calculation(self):
        """Test detailed CoF calculation"""
        equipment = self.create_sample_equipment()
        extracted_data = self.create_sample_extracted_data()
        
        cof_scores = self.calculator._calculate_detailed_cof(equipment, extracted_data)
        
        assert "safety" in cof_scores
        assert "environmental" in cof_scores
        assert "economic" in cof_scores
        assert "business" in cof_scores
        
        for dimension, score in cof_scores.items():
            assert 1.0 <= score <= 5.0, f"{dimension} score {score} out of bounds"
    
    def test_remaining_life_calculation(self):
        """Test remaining life calculation"""
        equipment = self.create_sample_equipment()
        extracted_data = self.create_sample_extracted_data()
        
        remaining_life = self.calculator._calculate_remaining_life(equipment, extracted_data)
        
        assert remaining_life is not None
        assert remaining_life > 0.0
        assert isinstance(remaining_life, float)
        
        # Test with no corrosion rate
        from dataclasses import replace
        no_corr_data = replace(extracted_data, corrosion_rate=None)
        
        no_life = self.calculator._calculate_remaining_life(equipment, no_corr_data)
        assert no_life is None
    
    def test_quantitative_risk_determination(self):
        """Test quantitative risk determination"""
        pof_probability = 0.005  # 0.5% annual probability
        cof_scores = {"safety": 3.0, "environmental": 2.5, "economic": 4.0, "business": 3.5}
        
        risk_level = self.calculator._determine_quantitative_risk(pof_probability, cof_scores)
        
        assert risk_level in [RiskLevel.LOW, RiskLevel.MEDIUM, RiskLevel.HIGH, RiskLevel.VERY_HIGH]
    
    def test_optimal_interval_calculation(self):
        """Test optimal inspection interval calculation"""
        pof_probability = 0.002
        remaining_life_years = 15.0
        risk_level = RiskLevel.MEDIUM
        
        interval = self.calculator._calculate_optimal_interval(pof_probability, remaining_life_years, risk_level)
        
        assert 3 <= interval <= 60  # Within reasonable bounds
        assert isinstance(interval, int)
        
        # Test with short remaining life
        short_interval = self.calculator._calculate_optimal_interval(0.002, 1.5, risk_level)
        assert short_interval <= interval  # Should be shorter
    
    def test_advanced_confidence_calculation(self):
        """Test advanced confidence calculation"""
        equipment = self.create_sample_equipment()
        extracted_data = self.create_sample_extracted_data()
        
        confidence = self.calculator._calculate_advanced_confidence(equipment, extracted_data)
        
        assert 0.0 <= confidence <= 1.0
        assert confidence > 0.8  # Should be high for comprehensive data
    
    def test_advanced_data_quality_calculation(self):
        """Test advanced data quality calculation"""
        extracted_data = self.create_sample_extracted_data()
        
        quality = self.calculator._calculate_advanced_data_quality(extracted_data)
        
        assert 0.0 <= quality <= 1.0
        assert quality > 0.7  # Should be high for comprehensive data
    
    def test_validation_comprehensive_data(self):
        """Test validation with comprehensive data"""
        equipment = self.create_sample_equipment()
        extracted_data = self.create_sample_extracted_data()
        
        validation = self.calculator.validate_input_data(equipment, extracted_data)
        
        # Should have minimal issues with comprehensive data
        assert len(validation["missing_required"]) == 0
        assert len(validation["data_quality_issues"]) == 0
    
    def test_validation_insufficient_data(self):
        """Test validation with insufficient data for Level 3"""
        equipment = self.create_sample_equipment()
        
        # Insufficient data for Level 3
        insufficient_data = ExtractedRBIData(
            equipment_id="V-301",
            thickness_measurements=[],  # No thickness measurements
            corrosion_rate=None,  # No corrosion rate
            coating_condition=None,
            damage_mechanisms=[],
            inspection_findings=[],
            last_inspection_date=None,  # No inspection date
            inspection_quality="poor"
        )
        
        validation = self.calculator.validate_input_data(equipment, insufficient_data)
        
        assert "corrosion_rate" in validation["missing_required"]
        assert "thickness_measurements" in validation["missing_required"]
    
    def test_calculation_summary(self):
        """Test Level 3 calculation summary"""
        summary = self.calculator.get_calculation_summary()
        
        assert summary["level"] == "Level 3 - Fully Quantitative"
        assert "data_requirements" in summary
        assert "methodology" in summary
        assert "confidence_level" in summary
        assert "typical_use_cases" in summary
        assert "advantages" in summary
        assert "limitations" in summary
        
        # Check methodology details
        methodology = summary["methodology"]
        assert "pof_calculation" in methodology
        assert "cof_calculation" in methodology
        assert "risk_determination" in methodology
        assert "interval_calculation" in methodology
        assert "remaining_life" in methodology
    
    def test_sensitivity_analysis(self):
        """Test sensitivity analysis"""
        equipment = self.create_sample_equipment()
        extracted_data = self.create_sample_extracted_data()
        
        sensitivity = self.calculator.calculate_sensitivity_analysis(equipment, extracted_data)
        
        assert "base_case" in sensitivity
        assert "sensitivity_analysis" in sensitivity
        
        base_case = sensitivity["base_case"]
        assert "pof_score" in base_case
        assert "risk_level" in base_case
        assert "interval_months" in base_case