import pytest
from datetime import date, datetime
from app.domains.inspection.models.inspection import Inspection
from app.domains.inspection.models.enums import InspectionStatus, RefineryDepartment

class TestInspection:
    """Test cases for enhanced Inspection model"""
    
    def test_create_inspection_with_required_fields(self):
        """Test creating inspection with required fields"""
        inspection = Inspection(
            inspection_number="INS-2024-001",
            title="Pressure Vessel Inspection",
            start_date=date(2024, 3, 1),
            equipment_id=1,
            requesting_department=RefineryDepartment.Operations
        )
        
        assert inspection.inspection_number == "INS-2024-001"
        assert inspection.title == "Pressure Vessel Inspection"
        assert inspection.start_date == date(2024, 3, 1)
        assert inspection.equipment_id == 1
        assert inspection.requesting_department == RefineryDepartment.Operations
        assert inspection.status == InspectionStatus.InProgress  # Default status
        assert inspection.end_date is None
        assert inspection.final_report is None
    
    def test_inspection_with_maintenance_event(self):
        """Test creating inspection associated with maintenance event"""
        inspection = Inspection(
            inspection_number="INS-2024-002",
            title="Overhaul Inspection",
            start_date=date(2024, 4, 1),
            equipment_id=2,
            maintenance_event_id=1,
            requesting_department=RefineryDepartment.Maintenance
        )
        
        assert inspection.maintenance_event_id == 1
        assert inspection.maintenance_sub_event_id is None
        assert inspection.requesting_department == RefineryDepartment.Maintenance
    
    def test_inspection_with_sub_event(self):
        """Test creating inspection associated with maintenance sub-event"""
        inspection = Inspection(
            inspection_number="INS-2024-003",
            title="Turbine Sub-Event Inspection",
            start_date=date(2024, 5, 1),
            equipment_id=3,
            maintenance_event_id=1,
            maintenance_sub_event_id=2,
            requesting_department=RefineryDepartment.Engineering
        )
        
        assert inspection.maintenance_event_id == 1
        assert inspection.maintenance_sub_event_id == 2
        assert inspection.requesting_department == RefineryDepartment.Engineering
    
    def test_inspection_with_all_fields(self):
        """Test creating inspection with all optional fields"""
        inspection = Inspection(
            inspection_number="INS-2024-004",
            title="Complete Equipment Inspection",
            description="Comprehensive inspection of critical equipment",
            start_date=date(2024, 6, 1),
            end_date=date(2024, 6, 15),
            status=InspectionStatus.Completed,
            equipment_id=4,
            maintenance_event_id=2,
            requesting_department=RefineryDepartment.Safety,
            final_report="Inspection completed successfully. No major issues found.",
            work_order="WO-2024-001",
            permit_number="PERMIT-2024-001"
        )
        
        assert inspection.description == "Comprehensive inspection of critical equipment"
        assert inspection.end_date == date(2024, 6, 15)
        assert inspection.status == InspectionStatus.Completed
        assert inspection.final_report == "Inspection completed successfully. No major issues found."
        assert inspection.work_order == "WO-2024-001"
        assert inspection.permit_number == "PERMIT-2024-001"
    
    def test_inspection_status_default(self):
        """Test that inspection has default status of InProgress"""
        inspection = Inspection(
            inspection_number="INS-2024-005",
            title="Default Status Test",
            start_date=date(2024, 7, 1),
            equipment_id=5,
            requesting_department=RefineryDepartment.Inspection
        )
        
        assert inspection.status == InspectionStatus.InProgress
    
    def test_inspection_different_departments(self):
        """Test inspection with different requesting departments"""
        departments = [
            RefineryDepartment.Operations,
            RefineryDepartment.Inspection,
            RefineryDepartment.Maintenance,
            RefineryDepartment.Engineering,
            RefineryDepartment.Safety,
            RefineryDepartment.QualityControl
        ]
        
        for i, dept in enumerate(departments):
            inspection = Inspection(
                inspection_number=f"INS-DEPT-{i+1:03d}",
                title=f"Inspection for {dept.value}",
                start_date=date(2024, 8, i+1),
                equipment_id=i+1,
                requesting_department=dept
            )
            
            assert inspection.requesting_department == dept
    
    def test_inspection_timeline_validation(self):
        """Test inspection timeline fields"""
        inspection = Inspection(
            inspection_number="INS-2024-006",
            title="Timeline Test",
            start_date=date(2024, 9, 1),
            end_date=date(2024, 9, 10),
            equipment_id=6,
            requesting_department=RefineryDepartment.Operations
        )
        
        assert inspection.start_date == date(2024, 9, 1)
        assert inspection.end_date == date(2024, 9, 10)
        # In a real application, you might want to validate that end_date >= start_date
    

    
    def test_inspection_without_maintenance_event(self):
        """Test creating inspection without maintenance event association"""
        inspection = Inspection(
            inspection_number="INS-2024-008",
            title="Standalone Inspection",
            start_date=date(2024, 11, 1),
            equipment_id=8,
            requesting_department=RefineryDepartment.QualityControl
        )
        
        assert inspection.maintenance_event_id is None
        assert inspection.maintenance_sub_event_id is None
    
    def test_inspection_final_report(self):
        """Test inspection final report field"""
        inspection = Inspection(
            inspection_number="INS-2024-009",
            title="Final Report Test",
            start_date=date(2024, 12, 1),
            end_date=date(2024, 12, 5),
            status=InspectionStatus.Completed,
            equipment_id=9,
            requesting_department=RefineryDepartment.Engineering,
            final_report="Equipment is in good condition. Recommended next inspection in 12 months."
        )
        
        assert inspection.final_report == "Equipment is in good condition. Recommended next inspection in 12 months."
        assert inspection.status == InspectionStatus.Completed

class TestInspectionStatusEnum:
    """Test cases for InspectionStatus enum usage"""
    
    def test_inspection_status_values(self):
        """Test that InspectionStatus enum works correctly"""
        inspection_planned = Inspection(
            inspection_number="INS-STATUS-001",
            title="Planned Inspection",
            start_date=date(2024, 3, 1),
            equipment_id=1,
            requesting_department=RefineryDepartment.Operations,
            status=InspectionStatus.Planned
        )
        
        inspection_completed = Inspection(
            inspection_number="INS-STATUS-002",
            title="Completed Inspection",
            start_date=date(2024, 3, 1),
            equipment_id=2,
            requesting_department=RefineryDepartment.Operations,
            status=InspectionStatus.Completed
        )
        
        assert inspection_planned.status == InspectionStatus.Planned
        assert inspection_completed.status == InspectionStatus.Completed
        assert inspection_planned.status != inspection_completed.status