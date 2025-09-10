"""Tests for Level 2 RBI calculator"""

import pytest
from datetime import datetime, timedelta
from app.domains.rbi.services.level2_calculator import Level2Calculator
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


class TestLevel2Calculator:
    """Test Level2Calculator"""
    
    def setup_method(self):
        """Setup test fixtures"""
        self.calculator = Level2Calculator()
    
    def create_sample_equipment(self) -> EquipmentData:
        """Create sample equipment data"""
        return EquipmentData(
            equipment_id="V-201",
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
    
    def create_sample_extracted_data(self) -> ExtractedRBIData:
        """Create sample extracted RBI data"""
        thickness_measurements = [
            ThicknessMeasurement(
                location="Shell_Top",
                thickness=12.5,
                measurement_date=datetime.now() - timedelta(days=30),
                minimum_required=10.0,
                measurement_method="UT",
                inspector="John Doe"
            ),
            ThicknessMeasurement(
                location="Shell_Bottom",
                thickness=11.8,
                measurement_date=datetime.now() - timedelta(days=30),
                minimum_required=10.0,
                measurement_method="UT",
                inspector="John Doe"
            )
        ]
        
        inspection_findings = [
            InspectionFinding(
                finding_type="General Corrosion",
                severity="Medium",
                description="Uniform corrosion observed",
                location="Shell_External",
                recommendation="Monitor",
                finding_date=datetime.now() - timedelta(days=30)
            )
        ]
        
        return ExtractedRBIData(
            equipment_id="V-201",
            thickness_measurements=thickness_measurements,
            corrosion_rate=0.15,
            coating_condition="moderate",
            damage_mechanisms=["General Corrosion", "Pitting"],
            inspection_findings=inspection_findings,
            last_inspection_date=datetime.now() - timedelta(days=30),
            inspection_quality="good"
        )
    
    def test_calculate_basic(self):
        """Test basic Level 2 calculation"""
        equipment = self.create_sample_equipment()
        extracted_data = self.create_sample_extracted_data()
        
        result = self.calculator.calculate(equipment, extracted_data)
        
        assert result.equipment_id == "V-201"
        assert result.calculation_level == RBILevel.LEVEL_2
        assert result.requested_level == RBILevel.LEVEL_2
        assert result.fallback_occurred is False
        assert result.risk_level in [RiskLevel.LOW, RiskLevel.MEDIUM, RiskLevel.HIGH, RiskLevel.VERY_HIGH]
        assert 1.0 <= result.pof_score <= 5.0
        assert "safety" in result.cof_scores
        assert "environmental" in result.cof_scores
        assert "economic" in result.cof_scores
        assert result.confidence_score > 0.6  # Should be higher than Level 1
        assert result.inspection_interval_months > 0
    
    def test_pof_calculation(self):
        """Test PoF score calculation"""
        equipment = self.create_sample_equipment()
        extracted_data = self.create_sample_extracted_data()
        
        pof_score = self.calculator._calculate_pof_score(equipment, extracted_data)
        
        assert 1.0 <= pof_score <= 5.0
        assert isinstance(pof_score, float)
    
    def test_cof_calculation(self):
        """Test CoF scores calculation"""
        equipment = self.create_sample_equipment()
        extracted_data = self.create_sample_extracted_data()
        
        cof_scores = self.calculator._calculate_cof_scores(equipment, extracted_data)
        
        assert "safety" in cof_scores
        assert "environmental" in cof_scores
        assert "economic" in cof_scores
        
        for dimension, score in cof_scores.items():
            assert 1.0 <= score <= 5.0, f"{dimension} score {score} out of bounds"
    
    def test_thickness_ratio_calculation(self):
        """Test thickness ratio calculation"""
        # Good thickness ratio
        good_measurements = [
            ThicknessMeasurement(
                location="Test", thickness=15.0, measurement_date=datetime.now(),
                minimum_required=10.0
            )
        ]
        ratio = self.calculator._calculate_thickness_ratio(good_measurements)
        assert ratio == 1  # Excellent ratio
        
        # Poor thickness ratio
        poor_measurements = [
            ThicknessMeasurement(
                location="Test", thickness=8.0, measurement_date=datetime.now(),
                minimum_required=10.0
            )
        ]
        ratio = self.calculator._calculate_thickness_ratio(poor_measurements)
        assert ratio == 4  # Poor ratio
        
        # No measurements
        ratio = self.calculator._calculate_thickness_ratio([])
        assert ratio is None
    
    def test_score_to_level_conversion(self):
        """Test score to level conversion"""
        assert self.calculator._score_to_level(1.5) == "Low"
        assert self.calculator._score_to_level(2.5) == "Medium"
        assert self.calculator._score_to_level(4.0) == "High"
    
    def test_containment_assessment(self):
        """Test containment system assessment"""
        # Safe location
        safe_equipment = EquipmentData(
            equipment_id="SAFE", equipment_type=EquipmentType.TANK,
            service_type=ServiceType.WATER, installation_date=datetime(2020, 1, 1),
            design_pressure=5.0, design_temperature=50.0, material="CS",
            location="safe"
        )
        assert self.calculator._assess_containment_system(safe_equipment) == "good"
        
        # Near sensitive location
        sensitive_equipment = EquipmentData(
            equipment_id="SENSITIVE", equipment_type=EquipmentType.TANK,
            service_type=ServiceType.WATER, installation_date=datetime(2020, 1, 1),
            design_pressure=5.0, design_temperature=50.0, material="CS",
            location="near_sensitive"
        )
        assert self.calculator._assess_containment_system(sensitive_equipment) == "poor"
    
    def test_downtime_estimation(self):
        """Test downtime estimation"""
        # Complex, critical equipment
        complex_equipment = EquipmentData(
            equipment_id="COMPLEX", equipment_type=EquipmentType.COMPRESSOR,
            service_type=ServiceType.SOUR_GAS, installation_date=datetime(2015, 1, 1),
            design_pressure=50.0, design_temperature=200.0, material="CS",
            criticality_level="Critical"
        )
        downtime = self.calculator._estimate_downtime(complex_equipment)
        assert downtime in [">3d", "1-3d"]
        
        # Simple, low criticality equipment
        simple_equipment = EquipmentData(
            equipment_id="SIMPLE", equipment_type=EquipmentType.TANK,
            service_type=ServiceType.WATER, installation_date=datetime(2020, 1, 1),
            design_pressure=5.0, design_temperature=50.0, material="CS",
            criticality_level="Low"
        )
        downtime = self.calculator._estimate_downtime(simple_equipment)
        assert downtime == "<1d"
    
    def test_repair_cost_estimation(self):
        """Test repair cost estimation"""
        # Expensive equipment
        expensive_equipment = EquipmentData(
            equipment_id="EXPENSIVE", equipment_type=EquipmentType.COMPRESSOR,
            service_type=ServiceType.SOUR_GAS, installation_date=datetime(2015, 1, 1),
            design_pressure=80.0, design_temperature=200.0, material="CS",
            inventory_size=200.0
        )
        cost = self.calculator._estimate_repair_cost(expensive_equipment)
        assert cost == ">100k"
        
        # Cheap equipment
        cheap_equipment = EquipmentData(
            equipment_id="CHEAP", equipment_type=EquipmentType.TANK,
            service_type=ServiceType.WATER, installation_date=datetime(2020, 1, 1),
            design_pressure=5.0, design_temperature=50.0, material="CS",
            inventory_size=10.0
        )
        cost = self.calculator._estimate_repair_cost(cheap_equipment)
        assert cost == "<10k"
    
    def test_confidence_calculation(self):
        """Test confidence score calculation"""
        equipment = self.create_sample_equipment()
        extracted_data = self.create_sample_extracted_data()
        
        confidence = self.calculator._calculate_confidence_score(equipment, extracted_data)
        
        assert 0.0 <= confidence <= 1.0
        assert confidence > 0.6  # Should be higher than Level 1
    
    def test_data_quality_calculation(self):
        """Test data quality score calculation"""
        extracted_data = self.create_sample_extracted_data()
        
        quality = self.calculator._calculate_data_quality_score(extracted_data)
        
        assert 0.0 <= quality <= 1.0
    
    def test_input_parameters_collection(self):
        """Test input parameters collection"""
        equipment = self.create_sample_equipment()
        extracted_data = self.create_sample_extracted_data()
        
        params = self.calculator._collect_input_parameters(equipment, extracted_data)
        
        assert "equipment_type" in params
        assert "service_type" in params
        assert "equipment_age" in params
        assert "corrosion_rate" in params
        assert params["equipment_type"] == "pressure_vessel"
        assert params["corrosion_rate"] == 0.15
    
    def test_missing_data_identification(self):
        """Test missing data identification"""
        # Create data with missing fields
        incomplete_data = ExtractedRBIData(
            equipment_id="V-201",
            thickness_measurements=[],
            corrosion_rate=None,
            coating_condition=None,
            damage_mechanisms=[],
            inspection_findings=[],
            last_inspection_date=None,
            inspection_quality="poor"
        )
        
        missing = self.calculator._identify_missing_data(incomplete_data)
        
        assert "corrosion_rate" in missing
        assert "thickness_measurements" in missing
        assert "coating_condition" in missing
        assert "damage_mechanisms" in missing
        assert "last_inspection_date" in missing
    
    def test_estimated_parameters_identification(self):
        """Test estimated parameters identification"""
        # Create data where corrosion rate might be estimated
        estimated_data = ExtractedRBIData(
            equipment_id="V-201",
            thickness_measurements=[],  # No thickness measurements
            corrosion_rate=0.1,  # But has corrosion rate (likely estimated)
            coating_condition="good",
            damage_mechanisms=["General Corrosion"],
            inspection_findings=[],
            last_inspection_date=datetime.now(),
            inspection_quality="good"
        )
        
        estimated = self.calculator._identify_estimated_parameters(estimated_data)
        
        assert "corrosion_rate" in estimated
    
    def test_validation_missing_required_data(self):
        """Test validation with missing required data"""
        # Equipment with missing required fields
        incomplete_equipment = EquipmentData(
            equipment_id="",  # Missing
            equipment_type=None,  # Missing
            service_type=ServiceType.WATER,
            installation_date=datetime(2020, 1, 1),
            design_pressure=5.0,
            design_temperature=50.0,
            material="CS"
        )
        
        extracted_data = self.create_sample_extracted_data()
        
        validation = self.calculator.validate_input_data(incomplete_equipment, extracted_data)
        
        assert "equipment_id" in validation["missing_required"]
        assert "equipment_type" in validation["missing_required"]
    
    def test_validation_data_quality_issues(self):
        """Test validation with data quality issues"""
        equipment = self.create_sample_equipment()
        
        # Data with quality issues
        poor_data = ExtractedRBIData(
            equipment_id="V-201",
            thickness_measurements=[],
            corrosion_rate=-0.1,  # Invalid negative rate
            coating_condition=None,
            damage_mechanisms=[],
            inspection_findings=[],
            last_inspection_date=datetime.now() - timedelta(days=1200),  # Very old
            inspection_quality="poor"
        )
        
        validation = self.calculator.validate_input_data(equipment, poor_data)
        
        assert len(validation["data_quality_issues"]) > 0
        assert any("Negative corrosion rate" in issue for issue in validation["data_quality_issues"])
        assert any("very old" in issue.lower() for issue in validation["data_quality_issues"])
    
    def test_validation_warnings(self):
        """Test validation warnings"""
        equipment = self.create_sample_equipment()
        
        # Data with warning conditions
        warning_data = ExtractedRBIData(
            equipment_id="V-201",
            thickness_measurements=[],
            corrosion_rate=1.5,  # Very high rate
            coating_condition=None,
            damage_mechanisms=[],
            inspection_findings=[],
            last_inspection_date=datetime.now() - timedelta(days=800),  # Getting old
            inspection_quality="poor"
        )
        
        validation = self.calculator.validate_input_data(equipment, warning_data)
        
        assert len(validation["warnings"]) > 0
        assert any("high corrosion rate" in warning.lower() for warning in validation["warnings"])
        assert any("getting old" in warning.lower() for warning in validation["warnings"])
    
    def test_calculation_summary(self):
        """Test calculation summary"""
        summary = self.calculator.get_calculation_summary()
        
        assert summary["level"] == "Level 2 - Semi-Quantitative"
        assert "data_requirements" in summary
        assert "methodology" in summary
        assert "confidence_level" in summary
        assert "typical_use_cases" in summary
        
        # Check methodology details
        methodology = summary["methodology"]
        assert "pof_calculation" in methodology
        assert "cof_calculation" in methodology
        assert "risk_determination" in methodology
        assert "interval_calculation" in methodology
    
    def test_high_risk_equipment(self):
        """Test calculation with high-risk equipment"""
        # Create high-risk equipment
        high_risk_equipment = EquipmentData(
            equipment_id="HR-001",
            equipment_type=EquipmentType.PRESSURE_VESSEL,
            service_type=ServiceType.SOUR_GAS,
            installation_date=datetime(2000, 1, 1),  # Very old
            design_pressure=100.0,  # High pressure
            design_temperature=300.0,  # High temperature
            material="CS",
            criticality_level="Critical",
            coating_type="None",
            location="near_sensitive",
            inventory_size=500.0  # Large inventory
        )
        
        # High-risk extracted data
        high_risk_data = ExtractedRBIData(
            equipment_id="HR-001",
            thickness_measurements=[
                ThicknessMeasurement(
                    location="Critical", thickness=8.0, measurement_date=datetime.now(),
                    minimum_required=10.0  # Below minimum
                )
            ],
            corrosion_rate=0.8,  # High corrosion rate
            coating_condition="poor",
            damage_mechanisms=["General Corrosion", "Pitting", "Stress Corrosion Cracking"],
            inspection_findings=[
                InspectionFinding(
                    finding_type="Critical Defect", severity="High",
                    description="Significant wall loss", location="Shell",
                    recommendation="Immediate repair", finding_date=datetime.now()
                )
            ],
            last_inspection_date=datetime.now() - timedelta(days=30),
            inspection_quality="good"
        )
        
        result = self.calculator.calculate(high_risk_equipment, high_risk_data)
        
        # Should result in high risk and short interval
        assert result.risk_level in [RiskLevel.HIGH, RiskLevel.VERY_HIGH]
        assert result.inspection_interval_months <= 12  # Short interval for high risk
        assert result.pof_score >= 3.0  # High PoF score
    
    def test_low_risk_equipment(self):
        """Test calculation with low-risk equipment"""
        # Create low-risk equipment
        low_risk_equipment = EquipmentData(
            equipment_id="LR-001",
            equipment_type=EquipmentType.TANK,
            service_type=ServiceType.WATER,
            installation_date=datetime(2020, 1, 1),  # New
            design_pressure=5.0,  # Low pressure
            design_temperature=50.0,  # Low temperature
            material="SS",
            criticality_level="Low",
            coating_type="Epoxy",
            location="safe",
            inventory_size=10.0  # Small inventory
        )
        
        # Low-risk extracted data
        low_risk_data = ExtractedRBIData(
            equipment_id="LR-001",
            thickness_measurements=[
                ThicknessMeasurement(
                    location="Shell", thickness=15.0, measurement_date=datetime.now(),
                    minimum_required=10.0  # Well above minimum
                )
            ],
            corrosion_rate=0.05,  # Low corrosion rate
            coating_condition="excellent",
            damage_mechanisms=[],  # No damage mechanisms
            inspection_findings=[],  # No findings
            last_inspection_date=datetime.now() - timedelta(days=30),
            inspection_quality="good"
        )
        
        result = self.calculator.calculate(low_risk_equipment, low_risk_data)
        
        # Should result in low risk and long interval
        assert result.risk_level in [RiskLevel.LOW, RiskLevel.MEDIUM]
        assert result.inspection_interval_months >= 24  # Long interval for low risk
        assert result.pof_score <= 3.0  # Low PoF score
    
    def test_calculate_with_custom_config(self):
        """Test calculation with custom configuration"""
        # Create custom config
        custom_config = RBIConfig()
        custom_config.weighting_factors.cof_weights = {
            "safety": 0.5,
            "environmental": 0.3,
            "economic": 0.2
        }
        
        calculator = Level2Calculator(custom_config)
        equipment = self.create_sample_equipment()
        extracted_data = self.create_sample_extracted_data()
        
        result = calculator.calculate(equipment, extracted_data)
        
        assert result.equipment_id == "V-201"
        assert result.calculation_level == RBILevel.LEVEL_2
        # Custom weights should affect CoF calculation
        assert "safety" in result.cof_scores
        assert "environmental" in result.cof_scores
        assert "economic" in result.cof_scores