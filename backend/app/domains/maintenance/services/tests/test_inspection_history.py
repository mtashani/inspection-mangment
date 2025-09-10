import pytest
from datetime import date, datetime
from sqlmodel import Session, create_engine, SQLModel
from app.domains.maintenance.services.inspection_history import InspectionHistoryService
from app.domains.equipment.models.equipment import Equipment
from app.domains.inspection.models.inspection import Inspection
from app.domains.inspection.models.enums import InspectionStatus, RefineryDepartment
from app.domains.maintenance.models.event import MaintenanceEvent, MaintenanceSubEvent
from app.domains.maintenance.models.enums import MaintenanceEventType, MaintenanceEventStatus


@pytest.fixture
def session():
    """Create a test database session"""
    engine = create_engine("sqlite:///:memory:")
    SQLModel.metadata.create_all(engine)
    
    with Session(engine) as session:
        yield session


@pytest.fixture
def sample_equipment(session):
    """Create sample equipment for testing"""
    equipment = Equipment(
        tag="V-101",
        description="Test Pressure Vessel",
        unit="Unit 1",
        equipment_type="Pressure Vessel"
    )
    session.add(equipment)
    session.commit()
    session.refresh(equipment)
    return equipment


@pytest.fixture
def sample_maintenance_event(session):
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


class TestInspectionHistoryService:
    """Test cases for InspectionHistoryService"""
    
    def test_is_first_time_inspection_no_previous_inspections(self, session, sample_equipment):
        """Test first-time detection when no previous inspections exist"""
        result = InspectionHistoryService.is_first_time_inspection(
            sample_equipment.tag, session
        )
        assert result is True
    
    def test_is_first_time_inspection_with_previous_inspections(self, session, sample_equipment):
        """Test first-time detection when previous inspections exist"""
        # Create a previous inspection
        inspection = Inspection(
            inspection_number="INS-001",
            title="Previous Inspection",
            start_date=date(2024, 1, 1),
            equipment_id=sample_equipment.id,
            requesting_department=RefineryDepartment.Operations,
            status=InspectionStatus.Completed
        )
        session.add(inspection)
        session.commit()
        
        result = InspectionHistoryService.is_first_time_inspection(
            sample_equipment.tag, session
        )
        assert result is False
    
    def test_get_equipment_inspection_count_zero(self, session, sample_equipment):
        """Test inspection count when no inspections exist"""
        count = InspectionHistoryService.get_equipment_inspection_count(
            sample_equipment.tag, session
        )
        assert count == 0
    
    def test_get_equipment_inspection_count_multiple(self, session, sample_equipment):
        """Test inspection count with multiple inspections"""
        # Create multiple inspections
        for i in range(3):
            inspection = Inspection(
                inspection_number=f"INS-00{i+1}",
                title=f"Inspection {i+1}",
                start_date=date(2024, i+1, 1),
                equipment_id=sample_equipment.id,
                requesting_department=RefineryDepartment.Operations,
                status=InspectionStatus.Completed
            )
            session.add(inspection)
        session.commit()
        
        count = InspectionHistoryService.get_equipment_inspection_count(
            sample_equipment.tag, session
        )
        assert count == 3
    
    def test_get_equipment_inspection_history_ordered(self, session, sample_equipment):
        """Test that inspection history is returned in correct order"""
        # Create inspections with different dates
        dates = [date(2024, 1, 1), date(2024, 3, 1), date(2024, 2, 1)]
        for i, inspection_date in enumerate(dates):
            inspection = Inspection(
                inspection_number=f"INS-00{i+1}",
                title=f"Inspection {i+1}",
                start_date=inspection_date,
                equipment_id=sample_equipment.id,
                requesting_department=RefineryDepartment.Operations,
                status=InspectionStatus.Completed
            )
            session.add(inspection)
        session.commit()
        
        history = InspectionHistoryService.get_equipment_inspection_history(
            sample_equipment.tag, session
        )
        
        # Should be ordered by start_date descending (most recent first)
        assert len(history) == 3
        assert history[0].start_date == date(2024, 3, 1)  # Most recent
        assert history[1].start_date == date(2024, 2, 1)
        assert history[2].start_date == date(2024, 1, 1)  # Oldest
    
    def test_get_latest_inspection(self, session, sample_equipment):
        """Test getting the most recent inspection"""
        # Create multiple inspections
        dates = [date(2024, 1, 1), date(2024, 3, 1), date(2024, 2, 1)]
        for i, inspection_date in enumerate(dates):
            inspection = Inspection(
                inspection_number=f"INS-00{i+1}",
                title=f"Inspection {i+1}",
                start_date=inspection_date,
                equipment_id=sample_equipment.id,
                requesting_department=RefineryDepartment.Operations,
                status=InspectionStatus.Completed
            )
            session.add(inspection)
        session.commit()
        
        latest = InspectionHistoryService.get_latest_inspection(
            sample_equipment.tag, session
        )
        
        assert latest is not None
        assert latest.start_date == date(2024, 3, 1)  # Most recent
    
    def test_get_latest_inspection_no_inspections(self, session, sample_equipment):
        """Test getting latest inspection when none exist"""
        latest = InspectionHistoryService.get_latest_inspection(
            sample_equipment.tag, session
        )
        assert latest is None
    
    def test_has_active_inspection_true(self, session, sample_equipment):
        """Test active inspection detection when active inspection exists"""
        inspection = Inspection(
            inspection_number="INS-001",
            title="Active Inspection",
            start_date=date(2025, 1, 1),
            equipment_id=sample_equipment.id,
            requesting_department=RefineryDepartment.Operations,
            status=InspectionStatus.InProgress
        )
        session.add(inspection)
        session.commit()
        
        result = InspectionHistoryService.has_active_inspection(
            sample_equipment.tag, session
        )
        assert result is True
    
    def test_has_active_inspection_false(self, session, sample_equipment):
        """Test active inspection detection when no active inspection exists"""
        # Create completed inspection
        inspection = Inspection(
            inspection_number="INS-001",
            title="Completed Inspection",
            start_date=date(2024, 1, 1),
            equipment_id=sample_equipment.id,
            requesting_department=RefineryDepartment.Operations,
            status=InspectionStatus.Completed
        )
        session.add(inspection)
        session.commit()
        
        result = InspectionHistoryService.has_active_inspection(
            sample_equipment.tag, session
        )
        assert result is False
    
    def test_get_first_time_inspections_count_for_event(self, session, sample_equipment, sample_maintenance_event):
        """Test counting first-time inspections for an event"""
        # Create equipment without previous inspections (first-time)
        equipment2 = Equipment(
            tag="V-102",
            description="Test Vessel 2",
            unit="Unit 1",
            equipment_type="Pressure Vessel"
        )
        session.add(equipment2)
        session.commit()
        session.refresh(equipment2)
        
        # Create equipment with previous inspection (not first-time)
        equipment3 = Equipment(
            tag="V-103",
            description="Test Vessel 3",
            unit="Unit 1",
            equipment_type="Pressure Vessel"
        )
        session.add(equipment3)
        session.commit()
        session.refresh(equipment3)
        
        # Add previous inspection for equipment3
        old_inspection = Inspection(
            inspection_number="INS-OLD",
            title="Old Inspection",
            start_date=date(2024, 1, 1),
            equipment_id=equipment3.id,
            requesting_department=RefineryDepartment.Operations,
            status=InspectionStatus.Completed
        )
        session.add(old_inspection)
        session.commit()
        
        # Create inspections for the maintenance event
        # First-time inspection (V-101 and V-102)
        inspection1 = Inspection(
            inspection_number="INS-001",
            title="Event Inspection 1",
            start_date=date(2025, 3, 1),
            equipment_id=sample_equipment.id,
            maintenance_event_id=sample_maintenance_event.id,
            requesting_department=RefineryDepartment.Operations,
            status=InspectionStatus.InProgress
        )
        
        inspection2 = Inspection(
            inspection_number="INS-002",
            title="Event Inspection 2",
            start_date=date(2025, 3, 2),
            equipment_id=equipment2.id,
            maintenance_event_id=sample_maintenance_event.id,
            requesting_department=RefineryDepartment.Operations,
            status=InspectionStatus.InProgress
        )
        
        # Not first-time inspection (V-103 has previous inspection)
        inspection3 = Inspection(
            inspection_number="INS-003",
            title="Event Inspection 3",
            start_date=date(2025, 3, 3),
            equipment_id=equipment3.id,
            maintenance_event_id=sample_maintenance_event.id,
            requesting_department=RefineryDepartment.Operations,
            status=InspectionStatus.InProgress
        )
        
        session.add_all([inspection1, inspection2, inspection3])
        session.commit()
        
        # Count first-time inspections
        count = InspectionHistoryService.get_first_time_inspections_count_for_event(
            maintenance_event_id=sample_maintenance_event.id,
            session=session
        )
        
        # Should be 2 (V-101 and V-102 are first-time, V-103 is not)
        assert count == 2