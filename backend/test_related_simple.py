#!/usr/bin/env python3
"""
Simple test for related records endpoint
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

def test_related_records():
    """Test related records endpoint"""
    token = get_auth_token()
    if not token:
        print("❌ Authentication failed")
        return
    
    headers = {
        "Authorization": f"Bearer {token}",
        "Accept": "application/json"
    }
    
    # Test with inspector 1 (admin - likely has roles)
    print("🧪 Testing related records for inspector 1...")
    response = requests.get("http://localhost:8000/api/v1/inspectors/1/related-records", headers=headers)
    
    print(f"Status: {response.status_code}")
    try:
        import json
        data = response.json()
        print(f"Total related records: {data.get('total_related_records', 'N/A')}")
        print(f"Can delete safely: {data.get('can_delete_safely', 'N/A')}")
        if 'related_records' in data:
            for record_type, info in data['related_records'].items():
                print(f"  {record_type}: {info['count']} records")
    except:
        print(f"Response Text: {response.text}")

if __name__ == "__main__":
    test_related_records()