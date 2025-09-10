"""Tests for Fallback Reporter"""

import pytest
from datetime import datetime, timedelta
from app.domains.rbi.services.fallback_reporter import FallbackReporter
from app.domains.rbi.services.fallback_manager import FallbackManager
from app.domains.rbi.models.core import (
    EquipmentData,
    ExtractedRBIData,
    RBICalculationResult,
    ThicknessMeasurement,
    EquipmentType,
    ServiceType,
    RBILevel,
    RiskLevel
)


class TestFallbackReporter:
    """Test FallbackReporter"""
    
    def setup_method(self):
        """Setup test fixtures"""
        self.fallback_manager = FallbackManager()
        self.reporter = FallbackReporter(self.fallback_manager)
    
    def create_sample_equipment(self) -> EquipmentData:
        """Create sample equipment data"""
        return EquipmentData(
            equipment_id="V-101",
            equipment_type=EquipmentType.PRESSURE_VESSEL,
            service_type=ServiceType.SOUR_GAS,
            installation_date=datetime(2015, 1, 1),
            design_pressure=25.0,
            design_temperature=150.0,
            material="CS",
            criticality_level="High"
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
            corrosion_rate=None,  # Missing for Level 3
            coating_condition="moderate",
            damage_mechanisms=["General Corrosion"],
            inspection_findings=[],
            last_inspection_date=datetime.now() - timedelta(days=30),
            inspection_quality="good"
        )
    
    def create_sample_calculation_result(self) -> RBICalculationResult:
        """Create sample calculation result with fallback"""
        return RBICalculationResult(
            equipment_id="V-101",
            calculation_level=RBILevel.LEVEL_2,
            requested_level=RBILevel.LEVEL_3,
            fallback_occurred=True,
            next_inspection_date=datetime.now() + timedelta(days=720),
            risk_level=RiskLevel.MEDIUM,
            pof_score=2.5,
            cof_scores={"safety": 3.0, "environmental": 2.5, "economic": 3.5},
            confidence_score=0.65,
            data_quality_score=0.7,
            calculation_timestamp=datetime.now(),
            input_parameters={
                "fallback_occurred": True,
                "fallback_reasons": ["corrosion_rate"],
                "adjustment_factor": 0.8,
                "confidence_reduction": 0.15
            },
            missing_data=["corrosion_rate"],
            estimated_parameters=[],
            inspection_interval_months=24
        )
    
    def test_generate_fallback_report(self):
        """Test comprehensive fallback report generation"""
        equipment = self.create_sample_equipment()
        extracted_data = self.create_level2_data()
        calculation_result = self.create_sample_calculation_result()
        
        report = self.reporter.generate_fallback_report(
            equipment, extracted_data, calculation_result, RBILevel.LEVEL_3
        )
        
        # Check report structure
        assert "report_metadata" in report
        assert "executive_summary" in report
        assert "fallback_analysis" in report
        assert "impact_assessment" in report
        assert "data_gaps" in report
        assert "improvement_recommendations" in report
        assert "action_plan" in report
        assert "cost_benefit_analysis" in report
        assert "risk_implications" in report
        
        # Check metadata
        metadata = report["report_metadata"]
        assert metadata["equipment_id"] == "V-101"
        assert metadata["report_type"] == "RBI Fallback Analysis"
        assert metadata["requested_level"] == "Level_3"
        assert metadata["actual_level"] == "Level_2"
        assert metadata["fallback_occurred"] is True
    
    def test_categorize_impact(self):
        """Test impact categorization"""
        assert self.reporter._categorize_impact(0.4) == "High"
        assert self.reporter._categorize_impact(0.2) == "Medium"
        assert self.reporter._categorize_impact(0.08) == "Low"
        assert self.reporter._categorize_impact(0.02) == "Minimal"
    
    def test_assess_conservatism_level(self):
        """Test conservatism level assessment"""
        assert self.reporter._assess_conservatism_level(0.4) == "Very Conservative"
        assert self.reporter._assess_conservatism_level(0.6) == "Conservative"
        assert self.reporter._assess_conservatism_level(0.8) == "Slightly Conservative"
        assert self.reporter._assess_conservatism_level(1.0) == "Standard"
    
    def test_assess_uncertainty_level(self):
        """Test uncertainty level assessment"""
        assert self.reporter._assess_uncertainty_level(0.9) == "Low"
        assert self.reporter._assess_uncertainty_level(0.7) == "Medium"
        assert self.reporter._assess_uncertainty_level(0.5) == "High"
        assert self.reporter._assess_uncertainty_level(0.3) == "Very High"
    
    def test_estimate_costs_and_effort(self):
        """Test cost and effort estimation"""
        recommendations = [
            {"estimated_cost": "High", "estimated_effort": "High"},
            {"estimated_cost": "Medium", "estimated_effort": "Medium"},
            {"estimated_cost": "Low", "estimated_effort": "Low"}
        ]
        
        total_cost = self.reporter._estimate_total_cost(recommendations)
        total_effort = self.reporter._estimate_total_effort(recommendations)
        
        assert total_cost in ["Low", "Medium", "High"]
        assert total_effort in ["Low", "Medium", "High"]