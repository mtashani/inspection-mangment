#!/usr/bin/env python3
"""
Direct database script to assign admin role to user ID 1.
This bypasses the API and works directly with the database.
"""

import sys
import os

# Add the backend directory to the path
backend_path = os.path.dirname(os.path.abspath(__file__))
if backend_path not in sys.path:
    sys.path.insert(0, backend_path)

try:
    from sqlmodel import Session, select
    from app.database import get_session
    from app.domains.inspector.models.inspector import Inspector
    from app.domains.inspector.models.authorization import Role, InspectorRole
    print("✅ Successfully imported database modules")
except ImportError as e:
    print(f"❌ Failed to import modules: {e}")
    print("💡 Make sure you're running this from the backend directory")
    sys.exit(1)

def assign_admin_role_direct():
    """Assign admin role directly via database"""
    user_id = 1
    
    try:
        # Get database session
        session_gen = get_session()
        session = next(session_gen)
        
        # Find the user
        user = session.get(Inspector, user_id)
        if not user:
            print(f"❌ User with ID {user_id} not found")
            return False
        
        print(f"✅ Found user: {user.first_name} {user.last_name} (Username: {user.username})")
        
        # Find the admin role
        admin_role = session.exec(select(Role).where(Role.name.ilike("%admin%"))).first()
        if not admin_role:
            print("❌ Admin role not found")
            # Let's list all available roles
            all_roles = session.exec(select(Role)).all()
            print(f"Available roles: {[role.name for role in all_roles]}")
            return False
        
        print(f"✅ Found admin role: {admin_role.name} (ID: {admin_role.id})")
        
        # Check if role is already assigned
        existing_assignment = session.exec(
            select(InspectorRole).where(
                InspectorRole.inspector_id == user_id,
                InspectorRole.role_id == admin_role.id
            )
        ).first()
        
        if existing_assignment:
            print(f"ℹ️ Admin role is already assigned to user {user_id}")
            return True
        
        # Assign the role
        inspector_role = InspectorRole(
            inspector_id=user_id,
            role_id=admin_role.id
        )
        
        session.add(inspector_role)
        session.commit()
        
        print(f"✅ Successfully assigned admin role to user {user_id}")
        return True
        
    except Exception as e:
        print(f"❌ Error assigning admin role: {e}")
        if 'session' in locals():
            session.rollback()
        return False
    finally:
        if 'session' in locals():
            session.close()

def verify_assignment():
    """Verify that the role assignment worked"""
    user_id = 1
    
    try:
        session_gen = get_session()
        session = next(session_gen)
        
        # Get user with roles
        user = session.get(Inspector, user_id)
        if not user:
            print(f"❌ User {user_id} not found")
            return False
        
        # Get user's roles
        user_roles = session.exec(
            select(Role)
            .join(InspectorRole, InspectorRole.role_id == Role.id)
            .where(InspectorRole.inspector_id == user_id)
        ).all()
        
        print(f"User {user_id} roles: {[role.name for role in user_roles]}")
        
        # Check if admin role is present
        admin_roles = [role for role in user_roles if "admin" in role.name.lower()]
        if admin_roles:
            print(f"✅ User {user_id} has admin role(s): {[role.name for role in admin_roles]}")
            return True
        else:
            print(f"❌ User {user_id} does not have admin role")
            return False
            
    except Exception as e:
        print(f"❌ Error verifying role assignment: {e}")
        return False
    finally:
        if 'session' in locals():
            session.close()

def main():
    """Main function"""
    print("🔧 Direct Database Admin Role Assignment")
    print("=" * 50)
    
    # Step 1: Assign admin role
    if assign_admin_role_direct():
        print("\\n🔍 Verifying assignment...")
        
        # Step 2: Verify assignment
        if verify_assignment():
            print("\\n" + "=" * 50)
            print("🎉 Admin role assignment completed successfully!")
            print("💡 Please refresh your browser and try approving the maintenance event again.")
        else:
            print("\\n" + "=" * 50)
            print("❌ Role assignment verification failed!")
            sys.exit(1)
    else:
        print("\\n" + "=" * 50)
        print("❌ Admin role assignment failed!")
        sys.exit(1)

if __name__ == "__main__":
    main()