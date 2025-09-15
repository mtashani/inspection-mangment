#!/usr/bin/env python3
"""
Verify RBAC system setup and create sample inspector users
"""

import sys
from pathlib import Path
from datetime import datetime

# Add the app directory to Python path
sys.path.append(str(Path(__file__).parent))

from sqlmodel import Session, select
from app.database import engine
from app.domains.inspector.models.inspector import Inspector
from app.domains.inspector.models.authorization import Role, Permission, RolePermission, InspectorRole
from app.domains.auth.services.auth_service import AuthService


def verify_rbac_system():
    """Verify the RBAC system setup"""
    with Session(engine) as session:
        print("🔍 RBAC System Verification")
        print("=" * 50)
        
        # Check roles
        roles = session.exec(select(Role)).all()
        print(f"📋 Total Roles: {len(roles)}")
        for role in roles:
            print(f"   • {role.name} ({role.display_label})")
        
        # Check permissions
        permissions = session.exec(select(Permission)).all()
        print(f"\n🔐 Total Permissions: {len(permissions)}")
        
        # Group permissions by resource
        resources = {}
        for perm in permissions:
            if perm.resource not in resources:
                resources[perm.resource] = []
            resources[perm.resource].append(perm.action)
        
        for resource, actions in resources.items():
            print(f"   • {resource}: {', '.join(actions)}")
        
        # Check Global Admin role permissions
        global_admin = session.exec(select(Role).where(Role.name == "Global Admin")).first()
        if global_admin:
            admin_perms = session.exec(
                select(Permission)
                .join(RolePermission, RolePermission.permission_id == Permission.id)
                .where(RolePermission.role_id == global_admin.id)
            ).all()
            print(f"\n👑 Global Admin has {len(admin_perms)} permissions")
        
        # Check admin user
        admin_user = session.exec(select(Inspector).where(Inspector.username == "admin")).first()
        if admin_user:
            print(f"\n👤 Super Admin User:")
            print(f"   • Username: {admin_user.username}")
            print(f"   • Email: {admin_user.email}")
            print(f"   • Full Name: {admin_user.get_full_name()}")
            print(f"   • Employee ID: {admin_user.employee_id}")
            print(f"   • Attendance Tracking: {'Enabled' if admin_user.attendance_tracking_enabled else 'Disabled'}")
            print(f"   • Can Login: {'Yes' if admin_user.can_login else 'No'}")
            print(f"   • Active: {'Yes' if admin_user.active else 'No'}")


def create_sample_inspectors():
    """Create sample inspector users for testing"""
    with Session(engine) as session:
        print("\n👥 Creating Sample Inspector Users...")
        print("=" * 50)
        
        # Sample inspectors data
        sample_inspectors = [
            {
                "username": "psv_inspector",
                "password": "psv123",
                "first_name": "Ahmad",
                "last_name": "Moradi",
                "employee_id": "PSV001",
                "email": "ahmad.moradi@inspection.com",
                "role": "PSV Inspector",
                "attendance_enabled": True
            },
            {
                "username": "ndt_inspector",
                "password": "ndt123",
                "first_name": "Sara",
                "last_name": "Ahmadi",
                "employee_id": "NDT001",
                "email": "sara.ahmadi@inspection.com",
                "role": "NDT Inspector",
                "attendance_enabled": True
            },
            {
                "username": "mech_manager",
                "password": "mech123",
                "first_name": "Ali",
                "last_name": "Rezaei",
                "employee_id": "MGR001",
                "email": "ali.rezaei@inspection.com",
                "role": "Mechanical Manager",
                "attendance_enabled": False
            }
        ]
        
        for inspector_data in sample_inspectors:
            # Check if inspector already exists
            existing = session.exec(
                select(Inspector).where(Inspector.username == inspector_data["username"])
            ).first()
            
            if existing:
                print(f"   ⚠️  {inspector_data['username']} already exists, skipping...")
                continue
            
            # Create inspector
            password_hash = AuthService.get_password_hash(inspector_data["password"])
            
            inspector = Inspector(
                first_name=inspector_data["first_name"],
                last_name=inspector_data["last_name"],
                employee_id=inspector_data["employee_id"],
                national_id=f"99{inspector_data['employee_id'].replace('PSV', '1').replace('NDT', '2').replace('MGR', '3')}789",
                email=inspector_data["email"],
                phone="+98-912-123-4567",
                years_experience=5,
                active=True,
                username=inspector_data["username"],
                password_hash=password_hash,
                can_login=True,
                attendance_tracking_enabled=inspector_data["attendance_enabled"],
                created_at=datetime.utcnow(),
                updated_at=datetime.utcnow()
            )
            
            session.add(inspector)
            session.commit()
            session.refresh(inspector)
            
            # Assign role
            role = session.exec(select(Role).where(Role.name == inspector_data["role"])).first()
            if role:
                inspector_role = InspectorRole(
                    inspector_id=inspector.id,
                    role_id=role.id,
                    created_at=datetime.utcnow()
                )
                session.add(inspector_role)
                session.commit()
                
                print(f"   ✅ Created {inspector.username} ({inspector.get_full_name()}) - {inspector_data['role']}")
            else:
                print(f"   ❌ Role '{inspector_data['role']}' not found for {inspector.username}")


def print_login_credentials():
    """Print all login credentials for testing"""
    print("\n🔐 Login Credentials for Testing:")
    print("=" * 50)
    print("Super Admin:")
    print("   Username: admin")
    print("   Password: admin123")
    print("   Permissions: Full System Access")
    print()
    
    print("Sample Users:")
    credentials = [
        ("psv_inspector", "psv123", "PSV Inspector - Can create/edit PSV reports"),
        ("ndt_inspector", "ndt123", "NDT Inspector - Can create/edit NDT reports"),
        ("mech_manager", "mech123", "Mechanical Manager - Can manage mechanical dept")
    ]
    
    for username, password, description in credentials:
        print(f"   Username: {username}")
        print(f"   Password: {password}")
        print(f"   Role: {description}")
        print()


def main():
    """Main function"""
    print("🚀 RBAC System Verification and Sample Data Creation")
    print("=" * 60)
    
    verify_rbac_system()
    create_sample_inspectors()
    print_login_credentials()
    
    print("✅ RBAC System Setup Complete!")
    print("=" * 60)


if __name__ == "__main__":
    main()