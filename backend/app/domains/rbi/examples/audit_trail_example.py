"""Audit Trail Service Usage Examples"""

import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(__file__)))))

from datetime import datetime, timedelta
from app.domains.rbi.services.audit_trail_service import AuditTrailService, AuditEventType
from app.domains.rbi.models.core import (
    RBICalculationResult,
    EquipmentData,
    ExtractedRBIData,
    ThicknessMeasurement,
    RBILevel,
    RiskLevel,
    EquipmentType,
    ServiceType
)


def demonstrate_audit_trail_service():
    """Demonstrate comprehensive audit trail service functionality"""
    
    print("=== Audit Trail Service Demonstration ===\n")
    
    # Initialize service
    audit_service = AuditTrailService()
    
    # 1. Demonstrate calculation event logging
    print("1. Logging RBI Calculation Events")
    print("-" * 40)
    
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
        calculation_timestamp=datetime.now(),
        inspection_interval_months=24,
        missing_data=[],
        estimated_parameters=[]
    )
    
    # Create equipment context
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
    
    # Create data context
    extracted_data = ExtractedRBIData(
        equipment_id="VESSEL-001",
        thickness_measurements=[
            ThicknessMeasurement(
                location="Top",
                thickness=12.5,
                measurement_date=datetime.now(),
                minimum_required=10.0
            ),
            ThicknessMeasurement(
                location="Middle",
                thickness=12.3,
                measurement_date=datetime.now(),
                minimum_required=10.0
            ),
            ThicknessMeasurement(
                location="Bottom",
                thickness=12.1,
                measurement_date=datetime.now(),
                minimum_required=10.0
            )
        ],
        corrosion_rate=0.15,
        inspection_quality="good",
        damage_mechanisms=["GENERAL_CORROSION", "PITTING"]
    )
    
    # Log calculation event with full context
    event_id = audit_service.log_calculation_event(
        calculation_result=calculation_result,
        equipment_data=equipment_data,
        extracted_data=extracted_data,
        user_id="inspector_001",
        session_id="session_12345"
    )
    
    print(f"✓ Logged calculation event: {event_id}")
    print(f"  Equipment: {calculation_result.equipment_id}")
    print(f"  Risk Level: {calculation_result.risk_level.value}")
    print(f"  Confidence: {calculation_result.confidence_score:.2f}")
    print()
    
    # 2. Demonstrate fallback scenario
    print("2. Logging Fallback Calculation")
    print("-" * 40)
    
    fallback_result = RBICalculationResult(
        equipment_id="PUMP-002",
        calculation_level=RBILevel.LEVEL1,
        requested_level=RBILevel.LEVEL2,
        risk_level=RiskLevel.HIGH,
        pof_score=0.8,
        cof_scores={"safety": 0.9, "environmental": 0.7},
        confidence_score=0.6,
        data_quality_score=0.5,
        inspection_interval_months=12,
        fallback_occurred=True,
        missing_data=["corrosion_rate", "detailed_thickness_data"],
        estimated_parameters=["pof_score"],
        calculation_timestamp=datetime.now()
    )
    
    fallback_event_id = audit_service.log_calculation_event(
        calculation_result=fallback_result,
        user_id="inspector_002"
    )
    
    print(f"✓ Logged fallback event: {fallback_event_id}")
    print(f"  Equipment: {fallback_result.equipment_id}")
    print(f"  Requested Level: {fallback_result.requested_level.value}")
    print(f"  Actual Level: {fallback_result.calculation_level.value}")
    print(f"  Missing Data: {', '.join(fallback_result.missing_data)}")
    print()
    
    # 3. Demonstrate configuration change logging
    print("3. Logging Configuration Changes")
    print("-" * 40)
    
    before_config = {
        "risk_matrix": {
            "low_threshold": 0.3,
            "medium_threshold": 0.6,
            "high_threshold": 0.8
        }
    }
    
    after_config = {
        "risk_matrix": {
            "low_threshold": 0.25,
            "medium_threshold": 0.55,
            "high_threshold": 0.75
        }
    }
    
    config_event_id = audit_service.log_configuration_change(
        configuration_type="risk_matrix",
        change_description="Updated risk thresholds based on industry standards",
        before_state=before_config,
        after_state=after_config,
        user_id="admin_001"
    )
    
    print(f"✓ Logged configuration change: {config_event_id}")
    print(f"  Type: risk_matrix")
    print(f"  Change: Updated thresholds")
    print()
    
    # 4. Demonstrate data update logging
    print("4. Logging Data Updates")
    print("-" * 40)
    
    before_data = {"thickness_reading": 12.5, "measurement_date": "2024-01-15"}
    after_data = {"thickness_reading": 12.3, "measurement_date": "2024-01-30"}
    
    data_event_id = audit_service.log_data_update(
        equipment_id="VESSEL-001",
        data_type="thickness_measurement",
        update_description="Updated thickness reading from latest inspection",
        before_state=before_data,
        after_state=after_data,
        user_id="inspector_001"
    )
    
    print(f"✓ Logged data update: {data_event_id}")
    print(f"  Equipment: VESSEL-001")
    print(f"  Data Type: thickness_measurement")
    print(f"  Change: 12.5mm → 12.3mm")
    print()
    
    # 5. Demonstrate batch operation logging
    print("5. Logging Batch Operations")
    print("-" * 40)
    
    batch_details = {
        "operation_duration": "8 minutes 32 seconds",
        "equipment_list": ["VESSEL-001", "VESSEL-002", "PUMP-001", "PUMP-002", "TANK-001"],
        "calculation_level": "level2",
        "initiated_by": "scheduled_job"
    }
    
    batch_event_id = audit_service.log_batch_operation(
        operation_type="bulk_rbi_calculation",
        equipment_count=5,
        success_count=4,
        failure_count=1,
        operation_details=batch_details,
        user_id="system"
    )
    
    print(f"✓ Logged batch operation: {batch_event_id}")
    print(f"  Operation: bulk_rbi_calculation")
    print(f"  Success Rate: 80% (4/5)")
    print(f"  Duration: 8 minutes 32 seconds")
    print()
    
    # 6. Demonstrate error logging
    print("6. Logging Error Events")
    print("-" * 40)
    
    error_details = {
        "exception_type": "ValueError",
        "stack_trace": "Traceback (most recent call last)...",
        "input_parameters": {"equipment_id": "TANK-001", "calculation_level": "level3"},
        "system_state": "normal_operation"
    }
    
    error_event_id = audit_service.log_error_event(
        error_type="calculation_error",
        error_message="Invalid calculation level requested for equipment type",
        equipment_id="TANK-001",
        error_details=error_details,
        user_id="inspector_003"
    )
    
    print(f"✓ Logged error event: {error_event_id}")
    print(f"  Error Type: calculation_error")
    print(f"  Equipment: TANK-001")
    print(f"  Message: Invalid calculation level requested")
    print()
    
    # 7. Demonstrate audit trail retrieval
    print("7. Retrieving Audit Trail")
    print("-" * 40)
    
    # Get all events
    all_events = audit_service.get_audit_trail(limit=10)
    print(f"Total events logged: {len(all_events)}")
    
    # Get events by type
    calc_events = audit_service.get_audit_trail(event_type=AuditEventType.CALCULATION_EXECUTED)
    print(f"Calculation events: {len(calc_events)}")
    
    # Get events by equipment
    vessel_events = audit_service.get_audit_trail(equipment_id="VESSEL-001")
    print(f"VESSEL-001 events: {len(vessel_events)}")
    
    # Get events by user
    inspector_events = audit_service.get_audit_trail(user_id="inspector_001")
    print(f"Inspector_001 events: {len(inspector_events)}")
    print()
    
    # 8. Demonstrate historical data analysis
    print("8. Historical Data Analysis")
    print("-" * 40)
    
    # Add more historical data points for trend analysis
    base_time = datetime.now() - timedelta(days=180)
    
    for i in range(6):
        # Simulate equipment degradation over time
        risk_progression = [RiskLevel.LOW, RiskLevel.LOW, RiskLevel.MEDIUM, 
                          RiskLevel.MEDIUM, RiskLevel.HIGH, RiskLevel.HIGH]
        
        historical_result = RBICalculationResult(
            equipment_id="VESSEL-001",
            calculation_level=RBILevel.LEVEL2,
            requested_level=RBILevel.LEVEL2,
            risk_level=risk_progression[i],
            pof_score=0.3 + (i * 0.1),
            cof_scores={"safety": 0.6 + (i * 0.05)},
            confidence_score=0.9 - (i * 0.02),
            data_quality_score=0.85,
            inspection_interval_months=36 - (i * 4),
            fallback_occurred=i > 4,
            missing_data=[],
            estimated_parameters=[],
            calculation_timestamp=base_time + timedelta(days=i * 30)
        )
        
        audit_service.log_calculation_event(historical_result, user_id="system")
    
    # Get historical data
    historical_data = audit_service.get_historical_data("VESSEL-001")
    print(f"Historical data points for VESSEL-001: {len(historical_data)}")
    
    # Generate trend analysis
    trend_analysis = audit_service.generate_trend_analysis("VESSEL-001", analysis_period_days=365)
    
    print(f"Risk Trend: {trend_analysis.risk_trend}")
    print(f"Confidence Trend: {trend_analysis.confidence_trend}")
    print(f"Key Changes: {len(trend_analysis.key_changes)}")
    print(f"Recommendations: {len(trend_analysis.recommendations)}")
    
    if trend_analysis.recommendations:
        print("Top Recommendations:")
        for i, rec in enumerate(trend_analysis.recommendations[:3], 1):
            print(f"  {i}. {rec}")
    print()
    
    # 9. Demonstrate audit summary
    print("9. Audit Summary Report")
    print("-" * 40)
    
    summary = audit_service.get_audit_summary()
    
    print(f"Total Events: {summary['total_events']}")
    print(f"Critical Events: {summary['critical_events_count']}")
    print(f"Error Events: {summary['error_events_count']}")
    print(f"Warning Events: {summary['warning_events_count']}")
    print(f"Active Users: {len(summary['active_users'])}")
    
    print("\nEvent Type Distribution:")
    for event_type, count in summary['event_type_distribution'].items():
        print(f"  {event_type}: {count}")
    
    print("\nTop Equipment by Activity:")
    for equipment_id, count in list(summary['top_equipment'].items())[:3]:
        print(f"  {equipment_id}: {count} events")
    print()
    
    # 10. Demonstrate audit integrity verification
    print("10. Audit Integrity Verification")
    print("-" * 40)
    
    integrity_report = audit_service.verify_audit_integrity()
    
    print(f"Total Events Verified: {integrity_report['total_events']}")
    print("Integrity Checks:")
    for check_name, passed in integrity_report['integrity_checks'].items():
        status = "✓ PASS" if passed else "✗ FAIL"
        print(f"  {check_name}: {status}")
    
    if integrity_report['issues_found']:
        print("\nIssues Found:")
        for issue in integrity_report['issues_found']:
            print(f"  • {issue}")
    
    print("\nRecommendations:")
    for rec in integrity_report['recommendations']:
        print(f"  • {rec}")
    print()
    
    # 11. Demonstrate event serialization
    print("11. Event Serialization Examples")
    print("-" * 40)
    
    # Get a sample event
    sample_event = all_events[0] if all_events else None
    
    if sample_event:
        print("Event Dictionary Format:")
        event_dict = sample_event.to_dict()
        print(f"  Event ID: {event_dict['event_id']}")
        print(f"  Type: {event_dict['event_type']}")
        print(f"  Severity: {event_dict['severity']}")
        print(f"  Timestamp: {event_dict['timestamp']}")
        
        print("\nEvent JSON Format (first 200 chars):")
        event_json = sample_event.to_json()
        print(f"  {event_json[:200]}...")
    
    print("\n=== Audit Trail Service Demonstration Complete ===")


def demonstrate_advanced_filtering():
    """Demonstrate advanced audit trail filtering capabilities"""
    
    print("\n=== Advanced Filtering Demonstration ===\n")
    
    audit_service = AuditTrailService()
    
    # Create sample data with different timestamps
    base_time = datetime.now() - timedelta(days=7)
    
    # Add events across different days
    for day in range(7):
        for hour in [9, 14, 18]:  # Morning, afternoon, evening
            timestamp = base_time + timedelta(days=day, hours=hour)
            
            result = RBICalculationResult(
                equipment_id=f"EQ-{day % 3 + 1:03d}",
                calculation_level=RBILevel.LEVEL2,
                requested_level=RBILevel.LEVEL2,
                risk_level=RiskLevel.MEDIUM,
                pof_score=0.5 + (day * 0.05),
                cof_scores={"safety": 0.6},
                confidence_score=0.8,
                data_quality_score=0.85,
                inspection_interval_months=24,
                fallback_occurred=day > 4,
                missing_data=[],
                estimated_parameters=[],
                calculation_timestamp=timestamp
            )
            
            # Mock the timestamp for consistent testing
            with patch('app.domains.rbi.services.audit_trail_service.datetime') as mock_dt:
                mock_dt.now.return_value = timestamp
                audit_service.log_calculation_event(result, user_id=f"user_{day % 2 + 1}")
    
    print(f"Created {len(audit_service._audit_events)} sample events")
    
    # Demonstrate date range filtering
    print("\n1. Date Range Filtering:")
    
    # Last 3 days
    three_days_ago = datetime.now() - timedelta(days=3)
    recent_events = audit_service.get_audit_trail(start_date=three_days_ago)
    print(f"  Events in last 3 days: {len(recent_events)}")
    
    # Specific day range
    start_date = base_time + timedelta(days=2)
    end_date = base_time + timedelta(days=4)
    range_events = audit_service.get_audit_trail(start_date=start_date, end_date=end_date)
    print(f"  Events in days 2-4: {len(range_events)}")
    
    # Demonstrate equipment filtering
    print("\n2. Equipment Filtering:")
    for eq_id in ["EQ-001", "EQ-002", "EQ-003"]:
        eq_events = audit_service.get_audit_trail(equipment_id=eq_id)
        print(f"  {eq_id} events: {len(eq_events)}")
    
    # Demonstrate user filtering
    print("\n3. User Filtering:")
    for user_id in ["user_1", "user_2"]:
        user_events = audit_service.get_audit_trail(user_id=user_id)
        print(f"  {user_id} events: {len(user_events)}")
    
    # Demonstrate combined filtering
    print("\n4. Combined Filtering:")
    combined_events = audit_service.get_audit_trail(
        equipment_id="EQ-001",
        user_id="user_1",
        start_date=three_days_ago
    )
    print(f"  EQ-001 + user_1 + last 3 days: {len(combined_events)}")


if __name__ == "__main__":
    # Import patch for timestamp mocking
    from unittest.mock import patch
    
    demonstrate_audit_trail_service()
    demonstrate_advanced_filtering()