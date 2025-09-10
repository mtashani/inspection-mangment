"""Tests for RBI domain models"""

import pytest
from datetime import datetime, timedelta
from app.domains.rbi.models.core import (
    RBICalculationResult,
    EquipmentData,
    ExtractedRBIData,
    ThicknessMeasurement,
    InspectionFinding,
    RiskLevel,
    RBILevel,
    EquipmentType,
    ServiceType
)
from app.domains.rbi.models.config import (
    ScoringTable,
    RBIConfig,
    LevelRequirements,
    ScoringTablesConfig,
    RiskMatrixConfig
)


class TestThicknessMeasurement:
    """Test ThicknessMeasurement model"""
    
    def test_valid_thickness_measurement(self):
        """Test creating valid thickness measurement"""
        measurement = ThicknessMeasurement(
            location="Shell_Top",
            thickness=12.5,
            measurement_date=datetime.now(),
            minimum_required=10.0,
            measurement_method="UT",
            inspector="John Doe"
        )
        
        assert measurement.location == "Shell_Top"
        assert measurement.thickness == 12.5
        assert measurement.minimum_required == 10.0
    
    def test_invalid_thickness_values(self):
        """Test validation of thickness values"""
        with pytest.raises(ValueError, match="Thickness must be positive"):
            ThicknessMeasurement(
                location="Shell_Top",
                thickness=-1.0,
                measurement_date=datetime.now(),
                minimum_required=10.0
            )
        
        with pytest.raises(ValueError, match="Minimum required thickness must be positive"):
            ThicknessMeasurement(
                location="Shell_Top",
                thickness=12.5,
                measurement_date=datetime.now(),
                minimum_required=-5.0
            )
    
    def test_critically_low_thickness(self):
        """Test validation for critically low thickness"""
        with pytest.raises(ValueError, match="Thickness critically low"):
            ThicknessMeasurement(
                location="Shell_Top",
                thickness=2.0,  # Less than 50% of minimum required (10.0)
                measurement_date=datetime.now(),
                minimum_required=10.0
            )


class TestInspectionFinding:
    """Test InspectionFinding model"""
    
    def test_valid_inspection_finding(self):
        """Test creating valid inspection finding"""
        finding = InspectionFinding(
            finding_type="Corrosion",
            severity="Medium",
            description="Localized corrosion observed",
            location="Nozzle_N1",
            recommendation="Monitor during next inspection"
        )
        
        assert finding.finding_type == "Corrosion"
        assert finding.severity == "Medium"
        assert finding.description == "Localized corrosion observed"
    
    def test_invalid_severity(self):
        """Test validation of severity levels"""
        with pytest.raises(ValueError, match="Severity must be one of"):
            InspectionFinding(
                finding_type="Corrosion",
                severity="Invalid",
                description="Test finding"
            )


class TestEquipmentData:
    """Test EquipmentData model"""
    
    def test_valid_equipment_data(self):
        """Test creating valid equipment data"""
        equipment = EquipmentData(
            equipment_id="V-101",
            equipment_type=EquipmentType.PRESSURE_VESSEL,
            service_type=ServiceType.SOUR_GAS,
            installation_date=datetime(2010, 1, 1),
            design_pressure=25.0,
            design_temperature=150.0,
            material="CS",
            criticality_level="High"
        )
        
        assert equipment.equipment_id == "V-101"
        assert equipment.equipment_type == EquipmentType.PRESSURE_VESSEL
        assert equipment.service_type == ServiceType.SOUR_GAS
        assert equipment.age_years > 14  # Should be around 14+ years
    
    def test_invalid_equipment_data(self):
        """Test validation of equipment data"""
        with pytest.raises(ValueError, match="Equipment ID is required"):
            EquipmentData(
                equipment_id="",
                equipment_type=EquipmentType.PRESSURE_VESSEL,
                service_type=ServiceType.SOUR_GAS,
                installation_date=datetime(2010, 1, 1),
                design_pressure=25.0,
                design_temperature=150.0,
                material="CS"
            )
        
        with pytest.raises(ValueError, match="Design pressure must be positive"):
            EquipmentData(
                equipment_id="V-101",
                equipment_type=EquipmentType.PRESSURE_VESSEL,
                service_type=ServiceType.SOUR_GAS,
                installation_date=datetime(2010, 1, 1),
                design_pressure=-5.0,
                design_temperature=150.0,
                material="CS"
            )


class TestExtractedRBIData:
    """Test ExtractedRBIData model"""
    
    def test_valid_extracted_data(self):
        """Test creating valid extracted RBI data"""
        data = ExtractedRBIData(
            equipment_id="V-101",
            corrosion_rate=0.15,
            coating_condition="moderate",
            damage_mechanisms=["General Corrosion", "Pitting"],
            inspection_quality="good"
        )
        
        assert data.equipment_id == "V-101"
        assert data.corrosion_rate == 0.15
        assert data.coating_condition == "moderate"
        assert len(data.damage_mechanisms) == 2
    
    def test_invalid_corrosion_rate(self):
        """Test validation of corrosion rate"""
        with pytest.raises(ValueError, match="Corrosion rate cannot be negative"):
            ExtractedRBIData(
                equipment_id="V-101",
                corrosion_rate=-0.1
            )
    
    def test_invalid_coating_condition(self):
        """Test validation of coating condition"""
        with pytest.raises(ValueError, match="Coating condition must be one of"):
            ExtractedRBIData(
                equipment_id="V-101",
                coating_condition="invalid"
            )


class TestRBICalculationResult:
    """Test RBICalculationResult model"""
    
    def test_valid_calculation_result(self):
        """Test creating valid RBI calculation result"""
        result = RBICalculationResult(
            equipment_id="V-101",
            calculation_level=RBILevel.LEVEL_2,
            requested_level=RBILevel.LEVEL_3,
            fallback_occurred=True,
            next_inspection_date=datetime.now() + timedelta(days=365),
            risk_level=RiskLevel.MEDIUM,
            pof_score=3.2,
            cof_scores={"safety": 2.5, "environmental": 3.0, "economic": 2.0},
            confidence_score=0.75,
            data_quality_score=0.65,
            calculation_timestamp=datetime.now(),
            inspection_interval_months=24
        )
        
        assert result.equipment_id == "V-101"
        assert result.fallback_occurred is True
        assert result.risk_level == RiskLevel.MEDIUM
        assert result.overall_cof_score > 0  # Should calculate weighted average
    
    def test_invalid_scores(self):
        """Test validation of scores"""
        with pytest.raises(ValueError, match="PoF score must be between 0 and 5"):
            RBICalculationResult(
                equipment_id="V-101",
                calculation_level=RBILevel.LEVEL_2,
                requested_level=RBILevel.LEVEL_2,
                fallback_occurred=False,
                next_inspection_date=datetime.now(),
                risk_level=RiskLevel.MEDIUM,
                pof_score=6.0,  # Invalid score
                cof_scores={"safety": 2.5},
                confidence_score=0.75,
                data_quality_score=0.65,
                calculation_timestamp=datetime.now()
            )
    
    def test_overall_cof_calculation(self):
        """Test overall CoF score calculation"""
        result = RBICalculationResult(
            equipment_id="V-101",
            calculation_level=RBILevel.LEVEL_2,
            requested_level=RBILevel.LEVEL_2,
            fallback_occurred=False,
            next_inspection_date=datetime.now(),
            risk_level=RiskLevel.MEDIUM,
            pof_score=3.0,
            cof_scores={"safety": 4.0, "environmental": 2.0, "economic": 3.0},
            confidence_score=0.75,
            data_quality_score=0.65,
            calculation_timestamp=datetime.now()
        )
        
        # Should be weighted average: 4.0*0.4 + 2.0*0.35 + 3.0*0.25 = 3.05
        expected_cof = 4.0 * 0.4 + 2.0 * 0.35 + 3.0 * 0.25
        assert abs(result.overall_cof_score - expected_cof) < 0.01


class TestScoringTable:
    """Test ScoringTable model"""
    
    def test_valid_scoring_table(self):
        """Test creating valid scoring table"""
        table = ScoringTable(
            parameter_name="corrosion_rate",
            scoring_rules={
                "0-0.05": 1,
                "0.05-0.1": 2,
                "0.1-0.2": 3,
                "0.2-0.5": 4,
                ">0.5": 5
            },
            description="Corrosion rate scoring"
        )
        
        assert table.parameter_name == "corrosion_rate"
        assert table.get_score("0-0.05") == 1
        assert table.get_score("unknown") == 3  # Default score
    
    def test_invalid_scoring_table(self):
        """Test validation of scoring table"""
        with pytest.raises(ValueError, match="Parameter name is required"):
            ScoringTable(
                parameter_name="",
                scoring_rules={"low": 1, "high": 5}
            )
        
        with pytest.raises(ValueError, match="Score for .* must be between 1 and 5"):
            ScoringTable(
                parameter_name="test",
                scoring_rules={"invalid": 10}  # Score out of range
            )


class TestRBIConfig:
    """Test RBIConfig model"""
    
    def test_default_config_creation(self):
        """Test creating RBI config with defaults"""
        config = RBIConfig()
        
        # Should have default level requirements
        assert RBILevel.LEVEL_1 in config.level_requirements
        assert RBILevel.LEVEL_2 in config.level_requirements
        assert RBILevel.LEVEL_3 in config.level_requirements
        
        # Should have default scoring tables
        assert "corrosion_rate" in config.scoring_tables.pof_tables
        assert "safety" in config.scoring_tables.cof_tables
        
        # Should have default risk matrix
        assert config.risk_matrix.inspection_intervals[RiskLevel.LOW] == 36
        assert config.risk_matrix.inspection_intervals[RiskLevel.HIGH] == 12
    
    def test_risk_matrix_functionality(self):
        """Test risk matrix operations"""
        config = RBIConfig()
        
        # Test risk level determination
        risk_level = config.risk_matrix.get_risk_level("High", "Medium")
        assert risk_level == RiskLevel.HIGH
        
        # Test inspection interval retrieval
        interval = config.risk_matrix.inspection_intervals[RiskLevel.MEDIUM]
        assert interval == 24