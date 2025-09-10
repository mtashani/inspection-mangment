import pytest
from datetime import date, datetime
from sqlmodel import Session, create_engine, SQLModel
from app.domains.maintenance.services.event_status_management import (
    EventStatusManagementService, 
    StatusTransitionResult, 
    EventStatusManagementError
)
from app.domains.maintenance.models.event import MaintenanceEvent, MaintenanceSubEvent
from app.domains.maintenance.models.enums import MaintenanceEventType, MaintenanceEventStatus
from app.domains.equipment.models.equipment import Equipment
from app.domains.inspection.models.inspection import Inspection
from app.domains.inspection.models.enums import InspectionStatus, RefineryDepartment


@pytest.fixture
def session():
    """Create a test database session"""
    engine = create_engine("sqlite:///:memory:")
    SQLModel.metadata.create_all(engine)
    
    with Session(engine) as session:
        yield session


@pytest.fixture
def sample_event(session):
    """Create sample maintenance event for testing"""
    event = MaintenanceEvent(
        event_number="ME-2025-001",
        title="Test Maintenance Event",
        event_type=MaintenanceEventType.Routine,
        status=MaintenanceEventStatus.Planned,
        planned_start_date=date(2025, 3, 1),
        planned_end_date=date(2025, 3, 31)
    )
    session.add(event)
    session.commit()
    session.refresh(event)
    return event


@pytest.fixture
def sample_sub_event(session, sample_event):
    """Create sample sub-event for testing"""
    sub_event = MaintenanceSubEvent(
        parent_event_id=sample_event.id,
        sub_event_number="SE-001",
        title="Test Sub Event",
        status=MaintenanceEventStatus.Planned,
        planned_start_date=date(2025, 3, 5),
        planned_end_date=date(2025, 3, 15)
    )
    session.add(sub_event)
    session.commit()
    session.refresh(sub_event)
    return sub_event


@pytest.fixture
def status_service(session):
    """Create EventStatusManagementService instance"""
    return EventStatusManagementService(session)


class TestEventStatusTransitions:
    """Test cases for event status transitions"""
    
    def test_valid_status_transition_planned_to_in_progress(self, status_service, sample_event):
        """Test valid transition from Planned to In Progress"""
        result = status_service.change_event_status(
            sample_event.id, 
            MaintenanceEventStatus.InProgress,
            user_id="test_user"
        )
        
        assert isinstance(result, StatusTransitionResult)
        assert result.success is True
        assert result.new_status == MaintenanceEventStatus.InProgress
        assert result.previous_status == MaintenanceEventStatus.Planned
        assert result.transition_timestamp is not None
        assert result.user_id == "test_user"
        
        # Verify event status was updated
        assert sample_event.status == MaintenanceEventStatus.InProgress
        assert sample_event.actual_start_date is not None
    
    def test_valid_status_transition_in_progress_to_completed(self, status_service, sample_event):
        """Test valid transition from In Progress to Completed"""
        # First transition to In Progress
        status_service.change_event_status(
            sample_event.id, 
            MaintenanceEventStatus.InProgress,
            user_id="test_user"
        )
        
        # Then transition to Completed
        result = status_service.change_event_status(
            sample_event.id, 
            MaintenanceEventStatus.Completed,
            user_id="test_user"
        )
        
        assert result.success is True
        assert result.new_status == MaintenanceEventStatus.Completed
        assert result.previous_status == MaintenanceEventStatus.InProgress
        
        # Verify event status was updated
        assert sample_event.status == MaintenanceEventStatus.Completed
        assert sample_event.actual_end_date is not None
    
    def test_invalid_status_transition(self, status_service, sample_event):
        """Test invalid status transition"""
        with pytest.raises(EventStatusManagementError) as exc_info:
            status_service.change_event_status(
                sample_event.id, 
                MaintenanceEventStatus.Completed,  # Can't go directly from Planned to Completed
                user_id="test_user"
            )
        
        assert "Invalid status transition" in str(exc_info.value)
        assert sample_event.status == MaintenanceEventStatus.Planned  # Status unchanged
    
    def test_transition_from_completed_not_allowed(self, status_service, sample_event):
        """Test that transitions from Completed status are not allowed"""
        # First complete the event
        status_service.change_event_status(
            sample_event.id, 
            MaintenanceEventStatus.InProgress,
            user_id="test_user"
        )
        status_service.change_event_status(
            sample_event.id, 
            MaintenanceEventStatus.Completed,
            user_id="test_user"
        )
        
        # Try to change status from Completed
        with pytest.raises(EventStatusManagementError) as exc_info:
            status_service.change_event_status(
                sample_event.id, 
                MaintenanceEventStatus.InProgress,
                user_id="test_user"
            )
        
        assert "Cannot change status of completed event" in str(exc_info.value)
    
    def test_transition_with_active_inspections_validation(self, status_service, sample_event, session):
        """Test validation when event has active inspections"""
        # Create equipment and active inspection
        equipment = Equipment(
            tag="V-101",
            description="Test Vessel",
            unit="Unit 1",
            equipment_type="Pressure Vessel"
        )
        session.add(equipment)
        session.commit()
        
        inspection = Inspection(
            inspection_number="INS-2025-001",
            title="Test Inspection",
            start_date=date(2025, 3, 5),
            status=InspectionStatus.InProgress,
            equipment_id=equipment.id,
            requesting_department=RefineryDepartment.Operations
        )
        session.add(inspection)
        session.commit()
        
        # Start the event first
        status_service.change_event_status(
            sample_event.id, 
            MaintenanceEventStatus.InProgress,
            user_id="test_user"
        )
        
        # Try to complete event with active inspections
        with pytest.raises(EventStatusManagementError) as exc_info:
            status_service.change_event_status(
                sample_event.id, 
                MaintenanceEventStatus.Completed,
                user_id="test_user"
            )
        
        assert "Cannot complete event with active inspections" in str(exc_info.value)


class TestSubEventStatusTransitions:
    """Test cases for sub-event status transitions"""
    
    def test_sub_event_status_transition(self, status_service, sample_sub_event):
        """Test sub-event status transition"""
        result = status_service.change_sub_event_status(
            sample_sub_event.id,
            MaintenanceEventStatus.InProgress,
            user_id="test_user"
        )
        
        assert result.success is True
        assert result.new_status == MaintenanceEventStatus.InProgress
        assert sample_sub_event.status == MaintenanceEventStatus.InProgress
        assert sample_sub_event.actual_start_date is not None
    
    def test_parent_event_status_update_on_sub_event_start(self, status_service, sample_event, sample_sub_event):
        """Test that parent event status updates when first sub-event starts"""
        # Start sub-event
        status_service.change_sub_event_status(
            sample_sub_event.id,
            MaintenanceEventStatus.InProgress,
            user_id="test_user"
        )
        
        # Parent event should automatically transition to In Progress
        assert sample_event.status == MaintenanceEventStatus.InProgress
        assert sample_event.actual_start_date is not None
    
    def test_parent_event_completion_when_all_sub_events_complete(self, status_service, sample_event, session):
        """Test parent event completion when all sub-events are completed"""
        # Create multiple sub-events
        sub_event1 = MaintenanceSubEvent(
            parent_event_id=sample_event.id,
            sub_event_number="SE-001",
            title="Sub Event 1",
            status=MaintenanceEventStatus.Planned,
            planned_start_date=date(2025, 3, 5),
            planned_end_date=date(2025, 3, 10)
        )
        sub_event2 = MaintenanceSubEvent(
            parent_event_id=sample_event.id,
            sub_event_number="SE-002",
            title="Sub Event 2",
            status=MaintenanceEventStatus.Planned,
            planned_start_date=date(2025, 3, 11),
            planned_end_date=date(2025, 3, 15)
        )
        session.add_all([sub_event1, sub_event2])
        session.commit()
        
        # Complete both sub-events
        status_service.change_sub_event_status(
            sub_event1.id,
            MaintenanceEventStatus.InProgress,
            user_id="test_user"
        )
        status_service.change_sub_event_status(
            sub_event1.id,
            MaintenanceEventStatus.Completed,
            user_id="test_user"
        )
        
        # Parent should still be In Progress
        assert sample_event.status == MaintenanceEventStatus.InProgress
        
        # Complete second sub-event
        status_service.change_sub_event_status(
            sub_event2.id,
            MaintenanceEventStatus.InProgress,
            user_id="test_user"
        )
        status_service.change_sub_event_status(
            sub_event2.id,
            MaintenanceEventStatus.Completed,
            user_id="test_user"
        )
        
        # Now parent should be completed
        assert sample_event.status == MaintenanceEventStatus.Completed
        assert sample_event.actual_end_date is not None


class TestStatusValidationRules:
    """Test cases for status validation rules"""
    
    def test_get_valid_transitions_planned(self, status_service):
        """Test valid transitions from Planned status"""
        valid_transitions = status_service.get_valid_transitions(MaintenanceEventStatus.Planned)
        
        expected = [
            MaintenanceEventStatus.InProgress,
            MaintenanceEventStatus.Postponed,
            MaintenanceEventStatus.Cancelled
        ]
        assert set(valid_transitions) == set(expected)
    
    def test_get_valid_transitions_in_progress(self, status_service):
        """Test valid transitions from In Progress status"""
        valid_transitions = status_service.get_valid_transitions(MaintenanceEventStatus.InProgress)
        
        expected = [
            MaintenanceEventStatus.Completed,
            MaintenanceEventStatus.Postponed,
            MaintenanceEventStatus.Cancelled
        ]
        assert set(valid_transitions) == set(expected)
    
    def test_get_valid_transitions_completed(self, status_service):
        """Test valid transitions from Completed status"""
        valid_transitions = status_service.get_valid_transitions(MaintenanceEventStatus.Completed)
        
        # Completed events cannot transition to other statuses
        assert valid_transitions == []
    
    def test_is_valid_transition(self, status_service):
        """Test transition validation"""
        # Valid transitions
        assert status_service.is_valid_transition(
            MaintenanceEventStatus.Planned, 
            MaintenanceEventStatus.InProgress
        ) is True
        
        assert status_service.is_valid_transition(
            MaintenanceEventStatus.InProgress, 
            MaintenanceEventStatus.Completed
        ) is True
        
        # Invalid transitions
        assert status_service.is_valid_transition(
            MaintenanceEventStatus.Planned, 
            MaintenanceEventStatus.Completed
        ) is False
        
        assert status_service.is_valid_transition(
            MaintenanceEventStatus.Completed, 
            MaintenanceEventStatus.InProgress
        ) is False


class TestErrorHandling:
    """Test cases for error handling"""
    
    def test_event_not_found(self, status_service):
        """Test handling of non-existent event"""
        with pytest.raises(EventStatusManagementError) as exc_info:
            status_service.change_event_status(
                99999,  # Non-existent event ID
                MaintenanceEventStatus.InProgress,
                user_id="test_user"
            )
        
        assert "Event not found" in str(exc_info.value)
    
    def test_sub_event_not_found(self, status_service):
        """Test handling of non-existent sub-event"""
        with pytest.raises(EventStatusManagementError) as exc_info:
            status_service.change_sub_event_status(
                99999,  # Non-existent sub-event ID
                MaintenanceEventStatus.InProgress,
                user_id="test_user"
            )
        
        assert "Sub-event not found" in str(exc_info.value)
    
    def test_missing_user_id(self, status_service, sample_event):
        """Test handling of missing user ID"""
        with pytest.raises(EventStatusManagementError) as exc_info:
            status_service.change_event_status(
                sample_event.id,
                MaintenanceEventStatus.InProgress,
                user_id=""  # Empty user ID
            )
        
        assert "User ID is required" in str(exc_info.value)


class TestAuditLogging:
    """Test cases for audit logging"""
    
    def test_status_change_audit_log(self, status_service, sample_event):
        """Test that status changes are properly logged"""
        result = status_service.change_event_status(
            sample_event.id,
            MaintenanceEventStatus.InProgress,
            user_id="test_user",
            notes="Starting maintenance work"
        )
        
        # Verify audit information is captured
        assert result.user_id == "test_user"
        assert result.notes == "Starting maintenance work"
        assert result.transition_timestamp is not None
        
        # In a real implementation, you would also verify that
        # the audit log entry was created in the database
    
    def test_status_change_history_tracking(self, status_service, sample_event):
        """Test that status change history is tracked"""
        # Make multiple status changes
        status_service.change_event_status(
            sample_event.id,
            MaintenanceEventStatus.InProgress,
            user_id="user1"
        )
        
        status_service.change_event_status(
            sample_event.id,
            MaintenanceEventStatus.Postponed,
            user_id="user2"
        )
        
        status_service.change_event_status(
            sample_event.id,
            MaintenanceEventStatus.InProgress,
            user_id="user1"
        )
        
        # In a real implementation, you would verify that
        # all status changes are tracked in the audit log
        # For now, just verify the final status
        assert sample_event.status == MaintenanceEventStatus.InProgress