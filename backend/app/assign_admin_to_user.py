#!/usr/bin/env python3
"""
Script to assign admin role to a specific user.
This script will assign the admin role to user ID 1 who is currently logged in.
"""

import requests
import sys

# Configuration
BASE_URL = "http://localhost:8000/api/v1"
USER_ID = 1  # The user ID from the debug log
ADMIN_USERNAME = "admin"  # You can change this if needed
ADMIN_PASSWORD = "admin"  # You can change this if needed

def get_admin_token():
    """Get admin token for API calls"""
    url = f"{BASE_URL}/auth/login"
    data = {"username": ADMIN_USERNAME, "password": ADMIN_PASSWORD}
    
    try:
        response = requests.post(url, data=data)
        response.raise_for_status()
        token = response.json()["access_token"]
        print(f"✅ Successfully logged in as {ADMIN_USERNAME}")
        return token
    except requests.exceptions.RequestException as e:
        print(f"❌ Failed to login as {ADMIN_USERNAME}: {e}")
        if hasattr(e, 'response') and e.response is not None:
            print(f"Response: {e.response.status_code} - {e.response.text}")
        return None

def get_admin_role_id(token):
    """Get the admin role ID from the database"""
    url = f"{BASE_URL}/admin/roles"
    headers = {"Authorization": f"Bearer {token}"}
    
    try:
        response = requests.get(url, headers=headers)
        response.raise_for_status()
        roles = response.json()
        print(f"Available roles: {[role['name'] for role in roles]}")
        
        # Look for admin role (case insensitive)
        for role in roles:
            if role["name"].lower() == "admin":
                print(f"✅ Found admin role with ID: {role['id']}")
                return role["id"]
        
        print("❌ Admin role not found in database")
        return None
    except requests.exceptions.RequestException as e:
        print(f"❌ Failed to fetch roles: {e}")
        if hasattr(e, 'response') and e.response is not None:
            print(f"Response: {e.response.status_code} - {e.response.text}")
        return None

def assign_admin_role(token, user_id, role_id):
    """Assign admin role to the specified user"""
    url = f"{BASE_URL}/inspectors/{user_id}/roles"
    headers = {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}
    data = {"role_id": role_id}
    
    try:
        response = requests.post(url, json=data, headers=headers)
        
        if response.status_code == 201:
            print(f"✅ Admin role successfully assigned to user ID {user_id}")
            return True
        elif response.status_code == 400 and "already assigned" in response.text.lower():
            print(f"ℹ️ User ID {user_id} already has admin role assigned")
            return True
        else:
            print(f"❌ Failed to assign admin role: {response.status_code} - {response.text}")
            return False
    except requests.exceptions.RequestException as e:
        print(f"❌ Failed to assign admin role: {e}")
        if hasattr(e, 'response') and e.response is not None:
            print(f"Response: {e.response.status_code} - {e.response.text}")
        return False

def get_user_info(token, user_id):
    """Get user information to verify the assignment"""
    url = f"{BASE_URL}/inspectors/{user_id}"
    headers = {"Authorization": f"Bearer {token}"}
    
    try:
        response = requests.get(url, headers=headers)
        response.raise_for_status()
        user = response.json()
        print(f"✅ User found: {user.get('name', 'N/A')} (Username: {user.get('username', 'N/A')})")
        if 'roles' in user:
            print(f"Current roles: {[role['name'] for role in user['roles']]}")
        return user
    except requests.exceptions.RequestException as e:
        print(f"❌ Failed to get user info: {e}")
        if hasattr(e, 'response') and e.response is not None:
            print(f"Response: {e.response.status_code} - {e.response.text}")
        return None

def verify_role_assignment(token, user_id):
    """Verify that the role was assigned successfully"""
    user = get_user_info(token, user_id)
    if user and 'roles' in user:
        admin_roles = [role for role in user['roles'] if role['name'].lower() == 'admin']
        if admin_roles:
            print(f"✅ Admin role is properly assigned to user {user_id}")
            return True
        else:
            print(f"❌ Admin role is NOT assigned to user {user_id}")
            return False
    return False

def main():
    """Main function to assign admin role"""
    print(f"🔧 Assigning admin role to user ID: {USER_ID}")
    print("-" * 50)
    
    # Step 1: Get admin token
    token = get_admin_token()
    if not token:
        sys.exit(1)
    
    # Step 2: Verify user exists
    user = get_user_info(token, USER_ID)
    if not user:
        print(f"❌ User with ID {USER_ID} not found")
        sys.exit(1)
    
    # Step 3: Get admin role ID
    role_id = get_admin_role_id(token)
    if not role_id:
        sys.exit(1)
    
    # Step 4: Assign admin role
    success = assign_admin_role(token, USER_ID, role_id)
    
    if success:
        # Step 5: Verify assignment
        print("-" * 50)
        print("🔍 Verifying role assignment...")
        if verify_role_assignment(token, USER_ID):
            print("-" * 50)
            print("🎉 Admin role assignment completed successfully!")
            print("💡 Please refresh your browser and try approving the maintenance event again.")
        else:
            print("-" * 50)
            print("❌ Role assignment verification failed!")
            sys.exit(1)
    else:
        print("-" * 50)
        print("❌ Admin role assignment failed!")
        sys.exit(1)

if __name__ == "__main__":
    main()