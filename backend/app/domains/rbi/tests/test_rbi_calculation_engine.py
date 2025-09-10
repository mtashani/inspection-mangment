"""Tests for RBI Calculation Engine"""

import pytest
from datetime import datetime, timedelta
from unittest.mock import Mock, patch, MagicMock

from app.domains.rbi.services.rbi_calculation_engine import RBICalculationEngine
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
from app.domains.rbi.models.config import RBIConfig


class TestRBICalculationEngine:
    """Test RBI Calculation Engine"""
    
    def setup_method(self):
        """Setup test fixtures"""
        self.config = RBIConfig()
        self.engine = RBICalculationEngine(self.config)
    
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
    
    def create_sample_extracted_data(self) -> ExtractedRBIData:
        """Create sample extracted data"""
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
            corrosion_rate=0.2,
            coating_condition="moderate",
            damage_mechanisms=["General Corrosion"],
            inspection_findings=[],
            last_inspection_date=datetime.now() - timedelta(days=30),
            inspection_quality="good"
        )
    
    def create_sample_calculation_result(self) -> RBICalculationResult:
        """Create sample calculation result"""
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
            input_parameters={},
            missing_data=[],
            estimated_parameters=[],
            inspection_interval_months=24
        )
    
    def test_calculate_next_inspection_date_success(self):
        """Test successful RBI calculation"""
        
        # Setup mocks
        equipment_data = self.create_sample_equipment()
        extracted_data = self.create_sample_extracted_data()
        calculation_result = self.create_sample_calculation_result()
        
        # Mock services directly on the engine instance
        self.engine.equipment_service.get_equipment_data = Mock(return_value=equipment_data)
        self.engine.data_extractor.extract_rbi_data = Mock(return_value=extracted_data)
        self.engine.data_quality_assessor.assess_data_quality = Mock(return_value={
            "overall_score": 0.8,
            "completeness_score": 0.8,
            "accuracy_score": 0.8,
            "timeliness_score": 0.8,
            "issues": [],
            "recommendations": []
        })
        self.engine.level_manager.determine_calculation_level = Mock(return_value={
            "recommended_level": RBILevel.LEVEL_2,
            "missing_requirements": [],
            "data_quality_score": 0.8
        })
        
        # Mock calculator
        self.engine.level2_calculator.calculate = Mock(return_value=calculation_result)
        
        # Execute test
        result = self.engine.calculate_next_inspection_date("V-101", RBILevel.LEVEL_3)
        
        # Verify result
        assert result.equipment_id == "V-101"
        assert result.calculation_level == RBILevel.LEVEL_2
        assert result.requested_level == RBILevel.LEVEL_3
        assert result.fallback_occurred is True
        assert result.confidence_score > 0
        assert result.inspection_interval_months > 0
        
        # Verify service calls
        self.engine.equipment_service.get_equipment_data.assert_called_once_with("V-101")
        self.engine.data_extractor.extract_rbi_data.assert_called_once_with("V-101")
        self.engine.level2_calculator.calculate.assert_called_once()
    
    def test_calculate_next_inspection_date_equipment_not_found(self):
        """Test calculation when equipment is not found"""
        
        self.engine.equipment_service.get_equipment_data = Mock(return_value=None)
        
        result = self.engine.calculate_next_inspection_date("INVALID-ID")
        
        # Should return emergency fallback result
        assert result.equipment_id == "INVALID-ID"
        assert result.fallback_occurred is True
        assert result.confidence_score == 0.1
        assert result.risk_level == RiskLevel.HIGH
        assert "emergency_fallback" in result.input_parameters
    
    def test_calculate_with_fallback_adjustments(self):
        """Test calculation with fallback adjustments applied"""
        
        # Setup mocks
        equipment_data = self.create_sample_equipment()
        extracted_data = self.create_sample_extracted_data()
        calculation_result = self.create_sample_calculation_result()
        
        # Mock services directly on the engine instance
        self.engine.equipment_service.get_equipment_data = Mock(return_value=equipment_data)
        self.engine.data_extractor.extract_rbi_data = Mock(return_value=extracted_data)
        self.engine.data_quality_assessor.assess_data_quality = Mock(return_value={
            "overall_score": 0.6,
            "completeness_score": 0.6,
            "accuracy_score": 0.6,
            "timeliness_score": 0.6,
            "issues": ["Some data missing"],
            "recommendations": ["Improve data collection"]
        })
        self.engine.level_manager.determine_calculation_level = Mock(return_value={
            "recommended_level": RBILevel.LEVEL_1,  # Fallback to Level 1
            "missing_requirements": ["corrosion_rate"],
            "data_quality_score": 0.6
        })
        
        # Mock fallback manager
        self.engine.fallback_manager.get_fallback_adjustments = Mock(return_value={
            "adjustment_factor": 0.8,
            "confidence_reduction": 0.2,
            "reason": "Data quality issues"
        })
        
        # Mock calculator
        calculation_result.calculation_level = RBILevel.LEVEL_1
        calculation_result.fallback_occurred = True
        self.engine.level1_calculator.calculate = Mock(return_value=calculation_result)
        
        # Execute test
        result = self.engine.calculate_next_inspection_date("V-101", RBILevel.LEVEL_3)
        
        # Verify fallback adjustments were applied
        assert result.fallback_occurred is True
        assert result.calculation_level == RBILevel.LEVEL_1
        assert result.requested_level == RBILevel.LEVEL_3
        assert "fallback_adjustments" in result.input_parameters
        
        # Verify fallback manager was called
        self.engine.fallback_manager.get_fallback_adjustments.assert_called_once()
    
    def test_calculate_batch_success(self):
        """Test successful batch calculation"""
        
        # Mock individual calculations
        equipment_ids = ["V-101", "V-102", "V-103"]
        
        def mock_calculate(equipment_id, requested_level=None):
            result = self.create_sample_calculation_result()
            result.equipment_id = equipment_id
            return result
        
        self.engine.calculate_next_inspection_date = Mock(side_effect=mock_calculate)
        
        # Execute test
        results = self.engine.calculate_batch(equipment_ids, RBILevel.LEVEL_2)
        
        # Verify results
        assert len(results) == 3
        assert all(result.equipment_id in equipment_ids for result in results)
        assert self.engine.calculate_next_inspection_date.call_count == 3
    
    def test_calculate_batch_with_failures(self):
        """Test batch calculation with some failures"""
        
        equipment_ids = ["V-101", "V-102", "V-103"]
        
        def mock_calculate(equipment_id, requested_level=None):
            if equipment_id == "V-102":
                raise Exception("Calculation failed")
            result = self.create_sample_calculation_result()
            result.equipment_id = equipment_id
            return result
        
        self.engine.calculate_next_inspection_date = Mock(side_effect=mock_calculate)
        
        # Execute test
        results = self.engine.calculate_batch(equipment_ids)
        
        # Verify results - should still return 3 results (including emergency fallback)
        assert len(results) == 3
        
        # Find the failed calculation result
        failed_result = next(r for r in results if r.equipment_id == "V-102")
        assert "emergency_fallback" in failed_result.input_parameters
        assert failed_result.confidence_score == 0.1
    
    def test_get_fallback_level(self):
        """Test fallback level determination"""
        
        assert self.engine._get_fallback_level(RBILevel.LEVEL_3) == RBILevel.LEVEL_2
        assert self.engine._get_fallback_level(RBILevel.LEVEL_2) == RBILevel.LEVEL_1
        assert self.engine._get_fallback_level(RBILevel.LEVEL_1) == RBILevel.LEVEL_1
    
    def test_get_calculation_summary(self):
        """Test calculation summary generation"""
        
        # Setup mocks
        equipment_data = self.create_sample_equipment()
        extracted_data = self.create_sample_extracted_data()
        
        # Mock services directly on the engine instance
        self.engine.equipment_service.get_equipment_data = Mock(return_value=equipment_data)
        self.engine.data_extractor.extract_rbi_data = Mock(return_value=extracted_data)
        self.engine.data_quality_assessor.assess_data_quality = Mock(return_value={
            "overall_score": 0.8,
            "completeness_score": 0.8,
            "accuracy_score": 0.8,
            "timeliness_score": 0.8,
            "issues": [],
            "recommendations": []
        })
        
        # Mock level determinations
        def mock_level_determination(equipment_data, extracted_data, requested_level):
            if requested_level == RBILevel.LEVEL_3:
                return {
                    "recommended_level": RBILevel.LEVEL_2,  # Can't do Level 3
                    "missing_requirements": ["corrosion_rate"],
                    "data_quality_score": 0.8
                }
            else:
                return {
                    "recommended_level": requested_level,
                    "missing_requirements": [],
                    "data_quality_score": 0.8
                }
        
        self.engine.level_manager.determine_calculation_level = Mock(side_effect=mock_level_determination)
        
        # Execute test
        summary = self.engine.get_calculation_summary("V-101")
        
        # Verify summary
        assert summary["equipment_id"] == "V-101"
        assert summary["equipment_type"] == "pressure_vessel"
        assert summary["service_type"] == "sour_gas"
        assert "data_quality" in summary
        assert "level_capabilities" in summary
        assert "recommended_level" in summary
        
        # Check level capabilities
        capabilities = summary["level_capabilities"]
        assert "Level_1" in capabilities
        assert "Level_2" in capabilities
        assert "Level_3" in capabilities
        
        # Level 3 should not be capable
        assert capabilities["Level_3"]["capable"] is False
        assert "corrosion_rate" in capabilities["Level_3"]["missing_requirements"]
    
    def test_create_emergency_fallback_result(self):
        """Test emergency fallback result creation"""
        
        result = self.engine._create_emergency_fallback_result("V-999", "Test error")
        
        assert result.equipment_id == "V-999"
        assert result.calculation_level == RBILevel.LEVEL_1
        assert result.fallback_occurred is True
        assert result.confidence_score == 0.1
        assert result.risk_level == RiskLevel.HIGH
        assert result.inspection_interval_months == 6
        assert "emergency_fallback" in result.input_parameters
        assert result.input_parameters["error_message"] == "Test error"
    
    def test_finalize_calculation_result(self):
        """Test calculation result finalization"""
        
        equipment_data = self.create_sample_equipment()
        extracted_data = self.create_sample_extracted_data()
        calculation_result = self.create_sample_calculation_result()
        data_quality = {"overall_score": 0.8}
        
        # Execute test
        finalized_result = self.engine._finalize_calculation_result(
            calculation_result, equipment_data, extracted_data, data_quality
        )
        
        # Verify finalization
        assert finalized_result.data_quality_score == 0.8
        assert finalized_result.calculation_timestamp is not None
        assert "workflow_metadata" in finalized_result.input_parameters
        
        metadata = finalized_result.input_parameters["workflow_metadata"]
        assert "engine_version" in metadata
        assert "calculation_timestamp" in metadata
        assert "data_quality_score" in metadata
        assert "equipment_age_years" in metadata