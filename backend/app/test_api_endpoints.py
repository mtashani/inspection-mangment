#!/usr/bin/env python3
"""
Simple script to test inspector API endpoints
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
        print(f"✅ Successfully logged in")
        return token
    except Exception as e:
        print(f"❌ Failed to login: {e}")
        return None

def test_endpoints(token):
    """Test various endpoints"""
    headers = {"Authorization": f"Bearer {token}"}
    
    endpoints_to_test = [
        "/inspectors",
        "/inspectors/1", 
        "/admin/inspectors",
        "/admin/inspectors/1",
        "/admin/roles",
        "/roles"
    ]
    
    for endpoint in endpoints_to_test:
        url = f"{BASE_URL}{endpoint}"
        try:
            response = requests.get(url, headers=headers)
            print(f"✅ {endpoint}: {response.status_code}")
            if response.status_code == 200:
                data = response.json()
                if isinstance(data, list):
                    print(f"   📋 Returns list with {len(data)} items")
                elif isinstance(data, dict):
                    print(f"   📄 Returns object with keys: {list(data.keys())}")
        except Exception as e:
            print(f"❌ {endpoint}: {e}")

def main():
    token = get_token()
    if token:
        test_endpoints(token)

if __name__ == "__main__":
    main()