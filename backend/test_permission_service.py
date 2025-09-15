#!/usr/bin/env python3
"""
Test permission service directly
"""

import sys
from pathlib import Path
import asyncio

# Add the app directory to Python path
sys.path.append(str(Path(__file__).parent))

from sqlmodel import Session
from app.database import engine
from app.domains.inspector.models.inspector import Inspector
from app.domains.auth.services.permission_service import PermissionService
from app.domains.auth.services.auth_service import AuthService
from sqlmodel import select

async def test_permission_service():
    """Test permission service directly"""
    print("🧪 Testing Permission Service")
    print("=" * 50)
    
    # Get admin user
    with Session(engine) as session:
        admin_user = session.exec(
            select(Inspector).where(Inspector.username == "admin")
        ).first()
        
        if not admin_user:
            print("❌ Admin user not found!")
            return
            
        print(f"✅ Found admin user:")
        print(f"   ID: {admin_user.id}")
        print(f"   Username: {admin_user.username}")
        print(f"   Active: {admin_user.active}")
        print(f"   Can Login: {admin_user.can_login}")
        
        # Test permission service methods
        print(f"\n🔍 Testing PermissionService methods...")
        
        # Get inspector permissions
        try:
            permissions = await PermissionService.get_inspector_permissions(session, admin_user.id)
            print(f"✅ Inspector permissions ({len(permissions)}):")
            for i, perm in enumerate(sorted(permissions)):
                print(f"   {i+1}. {perm}")
                
            # Check specific admin:manage permission
            has_admin_manage = await PermissionService.has_permission(session, admin_user, "admin", "manage")
            print(f"\n🎯 Has 'admin:manage' permission: {'✅ YES' if has_admin_manage else '❌ NO'}")
            
            # Check if admin:manage is in the permission set
            admin_manage_in_set = "admin:manage" in permissions
            print(f"🎯 'admin:manage' in permission set: {'✅ YES' if admin_manage_in_set else '❌ NO'}")
            
            # Test other variations
            print(f"\n🧪 Testing permission variations:")
            test_perms = ["admin:manage", "admin:*", "*:manage", "*:*"]
            for perm in test_perms:
                resource, action = perm.split(":")
                has_perm = await PermissionService.has_permission(session, admin_user, resource, action)
                print(f"   {perm}: {'✅' if has_perm else '❌'}")
                
        except Exception as e:
            print(f"❌ Error testing permission service: {e}")
            import traceback
            traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(test_permission_service())