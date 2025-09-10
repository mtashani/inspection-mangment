"""Tests for Level 1 RBI calculator"""

import pytest
from datetime import datetime, timedelta
from app.domains.rbi.services.level1_calculator import Level1Calculator
from app.domains.rbi.models.core import (
    EquipmentData,
    EquipmentType,
    ServiceType,
    RiskLevel,
    RBILevel
)


class TestLevel1Calculator:
    """Test Level1Calculator"""
    
    def setup_method(self):
        """Setup test fixtures"""
        self.calculator = Level1Calculator()
    
    def test_calculate_basic_vessel(self):
        """Test basic calculation for pressure vessel"""
        equipment = EquipmentData(
            equipment_id="V-101",
            equipment_type=EquipmentType.PRESSURE_VESSEL,
            service_type=ServiceType.SWEET_GAS,
            installation_date=datetime(2015, 1, 1),
            design_pressure=25.0,
            design_temperature=150.0,
            material="CS",
            criticality_level="Medium"
        )
        
        last_inspection = datetime(2024, 1, 1)
        result = self.calculator.calculate(equipment, last_inspection)
        
        assert result.equipment_id == "V-101"
        assert result.calculation_level == RBILevel.LEVEL_1
        assert result.requested_level == RBILevel.LEVEL_1
        assert result.fallback_occurred is False
        assert result.risk_level in [RiskLevel.LOW, RiskLevel.MEDIUM, RiskLevel.HIGH]
        assert 1.0 <= result.pof_score <= 5.0
        assert "safety" in result.cof_scores
        assert "environmental" in result.cof_scores
        assert "economic" in result.cof_scores
        assert result.confidence_score == 0.5
        assert result.inspection_interval_months > 0
    
    def test_calculate_sour_gas_service(self):
        """Test calculation with aggressive sour gas service"""
        equipment = EquipmentData(
            equipment_id="V-102",
            equipment_type=EquipmentType.PRESSURE_VESSEL,
            service_type=ServiceType.SOUR_GAS,
            installation_date=datetime(2010, 1, 1),
            design_pressure=30.0,
            design_temperature=180.0,
            material="CS",
            criticality_level="High"
        )
        
        result = self.calculator.calculate(equipment)
        
        # Sour gas service should result in shorter intervals and higher risk
        assert result.inspection_interval_months < 60  # Less than base interval
        assert result.risk_level in [RiskLevel.MEDIUM, RiskLevel.HIGH, RiskLevel.VERY_HIGH]
        assert result.pof_score > 2.5  # Should be above baseline
    
    def test_calculate_different_equipment_types(self):
        """Test calculation with different equipment types"""
        equipment_types = [
            (EquipmentType.PRESSURE_VESSEL, 60),
            (EquipmentType.PIPING, 72),
            (EquipmentType.HEAT_EXCHANGER, 48),
            (EquipmentType.PUMP, 36),
            (EquipmentType.COMPRESSOR, 24),
            (EquipmentType.TANK, 84)
        ]
        
        for eq_type, expected_base_interval in equipment_types:
            equipment = EquipmentData(
                equipment_id=f"TEST-{eq_type.value}",
                equipment_type=eq_type,
                service_type=ServiceType.SWEET_GAS,
                installation_date=datetime(2020, 1, 1),
                design_pressure=15.0,
                design_temperature=100.0,
                material="CS",
                criticality_level="Medium"
            )
            
            result = self.calculator.calculate(equipment)
            
            # Should use appropriate base interval (may be modified by service/criticality)
            assert result.inspection_interval_months > 0
            # For sweet gas and medium criticality, interval should be close to base
            assert abs(result.inspection_interval_months - expected_base_interval) <= 20
    
    def test_criticality_modifiers(self):
        """Test that criticality affects inspection intervals"""
        base_equipment = {
            "equipment_id": "TEST",
            "equipment_type": EquipmentType.PRESSURE_VESSEL,
            "service_type": ServiceType.SWEET_GAS,
            "installation_date": datetime(2020, 1, 1),
            "design_pressure": 20.0,
            "design_temperature": 120.0,
            "material": "CS"
        }
        
        criticality_levels = ["Critical", "High", "Medium", "Low"]
        intervals = []
        
        for criticality in criticality_levels:
            equipment = EquipmentData(
                criticality_level=criticality,
                **base_equipment
            )
            
            result = self.calculator.calculate(equipment)
            intervals.append(result.inspection_interval_months)
        
        # Critical should have shortest interval, Low should have longest
        assert intervals[0] < intervals[1] < intervals[2] < intervals[3]  # Critical < High < Medium < Low
    
    def test_service_type_modifiers(self):
        """Test that service type affects inspection intervals"""
        base_equipment = {
            "equipment_id": "TEST",
            "equipment_type": EquipmentType.PRESSURE_VESSEL,
            "installation_date": datetime(2020, 1, 1),
            "design_pressure": 20.0,
            "design_temperature": 120.0,
            "material": "CS",
            "criticality_level": "Medium"
        }
        
        # Test aggressive vs mild services
        aggressive_equipment = EquipmentData(
            service_type=ServiceType.SOUR_GAS,
            **base_equipment
        )
        
        mild_equipment = EquipmentData(
            service_type=ServiceType.NITROGEN,
            **base_equipment
        )
        
        aggressive_result = self.calculator.calculate(aggressive_equipment)
        mild_result = self.calculator.calculate(mild_equipment)
        
        # Aggressive service should have shorter interval
        assert aggressive_result.inspection_interval_months < mild_result.inspection_interval_months
    
    def test_age_effect_on_pof(self):
        """Test that equipment age affects PoF score"""
        base_equipment = {
            "equipment_id": "TEST",
            "equipment_type": EquipmentType.PRESSURE_VESSEL,
            "service_type": ServiceType.SWEET_GAS,
            "design_pressure": 20.0,
            "design_temperature": 120.0,
            "material": "CS",
            "criticality_level": "Medium"
        }
        
        # New equipment
        new_equipment = EquipmentData(
            installation_date=datetime(2022, 1, 1),  # ~2 years old
            **base_equipment
        )
        
        # Old equipment
        old_equipment = EquipmentData(
            installation_date=datetime(1990, 1, 1),  # ~34 years old
            **base_equipment
        )
        
        new_result = self.calculator.calculate(new_equipment)
        old_result = self.calculator.calculate(old_equipment)
        
        # Old equipment should have higher PoF score
        assert old_result.pof_score > new_result.pof_score
    
    def test_pressure_effect_on_cof(self):
        """Test that pressure affects CoF scores"""
        base_equipment = {
            "equipment_id": "TEST",
            "equipment_type": EquipmentType.PRESSURE_VESSEL,
            "service_type": ServiceType.SWEET_GAS,
            "installation_date": datetime(2020, 1, 1),
            "design_temperature": 120.0,
            "material": "CS",
            "criticality_level": "Medium"
        }
        
        # Low pressure equipment
        low_pressure = EquipmentData(
            design_pressure=5.0,
            **base_equipment
        )
        
        # High pressure equipment
        high_pressure = EquipmentData(
            design_pressure=80.0,
            **base_equipment
        )
        
        low_result = self.calculator.calculate(low_pressure)
        high_result = self.calculator.calculate(high_pressure)
        
        # High pressure should have higher safety CoF
        assert high_result.cof_scores["safety"] > low_result.cof_scores["safety"]
    
    def test_hazardous_fluid_effects(self):
        """Test that hazardous fluids increase risk scores"""
        base_equipment = {
            "equipment_id": "TEST",
            "equipment_type": EquipmentType.PRESSURE_VESSEL,
            "installation_date": datetime(2020, 1, 1),
            "design_pressure": 20.0,
            "design_temperature": 120.0,
            "material": "CS",
            "criticality_level": "Medium"
        }
        
        # Safe fluid
        safe_equipment = EquipmentData(
            service_type=ServiceType.NITROGEN,
            **base_equipment
        )
        
        # Hazardous fluid
        hazardous_equipment = EquipmentData(
            service_type=ServiceType.H2S,
            **base_equipment
        )
        
        safe_result = self.calculator.calculate(safe_equipment)
        hazardous_result = self.calculator.calculate(hazardous_equipment)
        
        # Hazardous fluid should have higher PoF and CoF scores
        assert hazardous_result.pof_score > safe_result.pof_score
        assert hazardous_result.cof_scores["safety"] > safe_result.cof_scores["safety"]
        assert hazardous_result.cof_scores["environmental"] > safe_result.cof_scores["environmental"]
    
    def test_risk_level_determination(self):
        """Test risk level determination logic"""
        # Test different combinations that should result in different risk levels
        
        # Low risk: New, non-critical, safe service
        low_risk_equipment = EquipmentData(
            equipment_id="LOW-RISK",
            equipment_type=EquipmentType.TANK,
            service_type=ServiceType.WATER,
            installation_date=datetime(2022, 1, 1),
            design_pressure=5.0,
            design_temperature=50.0,
            material="CS",
            criticality_level="Low"
        )
        
        # High risk: Old, critical, aggressive service
        high_risk_equipment = EquipmentData(
            equipment_id="HIGH-RISK",
            equipment_type=EquipmentType.COMPRESSOR,
            service_type=ServiceType.H2S,
            installation_date=datetime(1980, 1, 1),
            design_pressure=100.0,
            design_temperature=200.0,
            material="CS",
            criticality_level="Critical"
        )
        
        low_result = self.calculator.calculate(low_risk_equipment)
        high_result = self.calculator.calculate(high_risk_equipment)
        
        # Should result in different risk levels
        assert low_result.risk_level != high_result.risk_level
        
        # High risk equipment should have higher risk level
        risk_order = [RiskLevel.LOW, RiskLevel.MEDIUM, RiskLevel.HIGH, RiskLevel.VERY_HIGH]
        low_index = risk_order.index(low_result.risk_level)
        high_index = risk_order.index(high_result.risk_level)
        assert high_index > low_index
    
    def test_interval_bounds(self):
        """Test that inspection intervals are within reasonable bounds"""
        # Test extreme cases to ensure bounds are enforced
        
        # Very aggressive case (should not go below 6 months)
        aggressive_equipment = EquipmentData(
            equipment_id="AGGRESSIVE",
            equipment_type=EquipmentType.COMPRESSOR,
            service_type=ServiceType.H2S,
            installation_date=datetime(1980, 1, 1),
            design_pressure=100.0,
            design_temperature=200.0,
            material="CS",
            criticality_level="Critical"
        )
        
        # Very mild case (should not go above 120 months)
        mild_equipment = EquipmentData(
            equipment_id="MILD",
            equipment_type=EquipmentType.TANK,
            service_type=ServiceType.NITROGEN,
            installation_date=datetime(2022, 1, 1),
            design_pressure=2.0,
            design_temperature=30.0,
            material="CS",
            criticality_level="Low"
        )
        
        aggressive_result = self.calculator.calculate(aggressive_equipment)
        mild_result = self.calculator.calculate(mild_equipment)
        
        # Check bounds
        assert aggressive_result.inspection_interval_months >= 6
        assert mild_result.inspection_interval_months <= 120
    
    def test_no_last_inspection_date(self):
        """Test calculation when no last inspection date is provided"""
        equipment = EquipmentData(
            equipment_id="V-103",
            equipment_type=EquipmentType.PRESSURE_VESSEL,
            service_type=ServiceType.SWEET_GAS,
            installation_date=datetime(2020, 1, 1),
            design_pressure=20.0,
            design_temperature=120.0,
            material="CS",
            criticality_level="Medium"
        )
        
        result = self.calculator.calculate(equipment)
        
        # Should still calculate successfully
        assert result.next_inspection_date is not None
        # Next inspection should be around current time (due now)
        time_diff = abs((result.next_inspection_date - datetime.now()).days)
        assert time_diff < 1  # Within 1 day of now
    
    def test_input_validation(self):
        """Test input data validation"""
        # Valid equipment
        valid_equipment = EquipmentData(
            equipment_id="V-104",
            equipment_type=EquipmentType.PRESSURE_VESSEL,
            service_type=ServiceType.SWEET_GAS,
            installation_date=datetime(2020, 1, 1),
            design_pressure=20.0,
            design_temperature=120.0,
            material="CS",
            criticality_level="Medium"
        )
        
        validation = self.calculator.validate_input_data(valid_equipment)
        assert len(validation["missing_required"]) == 0
        assert len(validation["invalid_values"]) == 0
        
        # Test validation with problematic values (but valid enough to create object)
        problematic_equipment = EquipmentData(
            equipment_id="V-PROBLEM",
            equipment_type=EquipmentType.PRESSURE_VESSEL,
            service_type=ServiceType.SWEET_GAS,
            installation_date=datetime(2050, 1, 1),  # Future date
            design_pressure=2000.0,  # Very high pressure
            design_temperature=120.0,
            material="CS",
            criticality_level="Medium"
        )
        
        validation = self.calculator.validate_input_data(problematic_equipment)
        assert len(validation["invalid_values"]) > 0 or len(validation["warnings"]) > 0
    
    def test_get_calculation_summary(self):
        """Test calculation summary information"""
        summary = self.calculator.get_calculation_summary()
        
        assert summary["level"] == "Level 1 - Static"
        assert "description" in summary
        assert "data_requirements" in summary
        assert "methodology" in summary
        assert "confidence_level" in summary
        assert "typical_use_cases" in summary
        
        # Should list required data
        assert "Equipment type" in summary["data_requirements"]
        assert "Service type" in summary["data_requirements"]
    
    def test_cof_scores_within_bounds(self):
        """Test that all CoF scores are within valid bounds"""
        equipment = EquipmentData(
            equipment_id="V-105",
            equipment_type=EquipmentType.PRESSURE_VESSEL,
            service_type=ServiceType.SOUR_GAS,
            installation_date=datetime(2015, 1, 1),
            design_pressure=50.0,
            design_temperature=180.0,
            material="CS",
            criticality_level="High",
            inventory_size=200.0
        )
        
        result = self.calculator.calculate(equipment)
        
        # All CoF scores should be between 1.0 and 5.0
        for dimension, score in result.cof_scores.items():
            assert 1.0 <= score <= 5.0, f"{dimension} score {score} out of bounds"
    
    def test_input_parameters_recorded(self):
        """Test that input parameters are properly recorded"""
        equipment = EquipmentData(
            equipment_id="V-106",
            equipment_type=EquipmentType.HEAT_EXCHANGER,
            service_type=ServiceType.AMINE,
            installation_date=datetime(2018, 1, 1),
            design_pressure=15.0,
            design_temperature=100.0,
            material="SS316",
            criticality_level="High"
        )
        
        result = self.calculator.calculate(equipment)
        
        # Should record key input parameters
        assert "equipment_type" in result.input_parameters
        assert "service_type" in result.input_parameters
        assert "criticality_level" in result.input_parameters
        assert "base_interval" in result.input_parameters
        assert "service_modifier" in result.input_parameters
        assert "criticality_modifier" in result.input_parameters
        
        # Values should match input
        assert result.input_parameters["equipment_type"] == "heat_exchanger"
        assert result.input_parameters["service_type"] == "amine"
        assert result.input_parameters["criticality_level"] == "High"
    
    def test_safety_factors_application(self):
        """Test that safety factors are applied correctly"""
        equipment = EquipmentData(
            equipment_id="V-SAFETY",
            equipment_type=EquipmentType.PRESSURE_VESSEL,
            service_type=ServiceType.SWEET_GAS,
            installation_date=datetime(2020, 1, 1),
            design_pressure=20.0,
            design_temperature=120.0,
            material="CS",
            criticality_level="Medium"
        )
        
        # Calculate without safety factors
        normal_result = self.calculator.calculate(equipment)
        
        # Calculate with safety factors
        safety_result = self.calculator.calculate(
            equipment, 
            apply_safety_factors=True,
            data_quality_issues=["missing_corrosion_rate", "old_inspection_data"]
        )
        
        # Safety factors should result in shorter interval
        assert safety_result.inspection_interval_months < normal_result.inspection_interval_months
    
    def test_emergency_fallback(self):
        """Test emergency fallback calculation"""
        equipment = EquipmentData(
            equipment_id="V-EMERGENCY",
            equipment_type=EquipmentType.PRESSURE_VESSEL,
            service_type=ServiceType.SOUR_GAS,
            installation_date=datetime(2020, 1, 1),
            design_pressure=25.0,
            design_temperature=150.0,
            material="CS",
            criticality_level="High"
        )
        
        result = self.calculator.calculate_emergency_fallback(equipment)
        
        assert result.fallback_occurred is True
        assert result.risk_level == RiskLevel.HIGH
        assert result.confidence_score == 0.2
        assert result.data_quality_score == 0.1
        assert result.inspection_interval_months <= 12  # Should be very conservative
        assert "emergency_fallback" in result.input_parameters["calculation_type"]
    
    def test_calculate_with_fallback_protection(self):
        """Test calculation with automatic fallback protection"""
        equipment = EquipmentData(
            equipment_id="V-PROTECTED",
            equipment_type=EquipmentType.HEAT_EXCHANGER,
            service_type=ServiceType.AMINE,
            installation_date=datetime(2018, 1, 1),
            design_pressure=15.0,
            design_temperature=100.0,
            material="SS316",
            criticality_level="Medium"
        )
        
        # Test with poor data quality (should trigger emergency fallback)
        poor_result = self.calculator.calculate_with_fallback_protection(
            equipment,
            data_completeness_score=0.2,
            data_quality_issues=["missing_most_data"]
        )
        
        assert poor_result.fallback_occurred is True
        assert poor_result.confidence_score <= 0.2
        
        # Test with moderate data quality (should apply safety factors)
        moderate_result = self.calculator.calculate_with_fallback_protection(
            equipment,
            data_completeness_score=0.6,
            data_quality_issues=["missing_corrosion_rate"]
        )
        
        assert moderate_result.fallback_occurred is True
        assert moderate_result.confidence_score > poor_result.confidence_score
        
        # Test with good data quality (should calculate normally)
        good_result = self.calculator.calculate_with_fallback_protection(
            equipment,
            data_completeness_score=0.9
        )
        
        assert good_result.fallback_occurred is False
        assert good_result.confidence_score == 0.5  # Normal Level 1 confidence
    
    def test_get_recommended_actions(self):
        """Test recommended actions generation"""
        # Create a high-risk result
        high_risk_equipment = EquipmentData(
            equipment_id="V-HIGH-RISK",
            equipment_type=EquipmentType.COMPRESSOR,
            service_type=ServiceType.SOUR_GAS,
            installation_date=datetime(1990, 1, 1),
            design_pressure=50.0,
            design_temperature=200.0,
            material="CS",
            criticality_level="Critical"
        )
        
        result = self.calculator.calculate(high_risk_equipment)
        recommendations = self.calculator.get_recommended_actions(result)
        
        assert len(recommendations) > 0
        
        # Should have equipment-specific recommendations
        if result.risk_level == RiskLevel.VERY_HIGH:
            assert any("CRITICAL" in rec for rec in recommendations)
        
        # Should have service-specific recommendations for sour gas
        assert any("H2S" in rec for rec in recommendations)
        
        # Should have equipment-specific recommendations for compressor
        assert any("vibration" in rec for rec in recommendations)
    
    def test_compare_with_industry_standards(self):
        """Test comparison with industry standards"""
        equipment = EquipmentData(
            equipment_id="V-STANDARD",
            equipment_type=EquipmentType.PRESSURE_VESSEL,
            service_type=ServiceType.SOUR_GAS,
            installation_date=datetime(2015, 1, 1),
            design_pressure=25.0,
            design_temperature=150.0,
            material="CS",
            criticality_level="Medium"
        )
        
        result = self.calculator.calculate(equipment)
        comparison = self.calculator.compare_with_industry_standards(result)
        
        assert "calculated_interval" in comparison
        assert "industry_standard" in comparison
        assert "comparison" in comparison
        assert comparison["calculated_interval"] == result.inspection_interval_months
        assert comparison["industry_standard"] is not None
        assert comparison["comparison"] in ["more_conservative", "less_conservative", "aligned"]
    
    def test_safety_factor_calculation(self):
        """Test safety factor calculation logic"""
        # Test with no issues
        factor_none = self.calculator._get_safety_factor([])
        assert factor_none == 1.0
        
        # Test with single issue
        factor_single = self.calculator._get_safety_factor(["missing_corrosion_rate"])
        assert factor_single > 1.0
        assert factor_single <= 2.0
        
        # Test with multiple issues
        factor_multiple = self.calculator._get_safety_factor([
            "missing_corrosion_rate", 
            "old_inspection_data", 
            "poor_data_quality"
        ])
        assert factor_multiple > factor_single
        assert factor_multiple <= 2.0  # Should be capped
    
    def test_emergency_intervals_bounds(self):
        """Test that emergency intervals are within reasonable bounds"""
        for equipment_type in EquipmentType:
            equipment = EquipmentData(
                equipment_id=f"EMERGENCY-{equipment_type.value}",
                equipment_type=equipment_type,
                service_type=ServiceType.SWEET_GAS,
                installation_date=datetime(2020, 1, 1),
                design_pressure=10.0,
                design_temperature=80.0,
                material="CS",
                criticality_level="Medium"
            )
            
            result = self.calculator.calculate_emergency_fallback(equipment)
            
            # Emergency intervals should be very conservative (short)
            assert 3 <= result.inspection_interval_months <= 24
            assert result.fallback_occurred is True
            assert result.risk_level == RiskLevel.HIGH
    
    def test_fallback_confidence_adjustment(self):
        """Test that confidence is properly adjusted in fallback scenarios"""
        equipment = EquipmentData(
            equipment_id="V-CONFIDENCE",
            equipment_type=EquipmentType.PRESSURE_VESSEL,
            service_type=ServiceType.SWEET_GAS,
            installation_date=datetime(2020, 1, 1),
            design_pressure=20.0,
            design_temperature=120.0,
            material="CS",
            criticality_level="Medium"
        )
        
        # Normal calculation
        normal_result = self.calculator.calculate(equipment)
        
        # Fallback with good data quality
        good_fallback = self.calculator.calculate_with_fallback_protection(
            equipment, data_completeness_score=0.8
        )
        
        # Fallback with poor data quality
        poor_fallback = self.calculator.calculate_with_fallback_protection(
            equipment, data_completeness_score=0.4
        )
        
        # Confidence should decrease with data quality
        assert normal_result.confidence_score >= good_fallback.confidence_score
        assert good_fallback.confidence_score >= poor_fallback.confidence_score