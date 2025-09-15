#!/usr/bin/env python3
"""
Check admin user token and permissions
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

def check_admin_token():
    """Check admin user token and permissions"""
    with Session(engine) as session:
        print("🔍 Checking Admin User Authentication & Permissions")
        print("=" * 60)
        
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
        print(f"   Active: {admin_user.active}")
        print(f"   Can Login: {admin_user.can_login}")
        
        # Get user's roles
        inspector_roles = session.exec(
            select(InspectorRole).where(InspectorRole.inspector_id == admin_user.id)
        ).all()
        
        print(f"\n🔑 User Roles ({len(inspector_roles)}):")
        for inspector_role in inspector_roles:
            role = session.get(Role, inspector_role.role_id)
            print(f"   • {role.name} (ID: {role.id})")
        
        # Test authentication
        print(f"\n🧪 Testing Authentication...")
        authenticated_user = AuthService.authenticate_inspector(session, "admin", "admin123")
        
        if authenticated_user:
            print("✅ Authentication successful!")
            
            # Create test token
            roles, permissions = AuthService.get_inspector_roles_and_permissions(session, admin_user.id)
            print(f"\n📋 User Roles from AuthService: {roles}")
            print(f"🔐 User Permissions: {len(permissions)} permissions")
            print(f"   Sample permissions: {list(permissions)[:10]}...")
            
            # Check if has admin:manage permission
            has_admin_manage = "admin:manage" in permissions
            print(f"🎯 Has 'admin:manage' permission: {'✅ YES' if has_admin_manage else '❌ NO'}")
            
            # Create a sample token
            token = AuthService.create_access_token(
                inspector_id=admin_user.id,
                roles=roles,
                permissions=permissions
            )
            
            print(f"\n🔑 Sample Token Created (first 50 chars): {token[:50]}...")
            
            # Decode the token to verify content
            payload = AuthService.decode_token(token)
            if payload:
                print(f"✅ Token decoded successfully:")
                print(f"   User ID: {payload.get('sub')}")
                print(f"   Roles: {payload.get('roles')}")
                print(f"   Permissions count: {len(payload.get('permissions', []))}")
                print(f"   Has admin:manage: {'admin:manage' in payload.get('permissions', [])}")
            else:
                print(f"❌ Failed to decode token")
                
        else:
            print("❌ Authentication failed!")

if __name__ == "__main__":
    check_admin_token()