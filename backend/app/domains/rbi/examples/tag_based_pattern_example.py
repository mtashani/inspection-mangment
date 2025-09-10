"""Tag-based Pattern Recognition Example for Refinery Equipment"""

import sys
import os

# Add the backend directory to Python path
backend_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(__file__))))
sys.path.insert(0, backend_dir)

from datetime import datetime, timedelta
from app.domains.rbi.services.pattern_recognition_engine import PatternRecognitionEngine
from app.domains.rbi.models.core import (
    RBICalculationResult,
    EquipmentData,
    RBILevel,
    RiskLevel,
    EquipmentType,
    ServiceType
)


def demonstrate_tag_based_pattern_recognition():
    """Demonstrate tag-based pattern recognition for refinery equipment"""
    
    print("=== Tag-based Pattern Recognition for Refinery Equipment ===\n")
    
    engine = PatternRecognitionEngine()
    
    # 1. Create sister equipment (same service, different suffixes)
    print("1. Creating Sister Equipment Family")
    print("-" * 50)
    
    # Heat exchangers in service 401 of unit 101
    sister_equipment_data = []
    sister_historical_data = {}
    
    suffixes = ['A', 'B', 'C', 'D']
    base_tag = "101-E-401"
    
    for suffix in suffixes:
        equipment_id = f"{base_tag}{suffix}"
        
        # Create equipment data
        equipment = EquipmentData(
            equipment_id=equipment_id,
            equipment_type=EquipmentType.HEAT_EXCHANGER,
            service_type=ServiceType.SOUR_GAS,
            installation_date=datetime.now() - timedelta(days=12*365),
            design_pressure=45.0,
            design_temperature=180.0,
            material="Carbon Steel",
            criticality_level="High"
        )
        sister_equipment_data.append(equipment)
        
        # Create historical calculations with slight variations
        calculations = []
        base_date = datetime.now() - timedelta(days=365)
        
        # Simulate similar but not identical degradation patterns
        risk_levels = [RiskLevel.MEDIUM, RiskLevel.MEDIUM, RiskLevel.HIGH, RiskLevel.HIGH]
        base_pof = 0.6 + (ord(suffix) - ord('A')) * 0.05  # Slight variation
        
        for i in range(4):  # 4 calculations over the year
            calc = RBICalculationResult(
                equipment_id=equipment_id,
                calculation_level=RBILevel.LEVEL_2,
                requested_level=RBILevel.LEVEL_2,
                fallback_occurred=False,
                next_inspection_date=base_date + timedelta(days=i*90 + 730),
                risk_level=risk_levels[i] if suffix in ['A', 'B'] else RiskLevel.HIGH,  # C&D have higher risk
                pof_score=base_pof + (i * 0.1),
                cof_scores={
                    "safety": 0.7 + (i * 0.05),
                    "environmental": 0.6,
                    "economic": 0.8
                },
                confidence_score=0.85 - (i * 0.02),
                data_quality_score=0.9,
                calculation_timestamp=base_date + timedelta(days=i*90),
                inspection_interval_months=18 if suffix in ['C', 'D'] else 24,  # Higher risk = shorter interval
                missing_data=[],
                estimated_parameters=[]
            )
            calculations.append(calc)
        
        sister_historical_data[equipment_id] = calculations
        
        print(f"  Created {equipment_id}: {equipment.equipment_type.value} in {equipment.service_type.value} service")
    
    print(f"\nSister Equipment Summary:")
    print(f"  Base Tag: {base_tag}")
    print(f"  Equipment Count: {len(sister_equipment_data)}")
    print(f"  Service Type: {sister_equipment_data[0].service_type.value}")
    
    # 2. Create parallel equipment (same type, different services)
    print(f"\n2. Creating Parallel Equipment")
    print("-" * 50)
    
    parallel_equipment_data = []
    parallel_historical_data = {}
    
    # Same unit, same equipment type, different services
    service_numbers = ['101', '201', '301', '501']  # Different services in same unit
    
    for service_num in service_numbers:
        equipment_id = f"101-E-{service_num}A"
        
        equipment = EquipmentData(
            equipment_id=equipment_id,
            equipment_type=EquipmentType.HEAT_EXCHANGER,
            service_type=ServiceType.SOUR_GAS,  # Same service type
            installation_date=datetime.now() - timedelta(days=10*365),
            design_pressure=50.0,
            design_temperature=200.0,
            material="Carbon Steel",
            criticality_level="High"
        )
        parallel_equipment_data.append(equipment)
        
        # Create historical data
        calculations = []
        base_date = datetime.now() - timedelta(days=300)
        
        for i in range(3):
            calc = RBICalculationResult(
                equipment_id=equipment_id,
                calculation_level=RBILevel.LEVEL_2,
                requested_level=RBILevel.LEVEL_2,
                fallback_occurred=False,
                next_inspection_date=base_date + timedelta(days=i*100 + 730),
                risk_level=RiskLevel.MEDIUM,
                pof_score=0.55 + (i * 0.1),
                cof_scores={"safety": 0.65, "environmental": 0.6, "economic": 0.75},
                confidence_score=0.8,
                data_quality_score=0.85,
                calculation_timestamp=base_date + timedelta(days=i*100),
                inspection_interval_months=24,
                missing_data=[],
                estimated_parameters=[]
            )
            calculations.append(calc)
        
        parallel_historical_data[equipment_id] = calculations
        
        print(f"  Created {equipment_id}: Service {service_num}")
    
    # 3. Combine all equipment data
    all_equipment_data = sister_equipment_data + parallel_equipment_data
    all_historical_data = {**sister_historical_data, **parallel_historical_data}
    
    print(f"\nTotal Equipment Created: {len(all_equipment_data)}")
    
    # 4. Demonstrate tag parsing
    print(f"\n3. Tag Parsing Analysis")
    print("-" * 50)
    
    sample_tags = ["101-E-401A", "101-E-401B", "101-E-201A", "102-P-301C", "VESSEL-001"]
    
    for tag in sample_tags:
        tag_info = engine._parse_equipment_tag(tag)
        print(f"  Tag: {tag}")
        print(f"    Unit: {tag_info['unit']}")
        print(f"    Equipment Type Code: {tag_info['equipment_type_code']}")
        print(f"    Service Number: {tag_info['service_number']}")
        print(f"    Item Suffix: {tag_info['item_suffix']}")
        print(f"    Base Tag: {tag_info['base_tag']}")
        print(f"    Standard Format: {tag_info['is_standard_tag']}")
        print()
    
    # 5. Find sister and parallel equipment
    print(f"4. Sister and Parallel Equipment Detection")
    print("-" * 50)
    
    target_equipment = "101-E-401A"
    all_equipment_ids = [eq.equipment_id for eq in all_equipment_data]
    
    sister_equipment = engine._find_sister_equipment(target_equipment, all_equipment_ids)
    parallel_equipment = engine._find_parallel_equipment(target_equipment, all_equipment_ids)
    
    print(f"Target Equipment: {target_equipment}")
    print(f"Sister Equipment: {sister_equipment}")
    print(f"Parallel Equipment: {parallel_equipment}")
    
    # 6. Enhanced analysis with tag intelligence
    print(f"\n5. Enhanced Pattern Analysis with Tag Intelligence")
    print("-" * 50)
    
    target_eq_data = next(eq for eq in all_equipment_data if eq.equipment_id == target_equipment)
    target_historical = all_historical_data[target_equipment]
    
    # Run enhanced analysis
    enhanced_result = engine.analyze_equipment_with_tag_intelligence(
        equipment_data=target_eq_data,
        historical_calculations=target_historical,
        all_equipment_data=all_equipment_data,
        all_historical_data=all_historical_data
    )
    
    print(f"Enhanced Analysis Results for {enhanced_result.equipment_id}:")
    
    # Display identified families (including tag-based)
    print(f"\nIdentified Equipment Families:")
    for family_match in enhanced_result.identified_families:
        print(f"  • {family_match.pattern_id}")
        print(f"    Type: {family_match.pattern_type.value}")
        print(f"    Confidence: {family_match.match_confidence.value}")
        print(f"    Similarity: {family_match.similarity_score:.2%}")
        if family_match.pattern_id.startswith("TAG_"):
            print(f"    ** Tag-based Family **")
    
    # Display enhanced parameter recommendations
    print(f"\nEnhanced Parameter Recommendations:")
    for param, value in enhanced_result.parameter_recommendations.items():
        print(f"  {param}: {value}")
    
    # Display risk adjustments
    print(f"\nRisk Adjustments:")
    for adjustment, factor in enhanced_result.risk_adjustments.items():
        print(f"  {adjustment}: {factor:.2f}x")
    
    # Display anomalies (including tag-based)
    if enhanced_result.anomalies:
        print(f"\nAnomalies Detected:")
        for anomaly in enhanced_result.anomalies:
            print(f"  ⚠ {anomaly}")
    
    # 7. Demonstrate tag-based family creation
    print(f"\n6. Tag-based Family Creation")
    print("-" * 50)
    
    tag_family = engine._create_tag_based_family(
        target_eq_data, sister_equipment, parallel_equipment, all_historical_data
    )
    
    if tag_family:
        print(f"Created Tag-based Family:")
        print(f"  Family ID: {tag_family.family_id}")
        print(f"  Family Name: {tag_family.family_name}")
        print(f"  Member Count: {len(tag_family.member_equipment)}")
        print(f"  Confidence Score: {tag_family.confidence_score:.2%}")
        
        print(f"\n  Common Characteristics:")
        for char, value in tag_family.common_characteristics.items():
            print(f"    {char}: {value}")
        
        print(f"\n  Typical Risk Profile:")
        for risk_type, score in tag_family.typical_risk_profile.items():
            print(f"    {risk_type}: {score:.2f}")
        
        print(f"\n  Recommended Parameters:")
        for param, value in tag_family.recommended_parameters.items():
            print(f"    {param}: {value}")
        
        print(f"\n  Expected Degradation Patterns:")
        for pattern in tag_family.degradation_patterns:
            print(f"    • {pattern}")
    
    # 8. Sister equipment comparison
    print(f"\n7. Sister Equipment Risk Comparison")
    print("-" * 50)
    
    print(f"Risk Level Comparison for {base_tag} Series:")
    print(f"{'Equipment':<12} {'Latest Risk':<12} {'Avg PoF':<10} {'Interval':<10}")
    print("-" * 50)
    
    for eq_id in [target_equipment] + sister_equipment:
        if eq_id in all_historical_data:
            latest_calc = max(all_historical_data[eq_id], key=lambda x: x.calculation_timestamp)
            avg_pof = sum(calc.pof_score for calc in all_historical_data[eq_id]) / len(all_historical_data[eq_id])
            
            print(f"{eq_id:<12} {latest_calc.risk_level.value:<12} {avg_pof:<10.2f} {latest_calc.inspection_interval_months:<10}")
    
    # 9. Maintenance optimization insights
    print(f"\n8. Maintenance Optimization Insights")
    print("-" * 50)
    
    # Group by risk level for maintenance planning
    risk_groups = {}
    for eq_id in [target_equipment] + sister_equipment:
        if eq_id in all_historical_data:
            latest_calc = max(all_historical_data[eq_id], key=lambda x: x.calculation_timestamp)
            risk_level = latest_calc.risk_level.value
            if risk_level not in risk_groups:
                risk_groups[risk_level] = []
            risk_groups[risk_level].append(eq_id)
    
    print("Maintenance Grouping by Risk Level:")
    for risk_level, equipment_list in risk_groups.items():
        print(f"  {risk_level} Risk ({len(equipment_list)} units):")
        for eq_id in equipment_list:
            latest_calc = max(all_historical_data[eq_id], key=lambda x: x.calculation_timestamp)
            print(f"    • {eq_id} - Next inspection: {latest_calc.inspection_interval_months} months")
    
    print(f"\nRecommendations:")
    if len(risk_groups.get('High', [])) > 1:
        print(f"  • Consider coordinated maintenance for High risk units: {', '.join(risk_groups['High'])}")
    if len(sister_equipment) > 2:
        print(f"  • Implement sister equipment data sharing for improved predictions")
        print(f"  • Consider staggered maintenance schedule to maintain operational capacity")
    
    print(f"\n=== Tag-based Pattern Recognition Demo Complete ===")


def demonstrate_multi_unit_analysis():
    """Demonstrate pattern recognition across multiple units"""
    
    print(f"\n=== Multi-Unit Pattern Analysis ===\n")
    
    engine = PatternRecognitionEngine()
    
    # Create equipment across multiple units
    units = ['101', '102', '103']
    services = ['401', '402']
    suffixes = ['A', 'B']
    
    all_equipment = []
    all_historical = {}
    
    print("Creating Multi-Unit Equipment Fleet:")
    
    for unit in units:
        for service in services:
            for suffix in suffixes:
                equipment_id = f"{unit}-E-{service}{suffix}"
                
                equipment = EquipmentData(
                    equipment_id=equipment_id,
                    equipment_type=EquipmentType.HEAT_EXCHANGER,
                    service_type=ServiceType.SOUR_GAS,
                    installation_date=datetime.now() - timedelta(days=int(unit)*365//10),  # Different ages
                    design_pressure=40.0 + int(service) - 400,  # Service-dependent pressure
                    design_temperature=180.0,
                    material="Carbon Steel",
                    criticality_level="High"
                )
                all_equipment.append(equipment)
                
                # Create historical data with unit-specific patterns
                calculations = []
                base_risk = RiskLevel.MEDIUM if unit == '101' else RiskLevel.HIGH
                
                calc = RBICalculationResult(
                    equipment_id=equipment_id,
                    calculation_level=RBILevel.LEVEL_2,
                    requested_level=RBILevel.LEVEL_2,
                    fallback_occurred=False,
                    next_inspection_date=datetime.now() + timedelta(days=730),
                    risk_level=base_risk,
                    pof_score=0.5 + (int(unit) - 101) * 0.1,  # Unit-dependent degradation
                    cof_scores={"safety": 0.7, "environmental": 0.6, "economic": 0.8},
                    confidence_score=0.8,
                    data_quality_score=0.85,
                    calculation_timestamp=datetime.now() - timedelta(days=30),
                    inspection_interval_months=24 if base_risk == RiskLevel.MEDIUM else 18,
                    missing_data=[],
                    estimated_parameters=[]
                )
                calculations.append(calc)
                all_historical[equipment_id] = calculations
                
                print(f"  {equipment_id}: Unit {unit}, Service {service}, Risk: {base_risk.value}")
    
    print(f"\nTotal Equipment Created: {len(all_equipment)}")
    
    # Analyze patterns across the fleet
    print(f"\nFleet-wide Pattern Analysis:")
    
    # Group by units
    unit_groups = {}
    for eq in all_equipment:
        tag_info = engine._parse_equipment_tag(eq.equipment_id)
        unit = tag_info['unit']
        if unit not in unit_groups:
            unit_groups[unit] = []
        unit_groups[unit].append(eq.equipment_id)
    
    for unit, equipment_list in unit_groups.items():
        print(f"\nUnit {unit} ({len(equipment_list)} equipment):")
        
        # Calculate unit statistics
        unit_risks = []
        unit_intervals = []
        
        for eq_id in equipment_list:
            if eq_id in all_historical:
                calc = all_historical[eq_id][0]
                unit_risks.append(engine._risk_to_numeric(calc.risk_level))
                unit_intervals.append(calc.inspection_interval_months)
        
        if unit_risks:
            avg_risk = sum(unit_risks) / len(unit_risks)
            avg_interval = sum(unit_intervals) / len(unit_intervals)
            
            print(f"  Average Risk Level: {avg_risk:.1f}")
            print(f"  Average Inspection Interval: {avg_interval:.0f} months")
            
            # Unit-specific recommendations
            if avg_risk > 2.5:
                print(f"  ⚠ Unit {unit} shows elevated risk - consider unit-wide inspection")
            if len(set(unit_intervals)) == 1:
                print(f"  ✓ Consistent inspection intervals - good for maintenance planning")
    
    print(f"\n=== Multi-Unit Analysis Complete ===")


if __name__ == "__main__":
    demonstrate_tag_based_pattern_recognition()
    demonstrate_multi_unit_analysis()