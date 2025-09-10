"""Tests for Level 3 RBI calculator"""

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
from app.domains.rbi.models.config import RBIConfig


class TestLevel3Calculator:
    """Test Level3Calculator"""
    
    def setup_method(self):
        """Setup test fixtures"""
        self.calculator = Level3Calculator()
    
    def create_comprehensive_equipment(self) -> EquipmentData:
        """Create comprehensive equipment data for Level 3"""
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
    
    def create_comprehensive_extracted_data(self) -> ExtractedRBIData:
        """Create comprehensive extracted RBI data for Level 3"""
        # Multiple thickness measurements over time
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
            ),
            ThicknessMeasurement(
                location="Head_Top", thickness=13.5, measurement_date=datetime.now() - timedelta(days=30),
                minimum_required=10.0, measurement_method="UT", inspector="Inspector A"
            ),
            ThicknessMeasurement(
                location="Head_Bottom", thickness=12.9, measurement_date=datetime.now() - timedelta(days=30),
                minimum_required=10.0, measurement_method="UT", inspector="Inspector A"
            )
        ]
        
        # Detailed inspection findings
        inspection_findings = [
            InspectionFinding(
                finding_type="General Corrosion", severity="Medium",
                description="Uniform corrosion observed on external shell",
                location="Shell_External", recommendation="Monitor trend",
                finding_date=datetime.now() - timedelta(days=30)
            ),
            InspectionFinding(
                finding_type="Pitting", severity="Low",
                description="Minor pitting at weld seams",
                location="Weld_Seams", recommendation="Continue monitoring",
                finding_date=datetime.now() - timedelta(days=30)
            )
        ]
        
        return ExtractedRBIData(
            equipment_id="V-301",
            thickness_measurements=thickness_measurements,
            corrosion_rate=0.2,  # mm/year from thickness trend analysis
            coating_condition="excellent",
            damage_mechanisms=["General Corrosion", "Pitting"],
            inspection_findings=inspection_findings,
            last_inspection_date=datetime.now() - timedelta(days=30),
            inspection_quality="good"
        )    

    def test_calculate_basic(self):
        """Test basic Level 3 calculation"""
        equipment = self.create_comprehensive_equipment()
        extracted_data = self.create_comprehensive_extracted_data()
        
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
        assert result.remaining_life_years is not None
    
    def test_advanced_pof_calculation(self):
        """Test advanced PoF calculation"""
        equipment = self.create_comprehensive_equipment()
        extracted_data = self.create_comprehensive_extracted_data()
        
        pof_probability = self.calculator._calculate_advanced_pof(equipment, extracted_data)
        
        assert 0.0 <= pof_probability <= 1.0
        assert isinstance(pof_probability, float)
    
    def test_base_failure_rate(self):
        """Test base failure rate calculation"""
        equipment = self.create_comprehensive_equipment()
        
        base_rate = self.calculator._get_base_failure_rate(equipment)
        
        assert base_rate > 0.0
        assert base_rate < 0.1  # Should be reasonable failure rate
    
    def test_degradation_factor(self):
        """Test degradation factor calculation"""
        equipment = self.create_comprehensive_equipment()
        extracted_data = self.create_comprehensive_extracted_data()
        
        degradation_factor = self.calculator._calculate_degradation_factor(equipment, extracted_data)
        
        assert degradation_factor >= 1.0  # Should be 1.0 or higher
        assert isinstance(degradation_factor, float)
    
    def test_age_factor(self):
        """Test age factor calculation using Weibull distribution"""
        equipment = self.create_comprehensive_equipment()
        
        age_factor = self.calculator._calculate_age_factor(equipment)
        
        assert age_factor >= 1.0  # Should increase with age
        assert isinstance(age_factor, float)
    
    def test_inspection_effectiveness(self):
        """Test inspection effectiveness factor"""
        extracted_data = self.create_comprehensive_extracted_data()
        
        effectiveness = self.calculator._calculate_inspection_effectiveness(extracted_data)
        
        assert effectiveness > 0.0
        assert isinstance(effectiveness, float)
        
        # Test with poor inspection quality
        poor_data = extracted_data.model_copy()
        poor_data.inspection_quality = "poor"
        poor_effectiveness = self.calculator._calculate_inspection_effectiveness(poor_data)
        
        assert poor_effectiveness > effectiveness  # Poor inspection should increase PoF
    
    def test_damage_acceleration(self):
        """Test damage mechanism acceleration factor"""
        extracted_data = self.create_comprehensive_extracted_data()
        
        acceleration = self.calculator._calculate_damage_acceleration(extracted_data)
        
        assert acceleration >= 1.0
        assert isinstance(acceleration, float)
        
        # Test with more severe damage mechanisms
        severe_data = extracted_data.model_copy()
        severe_data.damage_mechanisms = ["Stress Corrosion Cracking", "Fatigue"]
        severe_acceleration = self.calculator._calculate_damage_acceleration(severe_data)
        
        assert severe_acceleration > acceleration
    
    def test_detailed_cof_calculation(self):
        """Test detailed CoF calculation"""
        equipment = self.create_comprehensive_equipment()
        extracted_data = self.create_comprehensive_extracted_data()
        
        cof_scores = self.calculator._calculate_detailed_cof(equipment, extracted_data)
        
        assert "safety" in cof_scores
        assert "environmental" in cof_scores
        assert "economic" in cof_scores
        assert "business" in cof_scores
        
        for dimension, score in cof_scores.items():
            assert 1.0 <= score <= 5.0, f"{dimension} score {score} out of bounds"
    
    def test_safety_cof(self):
        """Test safety consequence calculation"""
        equipment = self.create_comprehensive_equipment()
        
        safety_score = self.calculator._calculate_safety_cof(equipment)
        
        assert 1.0 <= safety_score <= 5.0
        
        # Test with high-hazard service
        high_hazard_equipment = equipment.model_copy()
        high_hazard_equipment.service_type = ServiceType.SOUR_GAS
        high_hazard_equipment.location = "near_sensitive"
        
        high_hazard_score = self.calculator._calculate_safety_cof(high_hazard_equipment)
        assert high_hazard_score >= safety_score
    
    def test_environmental_cof(self):
        """Test environmental consequence calculation"""
        equipment = self.create_comprehensive_equipment()
        
        env_score = self.calculator._calculate_environmental_cof(equipment)
        
        assert 1.0 <= env_score <= 5.0
        
        # Test with high environmental impact
        high_impact_equipment = equipment.model_copy()
        high_impact_equipment.service_type = ServiceType.CRUDE_OIL
        high_impact_equipment.inventory_size = 1000.0
        
        high_impact_score = self.calculator._calculate_environmental_cof(high_impact_equipment)
        assert high_impact_score >= env_score
    
    def test_economic_cof(self):
        """Test economic consequence calculation"""
        equipment = self.create_comprehensive_equipment()
        
        economic_score = self.calculator._calculate_economic_cof(equipment)
        
        assert 1.0 <= economic_score <= 5.0
        
        # Test with high-cost equipment
        expensive_equipment = equipment.model_copy()
        expensive_equipment.equipment_type = EquipmentType.COMPRESSOR
        expensive_equipment.criticality_level = "Critical"
        
        expensive_score = self.calculator._calculate_economic_cof(expensive_equipment)
        assert expensive_score >= economic_score
    
    def test_business_cof(self):
        """Test business consequence calculation"""
        equipment = self.create_comprehensive_equipment()
        
        business_score = self.calculator._calculate_business_cof(equipment)
        
        assert 1.0 <= business_score <= 5.0
    
    def test_remaining_life_calculation(self):
        """Test remaining life calculation"""
        equipment = self.create_comprehensive_equipment()
        extracted_data = self.create_comprehensive_extracted_data()
        
        remaining_life = self.calculator._calculate_remaining_life(equipment, extracted_data)
        
        assert remaining_life is not None
        assert remaining_life > 0.0
        assert isinstance(remaining_life, float)
        
        # Test with no corrosion rate
        no_corr_data = extracted_data.model_copy()
        no_corr_data.corrosion_rate = None
        
        no_life = self.calculator._calculate_remaining_life(equipment, no_corr_data)
        assert no_life is None
    
    def test_minimum_thickness_ratio(self):
        """Test minimum thickness ratio calculation"""
        extracted_data = self.create_comprehensive_extracted_data()
        
        min_ratio = self.calculator._get_minimum_thickness_ratio(extracted_data.thickness_measurements)
        
        assert min_ratio is not None
        assert min_ratio > 0.0
        
        # Should be the minimum ratio from all measurements
        expected_min = min([
            m.thickness / m.minimum_required 
            for m in extracted_data.thickness_measurements
        ])
        assert abs(min_ratio - expected_min) < 0.001
    
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
        equipment = self.create_comprehensive_equipment()
        extracted_data = self.create_comprehensive_extracted_data()
        
        confidence = self.calculator._calculate_advanced_confidence(equipment, extracted_data)
        
        assert 0.0 <= confidence <= 1.0
        assert confidence > 0.8  # Should be high for comprehensive data
    
    def test_advanced_data_quality_calculation(self):
        """Test advanced data quality calculation"""
        extracted_data = self.create_comprehensive_extracted_data()
        
        quality = self.calculator._calculate_advanced_data_quality(extracted_data)
        
        assert 0.0 <= quality <= 1.0
        assert quality > 0.7  # Should be high for comprehensive data
    
    def test_validation_comprehensive_data(self):
        """Test validation with comprehensive data"""
        equipment = self.create_comprehensive_equipment()
        extracted_data = self.create_comprehensive_extracted_data()
        
        validation = self.calculator.validate_input_data(equipment, extracted_data)
        
        # Should have minimal issues with comprehensive data
        assert len(validation["missing_required"]) == 0
        assert len(validation["data_quality_issues"]) == 0
    
    def test_validation_insufficient_data(self):
        """Test validation with insufficient data for Level 3"""
        equipment = self.create_comprehensive_equipment()
        
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
        assert "last_inspection_date" in validation["missing_required"]
    
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
        equipment = self.create_comprehensive_equipment()
        extracted_data = self.create_comprehensive_extracted_data()
        
        sensitivity = self.calculator.calculate_sensitivity_analysis(equipment, extracted_data)
        
        assert "base_case" in sensitivity
        assert "sensitivity_analysis" in sensitivity
        
        base_case = sensitivity["base_case"]
        assert "pof_score" in base_case
        assert "risk_level" in base_case
        assert "interval_months" in base_case
        
        analysis = sensitivity["sensitivity_analysis"]
        if "corrosion_rate" in analysis:
            corr_analysis = analysis["corrosion_rate"]
            assert len(corr_analysis) == 4  # Four test cases
            
        if "equipment_age" in analysis:
            age_analysis = analysis["equipment_age"]
            assert len(age_analysis) == 4  # Four test cases
    
    def test_high_risk_scenario(self):
        """Test Level 3 calculation with high-risk scenario"""
        # Very old, high-pressure equipment with severe degradation
        high_risk_equipment = EquipmentData(
            equipment_id="HR-301",
            equipment_type=EquipmentType.PRESSURE_VESSEL,
            service_type=ServiceType.SOUR_GAS,
            installation_date=datetime(1995, 1, 1),  # Very old
            design_pressure=150.0,  # Very high pressure
            design_temperature=400.0,  # Very high temperature
            material="CS",
            criticality_level="Critical",
            coating_type="None",
            location="near_sensitive",
            inventory_size=1000.0  # Very large inventory
        )
        
        # Severe degradation data
        severe_data = ExtractedRBIData(
            equipment_id="HR-301",
            thickness_measurements=[
                ThicknessMeasurement(
                    location="Critical_1", thickness=10.2, measurement_date=datetime.now(),
                    minimum_required=10.0  # Very close to minimum
                ),
                ThicknessMeasurement(
                    location="Critical_2", thickness=10.1, measurement_date=datetime.now(),
                    minimum_required=10.0
                ),
                ThicknessMeasurement(
                    location="Critical_3", thickness=9.8, measurement_date=datetime.now(),
                    minimum_required=10.0  # Below minimum!
                )
            ],
            corrosion_rate=1.2,  # Very high corrosion rate
            coating_condition="none",
            damage_mechanisms=["General Corrosion", "Pitting", "Stress Corrosion Cracking", "Fatigue"],
            inspection_findings=[
                InspectionFinding(
                    finding_type="Critical Defect", severity="Critical",
                    description="Severe wall loss detected", location="Shell",
                    recommendation="Immediate repair required", finding_date=datetime.now()
                )
            ],
            last_inspection_date=datetime.now() - timedelta(days=30),
            inspection_quality="excellent"
        )
        
        result = self.calculator.calculate(high_risk_equipment, severe_data)
        
        # Should result in very high risk and very short interval
        assert result.risk_level in [RiskLevel.HIGH, RiskLevel.VERY_HIGH]
        assert result.inspection_interval_months <= 6  # Very short interval
        assert result.pof_score >= 4.0  # Very high PoF
        assert result.remaining_life_years is not None
        assert result.remaining_life_years < 5.0  # Short remaining life