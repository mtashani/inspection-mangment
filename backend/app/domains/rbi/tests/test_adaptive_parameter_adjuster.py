"""Tests for Adaptive Parameter Adjuster"""

import pytest
from datetime import datetime, timedelta
from unittest.mock import Mock, patch

from app.domains.rbi.services.adaptive_parameter_adjuster import (
    AdaptiveParameterAdjuster,
    AdjustmentStrategy,
    PredictionBias,
    ParameterAdjustment,
    AdjustmentResult
)
from app.domains.rbi.services.prediction_tracker import PredictionRecord, PredictionTracker
from app.domains.rbi.models.core import (
    EquipmentData,
    RBICalculationResult,
    RiskLevel,
    RBILevel,
    EquipmentType,
    ServiceType
)


class TestAdaptiveParameterAdjuster:
    """Test cases for AdaptiveParameterAdjuster"""
    
    @pytest.fixture
    def sample_equipment_data(self):
        """Create sample equipment data"""
        return EquipmentData(
            equipment_id="TEST-001",
            equipment_type=EquipmentType.PRESSURE_VESSEL,
            service_type=ServiceType.SOUR_GAS,
            installation_date=datetime.now() - timedelta(days=15*365),  # 15 years old
            design_pressure=25.0,
            design_temperature=150.0,
            material="Carbon Steel",
            criticality_level="High"
        )
    
    @pytest.fixture
    def sample_parameters(self):
        """Create sample RBI parameters"""
        return {
            "corrosion_rate_factor": 1.0,
            "age_factor": 1.1,
            "inspection_effectiveness": 0.8,
            "material_factor": 1.0,
            "environmental_factor": 1.2
        }
    
    @pytest.fixture
    def mock_prediction_tracker(self):
        """Create mock prediction tracker"""
        tracker = Mock(spec=PredictionTracker)
        
        # Mock prediction records showing over-prediction bias
        records = []
        
        # Create records with actual outcomes
        record1 = PredictionRecord(
            prediction_id="PRED-001",
            equipment_id="TEST-001",
            prediction_date=datetime.now() - timedelta(days=30),
            predicted_risk_level=RiskLevel.HIGH,
            predicted_interval_months=12,
            predicted_next_inspection=datetime.now() + timedelta(days=365),
            calculation_level=RBILevel.LEVEL_2,
            confidence_score=0.8,
            data_quality_score=0.85
        )
        record1.actual_risk_assessment = RiskLevel.MEDIUM
        records.append(record1)
        
        record2 = PredictionRecord(
            prediction_id="PRED-002",
            equipment_id="TEST-001",
            prediction_date=datetime.now() - timedelta(days=60),
            predicted_risk_level=RiskLevel.HIGH,
            predicted_interval_months=12,
            predicted_next_inspection=datetime.now() + timedelta(days=365),
            calculation_level=RBILevel.LEVEL_2,
            confidence_score=0.75,
            data_quality_score=0.80
        )
        record2.actual_risk_assessment = RiskLevel.MEDIUM
        records.append(record2)
        
        record3 = PredictionRecord(
            prediction_id="PRED-003",
            equipment_id="TEST-001",
            prediction_date=datetime.now() - timedelta(days=90),
            predicted_risk_level=RiskLevel.VERY_HIGH,
            predicted_interval_months=6,
            predicted_next_inspection=datetime.now() + timedelta(days=180),
            calculation_level=RBILevel.LEVEL_2,
            confidence_score=0.85,
            data_quality_score=0.90
        )
        record3.actual_risk_assessment = RiskLevel.HIGH
        records.append(record3)
        
        tracker.get_prediction_history.return_value = records
        return tracker
    
    @pytest.fixture
    def adjuster(self, mock_prediction_tracker):
        """Create AdaptiveParameterAdjuster instance"""
        return AdaptiveParameterAdjuster(prediction_tracker=mock_prediction_tracker)
    
    def test_initialization(self, adjuster):
        """Test adjuster initialization"""
        assert adjuster is not None
        assert adjuster.prediction_tracker is not None
        assert len(adjuster._adjustment_strategies) == 4
        assert len(adjuster._parameter_rules) == 5
    
    def test_analyze_prediction_bias_over_prediction(self, adjuster):
        """Test bias analysis detecting over-prediction"""
        bias = adjuster.analyze_prediction_bias("TEST-001")
        assert bias == PredictionBias.OVER_PREDICTION
    
    def test_analyze_prediction_bias_insufficient_data(self, adjuster):
        """Test bias analysis with insufficient data"""
        # Mock tracker with no records
        adjuster.prediction_tracker.get_prediction_history.return_value = []
        
        bias = adjuster.analyze_prediction_bias("TEST-002")
        assert bias == PredictionBias.INSUFFICIENT_DATA
    
    def test_analyze_prediction_bias_under_prediction(self, adjuster):
        """Test bias analysis detecting under-prediction"""
        # Mock records showing under-prediction
        records = []
        
        record1 = PredictionRecord(
            prediction_id="PRED-004",
            equipment_id="TEST-001",
            prediction_date=datetime.now() - timedelta(days=30),
            predicted_risk_level=RiskLevel.MEDIUM,
            predicted_interval_months=18,
            predicted_next_inspection=datetime.now() + timedelta(days=540),
            calculation_level=RBILevel.LEVEL_2,
            confidence_score=0.8,
            data_quality_score=0.85
        )
        record1.actual_risk_assessment = RiskLevel.HIGH
        records.append(record1)
        
        record2 = PredictionRecord(
            prediction_id="PRED-005",
            equipment_id="TEST-001",
            prediction_date=datetime.now() - timedelta(days=60),
            predicted_risk_level=RiskLevel.LOW,
            predicted_interval_months=24,
            predicted_next_inspection=datetime.now() + timedelta(days=720),
            calculation_level=RBILevel.LEVEL_2,
            confidence_score=0.75,
            data_quality_score=0.80
        )
        record2.actual_risk_assessment = RiskLevel.MEDIUM
        records.append(record2)
        
        record3 = PredictionRecord(
            prediction_id="PRED-006",
            equipment_id="TEST-001",
            prediction_date=datetime.now() - timedelta(days=90),
            predicted_risk_level=RiskLevel.MEDIUM,
            predicted_interval_months=18,
            predicted_next_inspection=datetime.now() + timedelta(days=540),
            calculation_level=RBILevel.LEVEL_2,
            confidence_score=0.85,
            data_quality_score=0.90
        )
        record3.actual_risk_assessment = RiskLevel.HIGH
        records.append(record3)
        
        adjuster.prediction_tracker.get_prediction_history.return_value = records
        
        bias = adjuster.analyze_prediction_bias("TEST-001")
        assert bias == PredictionBias.UNDER_PREDICTION
    
    def test_adjust_parameters_conservative_strategy(self, adjuster, sample_parameters):
        """Test parameter adjustment with conservative strategy"""
        result = adjuster.adjust_parameters(
            equipment_id="TEST-001",
            current_parameters=sample_parameters,
            strategy=AdjustmentStrategy.CONSERVATIVE
        )
        
        assert isinstance(result, AdjustmentResult)
        assert result.equipment_id == "TEST-001"
        assert result.strategy_used == AdjustmentStrategy.CONSERVATIVE
        assert result.bias_detected == PredictionBias.OVER_PREDICTION
        
        # Should have some adjustments for over-prediction
        if result.adjustments_made:
            assert len(result.adjustments_made) > 0
            assert all(isinstance(adj, ParameterAdjustment) for adj in result.adjustments_made)
    
    def test_adjust_parameters_aggressive_strategy(self, adjuster, sample_parameters):
        """Test parameter adjustment with aggressive strategy"""
        result = adjuster.adjust_parameters(
            equipment_id="TEST-001",
            current_parameters=sample_parameters,
            strategy=AdjustmentStrategy.AGGRESSIVE
        )
        
        assert result.strategy_used == AdjustmentStrategy.AGGRESSIVE
        
        # Aggressive strategy should make larger adjustments
        if result.adjustments_made:
            # Check that adjustment factors are larger than conservative
            conservative_result = adjuster.adjust_parameters(
                equipment_id="TEST-002",
                current_parameters=sample_parameters,
                strategy=AdjustmentStrategy.CONSERVATIVE
            )
            
            if conservative_result.adjustments_made:
                aggressive_adj = result.adjustments_made[0]
                conservative_adj = conservative_result.adjustments_made[0]
                
                # Aggressive should have larger adjustment magnitude
                aggressive_magnitude = abs(aggressive_adj.adjustment_factor - 1.0)
                conservative_magnitude = abs(conservative_adj.adjustment_factor - 1.0)
                assert aggressive_magnitude >= conservative_magnitude
    
    def test_adjust_parameters_insufficient_data(self, adjuster, sample_parameters):
        """Test parameter adjustment with insufficient data"""
        # Mock no prediction data
        adjuster.prediction_tracker.get_equipment_predictions.return_value = []
        
        result = adjuster.adjust_parameters(
            equipment_id="TEST-003",
            current_parameters=sample_parameters,
            strategy=AdjustmentStrategy.BALANCED
        )
        
        assert result.bias_detected == PredictionBias.INSUFFICIENT_DATA
        assert len(result.adjustments_made) == 0
        assert result.overall_confidence == 0.0
    
    def test_parameter_adjustment_bounds(self, adjuster):
        """Test that parameter adjustments respect bounds"""
        # Test with parameter at maximum value
        high_params = {
            "corrosion_rate_factor": 1.9,  # Near max of 2.0
            "material_factor": 1.25  # Near max of 1.3
        }
        
        result = adjuster.adjust_parameters(
            equipment_id="TEST-001",
            current_parameters=high_params,
            strategy=AdjustmentStrategy.BALANCED
        )
        
        # Check that adjusted values don't exceed bounds
        for adjustment in result.adjustments_made:
            param_rules = adjuster._parameter_rules[adjustment.parameter_name]
            assert adjustment.adjusted_value >= param_rules["min_value"]
            assert adjustment.adjusted_value <= param_rules["max_value"]
    
    def test_evaluate_adjustment_effectiveness(self, adjuster, sample_parameters):
        """Test evaluation of adjustment effectiveness"""
        # First make some adjustments
        adjuster.adjust_parameters(
            equipment_id="TEST-001",
            current_parameters=sample_parameters,
            strategy=AdjustmentStrategy.BALANCED
        )
        
        # Then evaluate effectiveness
        evaluation = adjuster.evaluate_adjustment_effectiveness("TEST-001")
        
        assert evaluation["equipment_id"] == "TEST-001"
        assert evaluation["evaluation_status"] == "completed"
        assert "effectiveness_score" in evaluation
        assert "recommendations" in evaluation
        assert isinstance(evaluation["recommendations"], list)
    
    def test_evaluate_adjustment_effectiveness_no_history(self, adjuster):
        """Test evaluation with no adjustment history"""
        evaluation = adjuster.evaluate_adjustment_effectiveness("TEST-999")
        
        assert evaluation["evaluation_status"] == "no_adjustment_history"
        assert evaluation["effectiveness_score"] == 0.0
    
    def test_rollback_adjustments_to_baseline(self, adjuster, sample_parameters):
        """Test rolling back adjustments to baseline"""
        # Make some adjustments first
        adjuster.adjust_parameters(
            equipment_id="TEST-001",
            current_parameters=sample_parameters,
            strategy=AdjustmentStrategy.BALANCED
        )
        
        # Rollback to baseline
        rollback_result = adjuster.rollback_adjustments(
            equipment_id="TEST-001",
            rollback_to_baseline=True
        )
        
        assert rollback_result["success"] is True
        assert "baseline parameters" in rollback_result["message"]
        assert rollback_result["rolled_back_parameters"] == sample_parameters
    
    def test_rollback_adjustments_count(self, adjuster, sample_parameters):
        """Test rolling back specific number of adjustments"""
        # Make multiple adjustments
        adjuster.adjust_parameters(
            equipment_id="TEST-001",
            current_parameters=sample_parameters,
            strategy=AdjustmentStrategy.BALANCED
        )
        
        modified_params = sample_parameters.copy()
        modified_params["corrosion_rate_factor"] = 1.1
        
        adjuster.adjust_parameters(
            equipment_id="TEST-001",
            current_parameters=modified_params,
            strategy=AdjustmentStrategy.BALANCED
        )
        
        # Rollback one adjustment
        rollback_result = adjuster.rollback_adjustments(
            equipment_id="TEST-001",
            rollback_count=1
        )
        
        assert rollback_result["success"] is True
        assert "1 recent adjustment" in rollback_result["message"]
    
    def test_rollback_adjustments_no_history(self, adjuster):
        """Test rollback with no adjustment history"""
        rollback_result = adjuster.rollback_adjustments("TEST-999")
        
        assert rollback_result["success"] is False
        assert "No adjustment history found" in rollback_result["message"]
    
    def test_get_adjustment_recommendations(self, adjuster, sample_equipment_data, sample_parameters):
        """Test getting adjustment recommendations"""
        recommendations = adjuster.get_adjustment_recommendations(
            equipment_id="TEST-001",
            equipment_data=sample_equipment_data,
            current_parameters=sample_parameters
        )
        
        assert recommendations["equipment_id"] == "TEST-001"
        assert recommendations["current_bias"] == PredictionBias.OVER_PREDICTION.value
        assert "equipment_factors" in recommendations
        assert "strategy_recommendations" in recommendations
        assert "general_recommendations" in recommendations
        
        # Check that all strategies are covered
        strategies = recommendations["strategy_recommendations"]
        assert len(strategies) == 4  # All four strategies
        
        for strategy_name, strategy_rec in strategies.items():
            assert "recommended" in strategy_rec
            if strategy_rec["recommended"]:
                assert "potential_adjustments" in strategy_rec
                assert "expected_improvement" in strategy_rec
                assert "confidence" in strategy_rec
    
    def test_export_adjustment_history_specific_equipment(self, adjuster, sample_parameters):
        """Test exporting adjustment history for specific equipment"""
        # Make some adjustments first
        adjuster.adjust_parameters(
            equipment_id="TEST-001",
            current_parameters=sample_parameters,
            strategy=AdjustmentStrategy.BALANCED
        )
        
        # Export history
        export_data = adjuster.export_adjustment_history("TEST-001")
        
        assert isinstance(export_data, str)
        
        # Parse JSON to verify structure
        import json
        parsed_data = json.loads(export_data)
        
        assert parsed_data["equipment_id"] == "TEST-001"
        assert "current_parameters" in parsed_data
        assert "baseline_parameters" in parsed_data
        assert "adjustment_records" in parsed_data
    
    def test_export_adjustment_history_all_equipment(self, adjuster, sample_parameters):
        """Test exporting all adjustment history"""
        # Make adjustments for multiple equipment
        adjuster.adjust_parameters(
            equipment_id="TEST-001",
            current_parameters=sample_parameters,
            strategy=AdjustmentStrategy.BALANCED
        )
        
        adjuster.adjust_parameters(
            equipment_id="TEST-002",
            current_parameters=sample_parameters,
            strategy=AdjustmentStrategy.CONSERVATIVE
        )
        
        # Export all history
        export_data = adjuster.export_adjustment_history()
        
        import json
        parsed_data = json.loads(export_data)
        
        assert "total_equipment_count" in parsed_data
        assert "equipment_histories" in parsed_data
        assert parsed_data["total_equipment_count"] >= 2
    
    def test_get_system_statistics(self, adjuster, sample_parameters):
        """Test getting system statistics"""
        # Make some adjustments to generate statistics
        adjuster.adjust_parameters(
            equipment_id="TEST-001",
            current_parameters=sample_parameters,
            strategy=AdjustmentStrategy.BALANCED
        )
        
        adjuster.adjust_parameters(
            equipment_id="TEST-002",
            current_parameters=sample_parameters,
            strategy=AdjustmentStrategy.CONSERVATIVE
        )
        
        stats = adjuster.get_system_statistics()
        
        assert "system_overview" in stats
        assert "parameter_statistics" in stats
        assert "strategy_usage" in stats
        assert "bias_detection_stats" in stats
        assert "performance_trends" in stats
        
        # Check system overview
        overview = stats["system_overview"]
        assert overview["total_equipment_managed"] >= 2
        assert overview["total_adjustments_made"] >= 2
        assert "average_effectiveness_score" in overview
    
    def test_parameter_adjustment_calculation(self, adjuster):
        """Test individual parameter adjustment calculation"""
        # Test over-prediction adjustment
        adjustment = adjuster._calculate_parameter_adjustment(
            param_name="corrosion_rate_factor",
            current_value=1.0,
            bias=PredictionBias.OVER_PREDICTION,
            strategy_config=adjuster._adjustment_strategies[AdjustmentStrategy.BALANCED]
        )
        
        assert adjustment is not None
        assert adjustment.parameter_name == "corrosion_rate_factor"
        assert adjustment.adjusted_value < adjustment.original_value  # Should decrease for over-prediction
        assert adjustment.adjustment_factor < 1.0
        
        # Test under-prediction adjustment
        adjustment = adjuster._calculate_parameter_adjustment(
            param_name="corrosion_rate_factor",
            current_value=1.0,
            bias=PredictionBias.UNDER_PREDICTION,
            strategy_config=adjuster._adjustment_strategies[AdjustmentStrategy.BALANCED]
        )
        
        assert adjustment is not None
        assert adjustment.adjusted_value > adjustment.original_value  # Should increase for under-prediction
        assert adjustment.adjustment_factor > 1.0
    
    def test_should_adjust_parameters_logic(self, adjuster):
        """Test logic for determining if parameters should be adjusted"""
        strategy_config = adjuster._adjustment_strategies[AdjustmentStrategy.BALANCED]
        
        # Should not adjust for balanced bias
        should_adjust = adjuster._should_adjust_parameters(
            "TEST-001", PredictionBias.BALANCED, strategy_config
        )
        assert should_adjust is False
        
        # Should not adjust for insufficient data
        should_adjust = adjuster._should_adjust_parameters(
            "TEST-001", PredictionBias.INSUFFICIENT_DATA, strategy_config
        )
        assert should_adjust is False
        
        # Should adjust for over-prediction (with sufficient data)
        should_adjust = adjuster._should_adjust_parameters(
            "TEST-001", PredictionBias.OVER_PREDICTION, strategy_config
        )
        assert should_adjust is True
    
    def test_confidence_calculation(self, adjuster):
        """Test adjustment confidence calculation"""
        adjustments = [
            ParameterAdjustment(
                parameter_name="corrosion_rate_factor",
                original_value=1.0,
                adjusted_value=0.9,
                adjustment_factor=0.9,
                adjustment_reason="Test",
                confidence_level=0.8
            ),
            ParameterAdjustment(
                parameter_name="age_factor",
                original_value=1.1,
                adjusted_value=1.05,
                adjustment_factor=0.95,
                adjustment_reason="Test",
                confidence_level=0.75
            )
        ]
        
        confidence = adjuster._calculate_adjustment_confidence(
            adjustments, PredictionBias.OVER_PREDICTION
        )
        
        assert 0.0 <= confidence <= 1.0
        assert confidence > 0.5  # Should have reasonable confidence
    
    def test_improvement_estimation(self, adjuster):
        """Test improvement estimation"""
        adjustments = [
            ParameterAdjustment(
                parameter_name="corrosion_rate_factor",
                original_value=1.0,
                adjusted_value=0.85,
                adjustment_factor=0.85,
                adjustment_reason="Test",
                confidence_level=0.8
            )
        ]
        
        improvement = adjuster._estimate_improvement(
            adjustments, PredictionBias.OVER_PREDICTION
        )
        
        assert improvement > 0.0
        assert improvement <= 1.0  # Should be reasonable improvement estimate


if __name__ == "__main__":
    pytest.main([__file__])