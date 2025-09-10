#!/usr/bin/env python3
"""
Database reset and initialization script
Cleans the database, creates an admin inspector, and adds sample equipment
"""

import os
import sys
from datetime import date, datetime
from sqlmodel import Session, select, SQLModel

# Add app directory to path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.database import engine, create_db_and_tables
from app.core.config import settings

# Import models
from app.domains.equipment.models.equipment import Equipment
from app.domains.inspector.models.inspector import Inspector
from app.domains.inspector.models.authorization import Role, Permission, InspectorRole, RolePermission
from app.domains.inspector.models.enums import InspectorType, InspectorCertification, CertificationLevel
from app.domains.maintenance.models.event import MaintenanceEvent, MaintenanceSubEvent
# Removed incorrect import: from app.domains.maintenance.models.inspection_plan import InspectionPlan
from app.domains.inspection.models.inspection import Inspection
from app.domains.inspection.models.inspection_team import InspectionTeam
from app.domains.auth.services.auth_service import AuthService

# Hash function for password
from app.domains.auth.services.auth_service import AuthService

def reset_database():
    """Drop all tables and recreate them"""
    print("Dropping all tables...")
    SQLModel.metadata.drop_all(engine)
    
    print("Creating new tables...")
    create_db_and_tables()

def create_admin_inspector(session):
    """Create admin inspector with all permissions"""
    print("Creating admin inspector...")
    
    # Create admin inspector
    admin_inspector = Inspector(
        first_name="Admin",
        last_name="User",
        employee_id="ADMIN-001",
        national_id="1234567890",
        inspector_type=InspectorType.General,
        email="admin@example.com",
        phone="+989123456789",
        department="Management",
        education_degree="Masters",
        education_field="Engineering",
        education_institute="University",
        graduation_year=2015,
        years_experience=10,
        specialties=["Mechanical", "Pipeline", "Pressure Vessel"],
        previous_companies=["IOOC", "NIOC"],
        username="admin",
        password_hash=AuthService.get_password_hash("admin"),
        can_login=True,
        active=True,
        available=True,
        profile_image_url=None,
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow()
    )
    
    session.add(admin_inspector)
    session.commit()
    session.refresh(admin_inspector)
    
    # Create admin role if it doesn't exist
    admin_role = session.exec(select(Role).where(Role.name == "admin")).first()
    if not admin_role:
        admin_role = Role(
            name="admin",
            description="Administrator with full access",
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow()
        )
        session.add(admin_role)
        session.commit()
        session.refresh(admin_role)
    
    # Create basic permissions
    permissions = []
    resources = ["inspector", "equipment", "inspection", "maintenance", "report", "notification", "psv"]
    actions = ["create", "read", "update", "delete", "list", "approve", "manage"]
    
    for resource in resources:
        for action in actions:
            permission = session.exec(
                select(Permission).where(
                    Permission.resource == resource,
                    Permission.action == action
                )
            ).first()
            
            if not permission:
                permission = Permission(
                    name=f"{action}_{resource}",
                    resource=resource,
                    action=action,
                    description=f"Can {action} {resource}",
                    created_at=datetime.utcnow(),
                    updated_at=datetime.utcnow()
                )
                session.add(permission)
                permissions.append(permission)
    
    session.commit()
    
    # Fetch all permissions
    all_permissions = session.exec(select(Permission)).all()
    
    # Assign all permissions to admin role
    for permission in all_permissions:
        role_permission = session.exec(
            select(RolePermission).where(
                RolePermission.role_id == admin_role.id,
                RolePermission.permission_id == permission.id
            )
        ).first()
        
        if not role_permission:
            role_permission = RolePermission(
                role_id=admin_role.id,
                permission_id=permission.id,
                created_at=datetime.utcnow()
            )
            session.add(role_permission)
    
    session.commit()
    
    # Assign admin role to admin inspector
    inspector_role = session.exec(
        select(InspectorRole).where(
            InspectorRole.inspector_id == admin_inspector.id,
            InspectorRole.role_id == admin_role.id
        )
    ).first()
    
    if not inspector_role:
        inspector_role = InspectorRole(
            inspector_id=admin_inspector.id,
            role_id=admin_role.id,
            created_at=datetime.utcnow()
        )
        session.add(inspector_role)
    
    session.commit()
    
    print(f"Admin inspector created with ID: {admin_inspector.id}")
    return admin_inspector

def create_equipment(session):
    """Create sample equipment records"""
    print("Creating sample equipment...")
    
    equipment_data = [
        {
            "tag": "V-101",
            "description": "Crude Oil Separator Vessel",
            "unit": "Crude Processing Unit",
            "train": "Train A",
            "equipment_type": "Pressure Vessel",
            "installation_date": date(2010, 5, 15),
            "operating_pressure": 75.5,
            "operating_temperature": 350.0,
            "material": "Carbon Steel",
            "inspection_interval_months": 24,
            "p_and_id": "CPU-PID-101",
            "properties": {
                "shell_thickness": "25mm",
                "diameter": "3.5m",
                "length": "12m",
                "nozzles": 8
            }
        },
        {
            "tag": "P-201",
            "description": "Crude Oil Transfer Pump",
            "unit": "Crude Processing Unit",
            "train": "Train A",
            "equipment_type": "Pump",
            "installation_date": date(2012, 8, 20),
            "operating_pressure": 85.0,
            "operating_temperature": 120.0,
            "material": "Stainless Steel",
            "inspection_interval_months": 12,
            "p_and_id": "CPU-PID-201",
            "properties": {
                "type": "Centrifugal",
                "capacity": "350 m3/h",
                "head": "95m",
                "power": "250 kW"
            }
        },
        {
            "tag": "E-301",
            "description": "Crude Oil Preheater",
            "unit": "Crude Processing Unit",
            "train": "Train B",
            "equipment_type": "Heat Exchanger",
            "installation_date": date(2010, 5, 15),
            "operating_pressure": 65.0,
            "operating_temperature": 280.0,
            "material": "Carbon Steel/SS Tubes",
            "inspection_interval_months": 36,
            "p_and_id": "CPU-PID-301",
            "properties": {
                "type": "Shell & Tube",
                "heat_transfer_area": "450 m2",
                "tubes": 1200,
                "passes": 4
            }
        },
        {
            "tag": "F-401",
            "description": "Atmospheric Distillation Column",
            "unit": "Distillation Unit",
            "train": "Train A",
            "equipment_type": "Column",
            "installation_date": date(2008, 3, 10),
            "operating_pressure": 2.5,
            "operating_temperature": 370.0,
            "material": "Carbon Steel",
            "inspection_interval_months": 48,
            "p_and_id": "DU-PID-401",
            "properties": {
                "diameter": "5.5m",
                "height": "45m",
                "trays": 35,
                "tray_type": "Valve"
            }
        },
        {
            "tag": "T-501",
            "description": "Naphtha Storage Tank",
            "unit": "Storage Area",
            "train": None,
            "equipment_type": "Tank",
            "installation_date": date(2009, 11, 25),
            "operating_pressure": 1.2,
            "operating_temperature": 30.0,
            "material": "Carbon Steel",
            "inspection_interval_months": 60,
            "p_and_id": "SA-PID-501",
            "properties": {
                "type": "Fixed Roof",
                "capacity": "10000 m3",
                "diameter": "25m",
                "height": "20m"
            }
        },
        {
            "tag": "C-601",
            "description": "Air Compressor",
            "unit": "Utility Unit",
            "train": "Train C",
            "equipment_type": "Compressor",
            "installation_date": date(2015, 7, 5),
            "operating_pressure": 12.0,
            "operating_temperature": 120.0,
            "material": "Cast Iron",
            "inspection_interval_months": 24,
            "p_and_id": "UU-PID-601",
            "properties": {
                "type": "Reciprocating",
                "capacity": "1500 Nm3/h",
                "power": "350 kW",
                "stages": 3
            }
        },
        {
            "tag": "PI-701",
            "description": "Transfer Pipeline",
            "unit": "Piping Network",
            "train": None,
            "equipment_type": "Pipeline",
            "installation_date": date(2010, 5, 15),
            "operating_pressure": 80.0,
            "operating_temperature": 65.0,
            "material": "Carbon Steel",
            "inspection_interval_months": 36,
            "p_and_id": "PN-PID-701",
            "properties": {
                "diameter": "24 inch",
                "length": "1.5 km",
                "insulation": "Mineral Wool",
                "thickness": "12.7 mm"
            }
        },
        {
            "tag": "PSV-801",
            "description": "Main Vessel Relief Valve",
            "unit": "Crude Processing Unit",
            "train": "Train A",
            "equipment_type": "Pressure Safety Valve",
            "installation_date": date(2010, 5, 15),
            "operating_pressure": 85.0,
            "operating_temperature": 350.0,
            "material": "Stainless Steel",
            "inspection_interval_months": 12,
            "p_and_id": "CPU-PID-801",
            "properties": {
                "set_pressure": "90 bar",
                "capacity": "50 ton/h",
                "inlet_size": "4 inch",
                "outlet_size": "6 inch"
            }
        }
    ]
    
    equipment_objects = []
    for data in equipment_data:
        equipment = Equipment(**data)
        session.add(equipment)
        equipment_objects.append(equipment)
    
    session.commit()
    
    print(f"Created {len(equipment_objects)} equipment records")
    return equipment_objects

def main():
    """Main function to reset and initialize the database"""
    print("Starting database reset and initialization...")
    
    # Reset database
    reset_database()
    
    # Create session
    with Session(engine) as session:
        # Create admin inspector
        admin = create_admin_inspector(session)
        
        # Create sample equipment
        equipment = create_equipment(session)
    
    print("Database reset and initialization completed successfully!")
    print("\nAdmin login credentials:")
    print("Username: admin")
    print("Password: admin")

if __name__ == "__main__":
    main()