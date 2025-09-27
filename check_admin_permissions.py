#!/usr/bin/env python3
"""
Check admin user permissions to understand RBAC system
"""

import requests
import json

BASE_URL = "http://localhost:8000/api/v1"

def login_admin():
    """Login as admin and get token"""
    url = f"{BASE_URL}/auth/login"
    data = {"username": "admin", "password": "admin123"}
    
    try:
        response = requests.post(url, data=data)
        if response.status_code == 200:
            token_data = response.json()
            print("✅ Admin login successful")
            return token_data.get('access_token')
        else:
            print(f"❌ Admin login failed: {response.status_code}")
            print(f"Response: {response.text}")
            return None
    except Exception as e:
        print(f"❌ Login error: {e}")
        return None

def check_admin_permissions(token):
    """Check what permissions admin user actually has"""
    headers = {"Authorization": f"Bearer {token}"}
    
    print("\n🔍 Checking admin permissions...")
    
    # Try to decode token to see permissions
    try:
        import jwt
        decoded = jwt.decode(token, options={"verify_signature": False})
        print("📋 Token contents:")
        print(f"  - User ID: {decoded.get('sub')}")
        print(f"  - Username: {decoded.get('username')}")
        print(f"  - Permissions: {decoded.get('permissions', [])}")
        print(f"  - Roles: {decoded.get('roles', [])}")
        return decoded
    except ImportError:
        print("⚠️ JWT library not available, checking via API calls...")
        return None

def test_api_endpoints(token):
    """Test different API endpoints to see what works"""
    headers = {"Authorization": f"Bearer {token}"}
    
    endpoints_to_test = [
        ("/inspectors", "List inspectors"),
        ("/admin/roles", "List roles"),
        ("/admin/permissions", "List permissions"),
        ("/admin/inspectors/1/roles", "Get inspector roles")
    ]
    
    print("\n🧪 Testing API endpoints:")
    
    for endpoint, description in endpoints_to_test:
        url = f"{BASE_URL}{endpoint}"
        try:
            response = requests.get(url, headers=headers)
            status = "✅" if response.status_code == 200 else "❌"
            print(f"  {status} {description}: {response.status_code}")
            if response.status_code != 200:
                error_detail = response.json().get('detail', 'Unknown error') if response.headers.get('content-type', '').startswith('application/json') else response.text[:100]
                print(f"      Error: {error_detail}")
        except Exception as e:
            print(f"  ❌ {description}: Error - {e}")

if __name__ == "__main__":
    print("🔐 RBAC System Analysis")
    print("=" * 50)
    
    # Step 1: Login
    token = login_admin()
    if not token:
        exit(1)
    
    # Step 2: Check permissions
    permissions_data = check_admin_permissions(token)
    
    # Step 3: Test endpoints
    test_api_endpoints(token)
    
    print("\n" + "=" * 50)
    print("Analysis complete!")