"""Level 2 RBI Calculator Usage Example

This example demonstrates how to use the Level 2 RBI calculator for semi-quantitative
risk-based inspection calculations using scoring tables and weighted factors.
"""

from datetime import datetime, timedelta
from app.domains.rbi.services.level2_calculator import Level2Calculator
from app.domains.rbi.models.core import (
    EquipmentData,
    ExtractedRBIData,
    ThicknessMeasurement,
    InspectionFinding,
    EquipmentType,
    ServiceType
)
from app.domains.rbi.models.config import RBIConfig, WeightingFactors


def create_sample_equipment() -> EquipmentData:
    """Create sample equipment for demonstration"""
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


def create_inspection_data() -> ExtractedRBIData:
    """Create sample inspection data"""
    # Thickness measurements from recent inspection
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
        ),
        ThicknessMeasurement(
            location="Head_Top",
            thickness=13.2,
            measurement_date=datetime.now() - timedelta(days=30),
            minimum_required=10.0,
            measurement_method="UT",
            inspector="John Doe"
        )
    ]
    
    # Inspection findings
    inspection_findings = [
        InspectionFinding(
            finding_type="General Corrosion",
            severity="Medium",
            description="Uniform corrosion observed on external shell",
            location="Shell_External",
            recommendation="Monitor and reassess in 2 years",
            finding_date=datetime.now() - timedelta(days=30)
        ),
        InspectionFinding(
            finding_type="Coating Degradation",
            severity="Low",
            description="Minor coating deterioration at support points",
            location="Support_Areas",
            recommendation="Touch-up coating during next shutdown",
            finding_date=datetime.now() - timedelta(days=30)
        )
    ]
    
    return ExtractedRBIData(
        equipment_id="V-201",
        thickness_measurements=thickness_measurements,
        corrosion_rate=0.15,  # mm/year calculated from thickness trend
        coating_condition="moderate",
        damage_mechanisms=["General Corrosion", "Pitting"],
        inspection_findings=inspection_findings,
        last_inspection_date=datetime.now() - timedelta(days=30),
        inspection_quality="good"
    )


def demonstrate_basic_calculation():
    """Demonstrate basic Level 2 RBI calculation"""
    print("=== Level 2 RBI Calculator - Basic Usage ===\n")
    
    # Create calculator with default configuration
    calculator = Level2Calculator()
    
    # Prepare input data
    equipment = create_sample_equipment()
    extracted_data = create_inspection_data()
    
    print(f"Equipment: {equipment.equipment_id} ({equipment.equipment_type.value})")
    print(f"Service: {equipment.service_type.value}")
    print(f"Age: {equipment.age_years} years")
    print(f"Criticality: {equipment.criticality_level}")
    print(f"Last Inspection: {extracted_data.last_inspection_date.strftime('%Y-%m-%d')}")
    print(f"Corrosion Rate: {extracted_data.corrosion_rate} mm/year")
    print(f"Damage Mechanisms: {', '.join(extracted_data.damage_mechanisms)}")
    print()
    
    # Perform calculation
    result = calculator.calculate(equipment, extracted_data)
    
    # Display results
    print("=== Calculation Results ===")
    print(f"Calculation Level: {result.calculation_level.value}")
    print(f"Risk Level: {result.risk_level.value}")
    print(f"PoF Score: {result.pof_score:.2f}")
    print(f"CoF Scores:")
    for dimension, score in result.cof_scores.items():
        print(f"  - {dimension.title()}: {score:.2f}")
    print(f"Confidence Score: {result.confidence_score:.2f}")
    print(f"Data Quality Score: {result.data_quality_score:.2f}")
    print(f"Inspection Interval: {result.inspection_interval_months} months")
    print(f"Next Inspection Date: {result.next_inspection_date.strftime('%Y-%m-%d')}")
    print()


def demonstrate_custom_configuration():
    """Demonstrate Level 2 calculation with custom configuration"""
    print("=== Level 2 RBI Calculator - Custom Configuration ===\n")
    
    # Create custom configuration
    custom_config = RBIConfig()
    
    # Adjust CoF weighting factors
    custom_config.weighting_factors = WeightingFactors(
        cof_weights={
            "safety": 0.5,      # Higher weight on safety
            "environmental": 0.3,
            "economic": 0.2
        },
        pof_weights={
            "corrosion_rate": 0.3,
            "equipment_age": 0.2,
            "damage_mechanisms": 0.2,
            "coating_quality": 0.15,
            "inspection_coverage": 0.15
        }
    )
    
    # Create calculator with custom config
    calculator = Level2Calculator(custom_config)
    
    # Use same equipment and data
    equipment = create_sample_equipment()
    extracted_data = create_inspection_data()
    
    print("Custom Configuration:")
    print("- Safety CoF Weight: 50%")
    print("- Environmental CoF Weight: 30%")
    print("- Economic CoF Weight: 20%")
    print()
    
    # Perform calculation
    result = calculator.calculate(equipment, extracted_data)
    
    # Display results
    print("=== Custom Configuration Results ===")
    print(f"Risk Level: {result.risk_level.value}")
    print(f"PoF Score: {result.pof_score:.2f}")
    print(f"CoF Scores:")
    for dimension, score in result.cof_scores.items():
        print(f"  - {dimension.title()}: {score:.2f}")
    print(f"Inspection Interval: {result.inspection_interval_months} months")
    print()


def demonstrate_data_validation():
    """Demonstrate input data validation"""
    print("=== Level 2 RBI Calculator - Data Validation ===\n")
    
    calculator = Level2Calculator()
    equipment = create_sample_equipment()
    
    # Create data with some missing/poor quality elements
    incomplete_data = ExtractedRBIData(
        equipment_id="V-201",
        thickness_measurements=[],  # Missing thickness data
        corrosion_rate=None,  # Missing corrosion rate
        coating_condition=None,  # Missing coating condition
        damage_mechanisms=["General Corrosion"],
        inspection_findings=[],
        last_inspection_date=datetime.now() - timedelta(days=1000),  # Old data
        inspection_quality="poor"
    )
    
    # Validate input data
    validation = calculator.validate_input_data(equipment, incomplete_data)
    
    print("=== Data Validation Results ===")
    
    if validation["missing_required"]:
        print("Missing Required Data:")
        for item in validation["missing_required"]:
            print(f"  - {item}")
        print()
    
    if validation["missing_recommended"]:
        print("Missing Recommended Data:")
        for item in validation["missing_recommended"]:
            print(f"  - {item}")
        print()
    
    if validation["data_quality_issues"]:
        print("Data Quality Issues:")
        for issue in validation["data_quality_issues"]:
            print(f"  - {issue}")
        print()
    
    if validation["warnings"]:
        print("Warnings:")
        for warning in validation["warnings"]:
            print(f"  - {warning}")
        print()
    
    # Still perform calculation (Level 2 is robust to missing data)
    result = calculator.calculate(equipment, incomplete_data)
    print(f"Calculation still possible with confidence: {result.confidence_score:.2f}")
    print(f"Risk Level: {result.risk_level.value}")
    print()


def demonstrate_high_vs_low_risk():
    """Compare high-risk vs low-risk equipment calculations"""
    print("=== Level 2 RBI Calculator - Risk Comparison ===\n")
    
    calculator = Level2Calculator()
    
    # High-risk equipment
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
    
    high_risk_data = ExtractedRBIData(
        equipment_id="HR-001",
        thickness_measurements=[
            ThicknessMeasurement(
                location="Critical", thickness=8.5, measurement_date=datetime.now(),
                minimum_required=10.0  # Close to minimum
            )
        ],
        corrosion_rate=0.8,  # High corrosion rate
        coating_condition="poor",
        damage_mechanisms=["General Corrosion", "Pitting", "Stress Corrosion Cracking"],
        inspection_findings=[
            InspectionFinding(
                finding_type="Significant Corrosion", severity="High",
                description="Accelerated corrosion observed", location="Shell",
                recommendation="Immediate attention required", finding_date=datetime.now()
            )
        ],
        last_inspection_date=datetime.now() - timedelta(days=30),
        inspection_quality="good"
    )
    
    # Low-risk equipment
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
    
    # Calculate both
    high_risk_result = calculator.calculate(high_risk_equipment, high_risk_data)
    low_risk_result = calculator.calculate(low_risk_equipment, low_risk_data)
    
    print("=== High-Risk Equipment ===")
    print(f"Equipment: {high_risk_equipment.equipment_id}")
    print(f"Age: {high_risk_equipment.age_years} years")
    print(f"Corrosion Rate: {high_risk_data.corrosion_rate} mm/year")
    print(f"Risk Level: {high_risk_result.risk_level.value}")
    print(f"PoF Score: {high_risk_result.pof_score:.2f}")
    print(f"Inspection Interval: {high_risk_result.inspection_interval_months} months")
    print()
    
    print("=== Low-Risk Equipment ===")
    print(f"Equipment: {low_risk_equipment.equipment_id}")
    print(f"Age: {low_risk_equipment.age_years} years")
    print(f"Corrosion Rate: {low_risk_data.corrosion_rate} mm/year")
    print(f"Risk Level: {low_risk_result.risk_level.value}")
    print(f"PoF Score: {low_risk_result.pof_score:.2f}")
    print(f"Inspection Interval: {low_risk_result.inspection_interval_months} months")
    print()


def demonstrate_calculation_summary():
    """Show Level 2 calculation methodology summary"""
    print("=== Level 2 RBI Calculator - Methodology Summary ===\n")
    
    calculator = Level2Calculator()
    summary = calculator.get_calculation_summary()
    
    print(f"Level: {summary['level']}")
    print(f"Description: {summary['description']}")
    print()
    
    print("Data Requirements:")
    for req in summary['data_requirements']:
        print(f"  - {req}")
    print()
    
    print("Methodology:")
    methodology = summary['methodology']
    print(f"  PoF Calculation: {methodology['pof_calculation']}")
    print(f"  CoF Calculation: {methodology['cof_calculation']}")
    print(f"  Risk Determination: {methodology['risk_determination']}")
    print(f"  Interval Calculation: {methodology['interval_calculation']}")
    print()
    
    print(f"Confidence Level: {summary['confidence_level']}")
    print()
    
    print("Typical Use Cases:")
    for use_case in summary['typical_use_cases']:
        print(f"  - {use_case}")
    print()


if __name__ == "__main__":
    """Run all Level 2 RBI calculator examples"""
    
    print("Level 2 RBI Calculator - Comprehensive Examples")
    print("=" * 60)
    print()
    
    # Run all demonstrations
    demonstrate_basic_calculation()
    print("-" * 60)
    print()
    
    demonstrate_custom_configuration()
    print("-" * 60)
    print()
    
    demonstrate_data_validation()
    print("-" * 60)
    print()
    
    demonstrate_high_vs_low_risk()
    print("-" * 60)
    print()
    
    demonstrate_calculation_summary()
    
    print("All Level 2 RBI calculator examples completed successfully!")