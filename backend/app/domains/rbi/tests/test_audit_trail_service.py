"""Tests for Audit Trail Service"""

import pytest
from datetime import datetime, timedelta
from unittest.mock import Mock, patch

from app.domains.rbi.services.audit_trail_service import (
    AuditTrailService,
    AuditEvent,
    AuditEventType,
    AuditSeverity,
    HistoricalDataPoint,
    TrendAnalysis
)
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


class TestAuditTrailService:
    """Test cases for AuditTrailService"""
    
    @pytest.fixture
    def audit_service(self):
        """Create audit trail service instance"""
        return AuditTrailService()
    
    @pytest.fixture
    def sample_calculation_result(self):
        """Create sample calculation result"""
        return RBICalculationResult(
            equipment_id="EQ-001",
            calculation_level=RBILevel.LEVEL_2,
            requested_level=RBILevel.LEVEL_2,
            fallback_occurred=False,
            next_inspection_date=datetime.now() + timedelta(days=730),
            risk_level=RiskLevel.MEDIUM,
            pof_score=0.6,
            cof_scores={"safety": 0.7, "environmental": 0.5, "economic": 0.8},
            confidence_score=0.85,
            data_quality_score=0.9,
            calculation_timestamp=datetime.now(),
            inspection_interval_months=24,
            missing_data=[],
            estimated_parameters=[]
        )
    
    @pytest.fixture
    def sample_equipment_data(self):
        """Create sample equipment data"""
        return EquipmentData(
            equipment_id="EQ-001",
            equipment_type=EquipmentType.PRESSURE_VESSEL,
            service_type=ServiceType.SOUR_GAS,
            installation_date=datetime.now() - timedelta(days=15*365),
            design_pressure=50.0,
            design_temperature=200.0,
            material="Carbon Steel",
            criticality_level="High"
        )
    
    @pytest.fixture
    def sample_extracted_data(self):
        """Create sample extracted data"""
        return ExtractedRBIData(
            equipment_id="EQ-001",
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
                )
            ],
            corrosion_rate=0.2,
            inspection_quality="good",
            damage_mechanisms=["GENERAL_CORROSION", "PITTING"]
        )

    def test_log_calculation_event_success(self, audit_service, sample_calculation_result):
        """Test logging successful calculation event"""
        
        event_id = audit_service.log_calculation_event(
            calculation_result=sample_calculation_result,
            user_id="user123",
            session_id="session456"
        )
        
        assert event_id.startswith("AUD_")
        assert len(audit_service._audit_events) == 1
        assert len(audit_service._historical_data) == 1
        
        event = audit_service._audit_events[0]
        assert event.event_type == AuditEventType.CALCULATION_EXECUTED
        assert event.severity == AuditSeverity.INFO
        assert event.equipment_id == "EQ-001"
        assert event.user_id == "user123"
        assert event.session_id == "session456"
        assert "RBI calculation executed" in event.description
        
        # Check event details
        assert event.details["calculation_level"] == "Level_2"
        assert event.details["risk_level"] == "Medium"
        assert event.details["confidence_score"] == 0.85
        assert event.details["fallback_occurred"] is False

    def test_log_calculation_event_with_fallback(self, audit_service):
        """Test logging calculation event with fallback"""
        
        fallback_result = RBICalculationResult(
            equipment_id="EQ-002",
            calculation_level=RBILevel.LEVEL_1,
            requested_level=RBILevel.LEVEL_2,
            fallback_occurred=True,
            next_inspection_date=datetime.now() + timedelta(days=365),
            risk_level=RiskLevel.HIGH,
            pof_score=0.8,
            cof_scores={"safety": 0.9},
            confidence_score=0.6,
            data_quality_score=0.5,
            calculation_timestamp=datetime.now(),
            inspection_interval_months=12,
            missing_data=["corrosion_rate", "thickness_data"],
            estimated_parameters=["pof_score"]
        )
        
        event_id = audit_service.log_calculation_event(fallback_result)
        
        event = audit_service._audit_events[0]
        assert event.event_type == AuditEventType.FALLBACK_TRIGGERED
        assert event.severity == AuditSeverity.WARNING
        assert "fallback from Level_2" in event.description
        assert event.details["fallback_occurred"] is True
        assert "corrosion_rate" in event.details["missing_data"]

    def test_log_calculation_event_very_high_risk(self, audit_service):
        """Test logging calculation event with very high risk"""
        
        high_risk_result = RBICalculationResult(
            equipment_id="EQ-003",
            calculation_level=RBILevel.LEVEL_2,
            requested_level=RBILevel.LEVEL_2,
            fallback_occurred=False,
            next_inspection_date=datetime.now() + timedelta(days=180),
            risk_level=RiskLevel.VERY_HIGH,
            pof_score=0.95,
            cof_scores={"safety": 0.95, "environmental": 0.9, "economic": 0.85},
            confidence_score=0.9,
            data_quality_score=0.85,
            calculation_timestamp=datetime.now(),
            inspection_interval_months=6,
            missing_data=[],
            estimated_parameters=[]
        )
        
        audit_service.log_calculation_event(high_risk_result)
        
        event = audit_service._audit_events[0]
        assert event.severity == AuditSeverity.CRITICAL
        assert event.details["risk_level"] == "Very High"

    def test_log_calculation_event_with_context(self, audit_service, sample_calculation_result, 
                                               sample_equipment_data, sample_extracted_data):
        """Test logging calculation event with equipment and data context"""
        
        audit_service.log_calculation_event(
            calculation_result=sample_calculation_result,
            equipment_data=sample_equipment_data,
            extracted_data=sample_extracted_data
        )
        
        event = audit_service._audit_events[0]
        
        # Check equipment context
        assert "equipment_context" in event.details
        equipment_context = event.details["equipment_context"]
        assert equipment_context["equipment_type"] == "pressure_vessel"
        assert equipment_context["service_type"] == "crude_oil"
        assert equipment_context["age_years"] == 15
        
        # Check data context
        assert "data_context" in event.details
        data_context = event.details["data_context"]
        assert data_context["thickness_measurements_count"] == 3
        assert data_context["corrosion_rate_available"] is True
        assert data_context["inspection_quality"] == "GOOD"

    def test_log_configuration_change(self, audit_service):
        """Test logging configuration change event"""
        
        before_state = {"risk_matrix": {"low": 1, "medium": 2}}
        after_state = {"risk_matrix": {"low": 1, "medium": 2, "high": 3}}
        
        event_id = audit_service.log_configuration_change(
            configuration_type="risk_matrix",
            change_description="Added high risk level",
            before_state=before_state,
            after_state=after_state,
            user_id="admin123"
        )
        
        assert event_id.startswith("AUD_")
        
        event = audit_service._audit_events[0]
        assert event.event_type == AuditEventType.CONFIGURATION_CHANGED
        assert event.severity == AuditSeverity.WARNING
        assert event.user_id == "admin123"
        assert "Configuration changed: risk_matrix" in event.description
        assert event.before_state == before_state
        assert event.after_state == after_state
        assert event.details["configuration_type"] == "risk_matrix"
        assert event.details["change_type"] == "modification"

    def test_log_data_update(self, audit_service):
        """Test logging data update event"""
        
        before_state = {"thickness": 12.5}
        after_state = {"thickness": 12.3}
        
        event_id = audit_service.log_data_update(
            equipment_id="EQ-001",
            data_type="thickness_measurement",
            update_description="Updated thickness reading",
            before_state=before_state,
            after_state=after_state,
            user_id="inspector123"
        )
        
        event = audit_service._audit_events[0]
        assert event.event_type == AuditEventType.DATA_UPDATED
        assert event.severity == AuditSeverity.INFO
        assert event.equipment_id == "EQ-001"
        assert event.user_id == "inspector123"
        assert "Data updated for EQ-001" in event.description
        assert event.details["data_type"] == "thickness_measurement"
        assert event.details["update_type"] == "modification"

    def test_log_batch_operation_success(self, audit_service):
        """Test logging successful batch operation"""
        
        operation_details = {
            "operation_duration": "5 minutes",
            "equipment_list": ["EQ-001", "EQ-002", "EQ-003"]
        }
        
        event_id = audit_service.log_batch_operation(
            operation_type="bulk_calculation",
            equipment_count=3,
            success_count=3,
            failure_count=0,
            operation_details=operation_details,
            user_id="operator123"
        )
        
        event = audit_service._audit_events[0]
        assert event.event_type == AuditEventType.BATCH_OPERATION
        assert event.severity == AuditSeverity.INFO
        assert event.user_id == "operator123"
        assert "Batch bulk_calculation completed: 3/3 successful" in event.description
        assert event.details["success_rate"] == 100.0
        assert event.details["operation_duration"] == "5 minutes"

    def test_log_batch_operation_with_failures(self, audit_service):
        """Test logging batch operation with failures"""
        
        event_id = audit_service.log_batch_operation(
            operation_type="data_validation",
            equipment_count=5,
            success_count=2,
            failure_count=3,
            operation_details={}
        )
        
        event = audit_service._audit_events[0]
        assert event.severity == AuditSeverity.ERROR  # More failures than successes
        assert event.details["success_rate"] == 40.0

    def test_log_error_event(self, audit_service):
        """Test logging error event"""
        
        error_details = {
            "stack_trace": "Exception in calculation...",
            "input_data": {"equipment_id": "EQ-001"}
        }
        
        event_id = audit_service.log_error_event(
            error_type="calculation_error",
            error_message="Division by zero in POF calculation",
            equipment_id="EQ-001",
            error_details=error_details,
            user_id="system"
        )
        
        event = audit_service._audit_events[0]
        assert event.event_type == AuditEventType.ERROR_OCCURRED
        assert event.severity == AuditSeverity.ERROR
        assert event.equipment_id == "EQ-001"
        assert "Error occurred: calculation_error" in event.description
        assert event.details["error_type"] == "calculation_error"
        assert "Verify input data quality" in event.details["recovery_actions"]

    def test_get_audit_trail_no_filters(self, audit_service, sample_calculation_result):
        """Test retrieving audit trail without filters"""
        
        # Add multiple events
        audit_service.log_calculation_event(sample_calculation_result)
        audit_service.log_configuration_change("test_config", "test change")
        audit_service.log_error_event("test_error", "test message")
        
        events = audit_service.get_audit_trail()
        
        assert len(events) == 3
        # Should be sorted by timestamp (newest first)
        assert events[0].timestamp >= events[1].timestamp >= events[2].timestamp

    def test_get_audit_trail_with_filters(self, audit_service, sample_calculation_result):
        """Test retrieving audit trail with filters"""
        
        # Add events for different equipment
        result1 = sample_calculation_result
        result2 = RBICalculationResult(
            equipment_id="EQ-002",
            calculation_level=RBILevel.LEVEL_1,
            requested_level=RBILevel.LEVEL_1,
            risk_level=RiskLevel.LOW,
            pof_score=0.3,
            cof_scores={"safety": 0.4},
            confidence_score=0.7,
            data_quality_score=0.8,
            inspection_interval_months=36,
            fallback_occurred=False,
            missing_data=[],
            estimated_parameters=[],
            calculation_timestamp=datetime.now()
        )
        
        audit_service.log_calculation_event(result1, user_id="user1")
        audit_service.log_calculation_event(result2, user_id="user2")
        audit_service.log_configuration_change("test_config", "test change", user_id="user1")
        
        # Filter by equipment
        eq1_events = audit_service.get_audit_trail(equipment_id="EQ-001")
        assert len(eq1_events) == 1
        assert eq1_events[0].equipment_id == "EQ-001"
        
        # Filter by event type
        calc_events = audit_service.get_audit_trail(event_type=AuditEventType.CALCULATION_EXECUTED)
        assert len(calc_events) == 2
        
        # Filter by user
        user1_events = audit_service.get_audit_trail(user_id="user1")
        assert len(user1_events) == 2

    def test_get_audit_trail_with_date_filters(self, audit_service, sample_calculation_result):
        """Test retrieving audit trail with date filters"""
        
        now = datetime.now()
        yesterday = now - timedelta(days=1)
        tomorrow = now + timedelta(days=1)
        
        audit_service.log_calculation_event(sample_calculation_result)
        
        # Filter by start date
        events = audit_service.get_audit_trail(start_date=yesterday)
        assert len(events) == 1
        
        # Filter by end date
        events = audit_service.get_audit_trail(end_date=tomorrow)
        assert len(events) == 1
        
        # Filter with date range that excludes events
        events = audit_service.get_audit_trail(start_date=tomorrow)
        assert len(events) == 0

    def test_get_historical_data(self, audit_service, sample_calculation_result):
        """Test retrieving historical data"""
        
        # Add calculation events to generate historical data
        audit_service.log_calculation_event(sample_calculation_result)
        
        # Modify result for second data point
        result2 = sample_calculation_result
        result2.risk_level = RiskLevel.HIGH
        result2.pof_score = 0.8
        audit_service.log_calculation_event(result2)
        
        historical_data = audit_service.get_historical_data("EQ-001")
        
        assert len(historical_data) == 2
        assert all(dp.equipment_id == "EQ-001" for dp in historical_data)
        assert historical_data[0].timestamp <= historical_data[1].timestamp  # Sorted by timestamp

    def test_get_historical_data_with_date_filters(self, audit_service, sample_calculation_result):
        """Test retrieving historical data with date filters"""
        
        audit_service.log_calculation_event(sample_calculation_result)
        
        now = datetime.now()
        yesterday = now - timedelta(days=1)
        tomorrow = now + timedelta(days=1)
        
        # Filter by date range
        data = audit_service.get_historical_data("EQ-001", start_date=yesterday, end_date=tomorrow)
        assert len(data) == 1
        
        # Filter with range that excludes data
        data = audit_service.get_historical_data("EQ-001", start_date=tomorrow)
        assert len(data) == 0

    def test_generate_trend_analysis_insufficient_data(self, audit_service):
        """Test trend analysis with insufficient data"""
        
        analysis = audit_service.generate_trend_analysis("EQ-001")
        
        assert analysis.equipment_id == "EQ-001"
        assert analysis.data_points_count == 0
        assert analysis.risk_trend == "insufficient_data"
        assert analysis.confidence_trend == "insufficient_data"
        assert "Collect more historical data" in analysis.recommendations

    def test_generate_trend_analysis_with_data(self, audit_service):
        """Test trend analysis with sufficient data"""
        
        # Create multiple historical data points with changing risk levels
        base_time = datetime.now() - timedelta(days=100)
        
        for i in range(5):
            result = RBICalculationResult(
                equipment_id="EQ-001",
                calculation_level=RBILevel.LEVEL2,
                requested_level=RBILevel.LEVEL2,
                risk_level=RiskLevel.LOW if i < 2 else RiskLevel.MEDIUM if i < 4 else RiskLevel.HIGH,
                pof_score=0.3 + (i * 0.15),  # Increasing trend
                cof_scores={"safety": 0.5},
                confidence_score=0.9 - (i * 0.05),  # Decreasing trend
                data_quality_score=0.8,
                inspection_interval_months=36 - (i * 6),
                fallback_occurred=i > 3,  # Fallback in later calculations
                missing_data=[],
                estimated_parameters=[],
                calculation_timestamp=base_time + timedelta(days=i * 20)
            )
            
            audit_service.log_calculation_event(result)
        
        analysis = audit_service.generate_trend_analysis("EQ-001")
        
        assert analysis.equipment_id == "EQ-001"
        assert analysis.data_points_count == 5
        assert analysis.risk_trend == "increasing"
        assert analysis.confidence_trend == "declining"
        assert len(analysis.key_changes) > 0
        assert len(analysis.recommendations) > 0
        assert "statistical_summary" in analysis.statistical_summary

    def test_get_audit_summary(self, audit_service, sample_calculation_result):
        """Test generating audit summary"""
        
        # Add various types of events
        audit_service.log_calculation_event(sample_calculation_result, user_id="user1")
        audit_service.log_configuration_change("test_config", "test change", user_id="user2")
        audit_service.log_error_event("test_error", "test message", equipment_id="EQ-001")
        
        summary = audit_service.get_audit_summary()
        
        assert summary["total_events"] == 3
        assert "time_range" in summary
        assert "event_type_distribution" in summary
        assert "severity_distribution" in summary
        assert "top_equipment" in summary
        assert "active_users" in summary
        assert summary["error_events_count"] == 1
        
        # Check event type distribution
        assert summary["event_type_distribution"]["calculation_executed"] == 1
        assert summary["event_type_distribution"]["configuration_changed"] == 1
        assert summary["event_type_distribution"]["error_occurred"] == 1

    def test_verify_audit_integrity_clean(self, audit_service, sample_calculation_result):
        """Test audit integrity verification with clean data"""
        
        audit_service.log_calculation_event(sample_calculation_result)
        audit_service.log_configuration_change("test_config", "test change")
        
        integrity_report = audit_service.verify_audit_integrity()
        
        assert integrity_report["total_events"] == 2
        assert all(integrity_report["integrity_checks"].values())
        assert len(integrity_report["issues_found"]) == 0
        assert "Audit trail integrity is maintained" in integrity_report["recommendations"]

    def test_audit_event_serialization(self):
        """Test audit event serialization methods"""
        
        event = AuditEvent(
            event_id="TEST_001",
            timestamp=datetime.now(),
            event_type=AuditEventType.CALCULATION_EXECUTED,
            severity=AuditSeverity.INFO,
            user_id="user123",
            equipment_id="EQ-001",
            description="Test event",
            details={"test": "data"}
        )
        
        # Test to_dict
        event_dict = event.to_dict()
        assert event_dict["event_id"] == "TEST_001"
        assert event_dict["event_type"] == "calculation_executed"
        assert event_dict["severity"] == "info"
        assert event_dict["details"]["test"] == "data"
        
        # Test to_json
        event_json = event.to_json()
        assert "TEST_001" in event_json
        assert "calculation_executed" in event_json

    def test_historical_data_point_serialization(self):
        """Test historical data point serialization"""
        
        data_point = HistoricalDataPoint(
            timestamp=datetime.now(),
            equipment_id="EQ-001",
            risk_level=RiskLevel.MEDIUM,
            pof_score=0.6,
            cof_scores={"safety": 0.7},
            confidence_score=0.85,
            calculation_level=RBILevel.LEVEL2,
            inspection_interval_months=24,
            data_quality_score=0.9,
            fallback_occurred=False,
            calculation_id="CALC_001"
        )
        
        data_dict = data_point.to_dict()
        assert data_dict["equipment_id"] == "EQ-001"
        assert data_dict["risk_level"] == "medium"
        assert data_dict["calculation_level"] == "level2"
        assert data_dict["fallback_occurred"] is False

    def test_event_id_generation(self, audit_service):
        """Test unique event ID generation"""
        
        event_ids = set()
        
        # Generate multiple event IDs
        for _ in range(10):
            event_id = audit_service._generate_event_id()
            assert event_id.startswith("AUD_")
            assert len(event_id) == 12  # AUD_ + 8 character hash
            event_ids.add(event_id)
        
        # All IDs should be unique
        assert len(event_ids) == 10

    def test_helper_methods(self, audit_service):
        """Test various helper methods"""
        
        # Test change type determination
        assert audit_service._determine_change_type(None, {"key": "value"}) == "creation"
        assert audit_service._determine_change_type({"key": "value"}, None) == "deletion"
        assert audit_service._determine_change_type({"key": "old"}, {"key": "new"}) == "modification"
        assert audit_service._determine_change_type(None, None) == "unknown"
        
        # Test affected components identification
        components = audit_service._identify_affected_components("scoring_tables")
        assert "Level2Calculator" in components
        assert "RiskMatrix" in components
        
        # Test recovery actions
        actions = audit_service._suggest_recovery_actions("calculation_error")
        assert "Verify input data quality" in actions
        
        # Test risk to numeric conversion
        assert audit_service._risk_to_numeric(RiskLevel.LOW) == 1
        assert audit_service._risk_to_numeric(RiskLevel.MEDIUM) == 2
        assert audit_service._risk_to_numeric(RiskLevel.HIGH) == 3
        assert audit_service._risk_to_numeric(RiskLevel.VERY_HIGH) == 4

    def test_statistical_calculations(self, audit_service):
        """Test statistical calculation methods"""
        
        # Test standard deviation calculation
        values = [1.0, 2.0, 3.0, 4.0, 5.0]
        std_dev = audit_service._calculate_std_dev(values)
        assert abs(std_dev - 1.58) < 0.1  # Approximate standard deviation
        
        # Test with insufficient data
        assert audit_service._calculate_std_dev([1.0]) == 0.0
        assert audit_service._calculate_std_dev([]) == 0.0

    @patch('app.domains.rbi.services.audit_trail_service.datetime')
    def test_timestamp_consistency(self, mock_datetime, audit_service, sample_calculation_result):
        """Test that timestamps are consistent and properly ordered"""
        
        base_time = datetime(2024, 1, 1, 12, 0, 0)
        mock_datetime.now.side_effect = [
            base_time,
            base_time + timedelta(seconds=1),
            base_time + timedelta(seconds=2)
        ]
        
        # Add events with mocked timestamps
        audit_service.log_calculation_event(sample_calculation_result)
        audit_service.log_configuration_change("test", "change")
        audit_service.log_error_event("error", "message")
        
        events = audit_service.get_audit_trail()
        
        # Events should be ordered by timestamp (newest first)
        assert events[0].timestamp >= events[1].timestamp >= events[2].timestamp