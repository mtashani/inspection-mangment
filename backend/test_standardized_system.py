#!/usr/bin/env python3
"""
Test Standardized RBAC System
Simple test to verify the system works correctly
"""

import sys
import asyncio
from pathlib import Path

# Add the app directory to Python path
sys.path.append(str(Path(__file__).parent))

from sqlmodel import Session
from app.database import engine
from app.domains.auth.services.permission_service import PermissionService
from app.domains.auth.services.auth_service import AuthService
from app.core.permissions import get_all_standardized_permissions


async def test_super_admin_login():
    """Test super admin login and permissions"""
    print("🔐 Testing super admin login...")
    
    # Test password verification
    password_hash = AuthService.get_password_hash("admin123")
    is_valid = AuthService.verify_password("admin123", password_hash)
    
    if not is_valid:
        print("   ❌ Password verification failed")
        return False
    
    print("   ✅ Password verification successful")
    
    # Test token creation
    token = AuthService.create_access_token(inspector_id=1)
    
    if not token:
        print("   ❌ Token creation failed")
        return False
    
    print("   ✅ Token creation successful")
    
    # Test token decoding
    decoded = AuthService.decode_token(token)
    
    if not decoded or decoded.get("sub") != "1":  # sub is stored as string
        print("   ❌ Token decoding failed")
        return False
    
    print("   ✅ Token decoding successful")
    return True


async def test_permission_system():
    """Test permission checking system"""
    print("🔍 Testing permission system...")
    
    with Session(engine) as session:
        # Test super admin permissions
        super_admin_id = 1
        
        # Test system_superadmin permission
        has_superadmin = await PermissionService.has_system_superadmin(
            session, super_admin_id
        )
        
        if not has_superadmin:
            print("   ❌ Super admin does not have system_superadmin permission")
            return False
        
        print("   ✅ Super admin has system_superadmin permission")
        
        # Test domain permissions
        test_permissions = [
            "mechanical_view",
            "ndt_edit", 
            "corrosion_approve",
            "system_hr_manage"
        ]
        
        for permission in test_permissions:
            has_permission = await PermissionService.check_inspector_permission(
                session, super_admin_id, permission
            )
            
            if not has_permission:
                print(f"   ❌ Super admin missing permission: {permission}")
                return False
        
        print(f"   ✅ Super admin has all tested permissions: {test_permissions}")
        
        # Test invalid permission
        has_invalid = await PermissionService.check_inspector_permission(
            session, super_admin_id, "invalid_permission"
        )
        
        if has_invalid:
            print("   ❌ System incorrectly granted invalid permission")
            return False
        
        print("   ✅ System correctly rejected invalid permission")
        return True


async def test_permission_validation():
    """Test permission validation functions"""
    print("🔍 Testing permission validation...")
    
    from app.core.permissions import validate_permission, get_all_standardized_permissions
    
    # Test valid permissions
    valid_permissions = ["system_superadmin", "mechanical_view", "ndt_approve"]
    
    for permission in valid_permissions:
        if not validate_permission(permission):
            print(f"   ❌ Valid permission rejected: {permission}")
            return False
    
    print(f"   ✅ All valid permissions accepted: {valid_permissions}")
    
    # Test invalid permissions
    invalid_permissions = ["invalid_perm", "old_psv_create", "random_permission"]
    
    for permission in invalid_permissions:
        if validate_permission(permission):
            print(f"   ❌ Invalid permission accepted: {permission}")
            return False
    
    print(f"   ✅ All invalid permissions rejected: {invalid_permissions}")
    
    # Test permission count
    all_permissions = get_all_standardized_permissions()
    
    if len(all_permissions) != 23:
        print(f"   ❌ Expected 23 permissions, got {len(all_permissions)}")
        return False
    
    print(f"   ✅ Correct number of standardized permissions: {len(all_permissions)}")
    return True


async def main():
    """Main test function"""
    print("🧪 TESTING STANDARDIZED RBAC SYSTEM")
    print("=" * 50)
    
    try:
        # Run all tests
        tests = [
            test_super_admin_login(),
            test_permission_system(),
            test_permission_validation()
        ]
        
        results = await asyncio.gather(*tests)
        
        if all(results):
            print("\n" + "🎉" * 15)
            print("✅ ALL TESTS PASSED!")
            print("🎉" * 15)
            print("\n📊 Test Results:")
            print("   ✅ Super admin login system working")
            print("   ✅ Permission checking system working")
            print("   ✅ Permission validation system working")
            print("\n🚀 Standardized RBAC system is fully functional!")
            print("=" * 50)
        else:
            print("\n❌ SOME TESTS FAILED!")
            print("Please check the errors above.")
            sys.exit(1)
            
    except Exception as e:
        print(f"❌ Error during testing: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)


if __name__ == "__main__":
    asyncio.run(main())