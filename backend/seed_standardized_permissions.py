#!/usr/bin/env python3
"""
Standardized Permission System Seeding Script
This script sets up the database with standardized permissions, roles, and super admin user
"""

import asyncio
import sys
import os
from datetime import datetime
from pathlib import Path

# Add the app directory to Python path
sys.path.append(str(Path(__file__).parent))

from sqlmodel import Session, select
from app.database import engine, create_db_and_tables
from app.domains.inspector.models.inspector import Inspector
from app.domains.inspector.models.authorization import Role, Permission, RolePermission, InspectorRole
from app.domains.auth.services.auth_service import AuthService
from app.core.permissions import (
    PERMISSION_DEFINITIONS,
    get_all_standardized_permissions,
    get_permissions_by_category,
    get_permissions_by_domain
)


def create_standardized_permissions(session: Session):
    """Create the 23 standardized permissions"""
    print("🔧 Creating standardized permissions...")
    
    permission_objects = []
    standardized_permissions = get_all_standardized_permissions()
    
    for perm_name in standardized_permissions:
        perm_def = PERMISSION_DEFINITIONS[perm_name]
        
        permission = Permission(
            name=perm_def['name'],
            resource=perm_def['domain'],
            action=perm_def['name'].split('_')[-1],  # Extract action from name
            description=perm_def['description'],
            display_label=perm_def['display_name'],
            category=perm_def['category'],
            domain=perm_def['domain'],
            is_active=True,
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow()
        )
        session.add(permission)
        permission_objects.append(permission)
    
    session.commit()
    print(f"✅ Created {len(permission_objects)} standardized permissions")
    
    return permission_objects


def create_standardized_roles(session: Session):
    """Create standardized roles aligned with business needs"""
    print("🔧 Creating standardized roles...")
    
    roles_data = [
        {
            "name": "Super Admin",
            "description": "System super administrator with full access to all functions",
            "display_label": "Super Admin",
            "permissions": get_all_standardized_permissions()  # All permissions
        },
        {
            "name": "HR Manager", 
            "description": "Human resources manager with inspector and attendance management",
            "display_label": "HR Manager",
            "permissions": ["system_hr_manage"]
        },
        {
            "name": "Mechanical Manager",
            "description": "Mechanical department manager with full mechanical domain access",
            "display_label": "Mechanical Manager", 
            "permissions": ["mechanical_view", "mechanical_edit", "mechanical_approve"]
        },
        {
            "name": "Corrosion Manager",
            "description": "Corrosion department manager with full corrosion domain access",
            "display_label": "Corrosion Manager",
            "permissions": ["corrosion_view", "corrosion_edit", "corrosion_approve"]
        },
        {
            "name": "NDT Manager",
            "description": "NDT department manager with full NDT domain access", 
            "display_label": "NDT Manager",
            "permissions": ["ndt_view", "ndt_edit", "ndt_approve"]
        },
        {
            "name": "Electrical Manager",
            "description": "Electrical department manager with full electrical domain access",
            "display_label": "Electrical Manager",
            "permissions": ["electrical_view", "electrical_edit", "electrical_approve"]
        },
        {
            "name": "Instrumentation Manager",
            "description": "Instrumentation department manager with full instrumentation domain access",
            "display_label": "Instrumentation Manager", 
            "permissions": ["instrument_view", "instrument_edit", "instrument_approve"]
        },
        {
            "name": "Quality Manager",
            "description": "Quality control manager with full quality domain access",
            "display_label": "Quality Manager",
            "permissions": ["quality_view", "quality_edit", "quality_approve"]
        },
        {
            "name": "Maintenance Manager",
            "description": "Maintenance manager with full maintenance domain access",
            "display_label": "Maintenance Manager",
            "permissions": ["maintenance_view", "maintenance_edit", "maintenance_approve"]
        },
        {
            "name": "Mechanical Inspector",
            "description": "Mechanical inspector with view and edit access",
            "display_label": "Mechanical Inspector",
            "permissions": ["mechanical_view", "mechanical_edit"]
        },
        {
            "name": "Corrosion Inspector", 
            "description": "Corrosion inspector with view and edit access",
            "display_label": "Corrosion Inspector",
            "permissions": ["corrosion_view", "corrosion_edit"]
        },
        {
            "name": "NDT Inspector",
            "description": "NDT inspector with view and edit access",
            "display_label": "NDT Inspector", 
            "permissions": ["ndt_view", "ndt_edit"]
        },
        {
            "name": "Electrical Inspector",
            "description": "Electrical inspector with view and edit access",
            "display_label": "Electrical Inspector",
            "permissions": ["electrical_view", "electrical_edit"]
        },
        {
            "name": "Instrumentation Inspector",
            "description": "Instrumentation inspector with view and edit access",
            "display_label": "Instrumentation Inspector",
            "permissions": ["instrument_view", "instrument_edit"]
        },
        {
            "name": "Quality Inspector",
            "description": "Quality inspector with view and edit access", 
            "display_label": "Quality Inspector",
            "permissions": ["quality_view", "quality_edit"]
        },
        {
            "name": "Maintenance Inspector",
            "description": "Maintenance inspector with view and edit access",
            "display_label": "Maintenance Inspector",
            "permissions": ["maintenance_view", "maintenance_edit"]
        }
    ]
    
    role_objects = []
    
    for role_data in roles_data:
        role = Role(
            name=role_data["name"],
            description=role_data["description"],
            display_label=role_data["display_label"],
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow()
        )
        session.add(role)
        role_objects.append((role, role_data["permissions"]))
    
    session.commit()
    print(f"✅ Created {len(role_objects)} standardized roles")
    
    return role_objects


def assign_permissions_to_roles(session: Session, role_objects, permission_objects):
    """Assign permissions to roles"""
    print("🔧 Assigning permissions to roles...")
    
    # Create permission lookup
    permission_lookup = {perm.name: perm for perm in permission_objects}
    
    assignment_count = 0
    
    for role, permission_names in role_objects:
        for perm_name in permission_names:
            if perm_name in permission_lookup:
                role_permission = RolePermission(
                    role_id=role.id,
                    permission_id=permission_lookup[perm_name].id,
                    created_at=datetime.utcnow()
                )
                session.add(role_permission)
                assignment_count += 1
    
    session.commit()
    print(f"✅ Created {assignment_count} role-permission assignments")


def create_super_admin_user(session: Session):
    """Create the super admin user with system_superadmin permission"""
    print("👤 Creating super admin user...")
    
    # Hash the password
    password_hash = AuthService.get_password_hash("admin123")
    
    # Create the super admin inspector
    super_admin = Inspector(
        first_name="Super",
        last_name="Admin",
        employee_id="ADMIN001",
        national_id="0000000000",
        email="admin@inspection.com",
        phone="+98-912-000-0000",
        education_degree="Master of Engineering",
        education_field="System Administration",
        education_institute="Technical University",
        graduation_year=2020,
        years_experience=15,
        previous_companies=["System Administration Co."],
        active=True,
        username="admin",
        password_hash=password_hash,
        can_login=True,
        last_login=None,
        date_of_birth=None,
        birth_place="Tehran",
        profile_image_url=None,
        marital_status="Single",
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow(),
        base_hourly_rate=0.0,  # Super admin doesn't need payroll
        overtime_multiplier=1.0,
        night_shift_multiplier=1.0,
        on_call_multiplier=1.0,
        attendance_tracking_enabled=False  # Attendance tracking disabled for super admin
    )
    
    session.add(super_admin)
    session.commit()
    session.refresh(super_admin)
    
    print(f"✅ Created super admin user with ID: {super_admin.id}")
    
    # Get Super Admin role
    super_admin_role = session.exec(select(Role).where(Role.name == "Super Admin")).first()
    
    if super_admin_role:
        # Assign Super Admin role to the user
        inspector_role = InspectorRole(
            inspector_id=super_admin.id,
            role_id=super_admin_role.id,
            created_at=datetime.utcnow()
        )
        
        session.add(inspector_role)
        session.commit()
        
        print("✅ Assigned Super Admin role to super admin user")
    else:
        print("❌ Super Admin role not found!")
    
    return super_admin


def setup_standardized_rbac_system(session: Session):
    """Set up the complete standardized RBAC system"""
    print("🔧 Setting up standardized RBAC system...")
    
    # Create standardized permissions
    permission_objects = create_standardized_permissions(session)
    
    # Create standardized roles
    role_objects = create_standardized_roles(session)
    
    # Assign permissions to roles
    assign_permissions_to_roles(session, role_objects, permission_objects)
    
    # Create super admin user
    super_admin = create_super_admin_user(session)
    
    return super_admin


def reset_database():
    """Reset the database by deleting the SQLite file"""
    print("🗑️  Resetting database...")
    
    db_path = Path("backend/inspection_management.db")
    if db_path.exists():
        db_path.unlink()
        print("✅ Deleted existing database file")
    else:
        print("ℹ️  No existing database file found")


def main():
    """Main function to reset database and set up standardized RBAC system"""
    print("🚀 Setting up Standardized RBAC System...")
    print("=" * 70)
    
    try:
        # Reset database
        reset_database()
        
        # Create database and tables
        print("📊 Creating database and tables...")
        create_db_and_tables()
        print("✅ Database and tables created successfully")
        
        # Set up standardized RBAC system
        with Session(engine) as session:
            super_admin = setup_standardized_rbac_system(session)
            
            # Verify the setup
            total_permissions = session.exec(select(Permission)).all()
            total_roles = session.exec(select(Role)).all()
            total_role_permissions = session.exec(select(RolePermission)).all()
            
            print("\n" + "=" * 70)
            print("🎉 STANDARDIZED RBAC SETUP COMPLETED SUCCESSFULLY!")
            print("=" * 70)
            print("📊 System Statistics:")
            print(f"   Total Permissions: {len(total_permissions)}")
            print(f"   Total Roles: {len(total_roles)}")
            print(f"   Total Role-Permission Assignments: {len(total_role_permissions)}")
            print("\n📋 Super Admin User Details:")
            print(f"   Username: {super_admin.username}")
            print(f"   Password: admin123")
            print(f"   Email: {super_admin.email}")
            print(f"   Full Name: {super_admin.get_full_name()}")
            print(f"   Employee ID: {super_admin.employee_id}")
            print(f"   Role: Super Admin (All 23 Standardized Permissions)")
            print("\n🔐 Login Credentials:")
            print(f"   Username: admin")
            print(f"   Password: admin123")
            print("\n📝 Standardized Permissions Created:")
            
            # Group permissions by category
            system_perms = [p.name for p in total_permissions if p.resource in ['system', 'hr']]
            technical_perms = [p.name for p in total_permissions if p.resource not in ['system', 'hr']]
            
            print(f"   System Permissions ({len(system_perms)}): {', '.join(system_perms)}")
            print(f"   Technical Permissions ({len(technical_perms)}): {', '.join(technical_perms)}")
            
            print("\n⚠️  IMPORTANT: Change the default password after first login!")
            print("=" * 70)
            
    except Exception as e:
        print(f"❌ Error during setup: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)


if __name__ == "__main__":
    main()