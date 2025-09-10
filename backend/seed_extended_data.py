#!/usr/bin/env python3
"""
Extended Database Seeding Script
Adds maintenance events, inspections, and daily reports with all status combinations
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
    MaintenanceEventType, MaintenanceEventStatus
)
from app.domains.inspection.models.enums import (
    InspectionStatus, RefineryDepartment
)


def seed_maintenance_events():
    """Seed maintenance events with all statuses"""
    today = date.today()
    
    events_data = [
        {
            "event_number": "ME-2025-001",
            "title": "Annual Overhaul - Unit 100",
            "description": "Comprehensive overhaul of Unit 100 including all major equipment",
            "event_type": MaintenanceEventType.Overhaul,
            "status": MaintenanceEventStatus.InProgress,
            "planned_start_date": today - timedelta(days=5),
            "planned_end_date": today + timedelta(days=25),
            "actual_start_date": today - timedelta(days=5),
            "created_by": "احمد رضایی"
        },
        {
            "event_number": "ME-2025-002",
            "title": "Quarterly Inspection - Unit 200",
            "description": "Routine quarterly inspection of pressure vessels",
            "event_type": MaintenanceEventType.Routine,
            "status": MaintenanceEventStatus.Planned,
            "planned_start_date": today + timedelta(days=7),
            "planned_end_date": today + timedelta(days=14),
            "created_by": "محمد احمدی"
        },
        {
            "event_number": "ME-2025-003",
            "title": "Emergency Repair - Heat Exchanger",
            "description": "Emergency repair of leaking heat exchanger HX-301",
            "event_type": MaintenanceEventType.Emergency,
            "status": MaintenanceEventStatus.Completed,
            "planned_start_date": today - timedelta(days=10),
            "planned_end_date": today - timedelta(days=8),
            "actual_start_date": today - timedelta(days=10),
            "actual_end_date": today - timedelta(days=7),
            "created_by": "علی محمدی"
        },
        {
            "event_number": "ME-2025-004",
            "title": "Preventive Maintenance - Compressors",
            "description": "Scheduled preventive maintenance for compressor units",
            "event_type": MaintenanceEventType.Preventive,
            "status": MaintenanceEventStatus.Cancelled,
            "planned_start_date": today + timedelta(days=15),
            "planned_end_date": today + timedelta(days=20),
            "created_by": "حسن کریمی"
        },
        {
            "event_number": "ME-2025-005",
            "title": "Corrective Work - Storage Tanks",
            "description": "Corrective maintenance for storage tank issues",
            "event_type": MaintenanceEventType.Corrective,
            "status": MaintenanceEventStatus.Postponed,
            "planned_start_date": today + timedelta(days=30),
            "planned_end_date": today + timedelta(days=35),
            "created_by": "رضا موسوی"
        }
    ]
    
    events_list = []
    for i, event_data in enumerate(events_data, 1):
        event = MaintenanceEvent(
            id=i,
            event_number=event_data["event_number"],
            title=event_data["title"],
            description=event_data["description"],
            event_type=event_data["event_type"],
            status=event_data["status"],
            planned_start_date=event_data["planned_start_date"],
            planned_end_date=event_data["planned_end_date"],
            actual_start_date=event_data.get("actual_start_date"),
            actual_end_date=event_data.get("actual_end_date"),
            created_by=event_data["created_by"],
            created_at=datetime.now(),
            updated_at=datetime.now()
        )
        events_list.append(event)
    
    return events_list


def seed_inspections():
    """Seed inspections with all statuses"""
    today = date.today()
    
    inspections_data = [
        {
            "inspection_number": "INS-2025-001",
            "title": "Pump P-101 Mechanical Inspection",
            "description": "Detailed mechanical inspection of main feed pump",
            "start_date": today - timedelta(days=2),
            "end_date": today + timedelta(days=1),
            "status": InspectionStatus.InProgress,
            "equipment_id": 1,  # P-101
            "maintenance_event_id": 1,
            "requesting_department": RefineryDepartment.Operations
        },
        {
            "inspection_number": "INS-2025-002",
            "title": "Vessel V-201 Pressure Test",
            "description": "Pressure testing and safety inspection",
            "start_date": today + timedelta(days=5),
            "status": InspectionStatus.Planned,
            "equipment_id": 2,  # V-201
            "maintenance_event_id": 2,
            "requesting_department": RefineryDepartment.Safety
        },
        {
            "inspection_number": "INS-2025-003",
            "title": "Heat Exchanger HX-301 Leak Test",
            "description": "Leak detection and repair verification",
            "start_date": today - timedelta(days=8),
            "end_date": today - timedelta(days=7),
            "status": InspectionStatus.Completed,
            "equipment_id": 3,  # HX-301
            "maintenance_event_id": 3,
            "requesting_department": RefineryDepartment.Maintenance,
            "final_report": "Leak repaired successfully. Equipment ready for service."
        },
        {
            "inspection_number": "INS-2025-004",
            "title": "Compressor C-401 Vibration Check",
            "description": "Vibration analysis and condition monitoring",
            "start_date": today + timedelta(days=20),
            "status": InspectionStatus.Cancelled,
            "equipment_id": 4,  # C-401
            "maintenance_event_id": 4,
            "requesting_department": RefineryDepartment.Engineering
        },
        {
            "inspection_number": "INS-2025-005",
            "title": "Tank T-501 Level Sensor Check",
            "description": "Level sensor calibration and testing",
            "start_date": today + timedelta(days=35),
            "status": InspectionStatus.Postponed,
            "equipment_id": 5,  # T-501
            "maintenance_event_id": 5,
            "requesting_department": RefineryDepartment.Inspection
        }
    ]
    
    inspections_list = []
    for i, insp_data in enumerate(inspections_data, 1):
        inspection = Inspection(
            id=i,
            inspection_number=insp_data["inspection_number"],
            title=insp_data["title"],
            description=insp_data["description"],
            start_date=insp_data["start_date"],
            end_date=insp_data.get("end_date"),
            status=insp_data["status"],
            equipment_id=insp_data["equipment_id"],
            maintenance_event_id=insp_data.get("maintenance_event_id"),
            requesting_department=insp_data["requesting_department"],
            final_report=insp_data.get("final_report"),
            created_at=datetime.now(),
            updated_at=datetime.now()
        )
        inspections_list.append(inspection)
    
    return inspections_list


def seed_daily_reports():
    """Seed daily reports with different statuses"""
    today = date.today()
    
    reports_data = [
        {
            "inspection_id": 1,  # In-progress inspection
            "report_date": today - timedelta(days=1),
            "description": "Daily inspection report for pump P-101 - Day 1 of mechanical inspection",
            "inspector_names": "احمد رضایی"
        },
        {
            "inspection_id": 1,  # Same inspection, next day
            "report_date": today,
            "description": "Daily inspection report for pump P-101 - Day 2 of mechanical inspection with vibration analysis",
            "inspector_names": "احمد رضایی"
        },
        {
            "inspection_id": 3,  # Completed inspection
            "report_date": today - timedelta(days=7),
            "description": "Daily report for heat exchanger HX-301 leak repair completion",
            "inspector_names": "علی محمدی"
        }
    ]
    
    reports_list = []
    for i, report_data in enumerate(reports_data, 1):
        report = DailyReport(
            id=i,
            inspection_id=report_data["inspection_id"],
            report_date=report_data["report_date"],
            description=report_data["description"],
            inspector_names=report_data["inspector_names"],
            created_at=datetime.now(),
            updated_at=datetime.now()
        )
        reports_list.append(report)
    
    return reports_list


def main():
    """Main extended seeding function"""
    print("🌱 Starting extended database seeding...")
    
    with Session(engine) as session:
        print("🔧 Seeding maintenance events...")
        events = seed_maintenance_events()
        for event in events:
            session.add(event)
        
        print("🔍 Seeding inspections...")
        inspections = seed_inspections()
        for inspection in inspections:
            session.add(inspection)
        
        print("📝 Seeding daily reports...")
        reports = seed_daily_reports()
        for report in reports:
            session.add(report)
        
        # Commit all data
        session.commit()
        print("✅ Extended data seeded successfully!")
        
        print(f"📊 Additional seeded data:")
        print(f"  - {len(events)} maintenance events (Planned, InProgress, Completed, Cancelled, Postponed)")
        print(f"  - {len(inspections)} inspections (Planned, InProgress, Completed, Cancelled, Postponed)")
        print(f"  - {len(reports)} daily reports")
        print(f"")
        print(f"🎯 All status combinations available for testing:")
        print(f"  - MaintenanceEventStatus: Planned, InProgress, Completed, Cancelled, Postponed")
        print(f"  - InspectionStatus: Planned, InProgress, Completed, Cancelled, Postponed")


if __name__ == "__main__":
    main()