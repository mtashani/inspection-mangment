#!/usr/bin/env python3
"""
Test force delete inspector
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

def test_force_delete():
    """Test force deleting inspector 3"""
    token = get_auth_token()
    if not token:
        print("❌ Authentication failed")
        return
    
    headers = {
        "Authorization": f"Bearer {token}",
        "Accept": "application/json"
    }
    
    print("🧪 Testing DELETE /api/v1/inspectors/3 (normal)")
    response = requests.delete("http://localhost:8000/api/v1/inspectors/3", headers=headers)
    
    print(f"Status: {response.status_code}")
    try:
        print(f"Response: {response.json()}")
    except:
        print(f"Response Text: {response.text}")
    
    print("\n🧪 Testing DELETE /api/v1/inspectors/3?force=true")
    response = requests.delete("http://localhost:8000/api/v1/inspectors/3?force=true", headers=headers)
    
    print(f"Status: {response.status_code}")
    try:
        print(f"Response: {response.json()}")
    except:
        print(f"Response Text: {response.text}")

if __name__ == "__main__":
    test_force_delete()