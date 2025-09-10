"""Tests for Fallback Manager"""

import pytest
from datetime import datetime, timedelta
from app.domains.rbi.services.fallback_manager import FallbackManager
from app.domains.rbi.models.core import (
    EquipmentData,
    ExtractedRBIData,
    ThicknessMeasurement,
    InspectionFinding,
    EquipmentType,
    ServiceType,
    RBILevel,
    RiskLevel
)


class TestFallbackManager:
    """Test FallbackManager"""
    
    def setup_method(self):
        """Setup test fixtures"""
        self.manager = FallbackManager()
    
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
    
    def create_level2_data(self) -> ExtractedRBIData:
        """Create data suitable for Level 2 but not Level 3"""
        thickness_measurements = [
            ThicknessMeasurement(
                location="Shell_Top", thickness=12.5, measurement_date=datetime.now() - timedelta(days=30),
                minimum_required=10.0, measurement_method="UT", inspector="Inspector A"
            ),
            ThicknessMeasurement(
                location="Shell_Bottom", thickness=11.8, measurement_date=datetime.now() - timedelta(days=30),
                minimum_required=10.0, measurement_method="UT", inspector="Inspector A"
            )
        ]
        
        return ExtractedRBIData(
            equipment_id="V-101",
            thickness_measurements=thickness_measurements,
            corrosion_rate=None,  # Missing corrosion rate makes Level 3 impossible
            coating_condition="moderate",
            damage_mechanisms=["General Corrosion"],
            inspection_findings=[],
            last_inspection_date=datetime.now() - timedelta(days=30),
            inspection_quality="good"
        )
    
    def create_minimal_data(self) -> ExtractedRBIData:
        """Create minimal data suitable only for Level 1"""
        return ExtractedRBIData(
            equipment_id="V-101",
            thickness_measurements=[],
            corrosion_rate=None,
            coating_condition=None,
            damage_mechanisms=[],
            inspection_findings=[],
            last_inspection_date=None,
            inspection_quality="poor"
        )
    
    def test_calculate_with_fallback_level3_success(self):
        """Test successful Level 3 calculation without fallback"""
        equipment = self.create_comprehensive_equipment()
        extracted_data = self.create_comprehensive_extracted_data()
        
        result = self.manager.calculate_with_fallback(
            equipment, extracted_data, RBILevel.LEVEL_3
        )
        
        assert result.calculation_level == RBILevel.LEVEL_3
        assert result.requested_level == RBILevel.LEVEL_3
        assert result.fallback_occurred is False
        assert result.confidence_score > 0.8
    
    def test_calculate_with_fallback_level3_to_level2(self):
        """Test fallback from Level 3 to Level 2"""
        equipment = self.create_comprehensive_equipment()
        extracted_data = self.create_level2_data()
        
        result = self.manager.calculate_with_fallback(
            equipment, extracted_data, RBILevel.LEVEL_3
        )
        
        assert result.calculation_level == RBILevel.LEVEL_2
        assert result.requested_level == RBILevel.LEVEL_3
        assert result.fallback_occurred is True
        assert "fallback_occurred" in result.input_parameters
        assert result.input_parameters["fallback_occurred"] is True
        assert result.confidence_score < 0.85  # Should be reduced due to fallback
    
    def test_calculate_with_fallback_level3_to_level1(self):
        """Test fallback from Level 3 to Level 1"""
        equipment = self.create_comprehensive_equipment()
        extracted_data = self.create_minimal_data()
        
        result = self.manager.calculate_with_fallback(
            equipment, extracted_data, RBILevel.LEVEL_3
        )
        
        assert result.calculation_level == RBILevel.LEVEL_1
        assert result.requested_level == RBILevel.LEVEL_3
        assert result.fallback_occurred is True
        assert result.confidence_score < 0.6  # Significant reduction due to major fallback
    
    def test_calculate_with_fallback_auto_level(self):
        """Test automatic level determination"""
        equipment = self.create_comprehensive_equipment()
        extracted_data = self.create_comprehensive_extracted_data()
        
        result = self.manager.calculate_with_fallback(
            equipment, extracted_data, None  # Auto-determine level
        )
        
        assert result.calculation_level == RBILevel.LEVEL_3  # Should choose highest possible
        assert result.requested_level == RBILevel.LEVEL_3
        assert result.fallback_occurred is False
    
    def test_apply_conservative_adjustments(self):
        """Test conservative adjustments application"""
        equipment = self.create_comprehensive_equipment()
        extracted_data = self.create_level2_data()
        
        # Get Level 2 result first
        level2_result = self.manager.level2_calculator.calculate(equipment, extracted_data)
        original_interval = level2_result.inspection_interval_months
        original_confidence = level2_result.confidence_score
        
        # Apply conservative adjustments
        adjusted_result = self.manager._apply_conservative_adjustments(
            level2_result, RBILevel.LEVEL_3, RBILevel.LEVEL_2, ["corrosion_rate"]
        )
        
        # Check adjustments
        assert adjusted_result.inspection_interval_months <= original_interval
        assert adjusted_result.confidence_score < original_confidence
        assert "adjustment_factor" in adjusted_result.input_parameters
    
    def test_calculate_adjustment_factor(self):
        """Test adjustment factor calculation"""
        # Level 3 to Level 2 fallback
        factor = self.manager._calculate_adjustment_factor(
            RBILevel.LEVEL_3, RBILevel.LEVEL_2, ["corrosion_rate"]
        )
        assert 0.4 <= factor <= 1.0
        assert factor < 1.0  # Should be conservative
        
        # Level 3 to Level 1 fallback (more severe)
        factor_severe = self.manager._calculate_adjustment_factor(
            RBILevel.LEVEL_3, RBILevel.LEVEL_1, ["corrosion_rate", "thickness_measurements"]
        )
        assert factor_severe < factor  # Should be more conservative
    
    def test_calculate_confidence_reduction(self):
        """Test confidence reduction calculation"""
        # Level 3 to Level 2
        reduction = self.manager._calculate_confidence_reduction(RBILevel.LEVEL_3, RBILevel.LEVEL_2)
        assert 0.0 < reduction < 0.5
        
        # Level 3 to Level 1 (more severe)
        reduction_severe = self.manager._calculate_confidence_reduction(RBILevel.LEVEL_3, RBILevel.LEVEL_1)
        assert reduction_severe > reduction
        
        # No fallback
        no_reduction = self.manager._calculate_confidence_reduction(RBILevel.LEVEL_2, RBILevel.LEVEL_2)
        assert no_reduction == 0.0
    
    def test_get_fallback_summary(self):
        """Test fallback summary generation"""
        equipment = self.create_comprehensive_equipment()
        extracted_data = self.create_level2_data()
        
        summary = self.manager.get_fallback_summary(
            equipment, extracted_data, RBILevel.LEVEL_3
        )
        
        assert summary["requested_level"] == "Level_3"
        assert summary["recommended_level"] == "Level_2"
        assert summary["fallback_required"] is True
        assert len(summary["fallback_reasons"]) > 0
        assert "level_assessments" in summary
        assert "level_3" in summary["level_assessments"]
        assert "level_2" in summary["level_assessments"]
        assert "level_1" in summary["level_assessments"]
        assert summary["adjustment_factor"] < 1.0
        assert summary["confidence_reduction"] > 0.0
        assert len(summary["recommendations"]) > 0
    
    def test_get_fallback_summary_no_fallback(self):
        """Test fallback summary when no fallback needed"""
        equipment = self.create_comprehensive_equipment()
        extracted_data = self.create_comprehensive_extracted_data()
        
        summary = self.manager.get_fallback_summary(
            equipment, extracted_data, RBILevel.LEVEL_3
        )
        
        assert summary["fallback_required"] is False
        assert summary["adjustment_factor"] == 1.0
        assert summary["confidence_reduction"] == 0.0
    
    def test_validate_fallback_strategy(self):
        """Test fallback strategy validation"""
        equipment = self.create_comprehensive_equipment()
        extracted_data = self.create_level2_data()
        
        validation = self.manager.validate_fallback_strategy(
            equipment, extracted_data, RBILevel.LEVEL_3
        )
        
        assert validation["validation_successful"] is True
        assert validation["calculation_error"] is None
        assert "fallback_summary" in validation
        assert "result_preview" in validation
        assert validation["result_preview"]["actual_level"] == "Level_2"
        assert validation["result_preview"]["fallback_occurred"] is True
        assert "validation_timestamp" in validation
    
    def test_fallback_recommendations(self):
        """Test fallback recommendations generation"""
        equipment = self.create_comprehensive_equipment()
        
        # Test Level 3 recommendations
        level2_data = self.create_level2_data()
        level3_assessment = self.manager.level_manager._assess_level3_capability(equipment, level2_data)
        level2_assessment = self.manager.level_manager._assess_level2_capability(equipment, level2_data)
        level1_assessment = self.manager.level_manager._assess_level1_capability(equipment, level2_data)
        
        recommendations = self.manager._get_fallback_recommendations(
            level3_assessment, level2_assessment, level1_assessment, RBILevel.LEVEL_3
        )
        
        assert len(recommendations) > 0
        assert any("Level 3" in rec for rec in recommendations)
        assert any("corrosion rate" in rec.lower() for rec in recommendations)
    
    def test_emergency_result_creation(self):
        """Test emergency result creation"""
        equipment = self.create_comprehensive_equipment()
        
        emergency_result = self.manager._create_emergency_result(equipment, "Test error")
        
        assert emergency_result.equipment_id == equipment.equipment_id
        assert emergency_result.calculation_level == RBILevel.LEVEL_1
        assert emergency_result.fallback_occurred is True
        assert emergency_result.confidence_score == 0.1
        assert emergency_result.inspection_interval_months == 3  # Very conservative
        assert emergency_result.risk_level == RiskLevel.HIGH  # Conservative assumption
        assert "emergency_calculation" in emergency_result.input_parameters
        assert emergency_result.input_parameters["emergency_calculation"] is True
    
    def test_multiple_fallback_scenarios(self):
        """Test various fallback scenarios"""
        equipment = self.create_comprehensive_equipment()
        
        # Scenario 1: Level 3 capable
        level3_data = self.create_comprehensive_extracted_data()
        result1 = self.manager.calculate_with_fallback(equipment, level3_data, RBILevel.LEVEL_3)
        assert result1.calculation_level == RBILevel.LEVEL_3
        assert result1.fallback_occurred is False
        
        # Scenario 2: Level 2 fallback
        level2_data = self.create_level2_data()
        result2 = self.manager.calculate_with_fallback(equipment, level2_data, RBILevel.LEVEL_3)
        assert result2.calculation_level == RBILevel.LEVEL_2
        assert result2.fallback_occurred is True
        
        # Scenario 3: Level 1 fallback
        level1_data = self.create_minimal_data()
        result3 = self.manager.calculate_with_fallback(equipment, level1_data, RBILevel.LEVEL_3)
        assert result3.calculation_level == RBILevel.LEVEL_1
        assert result3.fallback_occurred is True
        
        # Check that intervals become more conservative with more severe fallbacks
        assert result1.inspection_interval_months >= result2.inspection_interval_months
        assert result2.inspection_interval_months >= result3.inspection_interval_months
        
        # Check that confidence decreases with more severe fallbacks
        assert result1.confidence_score >= result2.confidence_score
        assert result2.confidence_score >= result3.confidence_score