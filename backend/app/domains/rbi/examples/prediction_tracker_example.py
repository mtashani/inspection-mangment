"""Prediction Tracker Service Usage Examples"""

import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(__file__)))))

from datetime import datetime, timedelta
from app.domains.rbi.services.prediction_tracker import PredictionTracker, PredictionOutcome
from app.domains.rbi.models.core import (
    RBICalculationResult,
    EquipmentData,
    InspectionFinding,
    ThicknessMeasurement,
    RBILevel,
    RiskLevel,
    EquipmentType,
    ServiceType
)


def demonstrate_prediction_tracking():
    """Demonstrate comprehensive prediction tracking functionality"""
    
    print("=== Prediction Tracker Service Demonstration ===\n")
    
    # Initialize tracker
    tracker = PredictionTracker()
    
    # 1. Demonstrate recording predictions
    print("1. Recording RBI Predictions")
    print("-" * 40)
    
    # Create sample equipment data
    equipment_data = EquipmentData(
        equipment_id="VESSEL-001",
        equipment_type=EquipmentType.PRESSURE_VESSEL,
        service_type=ServiceType.SOUR_GAS,
        installation_date=datetime.now() - timedelta(days=15*365),
        design_pressure=50.0,
        design_temperature=200.0,
        material="Carbon Steel",
        criticality_level="High"
    )
    
    # Create sample calculation result
    calculation_result = RBICalculationResult(
        equipment_id="VESSEL-001",
        calculation_level=RBILevel.LEVEL_2,
        requested_level=RBILevel.LEVEL_2,
        fallback_occurred=False,
        next_inspection_date=datetime.now() + timedelta(days=730),
        risk_level=RiskLevel.MEDIUM,
        pof_score=0.65,
        cof_scores={
            "safety": 0.7,
            "environmental": 0.6,
            "economic": 0.8
        },
        confidence_score=0.85,
        data_quality_score=0.9,
        calculation_timestamp=datetime.now() - timedelta(days=30),
        inspection_interval_months=24,
        missing_data=[],
        estimated_parameters=[]
    )
    
    # Record prediction
    prediction_id = tracker.record_prediction(
        calculation_result=calculation_result,
        equipment_data=equipment_data,
        prediction_context={
            "inspector": "John Smith",
            "inspection_method": "UT",
            "weather_conditions": "clear"
        }
    )
    
    print(f"✓ Recorded prediction: {prediction_id}")
    print(f"  Equipment: {calculation_result.equipment_id}")
    print(f"  Predicted Risk: {calculation_result.risk_level.value}")
    print(f"  Predicted Interval: {calculation_result.inspection_interval_months} months")
    print(f"  Confidence Score: {calculation_result.confidence_score:.2f}")
    print()
    
    # 2. Demonstrate multiple predictions for trend analysis
    print("2. Creating Multiple Predictions for Analysis")
    print("-" * 40)
    
    equipment_list = [
        ("PUMP-001", EquipmentType.PUMP, ServiceType.CRUDE_OIL),
        ("TANK-001", EquipmentType.TANK, ServiceType.WATER),
        ("VESSEL-002", EquipmentType.PRESSURE_VESSEL, ServiceType.SWEET_GAS)
    ]
    
    prediction_ids = []
    
    for eq_id, eq_type, service_type in equipment_list:
        # Create equipment data
        eq_data = EquipmentData(
            equipment_id=eq_id,
            equipment_type=eq_type,
            service_type=service_type,
            installation_date=datetime.now() - timedelta(days=10*365),
            design_pressure=30.0,
            design_temperature=150.0,
            material="Stainless Steel",
            criticality_level="Medium"
        )
        
        # Create multiple predictions over time
        for i in range(3):
            calc_result = RBICalculationResult(
                equipment_id=eq_id,
                calculation_level=RBILevel.LEVEL_2,
                requested_level=RBILevel.LEVEL_2,
                fallback_occurred=False,
                next_inspection_date=datetime.now() + timedelta(days=600 + i*30),
                risk_level=RiskLevel.MEDIUM if i < 2 else RiskLevel.HIGH,
                pof_score=0.5 + (i * 0.1),
                cof_scores={"safety": 0.6 + (i * 0.05), "environmental": 0.5},
                confidence_score=0.8 - (i * 0.05),
                data_quality_score=0.85,
                calculation_timestamp=datetime.now() - timedelta(days=90 - i*30),
                inspection_interval_months=24 - (i * 2),
                missing_data=[],
                estimated_parameters=[]
            )
            
            pred_id = tracker.record_prediction(calc_result, eq_data)
            prediction_ids.append(pred_id)
    
    print(f"✓ Created {len(prediction_ids)} predictions for {len(equipment_list)} equipment items")
    print()
    
    # 3. Demonstrate updating with actual outcomes
    print("3. Updating Predictions with Actual Inspection Outcomes")
    print("-" * 40)
    
    # Update some predictions with actual outcomes
    sample_outcomes = [
        {
            "prediction_id": prediction_id,
            "actual_inspection_date": datetime.now() + timedelta(days=700),
            "findings": [
                InspectionFinding(
                    finding_type="General Corrosion",
                    severity="Medium",
                    description="Moderate corrosion observed on external surface",
                    location="Bottom section",
                    recommendation="Continue monitoring, next inspection in 18 months"
                )
            ],
            "actual_risk": RiskLevel.MEDIUM
        },
        {
            "prediction_id": prediction_ids[1],
            "actual_inspection_date": datetime.now() + timedelta(days=650),
            "findings": [
                InspectionFinding(
                    finding_type="Pitting Corrosion",
                    severity="High",
                    description="Localized pitting detected",
                    location="Weld area",
                    recommendation="Repair required, reduce inspection interval"
                ),
                InspectionFinding(
                    finding_type="Coating Degradation",
                    severity="Medium",
                    description="Coating failure in several areas",
                    location="External surface",
                    recommendation="Recoat during next shutdown"
                )
            ],
            "actual_risk": RiskLevel.HIGH
        },
        {
            "prediction_id": prediction_ids[2],
            "actual_inspection_date": datetime.now() + timedelta(days=680),
            "findings": [],
            "actual_risk": RiskLevel.LOW
        }
    ]
    
    for outcome in sample_outcomes:
        success = tracker.update_actual_outcome(
            prediction_id=outcome["prediction_id"],
            actual_inspection_date=outcome["actual_inspection_date"],
            inspection_findings=outcome["findings"],
            actual_risk_assessment=outcome["actual_risk"]
        )
        
        if success:
            print(f"✓ Updated prediction {outcome['prediction_id'][:12]}...")
            print(f"  Actual Risk: {outcome['actual_risk'].value}")
            print(f"  Findings: {len(outcome['findings'])} items")
    
    print()
    
    # 4. Demonstrate equipment accuracy assessment
    print("4. Equipment Accuracy Assessment")
    print("-" * 40)
    
    # Get accuracy assessment for VESSEL-001
    assessment = tracker.get_equipment_accuracy("VESSEL-001")
    
    print(f"Equipment: {assessment.equipment_id}")
    print(f"Assessment Period: {assessment.assessment_period['start'].strftime('%Y-%m-%d')} to {assessment.assessment_period['end'].strftime('%Y-%m-%d')}")
    print(f"Total Predictions: {assessment.total_predictions}")
    print(f"Verified Predictions: {assessment.verified_predictions}")
    
    if assessment.accuracy_metrics:
        print("\nAccuracy Metrics:")
        for metric, value in assessment.accuracy_metrics.items():
            print(f"  {metric.replace('_', ' ').title()}: {value:.2%}")
        
        print(f"\nConfidence Correlation: {assessment.confidence_correlation:.3f}")
        
        print("\nOutcome Distribution:")
        for outcome, count in assessment.outcome_distribution.items():
            print(f"  {outcome.replace('_', ' ').title()}: {count}")
        
        print("\nRecommendations:")
        for i, rec in enumerate(assessment.recommendations[:3], 1):
            print(f"  {i}. {rec}")
    
    print()
    
    # 5. Demonstrate system-wide accuracy report
    print("5. System-Wide Accuracy Report")
    print("-" * 40)
    
    report = tracker.get_system_accuracy_report()
    
    print(f"Report Date: {report.report_date.strftime('%Y-%m-%d %H:%M')}")
    print(f"Total Equipment Tracked: {report.total_equipment_tracked}")
    print(f"Total Predictions: {report.total_predictions}")
    print(f"Verified Predictions: {report.verified_predictions}")
    
    if report.overall_accuracy_metrics:
        print("\nOverall Accuracy Metrics:")
        for metric, value in report.overall_accuracy_metrics.items():
            print(f"  {metric.replace('_', ' ').title()}: {value:.2%}")
        
        print("\nAccuracy by Equipment Type:")
        for eq_type, accuracy in report.accuracy_by_equipment_type.items():
            print(f"  {eq_type.replace('_', ' ').title()}: {accuracy:.2%}")
        
        print("\nAccuracy by Calculation Level:")
        for level, accuracy in report.accuracy_by_calculation_level.items():
            print(f"  {level}: {accuracy:.2%}")
        
        if report.top_performing_parameters:
            print("\nTop Performing Parameters:")
            for i, param in enumerate(report.top_performing_parameters[:3], 1):
                print(f"  {i}. {param}")
        
        if report.areas_for_improvement:
            print("\nAreas for Improvement:")
            for i, area in enumerate(report.areas_for_improvement[:3], 1):
                print(f"  {i}. {area}")
    
    print()
    
    # 6. Demonstrate prediction history retrieval
    print("6. Prediction History Analysis")
    print("-" * 40)
    
    # Get all predictions
    all_predictions = tracker.get_prediction_history()
    print(f"Total Predictions in History: {len(all_predictions)}")
    
    # Get predictions for specific equipment
    vessel_predictions = tracker.get_prediction_history(equipment_id="VESSEL-001")
    print(f"VESSEL-001 Predictions: {len(vessel_predictions)}")
    
    # Get recent predictions
    recent_predictions = tracker.get_prediction_history(
        start_date=datetime.now() - timedelta(days=60)
    )
    print(f"Recent Predictions (last 60 days): {len(recent_predictions)}")
    
    # Get only verified predictions
    verified_predictions = tracker.get_prediction_history(include_unverified=False)
    print(f"Verified Predictions: {len(verified_predictions)}")
    
    print()
    
    # 7. Demonstrate data export
    print("7. Data Export Capabilities")
    print("-" * 40)
    
    # Export as JSON
    json_export = tracker.export_prediction_data(format_type="json", verified_only=True)
    print(f"JSON Export Size: {len(json_export)} characters")
    print("JSON Export Sample (first 200 chars):")
    print(f"  {json_export[:200]}...")
    
    # Export as CSV
    csv_export = tracker.export_prediction_data(format_type="csv")
    csv_lines = csv_export.split('\n')
    print(f"\nCSV Export: {len(csv_lines)} lines")
    print("CSV Header:")
    print(f"  {csv_lines[0]}")
    if len(csv_lines) > 1:
        print("Sample Data Row:")
        print(f"  {csv_lines[1][:100]}...")
    
    print()
    
    # 8. Demonstrate advanced analytics
    print("8. Advanced Analytics and Insights")
    print("-" * 40)
    
    # Analyze prediction patterns
    if verified_predictions:
        print("Prediction Outcome Analysis:")
        outcome_counts = {}
        for pred in verified_predictions:
            if pred.outcome_classification:
                outcome = pred.outcome_classification.value
                outcome_counts[outcome] = outcome_counts.get(outcome, 0) + 1
        
        total_verified = len(verified_predictions)
        for outcome, count in outcome_counts.items():
            percentage = (count / total_verified) * 100
            print(f"  {outcome.replace('_', ' ').title()}: {count} ({percentage:.1f}%)")
        
        # Confidence vs Accuracy Analysis
        high_confidence_preds = [p for p in verified_predictions if p.confidence_score >= 0.8]
        low_confidence_preds = [p for p in verified_predictions if p.confidence_score < 0.6]
        
        if high_confidence_preds and low_confidence_preds:
            high_conf_accurate = sum(1 for p in high_confidence_preds 
                                   if p.outcome_classification == PredictionOutcome.ACCURATE)
            low_conf_accurate = sum(1 for p in low_confidence_preds 
                                  if p.outcome_classification == PredictionOutcome.ACCURATE)
            
            high_conf_rate = (high_conf_accurate / len(high_confidence_preds)) * 100
            low_conf_rate = (low_conf_accurate / len(low_confidence_preds)) * 100
            
            print(f"\nConfidence vs Accuracy:")
            print(f"  High Confidence (≥0.8) Accuracy: {high_conf_rate:.1f}%")
            print(f"  Low Confidence (<0.6) Accuracy: {low_conf_rate:.1f}%")
    
    print()
    
    # 9. Demonstrate cleanup functionality
    print("9. Data Management and Cleanup")
    print("-" * 40)
    
    # Show current data volume
    print(f"Current Predictions in Memory: {len(tracker._prediction_records)}")
    print(f"Equipment Being Tracked: {len(tracker._equipment_predictions)}")
    
    # Simulate cleanup (with very short retention for demo)
    removed_count = tracker.cleanup_old_predictions(retention_days=60)
    print(f"Predictions Removed (>60 days old): {removed_count}")
    print(f"Remaining Predictions: {len(tracker._prediction_records)}")
    
    print()
    
    print("=== Prediction Tracker Service Demonstration Complete ===")


def demonstrate_accuracy_improvement_tracking():
    """Demonstrate tracking accuracy improvements over time"""
    
    print("\n=== Accuracy Improvement Tracking Demo ===\n")
    
    tracker = PredictionTracker()
    
    # Simulate system learning over time with improving accuracy
    equipment_data = EquipmentData(
        equipment_id="LEARNING-VESSEL",
        equipment_type=EquipmentType.PRESSURE_VESSEL,
        service_type=ServiceType.SOUR_GAS,
        installation_date=datetime.now() - timedelta(days=20*365),
        design_pressure=75.0,
        design_temperature=250.0,
        material="Carbon Steel",
        criticality_level="Critical"
    )
    
    # Create predictions with improving accuracy over 12 months
    base_date = datetime.now() - timedelta(days=365)
    
    for month in range(12):
        # Simulate improving prediction accuracy over time
        accuracy_improvement = month * 0.05  # 5% improvement per month
        
        calc_result = RBICalculationResult(
            equipment_id="LEARNING-VESSEL",
            calculation_level=RBILevel.LEVEL_2,
            requested_level=RBILevel.LEVEL_2,
            fallback_occurred=False,
            next_inspection_date=base_date + timedelta(days=30*month + 730),
            risk_level=RiskLevel.HIGH,
            pof_score=0.7 + (month * 0.02),
            cof_scores={"safety": 0.8, "environmental": 0.7, "economic": 0.6},
            confidence_score=0.6 + accuracy_improvement,
            data_quality_score=0.7 + accuracy_improvement,
            calculation_timestamp=base_date + timedelta(days=30*month),
            inspection_interval_months=12,
            missing_data=[],
            estimated_parameters=[]
        )
        
        prediction_id = tracker.record_prediction(calc_result, equipment_data)
        
        # Simulate actual outcomes with improving accuracy
        actual_risk = RiskLevel.HIGH if month >= 6 else RiskLevel.MEDIUM  # System learns to predict HIGH risk better
        
        # Create findings that match the improving predictions
        if month < 4:
            # Early predictions were less accurate
            findings = [
                InspectionFinding(
                    finding_type="Corrosion",
                    severity="Medium",
                    description="Moderate corrosion",
                    location="General"
                )
            ]
        else:
            # Later predictions become more accurate
            findings = [
                InspectionFinding(
                    finding_type="Severe Corrosion",
                    severity="High",
                    description="Advanced corrosion requiring attention",
                    location="Critical areas"
                ),
                InspectionFinding(
                    finding_type="Cracking",
                    severity="High",
                    description="Stress corrosion cracking detected",
                    location="Weld zones"
                )
            ]
        
        tracker.update_actual_outcome(
            prediction_id=prediction_id,
            actual_inspection_date=base_date + timedelta(days=30*month + 700),
            inspection_findings=findings,
            actual_risk_assessment=actual_risk
        )
    
    # Analyze the improvement
    assessment = tracker.get_equipment_accuracy("LEARNING-VESSEL")
    
    print("Learning System Analysis:")
    print(f"Equipment: {assessment.equipment_id}")
    print(f"Total Predictions: {assessment.total_predictions}")
    print(f"Verified Predictions: {assessment.verified_predictions}")
    
    if assessment.trend_analysis:
        trend = assessment.trend_analysis.get("trend", "unknown")
        slope = assessment.trend_analysis.get("slope", 0)
        correlation = assessment.trend_analysis.get("correlation", 0)
        
        print(f"\nAccuracy Trend: {trend.title()}")
        print(f"Improvement Rate: {slope:.4f} per prediction")
        print(f"Trend Correlation: {correlation:.3f}")
        
        if "recent_accuracy" in assessment.trend_analysis:
            recent_acc = assessment.trend_analysis["recent_accuracy"]
            early_acc = assessment.trend_analysis["early_accuracy"]
            improvement = recent_acc - early_acc
            
            print(f"\nEarly Accuracy: {early_acc:.2%}")
            print(f"Recent Accuracy: {recent_acc:.2%}")
            print(f"Total Improvement: {improvement:.2%}")
    
    print(f"\nConfidence Correlation: {assessment.confidence_correlation:.3f}")
    
    if assessment.recommendations:
        print("\nSystem Recommendations:")
        for i, rec in enumerate(assessment.recommendations[:3], 1):
            print(f"  {i}. {rec}")
    
    print("\n=== Accuracy Improvement Tracking Demo Complete ===")


if __name__ == "__main__":
    demonstrate_prediction_tracking()
    demonstrate_accuracy_improvement_tracking()