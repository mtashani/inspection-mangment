"""Example usage of RBI Calculation Engine"""

from datetime import datetime, timedelta
from app.domains.rbi.services.rbi_calculation_engine import RBICalculationEngine
from app.domains.rbi.models.core import RBILevel
from app.domains.rbi.models.config import RBIConfig


def main():
    """Demonstrate RBI Calculation Engine usage"""
    
    print("=== RBI Calculation Engine Example ===\n")
    
    # Initialize the engine with default configuration
    config = RBIConfig()
    engine = RBICalculationEngine(config)
    
    # Example 1: Single equipment calculation
    print("1. Single Equipment RBI Calculation")
    print("-" * 40)
    
    equipment_id = "V-101"
    
    try:
        # Calculate with Level 3 request (will fallback if data insufficient)
        result = engine.calculate_next_inspection_date(
            equipment_id=equipment_id,
            requested_level=RBILevel.LEVEL_3
        )
        
        print(f"Equipment ID: {result.equipment_id}")
        print(f"Requested Level: {result.requested_level.value}")
        print(f"Actual Level: {result.calculation_level.value}")
        print(f"Fallback Occurred: {result.fallback_occurred}")
        print(f"Risk Level: {result.risk_level.value}")
        print(f"PoF Score: {result.pof_score:.2f}")
        print(f"CoF Scores: {result.cof_scores}")
        print(f"Confidence Score: {result.confidence_score:.2f}")
        print(f"Inspection Interval: {result.inspection_interval_months} months")
        print(f"Next Inspection Date: {result.next_inspection_date.strftime('%Y-%m-%d')}")
        
        if result.missing_data:
            print(f"Missing Data: {result.missing_data}")
        
        if result.estimated_parameters:
            print(f"Estimated Parameters: {result.estimated_parameters}")
            
    except Exception as e:
        print(f"Calculation failed: {str(e)}")
    
    print("\n" + "="*60 + "\n")
    
    # Example 2: Batch calculation
    print("2. Batch Equipment RBI Calculation")
    print("-" * 40)
    
    equipment_list = ["V-101", "V-102", "E-201", "P-301", "T-401"]
    
    try:
        results = engine.calculate_batch(
            equipment_ids=equipment_list,
            requested_level=RBILevel.LEVEL_2
        )
        
        print(f"Calculated RBI for {len(results)} equipment items:\n")
        
        for result in results:
            print(f"{result.equipment_id:8} | "
                  f"{result.calculation_level.value:8} | "
                  f"{result.risk_level.value:10} | "
                  f"{result.inspection_interval_months:2d} months | "
                  f"Confidence: {result.confidence_score:.2f}")
        
        # Summary statistics
        high_risk_count = sum(1 for r in results if r.risk_level.value == "High")
        avg_confidence = sum(r.confidence_score for r in results) / len(results)
        fallback_count = sum(1 for r in results if r.fallback_occurred)
        
        print(f"\nBatch Summary:")
        print(f"- High Risk Equipment: {high_risk_count}/{len(results)}")
        print(f"- Average Confidence: {avg_confidence:.2f}")
        print(f"- Fallback Occurred: {fallback_count}/{len(results)}")
        
    except Exception as e:
        print(f"Batch calculation failed: {str(e)}")
    
    print("\n" + "="*60 + "\n")
    
    # Example 3: Calculation summary and capabilities
    print("3. Equipment Calculation Summary")
    print("-" * 40)
    
    try:
        summary = engine.get_calculation_summary("V-101")
        
        print(f"Equipment: {summary['equipment_id']}")
        print(f"Type: {summary.get('equipment_type', 'Unknown')}")
        print(f"Service: {summary.get('service_type', 'Unknown')}")
        print(f"Age: {summary.get('age_years', 'Unknown')} years")
        print(f"Recommended Level: {summary.get('recommended_level', 'Unknown')}")
        
        if 'data_quality' in summary:
            dq = summary['data_quality']
            print(f"Data Quality Score: {dq.get('overall_score', 0):.2f}")
        
        print("\nLevel Capabilities:")
        if 'level_capabilities' in summary:
            for level, capability in summary['level_capabilities'].items():
                status = "✓" if capability.get('capable', False) else "✗"
                print(f"  {level}: {status}")
                
                if not capability.get('capable', False) and 'missing_requirements' in capability:
                    missing = capability['missing_requirements']
                    if missing:
                        print(f"    Missing: {', '.join(missing)}")
        
    except Exception as e:
        print(f"Summary generation failed: {str(e)}")
    
    print("\n" + "="*60 + "\n")
    
    # Example 4: Different calculation levels
    print("4. Comparison of Different Calculation Levels")
    print("-" * 50)
    
    equipment_id = "V-102"
    
    for level in [RBILevel.LEVEL_1, RBILevel.LEVEL_2, RBILevel.LEVEL_3]:
        try:
            result = engine.calculate_next_inspection_date(
                equipment_id=equipment_id,
                requested_level=level
            )
            
            print(f"{level.value:8} | "
                  f"Actual: {result.calculation_level.value:8} | "
                  f"Risk: {result.risk_level.value:10} | "
                  f"Interval: {result.inspection_interval_months:2d} months | "
                  f"Confidence: {result.confidence_score:.2f} | "
                  f"Fallback: {'Yes' if result.fallback_occurred else 'No'}")
            
        except Exception as e:
            print(f"{level.value:8} | ERROR: {str(e)}")
    
    print("\n" + "="*60)
    
    print("\n🎯 RBI Calculation Engine Demo Complete!")
    print("\nKey Features Demonstrated:")
    print("✓ Single equipment RBI calculation")
    print("✓ Batch processing capabilities")
    print("✓ Automatic level fallback")
    print("✓ Data quality assessment")
    print("✓ Comprehensive reporting")
    print("✓ Error handling and recovery")


if __name__ == "__main__":
    main()