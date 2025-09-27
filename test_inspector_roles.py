#!/usr/bin/env python3
"""
Test script to verify the inspector roles API endpoint
"""

import requests
import json

def test_inspector_roles():
    print("🧪 Testing inspector roles API endpoint...")
    
    # Login first
    print("🔐 Logging in as admin...")
    login_data = {
        'username': 'admin',
        'password': 'admin123'
    }
    
    try:
        login_response = requests.post("http://localhost:8000/api/v1/auth/login", data=login_data)
        print(f"📊 Login response: {login_response.status_code}")
        
        if login_response.status_code != 200:
            print("❌ Login failed")
            return
        
        token_data = login_response.json()
        token = token_data.get('access_token')
        print("✅ Login successful!")
        
        # Test inspector roles endpoint
        headers = {
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json"
        }
        
        # Try inspector ID 1
        inspector_id = 1
        url = f"http://localhost:8000/api/v1/admin/inspectors/{inspector_id}/roles"
        
        print(f"📡 Testing: {url}")
        response = requests.get(url, headers=headers)
        print(f"📊 Response: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print("✅ API call successful!")
            print(f"📋 Inspector: {data['inspector_name']}")
            print(f"📋 Roles count: {len(data['roles'])}")
            
            for role in data['roles']:
                print(f"  - Role: {role['name']} ({role.get('display_label', 'No label')})")
                print(f"    Permissions: {len(role.get('permissions', []))} permissions")
                if role.get('permissions'):
                    print(f"    Sample permissions: {role['permissions'][:3]}...")
        else:
            error_text = response.text
            print(f"❌ API call failed: {response.status_code}")
            print(f"📄 Error response: {error_text}")
                
    except requests.exceptions.ConnectionError:
        print("❌ Connection failed - is the backend running on port 8000?")
    except Exception as e:
        print(f"❌ Unexpected error: {e}")

if __name__ == "__main__":
    test_inspector_roles()