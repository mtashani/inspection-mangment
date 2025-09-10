import pytest
from datetime import date, datetime
from fastapi.testclient import TestClient
from sqlmodel import Session, create_engine, SQLModel
from app.main import app
from app.database import get_session
from app.domains.equipment.models.equipment import Equipment
from app.domains.inspection.models.inspection import Inspection
from app.domains.inspection.models.enums import InspectionStatus, RefineryDepartment
from app.domains.maintenance.models.event import MaintenanceEvent, MaintenanceSubEvent
from app.domains.maintenance.models.enums import MaintenanceEventType, MaintenanceEventStatus
from app.domains.maintenance.models.inspection_plan import InspectionPlan
from app.domains.maintenance.models.enums import InspectionPlanStatus, InspectionPriority


@pytest.fixture
def session():
    """Create a test database session"""
    engine = create_engine("sqlite:///:memory:")
    SQLModel.metadata.create_all(engine)
    
    with Session(engine) as session:
        yield session


@pytest.fixture
def client(session):
    """Create a test client with database session override"""
    def get_session_override():
        return session
    
    app.dependency_overrides[get_session] = get_session_override
    client = TestClient(app)
    yield client
    app.dependency_overrides.clear()


@pytest.fixture
def sample_data(session):
    """Create sample data for testing"""
    # Create equipment
    equipment1 = Equipment(
        tag="V-101",
        description="Test Pressure Vessel 1",
        unit="Unit 1",
        equipment_type="Pressure Vessel"
    )
    equipment2 = Equipment(
        tag="P-201",
        description="Test Pump 1",
        unit="Unit 2",
        equipment_type="Pump"
    )
    session.add_all([equipment1, equipment2])
    session.commit()
    
    # Create maintenance event
    event = MaintenanceEvent(
        event_number="ME-2025-001",
        title="Test Maintenance Event",
        event_type=MaintenanceEventType.Routine,
        status=MaintenanceEventStatus.InProgress,
        planned_start_date=date(2025, 3, 1),
        planned_end_date=date(2025, 3, 31)
    )
    session.add(event)
    session.commit()
    session.refresh(event)
    
    # Create sub-event
    sub_event = MaintenanceSubEvent(
        parent_event_id=event.id,
        sub_event_number="SE-001",
        title="Test Sub Event",
        planned_start_date=date(2025, 3, 5),
        planned_end_date=date(2025, 3, 15)
    )
    session.add(sub_event)
    session.commit()
    session.refresh(sub_event)
    
    # Create inspection plans
    plan1 = InspectionPlan(
        maintenance_event_id=event.id,
        equipment_tag=equipment1.tag,
        requester="Operations Team",
        priority=InspectionPriority.High,
        status=InspectionPlanStatus.Planned
    )
    plan2 = InspectionPlan(
        maintenance_sub_event_id=sub_event.id,
        equipment_tag=equipment2.tag,
        requester="Maintenance Team",
        priority=InspectionPriority.Medium,
        status=InspectionPlanStatus.InProgress
    )
    session.add_all([plan1, plan2])
    session.commit()
    
    # Create inspections
    inspection1 = Inspection(
        inspection_number="INS-2025-001",
        title="Test Inspection 1",
        start_date=date(2025, 3, 5),
        status=InspectionStatus.InProgress,
        equipment_id=equipment1.id,
        requesting_department=RefineryDepartment.Operations
    )
    inspection2 = Inspection(
        inspection_number="INS-2025-002",
        title="Test Inspection 2",
        start_date=date(2025, 3, 10),
        end_date=date(2025, 3, 12),
        status=InspectionStatus.Completed,
        equipment_id=equipment2.id,
        requesting_department=RefineryDepartment.Maintenance
    )
    session.add_all([inspection1, inspection2])
    session.commit()
    
    return {
        'event': event,
        'sub_event': sub_event,
        'equipment1': equipment1,
        'equipment2': equipment2,
        'plan1': plan1,
        'plan2': plan2,
        'inspection1': inspection1,
        'inspection2': inspection2
    }


class TestEventStatisticsEndpoints:
    """Test cases for event statistics endpoints"""
    
    def test_get_event_statistics_success(self, client, sample_data):
        """Test successful retrieval of event statistics"""
        event_id = sample_data['event'].id
        
        response = client.get(f"/api/v1/maintenance/events/{event_id}/statistics")
        
        assert response.status_code == 200
        data = response.json()
        
        assert data['event_id'] == event_id
        assert data['event_number'] == "ME-2025-001"
        assert 'total_planned_inspections' in data
        assert 'active_inspections' in data
        assert 'completed_inspections' in data
        assert 'first_time_inspections_count' in data
        assert 'equipment_status_breakdown' in data
    
    def test_get_event_statistics_not_found(self, client):
        """Test event statistics for non-existent event"""
        response = client.get("/api/v1/maintenance/events/99999/statistics")
        
        assert response.status_code == 404
        assert "not found" in response.json()['detail'].lower()
    
    def test_get_requester_breakdown_success(self, client, sample_data):
        """Test successful retrieval of requester breakdown"""
        event_id = sample_data['event'].id
        
        response = client.get(f"/api/v1/maintenance/events/{event_id}/requester-breakdown")
        
        assert response.status_code == 200
        data = response.json()
        
        assert data['event_id'] == event_id
        assert 'breakdown' in data
        assert isinstance(data['breakdown'], list)
        assert 'total_requesters' in data
    
    def test_get_equipment_status_success(self, client, sample_data):
        """Test successful retrieval of equipment status"""
        event_id = sample_data['event'].id
        
        response = client.get(f"/api/v1/maintenance/events/{event_id}/equipment-status")
        
        assert response.status_code == 200
        data = response.json()
        
        assert data['event_id'] == event_id
        assert 'equipment_statuses' in data
        assert isinstance(data['equipment_statuses'], list)
        assert 'total_equipment' in data
        assert 'status_counts' in data


class TestSubEventStatisticsEndpoints:
    """Test cases for sub-event statistics endpoints"""
    
    def test_get_sub_event_statistics_success(self, client, sample_data):
        """Test successful retrieval of sub-event statistics"""
        sub_event_id = sample_data['sub_event'].id
        
        response = client.get(f"/api/v1/maintenance/sub-events/{sub_event_id}/statistics")
        
        assert response.status_code == 200
        data = response.json()
        
        assert data['sub_event_id'] == sub_event_id
        assert data['sub_event_number'] == "SE-001"
        assert data['parent_event_id'] == sample_data['event'].id
        assert 'statistics' in data
        
        stats = data['statistics']
        assert 'total_planned_inspections' in stats
        assert 'active_inspections' in stats
        assert 'completed_inspections' in stats
    
    def test_get_sub_event_statistics_not_found(self, client):
        """Test sub-event statistics for non-existent sub-event"""
        response = client.get("/api/v1/maintenance/sub-events/99999/statistics")
        
        assert response.status_code == 404
        assert "not found" in response.json()['detail'].lower()


class TestCompleteEventStatistics:
    """Test cases for complete event statistics endpoint"""
    
    def test_get_complete_event_statistics_success(self, client, sample_data):
        """Test successful retrieval of complete event statistics"""
        event_id = sample_data['event'].id
        
        response = client.get(f"/api/v1/maintenance/events/{event_id}/complete-statistics")
        
        assert response.status_code == 200
        data = response.json()
        
        assert 'main_event' in data
        assert 'sub_events' in data
        assert isinstance(data['sub_events'], list)
        
        main_event = data['main_event']
        assert main_event['event_id'] == event_id
        assert 'total_planned_inspections' in main_event
    
    def test_get_complete_event_statistics_exclude_sub_events(self, client, sample_data):
        """Test complete event statistics without sub-events"""
        event_id = sample_data['event'].id
        
        response = client.get(
            f"/api/v1/maintenance/events/{event_id}/complete-statistics?include_sub_events=false"
        )
        
        assert response.status_code == 200
        data = response.json()
        
        assert 'main_event' in data
        assert data['sub_events'] == []


class TestMaintenanceStatistics:
    """Test cases for general maintenance statistics"""
    
    def test_get_maintenance_statistics_summary(self, client, sample_data):
        """Test successful retrieval of maintenance statistics summary"""
        response = client.get("/api/v1/maintenance/statistics/summary")
        
        assert response.status_code == 200
        data = response.json()
        
        assert 'total_events' in data
        assert 'status_counts' in data
        assert isinstance(data['status_counts'], dict)
    
    def test_get_maintenance_statistics_with_date_filter(self, client, sample_data):
        """Test maintenance statistics with date filtering"""
        response = client.get(
            "/api/v1/maintenance/statistics/summary?from_date=2025-01-01&to_date=2025-12-31"
        )
        
        assert response.status_code == 200
        data = response.json()
        
        assert 'total_events' in data
        assert 'status_counts' in data


class TestErrorHandling:
    """Test cases for error handling in reporting endpoints"""
    
    def test_invalid_event_id_format(self, client):
        """Test handling of invalid event ID format"""
        response = client.get("/api/v1/maintenance/events/invalid/statistics")
        
        assert response.status_code == 422  # Validation error
    
    def test_invalid_date_format(self, client):
        """Test handling of invalid date format in statistics"""
        response = client.get(
            "/api/v1/maintenance/statistics/summary?from_date=invalid-date"
        )
        
        assert response.status_code == 422  # Validation error
    
    def test_database_error_handling(self, client, monkeypatch):
        """Test handling of database errors"""
        # Mock a database error
        def mock_get_session():
            raise Exception("Database connection failed")
        
        app.dependency_overrides[get_session] = mock_get_session
        
        response = client.get("/api/v1/maintenance/events/1/statistics")
        
        assert response.status_code == 500
        assert "error" in response.json()['detail'].lower()
        
        # Clean up
        app.dependency_overrides.clear()


class TestPerformanceAndOptimization:
    """Test cases for performance and optimization"""
    
    def test_large_dataset_handling(self, client, session):
        """Test handling of large datasets"""
        # Create a large number of events and inspections
        events = []
        for i in range(50):
            event = MaintenanceEvent(
                event_number=f"ME-2025-{i:03d}",
                title=f"Test Event {i}",
                event_type=MaintenanceEventType.Routine,
                status=MaintenanceEventStatus.Planned,
                planned_start_date=date(2025, 3, 1),
                planned_end_date=date(2025, 3, 31)
            )
            events.append(event)
        
        session.add_all(events)
        session.commit()
        
        # Test that statistics endpoint handles large datasets efficiently
        response = client.get("/api/v1/maintenance/statistics/summary")
        
        assert response.status_code == 200
        data = response.json()
        assert data['total_events'] >= 50
    
    def test_concurrent_requests(self, client, sample_data):
        """Test handling of concurrent requests"""
        import threading
        import time
        
        event_id = sample_data['event'].id
        results = []
        
        def make_request():
            response = client.get(f"/api/v1/maintenance/events/{event_id}/statistics")
            results.append(response.status_code)
        
        # Create multiple threads to simulate concurrent requests
        threads = []
        for _ in range(10):
            thread = threading.Thread(target=make_request)
            threads.append(thread)
            thread.start()
        
        # Wait for all threads to complete
        for thread in threads:
            thread.join()
        
        # All requests should succeed
        assert all(status == 200 for status in results)
        assert len(results) == 10