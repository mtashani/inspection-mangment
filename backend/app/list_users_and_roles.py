#!/usr/bin/env python3
"""
Script to list all inspectors and find which user needs admin role.
"""

import requests
import sys

# Configuration
BASE_URL = "http://localhost:8000/api/v1"
ADMIN_USERNAME = "admin"
ADMIN_PASSWORD = "admin"

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

def list_inspectors(token):
    """List all inspectors"""
    url = f"{BASE_URL}/admin/inspectors"
    headers = {"Authorization": f"Bearer {token}"}
    
    try:
        response = requests.get(url, headers=headers)
        response.raise_for_status()
        inspectors = response.json()
        
        print(f"Found {len(inspectors)} inspectors:")
        print("-" * 80)
        for inspector in inspectors:
            print(f"ID: {inspector.get('id', 'N/A')}")
            print(f"Name: {inspector.get('name', 'N/A')}")
            print(f"Username: {inspector.get('username', 'N/A')}")
            print(f"Employee ID: {inspector.get('employee_id', 'N/A')}")
            print(f"Email: {inspector.get('email', 'N/A')}")
            print(f"Can Login: {inspector.get('can_login', 'N/A')}")
            print(f"Active: {inspector.get('active', 'N/A')}")
            print("-" * 40)
        
        return inspectors
    except requests.exceptions.RequestException as e:
        print(f"❌ Failed to fetch inspectors: {e}")
        if hasattr(e, 'response') and e.response is not None:
            print(f"Response: {e.response.status_code} - {e.response.text}")
        return None

def check_current_user(token):
    """Check current user info"""
    url = f"{BASE_URL}/auth/me"
    headers = {"Authorization": f"Bearer {token}"}
    
    try:
        response = requests.get(url, headers=headers)
        response.raise_for_status()
        user = response.json()
        
        print("Current logged in user:")
        print("-" * 40)
        print(f"ID: {user.get('id', 'N/A')}")
        print(f"Name: {user.get('name', 'N/A')}")
        print(f"Username: {user.get('username', 'N/A')}")
        print(f"Roles: {user.get('roles', [])}")
        print("-" * 40)
        
        return user
    except requests.exceptions.RequestException as e:
        print(f"❌ Failed to get current user info: {e}")
        if hasattr(e, 'response') and e.response is not None:
            print(f"Response: {e.response.status_code} - {e.response.text}")
        return None

def list_roles(token):
    """List all available roles"""
    url = f"{BASE_URL}/admin/roles"
    headers = {"Authorization": f"Bearer {token}"}
    
    try:
        response = requests.get(url, headers=headers)
        response.raise_for_status()
        roles = response.json()
        
        print(f"Found {len(roles)} roles:")
        print("-" * 40)
        for role in roles:
            print(f"ID: {role.get('id', 'N/A')}")
            print(f"Name: {role.get('name', 'N/A')}")
            print(f"Description: {role.get('description', 'N/A')}")
            print("-" * 20)
        
        return roles
    except requests.exceptions.RequestException as e:
        print(f"❌ Failed to fetch roles: {e}")
        if hasattr(e, 'response') and e.response is not None:
            print(f"Response: {e.response.status_code} - {e.response.text}")
        return None

def main():
    """Main function to list users and roles"""
    print("🔍 Inspecting user and role data...")
    print("=" * 80)
    
    # Step 1: Get admin token
    token = get_admin_token()
    if not token:
        sys.exit(1)
    
    # Step 2: Check current user
    print("\n📱 Current User Info:")
    current_user = check_current_user(token)
    
    # Step 3: List all inspectors
    print("\n👥 All Inspectors:")
    inspectors = list_inspectors(token)
    
    # Step 4: List all roles
    print("\n🎭 All Roles:")
    roles = list_roles(token)
    
    print("\n" + "=" * 80)
    print("💡 Use the ID of the user you want to assign admin role to")
    print("💡 Run: python assign_admin_to_user.py after updating USER_ID")

if __name__ == "__main__":
    main()