#!/usr/bin/env python3
"""
Validate Standardized RBAC System
This script validates that the standardized RBAC system is working correctly
"""

import sys
import asyncio
from pathlib import Path

# Add the app directory to Python path
sys.path.append(str(Path(__file__).parent))

from sqlmodel import Session, select
from app.database import engine
from app.domains.inspector.models.inspector import Inspector
from app.domains.inspector.models.authorization import Role, Permission, RolePermission, InspectorRole
from app.domains.auth.services.permission_service import PermissionService
from app.core.permissions import get_all_standardized_permissions, PERMISSION_DEFINITIONS


async def validate_permissions():
    """Validate that all standardized permissions exist in database"""
    print("🔍 Validating standardized permissions...")
    
    with Session(engine) as session:
        # Get all permissions from database
        db_permissions = session.exec(select(Permission)).all()
        db_permission_names = {perm.name for perm in db_permissions}
        
        # Get standardized permissions
        standardized_permissions = set(get_all_standardized_permissions())
        
        print(f"   Database permissions: {len(db_permission_names)}")
        print(f"   Standardized permissions: {len(standardized_permissions)}")
        
        # Check if all standardized permissions exist
        missing_permissions = standardized_permissions - db_permission_names
        extra_permissions = db_permission_names - standardized_permissions
        
        if missing_permissions:
            print(f"   ❌ Missing permissions: {missing_permissions}")
            return False
        
        if extra_permissions:
            print(f"   ⚠️  Extra permissions (not standardized): {extra_permissions}")
        
        # Validate permission structure
        for perm in db_permissions:
            if perm.name in PERMISSION_DEFINITIONS:
                expected = PERMISSION_DEFINITIONS[perm.name]
                if (perm.category != expected['category'] or 
                    perm.domain != expected['domain']):
                    print(f"   ❌ Permission {perm.name} has incorrect metadata")
                    return False
        
        print("   ✅ All standardized permissions validated successfully")
        return True


async def validate_super_admin():
    """Validate super admin user and permissions"""
    print("🔍 Validating super admin user...")
    
    with Session(engine) as session:
        # Find super admin user
        super_admin = session.exec(
            select(Inspector).where(Inspector.username == "admin")
        ).first()
        
        if not super_admin:
            print("   ❌ Super admin user not found")
            return False
        
        print(f"   ✅ Super admin user found: {super_admin.get_full_name()}")
        
        # Check if super admin has system_superadmin permission
        has_superadmin = await PermissionService.has_system_superadmin(
            session, super_admin.id
        )
        
        if not has_superadmin:
            print("   ❌ Super admin does not have system_superadmin permission")
            return False
        
        # Get all permissions for super admin
        admin_permissions = await PermissionService.get_inspector_permissions(
            session, super_admin.id
        )
        
        standardized_permissions = get_all_standardized_permissions()
        
        if set(admin_permissions) != set(standardized_permissions):
            missing = set(standardized_permissions) - set(admin_permissions)
            print(f"   ❌ Super admin missing permissions: {missing}")
            return False
        
        print(f"   ✅ Super admin has all {len(admin_permissions)} standardized permissions")
        return True


async def validate_roles():
    """Validate roles and their permission assignments"""
    print("🔍 Validating roles...")
    
    with Session(engine) as session:
        roles = session.exec(select(Role)).all()
        
        print(f"   Found {len(roles)} roles")
        
        # Check Super Admin role specifically
        super_admin_role = session.exec(
            select(Role).where(Role.name == "Super Admin")
        ).first()
        
        if not super_admin_role:
            print("   ❌ Super Admin role not found")
            return False
        
        # Check Super Admin role permissions
        super_admin_permissions = session.exec(
            select(Permission)
            .join(RolePermission)
            .where(RolePermission.role_id == super_admin_role.id)
        ).all()
        
        standardized_permissions = get_all_standardized_permissions()
        super_admin_perm_names = {perm.name for perm in super_admin_permissions}
        
        if set(super_admin_perm_names) != set(standardized_permissions):
            missing = set(standardized_permissions) - super_admin_perm_names
            print(f"   ❌ Super Admin role missing permissions: {missing}")
            return False
        
        print(f"   ✅ Super Admin role has all {len(super_admin_permissions)} permissions")
        
        # Validate other roles have valid permissions
        for role in roles:
            role_permissions = session.exec(
                select(Permission)
                .join(RolePermission)
                .where(RolePermission.role_id == role.id)
            ).all()
            
            invalid_permissions = []
            for perm in role_permissions:
                if perm.name not in standardized_permissions:
                    invalid_permissions.append(perm.name)
            
            if invalid_permissions:
                print(f"   ❌ Role '{role.name}' has invalid permissions: {invalid_permissions}")
                return False
        
        print("   ✅ All roles have valid standardized permissions")
        return True


async def validate_database_integrity():
    """Validate database integrity and relationships"""
    print("🔍 Validating database integrity...")
    
    with Session(engine) as session:
        # Check for orphaned role permissions
        orphaned_role_perms = session.exec(
            select(RolePermission)
            .outerjoin(Role, RolePermission.role_id == Role.id)
            .outerjoin(Permission, RolePermission.permission_id == Permission.id)
            .where((Role.id == None) | (Permission.id == None))
        ).all()
        
        if orphaned_role_perms:
            print(f"   ❌ Found {len(orphaned_role_perms)} orphaned role permissions")
            return False
        
        # Check for orphaned inspector roles
        orphaned_inspector_roles = session.exec(
            select(InspectorRole)
            .outerjoin(Inspector, InspectorRole.inspector_id == Inspector.id)
            .outerjoin(Role, InspectorRole.role_id == Role.id)
            .where((Inspector.id == None) | (Role.id == None))
        ).all()
        
        if orphaned_inspector_roles:
            print(f"   ❌ Found {len(orphaned_inspector_roles)} orphaned inspector roles")
            return False
        
        print("   ✅ Database integrity validated successfully")
        return True


async def main():
    """Main validation function"""
    print("🔍 VALIDATING STANDARDIZED RBAC SYSTEM")
    print("=" * 50)
    
    try:
        # Run all validations
        validations = [
            validate_permissions(),
            validate_super_admin(),
            validate_roles(),
            validate_database_integrity()
        ]
        
        results = await asyncio.gather(*validations)
        
        if all(results):
            print("\n" + "🎉" * 15)
            print("✅ ALL VALIDATIONS PASSED!")
            print("🎉" * 15)
            print("\n📊 System Status:")
            print("   ✅ 23 standardized permissions validated")
            print("   ✅ Super admin user configured correctly")
            print("   ✅ All roles have valid permissions")
            print("   ✅ Database integrity confirmed")
            print("\n🚀 Standardized RBAC system is ready for use!")
            print("=" * 50)
        else:
            print("\n❌ VALIDATION FAILED!")
            print("Please check the errors above and run the seeding script again.")
            sys.exit(1)
            
    except Exception as e:
        print(f"❌ Error during validation: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)


if __name__ == "__main__":
    asyncio.run(main())