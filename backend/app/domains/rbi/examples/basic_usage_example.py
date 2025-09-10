"""Basic usage example for RBI domain models"""

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
from app.domains.rbi.models.config import RBIConfig


def create_sample_equipment() -> EquipmentData:
    """Create sample equipment data"""
    return EquipmentData(
        equipment_id="V-101",
        equipment_type=EquipmentType.PRESSURE_VESSEL,
        service_type=ServiceType.SOUR_GAS,
        installation_date=datetime(2010, 1, 1),
        design_pressure=25.0,
        design_temperature=150.0,
        material="CS",
        criticality_level="High",
        coating_type="Epoxy",
        location="open_area",
        inventory_size=50.0
    )


def create_sample_thickness_measurements() -> list[ThicknessMeasurement]:
    """Create sample thickness measurements"""
    return [
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
            location="Head",
            thickness=13.2,
            measurement_date=datetime.now() - timedelta(days=30),
            minimum_required=10.0,
            measurement_method="UT",
            inspector="John Doe"
        )
    ]


def create_sample_inspection_findings() -> list[InspectionFinding]:
    """Create sample inspection findings"""
    return [
        InspectionFinding(
            finding_type="General Corrosion",
            severity="Medium",
            description="Uniform corrosion observed on shell surface",
            location="Shell_External",
            recommendation="Continue monitoring, apply protective coating",
            finding_date=datetime.now() - timedelta(days=30)
        ),
        InspectionFinding(
            finding_type="Pitting",
            severity="Low",
            description="Minor pitting observed near nozzle",
            location="Nozzle_N1",
            recommendation="Monitor during next inspection",
            finding_date=datetime.now() - timedelta(days=30)
        )
    ]


def create_sample_extracted_data() -> ExtractedRBIData:
    """Create sample extracted RBI data"""
    return ExtractedRBIData(
        equipment_id="V-101",
        thickness_measurements=create_sample_thickness_measurements(),
        corrosion_rate=0.15,  # mm/year
        coating_condition="moderate",
        damage_mechanisms=["General Corrosion", "Pitting"],
        inspection_findings=create_sample_inspection_findings(),
        last_inspection_date=datetime.now() - timedelta(days=30),
        inspection_quality="good"
    )


def create_sample_calculation_result() -> RBICalculationResult:
    """Create sample RBI calculation result"""
    return RBICalculationResult(
        equipment_id="V-101",
        calculation_level=RBILevel.LEVEL_2,
        requested_level=RBILevel.LEVEL_3,
        fallback_occurred=True,
        next_inspection_date=datetime.now() + timedelta(days=730),  # 2 years
        risk_level=RiskLevel.MEDIUM,
        pof_score=3.2,
        cof_scores={
            "safety": 2.8,
            "environmental": 3.1,
            "economic": 2.5
        },
        confidence_score=0.75,
        data_quality_score=0.68,
        calculation_timestamp=datetime.now(),
        input_parameters={
            "corrosion_rate": 0.15,
            "equipment_age": 14.5,
            "damage_mechanisms_count": 2,
            "coating_condition": "moderate",
            "inspection_quality": "good"
        },
        missing_data=["stress_analysis", "metallurgical_analysis"],
        estimated_parameters=["corrosion_rate"],
        inspection_interval_months=24
    )


def demonstrate_basic_usage():
    """Demonstrate basic usage of RBI models"""
    print("=== RBI Domain Models Usage Example ===\n")
    
    # Create sample equipment
    equipment = create_sample_equipment()
    print(f"Equipment: {equipment.equipment_id}")
    print(f"Type: {equipment.equipment_type.value}")
    print(f"Service: {equipment.service_type.value}")
    print(f"Age: {equipment.age_years:.1f} years")
    print(f"Design Pressure: {equipment.design_pressure} bar")
    print()
    
    # Create sample extracted data
    extracted_data = create_sample_extracted_data()
    print(f"Extracted Data for: {extracted_data.equipment_id}")
    print(f"Corrosion Rate: {extracted_data.corrosion_rate} mm/year")
    print(f"Coating Condition: {extracted_data.coating_condition}")
    print(f"Damage Mechanisms: {', '.join(extracted_data.damage_mechanisms)}")
    print(f"Thickness Measurements: {len(extracted_data.thickness_measurements)}")
    print(f"Inspection Findings: {len(extracted_data.inspection_findings)}")
    print()
    
    # Show thickness measurements
    print("Thickness Measurements:")
    for measurement in extracted_data.thickness_measurements:
        print(f"  {measurement.location}: {measurement.thickness} mm "
              f"(min: {measurement.minimum_required} mm)")
    print()
    
    # Show inspection findings
    print("Inspection Findings:")
    for finding in extracted_data.inspection_findings:
        print(f"  {finding.finding_type} ({finding.severity}): {finding.description}")
    print()
    
    # Create sample calculation result
    result = create_sample_calculation_result()
    print(f"RBI Calculation Result for: {result.equipment_id}")
    print(f"Requested Level: {result.requested_level.value}")
    print(f"Actual Level: {result.calculation_level.value}")
    print(f"Fallback Occurred: {result.fallback_occurred}")
    print(f"Risk Level: {result.risk_level.value}")
    print(f"PoF Score: {result.pof_score:.1f}")
    print(f"Overall CoF Score: {result.overall_cof_score:.1f}")
    print(f"CoF Breakdown:")
    for dimension, score in result.cof_scores.items():
        print(f"  {dimension.capitalize()}: {score:.1f}")
    print(f"Confidence Score: {result.confidence_score:.2f}")
    print(f"Data Quality Score: {result.data_quality_score:.2f}")
    print(f"Next Inspection: {result.next_inspection_date.strftime('%Y-%m-%d')}")
    print(f"Inspection Interval: {result.inspection_interval_months} months")
    print()
    
    if result.missing_data:
        print(f"Missing Data: {', '.join(result.missing_data)}")
    if result.estimated_parameters:
        print(f"Estimated Parameters: {', '.join(result.estimated_parameters)}")
    print()
    
    # Demonstrate configuration
    config = RBIConfig()
    print("RBI Configuration:")
    print(f"Available Calculation Levels: {len(config.level_requirements)}")
    print(f"PoF Scoring Tables: {len(config.scoring_tables.pof_tables)}")
    print(f"CoF Scoring Tables: {sum(len(tables) for tables in config.scoring_tables.cof_tables.values())}")
    print()
    
    # Show some scoring table examples
    print("Sample PoF Scoring Table (Corrosion Rate):")
    corrosion_table = config.scoring_tables.pof_tables["corrosion_rate"]
    for condition, score in corrosion_table.scoring_rules.items():
        print(f"  {condition} mm/year: Score {score}")
    print()
    
    print("Sample CoF Scoring Table (Safety - Fluid Type):")
    fluid_table = config.scoring_tables.cof_tables["safety"]["fluid"]
    for fluid_type, score in list(fluid_table.scoring_rules.items())[:5]:  # Show first 5
        print(f"  {fluid_type}: Score {score}")
    print("  ...")
    print()
    
    # Show risk matrix
    print("Risk Matrix (Sample):")
    print("PoF\\CoF    Low    Medium    High")
    print("Low        Low    Low       Medium")
    print("Medium     Low    Medium    High")
    print("High       Medium High      Very High")
    print()
    
    print("Inspection Intervals by Risk Level:")
    for risk_level, interval in config.risk_matrix.inspection_intervals.items():
        print(f"  {risk_level.value}: {interval} months")


if __name__ == "__main__":
    demonstrate_basic_usage()