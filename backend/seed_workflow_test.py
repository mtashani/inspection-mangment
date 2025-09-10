#!/usr/bin/env python3
"""
Workflow Testing Seeding Script
Creates a comprehensive maintenance event with:
- 6 sub-events with different statuses
- 10 inspection plans (planned inspections)
- Additional unplanned inspections
- Complete workflow demonstration
"""

import os
import sys
from datetime import date, datetime, timedelta
from sqlmodel import Session, select

# Add app directory to path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.database import engine
from app.domains.maintenance.models.event import MaintenanceEvent, MaintenanceSubEvent
from app.domains.maintenance.models.inspection_plan import InspectionPlan
from app.domains.inspection.models.inspection import Inspection
from app.domains.daily_report.models.report import DailyReport

# Import enums
from app.domains.maintenance.models.enums import (
    MaintenanceEventType, MaintenanceEventStatus, OverhaulSubType,
    MaintenanceEventCategory, InspectionPlanStatus, InspectionPriority
)
from app.domains.inspection.models.enums import (
    InspectionStatus, InspectionType, InspectionPriority as InspectionPriorityEnum,
    FindingSeverity, RefineryDepartment
)


def seed_comprehensive_event():
    """Create a comprehensive maintenance event for workflow testing"""
    today = date.today()
    
    # Main maintenance event
    event = MaintenanceEvent(
        id=10,  # Use ID 10 to avoid conflicts
        event_number="ME-2025-WORKFLOW",
        title="Major Overhaul - Process Unit 300 (Workflow Testing)",
        description="Comprehensive major overhaul of Process Unit 300 including all critical equipment. This event demonstrates the complete workflow from planning to execution.",
        event_type=MaintenanceEventType.Overhaul,
        status=MaintenanceEventStatus.InProgress,
        planned_start_date=today - timedelta(days=3),
        planned_end_date=today + timedelta(days=45),
        actual_start_date=today - timedelta(days=3),
        created_by="Administrator",
        created_at=datetime.now(),
        updated_at=datetime.now()
    )
    
    return event


def seed_sub_events():
    """Create 6 sub-events with different statuses"""
    today = date.today()
    
    sub_events_data = [
        {
            "sub_event_number": "SE-2025-WF-001",
            "title": "Total Equipment Overhaul - Phase 1",
            "description": "Complete overhaul of critical equipment in first phase",
            "sub_event_type": OverhaulSubType.TotalOverhaul,
            "status": MaintenanceEventStatus.Completed,
            "planned_start_date": today - timedelta(days=2),
            "planned_end_date": today - timedelta(days=1),
            "actual_start_date": today - timedelta(days=2),
            "actual_end_date": today - timedelta(days=1)
        },
        {
            "sub_event_number": "SE-2025-WF-002", 
            "title": "Train A Equipment Overhaul",
            "description": "Overhaul of equipment train A including pumps and compressors",
            "sub_event_type": OverhaulSubType.TrainOverhaul,
            "status": MaintenanceEventStatus.InProgress,
            "planned_start_date": today - timedelta(days=1),
            "planned_end_date": today + timedelta(days=3),
            "actual_start_date": today - timedelta(days=1)
        },
        {
            "sub_event_number": "SE-2025-WF-003",
            "title": "Unit 300A Overhaul",
            "description": "Complete overhaul of processing unit 300A",
            "sub_event_type": OverhaulSubType.UnitOverhaul,
            "status": MaintenanceEventStatus.Planned,
            "planned_start_date": today + timedelta(days=5),
            "planned_end_date": today + timedelta(days=10)
        },
        {
            "sub_event_number": "SE-2025-WF-004",
            "title": "Normal Maintenance Activities",
            "description": "Standard maintenance and inspection activities",
            "sub_event_type": OverhaulSubType.NormalOverhaul,
            "status": MaintenanceEventStatus.Postponed,
            "planned_start_date": today + timedelta(days=12),
            "planned_end_date": today + timedelta(days=18)
        },
        {
            "sub_event_number": "SE-2025-WF-005",
            "title": "Train B Equipment Overhaul", 
            "description": "Overhaul of equipment train B - cancelled due to resource constraints",
            "sub_event_type": OverhaulSubType.TrainOverhaul,
            "status": MaintenanceEventStatus.Cancelled,
            "planned_start_date": today + timedelta(days=20),
            "planned_end_date": today + timedelta(days=25)
        },
        {
            "sub_event_number": "SE-2025-WF-006",
            "title": "Unit 300B Overhaul",
            "description": "Complete overhaul of processing unit 300B",
            "sub_event_type": OverhaulSubType.UnitOverhaul,
            "status": MaintenanceEventStatus.Planned,
            "planned_start_date": today + timedelta(days=30),
            "planned_end_date": today + timedelta(days=40)
        }
    ]
    
    sub_events_list = []
    for i, sub_data in enumerate(sub_events_data, 1):
        sub_event = MaintenanceSubEvent(
            id=i + 10,  # Avoid conflicts with existing data
            parent_event_id=10,  # Link to main event
            sub_event_number=sub_data["sub_event_number"],
            title=sub_data["title"],
            description=sub_data["description"],
            sub_event_type=sub_data["sub_event_type"],
            status=sub_data["status"],
            planned_start_date=sub_data["planned_start_date"],
            planned_end_date=sub_data["planned_end_date"],
            actual_start_date=sub_data.get("actual_start_date"),
            actual_end_date=sub_data.get("actual_end_date"),
            created_at=datetime.now(),
            updated_at=datetime.now()
        )
        sub_events_list.append(sub_event)
    
    return sub_events_list


def seed_inspection_plans():
    """Create 10 inspection plans with different statuses and priorities"""
    today = date.today()
    
    plans_data = [
        {
            "plan_number": "IP-2025-WF-001",
            "title": "Pump P-301 Detailed Inspection Plan",
            "description": "Comprehensive inspection plan for main process pump P-301",
            "equipment_id": 1,  # P-101 (reusing existing equipment)
            "maintenance_sub_event_id": 11,  # First sub-event
            "status": InspectionPlanStatus.Planned,
            "priority": InspectionPriority.High,
            "planned_date": today + timedelta(days=1)
        },
        {
            "plan_number": "IP-2025-WF-002", 
            "title": "Heat Exchanger HX-302 Inspection Plan",
            "description": "Tube bundle and shell inspection plan",
            "equipment_id": 3,  # HX-301
            "maintenance_sub_event_id": 11,
            "status": InspectionPlanStatus.Planned,
            "priority": InspectionPriority.High,
            "planned_date": today + timedelta(days=2)
        },
        {
            "plan_number": "IP-2025-WF-003",
            "title": "Compressor C-302 Vibration Analysis Plan",
            "description": "Detailed vibration analysis and alignment check",
            "equipment_id": 4,  # C-401
            "maintenance_sub_event_id": 11,
            "status": InspectionPlanStatus.InProgress,
            "priority": InspectionPriority.Medium,
            "planned_date": today + timedelta(days=3)
        },
        {
            "plan_number": "IP-2025-WF-004",
            "title": "Motor M-302 Electrical Inspection Plan",
            "description": "Electrical motor winding and connection inspection",
            "equipment_id": 6,  # E-601
            "maintenance_sub_event_id": 12,  # Electrical sub-event
            "status": InspectionPlanStatus.Planned,
            "priority": InspectionPriority.Medium,
            "planned_date": today + timedelta(days=4)
        },
        {
            "plan_number": "IP-2025-WF-005",
            "title": "Control Valve CV-302 Calibration Plan",
            "description": "Control valve position and response calibration",
            "equipment_id": 2,  # V-201
            "maintenance_sub_event_id": 13,  # Third sub-event  
            "status": InspectionPlanStatus.Planned,
            "priority": InspectionPriority.Low,
            "planned_date": today + timedelta(days=7)
        },
        {
            "plan_number": "IP-2025-WF-006",
            "title": "Storage Tank T-302 Internal Inspection Plan",
            "description": "Internal tank inspection including floor and walls",
            "equipment_id": 5,  # T-501
            "maintenance_sub_event_id": 14,  # Fourth sub-event
            "status": InspectionPlanStatus.Cancelled,
            "priority": InspectionPriority.High,
            "planned_date": today + timedelta(days=15)
        },
        {
            "plan_number": "IP-2025-WF-007",
            "title": "Furnace F-302 Burner Inspection Plan", 
            "description": "Burner nozzles and combustion chamber inspection",
            "equipment_id": 7,  # F-701
            "maintenance_sub_event_id": 15,  # Fifth sub-event
            "status": InspectionPlanStatus.Cancelled,
            "priority": InspectionPriority.High,
            "planned_date": today + timedelta(days=22)
        },
        {
            "plan_number": "IP-2025-WF-008",
            "title": "Reactor R-302 Catalyst Bed Inspection Plan",
            "description": "Catalyst bed condition and distribution inspection", 
            "equipment_id": 8,  # R-801
            "maintenance_sub_event_id": 16,  # Sixth sub-event
            "status": InspectionPlanStatus.Planned,
            "priority": InspectionPriority.Critical,
            "planned_date": today + timedelta(days=32)
        },
        {
            "plan_number": "IP-2025-WF-009",
            "title": "Safety Valve SV-302 Testing Plan",
            "description": "Safety valve lifting pressure and seat leakage test",
            "equipment_id": 2,  # V-201 (pressure vessel)
            "maintenance_sub_event_id": 15,  # Fifth sub-event
            "status": InspectionPlanStatus.Planned,
            "priority": InspectionPriority.Critical,
            "planned_date": today + timedelta(days=23)
        },
        {
            "plan_number": "IP-2025-WF-010",
            "title": "Piping System PS-302 Thickness Measurement Plan",
            "description": "Ultrasonic thickness measurement of critical piping",
            "equipment_id": 1,  # Associated with pump system
            "maintenance_sub_event_id": 14,  # Fourth sub-event
            "status": InspectionPlanStatus.Planned,
            "priority": InspectionPriority.Medium,
            "planned_date": today + timedelta(days=16)
        }
    ]
    
    plans_list = []
    for i, plan_data in enumerate(plans_data, 1):
        plan = InspectionPlan(
            id=i + 10,  # Avoid conflicts
            plan_number=plan_data["plan_number"],
            title=plan_data["title"],
            description=plan_data["description"],
            equipment_tag=f"EQ-{plan_data['equipment_id']:03d}",  # Generate equipment tag
            requester="Maintenance Department",
            maintenance_sub_event_id=plan_data["maintenance_sub_event_id"],
            status=plan_data["status"],
            priority=plan_data["priority"],
            planned_start_date=plan_data["planned_date"],
            created_at=datetime.now(),
            updated_at=datetime.now()
        )
        plans_list.append(plan)
    
    return plans_list


def seed_workflow_inspections():
    """Create inspections - both planned (from inspection plans) and unplanned"""
    today = date.today()
    
    inspections_data = [
        # PLANNED INSPECTIONS (executed from inspection plans)
        {
            "inspection_number": "INS-2025-WF-001",
            "title": "Pump P-301 Mechanical Inspection (Planned)",
            "description": "Executed inspection from plan IP-2025-WF-001",
            "start_date": today - timedelta(days=1),
            "end_date": today,
            "status": InspectionStatus.Completed,
            "inspection_type": InspectionType.NDT,
            "equipment_id": 1,
            "maintenance_event_id": 10,
            "maintenance_sub_event_id": 11,
            "inspection_plan_id": 11,  # Links to the inspection plan
            "requesting_department": RefineryDepartment.Maintenance,
            "final_report": "Pump inspection completed. Minor bearing wear detected, replacement recommended during next shutdown."
        },
        {
            "inspection_number": "INS-2025-WF-002",
            "title": "Heat Exchanger HX-302 Inspection (Planned)",
            "description": "Executed inspection from plan IP-2025-WF-002", 
            "start_date": today,
            "status": InspectionStatus.InProgress,
            "inspection_type": InspectionType.Thickness,
            "equipment_id": 3,
            "maintenance_event_id": 10,
            "maintenance_sub_event_id": 11,
            "inspection_plan_id": 12,
            "requesting_department": RefineryDepartment.Maintenance
        },
        {
            "inspection_number": "INS-2025-WF-003",
            "title": "Compressor C-302 Vibration Analysis (Planned)",
            "description": "Executed inspection from plan IP-2025-WF-003",
            "start_date": today + timedelta(days=1),
            "status": InspectionStatus.Planned,
            "inspection_type": InspectionType.Visual,
            "equipment_id": 4,
            "maintenance_event_id": 10,
            "maintenance_sub_event_id": 11,
            "inspection_plan_id": 13,
            "requesting_department": RefineryDepartment.Maintenance
        },
        {
            "inspection_number": "INS-2025-WF-004",
            "title": "Control Valve CV-302 Calibration (Planned)",
            "description": "Executed inspection from plan IP-2025-WF-005",
            "start_date": today + timedelta(days=5),
            "status": InspectionStatus.Planned,
            "inspection_type": InspectionType.Instrumentation,
            "equipment_id": 2,
            "maintenance_event_id": 10,
            "maintenance_sub_event_id": 13,
            "inspection_plan_id": 15,
            "requesting_department": RefineryDepartment.InstrumentationControl
        },
        
        # UNPLANNED INSPECTIONS (emergency/routine)
        {
            "inspection_number": "INS-2025-WF-005",
            "title": "Emergency Leak Check - Flange F-302 (Unplanned)",
            "description": "Emergency inspection due to reported leak at flange connection",
            "start_date": today - timedelta(days=2),
            "end_date": today - timedelta(days=2),
            "status": InspectionStatus.Completed,
            "inspection_type": InspectionType.Operational,
            "equipment_id": 1,
            "maintenance_event_id": 10,
            "maintenance_sub_event_id": 11,
            "requesting_department": RefineryDepartment.Operations,
            "final_report": "Minor leak at flange gasket. Temporary repair applied. Full repair scheduled in main overhaul."
        },
        {
            "inspection_number": "INS-2025-WF-006",
            "title": "Routine Pressure Test - System Check (Unplanned)",
            "description": "Routine pressure test not part of original plan",
            "start_date": today + timedelta(days=2),
            "status": InspectionStatus.Planned,
            "inspection_type": InspectionType.Visual,
            "equipment_id": 2,
            "maintenance_event_id": 10,
            "requesting_department": RefineryDepartment.Safety
        },
        {
            "inspection_number": "INS-2025-WF-007", 
            "title": "Follow-up Inspection - Bearing Condition (Unplanned)",
            "description": "Follow-up inspection based on findings from INS-2025-WF-001",
            "start_date": today + timedelta(days=3),
            "status": InspectionStatus.Planned,
            "inspection_type": InspectionType.Other,
            "equipment_id": 1,
            "maintenance_event_id": 10,
            "maintenance_sub_event_id": 11,
            "requesting_department": RefineryDepartment.Maintenance
        }
    ]
    
    inspections_list = []
    for i, insp_data in enumerate(inspections_data, 1):
        inspection = Inspection(
            id=i + 20,  # Avoid conflicts with existing data
            inspection_number=insp_data["inspection_number"],
            title=insp_data["title"],
            description=insp_data["description"],
            start_date=insp_data["start_date"],
            end_date=insp_data.get("end_date"),
            status=insp_data["status"],
            inspection_type=insp_data.get("inspection_type", InspectionType.Visual),
            equipment_id=insp_data["equipment_id"],
            maintenance_event_id=insp_data.get("maintenance_event_id"),
            maintenance_sub_event_id=insp_data.get("maintenance_sub_event_id"),
            inspection_plan_id=insp_data.get("inspection_plan_id"),
            requesting_department=insp_data["requesting_department"],
            final_report=insp_data.get("final_report"),
            created_at=datetime.now(),
            updated_at=datetime.now()
        )
        inspections_list.append(inspection)
    
    return inspections_list


def main():
    """Main workflow seeding function"""
    print("🌱 Starting workflow testing database seeding...")
    
    with Session(engine) as session:
        print("🏭 Creating comprehensive maintenance event...")
        event = seed_comprehensive_event()
        session.add(event)
        
        print("🔧 Creating 6 sub-events with different statuses...")
        sub_events = seed_sub_events()
        for sub_event in sub_events:
            session.add(sub_event)
        
        print("📋 Creating 10 inspection plans...")
        plans = seed_inspection_plans()
        for plan in plans:
            session.add(plan)
        
        print("🔍 Creating planned and unplanned inspections...")
        inspections = seed_workflow_inspections()
        for inspection in inspections:
            session.add(inspection)
        
        # Commit all data
        session.commit()
        print("✅ Workflow testing data seeded successfully!")
        
        print(f"\n📊 Workflow Testing Data Summary:")
        print(f"  🏭 1 Major Maintenance Event: ME-2025-WORKFLOW")
        print(f"  🔧 6 Sub-Events with statuses:")
        print(f"     - Completed: Total Equipment Overhaul")
        print(f"     - InProgress: Train A Equipment Overhaul") 
        print(f"     - Planned: Unit 300A & Unit 300B Overhauls")
        print(f"     - Postponed: Normal Maintenance Activities")
        print(f"     - Cancelled: Train B Equipment Overhaul")
        print(f"  📋 10 Inspection Plans with statuses:")
        print(f"     - Planned: 7 plans")
        print(f"     - InProgress: 1 plan")
        print(f"     - Cancelled: 2 plans")
        print(f"  🔍 7 Inspections (4 Planned + 3 Unplanned):")
        print(f"     - Planned from inspection plans: 4")
        print(f"     - Unplanned (Emergency/Routine/Follow-up): 3")
        print(f"")
        print(f"🎯 Workflow Understanding:")
        print(f"  1. Maintenance Event → Sub-Events → Inspection Plans → Planned Inspections")
        print(f"  2. Unplanned Inspections can be created independently") 
        print(f"  3. Both planned and unplanned inspections link to maintenance events")
        print(f"  4. Inspection plans show 'what should be done'")
        print(f"  5. Inspections show 'what was actually done'")


if __name__ == "__main__":
    main()