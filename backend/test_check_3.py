#!/usr/bin/env python3
"""
Check inspector 3 details and relationships
"""

import requests

def get_auth_token():
    login_data = {
        "username": "admin", 
        "password": "admin123"
    }
    
    response = requests.post(
        "http://localhost:8000/api/v1/auth/login",
        data=login_data,
        headers={"Content-Type": "application/x-www-form-urlencoded"}
    )
    
    if response.status_code == 200:
        return response.json().get("access_token")
    return None

def check_inspector_3():
    """Check inspector 3 details"""
    token = get_auth_token()
    if not token:
        print("❌ Authentication failed")
        return
    
    headers = {
        "Authorization": f"Bearer {token}",
        "Accept": "application/json"
    }
    
    # Get all inspectors first
    print("📋 Getting all inspectors...")
    response = requests.get("http://localhost:8000/api/v1/inspectors/", headers=headers)
    
    if response.status_code == 200:
        inspectors = response.json()
        print(f"Found {len(inspectors)} inspectors:")
        for inspector in inspectors:
            print(f"  - ID: {inspector['id']}, Employee ID: {inspector['employee_id']}, Name: {inspector['name']}")
        
        # Check if inspector 3 exists
        inspector_3 = next((i for i in inspectors if i['id'] == 3), None)
        if inspector_3:
            print(f"\n✅ Inspector 3 exists: {inspector_3['name']} ({inspector_3['employee_id']})")
            print(f"Roles: {inspector_3.get('roles', [])}")
        else:
            print("\n❌ Inspector 3 does not exist")
    else:
        print(f"Failed to get inspectors: {response.status_code}")
    
    # Try to get inspector 3 specifically
    print(f"\n🧪 Getting inspector 3 specifically...")
    response = requests.get("http://localhost:8000/api/v1/inspectors/3", headers=headers)
    
    print(f"Status: {response.status_code}")
    try:
        print(f"Response: {response.json()}")
    except:
        print(f"Response Text: {response.text}")

if __name__ == "__main__":
    check_inspector_3()