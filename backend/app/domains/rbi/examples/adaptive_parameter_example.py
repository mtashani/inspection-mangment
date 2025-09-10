"""Example usage of Adaptive Parameter Adjustment System"""

import asyncio
from datetime import datetime, timedelta
from typing import Dict, List

from app.domains.rbi.services.adaptive_parameter_adjuster import (
    AdaptiveParameterAdjuster,
    AdjustmentStrategy,
    PredictionBias
)
from app.domains.rbi.services.prediction_tracker import PredictionTracker, PredictionRecord
from app.domains.rbi.models.core import (
    EquipmentData,
    RBICalculationResult,
    RiskLevel,
    RBILevel,
    EquipmentType,
    ServiceType
)


async def demonstrate_adaptive_parameter_adjustment():
    """Demonstrate the adaptive parameter adjustment system"""
    
    print("🔧 Adaptive Parameter Adjustment System Demo")
    print("=" * 60)
    
    # Initialize components
    prediction_tracker = PredictionTracker()
    adjuster = AdaptiveParameterAdjuster(prediction_tracker=prediction_tracker)
    
    # Create sample equipment
    equipment = EquipmentData(
        equipment_id="101-E-401A",
        equipment_type=EquipmentType.PRESSURE_VESSEL,
        service_type=ServiceType.SOUR_GAS,
        installation_date=datetime.now() - timedelta(days=18*365),  # 18 years old
        design_pressure=25.0,
        design_temperature=150.0,
        material="Carbon Steel",
        criticality_level="High"
    )
    
    # Initial RBI parameters
    initial_parameters = {
        "corrosion_rate_factor": 1.2,
        "age_factor": 1.15,
        "inspection_effectiveness": 0.75,
        "material_factor": 1.1,
        "environmental_factor": 1.3
    }
    
    print(f"\n📊 Equipment: {equipment.equipment_id}")
    print(f"Type: {equipment.equipment_type.value}")
    print(f"Service: {equipment.service_type.value}")
    print(f"Age: {equipment.age_years} years")
    
    print(f"\n🎯 Initial Parameters:")
    for param, value in initial_parameters.items():
        print(f"  {param}: {value}")
    
    # Simulate historical predictions with bias
    await simulate_prediction_history(prediction_tracker, equipment.equipment_id)
    
    # Analyze prediction bias
    print(f"\n🔍 Analyzing Prediction Bias...")
    bias = adjuster.analyze_prediction_bias(equipment.equipment_id)
    print(f"Detected bias: {bias.value}")
    
    # Get adjustment recommendations for different strategies
    print(f"\n💡 Getting Adjustment Recommendations...")
    recommendations = adjuster.get_adjustment_recommendations(
        equipment_id=equipment.equipment_id,
        equipment_data=equipment,
        current_parameters=initial_parameters
    )
    
    print(f"Current bias: {recommendations['current_bias']}")
    print(f"Equipment factors: {recommendations['equipment_factors']}")
    
    print(f"\n📋 Strategy Recommendations:")
    for strategy, rec in recommendations['strategy_recommendations'].items():
        print(f"\n  {strategy.upper()}:")
        if rec['recommended']:
            print(f"    ✅ Recommended")
            print(f"    Expected improvement: {rec['expected_improvement']:.1%}")
            print(f"    Confidence: {rec['confidence']:.1%}")
            print(f"    Potential adjustments: {len(rec['potential_adjustments'])}")
        else:
            print(f"    ❌ Not recommended")
            print(f"    Reason: {rec['reason']}")
    
    # Apply adjustments with different strategies
    strategies_to_test = [
        AdjustmentStrategy.CONSERVATIVE,
        AdjustmentStrategy.BALANCED,
        AdjustmentStrategy.AGGRESSIVE
    ]
    
    adjustment_results = {}
    
    for strategy in strategies_to_test:
        print(f"\n🔧 Applying {strategy.value.upper()} Strategy...")
        
        result = adjuster.adjust_parameters(
            equipment_id=equipment.equipment_id,
            current_parameters=initial_parameters,
            strategy=strategy
        )
        
        adjustment_results[strategy] = result
        
        print(f"  Strategy: {result.strategy_used.value}")
        print(f"  Bias detected: {result.bias_detected.value}")
        print(f"  Adjustments made: {len(result.adjustments_made)}")
        print(f"  Overall confidence: {result.overall_confidence:.1%}")
        print(f"  Expected improvement: {result.expected_improvement:.1%}")
        
        if result.adjustments_made:
            print(f"  📝 Parameter Changes:")
            for adj in result.adjustments_made:
                change_pct = (adj.adjusted_value - adj.original_value) / adj.original_value * 100
                print(f"    {adj.parameter_name}:")
                print(f"      {adj.original_value:.3f} → {adj.adjusted_value:.3f} ({change_pct:+.1f}%)")
                print(f"      Reason: {adj.adjustment_reason}")
                print(f"      Confidence: {adj.confidence_level:.1%}")
    
    # Compare strategies
    print(f"\n📊 Strategy Comparison:")
    print(f"{'Strategy':<12} {'Adjustments':<12} {'Confidence':<12} {'Improvement':<12}")
    print("-" * 50)
    
    for strategy, result in adjustment_results.items():
        print(f"{strategy.value:<12} {len(result.adjustments_made):<12} "
              f"{result.overall_confidence:.1%}{'':>4} {result.expected_improvement:.1%}{'':>4}")
    
    # Demonstrate adjustment evaluation
    print(f"\n📈 Evaluating Adjustment Effectiveness...")
    
    # Use balanced strategy for demonstration
    balanced_result = adjustment_results[AdjustmentStrategy.BALANCED]
    
    # Simulate some time passing and evaluate
    evaluation = adjuster.evaluate_adjustment_effectiveness(
        equipment_id=equipment.equipment_id,
        evaluation_period_months=6
    )
    
    print(f"Evaluation status: {evaluation['evaluation_status']}")
    print(f"Effectiveness score: {evaluation['effectiveness_score']:.1%}")
    print(f"Adjustments evaluated: {evaluation.get('adjustments_evaluated', 0)}")
    
    if 'accuracy_improvement' in evaluation:
        print(f"Accuracy improvement: {evaluation['accuracy_improvement']:.1%}")
        print(f"Bias reduction: {evaluation['bias_reduction']:.1%}")
        print(f"Parameter stability: {evaluation['parameter_stability']:.1%}")
    
    print(f"\n💡 Recommendations:")
    for rec in evaluation['recommendations']:
        print(f"  • {rec}")
    
    # Demonstrate rollback functionality
    print(f"\n↩️  Demonstrating Rollback Functionality...")
    
    # Show current parameters after adjustment
    if equipment.equipment_id in adjuster._adjustment_history:
        current_params = adjuster._adjustment_history[equipment.equipment_id].current_parameters
        print(f"Current parameters after adjustment:")
        for param, value in current_params.items():
            print(f"  {param}: {value:.3f}")
    
    # Rollback one adjustment
    rollback_result = adjuster.rollback_adjustments(
        equipment_id=equipment.equipment_id,
        rollback_count=1
    )
    
    print(f"\nRollback result:")
    print(f"  Success: {rollback_result['success']}")
    print(f"  Message: {rollback_result['message']}")
    
    if rollback_result['success']:
        print(f"  Parameters after rollback:")
        for param, value in rollback_result['rolled_back_parameters'].items():
            print(f"    {param}: {value:.3f}")
    
    # Show system statistics
    print(f"\n📊 System Statistics:")
    stats = adjuster.get_system_statistics()
    
    overview = stats['system_overview']
    print(f"  Total equipment managed: {overview['total_equipment_managed']}")
    print(f"  Total adjustments made: {overview['total_adjustments_made']}")
    print(f"  Average effectiveness: {overview['average_effectiveness_score']:.1%}")
    
    param_stats = stats['parameter_statistics']
    print(f"  Most adjusted parameters:")
    for param, count in list(param_stats['most_adjusted_parameters'].items())[:3]:
        print(f"    {param}: {count} times")
    
    # Export adjustment history
    print(f"\n💾 Exporting Adjustment History...")
    
    export_data = adjuster.export_adjustment_history(equipment.equipment_id)
    print(f"Export completed. Data size: {len(export_data)} characters")
    
    # Show sample of exported data
    import json
    parsed_data = json.loads(export_data)
    print(f"Export contains:")
    print(f"  Equipment ID: {parsed_data['equipment_id']}")
    print(f"  Current parameters: {len(parsed_data['current_parameters'])} items")
    print(f"  Adjustment records: {len(parsed_data['adjustment_records'])} records")
    
    print(f"\n✅ Adaptive Parameter Adjustment Demo Complete!")


async def simulate_prediction_history(tracker: PredictionTracker, equipment_id: str):
    """Simulate historical predictions showing over-prediction bias"""
    
    print(f"\n📈 Simulating Historical Predictions...")
    
    # Create prediction records showing over-prediction pattern
    predictions = [
        # Recent predictions (over-predicting)
        PredictionRecord(
            prediction_id="PRED-001",
            equipment_id=equipment_id,
            prediction_date=datetime.now() - timedelta(days=30),
            predicted_risk_level=RiskLevel.HIGH,
            predicted_interval_months=12,
            predicted_next_inspection=datetime.now() + timedelta(days=365),
            calculation_level=RBILevel.LEVEL_2,
            confidence_score=0.82,
            data_quality_score=0.85,
            input_parameters={"corrosion_rate": 0.5, "age": 18}
        ),
        PredictionRecord(
            prediction_id="PRED-002",
            equipment_id=equipment_id,
            prediction_date=datetime.now() - timedelta(days=60),
            predicted_risk_level=RiskLevel.HIGH,
            predicted_interval_months=12,
            predicted_next_inspection=datetime.now() + timedelta(days=365),
            calculation_level=RBILevel.LEVEL_2,
            confidence_score=0.78,
            data_quality_score=0.80,
            input_parameters={"corrosion_rate": 0.48, "age": 18}
        ),
        PredictionRecord(
            prediction_id="PRED-003",
            equipment_id=equipment_id,
            prediction_date=datetime.now() - timedelta(days=90),
            predicted_risk_level=RiskLevel.VERY_HIGH,
            predicted_interval_months=6,
            predicted_next_inspection=datetime.now() + timedelta(days=180),
            calculation_level=RBILevel.LEVEL_2,
            confidence_score=0.85,
            data_quality_score=0.90,
            input_parameters={"corrosion_rate": 0.52, "age": 18}
        ),
        PredictionRecord(
            prediction_id="PRED-004",
            equipment_id=equipment_id,
            prediction_date=datetime.now() - timedelta(days=120),
            predicted_risk_level=RiskLevel.HIGH,
            predicted_interval_months=12,
            predicted_next_inspection=datetime.now() + timedelta(days=365),
            calculation_level=RBILevel.LEVEL_2,
            confidence_score=0.80,
            data_quality_score=0.82,
            input_parameters={"corrosion_rate": 0.47, "age": 17}
        ),
        PredictionRecord(
            prediction_id="PRED-005",
            equipment_id=equipment_id,
            prediction_date=datetime.now() - timedelta(days=150),
            predicted_risk_level=RiskLevel.HIGH,
            predicted_interval_months=12,
            predicted_next_inspection=datetime.now() + timedelta(days=365),
            calculation_level=RBILevel.LEVEL_2,
            confidence_score=0.77,
            data_quality_score=0.78,
            input_parameters={"corrosion_rate": 0.45, "age": 17}
        )
    ]
    
    # Add actual outcomes showing lower risk than predicted (over-prediction)
    actual_outcomes = [
        RiskLevel.MEDIUM,    # Predicted HIGH, actual MEDIUM
        RiskLevel.MEDIUM,    # Predicted HIGH, actual MEDIUM  
        RiskLevel.HIGH,      # Predicted VERY_HIGH, actual HIGH
        RiskLevel.MEDIUM,    # Predicted HIGH, actual MEDIUM
        RiskLevel.MEDIUM     # Predicted HIGH, actual MEDIUM
    ]
    
    # Set actual outcomes for predictions
    for prediction, actual_risk in zip(predictions, actual_outcomes):
        prediction.actual_risk_assessment = actual_risk
        prediction.actual_inspection_date = datetime.now()
    
    # Mock the tracker to return these predictions
    tracker.get_prediction_history = lambda equipment_id: predictions
    
    print(f"  Created {len(predictions)} predictions with actual outcomes")
    print(f"  Pattern: Consistent over-prediction (predicting higher risk than actual)")


async def demonstrate_parameter_sensitivity():
    """Demonstrate how different parameters respond to adjustments"""
    
    print(f"\n🔬 Parameter Sensitivity Analysis")
    print("=" * 50)
    
    adjuster = AdaptiveParameterAdjuster()
    
    # Test different parameter values and biases
    test_parameters = {
        "corrosion_rate_factor": [0.8, 1.0, 1.2, 1.5],
        "age_factor": [0.9, 1.0, 1.1, 1.3],
        "inspection_effectiveness": [0.6, 0.7, 0.8, 0.9],
        "material_factor": [0.8, 1.0, 1.1, 1.2],
        "environmental_factor": [0.8, 1.0, 1.2, 1.4]
    }
    
    biases = [PredictionBias.OVER_PREDICTION, PredictionBias.UNDER_PREDICTION]
    strategy_config = adjuster._adjustment_strategies[AdjustmentStrategy.BALANCED]
    
    print(f"Testing parameter sensitivity to bias adjustments...")
    print(f"Strategy: BALANCED")
    
    for param_name, values in test_parameters.items():
        print(f"\n📊 Parameter: {param_name}")
        print(f"{'Value':<8} {'Over-Pred':<12} {'Under-Pred':<12} {'Change %':<10}")
        print("-" * 45)
        
        for value in values:
            results = {}
            
            for bias in biases:
                adjustment = adjuster._calculate_parameter_adjustment(
                    param_name=param_name,
                    current_value=value,
                    bias=bias,
                    strategy_config=strategy_config
                )
                
                if adjustment:
                    change_pct = (adjustment.adjusted_value - value) / value * 100
                    results[bias] = f"{adjustment.adjusted_value:.3f} ({change_pct:+.1f}%)"
                else:
                    results[bias] = "No change"
            
            over_result = results.get(PredictionBias.OVER_PREDICTION, "No change")
            under_result = results.get(PredictionBias.UNDER_PREDICTION, "No change")
            
            print(f"{value:<8.1f} {over_result:<12} {under_result:<12}")


async def demonstrate_strategy_comparison():
    """Compare different adjustment strategies"""
    
    print(f"\n⚖️  Strategy Comparison Analysis")
    print("=" * 50)
    
    adjuster = AdaptiveParameterAdjuster()
    
    # Test parameters
    test_params = {
        "corrosion_rate_factor": 1.0,
        "age_factor": 1.1,
        "inspection_effectiveness": 0.8,
        "material_factor": 1.0,
        "environmental_factor": 1.2
    }
    
    print(f"Comparing adjustment strategies for over-prediction bias...")
    print(f"Base parameters: {test_params}")
    
    print(f"\n{'Strategy':<12} {'Max Factor':<12} {'Confidence':<12} {'Min Data':<10}")
    print("-" * 50)
    
    for strategy in AdjustmentStrategy:
        config = adjuster._adjustment_strategies[strategy]
        print(f"{strategy.value:<12} {config['max_adjustment_factor']:<12.1%} "
              f"{config['confidence_threshold']:<12.1%} {config['min_data_points']:<10}")
    
    # Show actual adjustments for each strategy
    print(f"\n📊 Actual Adjustments (Over-prediction bias):")
    print(f"{'Parameter':<25} {'Conservative':<12} {'Balanced':<12} {'Aggressive':<12}")
    print("-" * 65)
    
    for param_name, base_value in test_params.items():
        adjustments = {}
        
        for strategy in [AdjustmentStrategy.CONSERVATIVE, AdjustmentStrategy.BALANCED, AdjustmentStrategy.AGGRESSIVE]:
            config = adjuster._adjustment_strategies[strategy]
            adjustment = adjuster._calculate_parameter_adjustment(
                param_name=param_name,
                current_value=base_value,
                bias=PredictionBias.OVER_PREDICTION,
                strategy_config=config
            )
            
            if adjustment:
                change_pct = (adjustment.adjusted_value - base_value) / base_value * 100
                adjustments[strategy] = f"{adjustment.adjusted_value:.3f} ({change_pct:+.1f}%)"
            else:
                adjustments[strategy] = "No change"
        
        conservative = adjustments.get(AdjustmentStrategy.CONSERVATIVE, "No change")
        balanced = adjustments.get(AdjustmentStrategy.BALANCED, "No change")
        aggressive = adjustments.get(AdjustmentStrategy.AGGRESSIVE, "No change")
        
        print(f"{param_name:<25} {conservative:<12} {balanced:<12} {aggressive:<12}")


if __name__ == "__main__":
    print("🚀 Starting Adaptive Parameter Adjustment Examples...")
    
    asyncio.run(demonstrate_adaptive_parameter_adjustment())
    asyncio.run(demonstrate_parameter_sensitivity())
    asyncio.run(demonstrate_strategy_comparison())
    
    print("\n🎉 All examples completed successfully!")