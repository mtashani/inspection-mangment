#!/usr/bin/env python3
"""
Simple script to create default roles and assign admin role to user
"""

import sqlite3
import os

def create_roles_and_assign():
    """Create default roles and assign admin role"""
    
    # Database path
    db_path = "backend/inspection_management.db"
    if not os.path.exists(db_path):
        print("❌ Database file not found")
        return False
    
    try:
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        
        print("🔧 Creating default roles...")
        
        # Create default roles
        default_roles = [
            (1, 'Admin', 'Administrator with full access'),
            (2, 'PSVInspector', 'Inspector for pressure safety valves'),
            (3, 'CorrosionInspector', 'Inspector for corrosion monitoring'),
            (4, 'PSVApprover', 'Can approve PSV calibration reports'),
            (5, 'CorrosionApprover', 'Can approve corrosion analysis reports'),
            (6, 'LiftingEquipmentOperator', 'Operator for lifting equipment tests'),
            (7, 'PSVOperator', 'Operator for PSV tests')
        ]
        
        for role_id, name, description in default_roles:
            try:
                cursor.execute("""
                    INSERT OR IGNORE INTO roles (id, name, description, created_at, updated_at) 
                    VALUES (?, ?, ?, datetime('now'), datetime('now'))
                """, (role_id, name, description))
                print(f"✅ Created role: {name}")
            except Exception as e:
                print(f"⚠️ Role {name} might already exist: {e}")
        
        # Commit role creation
        conn.commit()
        
        # Find admin user (ID = 1)
        cursor.execute("SELECT id, username FROM inspectors WHERE id = 1")
        user = cursor.fetchone()
        
        if not user:
            print("❌ Admin user (ID=1) not found")
            return False
        
        print(f"✅ Found admin user: ID={user[0]}, Username={user[1]}")
        
        # Find admin role
        cursor.execute("SELECT id, name FROM roles WHERE LOWER(name) = 'admin'")
        admin_role = cursor.fetchone()
        
        if not admin_role:
            print("❌ Admin role not found")
            return False
        
        print(f"✅ Found admin role: ID={admin_role[0]}, Name={admin_role[1]}")
        
        # Check if role assignment already exists
        cursor.execute("""
            SELECT * FROM inspector_roles 
            WHERE inspector_id = ? AND role_id = ?
        """, (user[0], admin_role[0]))
        
        existing = cursor.fetchone()
        if existing:
            print(f"ℹ️ Admin role already assigned to user {user[0]}")
        else:
            # Assign admin role to user
            cursor.execute("""
                INSERT INTO inspector_roles (inspector_id, role_id, created_at) 
                VALUES (?, ?, datetime('now'))
            """, (user[0], admin_role[0]))
            
            conn.commit()
            print(f"✅ Successfully assigned admin role to user {user[0]}")
        
        # Verify assignment
        cursor.execute("""
            SELECT r.name 
            FROM roles r 
            JOIN inspector_roles ir ON r.id = ir.role_id 
            WHERE ir.inspector_id = ?
        """, (user[0],))
        
        user_roles = cursor.fetchall()
        print(f"✅ User {user[0]} now has roles: {[role[0] for role in user_roles]}")
        
        return True
        
    except Exception as e:
        print(f"❌ Error: {e}")
        return False
    finally:
        if 'conn' in locals():
            conn.close()

def main():
    """Main function"""
    print("🔧 Creating Default Roles and Assigning Admin")
    print("=" * 50)
    
    if create_roles_and_assign():
        print("\n" + "=" * 50)
        print("🎉 Role creation and assignment completed successfully!")
        print("💡 Please refresh your browser and try approving the maintenance event again.")
        print("💡 You should now see the 'Approve Event' button instead of 'Waiting for Approval'.")
    else:
        print("\n" + "=" * 50)
        print("❌ Role creation and assignment failed!")

if __name__ == "__main__":
    main()