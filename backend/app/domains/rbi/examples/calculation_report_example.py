"""Example usage of Calculation Report Service"""

from datetime import datetime, timedelta
from app.domains.rbi.services.calculation_report_service import CalculationReportService
from app.domains.rbi.models.core import (
    EquipmentData,
    ExtractedRBIData,
    RBICalculationResult,
    ThicknessMeasurement,
    InspectionFinding,
    EquipmentType,
    ServiceType,
    RBILevel,
    RiskLevel
)
from app.domains.rbi.models.config import RBIConfig


def create_sample_equipment() -> EquipmentData:
    """Create sample equipment data"""
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
        inventory_size=100.0
    )


def create_sample_extracted_data() -> ExtractedRBIData:
    """Create sample extracted data"""
    thickness_measurements = [
        ThicknessMeasurement(
            location="Shell_Top", thickness=12.5, measurement_date=datetime.now() - timedelta(days=30),
            minimum_required=10.0, measurement_method="UT", inspector="Inspector A"
        ),
        ThicknessMeasurement(
            location="Shell_Bottom", thickness=11.8, measurement_date=datetime.now() - timedelta(days=30),
            minimum_required=10.0, measurement_method="UT", inspector="Inspector A"
        ),
        ThicknessMeasurement(
            location="Shell_Side", thickness=12.0, measurement_date=datetime.now() - timedelta(days=30),
            minimum_required=10.0, measurement_method="UT", inspector="Inspector A"
        )
    ]
    
    inspection_findings = [
        InspectionFinding(
            finding_type="Corrosion", severity="Medium",
            description="General corrosion observed on shell surface", location="Shell",
            recommendation="Continue monitoring", finding_date=datetime.now() - timedelta(days=30)
        ),
        InspectionFinding(
            finding_type="Coating Degradation", severity="Low",
            description="Minor coating degradation noted", location="External Surface",
            recommendation="Schedule coating maintenance", finding_date=datetime.now() - timedelta(days=30)
        )
    ]
    
    return ExtractedRBIData(
        equipment_id="V-101",
        thickness_measurements=thickness_measurements,
        corrosion_rate=0.2,
        coating_condition="moderate",
        damage_mechanisms=["General Corrosion", "Coating Degradation"],
        inspection_findings=inspection_findings,
        last_inspection_date=datetime.now() - timedelta(days=30),
        inspection_quality="good"
    )


def create_sample_calculation_result(scenario: str = "normal") -> RBICalculationResult:
    """Create sample calculation result for different scenarios"""
    
    if scenario == "high_risk":
        return RBICalculationResult(
            equipment_id="V-101",
            calculation_level=RBILevel.LEVEL_3,
            requested_level=RBILevel.LEVEL_3,
            fallback_occurred=False,
            next_inspection_date=datetime.now() + timedelta(days=365),
            risk_level=RiskLevel.HIGH,
            pof_score=4.2,
            cof_scores={"safety": 4.5, "environmental": 3.8, "economic": 4.0},
            confidence_score=0.85,
            data_quality_score=0.9,
            calculation_timestamp=datetime.now(),
            input_parameters={
                "base_failure_rate": 0.002,
                "age_factor": 1.5,
                "corrosion_factor": 1.3,
                "damage_mechanism_factor": 1.2,
                "inspection_effectiveness": 0.9
            },
            missing_data=[],
            estimated_parameters=[],
            inspection_interval_months=12
        )
    
    elif scenario == "fallback":
        return RBICalculationResult(
            equipment_id="V-101",
            calculation_level=RBILevel.LEVEL_2,
            requested_level=RBILevel.LEVEL_3,
            fallback_occurred=True,
            next_inspection_date=datetime.now() + timedelta(days=540),
            risk_level=RiskLevel.MEDIUM,
            pof_score=2.8,
            cof_scores={"safety": 3.2, "environmental": 2.8, "economic": 3.0},
            confidence_score=0.65,
            data_quality_score=0.7,
            calculation_timestamp=datetime.now(),
            input_parameters={
                "fallback_adjustments": {
                    "adjustment_factor": 0.8,
                    "confidence_reduction": 0.15,
                    "reason": "Insufficient data for Level 3"
                }
            },
            missing_data=["historical_thickness_trend", "detailed_operating_conditions"],
            estimated_parameters=["coating_effectiveness"],
            inspection_interval_months=18
        )
    
    else:  # normal scenario
        return RBICalculationResult(
            equipment_id="V-101",
            calculation_level=RBILevel.LEVEL_3,
            requested_level=RBILevel.LEVEL_3,
            fallback_occurred=False,
            next_inspection_date=datetime.now() + timedelta(days=720),
            risk_level=RiskLevel.MEDIUM,
            pof_score=2.5,
            cof_scores={"safety": 3.0, "environmental": 2.5, "economic": 3.5},
            confidence_score=0.82,
            data_quality_score=0.85,
            calculation_timestamp=datetime.now(),
            input_parameters={
                "base_failure_rate": 0.001,
                "age_factor": 1.2,
                "corrosion_factor": 1.1,
                "damage_mechanism_factor": 1.0,
                "inspection_effectiveness": 0.85
            },
            missing_data=[],
            estimated_parameters=[],
            inspection_interval_months=24
        )


def main():
    """Demonstrate Calculation Report Service usage"""
    
    print("=== RBI Calculation Report Service Example ===\n")
    
    # Initialize the service
    config = RBIConfig()
    report_service = CalculationReportService(config)
    
    # Create sample data
    equipment = create_sample_equipment()
    extracted_data = create_sample_extracted_data()
    
    # Example 1: Normal scenario detailed report
    print("1. Normal Scenario - Detailed Report")
    print("-" * 45)
    
    normal_result = create_sample_calculation_result("normal")
    
    detailed_report = report_service.generate_detailed_report(
        calculation_result=normal_result,
        equipment_data=equipment,
        extracted_data=extracted_data,
        include_intermediate_calculations=True,
        include_data_quality_analysis=True,
        include_recommendations=True
    )
    
    print(f"Report ID: {detailed_report.report_id}")
    print(f"Equipment: {detailed_report.equipment_id}")
    print(f"Report Type: {detailed_report.report_type}")
    print(f"Generation Time: {detailed_report.generation_timestamp.strftime('%Y-%m-%d %H:%M:%S')}")
    print(f"Number of Sections: {len(detailed_report.sections)}")
    
    print(f"\nReport Sections:")
    for i, section in enumerate(detailed_report.sections, 1):
        importance_indicator = {
            "critical": "🔴",
            "high": "🟡", 
            "normal": "🟢",
            "low": "⚪"
        }.get(section.importance, "⚪")
        
        print(f"  {i}. {importance_indicator} {section.title} ({section.importance})")
    
    # Show executive summary content
    exec_summary = next(s for s in detailed_report.sections if s.title == "Executive Summary")
    risk_assessment = exec_summary.content["risk_assessment"]
    print(f"\nExecutive Summary - Risk Assessment:")
    print(f"  Risk Level: {risk_assessment['overall_risk_level']}")
    print(f"  PoF Score: {risk_assessment['pof_score']}")
    print(f"  CoF Scores: {risk_assessment['cof_scores']}")
    
    inspection_rec = exec_summary.content["inspection_recommendation"]
    print(f"\nInspection Recommendation:")
    print(f"  Next Inspection: {inspection_rec['next_inspection_date'][:10]}")
    print(f"  Interval: {inspection_rec['inspection_interval_months']} months")
    print(f"  Days Until: {inspection_rec['days_until_inspection']} days")
    
    print("\n" + "="*60 + "\n")
    
    # Example 2: High risk scenario
    print("2. High Risk Scenario - Summary Report")
    print("-" * 40)
    
    high_risk_result = create_sample_calculation_result("high_risk")
    
    summary_report = report_service.generate_summary_report(
        calculation_result=high_risk_result,
        equipment_data=equipment
    )
    
    print(f"Equipment: {summary_report['equipment_id']}")
    
    calc_summary = summary_report['calculation_summary']
    print(f"Risk Level: {calc_summary['risk_level']} ⚠️")
    print(f"Inspection Interval: {calc_summary['inspection_interval']} months")
    print(f"Confidence: {calc_summary['confidence']}")
    
    key_metrics = summary_report['key_metrics']
    print(f"\nKey Metrics:")
    print(f"  PoF Score: {key_metrics['pof_score']:.1f}")
    print(f"  CoF Scores: Safety={key_metrics['cof_scores']['safety']:.1f}, "
          f"Environmental={key_metrics['cof_scores']['environmental']:.1f}, "
          f"Economic={key_metrics['cof_scores']['economic']:.1f}")
    print(f"  Confidence: {key_metrics['confidence_score']:.2f}")
    print(f"  Data Quality: {key_metrics['data_quality_score']:.2f}")
    
    status = summary_report['status_indicators']
    print(f"\nStatus Indicators:")
    print(f"  Requires Attention: {'Yes ⚠️' if status['requires_attention'] else 'No ✅'}")
    print(f"  High Confidence: {'Yes ✅' if status['high_confidence'] else 'No ⚠️'}")
    print(f"  Data Complete: {'Yes ✅' if status['data_complete'] else 'No ⚠️'}")
    
    print(f"\nNext Actions:")
    for i, action in enumerate(summary_report['next_actions'], 1):
        print(f"  {i}. {action}")
    
    print("\n" + "="*60 + "\n")
    
    # Example 3: Fallback scenario with detailed analysis
    print("3. Fallback Scenario - Detailed Analysis")
    print("-" * 42)
    
    fallback_result = create_sample_calculation_result("fallback")
    
    fallback_report = report_service.generate_detailed_report(
        calculation_result=fallback_result,
        equipment_data=equipment,
        extracted_data=extracted_data,
        include_intermediate_calculations=False,
        include_data_quality_analysis=True,
        include_recommendations=True
    )
    
    print(f"Calculation Level: {fallback_result.calculation_level.value} (requested: {fallback_result.requested_level.value})")
    print(f"Fallback Occurred: {'Yes ⚠️' if fallback_result.fallback_occurred else 'No ✅'}")
    print(f"Confidence Score: {fallback_result.confidence_score:.2f}")
    
    # Find fallback analysis section
    fallback_section = next((s for s in fallback_report.sections if s.title == "Fallback Analysis"), None)
    if fallback_section:
        fallback_details = fallback_section.content["fallback_details"]
        print(f"\nFallback Details:")
        print(f"  Requested Level: {fallback_details['requested_level']}")
        print(f"  Achieved Level: {fallback_details['achieved_level']}")
        print(f"  Missing Data: {fallback_details['fallback_reasons']}")
        
        impact_analysis = fallback_section.content["impact_analysis"]
        confidence_impact = impact_analysis["confidence_impact"]
        print(f"\nImpact Analysis:")
        print(f"  Confidence Reduction: {confidence_impact['confidence_reduction']:.2f}")
        print(f"  Final Confidence: {confidence_impact['final_confidence']:.2f}")
        
        interval_impact = impact_analysis["interval_impact"]
        print(f"  Adjustment Factor: {interval_impact['adjustment_factor']:.2f}")
        print(f"  Conservatism Applied: {'Yes' if interval_impact['conservatism_applied'] else 'No'}")
    
    print("\n" + "="*60 + "\n")
    
    # Example 4: Report serialization
    print("4. Report Serialization Examples")
    print("-" * 35)
    
    # JSON serialization
    json_report = detailed_report.to_json(indent=2)
    print(f"JSON Report Size: {len(json_report):,} characters")
    print(f"JSON Preview (first 200 chars):")
    print(json_report[:200] + "...")
    
    # Dictionary serialization
    dict_report = detailed_report.to_dict()
    print(f"\nDictionary Report Keys: {list(dict_report.keys())}")
    print(f"Metadata Keys: {list(dict_report['metadata'].keys())}")
    
    # Section analysis
    section_importance = {}
    for section in detailed_report.sections:
        importance = section.importance
        section_importance[importance] = section_importance.get(importance, 0) + 1
    
    print(f"\nSection Importance Distribution:")
    for importance, count in section_importance.items():
        print(f"  {importance.title()}: {count} sections")
    
    print("\n" + "="*60 + "\n")
    
    # Example 5: Comparison of different scenarios
    print("5. Scenario Comparison")
    print("-" * 25)
    
    scenarios = {
        "Normal": create_sample_calculation_result("normal"),
        "High Risk": create_sample_calculation_result("high_risk"),
        "Fallback": create_sample_calculation_result("fallback")
    }
    
    print(f"{'Scenario':<12} {'Risk Level':<12} {'PoF':<6} {'Confidence':<12} {'Interval':<10} {'Fallback'}")
    print("-" * 70)
    
    for name, result in scenarios.items():
        fallback_status = "Yes" if result.fallback_occurred else "No"
        print(f"{name:<12} {result.risk_level.value:<12} {result.pof_score:<6.1f} "
              f"{result.confidence_score:<12.2f} {result.inspection_interval_months:<10} {fallback_status}")
    
    print("\n" + "="*60)
    
    print("\n🎯 Calculation Report Service Demo Complete!")
    print("\nKey Features Demonstrated:")
    print("✓ Detailed report generation with multiple sections")
    print("✓ Executive summary with key findings")
    print("✓ Input parameters and methodology documentation")
    print("✓ Intermediate calculations and workflow")
    print("✓ Results analysis and confidence assessment")
    print("✓ Data quality analysis and recommendations")
    print("✓ Fallback scenario analysis and impact assessment")
    print("✓ Summary reports for quick overview")
    print("✓ Report serialization (JSON/Dictionary)")
    print("✓ Comprehensive recommendations and action plans")
    print("✓ Multi-scenario comparison capabilities")


if __name__ == "__main__":
    main()