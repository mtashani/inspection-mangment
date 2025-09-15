#!/usr/bin/env python3
"""
Check and update super admin user details
"""

import sys
from pathlib import Path

# Add the app directory to Python path
sys.path.append(str(Path(__file__).parent))

from sqlmodel import Session, select
from app.database import engine
from app.domains.inspector.models.inspector import Inspector
from app.domains.inspector.models.authorization import Role, Permission, RolePermission, InspectorRole
from app.domains.auth.services.auth_service import AuthService


def check_super_admin():
    """Check the current super admin user details"""
    with Session(engine) as session:
        # Get the admin user
        admin_user = session.exec(
            select(Inspector).where(Inspector.username == "admin")
        ).first()
        
        if not admin_user:
            print("❌ No admin user found!")
            return
        
        print("👤 Current Super Admin Details:")
        print("=" * 50)
        print(f"ID: {admin_user.id}")
        print(f"Username: {admin_user.username}")
        print(f"Email: {admin_user.email}")
        print(f"Full Name: {admin_user.get_full_name()}")
        print(f"Employee ID: {admin_user.employee_id}")
        print(f"Active: {admin_user.active}")
        print(f"Can Login: {admin_user.can_login}")
        print(f"Attendance Tracking: {'Enabled' if admin_user.attendance_tracking_enabled else 'Disabled'}")
        
        # Get roles
        user_roles = session.exec(
            select(Role)
            .join(InspectorRole, InspectorRole.role_id == Role.id)
            .where(InspectorRole.inspector_id == admin_user.id)
        ).all()
        
        print(f"\nRoles: {[role.name for role in user_roles]}")
        
        # Get permissions count
        permissions = session.exec(
            select(Permission)
            .join(RolePermission, RolePermission.permission_id == Permission.id)
            .join(InspectorRole, InspectorRole.role_id == RolePermission.role_id)
            .where(InspectorRole.inspector_id == admin_user.id)
        ).all()
        
        print(f"Total Permissions: {len(permissions)}")
        
        # Update user details if needed
        needs_update = False
        
        if admin_user.email == "admin@example.com":
            admin_user.email = "admin@inspection.com"
            needs_update = True
            
        if admin_user.attendance_tracking_enabled:
            admin_user.attendance_tracking_enabled = False
            needs_update = True
            
        if not admin_user.first_name or admin_user.first_name != "Super":
            admin_user.first_name = "Super"
            admin_user.last_name = "Admin"
            needs_update = True
            
        if needs_update:
            session.add(admin_user)
            session.commit()
            print("\n✅ Updated admin user details")
            
        print("\n🔐 Login Credentials:")
        print("Username: admin")
        print("Password: admin123")
        print("\n⚠️  Make sure to change the password after first login!")


if __name__ == "__main__":
    check_super_admin()