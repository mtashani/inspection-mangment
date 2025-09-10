#!/usr/bin/env python3
"""
Comprehensive Database Seeding Script
Creates all tables and seeds data for testing all model states
"""

import os
import sys
from datetime import date, datetime, timedelta
from sqlmodel import Session, select

# Add app directory to path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.database import engine, create_db_and_tables
from app.core.config import settings

# Import all models
from app.domains.equipment.models.equipment import Equipment
from app.domains.inspector.models.inspector import Inspector
from app.domains.auth.services.auth_service import AuthService
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
from app.domains.daily_report.models.enums import (
    ReportStatus, WeatherCondition, WorkType, SafetyRating
)


def seed_equipment():
    """Seed equipment data"""
    equipment_data = [
        {"tag": "P-101", "description": "Main Feed Pump", "unit": "Unit 100", "equipment_type": "Pump", "manufacturer": "Flowserve", "model": "API 610"},
        {"tag": "V-201", "description": "Pressure Vessel", "unit": "Unit 200", "equipment_type": "Vessel", "manufacturer": "Pressure Systems", "model": "PSV-500"},
        {"tag": "HX-301", "description": "Heat Exchanger", "unit": "Unit 300", "equipment_type": "Heat Exchanger", "manufacturer": "Alfa Laval", "model": "AlfaRex"},
        {"tag": "C-401", "description": "Compressor", "unit": "Unit 400", "equipment_type": "Compressor", "manufacturer": "Siemens", "model": "STC-SV"},
        {"tag": "T-501", "description": "Storage Tank", "unit": "Unit 500", "equipment_type": "Tank", "manufacturer": "TankCorp", "model": "TC-1000"},
        {"tag": "E-601", "description": "Electric Motor", "unit": "Unit 600", "equipment_type": "Motor", "manufacturer": "ABB", "model": "M3BP"},
        {"tag": "F-701", "description": "Furnace", "unit": "Unit 700", "equipment_type": "Furnace", "manufacturer": "Honeywell", "model": "UOP-2000"},
        {"tag": "R-801", "description": "Reactor", "unit": "Unit 800", "equipment_type": "Reactor", "manufacturer": "KBR", "model": "KBR-R300"}
    ]
    
    equipment_list = []
    for i, eq_data in enumerate(equipment_data, 1):
        equipment = Equipment(
            id=i,
            tag=eq_data["tag"],
            description=eq_data["description"],
            unit=eq_data["unit"],
            equipment_type=eq_data["equipment_type"],
            installation_date=date(2020, 1, 1) + timedelta(days=i*30),
            created_at=datetime.now(),
            updated_at=datetime.now()
        )
        equipment_list.append(equipment)
    
    return equipment_list


def seed_inspectors():
    """Seed inspector data including admin user"""
    inspectors_data = [
        {
            "name": "Administrator",
            "employee_id": "admin",
            "email": "admin@inspection.com",
            "username": "admin",
            "password": "admin",
            "inspector_type": "general",
            "years_experience": 10
        },
        {
            "name": "احمد رضایی",
            "employee_id": "INS001",
            "email": "ahmad.rezaei@inspection.com",
            "username": "ahmad.rezaei",
            "password": "password123",
            "inspector_type": "mechanical",
            "years_experience": 8
        },
        {
            "name": "محمد احمدی", 
            "employee_id": "INS002",
            "email": "mohammad.ahmadi@inspection.com",
            "username": "mohammad.ahmadi",
            "password": "password123",
            "inspector_type": "electrical",
            "years_experience": 6
        },
        {
            "name": "علی محمدی",
            "employee_id": "INS003", 
            "email": "ali.mohammadi@inspection.com",
            "username": "ali.mohammadi",
            "password": "password123",
            "inspector_type": "instrumentation",
            "years_experience": 5
        },
        {
            "name": "حسن کریمی",
            "employee_id": "INS004",
            "email": "hassan.karimi@inspection.com",
            "username": "hassan.karimi", 
            "password": "password123",
            "inspector_type": "ndt",
            "years_experience": 12
        },
        {
            "name": "رضا موسوی",
            "employee_id": "INS005",
            "email": "reza.mousavi@inspection.com",
            "username": "reza.mousavi",
            "password": "password123",
            "inspector_type": "general",
            "years_experience": 7
        }
    ]
    
    inspectors_list = []
    for i, inspector_data in enumerate(inspectors_data, 1):
        # Hash password
        password_hash = AuthService.get_password_hash(inspector_data["password"])
        
        inspector = Inspector(
            id=i,
            name=inspector_data["name"],
            employee_id=inspector_data["employee_id"],
            email=inspector_data["email"],
            username=inspector_data["username"],
            password_hash=password_hash,
            inspector_type=inspector_data["inspector_type"],
            years_experience=inspector_data["years_experience"],
            can_login=True,
            active=True,
            available=True,
            created_at=datetime.now(),
            updated_at=datetime.now()
        )
        inspectors_list.append(inspector)
    
    return inspectors_list


def main():
    """Main seeding function"""
    print("🌱 Starting database seeding...")
    
    # Create all tables
    print("📋 Creating database tables...")
    create_db_and_tables()
    
    with Session(engine) as session:
        print("👥 Seeding inspectors...")
        inspectors = seed_inspectors()
        for inspector in inspectors:
            session.add(inspector)
        
        print("🔧 Seeding equipment...")
        equipment_list = seed_equipment()
        for equipment in equipment_list:
            session.add(equipment)
        
        # Commit base data
        session.commit()
        print("✅ Base data seeded successfully!")
        
        print(f"📊 Seeded:")
        print(f"  - {len(inspectors)} inspectors (including admin)")
        print(f"  - {len(equipment_list)} equipment items")
        
        print("🔑 Admin Login Credentials:")
        print("  Username: admin")
        print("  Password: admin")


if __name__ == "__main__":
    main()