#!/usr/bin/env python3
"""
Working script to assign admin role using available API endpoints
"""

import requests
import sys

BASE_URL = "http://localhost:8000/api/v1"
ADMIN_USERNAME = "admin"
ADMIN_PASSWORD = "admin"

def get_token():
    """Get token"""
    url = f"{BASE_URL}/auth/login"
    data = {"username": ADMIN_USERNAME, "password": ADMIN_PASSWORD}
    
    try:
        response = requests.post(url, data=data)
        response.raise_for_status()
        token = response.json()["access_token"]
        print(f"✅ Successfully logged in as {ADMIN_USERNAME}")
        return token
    except Exception as e:
        print(f"❌ Failed to login: {e}")
        return None

def find_user_by_username(token, username):
    """Find user by username in the inspectors list"""
    url = f"{BASE_URL}/inspectors"
    headers = {"Authorization": f"Bearer {token}"}
    
    try:
        response = requests.get(url, headers=headers)
        response.raise_for_status()
        inspectors = response.json()
        
        print(f"📋 Found {len(inspectors)} inspectors:")
        for inspector in inspectors:
            print(f"  - ID: {inspector.get('id')}, Username: {inspector.get('username')}, Name: {inspector.get('name')}")
            if inspector.get('username') == username:
                print(f"✅ Found target user: {inspector}")
                return inspector
        
        print(f"❌ User with username '{username}' not found")
        return None
        
    except Exception as e:
        print(f"❌ Failed to get inspectors: {e}")
        return None

def try_direct_db_approach():
    """Try direct database approach since API endpoints are limited"""
    print("🔧 Trying direct database approach...")
    
    try:
        # Try to use sqlite directly since we can see there are .db files
        import sqlite3
        import os
        
        # Look for database file
        db_paths = [
            "backend/inspection_management.db",
            "backend/test_notifications.db"
        ]
        
        db_path = None
        for path in db_paths:
            if os.path.exists(path):
                db_path = path
                break
        
        if not db_path:
            print("❌ Could not find database file")
            return False
        
        print(f"✅ Found database: {db_path}")
        
        # Connect to database
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        
        # Check tables
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table';")
        tables = cursor.fetchall()
        print(f"📋 Available tables: {[table[0] for table in tables]}")
        
        # Check if we have the required tables
        table_names = [table[0] for table in tables]
        if 'inspectors' not in table_names:
            print("❌ No inspectors table found")
            return False
        
        if 'roles' not in table_names:
            print("❌ No roles table found")
            return False
            
        # Find user with username 'admin'
        cursor.execute("SELECT * FROM inspectors WHERE username = ?", ("admin",))
        user = cursor.fetchone()
        
        if not user:
            print("❌ User 'admin' not found in database")
            return False
            
        # Get column names for user
        cursor.execute("PRAGMA table_info(inspectors)")
        user_columns = [column[1] for column in cursor.fetchall()]
        user_dict = dict(zip(user_columns, user))
        print(f"✅ Found user: {user_dict}")
        
        user_id = user_dict['id']
        
        # Find admin role
        cursor.execute("SELECT * FROM roles WHERE LOWER(name) LIKE '%admin%'")
        role = cursor.fetchone()
        
        if not role:
            print("❌ Admin role not found")
            # List all roles
            cursor.execute("SELECT * FROM roles")
            all_roles = cursor.fetchall()
            cursor.execute("PRAGMA table_info(roles)")
            role_columns = [column[1] for column in cursor.fetchall()]
            print("Available roles:")
            for r in all_roles:
                role_dict = dict(zip(role_columns, r))
                print(f"  - {role_dict}")
            return False
        
        # Get column names for role
        cursor.execute("PRAGMA table_info(roles)")
        role_columns = [column[1] for column in cursor.fetchall()]
        role_dict = dict(zip(role_columns, role))
        print(f"✅ Found admin role: {role_dict}")
        
        role_id = role_dict['id']
        
        # Check if role is already assigned
        if 'inspector_roles' in table_names:
            cursor.execute("SELECT * FROM inspector_roles WHERE inspector_id = ? AND role_id = ?", (user_id, role_id))
            existing = cursor.fetchone()
            
            if existing:
                print(f"ℹ️ Admin role already assigned to user {user_id}")
                return True
            
            # Assign the role
            cursor.execute("INSERT INTO inspector_roles (inspector_id, role_id, created_at) VALUES (?, ?, datetime('now'))", (user_id, role_id))
            conn.commit()
            
            print(f"✅ Successfully assigned admin role to user {user_id}")
            
            # Verify assignment
            cursor.execute("SELECT * FROM inspector_roles WHERE inspector_id = ? AND role_id = ?", (user_id, role_id))
            verification = cursor.fetchone()
            if verification:
                print(f"✅ Role assignment verified!")
                return True
            else:
                print(f"❌ Role assignment verification failed")
                return False
        else:
            print("❌ No inspector_roles table found")
            return False
            
    except ImportError:
        print("❌ sqlite3 module not available")
        return False
    except Exception as e:
        print(f"❌ Database error: {e}")
        return False
    finally:
        if 'conn' in locals():
            conn.close()

def main():
    """Main function"""
    print("🔧 Admin Role Assignment Tool")
    print("=" * 50)
    
    # Try API approach first
    token = get_token()
    if token:
        user = find_user_by_username(token, "admin")
        if user:
            print("📋 User found via API, but role assignment endpoints are not available")
    
    # Try direct database approach
    print("\n" + "=" * 50)
    if try_direct_db_approach():
        print("\n" + "=" * 50)
        print("🎉 Admin role assignment completed successfully!")
        print("💡 Please refresh your browser and try approving the maintenance event again.")
    else:
        print("\n" + "=" * 50)
        print("❌ Admin role assignment failed!")
        sys.exit(1)

if __name__ == "__main__":
    main()