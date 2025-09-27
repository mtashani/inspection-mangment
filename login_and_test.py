#!/usr/bin/env python3
"""
Login and test permissions API endpoint
"""

import requests
import json

def login_and_test():
    base_url = "http://localhost:8000"
    
    print("🔐 Logging in as admin...")
    
    # Login to get fresh token
    login_url = f"{base_url}/api/v1/auth/login"
    login_data = {
        "username": "admin",
        "password": "admin123"
    }
    
    try:
        # Use form data instead of JSON
        login_response = requests.post(login_url, data=login_data)
        print(f"📊 Login response: {login_response.status_code}")
        
        if login_response.status_code == 200:
            login_result = login_response.json()
            print("✅ Login successful!")
            
            # Extract token
            token = login_result.get('access_token')
            if not token:
                print("❌ No access_token in login response")
                print(f"📄 Login response: {json.dumps(login_result, indent=2)}")
                return
                
            print(f"🎫 Got token: {token[:20]}...")
            
            # Test permissions API
            test_url = f"{base_url}/api/v1/admin/permissions/test-bulk"
            headers = {
                "Authorization": f"Bearer {token}",
                "Content-Type": "application/json"
            }
            
            print("🧪 Testing permissions test-bulk API...")
            test_response = requests.get(test_url, headers=headers)
            print(f"📊 Test API response: {test_response.status_code}")
            
            if test_response.status_code == 200:
                print("✅ Test endpoint works!")
                
                # Now test the real bulk-usage endpoint
                permissions_url = f"{base_url}/api/v1/admin/permissions-usage/bulk-stats"
                print("🧪 Testing permissions bulk-usage API...")
                permissions_response = requests.get(permissions_url, headers=headers)
                print(f"📊 Bulk-usage API response: {permissions_response.status_code}")
            else:
                print(f"❌ Test endpoint failed: {test_response.status_code}")
                permissions_response = test_response  # For error handling
            
            if permissions_response.status_code == 200:
                data = permissions_response.json()
                print("✅ Permissions API call successful!")
                print(f"📋 Response data keys: {list(data.keys())}")
                
                if 'usage_stats' in data:
                    usage_stats = data['usage_stats']
                    print(f"📊 Usage stats count: {len(usage_stats)}")
                    
                    if usage_stats:
                        # Show sample data
                        sample_key = list(usage_stats.keys())[0]
                        sample_data = usage_stats[sample_key]
                        print(f"📝 Sample usage stat for permission {sample_key}:")
                        print(f"   - Permission: {sample_data.get('permission_name', 'N/A')}")
                        print(f"   - Roles: {sample_data.get('roles_count', 0)}")
                        print(f"   - Users: {sample_data.get('inspectors_count', 0)}")
                        print(f"   - Usage: {sample_data.get('usage_percentage', 0)}%")
                    else:
                        print("⚠️ No usage stats found")
                        
                else:
                    print("❌ 'usage_stats' key not found in response")
                    print(f"📄 Available keys: {list(data.keys())}")
                    
            else:
                print(f"❌ Permissions API failed: {permissions_response.status_code}")
                try:
                    error_data = permissions_response.json()
                    print(f"📄 Error: {json.dumps(error_data, indent=2)}")
                except:
                    print(f"📄 Raw error: {permissions_response.text}")
                    
        else:
            print(f"❌ Login failed: {login_response.status_code}")
            try:
                error_data = login_response.json()
                print(f"📄 Login error: {json.dumps(error_data, indent=2)}")
            except:
                print(f"📄 Raw login error: {login_response.text}")
                
    except requests.exceptions.ConnectionError:
        print("❌ Connection failed - is the backend running on port 8000?")
    except Exception as e:
        print(f"❌ Unexpected error: {e}")

if __name__ == "__main__":
    login_and_test()