#!/usr/bin/env python3
"""
Comprehensive script to seed realistic maintenance event data for analytics testing
This script creates a complete maintenance event with:
- Inspections (both planned and unplanned)
- Daily reports
- Equipment data
- Realistic completion rates and dates
"""

import sys
import os
from datetime import datetime, date, timedelta
from typing import List
import random

# Add the backend directory to the Python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from sqlmodel import Session, select
from app.database import engine
from app.domains.maintenance.models.event import MaintenanceEvent, MaintenanceSubEvent
from app.domains.maintenance.models.enums import (
    MaintenanceEventStatus, MaintenanceEventType, MaintenanceEventCategory,
    OverhaulSubType
)
# Removed import of InspectionPlan since it no longer exists
from app.domains.inspection.models.inspection import Inspection
from app.domains.inspection.models.enums import InspectionStatus, RefineryDepartment
from app.domains.equipment.models.equipment import Equipment
from app.domains.equipment.models.enums import EquipmentCategory, EquipmentStatus
from app.domains.daily_report.models.report import DailyReport
from app.domains.daily_report.models.enums import ReportStatus, WeatherCondition


def seed_realistic_maintenance_event():
    """Create a realistic maintenance event with comprehensive data"""
    
    print("🚀 Starting to seed realistic maintenance event data...")
    
    with Session(engine) as session:
        try:
            # 1. Create or update equipment
            print("📦 Creating equipment...")
            equipment_list = []
            
            # Comprehensive equipment catalog for realistic analytics testing
            equipment_data = [
                # Operations Department - Process Equipment
                {"tag": "P-101", "description": "Main Feed Pump", "unit": "Unit 1", "type": "Pump"},
                {"tag": "P-102", "description": "Backup Feed Pump", "unit": "Unit 1", "type": "Pump"},
                {"tag": "P-201", "description": "Circulation Pump", "unit": "Unit 2", "type": "Pump"},
                {"tag": "T-201", "description": "Distillation Tower", "unit": "Unit 2", "type": "Tower"},
                {"tag": "T-301", "description": "Stripper Tower", "unit": "Unit 3", "type": "Tower"},
                {"tag": "E-301", "description": "Heat Exchanger", "unit": "Unit 3", "type": "Heat Exchanger"},
                {"tag": "E-302", "description": "Condenser", "unit": "Unit 3", "type": "Heat Exchanger"},
                {"tag": "E-401", "description": "Reboiler", "unit": "Unit 4", "type": "Heat Exchanger"},
                {"tag": "C-501", "description": "Compressor Unit", "unit": "Unit 5", "type": "Compressor"},
                {"tag": "C-502", "description": "Booster Compressor", "unit": "Unit 5", "type": "Compressor"},
                {"tag": "F-601", "description": "Process Furnace", "unit": "Unit 6", "type": "Furnace"},
                {"tag": "R-701", "description": "Reactor Vessel", "unit": "Unit 7", "type": "Reactor"},
                {"tag": "R-702", "description": "Secondary Reactor", "unit": "Unit 7", "type": "Reactor"},
                
                # Maintenance Department - Storage & Utility
                {"tag": "V-401", "description": "Storage Vessel", "unit": "Unit 4", "type": "Vessel"},
                {"tag": "V-402", "description": "Buffer Vessel", "unit": "Unit 4", "type": "Vessel"},
                {"tag": "TK-801", "description": "Product Tank", "unit": "Tank Farm", "type": "Tank"},
                {"tag": "TK-802", "description": "Feed Tank", "unit": "Tank Farm", "type": "Tank"},
                {"tag": "TK-803", "description": "Intermediate Tank", "unit": "Tank Farm", "type": "Tank"},
                {"tag": "TK-804", "description": "Waste Tank", "unit": "Tank Farm", "type": "Tank"},
                
                # Engineering Department - Instrumentation & Control
                {"tag": "FIC-101", "description": "Flow Controller", "unit": "Unit 1", "type": "Instrument"},
                {"tag": "PIC-201", "description": "Pressure Controller", "unit": "Unit 2", "type": "Instrument"},
                {"tag": "TIC-301", "description": "Temperature Controller", "unit": "Unit 3", "type": "Instrument"},
                {"tag": "LIC-401", "description": "Level Controller", "unit": "Unit 4", "type": "Instrument"},
                
                # Safety Department - Safety Systems
                {"tag": "PSV-101", "description": "Pressure Safety Valve", "unit": "Unit 1", "type": "Safety Valve"},
                {"tag": "PSV-201", "description": "Relief Valve", "unit": "Unit 2", "type": "Safety Valve"},
                {"tag": "ESD-301", "description": "Emergency Shutdown Valve", "unit": "Unit 3", "type": "Safety Valve"},
                {"tag": "FD-401", "description": "Fire Detection System", "unit": "Unit 4", "type": "Safety System"},
                
                # Additional Critical Equipment
                {"tag": "MOV-501", "description": "Motor Operated Valve", "unit": "Unit 5", "type": "Valve"},
                {"tag": "BFW-601", "description": "Boiler Feed Water Pump", "unit": "Utilities", "type": "Pump"},
                {"tag": "CW-701", "description": "Cooling Water System", "unit": "Utilities", "type": "System"},
            ]
            
            for equip_data in equipment_data:
                # Check if equipment exists
                existing = session.exec(
                    select(Equipment).where(Equipment.tag == equip_data["tag"])
                ).first()
                
                if not existing:
                    equipment = Equipment(
                        tag=equip_data["tag"],
                        description=equip_data["description"],
                        unit=equip_data["unit"],
                        equipment_type=equip_data["type"],
                        installation_date=date(2020, 1, 1)
                    )
                    session.add(equipment)
                    equipment_list.append(equipment)
                else:
                    equipment_list.append(existing)
            
            session.commit()
            print(f"✅ Created {len(equipment_list)} equipment items")
            
            # 2. Create a comprehensive maintenance event
            print("🔧 Creating maintenance event...")
            
            # Check if event exists
            existing_event = session.exec(
                select(MaintenanceEvent).where(MaintenanceEvent.event_number == "MAINT-2025-001")
            ).first()
            
            if existing_event:
                print("⚠️  Event MAINT-2025-001 already exists. Updating it...")
                event = existing_event
                event.status = MaintenanceEventStatus.InProgress
                event.actual_start_date = date.today() - timedelta(days=15)
            else:
                event = MaintenanceEvent(
                    event_number="MAINT-2025-001",
                    title="Annual Turnaround 2025 - Process Units",
                    description="Comprehensive annual maintenance including inspections, repairs, and upgrades for process units 1-7",
                    event_type=MaintenanceEventType.Overhaul,
                    event_category=MaintenanceEventCategory.Complex,
                    status=MaintenanceEventStatus.InProgress,
                    planned_start_date=date.today() - timedelta(days=20),
                    planned_end_date=date.today() + timedelta(days=10),
                    actual_start_date=date.today() - timedelta(days=15),
                    created_by="admin",
                    approved_by="plant_manager",
                    approval_date=datetime.now() - timedelta(days=25),
                    notes="Critical annual maintenance shutdown"
                )
                session.add(event)
            
            session.commit()
            session.refresh(event)
            print(f"✅ Created/Updated event: {event.event_number}")
            
            # 3. Create sub-events for complex event
            print("📋 Creating sub-events...")
            sub_events = []
            
            # Comprehensive sub-events for realistic analytics testing
            sub_event_data = [
                {"number": "SE-001", "title": "Pump Systems Maintenance", "sub_type": OverhaulSubType.TotalOverhaul, "completion": 85.0},
                {"number": "SE-002", "title": "Tower Inspection & Cleaning", "sub_type": OverhaulSubType.UnitOverhaul, "completion": 72.5},
                {"number": "SE-003", "title": "Heat Exchanger Service", "sub_type": OverhaulSubType.NormalOverhaul, "completion": 95.0},
                {"number": "SE-004", "title": "Compressor Overhaul", "sub_type": OverhaulSubType.TotalOverhaul, "completion": 45.0},
                {"number": "SE-005", "title": "Furnace Inspection", "sub_type": OverhaulSubType.UnitOverhaul, "completion": 88.0},
                {"number": "SE-006", "title": "Reactor Maintenance", "sub_type": OverhaulSubType.TotalOverhaul, "completion": 60.0},
                {"number": "SE-007", "title": "Tank Farm Inspection", "sub_type": OverhaulSubType.NormalOverhaul, "completion": 78.0},
                {"number": "SE-008", "title": "Safety Systems Check", "sub_type": OverhaulSubType.UnitOverhaul, "completion": 92.0},
                {"number": "SE-009", "title": "Instrumentation Calibration", "sub_type": OverhaulSubType.NormalOverhaul, "completion": 65.0},
                {"number": "SE-010", "title": "Utility Systems Maintenance", "sub_type": OverhaulSubType.UnitOverhaul, "completion": 55.0},
            ]
            
            for se_data in sub_event_data:
                existing_se = session.exec(
                    select(MaintenanceSubEvent).where(
                        MaintenanceSubEvent.parent_event_id == event.id,
                        MaintenanceSubEvent.sub_event_number == se_data["number"]
                    )
                ).first()
                
                if not existing_se:
                    # Determine realistic status based on completion percentage
                    completion_pct = se_data["completion"]
                    if completion_pct >= 95:
                        status = MaintenanceEventStatus.Completed
                    elif completion_pct >= 70:
                        status = MaintenanceEventStatus.InProgress
                    elif completion_pct >= 30:
                        status = MaintenanceEventStatus.InProgress
                    else:
                        status = MaintenanceEventStatus.Planned
                    
                    # Calculate realistic start and end dates based on progression
                    start_offset = len(sub_events) * 2 + random.randint(0, 3)
                    duration = random.randint(5, 12)  # 5-12 days duration
                    
                    sub_event = MaintenanceSubEvent(
                        parent_event_id=event.id,
                        sub_event_number=se_data["number"],
                        title=se_data["title"],
                        description=f"Comprehensive {se_data['title'].lower()} activities including inspection, maintenance, and testing phases",
                        sub_type=se_data["sub_type"],
                        status=status,
                        planned_start_date=event.planned_start_date + timedelta(days=start_offset),
                        planned_end_date=event.planned_start_date + timedelta(days=start_offset + duration),
                        actual_start_date=event.actual_start_date + timedelta(days=start_offset) if status != MaintenanceEventStatus.Planned else None,
                        actual_end_date=event.actual_start_date + timedelta(days=start_offset + duration - 1) if status == MaintenanceEventStatus.Completed else None,
                        completion_percentage=completion_pct
                    )
                    session.add(sub_event)
                    sub_events.append(sub_event)
                else:
                    sub_events.append(existing_se)
            
            session.commit()
            print(f"✅ Created {len(sub_events)} sub-events")
            
            # 4. Create inspections (both planned and unplanned) with realistic distribution
            print("🔍 Creating inspections...")
            inspections = []
            
            departments = [
                RefineryDepartment.Operations,
                RefineryDepartment.Maintenance,
                RefineryDepartment.Engineering,
                RefineryDepartment.Safety
            ]
            
            # Create comprehensive inspections with realistic distribution
            inspection_counter = 1
            
            # Create planned inspections (60% of total)
            planned_count = 60  # Fixed number of planned inspections for consistency
            
            for i in range(planned_count):
                equipment = random.choice(equipment_list)
                inspection_number = f"INS-{equipment.tag}-{random.randint(1000, 9999)}"
                
                # Distribute inspections across main event and sub-events realistically
                # 40% to main event, 60% to sub-events
                target_event_id = None
                target_sub_event_id = None
                
                if len(sub_events) > 0 and random.random() < 0.6:
                    # Assign to sub-event based on equipment type and sub-event focus
                    if equipment.equipment_type in ["Pump"] and any("Pump" in se.title for se in sub_events):
                        target_sub_event_id = next((se.id for se in sub_events if "Pump" in se.title), sub_events[0].id)
                    elif equipment.equipment_type in ["Tower"] and any("Tower" in se.title for se in sub_events):
                        target_sub_event_id = next((se.id for se in sub_events if "Tower" in se.title), sub_events[1].id)
                    elif equipment.equipment_type in ["Heat Exchanger"] and any("Heat Exchanger" in se.title for se in sub_events):
                        target_sub_event_id = next((se.id for se in sub_events if "Heat Exchanger" in se.title), sub_events[2].id)
                    elif equipment.equipment_type in ["Tank"] and any("Tank" in se.title for se in sub_events):
                        target_sub_event_id = next((se.id for se in sub_events if "Tank" in se.title), sub_events[6].id)
                    elif equipment.equipment_type in ["Safety Valve", "Safety System"] and any("Safety" in se.title for se in sub_events):
                        target_sub_event_id = next((se.id for se in sub_events if "Safety" in se.title), sub_events[7].id)
                    elif equipment.equipment_type in ["Instrument"] and any("Instrumentation" in se.title for se in sub_events):
                        target_sub_event_id = next((se.id for se in sub_events if "Instrumentation" in se.title), sub_events[8].id)
                    else:
                        target_sub_event_id = random.choice(sub_events).id
                else:
                    target_event_id = event.id
                
                # Realistic status distribution for planned inspections
                status_weights = [
                    (InspectionStatus.Planned, 0.3),
                    (InspectionStatus.InProgress, 0.4),
                    (InspectionStatus.Completed, 0.2),
                    (InspectionStatus.Postponed, 0.1)
                ]
                status = random.choices(
                    [s for s, _ in status_weights],
                    weights=[w for _, w in status_weights]
                )[0]
                
                # Department based on equipment type and naming convention
                dept_mapping = {
                    "P-": RefineryDepartment.Operations,
                    "T-": RefineryDepartment.Operations, 
                    "E-": RefineryDepartment.Operations,
                    "C-": RefineryDepartment.Operations,
                    "F-": RefineryDepartment.Operations,
                    "R-": RefineryDepartment.Operations,
                    "V-": RefineryDepartment.Maintenance,
                    "TK-": RefineryDepartment.Maintenance,
                    "FIC-": RefineryDepartment.Engineering,
                    "PIC-": RefineryDepartment.Engineering,
                    "TIC-": RefineryDepartment.Engineering,
                    "LIC-": RefineryDepartment.Engineering,
                    "PSV-": RefineryDepartment.Safety,
                    "ESD-": RefineryDepartment.Safety,
                    "FD-": RefineryDepartment.Safety,
                    "MOV-": RefineryDepartment.Operations,
                    "BFW-": RefineryDepartment.Maintenance,
                    "CW-": RefineryDepartment.Maintenance
                }
                
                equipment_dept = None
                for prefix, dept in dept_mapping.items():
                    if equipment.tag.startswith(prefix):
                        equipment_dept = dept
                        break
                
                if equipment_dept is None:
                    equipment_dept = RefineryDepartment.Operations  # Default
                
                if random.random() < 0.8:  # 80% same department
                    requester_dept = equipment_dept
                else:  # 20% cross-department
                    requester_dept = random.choice(departments)
                
                # Calculate realistic dates
                base_start = event.actual_start_date + timedelta(days=random.randint(0, 15))
                duration = random.randint(1, 5)  # 1-5 days per inspection
                
                # Calculate realistic dates based on status
                planned_start_date = base_start
                planned_end_date = base_start + timedelta(days=duration)
                actual_start_date = None
                actual_end_date = None
                
                if status in [InspectionStatus.InProgress, InspectionStatus.Completed, InspectionStatus.Postponed]:
                    actual_start_date = planned_start_date + timedelta(days=random.randint(-1, 2))  # Slight variation from planned
                
                if status == InspectionStatus.Completed:
                    actual_end_date = actual_start_date + timedelta(days=random.randint(1, (planned_end_date - planned_start_date).days + 2))
                
                inspection = Inspection(
                    inspection_number=inspection_number,
                    title=f"Planned Inspection - {equipment.description}",
                    description=f"Comprehensive inspection of {equipment.description} ({equipment.equipment_type}). Scope: Visual inspection, functional testing, safety verification.",
                    maintenance_event_id=target_event_id,
                    maintenance_sub_event_id=target_sub_event_id,
                    equipment_id=equipment.id,
                    requesting_department=requester_dept,
                    status=status,
                    planned_start_date=planned_start_date,
                    planned_end_date=planned_end_date,
                    actual_start_date=actual_start_date,
                    actual_end_date=actual_end_date,
                    is_planned=True
                )
                session.add(inspection)
                inspections.append(inspection)
                inspection_counter += 1
            
            # Create comprehensive unplanned inspections (40% of total)
            unplanned_count = 40  # Fixed number of unplanned inspections for consistency
            unplanned_reasons = [
                "Emergency leak detected during routine patrol",
                "Abnormal vibration reported by operations",
                "Temperature deviation alarm triggered",
                "Pressure anomaly observed during shift handover",
                "Visual damage noticed during routine maintenance",
                "Safety concern raised by HSE department",
                "Equipment performance degradation detected",
                "Regulatory compliance verification required",
                "Process upset investigation",
                "Preventive measure after similar equipment failure",
                "Quality control inspection requirement",
                "Third-party inspection mandate"
            ]
            
            for i in range(unplanned_count):
                equipment = random.choice(equipment_list)
                inspection_number = f"UNP-{equipment.tag}-{random.randint(1000, 9999)}"
                
                # Unplanned inspections have different status distribution
                status_weights = [
                    (InspectionStatus.Completed, 0.5),  # Higher completion rate for urgent issues
                    (InspectionStatus.InProgress, 0.3),
                    (InspectionStatus.Planned, 0.1),
                    (InspectionStatus.Cancelled, 0.1)
                ]
                status = random.choices(
                    [s for s, _ in status_weights],
                    weights=[w for _, w in status_weights]
                )[0]
                
                # Assign to appropriate sub-event or main event
                target_sub_event_id = None
                if random.random() < 0.4:  # 40% assigned to sub-events
                    # Match equipment type to appropriate sub-event
                    matching_sub_events = [
                        se for se in sub_events 
                        if equipment.equipment_type.lower() in se.title.lower()
                    ]
                    if matching_sub_events:
                        target_sub_event_id = random.choice(matching_sub_events).id
                    else:
                        target_sub_event_id = random.choice(sub_events).id if sub_events else None
                
                # Department preference based on issue type and equipment
                equipment_dept_mapping = {
                    "P-": RefineryDepartment.Operations,
                    "T-": RefineryDepartment.Operations, 
                    "E-": RefineryDepartment.Operations,
                    "C-": RefineryDepartment.Operations,
                    "F-": RefineryDepartment.Operations,
                    "R-": RefineryDepartment.Operations,
                    "V-": RefineryDepartment.Maintenance,
                    "TK-": RefineryDepartment.Maintenance,
                    "FIC-": RefineryDepartment.Engineering,
                    "PIC-": RefineryDepartment.Engineering,
                    "TIC-": RefineryDepartment.Engineering,
                    "LIC-": RefineryDepartment.Engineering,
                    "PSV-": RefineryDepartment.Safety,
                    "ESD-": RefineryDepartment.Safety,
                    "FD-": RefineryDepartment.Safety,
                    "MOV-": RefineryDepartment.Operations,
                    "BFW-": RefineryDepartment.Maintenance,
                    "CW-": RefineryDepartment.Maintenance
                }
                
                equipment_dept = None
                for prefix, dept in equipment_dept_mapping.items():
                    if equipment.tag.startswith(prefix):
                        equipment_dept = dept
                        break
                
                if equipment_dept is None:
                    equipment_dept = RefineryDepartment.Operations  # Default
                
                departments_for_unplanned = [equipment_dept]
                if "safety" in unplanned_reasons[i % len(unplanned_reasons)].lower():
                    departments_for_unplanned.append(RefineryDepartment.Safety)
                if "quality" in unplanned_reasons[i % len(unplanned_reasons)].lower():
                    departments_for_unplanned.append(RefineryDepartment.Engineering)
                
                requesting_dept = random.choice(departments_for_unplanned)
                
                # Timeline for unplanned inspections (more urgent)
                days_offset = random.randint(1, 20)  # Spread throughout the event
                start_date = event.actual_start_date + timedelta(days=days_offset)
                duration = random.randint(1, 3)  # Shorter duration for unplanned
                end_date = start_date + timedelta(days=duration)
                
                actual_start_date = None
                actual_end_date = None
                if status in [InspectionStatus.InProgress, InspectionStatus.Completed]:
                    actual_start_date = start_date
                if status == InspectionStatus.Completed:
                    actual_end_date = start_date + timedelta(days=random.randint(1, duration + 1))
                
                unplanned_inspection = Inspection(
                    inspection_number=inspection_number,
                    title=f"Unplanned Inspection - {equipment.description}",
                    description=f"Emergency/unplanned inspection of {equipment.description} due to operational concerns. Immediate assessment required. Reason: {unplanned_reasons[i % len(unplanned_reasons)]}",
                    maintenance_event_id=event.id,
                    maintenance_sub_event_id=target_sub_event_id,
                    equipment_id=equipment.id,
                    requesting_department=requesting_dept,
                    status=status,
                    planned_start_date=start_date,
                    planned_end_date=end_date,
                    actual_start_date=actual_start_date,
                    actual_end_date=actual_end_date,
                    is_planned=False,
                    unplanned_reason=unplanned_reasons[i % len(unplanned_reasons)]
                )
                session.add(unplanned_inspection)
                inspections.append(unplanned_inspection)
            
            session.commit()
            print(f"✅ Created {len(inspections)} inspections")
            
            # 5. Create comprehensive daily reports with realistic findings
            print("📄 Creating daily reports...")
            daily_reports = []
            
            # Realistic findings and recommendations for different equipment types
            findings_by_equipment_type = {
                "Pump": [
                    "Slight vibration detected within acceptable limits",
                    "Normal wear on impeller observed",
                    "Bearing temperature within operational range",
                    "Minor seal leakage noted",
                    "Coupling alignment verified",
                    "Pump performance parameters nominal"
                ],
                "Tank": [
                    "External coating in good condition",
                    "Minor corrosion spots on bottom plate",
                    "Level indicator functioning properly",
                    "Manhole gaskets require replacement",
                    "Internal surfaces clean",
                    "Foundation settlement within tolerance"
                ],
                "Heat Exchanger": [
                    "Tube bundle condition satisfactory",
                    "Minor scaling on heat transfer surfaces",
                    "Gasket replacement recommended",
                    "Pressure drop within design limits",
                    "Shell integrity verified",
                    "Thermal performance acceptable"
                ],
                "Safety Valve": [
                    "Set pressure verification completed",
                    "Seat leakage test passed",
                    "Spring compression adequate",
                    "Body condition excellent",
                    "Discharge piping clear",
                    "Safety function verified"
                ],
                "Compressor": [
                    "Vibration analysis within limits",
                    "Oil analysis results satisfactory",
                    "Intercooler performance good",
                    "Safety systems functional",
                    "Capacity test passed",
                    "Control system responsive"
                ],
                "Tower": [
                    "Tray efficiency within specification",
                    "Internal structure integrity good",
                    "Insulation condition satisfactory",
                    "Manway gaskets inspected",
                    "Pressure relief systems functional",
                    "Process parameters stable"
                ],
                "Reactor": [
                    "Catalyst bed condition assessed",
                    "Temperature distribution uniform",
                    "Pressure vessel integrity confirmed",
                    "Safety interlocks operational",
                    "Heat removal adequate",
                    "Conversion efficiency acceptable"
                ],
                "Furnace": [
                    "Refractory condition good",
                    "Burner performance optimal",
                    "Tube metal temperature acceptable",
                    "Stack emissions within limits",
                    "Safety systems verified",
                    "Thermal efficiency satisfactory"
                ]
            }
            
            recommendations_by_equipment_type = {
                "Pump": [
                    "Schedule bearing replacement in next shutdown",
                    "Monitor vibration trends monthly",
                    "Replace mechanical seal during next maintenance",
                    "Verify coupling alignment quarterly",
                    "Update lubrication schedule"
                ],
                "Tank": [
                    "Schedule external painting next quarter",
                    "Monitor corrosion progression",
                    "Replace gaskets during next entry",
                    "Perform cathodic protection survey",
                    "Update inspection frequency"
                ],
                "Heat Exchanger": [
                    "Schedule cleaning during next shutdown",
                    "Monitor pressure drop trends",
                    "Consider tube bundle replacement",
                    "Upgrade gasket material",
                    "Optimize operating conditions"
                ],
                "Safety Valve": [
                    "Continue current testing frequency",
                    "Monitor for seat wear",
                    "Schedule overhaul in 18 months",
                    "Verify discharge line integrity",
                    "Update testing procedures"
                ],
                "Compressor": [
                    "Continue oil analysis program",
                    "Schedule vibration monitoring",
                    "Plan intercooler cleaning",
                    "Update maintenance intervals",
                    "Monitor performance degradation"
                ],
                "Tower": [
                    "Schedule tray inspection next shutdown",
                    "Monitor pressure drop trends",
                    "Plan insulation renewal",
                    "Update operating procedures",
                    "Consider efficiency improvements"
                ],
                "Reactor": [
                    "Monitor catalyst activity",
                    "Schedule catalyst replacement",
                    "Plan vessel internal inspection",
                    "Update safety procedures",
                    "Optimize reaction conditions"
                ],
                "Furnace": [
                    "Schedule refractory repair",
                    "Monitor tube thickness",
                    "Plan burner maintenance",
                    "Update efficiency monitoring",
                    "Consider upgrades for emissions"
                ]
            }
            
            for inspection in inspections:
                if inspection.status in [InspectionStatus.InProgress, InspectionStatus.Completed]:
                    # Determine number of daily reports based on inspection duration and status
                    if inspection.actual_start_date:
                        if inspection.status == InspectionStatus.Completed and inspection.actual_end_date:
                            # Completed inspections have reports for the full duration
                            duration = (inspection.actual_end_date - inspection.actual_start_date).days + 1
                            num_reports = min(duration, 5)  # Max 5 reports per inspection
                        else:
                            # In-progress inspections have partial reports
                            days_since_start = (date.today() - inspection.actual_start_date).days + 1
                            num_reports = min(max(1, days_since_start), 3)  # 1-3 reports
                    else:
                        num_reports = 1  # At least one report
                    
                    # Get equipment for context
                    equipment = next((eq for eq in equipment_list if eq.id == inspection.equipment_id), None)
                    equipment_type = equipment.equipment_type if equipment else "Equipment"
                    
                    # Get appropriate findings and recommendations
                    possible_findings = findings_by_equipment_type.get(equipment_type, findings_by_equipment_type["Pump"])
                    possible_recommendations = recommendations_by_equipment_type.get(equipment_type, recommendations_by_equipment_type["Pump"])
                    
                    for day in range(num_reports):
                        if inspection.actual_start_date:
                            report_date = inspection.actual_start_date + timedelta(days=day)
                        else:
                            report_date = inspection.planned_start_date + timedelta(days=day)
                        
                        # Only create reports for dates up to today
                        if report_date <= date.today():
                            # Realistic progress calculation
                            if inspection.status == InspectionStatus.Completed:
                                progress = min(100, 20 + (day + 1) * (80 / num_reports))
                            else:
                                progress = min(85, 15 + (day + 1) * (60 / num_reports))  # In-progress caps at 85%
                            
                            # Weather conditions with seasonal variation
                            weather_conditions = list(WeatherCondition)
                            if random.random() < 0.7:  # 70% good weather
                                weather = random.choice([WeatherCondition.Sunny, WeatherCondition.Cloudy])
                            else:
                                weather = random.choice(weather_conditions)
                            
                            # Temperature and wind based on weather
                            if weather in [WeatherCondition.Sunny, WeatherCondition.Cloudy]:
                                temperature = random.randint(22, 35)
                                wind_speed = random.randint(5, 15)
                            else:
                                temperature = random.randint(18, 28)
                                wind_speed = random.randint(10, 25)
                            
                            # Realistic findings (70% chance of findings)
                            issues_found = None
                            if random.random() < 0.7:
                                if random.random() < 0.8:  # 80% minor issues
                                    issues_found = random.choice(possible_findings)
                                else:  # 20% more significant findings
                                    issues_found = f"Significant finding: {random.choice(possible_findings).replace('Minor', 'Major').replace('Slight', 'Significant')}"
                            
                            # Recommendations (50% chance)
                            recommendations = None
                            if random.random() < 0.5:
                                recommendations = random.choice(possible_recommendations)
                            
                            # Inspector assignment with some consistency
                            inspector_teams = [
                                "John Smith, Sarah Johnson",
                                "Mike Wilson, Lisa Chen",
                                "David Brown, Emily Davis",
                                "Robert Miller, Amanda Taylor",
                                "James Garcia, Michelle Lee"
                            ]
                            inspector_names = inspector_teams[inspection.id % len(inspector_teams)]
                            
                            # Report status distribution
                            status_weights = [
                                (ReportStatus.Approved, 0.7),
                                (ReportStatus.Submitted, 0.2),
                                (ReportStatus.Draft, 0.1)
                            ]
                            report_status = random.choices(
                                [s for s, _ in status_weights],
                                weights=[w for _, w in status_weights]
                            )[0]
                            
                            daily_report = DailyReport(
                                inspection_id=inspection.id,
                                report_date=report_date,
                                description=f"Day {day+1} inspection activities for {inspection.title}. Equipment type: {equipment_type}. Focus: {inspection.description[:100]}... Progress: {progress:.1f}%. Weather: {weather.value}. {'Issues found: ' + issues_found if issues_found else 'No issues found.'}{'Recommendations: ' + recommendations if recommendations else ''}",
                                inspector_names=inspector_names
                            )
                            session.add(daily_report)
                            daily_reports.append(daily_report)
            
            session.commit()
            print(f"✅ Created {len(daily_reports)} daily reports")
            
            # 6. Print comprehensive summary
            print("\n" + "="*80)
            print("🎉 COMPREHENSIVE SEEDING COMPLETED SUCCESSFULLY!")
            print("="*80)
            print(f"📊 Event: {event.event_number} - {event.title}")
            print(f"📊 Status: {event.status.value}")
            print(f"📊 Equipment Items: {len(equipment_list)} (across all departments)")
            print(f"📊 Sub-Events: {len(sub_events)} (with varied completion rates)")
            print(f"📊 Inspections: {len(inspections)} (planned + unplanned)")
            print(f"📊 Daily Reports: {len(daily_reports)} (with realistic findings)")
            print("\n📊 ANALYTICS DATA BREAKDOWN:")
            print(f"   • Planned Inspections: {len([i for i in inspections if i.is_planned])}")
            print(f"   • Unplanned Inspections: {len([i for i in inspections if not i.is_planned])}")
            print(f"   • Completed Inspections: {len([i for i in inspections if i.status == InspectionStatus.Completed])}")
            print(f"   • In-Progress Inspections: {len([i for i in inspections if i.status == InspectionStatus.InProgress])}")
            print(f"   • Department Distribution:")
            for dept in [RefineryDepartment.Operations, RefineryDepartment.Maintenance, RefineryDepartment.Engineering, RefineryDepartment.Safety]:
                dept_count = len([i for i in inspections if i.requesting_department == dept])
                print(f"     - {dept.value}: {dept_count} inspections")
            print(f"   • Total Daily Reports: {len(daily_reports)}")
            print(f"   • Reports by Status: Approved: {len([r for r in daily_reports if hasattr(r, 'status') and r.status == ReportStatus.Approved])}, Draft: {len([r for r in daily_reports if hasattr(r, 'status') and r.status == ReportStatus.Draft])}")
            print("\n🔗 You can now view comprehensive analytics at:")
            print(f"   http://localhost:3001/maintenance-events/{event.id}?tab=analytics")
            print("\n✨ All analytics sections now have rich, realistic data for testing!")
            print("🎨 Ready for Phase 2: Unified Professional Dashboard Development")
            
        except Exception as e:
            print(f"❌ Error during seeding: {e}")
            session.rollback()
            raise


if __name__ == "__main__":
    seed_realistic_maintenance_event()