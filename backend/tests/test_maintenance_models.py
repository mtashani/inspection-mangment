import pytest
from datetime import date, datetime
from app.domains.maintenance.models.event import MaintenanceEvent, MaintenanceSubEvent
from app.domains.maintenance.models.enums import (
    MaintenanceEventType, 
    MaintenanceEventStatus,
    OverhaulSubType
)

class TestMaintenanceEvent:
    """Test cases for MaintenanceEvent model"""
    
    def test_create_maintenance_event(self):
        """Test creating a basic maintenance event"""
        event = MaintenanceEvent(
            event_number="ME-2024-001",
            title="Routine Maintenance - Unit 1",
            description="Scheduled routine maintenance for Unit 1",
            event_type=MaintenanceEventType.Routine,
            planned_start_date=date(2024, 3, 1),
            planned_end_date=date(2024, 3, 15)
        )
        
        assert event.event_number == "ME-2024-001"
        assert event.title == "Routine Maintenance - Unit 1"
        assert event.event_type == MaintenanceEventType.Routine
        assert event.status == MaintenanceEventStatus.Planned  # Default status
        assert event.planned_start_date == date(2024, 3, 1)
        assert event.planned_end_date == date(2024, 3, 15)
    
    def test_maintenance_event_status_default(self):
        """Test that maintenance event has default status of Planned"""
        event = MaintenanceEvent(
            event_number="ME-2024-002",
            title="Test Event",
            event_type=MaintenanceEventType.Overhaul,
            planned_start_date=date(2024, 4, 1),
            planned_end_date=date(2024, 4, 30)
        )
        
        assert event.status == MaintenanceEventStatus.Planned
    
    def test_maintenance_event_with_all_fields(self):
        """Test creating maintenance event with all optional fields"""
        event = MaintenanceEvent(
            event_number="ME-2024-003",
            title="Complete Overhaul",
            description="Complete overhaul of main equipment",
            event_type=MaintenanceEventType.Overhaul,
            status=MaintenanceEventStatus.InProgress,
            planned_start_date=date(2024, 5, 1),
            planned_end_date=date(2024, 6, 30),
            actual_start_date=date(2024, 5, 2),
            created_by="admin",
            approved_by="supervisor",
            approval_date=datetime(2024, 4, 25, 10, 0, 0),
            notes="Critical maintenance window"
        )
        
        assert event.description == "Complete overhaul of main equipment"
        assert event.status == MaintenanceEventStatus.InProgress
        assert event.actual_start_date == date(2024, 5, 2)
        assert event.created_by == "admin"
        assert event.approved_by == "supervisor"
        assert event.notes == "Critical maintenance window"

class TestMaintenanceSubEvent:
    """Test cases for MaintenanceSubEvent model"""
    
    def test_create_maintenance_sub_event(self):
        """Test creating a basic maintenance sub-event"""
        sub_event = MaintenanceSubEvent(
            parent_event_id=1,
            sub_event_number="MSE-2024-001",
            title="Total Overhaul",
            sub_type=OverhaulSubType.TotalOverhaul,
            planned_start_date=date(2024, 3, 1),
            planned_end_date=date(2024, 3, 10)
        )
        
        assert sub_event.parent_event_id == 1
        assert sub_event.sub_event_number == "MSE-2024-001"
        assert sub_event.title == "Total Overhaul"
        assert sub_event.sub_type == OverhaulSubType.TotalOverhaul
        assert sub_event.status == MaintenanceEventStatus.Planned  # Default status
        assert sub_event.completion_percentage == 0.0  # Default completion
    
    def test_sub_event_completion_percentage_validation(self):
        """Test that completion percentage is within valid range"""
        sub_event = MaintenanceSubEvent(
            parent_event_id=1,
            sub_event_number="MSE-2024-002",
            title="Train Overhaul",
            sub_type=OverhaulSubType.TrainOverhaul,
            planned_start_date=date(2024, 3, 5),
            planned_end_date=date(2024, 3, 15),
            completion_percentage=75.5
        )
        
        assert sub_event.completion_percentage == 75.5
    
    def test_sub_event_with_all_fields(self):
        """Test creating sub-event with all optional fields"""
        sub_event = MaintenanceSubEvent(
            parent_event_id=1,
            sub_event_number="MSE-2024-003",
            title="Unit Overhaul",
            description="Detailed unit maintenance",
            sub_type=OverhaulSubType.UnitOverhaul,
            status=MaintenanceEventStatus.InProgress,
            planned_start_date=date(2024, 4, 1),
            planned_end_date=date(2024, 4, 15),
            actual_start_date=date(2024, 4, 2),
            actual_end_date=date(2024, 4, 14),
            completion_percentage=100.0,
            notes="Completed ahead of schedule"
        )
        
        assert sub_event.description == "Detailed compressor maintenance"
        assert sub_event.status == MaintenanceEventStatus.InProgress
        assert sub_event.actual_start_date == date(2024, 4, 2)
        assert sub_event.actual_end_date == date(2024, 4, 14)
        assert sub_event.completion_percentage == 100.0
        assert sub_event.notes == "Completed ahead of schedule"

class TestMaintenanceEnums:
    """Test cases for maintenance enums"""
    
    def test_maintenance_event_type_values(self):
        """Test MaintenanceEventType enum values"""
        assert MaintenanceEventType.Routine == "Routine"
        assert MaintenanceEventType.Overhaul == "Overhaul"
        assert MaintenanceEventType.Emergency == "Emergency"
        assert MaintenanceEventType.Preventive == "Preventive"
        assert MaintenanceEventType.Corrective == "Corrective"
        assert MaintenanceEventType.Custom == "Custom"
    
    def test_maintenance_event_status_values(self):
        """Test MaintenanceEventStatus enum values"""
        assert MaintenanceEventStatus.Planned == "Planned"
        assert MaintenanceEventStatus.InProgress == "InProgress"
        assert MaintenanceEventStatus.Completed == "Completed"
        assert MaintenanceEventStatus.Cancelled == "Cancelled"
        assert MaintenanceEventStatus.Postponed == "Postponed"
    
    def test_overhaul_sub_type_values(self):
        """Test OverhaulSubType enum values"""
        assert OverhaulSubType.TotalOverhaul == "TotalOverhaul"
        assert OverhaulSubType.TrainOverhaul == "TrainOverhaul"
        assert OverhaulSubType.UnitOverhaul == "UnitOverhaul"
        assert OverhaulSubType.NormalOverhaul == "NormalOverhaul"    de
f test_normal_overhaul_sub_event(self):
        """Test creating normal overhaul sub-event"""
        sub_event = MaintenanceSubEvent(
            parent_event_id=2,
            sub_event_number="MSE-2024-004",
            title="Normal Overhaul",
            description="Standard maintenance overhaul",
            sub_type=OverhaulSubType.NormalOverhaul,
            planned_start_date=date(2024, 5, 1),
            planned_end_date=date(2024, 5, 10)
        )
        
        assert sub_event.sub_type == OverhaulSubType.NormalOverhaul
        assert sub_event.title == "Normal Overhaul"
        assert sub_event.description == "Standard maintenance overhaul"