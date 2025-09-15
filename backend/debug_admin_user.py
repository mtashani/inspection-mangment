#!/usr/bin/env python3
"""
Debug script to check admin user's roles and permissions
"""

import sys
from pathlib import Path

# Add the app directory to Python path
sys.path.append(str(Path(__file__).parent))

from sqlmodel import Session, select
from app.database import engine
from app.domains.inspector.models.inspector import Inspector
from app.domains.inspector.models.authorization import Role, Permission, RolePermission, InspectorRole


def check_admin_user():
    """Check the admin user's roles and permissions"""
    print("🔍 Checking admin user's roles and permissions...")
    print("=" * 60)
    
    with Session(engine) as session:
        # Find admin user
        admin_user = session.exec(
            select(Inspector).where(Inspector.username == "admin")
        ).first()
        
        if not admin_user:
            print("❌ Admin user not found!")
            return
            
        print(f"✅ Found admin user:")
        print(f"   ID: {admin_user.id}")
        print(f"   Username: {admin_user.username}")
        print(f"   Email: {admin_user.email}")
        print(f"   Full Name: {admin_user.get_full_name()}")
        print(f"   Active: {admin_user.active}")
        print(f"   Can Login: {admin_user.can_login}")
        print(f"   Last Login: {admin_user.last_login}")
        
        # Get user's roles
        inspector_roles = session.exec(
            select(InspectorRole).where(InspectorRole.inspector_id == admin_user.id)
        ).all()
        
        print(f"\n📋 User's Role Assignments ({len(inspector_roles)} total):")
        for inspector_role in inspector_roles:
            role = session.exec(select(Role).where(Role.id == inspector_role.role_id)).first()
            print(f"   - Role ID: {role.id}, Name: '{role.name}', Description: {role.description}")
            
        # Get all roles for reference
        all_roles = session.exec(select(Role)).all()
        print(f"\n📋 All Available Roles ({len(all_roles)} total):")
        for role in all_roles:
            print(f"   - ID: {role.id}, Name: '{role.name}', Description: {role.description}")
            
        # Check Global Admin role specifically
        global_admin_role = session.exec(select(Role).where(Role.name == "Global Admin")).first()
        if global_admin_role:
            print(f"\n🔍 Global Admin Role Details:")
            print(f"   ID: {global_admin_role.id}")
            print(f"   Name: '{global_admin_role.name}'")
            print(f"   Description: {global_admin_role.description}")
            
            # Check if admin user has this role
            has_global_admin = session.exec(
                select(InspectorRole).where(
                    InspectorRole.inspector_id == admin_user.id,
                    InspectorRole.role_id == global_admin_role.id
                )
            ).first()
            
            print(f"   Admin user has this role: {'✅ YES' if has_global_admin else '❌ NO'}")
            
            # Get permissions for this role
            role_permissions = session.exec(
                select(RolePermission).where(RolePermission.role_id == global_admin_role.id)
            ).all()
            
            print(f"   Permissions count: {len(role_permissions)}")
            
        else:
            print("❌ Global Admin role not found!")


if __name__ == "__main__":
    check_admin_user()