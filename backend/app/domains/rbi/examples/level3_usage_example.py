"""Level 3 RBI Calculator Usage Example

This example demonstrates how to use the Level 3 RBI calculator for fully quantitative
risk-based inspection calculations using advanced degradation modeling and detailed
consequence analysis.
"""

from datetime import datetime, timedelta
from app.domains.rbi.services.level3_calculator import Level3Calculator
from app.domains.rbi.models.core import (
    EquipmentData,
    ExtractedRBIData,
    ThicknessMeasurement,
    InspectionFinding,
    EquipmentType,
    ServiceType
)
from app.domains.rbi.models.config import RBIConfig, WeightingFactors


def create_critical_equipment() -> EquipmentData:
    """Create critical equipment for Level 3 demonstration"""
    return EquipmentData(
        equipment_id="V-301",
        equipment_type=EquipmentType.PRESSURE_VESSEL,
        service_type=ServiceType.SOUR_GAS,
        installation_date=datetime(2005, 1, 1),
        design_pressure=75.0,
        design_temperature=250.0,
        material="CS",
        criticality_level="Critical",
        coating_type="Epoxy",
        location="open_area",
        inventory_size=200.0
    )


def create_comprehensive_inspection_data() -> ExtractedRBIData:
    """Create comprehensive inspection data for Level 3"""
    
    # Multiple thickness measurements from different locations and times
    thickness_measurements = [
        # Current inspection (most recent)
        ThicknessMeasurement(
            location="Shell_North_Top",
            thickness=13.2,
            measurement_date=datetime.now() - timedelta(days=30),
            minimum_required=10.0,
            measurement_method="UT",
            inspector="Senior Inspector A"
        ),
        ThicknessMeasurement(
            location="Shell_North_Middle",
            thickness=12.8,
            measurement_date=datetime.now() - timedelta(days=30),
            minimum_required=10.0,
            measurement_method="UT",
            inspector="Senior Inspector A"
        ),
        ThicknessMeasurement(
            location="Shell_North_Bottom",
            thickness=12.1,
            measurement_date=datetime.now() - timedelta(days=30),
            minimum_required=10.0,
            measurement_method="UT",
            inspector="Senior Inspector A"
        ),
        ThicknessMeasurement(
            location="Shell_South_Top",
            thickness=13.0,
            measurement_date=datetime.now() - timedelta(days=30),
            minimum_required=10.0,
            measurement_method="UT",
            inspector="Senior Inspector A"
        ),
        ThicknessMeasurement(
            location="Shell_South_Bottom",
            thickness=11.9,
            measurement_date=datetime.now() - timedelta(days=30),
            minimum_required=10.0,
            measurement_method="UT",
            inspector="Senior Inspector A"
        ),
        ThicknessMeasurement(
            location="Head_Top",
            thickness=13.8,
            measurement_date=datetime.now() - timedelta(days=30),
            minimum_required=10.0,
            measurement_method="UT",
            inspector="Senior Inspector A"
        ),
        ThicknessMeasurement(
            location="Head_Bottom",
            thickness=13.1,
            measurement_date=datetime.now() - timedelta(days=30),
            minimum_required=10.0,
            measurement_method="UT",
            inspector="Senior Inspector A"
        )
    ]
    
    # Detailed inspection findings
    inspection_findings = [
        InspectionFinding(
            finding_type="General Corrosion",
            severity="Medium",
            description="Uniform external corrosion observed on shell sections, consistent with atmospheric exposure",
            location="Shell_External_Lower",
            recommendation="Continue monitoring trend, consider coating touch-up during next shutdown",
            finding_date=datetime.now() - timedelta(days=30)
        ),
        InspectionFinding(
            finding_type="Pitting",
            severity="Low",
            description="Isolated pitting observed at weld heat-affected zones, maximum depth 0.5mm",
            location="Circumferential_Welds",
            recommendation="Monitor pit growth rate, no immediate action required",
            finding_date=datetime.now() - timedelta(days=30)
        ),
        InspectionFinding(
            finding_type="Coating Degradation",
            severity="Medium",
            description="Coating breakdown at support contact points, exposing substrate to corrosion",
            location="Support_Contact_Areas",
            recommendation="Schedule coating repair during next maintenance window",
            finding_date=datetime.now() - timedelta(days=30)
        )
    ]
    
    return ExtractedRBIData(
        equipment_id="V-301",
        thickness_measurements=thickness_measurements,
        corrosion_rate=0.18,  # mm/year calculated from multi-year thickness trend
        coating_condition="good",
        damage_mechanisms=["General Corrosion", "Pitting", "Coating Degradation"],
        inspection_findings=inspection_findings,
        last_inspection_date=datetime.now() - timedelta(days=30),
        inspection_quality="excellent"
    )

de
f demonstrate_advanced_calculation():
    """Demonstrate advanced Level 3 RBI calculation"""
    print("=== Level 3 RBI Calculator - Advanced Quantitative Analysis ===\n")
    
    # Create calculator with default configuration
    calculator = Level3Calculator()
    
    # Prepare comprehensive input data
    equipment = create_critical_equipment()
    extracted_data = create_comprehensive_inspection_data()
    
    print(f"Equipment: {equipment.equipment_id} ({equipment.equipment_type.value})")
    print(f"Service: {equipment.service_type.value}")
    print(f"Age: {equipment.age_years} years")
    print(f"Design Conditions: {equipment.design_pressure} bar, {equipment.design_temperature}°C")
    print(f"Criticality: {equipment.criticality_level}")
    print(f"Inventory: {equipment.inventory_size} m³")
    print(f"Last Inspection: {extracted_data.last_inspection_date.strftime('%Y-%m-%d')}")
    print(f"Corrosion Rate: {extracted_data.corrosion_rate} mm/year")
    print(f"Thickness Measurements: {len(extracted_data.thickness_measurements)} points")
    print(f"Damage Mechanisms: {', '.join(extracted_data.damage_mechanisms)}")
    print(f"Inspection Quality: {extracted_data.inspection_quality}")
    print()
    
    # Perform advanced calculation
    result = calculator.calculate(equipment, extracted_data)
    
    # Display comprehensive results
    print("=== Advanced Calculation Results ===")
    print(f"Calculation Level: {result.calculation_level.value}")
    print(f"Risk Level: {result.risk_level.value}")
    print(f"Annual PoF: {(result.pof_score / 5.0):.6f} ({result.pof_score:.2f}/5.0)")
    print(f"Remaining Life: {result.remaining_life_years:.1f} years")
    print()
    
    print("Consequence of Failure Scores:")
    for dimension, score in result.cof_scores.items():
        print(f"  - {dimension.title()}: {score:.2f}/5.0")
    print()
    
    print(f"Confidence Score: {result.confidence_score:.3f}")
    print(f"Data Quality Score: {result.data_quality_score:.3f}")
    print(f"Optimal Inspection Interval: {result.inspection_interval_months} months")
    print(f"Next Inspection Date: {result.next_inspection_date.strftime('%Y-%m-%d')}")
    print()
    
    # Display input parameters summary
    print("=== Key Input Parameters ===")
    params = result.input_parameters
    print(f"Equipment Age: {params['equipment_age']} years")
    print(f"Corrosion Rate: {params['corrosion_rate']} mm/year")
    print(f"Minimum Thickness: {params.get('min_thickness', 'N/A')} mm")
    print(f"Average Thickness: {params.get('avg_thickness', 'N/A'):.1f} mm")
    print(f"Damage Mechanisms: {len(params['damage_mechanisms'])}")
    print()


def demonstrate_remaining_life_analysis():
    """Demonstrate remaining life analysis"""
    print("=== Level 3 RBI Calculator - Remaining Life Analysis ===\n")
    
    calculator = Level3Calculator()
    equipment = create_critical_equipment()
    extracted_data = create_comprehensive_inspection_data()
    
    # Calculate remaining life
    remaining_life = calculator._calculate_remaining_life(equipment, extracted_data)
    
    print("=== Remaining Life Analysis ===")
    print(f"Current Corrosion Rate: {extracted_data.corrosion_rate} mm/year")
    
    # Show thickness statistics
    thicknesses = [m.thickness for m in extracted_data.thickness_measurements]
    min_thickness = min(thicknesses)
    avg_thickness = sum(thicknesses) / len(thicknesses)
    
    print(f"Current Minimum Thickness: {min_thickness} mm")
    print(f"Current Average Thickness: {avg_thickness:.1f} mm")
    print(f"Required Minimum Thickness: 10.0 mm")
    print(f"Calculated Remaining Life: {remaining_life:.1f} years")
    print()
    
    # Project future thickness
    print("=== Thickness Projection ===")
    future_years = [1, 2, 5, 10]
    for years in future_years:
        future_min = min_thickness - (extracted_data.corrosion_rate * years)
        status = "SAFE" if future_min >= 10.0 else "CRITICAL"
        print(f"After {years:2d} years: {future_min:5.1f} mm ({status})")
    print()


def demonstrate_sensitivity_analysis():
    """Demonstrate sensitivity analysis"""
    print("=== Level 3 RBI Calculator - Sensitivity Analysis ===\n")
    
    calculator = Level3Calculator()
    equipment = create_critical_equipment()
    extracted_data = create_comprehensive_inspection_data()
    
    # Perform sensitivity analysis
    sensitivity = calculator.calculate_sensitivity_analysis(equipment, extracted_data)
    
    print("=== Base Case Results ===")
    base = sensitivity["base_case"]
    print(f"PoF Score: {base['pof_score']:.2f}")
    print(f"Risk Level: {base['risk_level']}")
    print(f"Inspection Interval: {base['interval_months']} months")
    print()
    
    # Corrosion rate sensitivity
    if "corrosion_rate" in sensitivity["sensitivity_analysis"]:
        print("=== Corrosion Rate Sensitivity ===")
        corr_analysis = sensitivity["sensitivity_analysis"]["corrosion_rate"]
        
        print("Corr.Rate  PoF Score  Risk Level    Interval")
        print("-" * 45)
        for case in corr_analysis:
            print(f"{case['corrosion_rate']:8.2f}  {case['pof_score']:8.2f}  {case['risk_level']:10s}  {case['interval_months']:3d} months")
        print()
    
    # Equipment age sensitivity
    if "equipment_age" in sensitivity["sensitivity_analysis"]:
        print("=== Equipment Age Sensitivity ===")
        age_analysis = sensitivity["sensitivity_analysis"]["equipment_age"]
        
        print("Age (years)  PoF Score  Risk Level    Interval")
        print("-" * 45)
        for case in age_analysis:
            print(f"{case['age_years']:10.1f}  {case['pof_score']:8.2f}  {case['risk_level']:10s}  {case['interval_months']:3d} months")
        print()


def demonstrate_data_validation():
    """Demonstrate comprehensive data validation for Level 3"""
    print("=== Level 3 RBI Calculator - Data Validation ===\n")
    
    calculator = Level3Calculator()
    equipment = create_critical_equipment()
    
    # Test with insufficient data
    insufficient_data = ExtractedRBIData(
        equipment_id="V-301",
        thickness_measurements=[
            ThicknessMeasurement(
                location="Single_Point", thickness=12.0, measurement_date=datetime.now(),
                minimum_required=10.0
            )
        ],  # Only one measurement (insufficient for Level 3)
        corrosion_rate=None,  # Missing corrosion rate
        coating_condition=None,
        damage_mechanisms=[],
        inspection_findings=[],
        last_inspection_date=datetime.now() - timedelta(days=800),  # Old data
        inspection_quality="poor"
    )
    
    validation = calculator.validate_input_data(equipment, insufficient_data)
    
    print("=== Data Validation Results ===")
    
    if validation["missing_required"]:
        print("Missing Required Data for Level 3:")
        for item in validation["missing_required"]:
            print(f"  ❌ {item}")
        print()
    
    if validation["missing_recommended"]:
        print("Missing Recommended Data:")
        for item in validation["missing_recommended"]:
            print(f"  ⚠️  {item}")
        print()
    
    if validation["data_quality_issues"]:
        print("Data Quality Issues:")
        for issue in validation["data_quality_issues"]:
            print(f"  🔴 {issue}")
        print()
    
    if validation["warnings"]:
        print("Warnings:")
        for warning in validation["warnings"]:
            print(f"  🟡 {warning}")
        print()
    
    # Show what's needed for Level 3
    print("=== Level 3 Requirements ===")
    requirements = calculator.get_calculation_summary()["data_requirements"]
    print("Level 3 requires:")
    for req in requirements:
        print(f"  • {req}")
    print()


def demonstrate_comparison_scenarios():
    """Compare different equipment scenarios"""
    print("=== Level 3 RBI Calculator - Scenario Comparison ===\n")
    
    calculator = Level3Calculator()
    
    # Scenario 1: Well-maintained equipment
    good_equipment = EquipmentData(
        equipment_id="V-GOOD",
        equipment_type=EquipmentType.PRESSURE_VESSEL,
        service_type=ServiceType.SWEET_GAS,
        installation_date=datetime(2015, 1, 1),  # Relatively new
        design_pressure=30.0,
        design_temperature=100.0,
        material="SS",
        criticality_level="Medium",
        coating_type="Epoxy",
        location="safe",
        inventory_size=50.0
    )
    
    good_data = ExtractedRBIData(
        equipment_id="V-GOOD",
        thickness_measurements=[
            ThicknessMeasurement(location=f"Point_{i}", thickness=14.5 - i*0.1, 
                               measurement_date=datetime.now(), minimum_required=10.0)
            for i in range(5)
        ],
        corrosion_rate=0.05,  # Very low corrosion
        coating_condition="excellent",
        damage_mechanisms=[],  # No active damage
        inspection_findings=[],
        last_inspection_date=datetime.now() - timedelta(days=60),
        inspection_quality="excellent"
    )
    
    # Scenario 2: Aging equipment with issues
    aging_equipment = EquipmentData(
        equipment_id="V-AGING",
        equipment_type=EquipmentType.PRESSURE_VESSEL,
        service_type=ServiceType.SOUR_GAS,
        installation_date=datetime(1995, 1, 1),  # Old
        design_pressure=80.0,
        design_temperature=300.0,
        material="CS",
        criticality_level="Critical",
        coating_type="None",
        location="near_sensitive",
        inventory_size=300.0
    )
    
    aging_data = ExtractedRBIData(
        equipment_id="V-AGING",
        thickness_measurements=[
            ThicknessMeasurement(location=f"Point_{i}", thickness=11.0 - i*0.2, 
                               measurement_date=datetime.now(), minimum_required=10.0)
            for i in range(5)
        ],
        corrosion_rate=0.4,  # High corrosion
        coating_condition="poor",
        damage_mechanisms=["General Corrosion", "Pitting", "Stress Corrosion Cracking"],
        inspection_findings=[
            InspectionFinding(
                finding_type="Significant Corrosion", severity="High",
                description="Accelerated corrosion observed", location="Shell",
                recommendation="Frequent monitoring required", finding_date=datetime.now()
            )
        ],
        last_inspection_date=datetime.now() - timedelta(days=30),
        inspection_quality="excellent"
    )
    
    # Calculate both scenarios
    good_result = calculator.calculate(good_equipment, good_data)
    aging_result = calculator.calculate(aging_equipment, aging_data)
    
    print("=== Scenario Comparison ===")
    print(f"{'Metric':<25} {'Well-Maintained':<15} {'Aging Equipment':<15}")
    print("-" * 55)
    print(f"{'Risk Level':<25} {good_result.risk_level.value:<15} {aging_result.risk_level.value:<15}")
    print(f"{'PoF Score':<25} {good_result.pof_score:<15.2f} {aging_result.pof_score:<15.2f}")
    print(f"{'Remaining Life (years)':<25} {good_result.remaining_life_years:<15.1f} {aging_result.remaining_life_years:<15.1f}")
    print(f"{'Inspection Interval':<25} {good_result.inspection_interval_months:<15d} {aging_result.inspection_interval_months:<15d}")
    print(f"{'Confidence Score':<25} {good_result.confidence_score:<15.3f} {aging_result.confidence_score:<15.3f}")
    print()


def demonstrate_methodology_summary():
    """Show Level 3 methodology summary"""
    print("=== Level 3 RBI Calculator - Methodology Summary ===\n")
    
    calculator = Level3Calculator()
    summary = calculator.get_calculation_summary()
    
    print(f"Level: {summary['level']}")
    print(f"Description: {summary['description']}")
    print()
    
    print("Methodology Details:")
    methodology = summary['methodology']
    for key, value in methodology.items():
        print(f"  {key.replace('_', ' ').title()}: {value}")
    print()
    
    print(f"Confidence Level: {summary['confidence_level']}")
    print()
    
    print("Advantages:")
    for advantage in summary['advantages']:
        print(f"  ✓ {advantage}")
    print()
    
    print("Limitations:")
    for limitation in summary['limitations']:
        print(f"  ⚠️  {limitation}")
    print()
    
    print("Typical Use Cases:")
    for use_case in summary['typical_use_cases']:
        print(f"  • {use_case}")
    print()


if __name__ == "__main__":
    """Run all Level 3 RBI calculator examples"""
    
    print("Level 3 RBI Calculator - Comprehensive Advanced Examples")
    print("=" * 70)
    print()
    
    # Run all demonstrations
    demonstrate_advanced_calculation()
    print("-" * 70)
    print()
    
    demonstrate_remaining_life_analysis()
    print("-" * 70)
    print()
    
    demonstrate_sensitivity_analysis()
    print("-" * 70)
    print()
    
    demonstrate_data_validation()
    print("-" * 70)
    print()
    
    demonstrate_comparison_scenarios()
    print("-" * 70)
    print()
    
    demonstrate_methodology_summary()
    
    print("All Level 3 RBI calculator examples completed successfully!")