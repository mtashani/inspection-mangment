#!/usr/bin/env python3
"""
Create super admin user with RBAC system setup
This script sets up the database with roles, permissions, and a super admin user
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


def create_default_permissions():
    """Create default permissions for the system"""
    permissions = [
        # Admin permissions
        {"name": "admin_manage", "resource": "admin", "action": "manage", "description": "Full system administration", "display_label": "System Management"},
        {"name": "admin_manage_roles", "resource": "admin", "action": "manage_roles", "description": "Manage roles", "display_label": "Manage Roles"},
        {"name": "admin_manage_permissions", "resource": "admin", "action": "manage_permissions", "description": "Manage permissions", "display_label": "Manage Permissions"},
        {"name": "admin_view_roles", "resource": "admin", "action": "view_roles", "description": "View roles", "display_label": "View Roles"},
        {"name": "admin_view_permissions", "resource": "admin", "action": "view_permissions", "description": "View permissions", "display_label": "View Permissions"},
        {"name": "admin_manage_inspectors", "resource": "admin", "action": "manage_inspectors", "description": "Manage inspectors", "display_label": "Manage Inspectors"},
        
        # Inspector management permissions
        {"name": "inspector_create", "resource": "inspector", "action": "create", "description": "Create inspectors", "display_label": "Create Inspector"},
        {"name": "inspector_view", "resource": "inspector", "action": "view", "description": "View inspectors", "display_label": "View Inspector"},
        {"name": "inspector_edit_all", "resource": "inspector", "action": "edit_all", "description": "Edit all inspectors", "display_label": "Edit All Inspectors"},
        {"name": "inspector_delete_all", "resource": "inspector", "action": "delete_all", "description": "Delete all inspectors", "display_label": "Delete All Inspectors"},
        
        # PSV permissions
        {"name": "psv_create", "resource": "psv", "action": "create", "description": "Create PSV reports", "display_label": "Create PSV Report"},
        {"name": "psv_view", "resource": "psv", "action": "view", "description": "View PSV reports", "display_label": "View PSV Report"},
        {"name": "psv_edit_own", "resource": "psv", "action": "edit_own", "description": "Edit own PSV reports", "display_label": "Edit Own PSV Report"},
        {"name": "psv_edit_all", "resource": "psv", "action": "edit_all", "description": "Edit all PSV reports", "display_label": "Edit All PSV Reports"},
        {"name": "psv_approve", "resource": "psv", "action": "approve", "description": "Approve PSV reports", "display_label": "Approve PSV Report"},
        {"name": "psv_delete_own", "resource": "psv", "action": "delete_own", "description": "Delete own PSV reports", "display_label": "Delete Own PSV Report"},
        {"name": "psv_delete_all", "resource": "psv", "action": "delete_all", "description": "Delete all PSV reports", "display_label": "Delete All PSV Reports"},
        {"name": "psv_execute_test", "resource": "psv", "action": "execute_test", "description": "Execute PSV tests", "display_label": "Execute PSV Test"},
        
        # NDT permissions
        {"name": "ndt_create", "resource": "ndt", "action": "create", "description": "Create NDT reports", "display_label": "Create NDT Report"},
        {"name": "ndt_view", "resource": "ndt", "action": "view", "description": "View NDT reports", "display_label": "View NDT Report"},
        {"name": "ndt_edit_own", "resource": "ndt", "action": "edit_own", "description": "Edit own NDT reports", "display_label": "Edit Own NDT Report"},
        {"name": "ndt_edit_all", "resource": "ndt", "action": "edit_all", "description": "Edit all NDT reports", "display_label": "Edit All NDT Reports"},
        {"name": "ndt_approve", "resource": "ndt", "action": "approve", "description": "Approve NDT reports", "display_label": "Approve NDT Report"},
        {"name": "ndt_delete_own", "resource": "ndt", "action": "delete_own", "description": "Delete own NDT reports", "display_label": "Delete Own NDT Report"},
        {"name": "ndt_delete_all", "resource": "ndt", "action": "delete_all", "description": "Delete all NDT reports", "display_label": "Delete All NDT Reports"},
        
        # Mechanical permissions
        {"name": "mechanical_create", "resource": "mechanical", "action": "create", "description": "Create mechanical reports", "display_label": "Create Mechanical Report"},
        {"name": "mechanical_view", "resource": "mechanical", "action": "view", "description": "View mechanical reports", "display_label": "View Mechanical Report"},
        {"name": "mechanical_edit_own", "resource": "mechanical", "action": "edit_own", "description": "Edit own mechanical reports", "display_label": "Edit Own Mechanical Report"},
        {"name": "mechanical_edit_all", "resource": "mechanical", "action": "edit_all", "description": "Edit all mechanical reports", "display_label": "Edit All Mechanical Reports"},
        {"name": "mechanical_approve", "resource": "mechanical", "action": "approve", "description": "Approve mechanical reports", "display_label": "Approve Mechanical Report"},
        {"name": "mechanical_delete_own", "resource": "mechanical", "action": "delete_own", "description": "Delete own mechanical reports", "display_label": "Delete Own Mechanical Report"},
        {"name": "mechanical_delete_all", "resource": "mechanical", "action": "delete_all", "description": "Delete all mechanical reports", "display_label": "Delete All Mechanical Reports"},
        
        # Quality control permissions
        {"name": "quality_inspect", "resource": "quality", "action": "quality_inspect", "description": "Quality inspection", "display_label": "Quality Inspection"},
        {"name": "quality_approve", "resource": "quality", "action": "quality_approve", "description": "Quality approval", "display_label": "Quality Approval"},
        
        # Report permissions
        {"name": "report_create", "resource": "report", "action": "create", "description": "Create reports", "display_label": "Create Report"},
        {"name": "report_view", "resource": "report", "action": "view", "description": "View reports", "display_label": "View Report"},
        {"name": "report_approve", "resource": "report", "action": "approve", "description": "Approve reports", "display_label": "Approve Report"},
        {"name": "report_final_approve", "resource": "report", "action": "final_approve", "description": "Final report approval", "display_label": "Final Approval"},
        
        # Maintenance permissions
        {"name": "maintenance_create", "resource": "maintenance", "action": "create", "description": "Create maintenance events", "display_label": "Create Maintenance Event"},
        {"name": "maintenance_view", "resource": "maintenance", "action": "view", "description": "View maintenance events", "display_label": "View Maintenance Event"},
        {"name": "maintenance_edit_own", "resource": "maintenance", "action": "edit_own", "description": "Edit own maintenance events", "display_label": "Edit Own Maintenance Event"},
        {"name": "maintenance_edit_all", "resource": "maintenance", "action": "edit_all", "description": "Edit all maintenance events", "display_label": "Edit All Maintenance Events"},
        {"name": "maintenance_approve", "resource": "maintenance", "action": "approve", "description": "Approve maintenance events", "display_label": "Approve Maintenance Event"},
        {"name": "maintenance_delete_own", "resource": "maintenance", "action": "delete_own", "description": "Delete own maintenance events", "display_label": "Delete Own Maintenance Event"},
        {"name": "maintenance_delete_all", "resource": "maintenance", "action": "delete_all", "description": "Delete all maintenance events", "display_label": "Delete All Maintenance Events"},
    ]
    
    return permissions


def create_default_roles():
    """Create default roles for the system"""
    roles = [
        {"name": "Global Admin", "description": "Super administrator with full system access", "display_label": "Global Admin"},
        {"name": "System Admin", "description": "System administrator", "display_label": "System Admin"},
        {"name": "PSV Manager", "description": "PSV department manager", "display_label": "PSV Manager"},
        {"name": "NDT Manager", "description": "NDT department manager", "display_label": "NDT Manager"},
        {"name": "Mechanical Manager", "description": "Mechanical department manager", "display_label": "Mechanical Manager"},
        {"name": "QC Manager", "description": "Quality control manager", "display_label": "QC Manager"},
        {"name": "PSV Inspector", "description": "PSV inspector", "display_label": "PSV Inspector"},
        {"name": "NDT Inspector", "description": "NDT inspector", "display_label": "NDT Inspector"},
        {"name": "Mechanical Inspector", "description": "Mechanical inspector", "display_label": "Mechanical Inspector"},
        {"name": "QC Inspector", "description": "Quality control inspector", "display_label": "QC Inspector"},
        {"name": "PSV Test Operator", "description": "PSV test operator", "display_label": "PSV Test Operator"},
    ]
    
    return roles


def setup_rbac_system(session: Session):
    """Set up the complete RBAC system with roles and permissions"""
    print("🔧 Setting up RBAC system...")
    
    # Create permissions
    permissions_data = create_default_permissions()
    permission_objects = []
    
    for perm_data in permissions_data:
        permission = Permission(
            name=perm_data["name"],
            resource=perm_data["resource"],
            action=perm_data["action"],
            description=perm_data["description"],
            display_label=perm_data["display_label"],
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow()
        )
        session.add(permission)
        permission_objects.append(permission)
    
    session.commit()
    print(f"✅ Created {len(permission_objects)} permissions")
    
    # Create roles
    roles_data = create_default_roles()
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
        role_objects.append(role)
    
    session.commit()
    print(f"✅ Created {len(role_objects)} roles")
    
    # Get Global Admin role
    global_admin_role = session.exec(select(Role).where(Role.name == "Global Admin")).first()
    
    # Assign ALL permissions to Global Admin
    all_permissions = session.exec(select(Permission)).all()
    
    for permission in all_permissions:
        role_permission = RolePermission(
            role_id=global_admin_role.id,
            permission_id=permission.id,
            created_at=datetime.utcnow()
        )
        session.add(role_permission)
    
    session.commit()
    print(f"✅ Assigned {len(all_permissions)} permissions to Global Admin role")
    
    return global_admin_role


def create_super_admin_user(session: Session, global_admin_role: Role):
    """Create the super admin user"""
    print("👤 Creating super admin user...")
    
    # Hash the password
    password_hash = AuthService.get_password_hash("admin123")
    
    # Create the super admin inspector
    super_admin = Inspector(
        first_name="Super",
        last_name="Admin",
        employee_id="ADMIN001",
        national_id="0123456789",
        email="admin@inspection.com",
        phone="+98-912-345-6789",
        education_degree="Master of Science",
        education_field="Engineering Management",
        education_institute="Tehran University",
        graduation_year=2020,
        years_experience=10,
        previous_companies=["Industrial Inspection Co.", "Safety Systems Ltd."],
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
        attendance_tracking_enabled=False  # Attendance tracking disabled
    )
    
    session.add(super_admin)
    session.commit()
    session.refresh(super_admin)
    
    print(f"✅ Created super admin user with ID: {super_admin.id}")
    
    # Assign Global Admin role to the user
    inspector_role = InspectorRole(
        inspector_id=super_admin.id,
        role_id=global_admin_role.id,
        created_at=datetime.utcnow()
    )
    
    session.add(inspector_role)
    session.commit()
    
    print("✅ Assigned Global Admin role to super admin user")
    
    return super_admin


def main():
    """Main function to set up the database with super admin"""
    print("🚀 Setting up database with RBAC system and super admin user...")
    print("=" * 60)
    
    try:
        # Create database and tables
        print("📊 Creating database and tables...")
        create_db_and_tables()
        print("✅ Database and tables created successfully")
        
        # Set up RBAC system and create super admin
        with Session(engine) as session:
            # Check if super admin already exists
            existing_admin = session.exec(
                select(Inspector).where(Inspector.username == "admin")
            ).first()
            
            if existing_admin:
                print("⚠️  Super admin user already exists!")
                print(f"   Username: {existing_admin.username}")
                print(f"   Email: {existing_admin.email}")
                print(f"   ID: {existing_admin.id}")
                return
            
            # Set up RBAC system
            global_admin_role = setup_rbac_system(session)
            
            # Create super admin user
            super_admin = create_super_admin_user(session, global_admin_role)
            
            print("\n" + "=" * 60)
            print("🎉 SETUP COMPLETED SUCCESSFULLY!")
            print("=" * 60)
            print("📋 Super Admin User Details:")
            print(f"   Username: {super_admin.username}")
            print(f"   Password: admin123")
            print(f"   Email: {super_admin.email}")
            print(f"   Full Name: {super_admin.get_full_name()}")
            print(f"   Employee ID: {super_admin.employee_id}")
            print(f"   Attendance Tracking: {'Enabled' if super_admin.attendance_tracking_enabled else 'Disabled'}")
            print(f"   Role: Global Admin (Full System Access)")
            print("\n🔐 Login Credentials:")
            print(f"   Username: admin")
            print(f"   Password: admin123")
            print("\n⚠️  IMPORTANT: Change the default password after first login!")
            print("=" * 60)
            
    except Exception as e:
        print(f"❌ Error during setup: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)


if __name__ == "__main__":
    main()