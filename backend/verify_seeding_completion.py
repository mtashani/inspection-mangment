#!/usr/bin/env python3
"""
Verify Seeding Completion Script
This script verifies that all seeding operations completed correctly
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


class SeedingVerifier:
    """Verifies that seeding completed correctly"""
    
    def __init__(self):
        self.errors = []
        self.warnings = []
        self.success_count = 0
        
    def add_error(self, message: str):
        """Add an error message"""
        self.errors.append(message)
        print(f"❌ ERROR: {message}")
        
    def add_warning(self, message: str):
        """Add a warning message"""
        self.warnings.append(message)
        print(f"⚠️  WARNING: {message}")
        
    def add_success(self, message: str):
        """Add a success message"""
        self.success_count += 1
        print(f"✅ {message}")
    
    def verify_permissions(self, session: Session) -> bool:
        """Verify all standardized permissions exist"""
        print("🔍 Verifying permissions...")
        
        # Get all permissions from database
        db_permissions = session.exec(select(Permission)).all()
        db_permission_names = {perm.name for perm in db_permissions}
        
        # Get standardized permissions
        standardized_permissions = set(get_all_standardized_permissions())
        
        # Check count
        if len(db_permissions) != 23:
            self.add_error(f"Expected 23 permissions, found {len(db_permissions)}")
            return False
        
        # Check if all standardized permissions exist
        missing_permissions = standardized_permissions - db_permission_names
        if missing_permissions:
            self.add_error(f"Missing permissions: {missing_permissions}")
            return False
        
        # Check for extra permissions
        extra_permissions = db_permission_names - standardized_permissions
        if extra_permissions:
            self.add_warning(f"Extra permissions (not standardized): {extra_permissions}")
        
        # Verify permission metadata
        for perm in db_permissions:
            if perm.name in PERMISSION_DEFINITIONS:
                expected = PERMISSION_DEFINITIONS[perm.name]
                
                if perm.category != expected['category']:
                    self.add_error(f"Permission {perm.name} has wrong category: {perm.category} != {expected['category']}")
                    return False
                    
                if perm.domain != expected['domain']:
                    self.add_error(f"Permission {perm.name} has wrong domain: {perm.domain} != {expected['domain']}")
                    return False
                    
                if not perm.is_active:
                    self.add_error(f"Permission {perm.name} is not active")
                    return False
        
        self.add_success(f"All {len(db_permissions)} permissions verified successfully")
        return True
    
    def verify_roles(self, session: Session) -> bool:
        """Verify roles exist and have correct permissions"""
        print("🔍 Verifying roles...")
        
        roles = session.exec(select(Role)).all()
        
        if len(roles) < 10:  # Should have at least 10 roles
            self.add_error(f"Expected at least 10 roles, found {len(roles)}")
            return False
        
        # Check for Super Admin role
        super_admin_role = session.exec(
            select(Role).where(Role.name == "Super Admin")
        ).first()
        
        if not super_admin_role:
            self.add_error("Super Admin role not found")
            return False
        
        # Check Super Admin permissions
        super_admin_permissions = session.exec(
            select(Permission)
            .join(RolePermission)
            .where(RolePermission.role_id == super_admin_role.id)
        ).all()
        
        standardized_permissions = get_all_standardized_permissions()
        super_admin_perm_names = {perm.name for perm in super_admin_permissions}
        
        if set(super_admin_perm_names) != set(standardized_permissions):
            missing = set(standardized_permissions) - super_admin_perm_names
            self.add_error(f"Super Admin missing permissions: {missing}")
            return False
        
        self.add_success(f"All {len(roles)} roles verified successfully")
        self.add_success(f"Super Admin has all {len(super_admin_permissions)} permissions")
        return True
    
    def verify_super_admin_user(self, session: Session) -> bool:
        """Verify super admin user exists and is configured correctly"""
        print("🔍 Verifying super admin user...")
        
        # Find super admin user
        super_admin = session.exec(
            select(Inspector).where(Inspector.username == "admin")
        ).first()
        
        if not super_admin:
            self.add_error("Super admin user not found")
            return False
        
        # Check basic properties
        if not super_admin.active:
            self.add_error("Super admin user is not active")
            return False
            
        if not super_admin.can_login:
            self.add_error("Super admin user cannot login")
            return False
            
        if not super_admin.password_hash:
            self.add_error("Super admin user has no password hash")
            return False
        
        # Check role assignment
        inspector_roles = session.exec(
            select(InspectorRole).where(InspectorRole.inspector_id == super_admin.id)
        ).all()
        
        if not inspector_roles:
            self.add_error("Super admin user has no roles assigned")
            return False
        
        # Check if has Super Admin role
        has_super_admin_role = False
        for inspector_role in inspector_roles:
            role = session.exec(
                select(Role).where(Role.id == inspector_role.role_id)
            ).first()
            if role and role.name == "Super Admin":
                has_super_admin_role = True
                break
        
        if not has_super_admin_role:
            self.add_error("Super admin user does not have Super Admin role")
            return False
        
        self.add_success(f"Super admin user '{super_admin.username}' verified successfully")
        return True
    
    async def verify_permission_service(self, session: Session) -> bool:
        """Verify permission service works correctly"""
        print("🔍 Verifying permission service...")
        
        # Find super admin
        super_admin = session.exec(
            select(Inspector).where(Inspector.username == "admin")
        ).first()
        
        if not super_admin:
            self.add_error("Cannot test permission service - no super admin user")
            return False
        
        # Test system_superadmin permission
        has_superadmin = await PermissionService.has_system_superadmin(
            session, super_admin.id
        )
        
        if not has_superadmin:
            self.add_error("Permission service: Super admin does not have system_superadmin permission")
            return False
        
        # Test domain permissions
        test_permissions = [
            "mechanical_view",
            "ndt_edit", 
            "corrosion_approve",
            "system_hr_manage"
        ]
        
        for permission in test_permissions:
            has_permission = await PermissionService.check_inspector_permission(
                session, super_admin.id, permission
            )
            
            if not has_permission:
                self.add_error(f"Permission service: Super admin missing permission {permission}")
                return False
        
        # Test invalid permission
        has_invalid = await PermissionService.check_inspector_permission(
            session, super_admin.id, "invalid_permission"
        )
        
        if has_invalid:
            self.add_error("Permission service: Incorrectly granted invalid permission")
            return False
        
        self.add_success("Permission service working correctly")
        return True
    
    def verify_database_integrity(self, session: Session) -> bool:
        """Verify database integrity and relationships"""
        print("🔍 Verifying database integrity...")
        
        # Check for orphaned role permissions
        orphaned_role_perms = session.exec(
            select(RolePermission)
            .outerjoin(Role, RolePermission.role_id == Role.id)
            .outerjoin(Permission, RolePermission.permission_id == Permission.id)
            .where((Role.id == None) | (Permission.id == None))
        ).all()
        
        if orphaned_role_perms:
            self.add_error(f"Found {len(orphaned_role_perms)} orphaned role permissions")
            return False
        
        # Check for orphaned inspector roles
        orphaned_inspector_roles = session.exec(
            select(InspectorRole)
            .outerjoin(Inspector, InspectorRole.inspector_id == Inspector.id)
            .outerjoin(Role, InspectorRole.role_id == Role.id)
            .where((Inspector.id == None) | (Role.id == None))
        ).all()
        
        if orphaned_inspector_roles:
            self.add_error(f"Found {len(orphaned_inspector_roles)} orphaned inspector roles")
            return False
        
        self.add_success("Database integrity verified")
        return True
    
    def print_summary(self):
        """Print verification summary"""
        print("\n" + "=" * 60)
        print("📊 SEEDING VERIFICATION SUMMARY")
        print("=" * 60)
        
        if self.errors:
            print(f"❌ ERRORS ({len(self.errors)}):")
            for error in self.errors:
                print(f"   • {error}")
            print()
        
        if self.warnings:
            print(f"⚠️  WARNINGS ({len(self.warnings)}):")
            for warning in self.warnings:
                print(f"   • {warning}")
            print()
        
        print(f"✅ SUCCESSFUL CHECKS: {self.success_count}")
        
        if self.errors:
            print("\n❌ VERIFICATION FAILED!")
            print("Please run the seeding script again or check for issues.")
        else:
            print("\n🎉 VERIFICATION PASSED!")
            print("All seeding operations completed successfully.")
        
        print("=" * 60)


async def main():
    """Main verification function"""
    print("🔍 VERIFYING SEEDING COMPLETION")
    print("=" * 50)
    
    verifier = SeedingVerifier()
    
    try:
        with Session(engine) as session:
            # Run all verifications
            results = [
                verifier.verify_permissions(session),
                verifier.verify_roles(session),
                verifier.verify_super_admin_user(session),
                await verifier.verify_permission_service(session),
                verifier.verify_database_integrity(session)
            ]
            
            # Print summary
            verifier.print_summary()
            
            # Exit with appropriate code
            if not all(results):
                sys.exit(1)
            else:
                sys.exit(0)
                
    except Exception as e:
        print(f"❌ Error during verification: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)


if __name__ == "__main__":
    asyncio.run(main())