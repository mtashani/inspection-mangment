"""Pattern Recognition Engine Usage Examples"""

import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(__file__)))))

from datetime import datetime, timedelta
from app.domains.rbi.services.pattern_recognition_engine import (
    PatternRecognitionEngine, 
    PatternType,
    PatternConfidence
)
from app.domains.rbi.services.prediction_tracker import PredictionTracker
from app.domains.rbi.models.core import (
    RBICalculationResult,
    EquipmentData,
    ExtractedRBIData,
    ThicknessMeasurement,
    InspectionFinding,
    RBILevel,
    RiskLevel,
    EquipmentType,
    ServiceType
)


def demonstrate_pattern_recognition():
    """Demonstrate comprehensive pattern recognition functionality"""
    
    print("=== Pattern Recognition Engine Demonstration ===\n")
    
    # Initialize engine with prediction tracker
    prediction_tracker = PredictionTracker()
    engine = PatternRecognitionEngine(prediction_tracker)
    
    print(f"Initialized engine with {len(engine._equipment_families)} equipment families")
    print(f"and {len(engine._degradation_patterns)} degradation patterns\n")
    
    # 1. Demonstrate equipment pattern analysis
    print("1. Equipment Pattern Analysis")
    print("-" * 40)
    
    # Create sample equipment
    equipment_data = EquipmentData(
        equipment_id="VESSEL-001",
        equipment_type=EquipmentType.PRESSURE_VESSEL,
        service_type=ServiceType.SOUR_GAS,
        installation_date=datetime.now() - timedelta(days=15*365),
        design_pressure=75.0,
        design_temperature=250.0,
        material="Carbon Steel",
        criticality_level="Critical"
    )
    
    # Create historical calculations showing degradation over time
    historical_calculations = []
    base_date = datetime.now() - timedelta(days=365)
    
    risk_progression = [RiskLevel.LOW, RiskLevel.MEDIUM, RiskLevel.MEDIUM, RiskLevel.HIGH, RiskLevel.HIGH]
    
    for i in range(5):
        calc = RBICalculationResult(
            equipment_id="VESSEL-001",
            calculation_level=RBILevel.LEVEL_2,
            requested_level=RBILevel.LEVEL_2,
            fallback_occurred=False,
            next_inspection_date=base_date + timedelta(days=i*60 + 730),
            risk_level=risk_progression[i],
            pof_score=0.4 + (i * 0.15),
            cof_scores={
                "safety": 0.7 + (i * 0.05),
                "environmental": 0.8,
                "economic": 0.6
            },
            confidence_score=0.85 - (i * 0.02),
            data_quality_score=0.9,
            calculation_timestamp=base_date + timedelta(days=i*60),
            inspection_interval_months=24 - (i * 2),
            missing_data=[],
            estimated_parameters=[]
        )
        historical_calculations.append(calc)
    
    # Create inspection history
    inspection_history = [
        ExtractedRBIData(
            equipment_id="VESSEL-001",
            thickness_measurements=[
                ThicknessMeasurement(
                    location="Shell - Top",
                    thickness=12.5,
                    measurement_date=datetime.now() - timedelta(days=180),
                    minimum_required=10.0
                ),
                ThicknessMeasurement(
                    location="Shell - Bottom",
                    thickness=11.8,
                    measurement_date=datetime.now() - timedelta(days=180),
                    minimum_required=10.0
                )
            ],
            corrosion_rate=0.25,
            coating_condition="moderate",
            damage_mechanisms=["SULFIDE_STRESS_CRACKING", "GENERAL_CORROSION"],
            inspection_findings=[
                InspectionFinding(
                    finding_type="Cracking",
                    severity="High",
                    description="Stress corrosion cracking detected in weld area",
                    location="Circumferential weld",
                    recommendation="Immediate repair required"
                )
            ],
            inspection_quality="good"
        )
    ]
    
    # Analyze patterns
    analysis_result = engine.analyze_equipment_patterns(
        equipment_data=equipment_data,
        historical_calculations=historical_calculations,
        inspection_history=inspection_history
    )
    
    print(f"Analysis completed for {analysis_result.equipment_id}")
    print(f"Analysis date: {analysis_result.analysis_date.strftime('%Y-%m-%d %H:%M')}")
    
    # Display identified families
    print(f"\nIdentified Equipment Families ({len(analysis_result.identified_families)}):")
    for family_match in analysis_result.identified_families:
        print(f"  • {family_match.pattern_id}")
        print(f"    Confidence: {family_match.match_confidence.value}")
        print(f"    Similarity: {family_match.similarity_score:.2%}")
        print(f"    Matching Attributes: {', '.join(family_match.matching_attributes[:3])}")
        if family_match.recommendations:
            print(f"    Recommendations: {family_match.recommendations[0]}")
    
    # Display degradation patterns
    print(f"\nIdentified Degradation Patterns ({len(analysis_result.degradation_patterns)}):")
    for pattern_match in analysis_result.degradation_patterns:
        print(f"  • {pattern_match.pattern_id}")
        print(f"    Confidence: {pattern_match.match_confidence.value}")
        print(f"    Applicability: {pattern_match.similarity_score:.2%}")
        if pattern_match.recommendations:
            print(f"    Recommendations: {pattern_match.recommendations[0]}")
    
    # Display operational patterns
    if analysis_result.operational_patterns:
        print(f"\nOperational Patterns ({len(analysis_result.operational_patterns)}):")
        for op_match in analysis_result.operational_patterns:
            print(f"  • {op_match.pattern_id}")
            print(f"    Pattern Strength: {op_match.similarity_score:.2%}")
    
    # Display anomalies
    if analysis_result.anomalies:
        print(f"\nAnomalies Detected ({len(analysis_result.anomalies)}):")
        for anomaly in analysis_result.anomalies:
            print(f"  ⚠ {anomaly}")
    
    # Display confidence assessment
    print(f"\nConfidence Assessment:")
    for category, confidence in analysis_result.confidence_assessment.items():
        print(f"  {category.replace('_', ' ').title()}: {confidence:.2%}")
    
    # Display parameter recommendations
    if analysis_result.parameter_recommendations:
        print(f"\nParameter Recommendations:")
        for param, value in analysis_result.parameter_recommendations.items():
            print(f"  {param}: {value}")
    
    # Display risk adjustments
    print(f"\nRisk Adjustments:")
    for adjustment, factor in analysis_result.risk_adjustments.items():
        print(f"  {adjustment.replace('_', ' ').title()}: {factor:.2f}x")
    
    print()
    
    # 2. Demonstrate family recommendations
    print("2. Equipment Family Recommendations")
    print("-" * 40)
    
    family_recommendations = engine.get_equipment_family_recommendations(equipment_data)
    
    print(f"Found {len(family_recommendations)} family recommendations:")
    for i, rec in enumerate(family_recommendations, 1):
        print(f"\n{i}. {rec['family_name']}")
        print(f"   Similarity: {rec['similarity_score']:.2%}")
        print(f"   Confidence: {rec['confidence']:.2%}")
        
        if rec['recommended_parameters']:
            print(f"   Key Parameters:")
            for param, value in list(rec['recommended_parameters'].items())[:3]:
                print(f"     • {param}: {value}")
        
        if rec['degradation_patterns']:
            print(f"   Expected Degradation: {', '.join(rec['degradation_patterns'][:2])}")
    
    print()
    
    # 3. Demonstrate service degradation insights
    print("3. Service Degradation Insights")
    print("-" * 40)
    
    insights = engine.get_service_degradation_insights(
        service_type=ServiceType.SOUR_GAS,
        equipment_type=EquipmentType.PRESSURE_VESSEL
    )
    
    print(f"Service: {insights['service_type'].replace('_', ' ').title()}")
    print(f"Equipment Type: {insights['equipment_type'].replace('_', ' ').title()}")
    print(f"Patterns Found: {insights['patterns_found']}")
    print(f"Average Confidence: {insights['average_confidence']:.2%}")
    
    if insights['common_risk_factors']:
        print(f"\nCommon Risk Factors:")
        for factor, count in insights['common_risk_factors']:
            print(f"  • {factor} (appears in {count} patterns)")
    
    if insights['environmental_factors']:
        print(f"\nEnvironmental Factors:")
        for factor in insights['environmental_factors'][:3]:
            print(f"  • {factor}")
    
    if insights['mitigation_strategies']:
        print(f"\nMitigation Strategies:")
        for strategy in insights['mitigation_strategies'][:3]:
            print(f"  • {strategy}")
    
    if insights['typical_degradation_timeline']:
        print(f"\nTypical Degradation Timeline:")
        for age_range, rate in insights['typical_degradation_timeline'].items():
            print(f"  {age_range} years: {rate:.1%} degradation rate")
    
    print(f"\nKey Insights:")
    for insight in insights['insights']:
        print(f"  • {insight}")
    
    print(f"\nRecommendations:")
    for rec in insights['recommendations']:
        print(f"  • {rec}")
    
    print()
    
    # 4. Demonstrate learning from historical data
    print("4. Learning from Historical Data")
    print("-" * 40)
    
    # Create multiple equipment for learning
    equipment_list = []
    calculation_history = {}
    inspection_history_dict = {}
    
    equipment_configs = [
        ("VESSEL-001", EquipmentType.PRESSURE_VESSEL, ServiceType.SOUR_GAS, 15),
        ("VESSEL-002", EquipmentType.PRESSURE_VESSEL, ServiceType.SOUR_GAS, 12),
        ("VESSEL-003", EquipmentType.PRESSURE_VESSEL, ServiceType.SOUR_GAS, 18),
        ("TANK-001", EquipmentType.TANK, ServiceType.WATER, 20),
        ("TANK-002", EquipmentType.TANK, ServiceType.WATER, 25),
        ("PUMP-001", EquipmentType.PUMP, ServiceType.CRUDE_OIL, 8),
        ("PUMP-002", EquipmentType.PUMP, ServiceType.CRUDE_OIL, 10)
    ]
    
    for eq_id, eq_type, service_type, age in equipment_configs:
        equipment = EquipmentData(
            equipment_id=eq_id,
            equipment_type=eq_type,
            service_type=service_type,
            installation_date=datetime.now() - timedelta(days=age*365),
            design_pressure=40.0 if eq_type == EquipmentType.TANK else 60.0,
            design_temperature=150.0 if eq_type == EquipmentType.TANK else 200.0,
            material="Carbon Steel",
            criticality_level="High" if "VESSEL" in eq_id else "Medium"
        )
        equipment_list.append(equipment)
        
        # Create calculation history
        calculations = []
        for i in range(4):
            calc = RBICalculationResult(
                equipment_id=eq_id,
                calculation_level=RBILevel.LEVEL_2,
                requested_level=RBILevel.LEVEL_2,
                fallback_occurred=False,
                next_inspection_date=datetime.now() + timedelta(days=730),
                risk_level=RiskLevel.MEDIUM if age < 15 else RiskLevel.HIGH,
                pof_score=0.4 + (age * 0.02),
                cof_scores={"safety": 0.6, "environmental": 0.5, "economic": 0.7},
                confidence_score=0.8,
                data_quality_score=0.85,
                calculation_timestamp=datetime.now() - timedelta(days=i*90),
                inspection_interval_months=24 if age < 20 else 18,
                missing_data=[],
                estimated_parameters=[]
            )
            calculations.append(calc)
        
        calculation_history[eq_id] = calculations
        
        # Create inspection history
        inspection_data = ExtractedRBIData(
            equipment_id=eq_id,
            thickness_measurements=[
                ThicknessMeasurement(
                    location="Main body",
                    thickness=12.0 - (age * 0.1),
                    measurement_date=datetime.now() - timedelta(days=90),
                    minimum_required=10.0
                )
            ],
            corrosion_rate=0.1 + (age * 0.01),
            inspection_quality="good",
            damage_mechanisms=["GENERAL_CORROSION"] if eq_type == EquipmentType.TANK else ["SULFIDE_STRESS_CRACKING"]
        )
        inspection_history_dict[eq_id] = [inspection_data]
    
    # Learn from historical data
    learning_results = engine.learn_from_historical_data(
        equipment_data_list=equipment_list,
        calculation_history=calculation_history,
        inspection_history=inspection_history_dict
    )
    
    print("Learning Results:")
    print(f"  Equipment Analyzed: {learning_results['learning_summary']['total_equipment_analyzed']}")
    print(f"  New Families Discovered: {learning_results['new_families_discovered']}")
    print(f"  New Patterns Identified: {learning_results['new_patterns_identified']}")
    print(f"  Existing Patterns Refined: {learning_results['existing_patterns_refined']}")
    print(f"  Confidence Improvements: {learning_results['confidence_improvements']}")
    
    print(f"\nLearning Summary:")
    summary = learning_results['learning_summary']
    print(f"  Total Families: {summary['total_families']}")
    print(f"  Total Degradation Patterns: {summary['total_degradation_patterns']}")
    print(f"  Average Family Confidence: {summary['average_family_confidence']:.2%}")
    print(f"  Average Pattern Confidence: {summary['average_pattern_confidence']:.2%}")
    
    print()
    
    # 5. Demonstrate pattern feedback and updates
    print("5. Pattern Feedback and Updates")
    print("-" * 40)
    
    # Simulate feedback from prediction accuracy
    feedback_success = engine.update_pattern_from_feedback(
        equipment_id="VESSEL-001",
        pattern_id="PV_SOUR_GAS",
        feedback_data={
            "recommended_parameters": {
                "inspection_interval_months": 15,  # Reduced based on experience
                "corrosion_allowance": 8.0  # Increased based on findings
            }
        },
        accuracy_score=0.92
    )
    
    print(f"Pattern feedback update successful: {feedback_success}")
    
    # Update degradation pattern
    degradation_feedback = engine.update_pattern_from_feedback(
        equipment_id="VESSEL-001",
        pattern_id="SULFIDE_STRESS_CRACKING",
        feedback_data={
            "degradation_characteristics": {
                "detection_improvement": "TOFD technique shows better results",
                "progression_rate": "faster_than_expected_in_high_temp"
            }
        },
        accuracy_score=0.88
    )
    
    print(f"Degradation pattern feedback update successful: {degradation_feedback}")
    
    # Show updated pattern performance
    if "PV_SOUR_GAS" in engine._pattern_performance:
        performance = engine._pattern_performance["PV_SOUR_GAS"]
        print(f"Updated pattern performance for PV_SOUR_GAS: {performance}")
    
    print()
    
    # 6. Demonstrate pattern statistics
    print("6. Pattern Statistics")
    print("-" * 40)
    
    stats = engine.get_pattern_statistics()
    
    print("Family Statistics:")
    family_stats = stats["families"]
    print(f"  Total Count: {family_stats['total_count']}")
    print(f"  Average Confidence: {family_stats['average_confidence']:.2%}")
    print(f"  High Confidence Count: {family_stats['high_confidence_count']}")
    
    print(f"  By Equipment Type:")
    for eq_type, count in family_stats['by_equipment_type'].items():
        print(f"    {eq_type.replace('_', ' ').title()}: {count}")
    
    print(f"\nDegradation Pattern Statistics:")
    pattern_stats = stats["degradation_patterns"]
    print(f"  Total Count: {pattern_stats['total_count']}")
    print(f"  Average Confidence: {pattern_stats['average_confidence']:.2%}")
    print(f"  High Confidence Count: {pattern_stats['high_confidence_count']}")
    
    print(f"  By Service Type:")
    for service_type, count in pattern_stats['by_service_type'].items():
        print(f"    {service_type.replace('_', ' ').title()}: {count}")
    
    print(f"\nEquipment Coverage:")
    coverage = stats["equipment_coverage"]
    print(f"  Equipment with Patterns: {coverage['total_equipment_with_patterns']}")
    print(f"  Average Patterns per Equipment: {coverage['average_patterns_per_equipment']:.1f}")
    
    print(f"\nPerformance Metrics:")
    performance = stats["performance_metrics"]
    print(f"  Patterns with Performance Data: {performance['patterns_with_performance_data']}")
    print(f"  Average Pattern Accuracy: {performance['average_pattern_accuracy']:.2%}")
    
    print()
    
    # 7. Demonstrate pattern export/import
    print("7. Pattern Export and Import")
    print("-" * 40)
    
    # Export patterns
    exported_data = engine.export_patterns()
    export_size = len(exported_data)
    print(f"Exported pattern data size: {export_size:,} characters")
    
    # Show sample of exported data
    print(f"Export sample (first 200 characters):")
    print(f"  {exported_data[:200]}...")
    
    # Import patterns (simulate importing to new engine)
    new_engine = PatternRecognitionEngine()
    original_family_count = len(new_engine._equipment_families)
    original_pattern_count = len(new_engine._degradation_patterns)
    
    import_results = new_engine.import_patterns(exported_data)
    
    print(f"\nImport Results:")
    print(f"  Families Imported: {import_results['families_imported']}")
    print(f"  Patterns Imported: {import_results['patterns_imported']}")
    print(f"  Families Updated: {import_results['families_updated']}")
    print(f"  Patterns Updated: {import_results['patterns_updated']}")
    
    final_family_count = len(new_engine._equipment_families)
    final_pattern_count = len(new_engine._degradation_patterns)
    
    print(f"  Final Family Count: {final_family_count} (was {original_family_count})")
    print(f"  Final Pattern Count: {final_pattern_count} (was {original_pattern_count})")
    
    print()
    
    print("=== Pattern Recognition Engine Demonstration Complete ===")


def demonstrate_advanced_pattern_analysis():
    """Demonstrate advanced pattern analysis capabilities"""
    
    print("\n=== Advanced Pattern Analysis Demo ===\n")
    
    engine = PatternRecognitionEngine()
    
    # Create equipment with complex degradation history
    equipment = EquipmentData(
        equipment_id="COMPLEX-VESSEL",
        equipment_type=EquipmentType.PRESSURE_VESSEL,
        service_type=ServiceType.SOUR_GAS,
        installation_date=datetime.now() - timedelta(days=20*365),
        design_pressure=100.0,
        design_temperature=300.0,
        material="Low Alloy Steel",
        criticality_level="Critical"
    )
    
    # Create complex calculation history showing multiple patterns
    calculations = []
    base_date = datetime.now() - timedelta(days=1095)  # 3 years ago
    
    # Simulate different operational phases
    phases = [
        {"name": "Initial Operation", "months": 12, "base_risk": RiskLevel.LOW, "confidence": 0.9},
        {"name": "Degradation Onset", "months": 18, "base_risk": RiskLevel.MEDIUM, "confidence": 0.8},
        {"name": "Accelerated Degradation", "months": 12, "base_risk": RiskLevel.HIGH, "confidence": 0.7}
    ]
    
    calc_index = 0
    for phase in phases:
        for month in range(phase["months"]):
            if month % 3 == 0:  # Quarterly calculations
                calc = RBICalculationResult(
                    equipment_id="COMPLEX-VESSEL",
                    calculation_level=RBILevel.LEVEL_2,
                    requested_level=RBILevel.LEVEL_2,
                    fallback_occurred=month > 30,  # Fallback in later stages
                    next_inspection_date=base_date + timedelta(days=calc_index*90 + 730),
                    risk_level=phase["base_risk"],
                    pof_score=0.3 + (calc_index * 0.05),
                    cof_scores={
                        "safety": 0.8 + (calc_index * 0.01),
                        "environmental": 0.9,
                        "economic": 0.7
                    },
                    confidence_score=phase["confidence"] - (month * 0.01),
                    data_quality_score=0.9 - (calc_index * 0.01),
                    calculation_timestamp=base_date + timedelta(days=calc_index*30),
                    inspection_interval_months=24 - (calc_index // 4),
                    missing_data=["thickness_data"] if month > 30 else [],
                    estimated_parameters=["corrosion_rate"] if month > 30 else []
                )
                calculations.append(calc)
                calc_index += 1
    
    # Create detailed inspection history
    inspection_history = []
    for i in range(3):  # 3 major inspections
        inspection = ExtractedRBIData(
            equipment_id="COMPLEX-VESSEL",
            thickness_measurements=[
                ThicknessMeasurement(
                    location=f"Zone {j+1}",
                    thickness=15.0 - (i * 0.8) - (j * 0.2),
                    measurement_date=base_date + timedelta(days=i*365),
                    minimum_required=12.0
                ) for j in range(4)
            ],
            corrosion_rate=0.1 + (i * 0.15),
            coating_condition="excellent" if i == 0 else "moderate" if i == 1 else "poor",
            damage_mechanisms=[
                "GENERAL_CORROSION",
                "SULFIDE_STRESS_CRACKING" if i > 0 else None,
                "PITTING" if i > 1 else None
            ],
            inspection_findings=[
                InspectionFinding(
                    finding_type="Corrosion",
                    severity="Low" if i == 0 else "Medium" if i == 1 else "High",
                    description=f"Inspection {i+1} findings",
                    location="Multiple locations"
                )
            ],
            inspection_quality="good"
        )
        inspection_history.append(inspection)
    
    # Perform comprehensive analysis
    analysis = engine.analyze_equipment_patterns(
        equipment_data=equipment,
        historical_calculations=calculations,
        inspection_history=inspection_history
    )
    
    print("Complex Equipment Analysis Results:")
    print(f"Equipment: {analysis.equipment_id}")
    print(f"Data Points: {len(calculations)} calculations, {len(inspection_history)} inspections")
    
    # Detailed family analysis
    print(f"\nFamily Pattern Analysis:")
    for family_match in analysis.identified_families:
        print(f"  Family: {family_match.pattern_id}")
        print(f"    Confidence: {family_match.match_confidence.value}")
        print(f"    Similarity: {family_match.similarity_score:.2%}")
        print(f"    Deviations: {len(family_match.deviations)}")
        if family_match.deviations:
            for deviation in family_match.deviations[:2]:
                print(f"      • {deviation}")
    
    # Detailed degradation analysis
    print(f"\nDegradation Pattern Analysis:")
    for deg_match in analysis.degradation_patterns:
        print(f"  Pattern: {deg_match.pattern_id}")
        print(f"    Applicability: {deg_match.similarity_score:.2%}")
        print(f"    Risk Factors: {len(deg_match.matching_attributes)}")
        for factor in deg_match.matching_attributes[:3]:
            print(f"      • {factor}")
    
    # Operational pattern insights
    if analysis.operational_patterns:
        print(f"\nOperational Patterns:")
        for op_match in analysis.operational_patterns:
            print(f"  Pattern: {op_match.pattern_id}")
            print(f"    Strength: {op_match.similarity_score:.2%}")
            print(f"    Insights: {op_match.matching_attributes[0] if op_match.matching_attributes else 'N/A'}")
    
    # Risk adjustment recommendations
    print(f"\nRisk Adjustments:")
    for adjustment, factor in analysis.risk_adjustments.items():
        impact = "increase" if factor > 1.0 else "decrease" if factor < 1.0 else "no change"
        print(f"  {adjustment.replace('_', ' ').title()}: {factor:.2f}x ({impact})")
    
    # Parameter optimization
    print(f"\nOptimized Parameters:")
    for param, value in analysis.parameter_recommendations.items():
        print(f"  {param.replace('_', ' ').title()}: {value}")
    
    print("\n=== Advanced Pattern Analysis Demo Complete ===")


if __name__ == "__main__":
    demonstrate_pattern_recognition()
    demonstrate_advanced_pattern_analysis()